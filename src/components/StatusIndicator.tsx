import { Theme } from '../PrivacyDashboard';

interface StatusIndicatorProps {
  title: string;
  status: boolean;
  description: string;
  theme: Theme;
}

export const StatusIndicator = ({ title, status, description, theme }: StatusIndicatorProps) => {
  return (
    <div className={`rounded-xl p-4 transition-all duration-300 ${
      theme.cyberpunk 
        ? `bg-gradient-to-br ${status ? 'from-green-900/30 to-emerald-900/30 border border-green-500/50' : 'from-red-900/30 to-rose-900/30 border border-red-500/50'}`
        : `bg-white shadow-lg border ${status ? 'border-green-200' : 'border-red-200'}`
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold ${theme.cyberpunk ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h3>
        <div className={`w-3 h-3 rounded-full ${
          status ? 'bg-green-500' : 'bg-red-500'
        } ${theme.cyberpunk ? 'animate-pulse' : ''}`} />
      </div>
      <p className={`text-sm ${theme.cyberpunk ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
      <div className={`mt-2 text-xs font-medium ${
        status 
          ? theme.cyberpunk ? 'text-green-400' : 'text-green-600'
          : theme.cyberpunk ? 'text-red-400' : 'text-red-600'
      }`}>
        {status ? 'ACTIVE' : 'INACTIVE'}
      </div>
    </div>
  );
};