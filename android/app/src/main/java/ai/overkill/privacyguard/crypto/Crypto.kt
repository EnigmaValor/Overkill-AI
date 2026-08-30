package ai.overkill.privacyguard.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/** Symmetric blob encryption used for the encrypted vault/API key at rest. */
interface BlobCipher {
    /** Encrypts plain; returned blob layout is [iv][ciphertext]. */
    fun encrypt(plain: ByteArray, aad: ByteArray): ByteArray

    /** Reverses [encrypt]; throws on wrong key or tampered data (GCM auth failure). */
    fun decrypt(blob: ByteArray, aad: ByteArray): ByteArray
}

/** Portable AES-256-GCM implementation (unit-testable on the JVM). */
class AesGcmCipher(
    private val key: SecretKey,
    private val ivSize: Int = 12,
    private val tagBits: Int = 128
) : BlobCipher {
    private val rng = SecureRandom()

    override fun encrypt(plain: ByteArray, aad: ByteArray): ByteArray {
        val iv = ByteArray(ivSize).also { rng.nextBytes(it) }
        val cipher = Cipher.getInstance(TRANSFORM)
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(tagBits, iv))
        cipher.updateAAD(aad)
        val ct = cipher.doFinal(plain)
        return iv + ct
    }

    override fun decrypt(blob: ByteArray, aad: ByteArray): ByteArray {
        require(blob.size > ivSize) { "ciphertext too short" }
        val iv = blob.copyOfRange(0, ivSize)
        val ct = blob.copyOfRange(ivSize, blob.size)
        val cipher = Cipher.getInstance(TRANSFORM)
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(tagBits, iv))
        cipher.updateAAD(aad)
        return cipher.doFinal(ct)
    }

    companion object {
        private const val TRANSFORM = "AES/GCM/NoPadding"
    }
}

/** Helper used by unit tests. */
fun testKey(): SecretKey = SecretKeySpec(ByteArray(32) { it.toByte() }, "AES")

/** Android Keystore-backed AES-256-GCM key (never leaves secure hardware when available). */
class KeystoreBlobCipher(private val alias: String = "privacyguard_master_key") : BlobCipher {
    private val delegate: AesGcmCipher by lazy {
        AesGcmCipher(getOrCreateKey())
    }

    private fun getOrCreateKey(): SecretKey {
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (ks.getKey(alias, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setRandomizedEncryptionRequired(true)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    override fun encrypt(plain: ByteArray, aad: ByteArray): ByteArray = delegate.encrypt(plain, aad)

    override fun decrypt(blob: ByteArray, aad: ByteArray): ByteArray = delegate.decrypt(blob, aad)

    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    }
}
