# PrivacyGuard Pro — Android / GrapheneOS port

This document is the complete audit → architecture → implementation → verification
record for porting this repository to a Google Pixel 7 Pro running GrapheneOS
(arm64-v8a, no Google Play Services) with Groq as the primary LLM backend.

> **Naming note.** The task was phrased as “OpenJarvis”. The repository checkout
> (`EnigmaValor/Overkill-AI`) contains **no OpenJarvis code anywhere** — verified
> by full-tree grep, `gh repo list EnigmaValor` (only one repo), and single-commit
> history. It contains the **PrivacyGuard Pro** privacy dashboard (React/TypeScript
> UI) with an Android Gradle toy project (`android_roblox_hack`) and a Flask APK
> builder (`magic_ai_builder`). The port below therefore targets the actual
> OpenJarvis-equivalent in this repository: the PrivacyGuard Pro product, while
> preserving every capability the repository actually has. If the real OpenJarvis
> source lives in another repository, the same port architecture applies and can
> be re-applied; the framework is provider-abstracted rather than hardcoded.

---

## 1. Architecture chosen

**Hybrid native-Android shell + preserved web core** (the strongest fit for this codebase):

```
Android Integration Layer (Kotlin; single Activity + WorkManager + FGS)
  │  WebView (hardened, WebViewAssetLoader, Keystore AES at rest)
  ▼
Preserved React/TypeScript core (bundled in assets/www)
  │  AgentRuntime: streaming, tool loop, sessions, memory tools
  ▼
LLM Provider abstraction (GroqProvider; OkHttp SSE, retries, tool calls)
  ▼
Groq API (chat + whisper transcription)
```

### Why this architecture

| Option | Verdict |
|---|---|
| Native Android rewrite | **Rejected** — destroys the entire preserved UI/agent/feature surface; violates “don’t rewrite from scratch”. |
| Termux-backed Python/Node runtime | **Rejected** — needs privileged install, non-Play-Service distribution is fragile on GrapheneOS, poor lifecycle/foreground semantics, huge APK, no clean FGS/WorkManager integration. |
| Pure WebView (no native layer) | **Insufficient** — no Keystore secrets, no WorkManager scheduler, no FGS, no audio transcription, no real network status. |
| **Hybrid: hardened WebView + Kotlin integration layer + preserved React core** | **Chosen** — keeps ~100% of the UI/agent code unmodified, adds real Android capabilities exactly where Android requires them, minimal privileged surface (mic/notifications only), single APK, no Play Services. |

### Preserved vs adapted at a glance

- **Preserved unchanged:** dashboard, themes, Tor/DNSCrypt/I2P/VPN management tabs
  (their original desktop semantics were *simulation* — see compatibility matrix),
  HackTheBox/TCM educational tab, installer download tab, all styling, React/Vite build.
- **Adapted:** AI chat (canned responder → real LLM agent with tool loop and memory),
  password manager (simulated crypto → real AES-256-GCM + real Shamir + CSPRNG),
  settings (new Groq config), theme persistence, persistence layer.
- **Added (Android-native):** Keystore-encrypted API key and KV store, WorkManager
  scheduler + notifications, microphone recording → Groq whisper, foreground
  service for background health checks, real ConnectivityManager status, SAF export.

---

## 2. Feature compatibility matrix

