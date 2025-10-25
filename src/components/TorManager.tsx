import { useState, useEffect } from 'react';
import { Theme } from '../PrivacyDashboard';

interface TorManagerProps {
  onStatusChange: (status: boolean) => void;
  theme: Theme;
}

export const TorManager = ({ onStatusChange, theme }: TorManagerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [circuitInfo, setCircuitInfo] = useState<string[]>([]);
  const [onionSites, setOnionSites] = useState([
    { name: 'DuckDuckGo', url: 'https://3g2upl4pq6kufc4m.onion' },
    { name: 'Facebook', url: 'https://facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbsjg7ms5xr5yd.onion' },
    { name: 'ProPublica', url: 'https://www.propub3r6espa33w.onion' },
    { name: 'The New York Times', url: 'https://www.nytimes3xbfgragh.onion' }
  ]);
  const [selectedSite, setSelectedSite] = useState('');

  useEffect(() => {
    onStatusChange(isConnected);
  }, [isConnected, onStatusChange]);

  const connectToTor = async () => {
    setIsConnecting(true);
    // Simulate Tor connection process
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setCircuitInfo([
        'Entry: 192.168.1.1 (Guard)',
        'Middle: 10.0.0.5 (Relay)',
        'Exit: 203.0.113.42 (Exit)'
      ]);
    }, 3000);
  };

  const disconnectFromTor = () => {
    setIsConnected(false);
    setCircuitInfo([]);
    setSelectedSite('');
  };

  const openOnionSite = (url: string) => {
    setSelectedSite(url);
    // In a real implementation, this would open the site in a Tor browser
    alert(`Opening ${url} through Tor network...`);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30' : 'bg-white shadow-lg'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${theme.cyberpunk ? 'text-orange-400' : 'text-gray-800'}`}>
            Tor Network
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
          Tor protects your privacy by routing your traffic through multiple servers, making it difficult to track your online activities.
        </p>

        <div className="flex space-x-4">
          {!isConnected ? (
            <button
              onClick={connectToTor}
              disabled={isConnecting}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isConnecting
                  ? theme.cyberpunk 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Tor'}
            </button>
          ) : (
            <button
              onClick={disconnectFromTor}
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

      {/* Circuit Information */}
      {isConnected && circuitInfo.length > 0 && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30' : 'bg-white shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-blue-400' : 'text-gray-800'}`}>
            Tor Circuit
          </h3>
          <div className="space-y-2">
            {circuitInfo.map((node, index) => (
              <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  theme.cyberpunk ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`font-mono text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-700'}`}>
                  {node}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onion Sites */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-green-400' : 'text-gray-800'}`}>
          Popular Onion Sites
        </h3>
        <p className={`text-sm mb-4 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          Access these sites through the Tor network for enhanced privacy.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onionSites.map((site, index) => (
            <button
              key={index}
              onClick={() => openOnionSite(site.url)}
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
              <h4 className={`font-semibold mb-1 ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                {site.name}
              </h4>
              <p className={`text-xs font-mono ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-600'}`}>
                {site.url}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Security Tips */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-yellow-400' : 'text-gray-800'}`}>
          Security Tips
        </h3>
        <ul className={`space-y-2 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Never use Tor for illegal activities</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Keep your Tor browser updated</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Don't install additional plugins or extensions</span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
            <span>Use HTTPS whenever possible</span>
          </li>
        </ul>
      </div>
    </div>
  );
};