package ai.overkill.privacyguard.device

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.webkit.WebViewCompat
import org.json.JSONObject

object DeviceInfo {
    fun report(context: Context): JSONObject {
        val pkg = context.packageManager.getPackageInfo(context.packageName, 0)
        val webViewPkg = WebViewCompat.getCurrentWebViewPackage(context)
        val json = JSONObject()
        json.put("packageName", context.packageName)
        json.put("versionName", pkg.versionName ?: "0")
        json.put("versionCode", versionCode(pkg))
        json.put("sdkInt", Build.VERSION.SDK_INT)
        json.put("manufacturer", Build.MANUFACTURER ?: "unknown")
        json.put("model", Build.MODEL ?: "unknown")
        json.put("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "unknown")
        json.put("isArm64", Build.SUPPORTED_ABIS.any { it == "arm64-v8a" })
        json.put("webViewVersion", webViewPkg?.versionName ?: "unknown")
        return json
    }

    private fun versionCode(pkg: android.content.pm.PackageInfo): Long =
        if (Build.VERSION.SDK_INT >= 28) pkg.longVersionCode else @Suppress("DEPRECATION") pkg.versionCode.toLong()
}