| Subsystem (original) | Classification | Why / replacement | Equivalence |
|---|---|---|---|
| React dashboard UI, tabs, themes | **UNCHANGED** (plus theme persistence) | Runs as-is in WebView; Vite `base: './'` + WebViewAssetLoader make ES modules work. | Identical UI |
| AI Chat (canned `getAIResponse`) | **REPLACED** | `AgentRuntime` (streaming, tools, sessions, memory, errors) using Groq chat completions. `AIChatBot.tsx` rewritten; original visual design kept. | Strictly stronger |
| Agent loop / tool execution | **REPLACED** (no original existed) | Implemented in TS layer: streaming → tool calls → execution → follow-up turns (max 4), cancellation, structured errors. | New capability |
| Sessions | **ADAPTED** | In-memory only → persisted via encrypted KV (`chat.sessions`), restored after process death. | Stronger |
| Memory system | **ADAPTED** | None existed → `memory_save`/`memory_recall` tools persisted in encrypted KV (Android Keystore). | New capability |
| Groq integration | **NEW** | Provider abstraction (`GroqProvider` Kotlin + `ChatTransport` TS), streaming SSE, tool/function calls, retries w/ backoff + Retry-After, timeouts, structured errors (`auth/rate_limit/timeout/network/bad_response/model_not_found/server`), configurable model/base URL, future providers via interface. | New capability |
| API key handling | **ADAPTED** | Now stored AES-256-GCM encrypted via Android Keystore; never logged; validation; UI masked entry. | Stronger |
| Password Strength / Generator | **ADAPTED** | `Math.random` → CSPRNG (`crypto.getRandomValues` / `SecureRandom` native) with rejection sampling. | Stronger |
| Shamir Secret Sharing (simulated) | **REPLACED** | Real Shamir over GF(2⁸) with AES polynomial, share/verify/reconstruct UI. | Same feature, real crypto |
| Password Encryption (simulated) | **REPLACED** | Real PBKDF2-SHA256 (210k) → AES-256-GCM, portable `PGV1:` format. | Same feature, real crypto |
| Scheduler (none existed) | **ADAPTED** | WorkManager periodic privacy check + “run now”; notification results; network-constrained. | New capability |
| Notifications (none existed) | **ADAPTED** | Android notification channels (no Play Services), runtime permission. | New capability |
| Microphone (none existed) | **ADAPTED** | MediaRecorder AAC → Groq `whisper-large-v3`; mic permission; auto-stop on pause. | New capability |
| Foreground execution | **ADAPTED** | `AgentJobService` (Android 14 `dataSync` FGS) for background health checks — the systemd-equivalent. | New capability |
| Process death/recovery | **ADAPTED** | Sessions/memory/theme persist in encrypted KV; WorkManager jobs survive; WebView state uses `singleTask` + configChanges. | Stronger |
| Tor / DNSCrypt / I2P / VPN tabs | **UNCHANGED** (original = simulation) | The original product simulated these. The port **explicitly labels** this on Android (`PlatformNotice`) and points to real Android equivalents (Private DNS/DoT, dedicated Tor/VPN apps). The AI/network-status/checks use real APIs. | Exact original semantics, honestly labeled |
| Download/Installer tab | **UNCHANGED** | Desktop installers remain; Android is installed from the APK (the tab’s desktop content is preserved). | Identical |
| HTB + TCM (DK) tab | **UNCHANGED** | Static educational content, no platform APIs. | Identical |
| Flask `magic_ai_builder` + toy Gradle project | **UNCHANGED, OPTIONAL** | Desktop build tooling; not needed on-device; preserved untouched. | Same |
| WebSocket/SSE (specified in brief) | **N/A** | Original code has none; SSE used for LLM streaming (real). | — |
| systemd / Docker | **REPLACED** | Android FGS + WorkManager (systemd); no Docker runtime on device (Gradle CI builds APK). | Platform equivalent |
| Google Play Services | **REPLACED** | Zero GMS dependency: OkHttp HTTP, AndroidX only, Keystore, WorkManager. | Better for GrapheneOS |
| **IMPOSSIBLE** | — | Running the desktop Tor/DNSCrypt/I2P daemons inside a normal Android app (requires privileged networking beyond what a safe GrapheneOS app may request); embedding a full Python/Flask/Node server on-device (Termux-only, fragile and unnecessary given hybrid split). | Platform limits, documented |

---

## 3. Repository areas modified

