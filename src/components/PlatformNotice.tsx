import { Theme } from '../PrivacyDashboard';
import { isNative } from '../lib/native';

interface PlatformNoticeProps {
  theme: Theme;
}

/**
 * Honest platform note shown on Android: the network-service tabs preserve the
 * original desktop simulation UI; real Android equivalents live in system
 * settings or dedicated apps. The app's AI, scheduler, crypto and device
 * checks use real Android APIs.
 */
export const PlatformNotice = ({ theme }: PlatformNoticeProps) => {
  if (!isNative()) return null;
  return (
    <div
      className={`rounded-lg px-4 py-3 text-xs border ${
        theme.cyberpunk
          ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}
    >
      <b>Android note:</b> this screen keeps the original dashboard simulation (as in the desktop
      build). Real device equivalents: enable <b>Private DNS (DoT)</b> in Android network settings
      for encrypted DNS, and use a dedicated Tor / VPN app for tunnelling. The Groq AI assistant,
      encrypted vault, schedule checks and notifications in this app use real Android APIs.
    </div>
  );
};
