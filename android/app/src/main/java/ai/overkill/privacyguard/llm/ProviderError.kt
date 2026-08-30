package ai.overkill.privacyguard.llm

import org.json.JSONObject
import java.io.IOException
import java.net.SocketTimeoutException

/**
 * Structured, user-reportable LLM error.
 * kinds: auth | rate_limit | timeout | network | bad_response | model_not_found | server | invalid_key | unknown
 */
class ProviderError(
    val kind: String,
    override val message: String,
    val httpCode: Int = 0,
    val retryable: Boolean,
    val retryAfterSeconds: Int? = null
) : IOException(message)

object ProviderErrors {

    fun fromResponse(code: Int, body: String, retryAfterHeader: String?): ProviderError {
        val parsed = extractMessage(body)
        val retryAfter = retryAfterHeader?.trim()?.toIntOrNull()
        return when {
            code == 401 || code == 403 -> ProviderError("auth", "invalid Groq API key", code, retryable = false, retryAfterSeconds = retryAfter)
            code == 429 -> ProviderError("rate_limit", parsed.second ?: "rate limit reached", code, retryable = true, retryAfterSeconds = retryAfter)
            code == 404 -> ProviderError("model_not_found", parsed.second ?: "model not found", code, retryable = false, retryAfterSeconds = retryAfter)
            code == 400 -> ProviderError("bad_response", parsed.second ?: "bad request", code, retryable = false, retryAfterSeconds = retryAfter)
            code == 408 -> ProviderError("timeout", parsed.second ?: "request timed out", code, retryable = true, retryAfterSeconds = retryAfter)
            code >= 500 -> ProviderError("server", parsed.second ?: "server error", code, retryable = true, retryAfterSeconds = retryAfter)
            else -> ProviderError(parsed.first ?: "unknown", parsed.second ?: "HTTP $code", code, retryable = false, retryAfterSeconds = retryAfter)
        }
    }

    fun fromException(e: Exception): ProviderError = when (e) {
        is ProviderError -> e
        is SocketTimeoutException -> ProviderError("timeout", "request timed out", 0, retryable = true)
        is IOException -> ProviderError("network", e.message ?: "network error", 0, retryable = true)
        else -> ProviderError("unknown", e.message ?: "unexpected error", 0, retryable = false)
    }

    /** returns (code-or-null, message-or-null), message normalized to a single line. */
    private fun extractMessage(body: String): Pair<String?, String?> {
        if (body.isBlank()) return null to null
        return try {
            val root = JSONObject(body)
            val err = root.optJSONObject("error") ?: return null to body.take(300)
            val code = err.optString("code", "").takeIf { it.isNotBlank() }
            val msg = err.optString("message", "").replace('\n', ' ').take(300).takeIf { it.isNotBlank() }
            code to msg
        } catch (_: Exception) {
            null to body.take(300)
        }
    }
}
