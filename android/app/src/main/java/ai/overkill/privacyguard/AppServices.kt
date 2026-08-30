package ai.overkill.privacyguard

import android.content.Context
import ai.overkill.privacyguard.audio.VoiceRecorder
import ai.overkill.privacyguard.crypto.BlobCipher
import ai.overkill.privacyguard.llm.GroqProvider
import ai.overkill.privacyguard.storage.KvStore
import ai.overkill.privacyguard.storage.SecretNames
import ai.overkill.privacyguard.storage.SecureStorage
import ai.overkill.privacyguard.storage.SettingsStore
import ai.overkill.privacyguard.work.Scheduler
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/** Central service wiring for the native layer. */
class AppServices(appContext: Context, cipher: BlobCipher) {
    val context: Context = appContext
    val secureStorage = SecureStorage(appContext, cipher)
    val kvStore = KvStore(appContext, cipher)
    val settings = SettingsStore(appContext)
    val voiceRecorder = VoiceRecorder(appContext)
    val scheduler = Scheduler(appContext)

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS) // per-read timeout; streaming stays responsive
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    /** Fresh provider per call so config/API-key changes take effect immediately. */
    fun groqProvider(): GroqProvider = GroqProvider(
        settings.baseUrl,
        secureStorage.get(SecretNames.GROQ_API_KEY) ?: "",
        httpClient
    )
}
