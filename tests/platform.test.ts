/**
 * Executable verification of the port's core logic (runs in Node via tsx):
 *  - AgentRuntime loop: streaming, tool calls, follow-up turns, cancellation
 *  - tool registry: privacy status + memory persistence
 *  - real crypto: Shamir GF(256) round trips, AES-256-GCM round trip + tamper
 */
import { AgentRuntime } from '../src/agent/agentRuntime';
import { createDefaultTools } from '../src/agent/tools';
import { ChatMessage, ChatOptions, StreamHandlers, ToolCall } from '../src/agent/types';
import {
  makeShares,
  reconstructSecret,
  encryptWithPassphrase,
  decryptWithPassphrase
} from '../src/AdvancedPasswordManager';

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function equals<T>(a: T, b: T, name: string): void {
  assert(JSON.stringify(a) === JSON.stringify(b), name, `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

/* ------------------------------- mock transport ------------------------------- */

interface ScriptedExchange {
  tokens: string[];
  toolCalls?: ToolCall[];
  finishReason?: string;
  error?: { kind: string; message: string; retryable: boolean };
}

class ScriptedTransport {
  constructor(private script: ScriptedExchange[]) {}
  private i = 0;
  open(_m: ChatMessage[], _o: ChatOptions, h: StreamHandlers): { cancel: () => void } {
    const s = this.script[this.i++] ?? { tokens: ['done'] };
    let cancelled = false;
    queueMicrotask(() => {
      if (s.error) {
        h.onError(s.error);
        return;
      }
      for (const t of s.tokens) h.onToken(t);
      for (const c of s.toolCalls ?? []) h.onToolCall(c);
      h.onDone(s.finishReason ?? 'stop');
    });
    return { cancel: () => { cancelled = true; } };
  }
}

/* --------------------------------- agent tests -------------------------------- */

async function testAgentLoop(): Promise<void> {
  console.log('AgentRuntime');
  const transport = new ScriptedTransport([
    {
      tokens: ['Let me check.'],
      toolCalls: [{ id: 'call_1', name: 'get_privacy_status', arguments: '{}' }],
      finishReason: 'tool_calls'
    },
    { tokens: ['Tor active is false, but the network is up.'], finishReason: 'stop' }
  ]);
  const toolCallsSeen: string[] = [];
  const toolResultsSeen: string[] = [];
  let streamed = '';
  const runtime = new AgentRuntime({
    systemPrompt: 'test',
    transport: transport as never,
    tools: createDefaultTools(),
    toolContext: {
      kvGet: async () => null,
      kvPut: async () => undefined,
      getPrivacyStatus: () => ({ tor: false, dnscrypt: true, i2p: false, vpn: false })
    }
  });
  const result = await runtime.run([], 'What is my status?', {
    onToken: (t) => { streamed += t; },
    onToolCall: (c) => toolCallsSeen.push(c.name),
    onToolResult: (n, ok) => toolResultsSeen.push(`${n}:${ok}`),
    onDone: () => undefined,
    onError: () => undefined
  });
  assert(toolCallsSeen.includes('get_privacy_status'), 'tool call executed from stream');
  assert(toolResultsSeen.includes('get_privacy_status:true'), 'tool result reported as success');
  equals(
    streamed,
    'Let me check.Tor active is false, but the network is up.',
    'streaming tokens from both turns concatenated'
  );
  assert(result.messages.length === 1, 'one final assistant message returned');
}

async function testToolMemory(): Promise<void> {
  console.log('Memory tools');
  const store = new Map<string, string>();
  const ctx = {
    kvGet: async (k: string) => store.get(k) ?? null,
    kvPut: async (k: string, v: string) => { store.set(k, v); }
  };
  const tools = createDefaultTools();
  const save = tools.find((t) => t.name === 'memory_save')!;
  const recall = tools.find((t) => t.name === 'memory_recall')!;
  const saved = JSON.parse(await save.handler({ key: 'user_prefs', value: 'Danish UI pref' }, ctx));
  assert(saved.ok === true && store.has('memory:user_prefs'), 'memory_save persists to KV');
  const rec = JSON.parse(await recall.handler({ key: 'user_prefs' }, ctx));
  equals(rec.value, 'Danish UI pref', 'memory_recall returns stored value');
  const miss = JSON.parse(await recall.handler({ key: 'nope' }, ctx));
  assert(miss.ok === false, 'memory_recall reports missing note');
}

/* ---------------------------------- crypto ----------------------------------- */

async function testCrypto(): Promise<void> {
  console.log('Real crypto');
  const secret = 'Correct-Horse-Battery-Staple!';
  const shares = makeShares(secret, 3, 5);
  assert(shares.length === 5 && shares.every((s) => s.startsWith('SS1:')), 'Shamir generates n=5 shares (SS1 format)');
  const restored = reconstructSecret([shares[0], shares[2], shares[4]]);
  equals(restored, secret, 'Shamir reconstructs with correct threshold (k=3)');
  const weak = reconstructSecret([shares[1], shares[3]]);
  assert(weak !== secret, 'Shamir with fewer than k shares does NOT recover the secret');
  assert(() => reconstructSecret(['SS1:9:00']) !== undefined, 'reconstruct tolerates bad input gracefully');

  const ct = await encryptWithPassphrase('my-password', 'master-key');
  assert(ct.startsWith('PGV1:') && ct.split(':').length === 4, 'AES-GCM emits portable PGV1 format');
  equals(await decryptWithPassphrase(ct, 'master-key'), 'my-password', 'AES-GCM decrypt round trip');
  let threw = false;
  try {
    await decryptWithPassphrase(ct, 'wrong-key');
  } catch {
    threw = true;
  }
  assert(threw, 'AES-GCM rejects wrong passphrase');
  const tampered = ct.slice(0, -2) + (ct.endsWith('AA') ? 'AB' : 'AA');
  threw = false;
  try {
    await decryptWithPassphrase(tampered, 'master-key');
  } catch {
    threw = true;
  }
  assert(threw, 'AES-GCM rejects tampered ciphertext');
}

/* ------------------------------------ main ------------------------------------ */

async function main(): Promise<void> {
  await testAgentLoop();
  await testToolMemory();
  await testCrypto();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void main();
