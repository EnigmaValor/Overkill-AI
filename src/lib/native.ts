/**
 * PrivacyGuard Pro — Android bridge.
 *
 * The app runs as a hardened WebView hosting the React UI. This module is the
 * single typed interface between the web layer and the native Android layer
 * (Kotlin, see android/app/src/main/java/ai/overkill/privacyguard).
 *
 * Every call is request/response over a channel identified by `requestId`.
 * Native emits events into `window.__privacyBridgeEvent(<json>)`; results are
 * delivered as `{ id, type: 'result', value }` or `{ id, type: 'result', error }`.
 * Streaming chat calls additionally emit `token | tool_call | done | error | cancelled`.
 *
 * Outside Android (browser dev server) only the web fallbacks are used and
 * `isNative()` returns false.
 */

export interface DeviceInfo {
  packageName: string
  versionName: string
  versionCode: number
  sdkInt: number
  manufacturer: string
  model: string
  abi: string
  isArm64: boolean
  webViewVersion: string
}

export interface AppConfigInfo {
  hasApiKey: boolean
  model: string
  baseUrl: string
  schedulerEnabled: boolean
  schedulerHours: number
  recordingSupported: boolean
  native: boolean
}

export interface NetworkStatus {
  connected: boolean
  validated: boolean
  type: string
}

export interface ProviderError {
  kind: string // auth | rate_limit | timeout | network | bad_response | model_not_found | server | invalid_key | cancelled | unknown
  message: string
  retryable: boolean
}

export interface ToolCallPayload {
  id: string
  name: string
  arguments: string
}

export interface ChatStreamHandlers {
  onToken: (text: string) => void
  onToolCall: (call: ToolCallPayload) => void
  onDone: (finishReason: string, usage?: Record<string, unknown>) => void
  onError: (error: ProviderError) => void
  onCancelled: () => void
}

export interface ChatStream {
  cancel: () => void
}

type BridgeFn = (...args: unknown[]) => void

interface BridgeWindow extends Window {
  PrivacyBridge?: Record<string, BridgeFn>
  __privacyBridgeEvent?: (json: string) => void
}

const MAX_REQUESTS = 64
let requestCounter = 0

const pending = new Map<
  string,
  { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: number }
>()

const streams = new Map<string, ChatStreamHandlers>()

/** True when running inside the native Android WebView. */
export function isNative(): boolean {
  return typeof window !== 'undefined' && !!(window as BridgeWindow).PrivacyBridge
}

function requireBridge(): Record<string, BridgeFn> {
  const b = (window as BridgeWindow).PrivacyBridge
  if (!b) throw new Error('Native bridge is not available')
  return b
}

function requestId(prefix: string): string {
  requestCounter = (requestCounter + 1) % 1_000_000
  return `${prefix}_${Date.now().toString(36)}_${requestCounter}`
}

function handleEvent(raw: string): void {
  let ev: { id: string; type: string; value?: unknown; error?: ProviderError; [k: string]: unknown }
  try {
    ev = JSON.parse(raw) as typeof ev
  } catch {
    return
  }
  if (!ev || typeof ev.id !== 'string') return

  const stream = streams.get(ev.id)
  if (stream) {
    const emit = (fn: ((...args: never[]) => void) | undefined, ...args: unknown[]) => {
      try {
        if (fn) (fn as (...a: unknown[]) => void)(...args)
      } catch {
        /* UI handlers must never break the stream */
      }
    }
    switch (ev.type) {
      case 'token':
        emit(stream.onToken as never, ev.content as string)
        return
      case 'tool_call':
        emit(stream.onToolCall as never, ev.call as ToolCallPayload)
        return
      case 'done':
        emit(stream.onDone as never, ev.finishReason as string, ev.usage as Record<string, unknown>)
        return
      case 'error':
        emit(stream.onError as never, (ev.error ?? { kind: 'unknown', message: 'unknown error', retryable: false }) as ProviderError)
        return
      case 'cancelled':
        emit(stream.onCancelled as never)
        return
      case 'result':
        return
      default:
        return
    }
  }

  const p = pending.get(ev.id)
  if (!p) return
  pending.delete(ev.id)
  window.clearTimeout(p.timer)
  if (ev.type === 'result') {
    if (ev.error) {
      p.reject(
        new Error(
          `${ev.error.kind}: ${ev.error.message}`,
        ),
      )
    } else {
      p.resolve(ev.value)
    }
  }
}

