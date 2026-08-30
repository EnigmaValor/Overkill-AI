package ai.overkill.privacyguard.storage

import android.content.Context
import android.util.Base64
import ai.overkill.privacyguard.crypto.BlobCipher

object SecretNames {
    const val GROQ_API_KEY = "groq_api_key"
}

/**
 * Secrets at rest: encrypted with the Keystore-backed AES-256-GCM cipher,
 * stored in private SharedPreferences. Never logged; never backed up.
 */
class SecureStorage(context: Context, private val cipher: BlobCipher) {
    private val prefs = context.getSharedPreferences("pg_secure", Context.MODE_PRIVATE)

    fun put(name: String, value: String) {
        val blob = cipher.encrypt(value.toByteArray(Charsets.UTF_8), name.toByteArray(Charsets.UTF_8))
        prefs.edit().putString(name, Base64.encodeToString(blob, Base64.NO_WRAP)).apply()
    }

    /** Returns null when absent or when decryption fails (e.g. key rotation). */
    fun get(name: String): String? {
        val stored = prefs.getString(name, null) ?: return null
        return try {
            val blob = Base64.decode(stored, Base64.NO_WRAP)
            String(cipher.decrypt(blob, name.toByteArray(Charsets.UTF_8)), Charsets.UTF_8)
        } catch (_: Exception) {
            null
        }
    }

    fun has(name: String): Boolean = prefs.contains(name) && get(name) != null

    fun remove(name: String) {
        prefs.edit().remove(name).apply()
    }
}

/** Encrypted key/value store for app state, chat sessions and memory notes. */
class KvStore(context: Context, cipher: BlobCipher) {
    private val secure = SecureStorage(context, cipher)

    fun put(key: String, value: String) {
        validateKey(key)
        require(value.toByteArray(Charsets.UTF_8).size <= MAX_VALUE_BYTES) { "value too large" }
        secure.put(key, value)
    }

    fun get(key: String): String? {
        validateKey(key)
        return secure.get(key)
    }

    fun delete(key: String) {
        validateKey(key)
        secure.remove(key)
    }

    private fun validateKey(key: String) {
        require(KEY_REGEX.matches(key)) { "invalid key" }
    }

    companion object {
        private val KEY_REGEX = Regex("^[a-zA-Z0-9:._-]{1,128}$")
        private const val MAX_VALUE_BYTES = 256 * 1024
    }
}

/** Non-secret settings (model id, endpoint, scheduler). */
class SettingsStore(context: Context) {
    private val prefs = context.getSharedPreferences("pg_settings", Context.MODE_PRIVATE)

    var model: String
        get() = prefs.getString("model", DEFAULT_MODEL) ?: DEFAULT_MODEL
        set(value) = prefs.edit().putString("model", value).apply()

    var baseUrl: String
        get() = prefs.getString("base_url", DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        set(value) = prefs.edit().putString("base_url", value).apply()

    var schedulerEnabled: Boolean
        get() = prefs.getBoolean("scheduler_enabled", false)
        set(value) = prefs.edit().putBoolean("scheduler_enabled", value).apply()

    var schedulerHours: Int
        get() = prefs.getInt("scheduler_hours", 24)
        set(value) = prefs.edit().putInt("scheduler_hours", value.coerceIn(1, 168)).apply()

    companion object {
        const val DEFAULT_MODEL = "llama-3.3-70b-versatile"
        const val DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
    }
}