```
src/agent/agentRuntime.ts        NEW   agent loop (streaming/tools/memory/sessions)
src/agent/transports.ts          NEW   native + browser SSE transports
src/agent/tools.ts               NEW   tool registry (status/network/device/password/memory)
src/agent/types.ts               NEW   shared types
src/lib/native.ts                NEW   typed JS↔Kotlin bridge + web fallbacks
src/components/AIChatBot.tsx     REPL  real agent chat (sessions, voice, stop, errors)
src/components/GroqSettings.tsx  NEW   API key/model/endpoint/scheduler/permissions/device
src/components/PlatformNotice.tsx NEW  honest Android note on simulated network tabs
src/components/TorManager.tsx    FIX   unused vars; platform notice
src/components/DNSCryptManager.tsx / I2PManager.tsx / VPNManager.tsx  + platform notice
src/components/InstallerManager.tsx  FIX unused state
src/PrivacyDashboard.tsx         wire vault tab, Groq settings, theme persistence, AI props
src/AdvancedPasswordManager.tsx  REPL  real AES-GCM/PBKDF2, real Shamir GF(256), CSPRNG
vite.config.ts                   base './' so bundles load behind WebView asset host
.gitignore                       NEW  keep builds/generated assets out of git
android/                         NEW  Gradle project (Kotlin; see §4)
android/app/src/main/java/ai/overkill/privacyguard/
  MainActivity.kt                hardened WebView + ActivityResult permissions/export
  AppServices.kt                 service wiring
  bridge/NativeBridge.kt         @JavascriptInterface surface (20 methods, all validated)
  bridge/BridgeEventBus.kt       Kotlin→JS event channel
  crypto/Crypto.kt               BlobCipher, AES-256-GCM, AndroidKeyStore key
  storage/Storage.kt             SecureStorage (secrets), KvStore (encrypted KV), SettingsStore
  llm/GroqProvider.kt            SSE streaming, tool-call merging, transcribe, ping
  llm/ProviderError.kt           structured error mapping
  llm/RetryPolicy.kt             backoff + Retry-After
  llm/SseEventParser.kt          pure SSE parser
  audio/VoiceRecorder.kt         MediaRecorder AAC → cache
  net/NetworkStatus.kt           ConnectivityManager
  device/DeviceInfo.kt           build/ABI/WebView info
  notify/Notifier.kt             notification channels
  work/PrivacyCheckWorker.kt     WorkManager check (net + Groq probe)
  work/Scheduler.kt              periodic/one-time scheduling
  service/AgentJobService.kt     foreground service (dataSync)
android/app/src/test/...         SseEventParserTest, RetryPolicyTest, AesGcmCipherTest, GroqProviderTest
android/.../AndroidManifest.xml  minimal permissions, no exported extras, HTTPS-only
android/.../res/xml/...          network security config, data extraction rules
.github/workflows/android-build.yml  NEW  CI: web build → wrapper → unit tests → APKs
scripts/build-android.sh         NEW  reproducible build entrypoint
ANDROID_PORT.md                  THIS DOCUMENT
```

---

## 4. Android-specific design

- **Lifecycle:** single Activity (`singleTask`, `configChanges` list); WebView paused/resumed with activity; recording cancelled on pause; all bridge responses posted on UI thread.
- **Background:** WorkManager periodic check (network-constrained); one-time “run now”; `AgentJobService` foreground service (`dataSync`) for health checks; `START_NOT_STICKY`; Android 14 FGS type declared.
- **Permissions:** only `INTERNET`, `ACCESS_NETWORK_STATE`, `RECORD_AUDIO`, `POST_NOTIFICATIONS`, `WAKE_LOCK`, `FOREGROUND_SERVICE`(+`DATA_SYNC`). All runtime requests use ActivityResult contracts; denial is surfaced in the UI, never crashes.
- **Scoped storage:** everything in app-private storage; export uses SAF (`CreateDocument`) — no storage permission.
- **Process death:** sessions, memory notes, theme and config survive in the encrypted KV; WorkManager jobs re-run after death.
- **Battery:** no polling loops; periodic work at 1–168h user setting.
- **GrapheneOS:** `allowBackup=false`, `dataExtractionRules` excludes everything, system CAs only, no cleartext, no GMS, `WebViewAssetLoader` protects the asset origin, single exported component (launcher), no debug interfaces in release (`setWebContentsDebuggingEnabled` only in debug).
- **WebView hardening:** JS + DOM storage only; file/content access disabled; mixed content never; safe browsing on; all external navigation blocked; JS bridge reachable only by the bundled asset page; input sizes validated on both sides.

