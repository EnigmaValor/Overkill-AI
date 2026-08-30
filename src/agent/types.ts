/** Shared agent types. */

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ToolCall {
  id: string
  name: string
  arguments: string
}

export interface ChatMessage {
  role: ChatRole
  content?: string | null
  toolCalls?: ToolCall[]
  toolCallId?: string
  name?: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface StreamHandlers {
  onToken: (text: string) => void
  onToolCall: (call: ToolCall) => void
  onToolResult: (name: string, ok: boolean, summary?: string) => void
  onDone: (finishReason: string, usage?: Record<string, unknown>) => void
  onError: (error: { kind: string; message: string; retryable: boolean }) => void
}

export interface ChatStream {
  cancel: () => void
}

export interface ChatTransport {
  open(messages: ChatMessage[], options: ChatOptions, handlers: StreamHandlers): ChatStream
}

export interface ToolContext {
  /** Encrypted KV (Android Keystore / localStorage); stored JSON strings. */
  kvGet: (key: string) => Promise<string | null>
  kvPut: (key: string, value: string) => Promise<void>
  /** Values read from the running UI. */
  getPrivacyStatus?: () => { tor: boolean; dnscrypt: boolean; i2p: boolean; vpn: boolean }
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>
}
