import { ToolContext, ToolDefinition } from './types'
import { getDeviceInfo, getNetworkStatus, generatePassword } from '../lib/native'

/**
 * Tool registry executed by the agent loop in the web layer.
 * Native-only privileges (audio, Keystore secrets, exports) stay in Kotlin;
 * these tools read UI/device state that the web layer already owns.
 */
export function createDefaultTools(): ToolDefinition[] {
  return [
    {
      name: 'get_privacy_status',
      description:
        'Read the current status of the privacy services shown in the dashboard (Tor, DNSCrypt, I2P, VPN) and the overall security level.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      handler: async (_args, ctx) => {
        const s = ctx.getPrivacyStatus?.() ?? { tor: false, dnscrypt: false, i2p: false, vpn: false }
        const active = [s.tor, s.dnscrypt, s.i2p, s.vpn].filter(Boolean).length
        const overall = active === 0 ? 'danger' : active < 2 ? 'warning' : 'secure'
        return JSON.stringify({ ...s, overall, detail: 'privacy service status from the running dashboard' })
      }
    },
    {
      name: 'get_network_status',
      description: 'Check real device network connectivity (Android ConnectivityManager).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => JSON.stringify(await getNetworkStatus())
    },
    {
      name: 'get_device_info',
      description: 'Read Android device/build information (model, ABI, Android version, WebView version).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      handler: async () => JSON.stringify(await getDeviceInfo())
    },
    {
      name: 'generate_password',
      description: 'Generate a cryptographically secure random password.',
      parameters: {
        type: 'object',
        properties: {
          length: { type: 'number', description: 'Default 16, max 64' },
          uppercase: { type: 'boolean' },
          lowercase: { type: 'boolean' },
          numbers: { type: 'boolean' },
          symbols: { type: 'boolean' }
        },
        additionalProperties: false
      },
      handler: async (args) => {
        const password = await generatePassword({
          length: typeof args.length === 'number' ? args.length : 16,
          uppercase: args.uppercase !== false,
          lowercase: args.lowercase !== false,
          numbers: args.numbers !== false,
          symbols: args.symbols !== false
        })
        return JSON.stringify({ password, note: 'generated with a CSPRNG; do not log or share it' })
      }
    },
    {
      name: 'memory_save',
      description:
        'Persist a note to long-term memory. Use for user preferences, facts, or reminders that survive restarts.',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Short memory identifier, e.g. user_prefs' },
          value: { type: 'string', description: 'Value to remember' }
        },
        required: ['key', 'value'],
        additionalProperties: false
      },
      handler: async (args, ctx) => {
        const key = String(args.key ?? '').slice(0, 64)
        const value = String(args.value ?? '').slice(0, 8000)
        if (!key) return JSON.stringify({ ok: false, error: 'key is required' })
        await ctx.kvPut(`memory:${key}`, value)
        return JSON.stringify({ ok: true, key, stored: true })
      }
    },
    {
      name: 'memory_recall',
      description: 'Recall a previously saved long-term memory note.',
      parameters: {
        type: 'object',
        properties: { key: { type: 'string', description: 'Memory key to read.' } },
        required: ['key'],
        additionalProperties: false
      },
      handler: async (args, ctx) => {
        const key = String(args.key ?? '').slice(0, 64)
        const value = await ctx.kvGet(`memory:${key}`)
        return value == null
          ? JSON.stringify({ ok: false, error: `no note stored under '${key}'` })
          : JSON.stringify({ ok: true, key, value })
      }
    }
  ]
}

/** Context used by unit tests. */
export function createDummyContext(): ToolContext {
  return {
    kvGet: async () => null,
    kvPut: async () => undefined,
    getPrivacyStatus: () => ({ tor: false, dnscrypt: false, i2p: false, vpn: false })
  }
}
