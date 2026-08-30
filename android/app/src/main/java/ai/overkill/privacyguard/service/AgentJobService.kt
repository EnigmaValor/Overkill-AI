package ai.overkill.privacyguard.service

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import ai.overkill.privacyguard.R
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
 * Foreground service (Android 14 dataSync type) for background agent jobs
 * started from the app — keeps the job alive when the UI is backgrounded and
 * reports via a notification. No privileged access is used.
 */
class AgentJobService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val kind = intent?.getStringExtra(EXTRA_KIND) ?: KIND_HEALTH_CHECK
        val notification = NotificationCompat.Builder(this, Notifier.CHANNEL_AGENT)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentTitle("PrivacyGuard")
            .setContentText(if (kind == KIND_HEALTH_CHECK) "Running Groq health check…" else "Running agent job…")
            .setOngoing(true)
            .build()
        ServiceCompat.startForeground(
            this,
            NOTIF_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        )

        Thread {
            try {
                when (kind) {
                    KIND_HEALTH_CHECK -> runHealthCheck()
                    else -> runHealthCheck()
                }
            } finally {
                ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
            }
        }.start()
        return START_NOT_STICKY
    }

    private fun runHealthCheck() {
        val net = NetworkStatus.report(this)
        val netText = if (net.connected) "Network: ${net.type} (${if (net.validated) "validated" else "connected"})" else "Network: offline"

        val settings = SettingsStore(this)
        val secure = SecureStorage(this, KeystoreBlobCipher(this))
        val apiKey = secure.get(SecretNames.GROQ_API_KEY)
        var groqText = "Groq: no API key configured"
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
                if (ok) "Groq: OK (${latency}ms)" else "Groq: unreachable"
            } catch (_: Exception) {
                "Groq: unreachable"
            }
        }
        Notifier.post(this, "Health check complete", "$netText • $groqText")
    }

    companion object {
        private const val EXTRA_KIND = "kind"
        private const val KIND_HEALTH_CHECK = "health_check"
        private const val NOTIF_ID = 0x51

        fun start(context: Context, kind: String = KIND_HEALTH_CHECK) {
            val intent = Intent(context, AgentJobService::class.java).putExtra(EXTRA_KIND, kind)
            ContextCompat.startForegroundService(context, intent)
        }
    }
}
