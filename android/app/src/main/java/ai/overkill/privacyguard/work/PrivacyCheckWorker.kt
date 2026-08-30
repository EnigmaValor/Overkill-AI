package ai.overkill.privacyguard.work

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import ai.overkill.privacyguard.crypto.KeystoreBlobCipher
import ai.overkill.privacyguard.llm.GroqProvider
import ai.overkill.privacyguard.net.NetworkStatus
import ai.overkill.privacyguard.notify.Notifier
import ai.overkill.privacyguard.storage.SecretNames
import ai.overkill.privacyguard.storage.SecureStorage
import ai.overkill.privacyguard.storage.SettingsStore
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * WorkManager job: real network check + optional Groq connectivity probe,
 * delivered as an Android notification. Resilient to process death.
 */
class PrivacyCheckWorker(appContext: Context, params: WorkerParameters) : Worker(appContext, params) {

    override fun doWork(): Result {
        return try {
            val context = applicationContext
            val net = NetworkStatus.report(context)
            val netText = if (net.connected) "Connected (${net.type})${if (net.validated) ", validated" else ""}" else "Offline"

            val settings = SettingsStore(context)
            val secure = SecureStorage(context, KeystoreBlobCipher())
            val apiKey = secure.get(SecretNames.GROQ_API_KEY)

            var groqText = "Groq: no API key"
            if (apiKey != null) {
                groqText = try {
                    val provider = GroqProvider(
                        settings.baseUrl,
                        apiKey,
                        OkHttpClient.Builder()
                            .connectTimeout(10, TimeUnit.SECONDS)
                            .readTimeout(15, TimeUnit.SECONDS)
                            .build()
                    )
                    val (ok, latency) = provider.ping()
                    if (ok) "Groq: reachable (${latency}ms)" else "Groq: unreachable"
                } catch (_: Exception) {
                    "Groq: unreachable"
                }
            }

            Notifier.post(context, "PrivacyGuard check complete", "$netText • $groqText")
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
