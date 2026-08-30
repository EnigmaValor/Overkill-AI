package ai.overkill.privacyguard

import android.Manifest
import android.os.Bundle
import android.util.Base64
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import ai.overkill.privacyguard.bridge.BridgeEventBus
import ai.overkill.privacyguard.bridge.BridgeHost
import ai.overkill.privacyguard.bridge.NativeBridge
import ai.overkill.privacyguard.crypto.KeystoreBlobCipher
import ai.overkill.privacyguard.notify.Notifier
import org.json.JSONObject
import java.io.IOException

/**
 * Single-activity app: hardened WebView hosting the bundled React UI, with a
 * typed JS bridge to native services (Groq, Keystore, WorkManager, audio).
 */
class MainActivity : AppCompatActivity(), BridgeHost {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var bus: BridgeEventBus
    private lateinit var services: AppServices

    private var pendingPermissionRequestId: String? = null
    private var pendingExport: PendingExport? = null

    private data class PendingExport(val requestId: String, val contentB64: String)

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val id = pendingPermissionRequestId
        pendingPermissionRequestId = null
        if (id != null) {
            bus.result(id, JSONObject().put("granted", granted))
        }
    }

    private val exportLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("*/*")
    ) { uri ->
        val export = pendingExport
        pendingExport = null
        if (uri == null || export == null) {
            export?.let { bus.resultError(it.requestId, "storage", "export cancelled") }
            return@registerForActivityResult
        }
        try {
            val bytes = Base64.decode(export.contentB64, Base64.NO_WRAP)
            contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
                ?: throw IOException("could not open output stream")
            bus.resultPlain(export.requestId, JSONObject.NULL)
        } catch (e: Exception) {
            bus.resultError(export.requestId, "storage", e.message ?: "export failed")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Notifier.ensureChannels(this)

        val cipher = KeystoreBlobCipher()
        services = AppServices(this, cipher)
        bus = BridgeEventBus(this)

        webView = WebView(this)
        webView.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        setContentView(webView)

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val s = webView.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.allowFileAccess = false
        s.allowContentAccess = false
        s.allowFileAccessFromFileURLs = false
        s.allowUniversalAccessFromFileURLs = false
        s.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        s.setSupportMultipleWindows(false)
        s.mediaPlaybackRequiresUserGesture = true
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        WebViewCompat.setSafeBrowsingEnabled(webView, true)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                return request?.let { assetLoader.shouldInterceptRequest(it.url) }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // Only the bundled app origin is ever loaded; all other navigation is blocked.
                val url = request?.url?.toString() ?: return true
                return !url.startsWith("https://appassets.androidplatform.net/")
            }
        }

        webView.addJavascriptInterface(NativeBridge(this, services, bus), "PrivacyBridge")
        webView.loadUrl(ASSET_BASE_URL + "/assets/www/index.html")
    }

    override fun deliverToWeb(json: String) {
        runOnUiThread {
            if (webView.isDestroyed) return@runOnUiThread
            webView.evaluateJavascript(
                "window.__privacyBridgeEvent && window.__privacyBridgeEvent(${JSONObject.quote(json)})",
                null
            )
        }
    }

    override fun requestPermission(kind: String, requestId: String) {
        val permission = when (kind) {
            "notifications" -> Manifest.permission.POST_NOTIFICATIONS
            "microphone" -> Manifest.permission.RECORD_AUDIO
            else -> null
        }
        if (permission == null) {
            bus.resultError(requestId, "bad_response", "unknown permission '$kind'")
            return
        }
        pendingPermissionRequestId = requestId
        permissionLauncher.launch(permission)
    }

    override fun exportFile(requestId: String, fileName: String, mime: String, contentB64: String) {
        pendingExport = PendingExport(requestId, contentB64)
        exportLauncher.launch(fileName)
    }

    override fun onPause() {
        // Never leave the mic open while backgrounded.
        services.voiceRecorder.cancel()
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val ASSET_BASE_URL = "https://appassets.androidplatform.net"
    }
}
