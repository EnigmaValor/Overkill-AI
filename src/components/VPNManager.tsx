import { useState, useEffect } from 'react';
import { Theme } from '../PrivacyDashboard';

interface VPNManagerProps {
  onStatusChange: (status: boolean) => void;
  theme: Theme;
}

interface VPNServer {
  name: string;
  country: string;
  city: string;
  ping: number;
  load: number;
  features: string[];
  flag: string;
}

interface SPNConfig {
  enabled: boolean;
  server: string;
  protocol: 'wireguard' | 'openvpn' | 'shadowsocks';
  encryption: 'aes-256' | 'chacha20-poly1305';
  killSwitch: boolean;
  dnsLeakProtection: boolean;
}

export const VPNManager = ({ onStatusChange, theme }: VPNManagerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null);
  const [spnConfig, setSpnConfig] = useState<SPNConfig>({
    enabled: false,
    server: '',
    protocol: 'wireguard',
    encryption: 'aes-256',
    killSwitch: true,
    dnsLeakProtection: true
  });
  const [connectionStats, setConnectionStats] = useState({
    duration: '00:00:00',
    dataTransferred: '0 MB',
    currentIP: '192.168.1.100'
  });

  const vpnServers: VPNServer[] = [
    {
      name: 'PrivacyGuard Pro Server 1',
      country: 'Switzerland',
      city: 'Zurich',
      ping: 12,
      load: 15,
      features: ['No Logs', 'Kill Switch', 'DNS Leak Protection'],
      flag: '🇨🇭'
    },
    {
      name: 'PrivacyGuard Pro Server 2',
      country: 'Iceland',
      city: 'Reykjavik',
      ping: 18,
      load: 8,
      features: ['No Logs', 'Kill Switch', 'DNS Leak Protection', 'P2P Allowed'],
      flag: '🇮🇸'
    },
    {
      name: 'PrivacyGuard Pro Server 3',
      country: 'Norway',
      city: 'Oslo',
      ping: 22,
      load: 25,
      features: ['No Logs', 'Kill Switch', 'DNS Leak Protection'],
      flag: '🇳🇴'
    },
    {
      name: 'PrivacyGuard Pro Server 4',
      country: 'Panama',
      city: 'Panama City',
      ping: 45,
      load: 12,
      features: ['No Logs', 'Kill Switch', 'DNS Leak Protection', 'P2P Allowed'],
      flag: '🇵🇦'
    },
    {
      name: 'PrivacyGuard Pro Server 5',
      country: 'Japan',
      city: 'Tokyo',
      ping: 38,
      load: 30,
      features: ['No Logs', 'Kill Switch', 'DNS Leak Protection'],
      flag: '🇯🇵'
    }
  ];

  useEffect(() => {
    onStatusChange(isConnected);
  }, [isConnected, onStatusChange]);

  const connectToVPN = async (server: VPNServer) => {
    setIsConnecting(true);
    setSelectedServer(server);
    
    // Simulate VPN connection
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionStats({
        duration: '00:00:00',
        dataTransferred: '0 MB',
        currentIP: '203.0.113.42'
      });
      
      // Start connection timer
      startConnectionTimer();
    }, 3000);
  };

  const disconnectFromVPN = () => {
    setIsConnected(false);
    setSelectedServer(null);
    setConnectionStats({
      duration: '00:00:00',
      dataTransferred: '0 MB',
      currentIP: '192.168.1.100'
    });
  };

  const startConnectionTimer = () => {
    let seconds = 0;
    const timer = setInterval(() => {
      seconds++;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      setConnectionStats(prev => ({
        ...prev,
        duration: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
        dataTransferred: `${Math.floor(Math.random() * 1000)} MB`
      }));
    }, 1000);
    
    // Store timer reference for cleanup
    (window as any).vpnTimer = timer;
  };

  const testConnection = () => {
    // Simulate connection test
    alert('Testing connection... This would normally check for DNS leaks, IP leaks, and WebRTC leaks.');
  };

  const updateSPNConfig = (key: keyof SPNConfig, value: any) => {
    setSpnConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30' : 'bg-white shadow-lg'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${theme.cyberpunk ? 'text-blue-400' : 'text-gray-800'}`}>
            VPN/SPN Manager
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isConnected 
              ? theme.cyberpunk ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-green-100 text-green-800'
              : theme.cyberpunk ? 'bg-red-900/50 text-red-400 border border-red-500/50' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
        </div>
        
        <p className={`text-sm mb-6 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          Secure Private Network (SPN) creates an encrypted tunnel for your internet traffic, protecting your data and hiding your real IP address.
        </p>

        {isConnected && selectedServer && (
          <div className={`p-4 rounded-lg mb-4 ${
            theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                Connected to: {selectedServer.name}
              </h3>
              <span className="text-2xl">{selectedServer.flag}</span>
            </div>
            <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedServer.city}, {selectedServer.country} • {selectedServer.ping}ms ping
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          {!isConnected ? (
            <button
              onClick={() => selectedServer && connectToVPN(selectedServer)}
              disabled={isConnecting || !selectedServer}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isConnecting || !selectedServer
                  ? theme.cyberpunk 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isConnecting ? 'Connecting...' : 'Connect to VPN'}
            </button>
          ) : (
            <button
              onClick={disconnectFromVPN}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                theme.cyberpunk
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Disconnect
            </button>
          )}
          
          {isConnected && (
            <button
              onClick={testConnection}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                theme.cyberpunk
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Test Connection
            </button>
          )}
        </div>
      </div>

      {/* Server Selection */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-purple-400' : 'text-gray-800'}`}>
          Server Selection
        </h3>
        <div className="space-y-3">
          {vpnServers.map((server, index) => (
            <button
              key={index}
              onClick={() => setSelectedServer(server)}
              className={`w-full p-4 rounded-lg text-left transition-all hover:scale-105 ${
                selectedServer?.name === server.name
                  ? theme.cyberpunk
                    ? 'bg-cyan-900/30 border border-cyan-500/50'
                    : 'bg-blue-50 border border-blue-500'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 hover:border-purple-400/50'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{server.flag}</span>
                  <div>
                    <h4 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                      {server.name}
                    </h4>
                    <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                      {server.city}, {server.country}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    server.ping < 20 ? theme.cyberpunk ? 'text-green-400' : 'text-green-600' :
                    server.ping < 50 ? theme.cyberpunk ? 'text-yellow-400' : 'text-yellow-600' :
                    theme.cyberpunk ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {server.ping}ms
                  </div>
                  <div className={`text-xs ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'}`}>
                    {server.load}% load
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {server.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-1 rounded ${
                      theme.cyberpunk ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Connection Statistics */}
      {isConnected && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30' : 'bg-white shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-green-400' : 'text-gray-800'}`}>
            Connection Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${theme.cyberpunk ? 'text-cyan-400' : 'text-blue-600'}`}>
                {connectionStats.duration}
              </div>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Connection Time
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>
                {connectionStats.dataTransferred}
              </div>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Data Transferred
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${theme.cyberpunk ? 'text-purple-400' : 'text-purple-600'}`}>
                {connectionStats.currentIP}
              </div>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Current IP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SPN Configuration */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-yellow-400' : 'text-gray-800'}`}>
          SPN Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.cyberpunk ? 'text-white' : 'text-gray-700'}`}>
              Protocol
            </label>
            <select
              value={spnConfig.protocol}
              onChange={(e) => updateSPNConfig('protocol', e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                theme.cyberpunk 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-white text-gray-800 border-gray-300'
              }`}
            >
              <option value="wireguard">WireGuard (Recommended)</option>
              <option value="openvpn">OpenVPN</option>
              <option value="shadowsocks">Shadowsocks</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.cyberpunk ? 'text-white' : 'text-gray-700'}`}>
              Encryption
            </label>
            <select
              value={spnConfig.encryption}
              onChange={(e) => updateSPNConfig('encryption', e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                theme.cyberpunk 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-white text-gray-800 border-gray-300'
              }`}
            >
              <option value="aes-256">AES-256 (Military Grade)</option>
              <option value="chacha20-poly1305">ChaCha20-Poly1305 (Fast)</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-medium ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                  Kill Switch
                </h4>
                <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                  Block internet if VPN disconnects
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={spnConfig.killSwitch}
                  onChange={(e) => updateSPNConfig('killSwitch', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer ${
                  spnConfig.killSwitch 
                    ? theme.cyberpunk ? 'bg-cyan-500' : 'bg-blue-600'
                    : theme.cyberpunk ? 'bg-gray-600' : 'bg-gray-200'
                } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`} />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-medium ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                  DNS Leak Protection
                </h4>
                <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                  Prevent DNS queries from leaking
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={spnConfig.dnsLeakProtection}
                  onChange={(e) => updateSPNConfig('dnsLeakProtection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer ${
                  spnConfig.dnsLeakProtection 
                    ? theme.cyberpunk ? 'bg-cyan-500' : 'bg-blue-600'
                    : theme.cyberpunk ? 'bg-gray-600' : 'bg-gray-200'
                } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-red-400' : 'text-gray-800'}`}>
          VPN Security Tips
        </h3>
        <ul className={`space-y-2 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Always use a no-logs VPN provider</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Enable kill switch to prevent data leaks</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Use strong encryption (AES-256 or ChaCha20)</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Test for DNS leaks regularly</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Combine VPN with Tor for maximum privacy</span>
          </li>
        </ul>
      </div>
    </div>
  );
};