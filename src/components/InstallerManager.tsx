import { useState, useEffect } from 'react';
import { Theme } from '../PrivacyDashboard';

interface InstallerManagerProps {
  theme: Theme;
}

interface InstallerInfo {
  platform: 'windows' | 'linux' | 'macos';
  version: string;
  size: string;
  checksum: string;
  downloadUrl: string;
  requirements: string[];
}

export const InstallerManager = ({ theme }: InstallerManagerProps) => {
  const [showInstaller, setShowInstaller] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'linux' | 'macos'>('windows');
  const [installProgress, setInstallProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'downloading' | 'installing' | 'completed' | 'error'>('idle');

  const installers: InstallerInfo[] = [
    {
      platform: 'windows',
      version: '1.0.0',
      size: '45.2 MB',
      checksum: 'SHA256: a1b2c3d4e5f6...',
      downloadUrl: '/downloads/PrivacyGuardPro-Setup-1.0.0.exe',
      requirements: ['Windows 10/11 (64-bit)', '4 GB RAM', '100 MB free space', '.NET 6.0 Runtime']
    },
    {
      platform: 'linux',
      version: '1.0.0',
      size: '38.7 MB',
      checksum: 'SHA256: f6e5d4c3b2a1...',
      downloadUrl: '/downloads/PrivacyGuardPro-1.0.0.AppImage',
      requirements: ['Ubuntu 20.04+ / Debian 11+', '2 GB RAM', '50 MB free space', 'Systemd (optional)']
    },
    {
      platform: 'macos',
      version: '1.0.0',
      size: '42.1 MB',
      checksum: 'SHA256: 1a2b3c4d5e6f...',
      downloadUrl: '/downloads/PrivacyGuardPro-1.0.0.dmg',
      requirements: ['macOS 11.0+', '4 GB RAM', '100 MB free space', 'Intel/Apple Silicon']
    }
  ];

  const currentInstaller = installers.find(i => i.platform === selectedPlatform);

  const downloadInstaller = async () => {
    if (!currentInstaller) return;

    setInstallStatus('downloading');
    setIsInstalling(true);
    setInstallProgress(0);

    // Simulate download progress
    const downloadInterval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 100) {
          clearInterval(downloadInterval);
          setInstallStatus('installing');
          simulateInstallation();
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
  };

  const simulateInstallation = () => {
    // Simulate installation process
    setTimeout(() => {
      setInstallStatus('completed');
      setIsInstalling(false);
      setInstallProgress(100);
    }, 3000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows': return '🪟';
      case 'linux': return '🐧';
      case 'macos': return '🍎';
      default: return '💻';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'windows': return 'Windows';
      case 'linux': return 'Linux';
      case 'macos': return 'macOS';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Section */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30' : 'bg-white shadow-lg'}`}>
        <div className="text-center mb-6">
          <h2 className={`text-3xl font-bold mb-2 ${theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
            Download PrivacyGuard Pro
          </h2>
          <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
            Choose your platform and download the installer
          </p>
        </div>

        {/* Platform Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {installers.map((installer) => (
            <button
              key={installer.platform}
              onClick={() => setSelectedPlatform(installer.platform)}
              className={`p-4 rounded-lg text-center transition-all hover:scale-105 ${
                selectedPlatform === installer.platform
                  ? theme.cyberpunk
                    ? 'bg-cyan-900/30 border border-cyan-500/50'
                    : 'bg-blue-50 border border-blue-500'
                  : theme.cyberpunk
                  ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 hover:border-purple-400/50'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="text-4xl mb-2">{getPlatformIcon(installer.platform)}</div>
              <h3 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                {getPlatformName(installer.platform)}
              </h3>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                v{installer.version} • {installer.size}
              </p>
            </button>
          ))}
        </div>

        {/* Download Button */}
        <div className="text-center">
          <button
            onClick={downloadInstaller}
            disabled={isInstalling}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
              isInstalling
                ? theme.cyberpunk 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : theme.cyberpunk
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isInstalling ? 'Installing...' : `Download for ${getPlatformName(selectedPlatform)}`}
          </button>
        </div>
      </div>

      {/* Installation Progress */}
      {isInstalling && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30' : 'bg-white shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-green-400' : 'text-gray-800'}`}>
            Installation Progress
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className={theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}>
                {installStatus === 'downloading' ? 'Downloading...' : 
                 installStatus === 'installing' ? 'Installing...' : 
                 installStatus === 'completed' ? 'Installation Complete!' : 'Preparing...'}
              </span>
              <span className={theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}>
                {Math.round(installProgress)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-3 ${
              theme.cyberpunk ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  theme.cyberpunk 
                    ? 'bg-gradient-to-r from-green-500 to-cyan-500' 
                    : 'bg-gradient-to-r from-blue-500 to-green-500'
                }`}
                style={{ width: `${installProgress}%` }}
              />
            </div>
          </div>

          {installStatus === 'completed' && (
            <div className={`p-4 rounded-lg text-center ${
              theme.cyberpunk ? 'bg-green-900/30 border border-green-500/50' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="text-4xl mb-2">✅</div>
              <h4 className={`font-semibold ${theme.cyberpunk ? 'text-green-400' : 'text-green-800'}`}>
                Installation Complete!
              </h4>
              <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                PrivacyGuard Pro has been successfully installed on your system.
              </p>
            </div>
          )}
        </div>
      )}

      {/* System Requirements */}
      {currentInstaller && (
        <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30' : 'bg-white shadow-lg'}`}>
          <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-yellow-400' : 'text-gray-800'}`}>
            System Requirements
          </h3>
          <ul className={`space-y-2 ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentInstaller.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start">
                <span className={`mr-2 ${theme.cyberpunk ? 'text-green-400' : 'text-green-600'}`}>✓</span>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
          
          <div className={`mt-4 p-3 rounded-lg ${
            theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
          }`}>
            <p className={`text-sm font-mono ${theme.cyberpunk ? 'text-gray-400' : 'text-gray-500'}`}>
              <strong>Checksum:</strong> {currentInstaller.checksum}
            </p>
            <p className={`text-xs mt-1 ${theme.cyberpunk ? 'text-gray-500' : 'text-gray-400'}`}>
              Verify this checksum to ensure file integrity
            </p>
          </div>
        </div>
      )}

      {/* Installation Instructions */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-purple-400' : 'text-gray-800'}`}>
          Installation Instructions
        </h3>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
              Windows Installation
            </h4>
            <ol className={`list-decimal list-inside space-y-1 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Download the .exe installer</li>
              <li>Right-click and "Run as administrator"</li>
              <li>Follow the installation wizard</li>
              <li>Restart your computer if prompted</li>
              <li>Launch PrivacyGuard Pro from Start Menu</li>
            </ol>
          </div>

          <div className={`p-4 rounded-lg ${
            theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
              Linux Installation
            </h4>
            <ol className={`list-decimal list-inside space-y-1 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Download the .AppImage file</li>
              <li>Make it executable: <code className="bg-gray-800 text-green-400 px-1 rounded">chmod +x PrivacyGuardPro-*.AppImage</code></li>
              <li>Run: <code className="bg-gray-800 text-green-400 px-1 rounded">./PrivacyGuardPro-*.AppImage</code></li>
              <li>Optional: Move to /opt for system-wide installation</li>
            </ol>
          </div>

          <div className={`p-4 rounded-lg ${
            theme.cyberpunk ? 'bg-black/20 border border-gray-700' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
              macOS Installation
            </h4>
            <ol className={`list-decimal list-inside space-y-1 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Download the .dmg file</li>
              <li>Double-click to mount the disk image</li>
              <li>Drag PrivacyGuard Pro to Applications folder</li>
              <li>Launch from Applications or Spotlight</li>
              <li>Allow in Security & Privacy settings if prompted</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className={`rounded-xl p-6 ${theme.cyberpunk ? 'bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30' : 'bg-white shadow-lg'}`}>
        <h3 className={`text-xl font-bold mb-4 ${theme.cyberpunk ? 'text-red-400' : 'text-gray-800'}`}>
          Security Notice
        </h3>
        <div className={`space-y-2 text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>• Always verify the checksum before installation</p>
          <p>• Download only from official sources</p>
          <p>• Keep your antivirus software updated</p>
          <p>• Run regular security scans after installation</p>
          <p>• Report any suspicious behavior immediately</p>
        </div>
      </div>
    </div>
  );
};