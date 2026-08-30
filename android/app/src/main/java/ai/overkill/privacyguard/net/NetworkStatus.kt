package ai.overkill.privacyguard.net

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

data class NetStatus(
    val connected: Boolean,
    val validated: Boolean,
    val type: String
)

object NetworkStatus {
    fun report(context: Context): NetStatus {
        val cm = context.getSystemService(ConnectivityManager::class.java)
        val network = cm?.activeNetwork
        val caps = network?.let { cm.getNetworkCapabilities(it) }
        val connected = network != null && caps != null &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        val validated = caps != null &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        val type = when {
            caps == null -> "none"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "vpn"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> "bluetooth"
            else -> "other"
        }
        return NetStatus(connected, validated, type)
    }
}
