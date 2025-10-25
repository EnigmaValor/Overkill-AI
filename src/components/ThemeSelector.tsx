import { Theme } from '../PrivacyDashboard';

interface ThemeSelectorProps {
  themes: Theme[];
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  compact?: boolean;
}

export const ThemeSelector = ({ themes, currentTheme, onThemeChange, compact = false }: ThemeSelectorProps) => {
  if (compact) {
    return (
      <div className="relative">
        <select
          value={currentTheme.name}
          onChange={(e) => {
            const theme = themes.find(t => t.name === e.target.value);
            if (theme) onThemeChange(theme);
          }}
          className={`appearance-none bg-transparent border rounded-lg px-3 py-2 text-sm ${
            currentTheme.cyberpunk 
              ? 'border-purple-500/50 text-cyan-400 bg-purple-900/30' 
              : 'border-gray-300 text-gray-700 bg-white'
          }`}
        >
          {themes.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 ${currentTheme.cyberpunk ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30' : 'bg-white shadow-lg'}`}>
      <h3 className={`text-xl font-bold mb-4 ${currentTheme.cyberpunk ? 'text-cyan-400' : 'text-gray-800'}`}>
        Theme Selection
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => onThemeChange(theme)}
            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
              currentTheme.name === theme.name
                ? theme.cyberpunk
                  ? 'border-cyan-400 bg-cyan-900/20'
                  : 'border-blue-500 bg-blue-50'
                : theme.cyberpunk
                ? 'border-purple-500/30 bg-purple-900/10 hover:border-purple-400/50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: theme.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: theme.secondary }}
                />
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: theme.accent }}
                />
              </div>
              <div className="text-left">
                <h4 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
                  {theme.name}
                </h4>
                <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
                  {theme.cyberpunk ? 'Cyberpunk style' : 'Clean design'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};