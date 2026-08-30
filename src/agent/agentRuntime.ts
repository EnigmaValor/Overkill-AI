import { ChatMessage, ChatOptions, StreamHandlers, ToolContext, ToolDefinition, ToolCall } from './types'
import { isNative, getConfig } from '../lib/native'

const MAX_TOOL_TURNS = 4

export interface RunResult {
  messages: ChatMessage[]
  finishReason: string
  usage?: Record<string, unknown>
}

export interface RuntimeCallbacks {
  onToken: (text: string) => void
  onToolCall: (call: ToolCall) => void
  onToolResult: (name: string, ok: boolean, summary?: string) => void
  onDone: (finishReason: string, usage?: Record<string, unknown>) => void
  onError: (e: { kind: string; message: string; retryable: boolean }) => void
}

export interface AgentRuntimeOptions {
  systemPrompt: string
  transport: {
    open(messages: ChatMessage[], options: ChatOptions, handlers: StreamHandlers): { cancel: () => void }
  }
  tools: ToolDefinition[]
  toolContext: ToolContext
  model?: string
}

interface ExchangeOutcome {
  content: string
  toolCalls: ToolCall[]
  finishReason: string
  usage?: Record<string, unknown>
  failed: boolean
  error?: { kind: string; message: string; retryable: boolean }
}

/**
 * Agent loop: model stream → tool calls → tool execution → follow-up turns.
 * Streaming, cancellation and structured errors are propagated through
 * callbacks so the UI can render them without blocking.
 */
export class AgentRuntime {
  private current: { cancel: () => void } | null = null
  private readonly systemPrompt: string
  private readonly transport: AgentRuntimeOptions['transport']
  private readonly tools: ToolDefinition[]
  private readonly toolContext: ToolContext
  private readonly model: string

  constructor(options: AgentRuntimeOptions) {
    this.systemPrompt = options.systemPrompt
    this.transport = options.transport
    this.tools = options.tools
    this.toolContext = options.toolContext
    this.model = options.model ?? 'llama-3.3-70b-versatile'
  }

  cancel(): void {
    this.current?.cancel()
    this.current = null
  }

  async run(history: ChatMessage[], userText: string, cb: RuntimeCallbacks): Promise<RunResult> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...history,
      { role: 'user', content: userText }
    ]
    let finishReason = 'stop'
    let usage: Record<string, unknown> | undefined

    try {
      for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
        const outcome = await this.exchange(messages, cb)
        finishReason = outcome.finishReason
        usage = outcome.usage
        if (outcome.failed) {
          return { messages: [], finishReason: 'error', usage }
        }
        if (outcome.toolCalls.length === 0) break

        messages.push({
          role: 'assistant',
          content: outcome.content || null,
          toolCalls: outcome.toolCalls
        })

        for (const call of outcome.toolCalls) {
          const def = this.tools.find((t) => t.name === call.name)
          let output: string
          let ok = false
          try {
            const args = parseToolArgs(call.arguments)
            output = def ? await def.handler(args, this.toolContext) : JSON.stringify({ ok: false, error: `unknown tool: ${call.name}` })
            ok = def != null
          } catch (e) {
            output = JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) })
          }
          cb.onToolResult(call.name, ok, output.slice(0, 120))
          messages.push({ role: 'tool', toolCallId: call.id, name: call.name, content: output })
        }
      }

      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
      return {
        messages: [lastAssistant ?? { role: 'assistant', content: '' }],
        finishReason,
        usage
      }
    } catch (e) {
      const err = {
        kind: 'unknown',
        message: e instanceof Error ? e.message : String(e),
        retryable: false
      }
      cb.onError(err)
      return { messages: [], finishReason: 'error', usage }
    }
  }

  private exchange(messages: ChatMessage[], cb: RuntimeCallbacks): Promise<ExchangeOutcome> {
    return new Promise((resolve) => {
      let content = ''
      const toolCalls: ToolCall[] = []
      let finishReason = 'stop'
      let usage: Record<string, unknown> | undefined
      let settled = false

      const finish = (extra?: { failed?: boolean; error?: { kind: string; message: string; retryable: boolean } }) => {
        if (settled) return
        settled = true
        this.current = null
        resolve({
          content,
          toolCalls,
          finishReason,
          usage,
          failed: extra?.failed ?? false,
          error: extra?.error
        })
      }

      this.current = this.transport.open(messages, { model: this.model }, {
        onToken: (t) => {
          content += t
          cb.onToken(t)
        },
        onToolCall: (c) => {
          toolCalls.push(c)
          cb.onToolCall(c)
        },
        onDone: (reason, u) => {
          finishReason = reason
          usage = u
          finish()
        },
        onError: (e) => {
          cb.onError(e)
          finish({ failed: true, error: e })
        },
        onToolResult: () => undefined
      })
    })
  }
}

function parseToolArgs(raw: string): Record<string, unknown> {
  if (!raw || !raw.trim()) return {}
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export const DEFAULT_SYSTEM_PROMPT = `You are PrivacyGuard Pro, the assistant embedded in a privacy and security dashboard for Android (GrapheneOS-ready). You help with privacy tooling, security questions, password hygiene, and device management.

Rules:
- Be concise and practical. Mobile screen: prefer short answers, bullets and numbered steps.
- Use the provided tools for real state (privacy service status, network status, device info, memory, password generation) instead of guessing.
- Never ask for, echo, or store API keys, passwords, or secrets in conversation. Secret handling is done by the device keystore.
- Memory tools persist user preferences across restarts; use them when the user asks you to remember something.
- If a tool fails, explain the failure in one line and suggest the next step.
- Do not claim a service (Tor, DNSCrypt, I2P, VPN) is active unless the tool reports it.`

export async function createSystemPrompt(): Promise<string> {
  const mode = isNative() ? 'Android (native bridge active)' : 'browser (web fallback)'
  let model = ''
  try {
    const cfg = await getConfig()
    if (cfg.hasApiKey) model = cfg.model
  } catch {
    /* ignore */
  }
  return `${DEFAULT_SYSTEM_PROMPT}\n\nRuntime: ${mode}${model ? ` — model: ${model}` : ' — no Groq key configured yet.'}`
}
