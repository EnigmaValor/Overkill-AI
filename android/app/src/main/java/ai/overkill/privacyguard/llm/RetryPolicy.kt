package ai.overkill.privacyguard.llm

import kotlin.math.min

/**
 * Retry policy for LLM calls: only transient errors (rate limit, timeouts,
 * network failures, 5xx) are retried; auth/validation errors never are.
 * Uses exponential backoff with jitter; honors server Retry-After when present.
 */
class RetryPolicy(
    val maxAttempts: Int = 3,
    private val baseDelayMs: Long = 1_000L,
    private val maxDelayMs: Long = 20_000L,
    private val jitterRatio: Double = 0.25
) {
    fun shouldRetry(error: ProviderError, attempt: Int): Boolean =
        error.retryable && attempt < maxAttempts

    fun delayMs(attempt: Int, retryAfterSeconds: Int? = null): Long {
        retryAfterSeconds?.let { return it * 1000L }
        val exp = 1L shl attempt.coerceIn(0, 10)
        val base = min(maxDelayMs, baseDelayMs * exp)
        val jitter = (base * jitterRatio * Math.random()).toLong()
        return min(maxDelayMs, base + jitter)
    }
}
