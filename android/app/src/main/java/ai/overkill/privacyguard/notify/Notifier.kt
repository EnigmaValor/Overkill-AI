package ai.overkill.privacyguard.notify

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/** Android notifications for background checks and agent jobs (no Play Services). */
object Notifier {
    const val CHANNEL_PRIVACY = "privacy_checks"
    const val CHANNEL_AGENT = "agent_jobs"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = context.getSystemService(NotificationManager::class.java) ?: return
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_PRIVACY, "Privacy checks", NotificationManager.IMPORTANCE_DEFAULT)
                .apply { description = "Background security and Groq connectivity results" }
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_AGENT, "Agent jobs", NotificationManager.IMPORTANCE_LOW)
                .apply { description = "Long-running assistant jobs" }
        )
    }

    fun canPost(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    fun post(context: Context, title: String, text: String, channel: String = CHANNEL_PRIVACY) {
        if (!canPost(context)) return
        ensureChannels(context)
        val notification = NotificationCompat.Builder(context, channel)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setAutoCancel(true)
            .build()
        val nm = context.getSystemService(NotificationManager::class.java) ?: return
        nm.notify((title.hashCode() and 0x7fffffff), notification)
    }
}
