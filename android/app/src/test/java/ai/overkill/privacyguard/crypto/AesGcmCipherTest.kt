package ai.overkill.privacyguard.crypto

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class AesGcmCipherTest {

    private val cipher = AesGcmCipher(testKey())

    @Test
    fun `round trip with aad`() {
        val plain = "groq gsk_verysecretkey".toByteArray(Charsets.UTF_8)
        val aad = "groq_api_key".toByteArray(Charsets.UTF_8)
        val blob = cipher.encrypt(plain, aad)
        val out = cipher.decrypt(blob, aad)
        assertArrayEquals(plain, out)
    }

    @Test
    fun `different aad fails authentication`() {
        val aad = "groq_api_key".toByteArray(Charsets.UTF_8)
        val blob = cipher.encrypt("secret".toByteArray(), aad)
        assertThrows(Exception::class.java) {
            cipher.decrypt(blob, "other_key".toByteArray())
        }
    }

    @Test
    fun `tampered ciphertext fails authentication`() {
        val aad = "k".toByteArray()
        val blob = cipher.encrypt("secret".toByteArray(), aad)
        blob[blob.size - 1] = (blob[blob.size - 1] + 1).toByte()
        assertThrows(Exception::class.java) {
            cipher.decrypt(blob, aad)
        }
    }

    @Test
    fun `iv is random per encryption`() {
        val aad = "k".toByteArray()
        val b1 = cipher.encrypt("same".toByteArray(), aad)
        val b2 = cipher.encrypt("same".toByteArray(), aad)
        check(!b1.contentEquals(b2))
        assertArrayEquals(cipher.decrypt(b1, aad), cipher.decrypt(b2, aad))
    }
}