if (typeof window !== 'undefined') {
  ;(window as BridgeWindow).__privacyBridgeEvent = handleEvent
}

/** Low-level call into the native bridge. */
export function callNative<R = unknown>(method: string, args: unknown[] = [], timeoutMs = 60000): Promise<R> {
  if (!isNative()) {
    return Promise.reject(new Error('Native bridge is not available'))
  }
  const id = requestId(method)
  return new Promise<R>((resolve, reject) => {
    if (pending.size >= MAX_REQUESTS) {
      reject(new Error('Too many pending native requests'))
      return
    }
    const timer = window.setTimeout(() => {
      pending.delete(id)
      reject(new Error('Native request timed out'))
    }, timeoutMs)
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer })
    try {
      ;(requireBridge()[method] as BridgeFn)(id, ...args)
    } catch (e) {
      pending.delete(id)
      window.clearTimeout(timer)
      reject(e instanceof Error ? e : new Error(String(e)))
    }
  })
}

export function openChatStream(messages: unknown, options: unknown, handlers: ChatStreamHandlers): ChatStream {
  const id = requestId('chat')
  streams.set(id, handlers)
  try {
    ;(requireBridge().chat as BridgeFn)(id, JSON.stringify(messages), JSON.stringify(options))
  } catch (e) {
    streams.delete(id)
    handlers.onError({ kind: 'unknown', message: e instanceof Error ? e.message : String(e), retryable: false })
    return { cancel: () => undefined }
  }
  return {
    cancel: () => {
      try {
        ;(requireBridge().cancelChat as BridgeFn)(id)
      } catch {
        /* already gone */
      }
    }
  }
}

/* ------------------------------- web fallbacks ------------------------------- */

const WEB_PREFIX = 'pg:'

function webGet(key: string): string | null {
  try {
    return window.localStorage.getItem(WEB_PREFIX + key)
  } catch {
    return null
  }
}

function webSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(WEB_PREFIX + key, value)
  } catch {
    /* storage full / unavailable */
  }
}

function webDel(key: string): void {
  try {
    window.localStorage.removeItem(WEB_PREFIX + key)
  } catch {
    /* ignore */
  }
}

/* --------------------------------- public API -------------------------------- */

export interface ProviderInfo {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
}

/** Encrypted-at-rest KV store (Android Keystore on device, localStorage in browser). */
export async function kvPut(key: string, value: string): Promise<void> {
  if (!/^[a-zA-Z0-9:._-]{1,128}$/.test(key)) throw new Error('invalid key')
  if (isNative()) {
    await callNative('kvPut', [key, value], 30000)
  } else {
    webSet(key, value)
  }
}

export async function kvGet(key: string): Promise<string | null> {
  if (!/^[a-zA-Z0-9:._-]{1,128}$/.test(key)) throw new Error('invalid key')
  if (isNative()) {
    return (await callNative<string | null>('kvGet', [key], 30000)) ?? null
  }
  return webGet(key)
}

export async function kvDelete(key: string): Promise<void> {
  if (isNative()) {
    await callNative('kvDelete', [key], 30000)
  } else {
    webDel(key)
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (isNative()) return callNative<DeviceInfo>('getDeviceInfo', [])
  const ua = navigator.userAgent
  const match = /Android (\d+)/.exec(ua)
  return {
    packageName: 'browser',
    versionName: '1.0.0',
    versionCode: 1,
    sdkInt: match ? parseInt(match[1], 10) : 0,
    manufacturer: navigator.platform || 'browser',
    model: 'Browser',
    abi: 'wasm',
    isArm64: false,
    webViewVersion: 'n/a'
  }
}

export async function getConfig(): Promise<AppConfigInfo> {
  if (isNative()) return callNative<AppConfigInfo>('getConfig', [])
  return {
    hasApiKey: !!webGet('groq.apikey'),
    model: webGet('groq.model') || 'llama-3.3-70b-versatile',
    baseUrl: webGet('groq.baseUrl') || 'https://api.groq.com/openai/v1',
    schedulerEnabled: false,
    schedulerHours: 24,
    recordingSupported: false,
    native: false
  }
}

export async function setApiKey(value: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{8,256}$/.test(value)) throw new Error('API key looks invalid')
  if (isNative()) await callNative('setApiKey', [value], 30000)
  else webSet('groq.apikey', value)
}

