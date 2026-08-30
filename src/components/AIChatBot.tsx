import { useCallback, useEffect, useRef, useState } from 'react';
import { Theme, PrivacyStatus } from '../PrivacyDashboard';
import { AgentRuntime, createSystemPrompt } from '../agent/agentRuntime';
import { createDefaultTools } from '../agent/tools';
import { createTransport } from '../agent/transports';
import { ChatMessage } from '../agent/types';
import {
  getConfig,
  kvGet,
  kvPut,
  isNative,
  startRecording,
  stopRecording,
  transcribe
} from '../lib/native';

interface AIChatBotProps {
  onClose: () => void;
  onOpenSettings: () => void;
  theme: Theme;
  getPrivacyStatus: () => PrivacyStatus;
}

interface UiMessage {
  id: string;
  kind: 'user' | 'assistant' | 'tool' | 'error' | 'system';
  text: string;
  toolName?: string;
  toolOk?: boolean;
  timestamp: Date;
  streaming?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  history: ChatMessage[];
}

const SESSIONS_KEY = 'chat.sessions';
const ACTIVE_KEY = 'chat.active';

const fadeId = (() => {
  let n = 0;
  return () => `m${Date.now().toString(36)}_${n++}`;
})();

function uid(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function friendlyError(kind: string, message: string): string {
  switch (kind) {
    case 'auth':
      return 'Invalid Groq API key. Open Settings and add a valid key.';
    case 'rate_limit':
      return 'Groq rate limit reached — retrying shortly is available; please wait a moment.';
    case 'timeout':
      return 'The request timed out. Check your network and try again.';
    case 'network':
      return `Network error: ${message || 'connection failed'}`;
    case 'model_not_found':
      return `Model not found: ${message || 'check the model in Settings'}`;
    case 'server':
      return `Groq server error (${message || 'temporary'}). Try again.`;
    case 'bad_response':
      return `The model returned a malformed response (${message || 'unexpected'}).`;
    case 'cancelled':
      return 'Request cancelled.';
    default:
      return message || 'Something went wrong.';
  }
}

export const AIChatBot = ({ onClose, onOpenSettings, theme, getPrivacyStatus }: AIChatBotProps) => {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: fadeId(),
      kind: 'system',
      text: 'Connected to the Groq-powered agent. Ask about privacy, security, network or device status. In the Android app you can also talk by voice.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [modelLabel, setModelLabel] = useState('loading…');
  const [hasKey, setHasKey] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ kind: string; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<AgentRuntime | null>(null);
  const activeSessionRef = useRef<ChatSession>({ id: '', title: '', createdAt: 0, updatedAt: 0, history: [] });
  const sendingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Restore sessions + config once.
  useEffect(() => {
    void (async () => {
      const cfg = await getConfig().catch(() => null);
      setHasKey(!!cfg?.hasApiKey);
      setModelLabel(cfg?.hasApiKey ? cfg.model : 'no API key');
      const raw = await kvGet(SESSIONS_KEY).catch(() => null);
      let list: ChatSession[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ChatSession[];
          if (Array.isArray(parsed)) list = parsed.slice(0, 20);
        } catch { /* corrupt store: start fresh */ }
      }
      if (list.length === 0) {
        const now = Date.now();
        list = [{ id: uid(), title: 'New session', createdAt: now, updatedAt: now, history: [] }];
        setSessions(list);
        await kvPut(SESSIONS_KEY, JSON.stringify(list)).catch(() => undefined);
      } else {
        setSessions(list);
      }
      const activeRaw = await kvGet(ACTIVE_KEY).catch(() => null);
      const active = list.find((s) => s.id === activeRaw) ?? list[0];
      activeSessionRef.current = active;
      setActiveSessionId(active.id);
    })();
  }, []);

  const persistSessions = useCallback((next: ChatSession[]) => {
    setSessions(next);
    void kvPut(SESSIONS_KEY, JSON.stringify(next.slice(0, 20))).catch(() => undefined);
    void kvPut(ACTIVE_KEY, activeSessionRef.current.id).catch(() => undefined);
  }, []);

  const pushUiMessage = useCallback((msg: UiMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const replaceUiMessage = useCallback((id: string, patch: Partial<UiMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? inputText).trim();
    if (!text || sendingRef.current) return;

    const cfg = await getConfig().catch(() => null);
    if (!cfg?.hasApiKey) {
      setErrorInfo({ kind: 'auth', message: 'Add your Groq API key in Settings first.' });
      return;
    }
    setErrorInfo(null);
    setHasKey(true);
    setModelLabel(cfg.model);

    sendingRef.current = true;
    setIsTyping(true);
    pushUiMessage({ id: fadeId(), kind: 'user', text, timestamp: new Date() });
    setInputText('');

    const aiId = fadeId();
    pushUiMessage({ id: aiId, kind: 'assistant', text: '', timestamp: new Date(), streaming: true });

    const session = activeSessionRef.current;
    const history = [...session.history, { role: 'user' as const, content: text }];

    const runtime = new AgentRuntime({
      systemPrompt: await createSystemPrompt(),
      transport: createTransport(),
      tools: createDefaultTools(),
      toolContext: {
        kvGet: (key) => kvGet(key),
        kvPut: (key, value) => kvPut(key, value),
        getPrivacyStatus: () => {
          const s = getPrivacyStatus();
          return { tor: s.tor, dnscrypt: s.dnscrypt, i2p: s.i2p, vpn: s.vpn };
        }
      },
      model: cfg.model
    });
    runtimeRef.current = runtime;

    let assistantText = '';
    const result = await runtime.run(history, text, {
      onToken: (t) => {
        assistantText += t;
        replaceUiMessage(aiId, { text: assistantText });
      },
      onToolCall: (call) => {
        pushUiMessage({
          id: fadeId(),
          kind: 'tool',
          text: `Running ${call.name}…`,
          toolName: call.name,
          timestamp: new Date()
        });
      },
      onToolResult: (name, ok) => {
        const toolMsg = `Tool ${name} ${ok ? 'completed' : 'failed'}`;
        setMessages((prev) => {
          const idx = [...prev].reverse().findIndex((m) => m.kind === 'tool');
          if (idx < 0) return prev;
          const real = prev.length - 1 - idx;
          const copy = [...prev];
          copy[real] = { ...copy[real], text: toolMsg, toolOk: ok };
          return copy;
        });
      },
      onDone: () => {
        replaceUiMessage(aiId, { streaming: false });
        const updated: ChatSession = {
          ...session,
          updatedAt: Date.now(),
          history: [...history, { role: 'assistant', content: assistantText || '(no reply)' }]
        };
        updated.title = text.length > 42 ? `${text.slice(0, 42)}…` : text;
        activeSessionRef.current = updated;
        persistSessions(sessions.map((s) => (s.id === session.id ? updated : s)));
        sendingRef.current = false;
        setIsTyping(false);
      },
      onError: (e) => {
        replaceUiMessage(aiId, { streaming: false, text: assistantText || '' });
        setErrorInfo(e);
        sendingRef.current = false;
        setIsTyping(false);
      }
    });

    if (result.finishReason === 'error') {
      // error already surfaced via onError
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleStop = () => {
    runtimeRef.current?.cancel();
    runtimeRef.current = null;
    sendingRef.current = false;
    setIsTyping(false);
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
  };

  const handleNewSession = () => {
    const now = Date.now();
    const fresh: ChatSession = { id: uid(), title: 'New session', createdAt: now, updatedAt: now, history: [] };
    activeSessionRef.current = fresh;
    persistSessions([fresh, ...sessions]);
    setActiveSessionId(fresh.id);
    setMessages([{ id: fadeId(), kind: 'system', text: 'New session started.', timestamp: new Date() }]);
  };

  const handleSwitchSession = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    activeSessionRef.current = s;
    setActiveSessionId(id);
    void kvPut(ACTIVE_KEY, id);
    const context = s.history.length
      ? `Session restored (${s.history.length} prior messages). Ask a follow-up question, or start a new session.`
      : 'Session started. Ask about privacy, security, network or device status.';
    setMessages([
      { id: fadeId(), kind: 'system', text: context, timestamp: new Date() },
      ...s.history
        .filter((m) => m.content)
        .map((m) => ({
          id: fadeId(),
          kind: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          text: String(m.content),
          timestamp: new Date()
        }))
    ]);
  };

  const handleVoice = async () => {
    if (isRecording) {
      setIsRecording(false);
      try {
        await stopRecording();
        setIsTyping(true);
        const text = await transcribe();
        setIsTyping(false);
        if (text) {
          setInputText(text);
        }
      } catch (e) {
        setIsTyping(false);
        setErrorInfo({ kind: 'unknown', message: e instanceof Error ? e.message : 'Voice capture failed' });
      }
      return;
    }
    if (!isNative()) {
      setErrorInfo({ kind: 'unknown', message: 'Voice input is only available in the Android app.' });
      return;
    }
    try {
      await startRecording();
      setIsRecording(true);
    } catch (e) {
      setErrorInfo({ kind: 'unknown', message: e instanceof Error ? e.message : 'Could not start recording' });
    }
  };

  const bubbleClass = (kind: UiMessage['kind'], user: boolean) => {
    if (kind === 'error') return theme.cyberpunk ? 'bg-red-900/40 border-red-500/60 text-red-200' : 'bg-red-50 border-red-200 text-red-700';
    if (kind === 'system') return theme.cyberpunk ? 'bg-gray-800/60 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600';
    if (kind === 'tool') return theme.cyberpunk ? 'bg-purple-900/40 border-purple-500/50 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-700';
    return user
      ? theme.cyberpunk
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        : 'bg-blue-500 text-white'
      : theme.cyberpunk
        ? 'bg-gray-800 text-gray-200 border border-gray-700'
        : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-end p-4 ${theme.cyberpunk ? 'bg-black/50 backdrop-blur-sm' : 'bg-gray-900/50'}`}>
      <div className={`w-full max-w-md h-[85vh] rounded-xl shadow-2xl flex flex-col ${
        theme.cyberpunk
          ? 'bg-gradient-to-b from-gray-900 to-black border border-purple-500/50'
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.cyberpunk ? 'border-purple-500/30' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              theme.cyberpunk ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}>
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <div>
              <h3 className={`font-semibold ${theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
                PrivacyGuard AI
              </h3>
              <p className={`text-xs ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'}`}>
                {isNative() ? 'Android • Groq' : 'Browser dev'} {hasKey ? `• ${modelLabel}` : '• no key'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <select
              value={activeSessionId}
              onChange={(e) => handleSwitchSession(e.target.value)}
              aria-label="Sessions"
              className={`text-xs rounded-lg px-2 py-1.5 border max-w-28 ${
                theme.cyberpunk ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.title.slice(0, 18)}</option>
              ))}
            </select>
            <button
              onClick={handleNewSession}
              title="New session"
              className={`p-2 rounded-lg ${theme.cyberpunk ? 'hover:bg-purple-900/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.cyberpunk ? 'hover:bg-purple-900/50 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error bar */}
        {errorInfo && (
          <div className={`mx-4 mt-2 px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
            theme.cyberpunk ? 'bg-red-950/50 border border-red-500/50 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <span>{friendlyError(errorInfo.kind, errorInfo.message)}</span>
            <div className="flex space-x-2 shrink-0 ml-2">
              <button onClick={onOpenSettings} className="underline font-medium">Settings</button>
              <button onClick={() => setErrorInfo(null)} className="font-medium">✕</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.kind === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg border ${bubbleClass(message.kind, message.kind === 'user')}`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.text || (message.streaming ? '' : '…')}
                  {message.streaming && <span className={`${theme.cyberpunk ? 'text-cyan-400' : 'text-blue-500'} animate-pulse`}>▌</span>}
                </p>
                <p className={`text-xs mt-1 ${
                  message.kind === 'user'
                    ? theme.cyberpunk ? 'text-purple-100' : 'text-blue-100'
                    : theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isTyping && !messages.some((m) => m.streaming) && (
            <div className="flex justify-start">
              <div className={`px-4 py-2 rounded-lg ${theme.cyberpunk ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-100 text-gray-800'}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${theme.cyberpunk ? 'border-purple-500/30' : 'border-gray-200'}`}>
          <div className="flex space-x-2">
            <button
              onClick={() => void handleVoice()}
              title="Voice input"
              className={`px-3 rounded-lg transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : theme.cyberpunk
                    ? 'bg-purple-900/40 border border-purple-500/40 text-purple-300 hover:bg-purple-800/50'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isRecording ? '⏹' : '🎙'}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? 'Listening… speak now' : 'Ask about privacy, security, device…'}
              className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                theme.cyberpunk
                  ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-purple-500'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-500 border border-gray-300 focus:ring-blue-500'
              }`}
            />
            {isTyping ? (
              <button
                onClick={handleStop}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  theme.cyberpunk
                    ? 'bg-red-800/70 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                ■Stop
              </button>
            ) : (
              <button
                onClick={() => void sendMessage()}
                disabled={!inputText.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !inputText.trim()
                    ? theme.cyberpunk
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : theme.cyberpunk
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
