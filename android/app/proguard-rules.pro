# PrivacyGuard Pro — R8/ProGuard rules

# Keep JS bridge entry points (called reflectively by WebView JS engine)
-keepclassmembers class ai.overkill.privacyguard.bridge.NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# WorkManager
-keep class * extends androidx.work.Worker
-keep class androidx.work.impl.WorkerWrapper { *; }

# org.json
-dontwarn org.json.**
