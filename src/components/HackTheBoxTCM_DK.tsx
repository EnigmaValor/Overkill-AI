import React from 'react';

export interface HackTheBoxTCMDKProps {
  theme: {
    cyberpunk: boolean;
    text: string;
    primary: string;
    secondary: string;
  };
}

const Disclaimer: React.FC<{ theme: HackTheBoxTCMDKProps['theme'] }> = ({ theme }) => (
  <div
    className={`rounded-xl p-4 mb-6 ${
      theme.cyberpunk
        ? 'bg-red-900/30 border border-red-500/40'
        : 'bg-red-50 border border-red-200'
    }`}
  >
    <h4 className={`${theme.cyberpunk ? 'text-red-300' : 'text-red-700'} font-semibold mb-2`}>
      Vigtigt – Etisk brug og lovlighed
    </h4>
    <p className={`${theme.cyberpunk ? 'text-gray-200' : 'text-gray-700'} text-sm`}>
      Dette materiale er udelukkende til læring og træning på eget udstyr eller
      systemer, du har udtrykkelig tilladelse til at teste. Anvend aldrig teknikker
      på andres systemer uden klar skriftlig tilladelse. Du er selv ansvarlig for
      at overholde gældende lovgivning.
    </p>
  </div>
);

export const HackTheBoxTCMDK: React.FC<HackTheBoxTCMDKProps> = ({ theme }) => {
  const cardBase = theme.cyberpunk
    ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30'
    : 'bg-white border border-gray-200 shadow-lg';

  const headingClass = theme.cyberpunk ? 'text-cyan-400' : 'text-gray-800';
  const subTextClass = theme.cyberpunk ? 'text-gray-300' : 'text-gray-600';
  const badgeClass = theme.cyberpunk
    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
    : 'bg-blue-50 text-blue-700 border border-blue-200';

  return (
    <div className="space-y-6">
      <Disclaimer theme={theme} />

      <div className={`rounded-xl p-6 ${cardBase}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${headingClass}`}>
              Hack The Box + TCM Security (Dansk)
            </h2>
            <p className={`mt-2 ${subTextClass}`}>
              Kom i gang med cybersikkerhed på dansk med praktiske labs fra Hack The Box og
              struktureret læring fra TCM Security. Nedenfor finder du læringsstier,
              certificeringsforberedelse og nyttige ressourcer.
            </p>
          </div>
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${badgeClass}`}>DK</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* HTB Beginner Path */}
        <div className={`rounded-xl p-6 ${cardBase}`}>
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">🧩</span>
            <h3 className={`text-xl font-semibold ${headingClass}`}>HTB: Begynderforløb</h3>
          </div>
          <p className={`text-sm ${subTextClass} mb-4`}>
            Lær grundprincipperne via introduktionsmaskiner og labs. Fokus: Linux/Windows basics,
            netværk, enumeration og simple sårbarheder.
          </p>
          <ul className={`space-y-2 text-sm ${subTextClass}`}>
            <li>• Start med "Starting Point" og "Tier 0-1" maskiner</li>
            <li>• Øv Nmap, gobuster/feroxbuster, simple privilege escalation</li>
            <li>• Tag noter i et fast format (Markdown + screenshots)</li>
          </ul>
          <div className="mt-5 flex gap-3 flex-wrap">
            <a
              href="https://www.hackthebox.com"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme.cyberpunk
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Åbn Hack The Box
            </a>
          </div>
        </div>

        {/* TCM Security Path */}
        <div className={`rounded-xl p-6 ${cardBase}`}>
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">🎓</span>
            <h3 className={`text-xl font-semibold ${headingClass}`}>TCM Security: Læringssti</h3>
          </div>
          <p className={`text-sm ${subTextClass} mb-4`}>
            Følg en struktureret sti fra grundlæggende netværk til praktisk offensive sikkerhed.
            Videoer, labs og eksamener i et realistisk tempo.
          </p>
          <ul className={`space-y-2 text-sm ${subTextClass}`}>
            <li>• Begynd med "Practical Ethical Hacking"</li>
            <li>• Fortsæt med "Windows Privilege Escalation" og "Linux Privilege Escalation"</li>
            <li>• Øv løbende i HTB parallelt for praksisnær erfaring</li>
          </ul>
          <div className="mt-5 flex gap-3 flex-wrap">
            <a
              href="https://tcm-sec.com"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme.cyberpunk
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              Besøg TCM Security
            </a>
          </div>
        </div>

        {/* Cert Prep */}
        <div className={`rounded-xl p-6 ${cardBase}`}>
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-3">🏅</span>
            <h3 className={`text-xl font-semibold ${headingClass}`}>Certificering og forberedelse</h3>
          </div>
          <p className={`text-sm ${subTextClass} mb-4`}>
            Når du er klar, kan du prøve praktiske eksamener. Start med begyndervenlige valg og skalér op.
          </p>
          <ul className={`space-y-2 text-sm ${subTextClass}`}>
            <li>• TCM: PNPT (praktisk, realistisk AD-angreb/defense)</li>
            <li>• HTB: CPTS/HTB Academy spor for solid teori</li>
            <li>• Planlæg tid, lav mock-rapporter, træn notehygiejne</li>
          </ul>
          <div className="mt-5 flex gap-3 flex-wrap">
            <a
              href="https://academy.hackthebox.com"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme.cyberpunk
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              HTB Academy
            </a>
            <a
              href="https://certifications.tcm-sec.com/"
              target="_blank"
              rel="noreferrer"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme.cyberpunk
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
            >
              TCM Certificeringer
            </a>
          </div>
        </div>
      </div>

      {/* Study tips */}
      <div className={`rounded-xl p-6 ${cardBase}`}>
        <h3 className={`text-xl font-semibold ${headingClass}`}>Studietips</h3>
        <ul className={`mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${subTextClass}`}>
          <li>• Sæt klare mål pr. uge (antal labs, noter, rapportudkast)</li>
          <li>• Brug en password manager og versionsstyring til noter</li>
          <li>• Automatiser recon hvor muligt – forstå output før du fortsætter</li>
          <li>• Deltag i communities (HTB forum/Discord) for hjælp på dansk/engelsk</li>
        </ul>
      </div>
    </div>
  );
};

export default HackTheBoxTCMDK;