export async function clearApiKey(): Promise<void> {
  if (isNative()) await callNative('setApiKey', [''], 30000)
  else webDel('groq.apikey')
}

export async function setModel(model: string): Promise<void> {
  if (!/^[A-Za-z0-9_.:/-]{1,64}$/.test(model)) throw new Error('invalid model id')
  if (isNative()) await callNative('setModel', [model], 30000)
  else webSet('groq.model', model)
}

export async function setBaseUrl(url: string): Promise<void> {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    throw new Error('invalid base URL')
  }
  if (u.protocol !== 'https:' && !(u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
    throw new Error('base URL must use HTTPS (localhost allowed for development)')
  }
  if (isNative()) await callNative('setBaseUrl', [url], 30000)
  else webSet('groq.baseUrl', url)
}

export async function setScheduler(enabled: boolean, hours: number): Promise<void> {
  const h = Math.min(168, Math.max(1, Math.round(hours)))
  if (isNative()) await callNative('setScheduler', [enabled, h], 30000)
  else webSet('scheduler.enabled', String(enabled))
}

export async function runCheckNow(): Promise<void> {
  if (isNative()) await callNative('runCheckNow', [], 30000)
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (isNative()) return callNative<NetworkStatus>('getNetworkStatus', [])
  return {
    connected: navigator.onLine,
    validated: navigator.onLine,
    type: 'browser'
  }
}

export interface CheckResult {
  ok: boolean
  latencyMs: number
  model: string
  message?: string
}

export async function testConnection(): Promise<CheckResult> {
  if (isNative()) return callNative<CheckResult>('testConnection', [], 90000)
  const cfg = await getConfig()
  if (!cfg.hasApiKey) throw new Error('Groq API key not configured')
  const t0 = performance.now()
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${webGet('groq.apikey')}` },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: 'Reply with the single word: ready' }],
      max_tokens: 8,
      stream: false
    })
  })
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text().catch(() => '')}`)
  return { ok: true, latencyMs: Math.round(performance.now() - t0), model: cfg.model }
}

export async function requestPermission(kind: 'notifications' | 'microphone'): Promise<{ granted: boolean }> {
  if (isNative()) return callNative<{ granted: boolean }>('requestPermission', [kind], 120000)
  if (kind === 'notifications' && 'Notification' in window) {
    const res = await Notification.requestPermission()
    return { granted: res === 'granted' }
  }
  return { granted: false }
}

/* Voice recording — native only. */
export async function startRecording(): Promise<void> {
  if (isNative()) await callNative('startRecording', [], 10000)
  else throw new Error('Voice recording is only available in the Android app')
}

export async function stopRecording(): Promise<void> {
  if (isNative()) await callNative('stopRecording', [], 20000)
}

export async function transcribe(): Promise<string> {
  const text = isNative() ? await callNative<string>('transcribe', [], 120000) : null
  if (text == null) throw new Error('Voice transcription is only available in the Android app')
  return text
}

/* Crypto helpers backed by the native Keystore (Android) or WebCrypto (browser). */
export async function launchVaultExport(fileName: string, mime: string, content: string): Promise<void> {
  if (isNative()) await callNative('exportFile', [fileName, mime, content], 120000)
  else {
    const blob = new Blob([content], { type: mime })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
  }
}

export interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

export async function generatePassword(options: PasswordOptions): Promise<string> {
  if (isNative()) return callNative<string>('generatePassword', [
    options.length ?? 16,
    {
      uppercase: !!options.uppercase,
      lowercase: !!options.lowercase,
      numbers: !!options.numbers,
      symbols: !!options.symbols
    }
  ])
  let charset = ''
  if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (options.numbers) charset += '0123456789'
  if (options.symbols) charset += '!@#$%^&*()-_=+[]{};:,.<>?'
  if (!charset) return ''
  const len = Math.min(64, Math.max(6, options.length || 16))
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  let out = ''
  for (let i = 0; i < len; i++) out += charset[bytes[i] % charset.length]
  return out
}
