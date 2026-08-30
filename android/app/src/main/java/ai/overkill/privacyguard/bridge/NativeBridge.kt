package ai.overkill.privacyguard.bridge

import ai.overkill.privacyguard.AppServices
import ai.overkill.privacyguard.device.DeviceInfo
import ai.overkill.privacyguard.llm.ChatOptions
import ai.overkill.privacyguard.llm.ChatCall
import ai.overkill.privacyguard.net.NetworkStatus
import ai.overkill.privacyguard.storage.SecretNames
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap

/**
 * All bridge entry points. Every method is @JavascriptInterface and receives a
 * requestId; results are delivered via BridgeEventBus. Methods validate input
 * length/types and never log secrets. The interface is only reachable by the
 * bundled asset page (the WebView never loads remote content).
 */
class NativeBridge(
    private val host: BridgeHost,
    private val services: AppServices,
    private val bus: BridgeEventBus
) {
    private val chatCalls = ConcurrentHashMap<String, ChatCall>()
    private val rng = SecureRandom()

    private fun validId(id: String?): Boolean = id != null && ID_REGEX.matches(id)

    @JavascriptInterface
    fun getDeviceInfo(requestId: String) {
        if (!validId(requestId)) return
        bus.result(requestId, DeviceInfo.report(services.context))
    }

    @JavascriptInterface
    fun getConfig(requestId: String) {
        if (!validId(requestId)) return
        val cfg = JSONObject()
        cfg.put("hasApiKey", services.secureStorage.has(SecretNames.GROQ_API_KEY))
        cfg.put("model", services.settings.model)
        cfg.put("baseUrl", services.settings.baseUrl)
        cfg.put("schedulerEnabled", services.settings.schedulerEnabled)
        cfg.put("schedulerHours", services.settings.schedulerHours)
        cfg.put("recordingSupported", true)
        cfg.put("native", true)
        bus.result(requestId, cfg)
    }

    @JavascriptInterface
    fun setApiKey(requestId: String, value: String) {
        if (!validId(requestId)) return
        val key = value.trim()
        if (key.isEmpty()) {
            services.secureStorage.remove(SecretNames.GROQ_API_KEY)
            bus.resultPlain(requestId, JSONObject.NULL)
            return
        }
        if (key.length < 8 || key.length > 256 || !key.all { it.isLetterOrDigit() || it == '_' || it == '-' }) {
            bus.resultError(requestId, "invalid_key", "API key looks invalid")
            return
        }
        services.secureStorage.put(SecretNames.GROQ_API_KEY, key)
        bus.resultPlain(requestId, JSONObject.NULL)
    }

    @JavascriptInterface
    fun setModel(requestId: String, model: String) {
        if (!validId(requestId)) return
        if (model.isBlank() || model.length > 64 || !model.all { it.isLetterOrDigit() || it == '_' || it == '.' || it == '-' || it == ':' || it == '/' }) {
            bus.resultError(requestId, "bad_response", "invalid model id")
            return
        }
        services.settings.model = model
        bus.resultPlain(requestId, JSONObject.NULL)
    }

    @JavascriptInterface
    fun setBaseUrl(requestId: String, url: String) {
        if (!validId(requestId)) return
        val u = url.trim().removeSuffix("/")
        val httpsOk = u.startsWith("https://") && !u.contains(" ")
        val localhostOk = (u.startsWith("http://localhost") || u.startsWith("http://127.0.0.1"))
        if (!(httpsOk || localhostOk) || u.length > 256) {
            bus.resultError(requestId, "bad_response", "base URL must be HTTPS")
            return
        }
        services.settings.baseUrl = u
        bus.resultPlain(requestId, JSONObject.NULL)
    }

    @JavascriptInterface
    fun setScheduler(requestId: String, enabled: Boolean, hours: Int) {
        if (!validId(requestId)) return
        val h = hours.coerceIn(1, 168)
        services.settings.schedulerHours = h
        services.settings.schedulerEnabled = enabled
        if (enabled) services.scheduler.enable(h) else services.scheduler.disable()
        bus.resultPlain(requestId, JSONObject.NULL)
    }

    @JavascriptInterface
    fun runCheckNow(requestId: String) {
        if (!validId(requestId)) return
        services.scheduler.runNow()
        bus.resultPlain(requestId, JSONObject.NULL)
    }

    @JavascriptInterface
    fun kvPut(requestId: String, key: String, value: String) {
        if (!validId(requestId)) return
        try {
            services.kvStore.put(key, value)
            bus.resultPlain(requestId, JSONObject.NULL)
        } catch (e: Exception) {
            bus.resultError(requestId, "storage", e.message ?: "kv put failed")
        }
    }

    @JavascriptInterface
    fun kvGet(requestId: String, key: String) {
        if (!validId(requestId)) return
        try {
            val v = services.kvStore.get(key)
            bus.resultPlain(requestId, v ?: JSONObject.NULL)
        } catch (e: Exception) {
            bus.resultError(requestId, "storage", e.message ?: "kv get failed")
        }
    }

    @JavascriptInterface
    fun kvDelete(requestId: String, key: String) {
        if (!validId(requestId)) return
        try {
            services.kvStore.delete(key)
            bus.resultPlain(requestId, JSONObject.NULL)
        } catch (e: Exception) {
            bus.resultError(requestId, "storage", e.message ?: "kv delete failed")
        }
    }

    @JavascriptInterface
    fun chat(requestId: String, messagesJson: String, optionsJson: String) {
        if (!validId(requestId) || messagesJson.length > 4_000_000) return
        val msgs = try { parseMessages(messagesJson) } catch (_: Exception) {
            bus.resultError(requestId, "bad_response", "invalid messages payload")
            return
        }
        val options = try {
            val o = JSONObject(optionsJson)
            ChatOptions(
                model = o.optString("model", services.settings.model),
                temperature = o.optDouble("temperature", 0.7),
                maxTokens = o.optInt("max_tokens", 2048)
            )
        } catch (_: Exception) {
            ChatOptions(services.settings.model)
        }
        val apiKey = services.secureStorage.get(SecretNames.GROQ_API_KEY)
        if (apiKey == null) {
            bus.event(requestId, "error", JSONObject().put("error", JSONObject()
                .put("kind", "auth").put("message", "no API key configured").put("retryable", false)))
            return
        }
        val provider = services.groqProvider()
        val listener = ChatBridgeListener(bus, requestId) { chatCalls.remove(requestId) }
        val call = provider.chat(requestId, msgs, options, listener)
        chatCalls[requestId] = call
    }

    @JavascriptInterface
    fun cancelChat(requestId: String) {
        if (!validId(requestId)) return
        chatCalls.remove(requestId)?.cancel()
        bus.event(requestId, "cancelled")
    }

    @JavascriptInterface
    fun startRecording(requestId: String) {
        if (!validId(requestId)) return
        try {
            services.voiceRecorder.start()
            bus.resultPlain(requestId, JSONObject.NULL)
        } catch (e: Exception) {
            bus.resultError(requestId, "audio", e.message ?: "could not start recording")
        }
    }

    @JavascriptInterface
    fun stopRecording(requestId: String) {
        if (!validId(requestId)) return
        val file = services.voiceRecorder.stop()
        if (file == null) {
            bus.resultError(requestId, "audio", "recording was too short")
            return
        }
        bus.resultPlain(requestId, JSONObject.NULL)
    }

    @JavascriptInterface
    fun transcribe(requestId: String) {
        if (!validId(requestId)) return
        val file = services.voiceRecorder.lastRecording() ?: run {
            bus.resultError(requestId, "audio", "no recording available")
            return
        }
        val apiKey = services.secureStorage.get(SecretNames.GROQ_API_KEY)
        if (apiKey == null) {
            bus.resultError(requestId, "auth", "no API key configured")
            return
        }
        Thread {
            try {
                val text = services.groqProvider().transcribe(file).text
                bus.resultPlain(requestId, text)
            } catch (e: Exception) {
                bus.resultError(requestId, "unknown", e.message ?: "transcription failed")
            }
        }.start()
    }

    @JavascriptInterface
    fun testConnection(requestId: String) {
        if (!validId(requestId)) return
        val apiKey = services.secureStorage.get(SecretNames.GROQ_API_KEY)
        if (apiKey == null) {
            bus.resultError(requestId, "auth", "no API key configured")
            return
        }
        Thread {
            try {
                val (ok, latency) = services.groqProvider().ping()
                val res = JSONObject()
                res.put("ok", ok)
                res.put("latencyMs", latency)
                res.put("model", services.settings.model)
                res.put("message", if (ok) "" else "Groq endpoint rejected the request")
                bus.result(requestId, res)
            } catch (e: Exception) {
                bus.resultError(requestId, "network", e.message ?: "connection failed")
            }
        }.start()
    }

    @JavascriptInterface
    fun getNetworkStatus(requestId: String) {
        if (!validId(requestId)) return
        val net = NetworkStatus.report(services.context)
        val res = JSONObject()
        res.put("connected", net.connected)
        res.put("validated", net.validated)
        res.put("type", net.type)
        bus.result(requestId, res)
    }

    @JavascriptInterface
    fun requestPermission(requestId: String, kind: String) {
        if (!validId(requestId)) return
        host.requestPermission(kind, requestId)
    }

    @JavascriptInterface
    fun exportFile(requestId: String, fileName: String, mime: String, content: String) {
        if (!validId(requestId)) return
        if (fileName.isBlank() || fileName.length > 128 || fileName.contains("/") || content.length > 2_000_000) {
            bus.resultError(requestId, "storage", "invalid export")
            return
        }
        host.exportFile(requestId, fileName, mime, content)
    }

    @JavascriptInterface
    fun generatePassword(requestId: String, length: Int, optionsJson: String) {
        if (!validId(requestId)) return
        val len = length.coerceIn(6, 64)
        val opts = try { JSONObject(optionsJson) } catch (_: Exception) { JSONObject() }
        var charset = ""
        if (opts.optBoolean("uppercase", true)) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if (opts.optBoolean("lowercase", true)) charset += "abcdefghijklmnopqrstuvwxyz"
        if (opts.optBoolean("numbers", true)) charset += "0123456789"
        if (opts.optBoolean("symbols", false)) charset += "!@#\$%^&*()-_=+[]{};:,.<>?"
        if (charset.isEmpty()) {
            bus.resultError(requestId, "bad_response", "no character sets selected")
            return
        }
        val max = 256 - (256 % charset.length)
        val sb = StringBuilder()
        while (sb.length < len) {
            val v = rng.nextInt(256)
            if (v < max) sb.append(charset[v % charset.length])
        }
        bus.resultPlain(requestId, sb.toString())
    }

    private fun parseMessages(messagesJson: String): List<JSONObject> {
        val arr = JSONArray(messagesJson)
        val out = mutableListOf<JSONObject>()
        for (i in 0 until arr.length()) {
            val m = arr.optJSONObject(i) ?: throw IllegalArgumentException("message $i is not an object")
            if (m.length() > 16) throw IllegalArgumentException("message too large")
            out.add(m)
        }
        return out
    }

    companion object {
        private val ID_REGEX = Regex("^[A-Za-z0-9_]{4,80}$")
    }
}

private class ChatBridgeListener(
    private val bus: BridgeEventBus,
    private val requestId: String,
    private val onFinished: () -> Unit
) : ai.overkill.privacyguard.llm.ChatListener {

    override fun onToken(text: String) {
        bus.event(requestId, "token", JSONObject().put("content", text))
    }

    override fun onToolCall(id: String, name: String, arguments: String) {
        val call = JSONObject()
        call.put("id", id)
        call.put("name", name)
        call.put("arguments", arguments)
        bus.event(requestId, "tool_call", JSONObject().put("call", call))
    }

    override fun onDone(finishReason: String, usage: JSONObject?) {
        val payload = JSONObject().put("finishReason", finishReason)
        if (usage != null) payload.put("usage", usage)
        onFinished()
        bus.event(requestId, "done", payload)
    }

    override fun onError(error: ai.overkill.privacyguard.llm.ProviderError) {
        val err = JSONObject()
        err.put("kind", error.kind)
        err.put("message", error.message)
        err.put("retryable", error.retryable)
        onFinished()
        bus.event(requestId, "error", JSONObject().put("error", err))
    }
}
