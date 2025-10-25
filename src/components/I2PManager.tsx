import { useState, useEffect } from 'react';
import { Theme } from '../PrivacyDashboard';

interface I2PManagerProps {
  onStatusChange: (status: boolean) => void;
  theme: Theme;
}

interface I2PSite {
  name: string;
  url: string;
  description: string;
  category: string;
}

export const I2PManager = ({ onStatusChange, theme }: I2PManagerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tunnelStatus, setTunnelStatus] = useState({
    client: false,
    server: false,
    http: false,
    irc: false
  });
  const [selectedSite, setSelectedSite] = useState('');

  const i2pSites: I2PSite[] = [
    {
      name: 'I2P Router Console',
      url: 'http://127.0.0.1:7657',
      description: 'Main I2P router configuration interface',
      category: 'System'
    },
    {
      name: 'I2P Forum',
      url: 'http://forum.i2p',
      description: 'Community discussion forum',
      category: 'Community'
    },
    {
      name: 'I2P Wiki',
      url: 'http://wiki.i2p',
      description: 'Documentation and guides',
      category: 'Documentation'
    },
    {
      name: 'I2P Mail',
      url: 'http://mail.i2p',
      description: 'Anonymous email service',
      category: 'Communication'
    },
    {
      name: 'I2P IRC',
      url: 'http://irc.i2p',
      description: 'Anonymous IRC chat',
      category: 'Communication'
    },
    {
      name: 'I2P Search',
      url: 'http://search.i2p',
      description: 'Anonymous search engine',
      category: 'Search'
    }
  ];

  useEffect(() => {
    onStatusChange(isConnected);
  }, [isConnected, onStatusChange]);

  const connectToI2P = async () => {
    setIsConnecting(true);
    // Simulate I2P connection process
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setTunnelStatus({
        client: true,
        server: true,
        http: true,
        irc: true
      });
    }, 4000);
  };

  const disconnectFromI2P = () => {
    setIsConnected(false);
    setTunnelStatus({
      client: false,
      server: false,
      http: false,
      irc: false
    });
    setSelectedSite('');
  };

  const openI2PSite = (url: string) => {
    setSelectedSite(url);
    // In a real implementation, this would open the site through I2P
    alert(`Opening ${url} through I2P network...`);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30' : 'bg-white shadow-lg'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${theme.cyberpunk ? 'text-purple-400' : 'text-gray-800'}`}>
            I2P Network
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
          I2P (Invisible Internet Project) provides anonymous communication through a distributed, self-organizing network.
        </p>

        <div className="flex space-x-4">
          {!isConnected ? (
            <button
              onClick={connectToI2P}
              disabled={isConnecting}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isConnecting
                  ? theme.cyberpunk 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isConnecting ? 'Connecting...' : 'Connect to I2P'}
            </button>
          ) : (
            <button
              onClick={disconnectFromI2P}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                theme.cyberpunk
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Tunnel Status */}
      {isConnected && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30' : 'bg-white shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-blue-400' : 'text-gray-800'}`}>
            Tunnel Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(tunnelStatus).map(([tunnel, status]) => (
              <div key={tunnel} className={`p-4 rounded-lg text-center ${
                theme.cyberpunk 
                  ? `bg-gradient-to-br ${status ? 'from-green-900/30 to-emerald-900/30 border border-green-500/50' : 'from-red-900/30 to-rose-900/30 border border-red-500/50'}`
                  : `bg-white border ${status ? 'border-green-200' : 'border-red-200'}`
              }`}>
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  status ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {status ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <h4 className={`font-semibold capitalize ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                  {tunnel}
                </h4>
                <p className={`text-xs ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                  {status ? 'Active' : 'Inactive'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* I2P Sites */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-green-400' : 'text-gray-800'}`}>
          I2P Sites
        </h3>
        <p className={`text-sm mb-4 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          Access these sites through the I2P network for enhanced anonymity.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {i2pSites.map((site, index) => (
            <button
              key={index}
              onClick={() => openI2PSite(site.url)}
              disabled={!isConnected}
              className={`p-4 rounded-lg text-left transition-all hover:scale-105 ${
                !isConnected
                  ? theme.cyberpunk 
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-green-900/30 to-teal-900/30 border border-green-500/50 hover:border-green-400'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                  {site.name}
                </h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  theme.cyberpunk ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800'
                }`}>
                  {site.category}
                </span>
              </div>
              <p className={`text-sm mb-2 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                {site.description}
              </p>
              <p className={`text-xs font-mono ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'}`}>
                {site.url}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Network Statistics */}
      {isConnected && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30' : 'bg-white shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-yellow-400' : 'text-gray-800'}`}>
            Network Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${theme.cyberpunk ? 'text-cyan-400' : 'text-blue-600'}`}>
                {Math.floor(Math.random() * 1000) + 500}
              </div>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Peers
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>
                {Math.floor(Math.random() * 50) + 20}ms
              </div>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Average Latency
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
            }`}>
              <div className={`text-2xl font-bold ${theme.cyberpunk ? 'text-purple-400' : 'text-purple-600'}`}>
                {Math.floor(Math.random() * 100) + 80}%
              </div>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Network Health
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-red-400' : 'text-gray-800'}`}>
          I2P Security Tips
        </h3>
        <ul className={`space-y-2 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>I2P provides strong anonymity but is not invulnerable</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Use I2P for legal activities only</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Keep your I2P router updated</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Don't share your I2P address publicly</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Use I2P in combination with other privacy tools</span>
          </li>
        </ul>
      </div>
    </div>
  );
};