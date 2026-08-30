package ai.overkill.privacyguard.llm

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executor
import java.util.concurrent.Executors

class ChatOptions(
    val model: String,
    val temperature: Double = 0.7,
    val maxTokens: Int = 2048
)

interface ChatListener {
    fun onToken(text: String)
    fun onToolCall(id: String, name: String, arguments: String)
    fun onDone(finishReason: String, usage: JSONObject?)
    fun onError(error: ProviderError)
}

class ChatCall(private val cancelFn: () -> Unit) {
    fun cancel() = cancelFn()
}

class TranscribeResult(val text: String)

class GroqProvider(
    private val baseUrl: String,
    private val apiKey: String,
    private val client: OkHttpClient,
    private val retryPolicy: RetryPolicy = RetryPolicy()
) {
    private val executor: Executor = Executors.newCachedThreadPool()
    private val activeCalls = ConcurrentHashMap<String, okhttp3.Call>()

    companion object {
        private const val TRANSCRIBE_MODEL = "whisper-large-v3"
    }

    fun chat(requestId: String, messages: List<JSONObject>, options: ChatOptions, listener: ChatListener): ChatCall {
        executor.execute {
            try {
                doChat(requestId, messages, options, listener)
            } catch (e: Exception) {
                if (!activeCalls.containsKey(requestId)) return@execute
                listener.onError(ProviderErrors.fromException(e))
            }
        }
        val call = ChatCall { cancel(requestId) }
        activeCalls.putIfAbsent(requestId, DummyCall)
        return call
    }

    fun cancel(requestId: String) {
        activeCalls.remove(requestId)?.cancel()
    }

    private fun doChat(requestId: String, messages: List<JSONObject>, options: ChatOptions, listener: ChatListener) {
        var attempt = 0
        var emittedAny = false

        while (true) {
            val call = buildCall(buildChatBody(requestId, messages, options))
            activeCalls[requestId] = call
            try {
                client.newCall(call).execute().use { response ->
                    if (!response.isSuccessful) {
                        val err = ProviderErrors.fromResponse(
                            response.code,
                            response.body?.string().orEmpty(),
                            response.header("Retry-After")
                        )
                        if (!emittedAny && retryPolicy.shouldRetry(err, attempt)) {
                            Thread.sleep(retryPolicy.delayMs(attempt, err.retryAfterSeconds))
                            attempt++
                            continue
                        }
                        listener.onError(err)
                        return
                    }
                    val consumed = consumeStream(requestId, response, options, listener)
                    emittedAny = emittedAny || consumed
                    // Call succeeded fully; events were emitted by consumeStream.
                    return
                }
            } catch (e: Exception) {
                if (activeCalls[requestId]?.isCanceled() == true || !activeCalls.containsKey(requestId)) return
                val err = ProviderErrors.fromException(e)
                if (!emittedAny && retryPolicy.shouldRetry(err, attempt)) {
                    Thread.sleep(retryPolicy.delayMs(attempt, err.retryAfterSeconds))
                    attempt++
                    continue
                }
                listener.onError(err)
                return
            }
        }
    }

    /** Returns true when at least one SSE event was emitted. */
    private fun consumeStream(
        requestId: String,
        response: Response,
        options: ChatOptions,
        listener: ChatListener
    ): Boolean {
        val body = response.body ?: throw IllegalStateException("empty body")
        var emitted = false
        var finishReason: String? = null
        var usage: JSONObject? = null
        val toolCalls = LinkedHashMap<Int, AccToolCall>()

        val source = body.source()
        while (true) {
            if (activeCalls[requestId]?.isCanceled() == true) return emitted
            val line = source.readUtf8Line() ?: break
            when (val ev = SseEventParser.parse(line)) {
                is SseLine.Done -> {
                    finishReason = finishReason ?: "stop"
                    break
                }
                is SseLine.Data -> {
                    val chunk = runCatching { JSONObject(ev.json) }.getOrNull() ?: continue
                    chunk.optJSONObject("error")?.let { err ->
                        listener.onError(
                            ProviderError(
                                "bad_response",
                                err.optString("message", "stream error").take(300),
                                0,
                                retryable = false
                            )
                        )
                        return emitted
                    }
                    chunk.optJSONObject("usage")?.let { usage = it }
                    val choice = chunk.optJSONArray("choices")?.optJSONObject(0) ?: continue
                    val delta = choice.optJSONObject("delta")
                    val content = delta?.optString("content", "")
                    if (!content.isNullOrEmpty()) {
                        emitted = true
                        listener.onToken(content)
                    }
                    val toolArr = delta?.optJSONArray("tool_calls")
                    if (toolArr != null) {
                        emitted = true
                        for (i in 0 until toolArr.length()) {
                            val item = toolArr.optJSONObject(i) ?: continue
                            val index = item.optInt("index", i)
                            val acc = toolCalls.getOrPut(index) { AccToolCall() }
                            item.optString("id", "").takeIf { it.isNotBlank() }?.let { acc.id = it }
                            val fn = item.optJSONObject("function")
                            fn?.optString("name", "")?.takeIf { it.isNotBlank() }?.let { acc.name.append(it) }
                            fn?.optString("arguments", "")?.let { acc.args.append(it) }
                        }
                    }
                    choice.optString("finish_reason", "").takeIf { it.isNotBlank() }?.let { finishReason = it }
                    if (finishReason != null) break
                }
                else -> Unit
            }
        }

        for ((index, acc) in toolCalls) {
            val id = acc.id.ifBlank { "call_$index" }
            listener.onToolCall(id, acc.name.toString().ifBlank { "unknown" }, acc.args.toString().ifBlank { "{}" })
        }
        listener.onDone(finishReason ?: "stop", usage)
        return emitted
    }

    private class AccToolCall {
        var id: String = ""
        val name = StringBuilder()
        val args = StringBuilder()
    }

    private fun buildChatBody(requestId: String, messages: List<JSONObject>, options: ChatOptions): okhttp3.RequestBody {
        val root = JSONObject()
        root.put("model", options.model)
        root.put("temperature", options.temperature)
        root.put("max_tokens", options.maxTokens)
        root.put("stream", true)
        root.put("stream_options", JSONObject().put("include_usage", true))
        val arr = JSONArray()
        for (m in messages) {
            val o = JSONObject()
            o.put("role", m.optString("role", "user"))
            if (m.has("content") && !m.isNull("content")) o.put("content", m.optString("content"))
            m.optJSONArray("tool_calls")?.let { o.put("tool_calls", it) }
            m.optString("tool_call_id", "").takeIf { it.isNotBlank() }?.let { o.put("tool_call_id", it) }
            m.optString("name", "").takeIf { it.isNotBlank() }?.let { o.put("name", it) }
            arr.put(o)
        }
        root.put("messages", arr)
        return root.toString().toRequestBody("application/json".toMediaType())
    }

    private fun buildCall(body: okhttp3.RequestBody): okhttp3.Request {
        val url = baseUrl.trimEnd('/') + "/chat/completions"
        return Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $apiKey")
            .post(body)
            .build()
    }

    /** Transcribes audio (Groq whisper). Runs on the provider executor. */
    fun transcribe(file: File): TranscribeResult {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("model", TRANSCRIBE_MODEL)
            .addFormDataPart("file", file.name, file.asRequestBody("audio/mp4".toMediaType()))
            .build()
        val request = Request.Builder()
            .url(baseUrl.trimEnd('/') + "/audio/transcriptions")
            .addHeader("Authorization", "Bearer $apiKey")
            .post(body)
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw ProviderErrors.fromResponse(response.code, response.body?.string().orEmpty(), null)
            }
            val json = JSONObject(response.body?.string().orEmpty())
            return TranscribeResult(json.optString("text", ""))
        }
    }

    /** Cheap liveness check: GET /models with a short timeout. */
    fun ping(): Pair<Boolean, Long> {
        val start = System.currentTimeMillis()
        val request = Request.Builder()
            .url(baseUrl.trimEnd('/') + "/models")
            .addHeader("Authorization", "Bearer $apiKey")
            .get()
            .build()
        client.newCall(request).execute().use { response ->
            val latency = System.currentTimeMillis() - start
            return response.isSuccessful to latency
        }
    }

    private val DummyCall = object : okhttp3.Call {
        override fun request(): Request = throw UnsupportedOperationException()
        override fun execute(): Response = throw UnsupportedOperationException()
        override fun enqueue(callback: okhttp3.Callback) = throw UnsupportedOperationException()
        override fun cancel() = Unit
        override fun isExecuted(): Boolean = false
        override fun isCanceled(): Boolean = false
        override fun timeout() = throw UnsupportedOperationException()
        override fun clone(): okhttp3.Call = this
    }
}
