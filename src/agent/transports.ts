import {
  ChatStream,
  ChatTransport,
  ChatMessage,
  ChatOptions,
  StreamHandlers,
  ToolCall
} from './types'
import { isNative, openChatStream, getConfig, ProviderError } from '../lib/native'

/**
 * Native transport: the Kotlin Groq client performs HTTPS + SSE parsing and
 * retries; tool_call deltas are merged natively and emitted as complete calls.
 */
export class NativeTransport implements ChatTransport {
  open(messages: ChatMessage[], options: ChatOptions, handlers: StreamHandlers): ChatStream {
    return openChatStream(messages, options, {
      onToken: handlers.onToken,
      onToolCall: (call) => handlers.onToolCall(call),
      onDone: handlers.onDone,
      onError: handlers.onError,
      onCancelled: () => handlers.onError({ kind: 'cancelled', message: 'Request cancelled', retryable: false })
    })
  }
}

/* ------------------------------- web transport ------------------------------- */

interface WebToolCallDelta {
  index?: number
  id?: string
  type?: string
  function?: { name?: string; arguments?: string }
}

interface WebStreamLine {
  content?: string
  tool_calls?: WebToolCallDelta[]
  finish_reason?: string | null
}

interface WebChunk {
  choices?: { delta?: WebStreamLine; message?: WebStreamLine; finish_reason?: string | null }[]
  usage?: Record<string, unknown>
  error?: { message?: string; type?: string; code?: string }
}

function mapHttpError(status: number, body: string): ProviderError {
  let message = body.slice(0, 300)
  let kind = 'unknown'
  try {
    const j = JSON.parse(body) as WebChunk
    if (j.error?.message) message = j.error.message
    if (j.error?.code) kind = String(j.error.code)
  } catch {
    /* non-JSON error body */
  }
  if (status === 401 || status === 403) return { kind: 'auth', message: message || 'Invalid Groq API key', retryable: false }
  if (status === 404) return { kind: 'model_not_found', message: message || 'Model not found', retryable: false }
  if (status === 429) return { kind: 'rate_limit', message: message || 'Rate limited by Groq', retryable: true }
  if (status === 400) return { kind: 'bad_response', message: message || 'Bad request', retryable: false }
  if (status >= 500) return { kind: 'server', message: message || 'Groq server error', retryable: true }
  return { kind: kind || 'unknown', message, retryable: false }
}

/** Browser fallback used by the dev server; uses fetch + SSE directly. */
export class WebTransport implements ChatTransport {
  private controller: AbortController | null = null

  open(messages: ChatMessage[], options: ChatOptions, handlers: StreamHandlers): ChatStream {
    this.controller = new AbortController()
    const signal = this.controller.signal

    void (async () => {
      const cfg = await getConfig()
      const key = localStorage.getItem('pg:groq.apikey')
      if (!key) {
        handlers.onError({ kind: 'auth', message: 'Groq API key not configured', retryable: false })
        return
      }
      const body = {
        model: options.model ?? cfg.model,
        messages: messages.map((m) => {
          const base: Record<string, unknown> = { role: m.role, content: m.content ?? '' }
          if (m.toolCalls) base.tool_calls = m.toolCalls.map((t) => ({ id: t.id, type: 'function', function: { name: t.name, arguments: t.arguments } }))
          if (m.toolCallId) base.tool_call_id = m.toolCallId
          if (m.name) base.name = m.name
          return base
        }),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: true
      }

      let res: Response
      try {
        res = await fetch(`${cfg.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify(body),
          signal
        })
      } catch (e) {
        if (signal.aborted) {
          handlers.onError({ kind: 'cancelled', message: 'cancelled', retryable: false })
        } else {
          handlers.onError({ kind: 'network', message: e instanceof Error ? e.message : 'network error', retryable: true })
        }
        return
      }
      if (!res.ok) {
        handlers.onError(mapHttpError(res.status, await res.text().catch(() => '')))
        return
      }
      if (!res.body) {
        handlers.onError({ kind: 'bad_response', message: 'empty response body', retryable: false })
        return
      }

      const toolCalls = new Map<number, { id: string; name: string; args: string }>()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let done = false

      const finish = (finishReason: string) => {
        if (done) return
        done = true
        const calls = [...toolCalls.values()]
          .filter((c) => c.name)
          .map<ToolCall>((c) => ({ id: c.id, name: c.name, arguments: c.args || '{}' }))
        for (const c of calls) handlers.onToolCall(c)
        handlers.onDone(finishReason)
      }

      try {
        for (;;) {
          const { value, done: end } = await reader.read()
          if (end) break
          buffer += decoder.decode(value, { stream: true })
          let idx: number
          while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx).trim()
            buffer = buffer.slice(idx + 1)
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (data === '[DONE]') {
              finish('stop')
              return
            }
            let chunk: WebChunk
            try {
              chunk = JSON.parse(data) as WebChunk
            } catch {
              continue
            }
            if (chunk.error) {
              handlers.onError({ kind: 'bad_response', message: chunk.error.message || 'stream error', retryable: false })
              return
            }
            const choice = chunk.choices?.[0]
            if (!choice) continue
            if (choice.delta?.content) handlers.onToken(choice.delta.content)
            for (const d of choice.delta?.tool_calls ?? []) {
              const index = d.index ?? 0
              const cur = toolCalls.get(index) ?? { id: '', name: '', args: '' }
              if (d.id) cur.id = d.id
              if (d.function?.name) cur.name += d.function.name
              if (d.function?.arguments) cur.args += d.function.arguments
              toolCalls.set(index, cur)
            }
            if (choice.delta?.finish_reason || choice.finish_reason) {
              finish(String(choice.delta?.finish_reason || choice.finish_reason))
              return
            }
          }
        }
        finish(buffer.includes('[DONE]') ? 'stop' : 'stop')
      } catch (e) {
        if (!done) {
          handlers.onError({
            kind: signal.aborted ? 'cancelled' : 'network',
            message: e instanceof Error ? e.message : 'stream error',
            retryable: !signal.aborted
          })
        }
      }
    })()

    return {
      cancel: () => this.controller?.abort()
    }
  }
}

export function createTransport(): ChatTransport {
  return isNative() ? new NativeTransport() : new WebTransport()
}
