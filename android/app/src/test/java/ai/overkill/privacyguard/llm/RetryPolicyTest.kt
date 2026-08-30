package ai.overkill.privacyguard.llm

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RetryPolicyTest {

    private val policy = RetryPolicy(maxAttempts = 3, baseDelayMs = 10, maxDelayMs = 1_000)

    @Test
    fun `does not retry auth errors`() {
        val err = ProviderError("auth", "bad key", 401, retryable = false)
        assertFalse(policy.shouldRetry(err, 0))
    }

    @Test
    fun `retries rate limit within attempts`() {
        val err = ProviderError("rate_limit", "slow down", 429, retryable = true)
        assertTrue(policy.shouldRetry(err, 0))
        assertTrue(policy.shouldRetry(err, 1))
        assertFalse(policy.shouldRetry(err, 3))
    }

    @Test
    fun `retry after header is honored`() {
        val delay = policy.delayMs(0, retryAfterSeconds = 7)
        assertEquals(7_000L, delay)
    }

    @Test
    fun `backoff grows exponentially and stays under cap`() {
        val small = policy.delayMs(0)
        val larger = policy.delayMs(2)
        assertTrue(small > 0)
        assertTrue(larger >= small)
        assertTrue(policy.delayMs(10) <= 1_000L + (1_000L * 0.25).toLong())
    }
}