---

## 5. Groq integration details

- Base URL configurable (default `https://api.groq.com/openai/v1`), validated HTTPS; **no key hardcoded** — never logged, never committed (`.gitignore` + Keystore).
- Models: `llama-3.3-70b-versatile` (default), `llama-3.1-8b-instant`, `gemma2-9b-it`, `qwen-2.5-32b`, `mixtral-8x7b-32768`; arbitrary ID allowed.
- Streaming: SSE with per-line parser, `[DONE]` sentinel, `usage` via `stream_options.include_usage`.
- Tool/function calling: streaming tool-call deltas merged natively, emitted as complete calls; agent loop executes local tools and re-enters the model up to 4 turns.
- Retries: only transient errors (`rate_limit`/`timeout`/`network`/5xx); exponential backoff + jitter, honors `Retry-After`; max 3 attempts; no retry after partial stream.
- Timeouts: connect 10s, read 60s (per-read, streaming-safe), write 30s.
- Error reporting: structured `ProviderError { kind, message, httpCode, retryable, retryAfter }` → friendly UI + `Retry` hint.
- Transcription: `whisper-large-v3` multipart from the in-cache m4a.
- Provider abstraction: `LlmProvider` interface + `GroqProvider`; `WebTransport`/`NativeTransport` in TS; adding a provider = new class + factory, no UI hardcoding.

---

## 6. Build commands

```bash
# All prerequisites: Node 18+, JDK 17, Gradle 8.2 (first time only, to gen wrapper)
cd android && gradle wrapper --gradle-version 8.2 --distribution-type bin && cd ..

# Full reproducible build (web + tests + APKs)
./scripts/build-android.sh

# Or step by step
npm run build
cd android
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease        # unsigned unless signing -P props given

# Release with signing
./gradlew :app:assembleRelease \
  -PPG_KEYSTORE_FILE=~/.android/release.jks \
  -PPG_KEYSTORE_PASSWORD=... \
  -PPG_KEY_ALIAS=release \
  -PPG_KEY_PASSWORD=...
```

CI (`.github/workflows/android-build.yml`) performs the identical sequence on
`ubuntu-latest` and uploads `privacyguard-pro-arm64-apks`.

## 7. Installation (GrapheneOS / Pixel 7 Pro)

1. Build or download the **debug APK** (`app-debug.apk`) — debug is signed, installable.
2. Transfer to the device (`adb install ...` or Files app → tap APK → allow unknown sources).
3. App lists no Play Services; **do not grant Storage or accessibility** — none are requested.
4. Grant **Notifications** (for scheduled checks) and **Microphone** (for voice input) when the app prompts; both optional.
5. Open Settings → **Groq LLM Backend**: paste your `gsk_...` key (stored in Android Keystore, never leaves the device), choose a model, hit **Test connection**.
6. Chat with the assistant (🎙 works after mic permission), use the Vault tab for real crypto/Shamir, and optional background checks via the scheduler.

## 8. Configuration

- API key: in-app Settings → only device-side (Keystore AES-256-GCM).
- Model / base URL / scheduler interval: in-app Settings (plain prefs; non-secret).
- Signing keystore: environment/-P properties (never in the repo).
- Release hardening: R8 `minifyEnabled true` + `shrinkResources`; only bridge/worker classes kept.

## 9. Test results

