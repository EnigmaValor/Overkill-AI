import { useState, useEffect } from 'react';
import { TorManager } from './components/TorManager';
import { DNSCryptManager } from './components/DNSCryptManager';
import { I2PManager } from './components/I2PManager';
import { AIChatBot } from './components/AIChatBot';
import { VPNManager } from './components/VPNManager';
import { ThemeSelector } from './components/ThemeSelector';
import HackTheBoxTCMDK from './components/HackTheBoxTCM_DK';
import { StatusIndicator } from './components/StatusIndicator';
import { InstallerManager } from './components/InstallerManager';

export interface PrivacyStatus {
  tor: boolean;
  dnscrypt: boolean;
  i2p: boolean;
  vpn: boolean;
  overall: 'secure' | 'warning' | 'danger';
}

export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  cyberpunk: boolean;
}

const themes: Theme[] = [
  {
    name: 'Cyberpunk Neon',
    primary: '#00ff88',
    secondary: '#ff0080',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#ffffff',
    accent: '#00ffff',
    cyberpunk: true
  },
  {
    name: 'Soft Gray',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    accent: '#06b6d4',
    cyberpunk: false
  },
  {
    name: 'Monochrome',
    primary: '#000000',
    secondary: '#374151',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#000000',
    accent: '#6b7280',
    cyberpunk: false
  },
  {
    name: 'Dark Minimal',
    primary: '#ffffff',
    secondary: '#d1d5db',
    background: '#111827',
    surface: '#1f2937',
    text: '#ffffff',
    accent: '#3b82f6',
    cyberpunk: false
  }
];

const PrivacyDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTheme, setCurrentTheme] = useState(themes[0]);
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>({
    tor: false,
    dnscrypt: false,
    i2p: false,
    vpn: false,
    overall: 'danger'
  });
  const [showAIBot, setShowAIBot] = useState(false);

  // Update overall security status
  useEffect(() => {
    const activeServices = [privacyStatus.tor, privacyStatus.dnscrypt, privacyStatus.i2p, privacyStatus.vpn];
    const activeCount = activeServices.filter(Boolean).length;
    
    if (activeCount === 0) {
      setPrivacyStatus(prev => ({ ...prev, overall: 'danger' }));
    } else if (activeCount < 2) {
      setPrivacyStatus(prev => ({ ...prev, overall: 'warning' }));
    } else {
      setPrivacyStatus(prev => ({ ...prev, overall: 'secure' }));
    }
  }, [privacyStatus.tor, privacyStatus.dnscrypt, privacyStatus.i2p, privacyStatus.vpn]);

  const updatePrivacyStatus = (service: keyof Omit<PrivacyStatus, 'overall'>, status: boolean) => {
    setPrivacyStatus(prev => ({ ...prev, [service]: status }));
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '🏠' },
    { id: 'tor', name: 'Tor', icon: '🧅' },
    { id: 'dnscrypt', name: 'DNSCrypt', icon: '🔐' },
    { id: 'i2p', name: 'I2P', icon: '🌐' },
    { id: 'vpn', name: 'VPN/SPN', icon: '🛡️' },
    { id: 'installer', name: 'Download', icon: '📥' },
    { id: 'htb_tcm_dk', name: 'HTB + TCM (DK)', icon: '🇩🇰' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusIndicator
                title="Tor Network"
                status={privacyStatus.tor}
                description="Anonymous browsing"
                theme={currentTheme}
              />
              <StatusIndicator
                title="DNSCrypt"
                status={privacyStatus.dnscrypt}
                description="Encrypted DNS"
                theme={currentTheme}
              />
              <StatusIndicator
                title="I2P Network"
                status={privacyStatus.i2p}
                description="Anonymous communication"
                theme={currentTheme}
              />
              <StatusIndicator
                title="VPN/SPN"
                status={privacyStatus.vpn}
                description="Secure tunneling"
                theme={currentTheme}
              />
            </div>
            
            <div className={`rounded-xl p-6 ${currentTheme.cyberpunk ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30' : 'bg-white shadow-lg'}`}>
              <h3 className={`text-xl font-bold mb-4 ${currentTheme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
                Security Overview
              </h3>
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${
                  privacyStatus.overall === 'secure' ? 'bg-green-500' :
                  privacyStatus.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className={`font-medium ${
                  privacyStatus.overall === 'secure' ? 'text-green-400' :
                  privacyStatus.overall === 'warning' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {privacyStatus.overall === 'secure' ? 'Maximum Security' :
                   privacyStatus.overall === 'warning' ? 'Partial Security' : 'Security Risk'}
                </span>
              </div>
              <p className={`mt-2 text-sm ${currentTheme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                {privacyStatus.overall === 'secure' ? 
                  'All privacy services are active and protecting your data.' :
                  privacyStatus.overall === 'warning' ?
                  'Some privacy services are active. Consider enabling more for better protection.' :
                  'No privacy services are active. Your data may be exposed to surveillance.'}
              </p>
            </div>

            <div className={`rounded-xl p-6 ${currentTheme.cyberpunk ? 'bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30' : 'bg-white shadow-lg'}`}>
              <h3 className={`text-xl font-bold mb-4 ${currentTheme.cyberpunk ? 'text-green-400' : 'text-gray-800'}`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('tor')}
                  className={`p-4 rounded-lg text-left transition-all hover:scale-105 ${
                    currentTheme.cyberpunk 
                      ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/50 hover:border-orange-400' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-2">🧅</div>
                  <h4 className="font-semibold">Enable Tor</h4>
                  <p className="text-sm opacity-75">Browse anonymously through the Tor network</p>
                </button>
                <button
                  onClick={() => setActiveTab('dnscrypt')}
                  className={`p-4 rounded-lg text-left transition-all hover:scale-105 ${
                    currentTheme.cyberpunk 
                      ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 hover:border-blue-400' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-2">🔐</div>
                  <h4 className="font-semibold">Secure DNS</h4>
                  <p className="text-sm opacity-75">Encrypt your DNS queries with DNSCrypt</p>
                </button>
              </div>
            </div>
          </div>
        );
      case 'tor':
        return <TorManager onStatusChange={(status) => updatePrivacyStatus('tor', status)} theme={currentTheme} />;
      case 'dnscrypt':
        return <DNSCryptManager onStatusChange={(status) => updatePrivacyStatus('dnscrypt', status)} theme={currentTheme} />;
      case 'i2p':
        return <I2PManager onStatusChange={(status) => updatePrivacyStatus('i2p', status)} theme={currentTheme} />;
      case 'vpn':
        return <VPNManager onStatusChange={(status) => updatePrivacyStatus('vpn', status)} theme={currentTheme} />;
      case 'installer':
        return <InstallerManager theme={currentTheme} />;
      case 'htb_tcm_dk':
        return <HackTheBoxTCMDK theme={currentTheme} />;
      case 'settings':
        return (
          <div className="space-y-6">
            <ThemeSelector 
              themes={themes} 
              currentTheme={currentTheme} 
              onThemeChange={setCurrentTheme} 
            />
            <div className={`rounded-xl p-6 ${currentTheme.cyberpunk ? 'bg-gradient-to-r from-gray-900/20 to-slate-900/20 border border-gray-500/30' : 'bg-white shadow-lg'}`}>
              <h3 className={`text-xl font-bold mb-4 ${currentTheme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
                About PrivacyGuard Pro
              </h3>
              <p className={`text-sm ${currentTheme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                A comprehensive privacy suite combining Tor, DNSCrypt, I2P, and VPN technologies 
                to protect your online activities from surveillance and censorship.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen transition-all duration-300"
      style={{
        background: currentTheme.cyberpunk 
          ? `linear-gradient(135deg, ${currentTheme.background} 0%, #1a0a2e 50%, #16213e 100%)`
          : currentTheme.background,
        color: currentTheme.text
      }}
    >
      {/* Header */}
      <header className={`border-b ${currentTheme.cyberpunk ? 'border-purple-500/30' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                currentTheme.cyberpunk 
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${currentTheme.cyberpunk ? 'text-cyan-400' : 'text-gray-900'}`}>
                  PrivacyGuard Pro
                </h1>
                <p className={`text-sm ${currentTheme.cyberpunk ? 'text-gray-400' : 'text-gray-600'}`}>
                  Advanced Privacy Suite
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAIBot(!showAIBot)}
                className={`p-2 rounded-lg transition-all ${
                  currentTheme.cyberpunk 
                    ? 'bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/50' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">🤖</span>
              </button>
              <ThemeSelector 
                themes={themes} 
                currentTheme={currentTheme} 
                onThemeChange={setCurrentTheme}
                compact={true}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`${currentTheme.cyberpunk ? 'bg-black/20 backdrop-blur-sm' : 'bg-white'} border-b ${currentTheme.cyberpunk ? 'border-purple-500/30' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? currentTheme.cyberpunk
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-blue-500 text-blue-600'
                    : currentTheme.cyberpunk
                    ? 'border-transparent text-gray-400 hover:text-cyan-300 hover:border-cyan-300/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>

      {/* AI Chat Bot */}
      {showAIBot && (
        <AIChatBot 
          onClose={() => setShowAIBot(false)} 
          theme={currentTheme}
        />
      )}
    </div>
  );
};

export default PrivacyDashboard;