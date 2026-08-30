package ai.overkill.privacyguard.llm

import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class GroqProviderTest {

    private lateinit var server: MockWebServer
    private lateinit var provider: GroqProvider

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        provider = GroqProvider(
            baseUrl = server.url("/v1").toString().trimEnd('/'),
            apiKey = "test-key",
            client = OkHttpClient.Builder().build(),
            retryPolicy = RetryPolicy(maxAttempts = 2, baseDelayMs = 1, maxDelayMs = 5)
        )
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    private fun messages(): List<JSONObject> {
        val m = JSONObject()
            .put("role", "user")
            .put("content", "hello")
        return listOf(m)
    }

    @Test
    fun `streams content and merges tool call deltas`() {
        val body = sequenceOf(
            """data: {"choices":[{"delta":{"role":"assistant","content":"Hel"}}]}""",
            """data: {"choices":[{"delta":{"content":"lo!"}}]}""",
            """data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"get_","arguments":""}}]}}]}""",
            """data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"name":"privacy_status","arguments":"{\"x\""}}]}}]}""",
            """data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":":1}"}}]}}]}""",
            """data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}""",
            "data: [DONE]"
        ).joinToString("\n\n") { it + "\n" }

        server.enqueue(
            MockResponse().setHeader("Content-Type", "text/event-stream").setBody(body)
        )

        val latch = CountDownLatch(1)
        val tokens = StringBuilder()
        val toolCalls = mutableListOf<Triple<String, String, String>>()
        provider.chat("test1", messages(), ChatOptions("llama-3.3-70b-versatile"), object : ChatListener {
            override fun onToken(text: String) { tokens.append(text) }
            override fun onToolCall(id: String, name: String, arguments: String) {
                toolCalls.add(Triple(id, name, arguments))
            }
            override fun onDone(finishReason: String, usage: JSONObject?) { latch.countDown() }
            override fun onError(error: ProviderError) { latch.countDown() }
        })

        assertTrue(latch.await(10, TimeUnit.SECONDS))
        assertEquals("Hello!", tokens.toString())
        assertEquals(1, toolCalls.size)
        assertEquals("call_1", toolCalls[0].first)
        assertEquals("get_privacy_status", toolCalls[0].second)
        assertEquals("""{"x":1}""", toolCalls[0].third)
    }

    @Test
    fun `maps 401 to non-retryable auth error and makes one request`() {
        server.enqueue(
            MockResponse()
                .setResponseCode(401)
                .setBody("""{"error":{"message":"Invalid API Key","type":"invalid_request_error"}}""")
        )

        val latch = CountDownLatch(1)
        var received: ProviderError? = null
        provider.chat("test2", messages(), ChatOptions("llama-3.3-70b-versatile"), object : ChatListener {
            override fun onToken(text: String) {}
            override fun onToolCall(id: String, name: String, arguments: String) {}
            override fun onDone(finishReason: String, usage: JSONObject?) {}
            override fun onError(error: ProviderError) {
                received = error
                latch.countDown()
            }
        })

        assertTrue(latch.await(10, TimeUnit.SECONDS))
        assertEquals("auth", received?.kind)
        assertFalse(received?.retryable == true)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun `retries 500 then succeeds`() {
        server.enqueue(MockResponse().setResponseCode(500).setBody("""{"error":{"message":"boom"}}"""))
        val okBody = """
            data: {"choices":[{"delta":{"content":"recovered"}}]}
            data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
            data: [DONE]
        """.trimIndent() + "\n\n"
        server.enqueue(MockResponse().setHeader("Content-Type", "text/event-stream").setBody(okBody))

        val latch = CountDownLatch(1)
        val tokens = StringBuilder()
        provider.chat("test3", messages(), ChatOptions("llama-3.3-70b-versatile"), object : ChatListener {
            override fun onToken(text: String) { tokens.append(text) }
            override fun onToolCall(id: String, name: String, arguments: String) {}
            override fun onDone(finishReason: String, usage: JSONObject?) { latch.countDown() }
            override fun onError(error: ProviderError) {
                latch.countDown()
            }
        })

        assertTrue(latch.await(10, TimeUnit.SECONDS))
        assertEquals("recovered", tokens.toString())
        assertEquals(2, server.requestCount)
    }
}
