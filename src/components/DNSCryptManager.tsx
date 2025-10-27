import { useState, useEffect } from 'react';
import { Theme } from '../PrivacyDashboard';

interface DNSCryptManagerProps {
  onStatusChange: (status: boolean) => void;
  theme: Theme;
}

interface DNSServer {
  name: string;
  address: string;
  description: string;
  features: string[];
  latency: number;
}

export const DNSCryptManager = ({ onStatusChange, theme }: DNSCryptManagerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [selectedServer, setSelectedServer] = useState<DNSServer | null>(null);
  const [blockAds, setBlockAds] = useState(true);
  const [blockMalware, setBlockMalware] = useState(true);
  const [blockAdult, setBlockAdult] = useState(false);
  const [queryLog, setQueryLog] = useState<string[]>([]);

  const dnsServers: DNSServer[] = [
    {
      name: 'Cloudflare',
      address: '1.1.1.1',
      description: 'Fast and secure DNS with privacy protection',
      features: ['No logging', 'Fast', 'Secure'],
      latency: 12
    },
    {
      name: 'Quad9',
      address: '9.9.9.9',
      description: 'Security-focused DNS with threat blocking',
      features: ['Threat blocking', 'Privacy', 'Reliable'],
      latency: 18
    },
    {
      name: 'OpenDNS',
      address: '208.67.222.222',
      description: 'Advanced filtering and parental controls',
      features: ['Content filtering', 'Parental controls', 'Customizable'],
      latency: 25
    },
    {
      name: 'AdGuard',
      address: '94.140.14.14',
      description: 'Ad and tracker blocking DNS',
      features: ['Ad blocking', 'Tracker blocking', 'Malware protection'],
      latency: 22
    }
  ];

  useEffect(() => {
    onStatusChange(isActive);
  }, [isActive, onStatusChange]);

  const activateDNSCrypt = async () => {
    setIsActivating(true);
    // Simulate DNSCrypt activation
    setTimeout(() => {
      setIsActive(true);
      setIsActivating(false);
      // Simulate some DNS queries
      setQueryLog([
        'example.com → 93.184.216.34',
        'google.com → 142.250.191.14',
        'github.com → 140.82.112.4'
      ]);
    }, 2000);
  };

  const deactivateDNSCrypt = () => {
    setIsActive(false);
    setQueryLog([]);
  };

  const testDNS = () => {
    const testDomains = ['google.com', 'cloudflare.com', 'github.com'];
    const newQueries = testDomains.map(domain => 
      `${domain} → ${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    );
    setQueryLog(prev => [...prev, ...newQueries]);
  };

  return (
    <div className="space-y-6">
      {/* Status and Controls */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30' : 'bg-white shadow-lg'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${theme.cyberpunk ? 'text-blue-400' : 'text-gray-800'}`}>
            DNSCrypt
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive 
              ? theme.cyberpunk ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-green-100 text-green-800'
              : theme.cyberpunk ? 'bg-red-900/50 text-red-400 border border-red-500/50' : 'bg-red-100 text-red-800'
          }`}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>
        
        <p className={`text-sm mb-6 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          DNSCrypt encrypts your DNS queries and verifies server authenticity using cryptographic keys, protecting against DNS-based attacks.
        </p>

        <div className="flex space-x-4">
          {!isActive ? (
            <button
              onClick={activateDNSCrypt}
              disabled={isActivating}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                isActivating
                  ? theme.cyberpunk 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isActivating ? 'Activating...' : 'Activate DNSCrypt'}
            </button>
          ) : (
            <button
              onClick={deactivateDNSCrypt}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                theme.cyberpunk
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* DNS Server Selection */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-purple-400' : 'text-gray-800'}`}>
          DNS Server Selection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dnsServers.map((server, index) => (
            <button
              key={index}
              onClick={() => setSelectedServer(server)}
              className={`p-4 rounded-lg text-left transition-all hover:scale-105 ${
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
                <h4 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                  {server.name}
                </h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  theme.cyberpunk ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'
                }`}>
                  {server.latency}ms
                </span>
              </div>
              <p className={`text-sm mb-2 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                {server.description}
              </p>
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
              <p className={`text-xs font-mono mt-2 ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'}`}>
                {server.address}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-green-400' : 'text-gray-800'}`}>
          Security Features
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                Block Ads
              </h4>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Block advertising domains and trackers
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={blockAds}
                onChange={(e) => setBlockAds(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${
                blockAds 
                  ? theme.cyberpunk ? 'bg-cyan-500' : 'bg-blue-600'
                  : theme.cyberpunk ? 'bg-gray-600' : 'bg-gray-200'
              } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`} />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                Block Malware
              </h4>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Block known malicious domains
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={blockMalware}
                onChange={(e) => setBlockMalware(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${
                blockMalware 
                  ? theme.cyberpunk ? 'bg-cyan-500' : 'bg-blue-600'
                  : theme.cyberpunk ? 'bg-gray-600' : 'bg-gray-200'
              } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`} />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                Block Adult Content
              </h4>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                Block adult and inappropriate content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={blockAdult}
                onChange={(e) => setBlockAdult(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer ${
                blockAdult 
                  ? theme.cyberpunk ? 'bg-cyan-500' : 'bg-blue-600'
                  : theme.cyberpunk ? 'bg-gray-600' : 'bg-gray-200'
              } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`} />
            </label>
          </div>
        </div>
      </div>

      {/* Query Log */}
      {isActive && queryLog.length > 0 && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-gray-900/20 to-slate-900/20 border border-gray-500/30' : 'bg-white shadow-lg'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-800'}`}>
              DNS Query Log
            </h3>
            <button
              onClick={testDNS}
              className={`px-3 py-1 rounded text-sm ${
                theme.cyberpunk 
                  ? 'bg-cyan-900/50 text-cyan-400 hover:bg-cyan-800/50' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              Test DNS
            </button>
          </div>
          <div className={`max-h-40 overflow-y-auto space-y-1 ${
            theme.cyberpunk ? 'bg-black/20 p-3 rounded border border-gray-700' : 'bg-gray-50 p-3 rounded'
          }`}>
            {queryLog.map((query, index) => (
              <div key={index} className={`text-sm font-mono ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-700'}`}>
                {query}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};