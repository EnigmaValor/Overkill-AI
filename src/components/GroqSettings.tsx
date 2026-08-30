import { useEffect, useState } from 'react';
import { Theme } from '../PrivacyDashboard';
import {
  AppConfigInfo,
  DeviceInfo,
  NetworkStatus,
  clearApiKey,
  getConfig,
  getDeviceInfo,
  getNetworkStatus,
  isNative,
  requestPermission,
  runCheckNow,
  setApiKey,
  setBaseUrl,
  setModel,
  setScheduler,
  testConnection
} from '../lib/native';

interface GroqSettingsProps {
  theme: Theme;
}

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'qwen-2.5-32b',
  'mixtral-8x7b-32768'
];

const card = (theme: Theme) =>
  `rounded-xl p-6 ${
    theme.cyberpunk
      ? 'bg-gradient-to-r from-gray-900/20 to-slate-900/20 border border-gray-500/30'
      : 'bg-white shadow-lg'
  }`;

export const GroqSettings = ({ theme }: GroqSettingsProps) => {
  const [config, setConfig] = useState<AppConfigInfo | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModelState] = useState('llama-3.3-70b-versatile');
  const [baseUrl, setBaseUrlState] = useState('https://api.groq.com/openai/v1');
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [schedulerHours, setSchedulerHours] = useState(24);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    void (async () => {
      const [cfg, dev, net] = await Promise.all([
        getConfig().catch(() => null),
        getDeviceInfo().catch(() => null),
        getNetworkStatus().catch(() => null)
      ]);
      if (cfg) {
        setConfig(cfg);
        setModelState(cfg.model);
        setBaseUrlState(cfg.baseUrl);
        setSchedulerEnabled(cfg.schedulerEnabled);
        setSchedulerHours(cfg.schedulerHours);
      }
      setDeviceInfo(dev);
      setNetwork(net);
    })();
  }, []);

  const saveApiKey = async () => {
    setSaveStatus('Saving…');
    try {
      if (apiKeyInput.trim()) {
        await setApiKey(apiKeyInput.trim());
        setApiKeyInput('');
      } else {
        await clearApiKey();
      }
      setSaveStatus('Saved securely (Android Keystore / encrypted storage).');
      setConfig(await getConfig());
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const saveModel = async () => {
    setSaveStatus('Saving model…');
    try {
      await setModel(model);
      setSaveStatus('Model saved.');
      setConfig(await getConfig());
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const saveBaseUrl = async () => {
    setSaveStatus('Saving endpoint…');
    try {
      await setBaseUrl(baseUrl.trim() || 'https://api.groq.com/openai/v1');
      setSaveStatus('Endpoint saved.');
      setConfig(await getConfig());
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const saveScheduler = async () => {
    setSaveStatus('Saving scheduler…');
    try {
      await setScheduler(schedulerEnabled, schedulerHours);
      setSaveStatus('Scheduler saved.');
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult('Contacting Groq…');
    try {
      const r = await testConnection();
      setTestResult(`✓ OK — ${r.model} answered in ${r.latencyMs} ms`);
    } catch (e) {
      setTestResult(`✗ ${e instanceof Error ? e.message : 'connection failed'}`);
    } finally {
      setTesting(false);
    }
  };

  const askNotification = async () => {
    const r = await requestPermission('notifications');
    setSaveStatus(r.granted ? 'Notifications permitted.' : 'Notifications not granted.');
  };

  const askMic = async () => {
    const r = await requestPermission('microphone');
    setSaveStatus(r.granted ? 'Microphone permitted.' : 'Microphone not granted.');
  };

  const inputCls = `w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
    theme.cyberpunk
      ? 'bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-purple-500'
      : 'bg-gray-50 text-gray-800 placeholder-gray-500 border border-gray-300 focus:ring-blue-500'
  }`;

  const btnCls = (primary = false) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      primary
        ? theme.cyberpunk
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
        : theme.cyberpunk
          ? 'bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }`;

  return (
    <div className="space-y-6">
      {/* Groq configuration */}
      <div className={card(theme)}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
          🤖 Groq LLM Backend {!isNative() && <span className="text-xs font-normal opacity-70">(browser mode — key stored in localStorage)</span>}
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              API Key {config?.hasApiKey ? '✓ configured' : '(not configured)'}
            </label>
            <div className="flex space-x-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={config?.hasApiKey ? 'Enter new key to replace, or clear below' : 'gsk_…'}
                className={inputCls}
              />
              <button className={btnCls()} onClick={() => setShowKey((v) => !v)}>👁</button>
              <button className={btnCls(true)} onClick={() => void saveApiKey()} disabled={!apiKeyInput.trim() && !config?.hasApiKey}>
                Save
              </button>
              {config?.hasApiKey && (
                <button className={btnCls()} onClick={() => void saveApiKey()} title="Clear stored key">
                  Clear
                </button>
              )}
            </div>
            <p className={`text-xs mt-1 ${theme.cyberpunk ? 'text-gray-500' : 'text-gray-400'}`}>
              Stored with Android Keystore AES-256-GCM. Never logged. Never leave this device.
            </p>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>Model</label>
            <div className="flex space-x-2">
              <select value={model} onChange={(e) => setModelState(e.target.value)} className={inputCls}>
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                {!MODELS.includes(model) && <option value={model}>{model}</option>}
              </select>
              <button className={btnCls(true)} onClick={() => void saveModel()}>Save</button>
            </div>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              API Base URL <span className="opacity-60">(advanced — must be HTTPS)</span>
            </label>
            <div className="flex space-x-2">
              <input value={baseUrl} onChange={(e) => setBaseUrlState(e.target.value)} className={inputCls} />
              <button className={btnCls()} onClick={() => void saveBaseUrl()}>Save</button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className={btnCls(true)} disabled={testing} onClick={() => void test()}>
              {testing ? 'Testing…' : 'Test connection'}
            </button>
            {testResult && (
              <span className={`text-xs ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>{testResult}</span>
            )}
          </div>
        </div>
      </div>

      {/* Scheduler */}
      <div className={card(theme)}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
          ⏰ Background Security Check
        </h3>
        <p className={`text-sm mb-4 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          WorkManager runs a real network/connectivity check and Groq health probe in the background
          and posts an Android notification with the result.
        </p>
        <div className="flex flex-wrap items-end space-x-3 space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={schedulerEnabled}
              onChange={(e) => setSchedulerEnabled(e.target.checked)}
              className={`w-4 h-4 ${theme.cyberpunk ? 'accent-cyan-400' : 'accent-blue-600'}`}
            />
            <span className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-700'}`}>Enabled</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={1}
              max={168}
              value={schedulerHours}
              onChange={(e) => setSchedulerHours(parseInt(e.target.value || '24', 10))}
              className={`w-20 ${inputCls}`}
            />
            <span className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>hours</span>
          </div>
          <button className={btnCls(true)} onClick={() => void saveScheduler()}>Save</button>
          {isNative() && (
            <button className={btnCls()} onClick={() => void runCheckNow().catch(() => undefined)} title="Runs a check now">
              Run check now
            </button>
          )}
        </div>
      </div>

      {/* Permissions + device */}
      {isNative() && (
        <div className={card(theme)}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
            🔐 Permissions & Device
          </h3>
          <div className="flex flex-wrap space-x-3 space-y-2">
            <button className={btnCls()} onClick={() => void askNotification()}>Enable notifications</button>
            <button className={btnCls()} onClick={() => void askMic()}>Enable microphone</button>
          </div>
          {deviceInfo && (
            <div className={`mt-4 rounded-lg p-4 text-sm font-mono ${theme.cyberpunk ? 'bg-black/30 text-gray-300 border border-gray-700' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
              <div>Device: {deviceInfo.manufacturer} {deviceInfo.model}</div>
              <div>Android: {deviceInfo.sdkInt} • ABI: {deviceInfo.abi}{deviceInfo.isArm64 ? ' (arm64-v8a)' : ''}</div>
              <div>WebView: {deviceInfo.webViewVersion}</div>
              <div>App: {deviceInfo.packageName} v{deviceInfo.versionName}</div>
            </div>
          )}
          {network && (
            <div className={`mt-3 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              Network: <b>{network.connected ? 'connected' : 'offline'}</b>{network.validated ? ' (validated)' : ''} — {network.type}
            </div>
          )}
        </div>
      )}

      {saveStatus && (
        <div className={`text-sm ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>{saveStatus}</div>
      )}
    </div>
  );
};