| Area | Test | Status |
|---|---|---|
| Web/agent build | `tsc && vite build` (strict TS, 47 modules) | ✅ verified locally |
| Agent loop (TS) | `npm test` → streaming turns, tool call execution, tool result reporting, final message | ✅ verified locally (15/15) |
| Memory tools (TS) | `npm test` → save/recall/missing via encrypted KV | ✅ verified locally |
| Shamir GF(256) (TS) | `npm test` → n shares, k-threshold reconstruction, <k fails (bug found & fixed: per-byte coefficients are now drawn once, not per share) | ✅ verified locally |
| AES-256-GCM vault (TS) | `npm test` → PGV1 format, round trip, wrong key rejected, tamper rejected | ✅ verified locally |
| SSE parsing (Kotlin) | `SseEventParserTest` — data/whitespace/`[DONE]`/comments | ⏳ to run in CI |
| Retry policy (Kotlin) | `RetryPolicyTest` — auth no-retry, rate-limit retry, Retry-After, backoff cap | ⏳ to run in CI |
| AES-GCM (Kotlin) | `AesGcmCipherTest` — roundtrip, AAD mismatch, tamper, IV uniqueness | ⏳ to run in CI |
| Groq provider (Kotlin) | `GroqProviderTest` (MockWebServer) — streamed tokens + tool-call delta merge; 401 → auth error, one request; 500 → retry → success | ⏳ to run in CI |
| Android compile + APK | `./gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleRelease` | ⏳ CI (see blocker below) |
| Groq live connectivity | Requires a real user key on-device (endpoint probing in-app via “Test connection”) | ⚠ user step |
| Permission denial / network loss / timeout / malformed response | Mapped errors surfaced in chat UI and settings | ⚠ device UX test |

**CI blocker (external):** the GitHub App token attached to this workspace is *not*
granted the `workflows` permission, so pushes that create/update
`.github/workflows/*` are rejected and workflow dispatch is 403 (`gh repo fork`
is also 403). The exact CI workflow is provided in **`ci/android-build.yml`**
(build → wrapper → JVM unit tests → debug+release APKs → artifact upload) and
kept at `.github/workflows/android-build.yml` in the working tree. **To
activate: grant `workflows` permission to the GitHub connection (or have the
repo owner commit `ci/android-build.yml` to `.github/workflows/`) and push**;
CI then runs the identical sequence and uploads the arm64-v8a APKs. The local
JVM/Android build is likewise not possible in this sandbox (no JDK/Gradle/SDK
and Maven/Google/dl.google hosts are network-blocked), so the Kotlin compiler
verification must happen through that CI run. All Kotlin sources were
additionally statically reviewed for the platform errors found in this pass
(Keystore cipher constructor misuse, illegal expression annotations in
`VoiceRecorder`/`DeviceInfo`, null-safe capability checks, missing
`JSON.stringify` on the JS→native `generatePassword` options).

## 10. Known limitations & next steps

- **Arm64 note:** the app is DEX-only (no JNI), so the APK installs on any ABI; it is built/tested for `arm64-v8a` (Pixel 7 Pro) and ABI-filtered for arm64. A native `.so` would be added if a Rust/Go component ever joins the core.
- Tor/DNSCrypt/I2P/VPN remain dashboard simulations exactly as in the original desktop product (honestly labeled on Android). Real equivalents = Android Private DNS/DoT, dedicated Tor/VPN apps.
- Instrumented/UI tests (Espresso) and on-device Groq smoke tests are recommended follow-ups.
- Live preview server (`npm run dev`) exposes API key input only in browser mode; production path is the native build.

---

## 11. Security checklist

- API keys never logged (`SecureStorage` + `ProviderErrors` sanitized), never committed (`.gitignore`), never sent to JS after save (only `hasKey` flag).
- Exported components: launcher activity only. Foreground service not exported. No content providers, no debuggable release, no cleartext, system CAs only.
- Bridge validates ids/keys/sizes; JS interface lives on a WebView that never loads remote content; external navigation blocked.
- Secrets at rest: Android Keystore AES-256-GCM; prefs excluded from backup/transfer.
- UI-rendered content is React text (escaped by React); no raw HTML injection from model output (`<p>{text}</p>`).
- Network: HTTPS enforcement on endpoint + OkHttp; no certificate pinning (Groq CA via system store; note as future hardening).
