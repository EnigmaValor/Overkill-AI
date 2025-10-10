import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

// Basic Danish simplification dictionary (non-exhaustive, safe substitutions)
const SIMPLE_MAP: Array<[RegExp, string]> = [
  [/kompliceret/gi, 'svær'],
  [/anvende/gi, 'bruge'],
  [/funktionalitet/gi, 'funktion'],
  [/implementere/gi, 'lave'],
  [/problemstilling/gi, 'problem'],
  [/konsekvens/gi, 'følge'],
  [/på nuværende tidspunkt/gi, 'nu'],
  [/i forhold til/gi, 'om'],
  [/ikke desto mindre/gi, 'alligevel'],
  [/være i stand til/gi, 'kan'],
  [/foretage/gi, 'gøre'],
  [/benytte/gi, 'bruge'],
  [/såfremt/gi, 'hvis'],
  [/vedrørende/gi, 'om'],
];

function simplifyDanish(text: string): string {
  let result = text;
  for (const [pattern, replacement] of SIMPLE_MAP) {
    result = result.replace(pattern, replacement);
  }
  // Split very long sentences into shorter ones by replacing semicolons/colon with periods
  result = result
    .replace(/[;:]/g, '.')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.(\s*)\./g, '.')
    .trim();
  // Ensure each sentence starts on a new line for readability
  const sentences = result
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.join('\n');
}

type Theme = 'light' | 'sepia' | 'dark';

const PANEL_BASE_CLASSES = 'fixed bottom-20 right-4 w-[min(92vw,680px)] max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border z-50';
const FLOATING_BTN_CLASSES = 'fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full font-semibold focus:outline-none focus:ring-4';

const supportsSpeechSynthesis = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const getRecognition = () => {
  if (typeof window === 'undefined') return null as any;
  const w = window as any;
  return w.SpeechRecognition ? new w.SpeechRecognition() : w.webkitSpeechRecognition ? new w.webkitSpeechRecognition() : null;
};

const DyslexiaAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useLocalStorage<boolean>('da:isOpen', false);
  const [text, setText] = useLocalStorage<string>('da:text', '');
  const [theme, setTheme] = useLocalStorage<Theme>('da:theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage<number>('da:fontSize', 18);
  const [lineHeight, setLineHeight] = useLocalStorage<number>('da:lineHeight', 1.8);
  const [letterSpacing, setLetterSpacing] = useLocalStorage<number>('da:letterSpacing', 0.06);
  const [useDyslexicFont, setUseDyslexicFont] = useLocalStorage<boolean>('da:dyslexicFont', true);
  const [rulerOn, setRulerOn] = useLocalStorage<boolean>('da:rulerOn', false);

  // TTS
  const [rate, setRate] = useLocalStorage<number>('da:rate', 0.95);
  const [pitch, setPitch] = useLocalStorage<number>('da:pitch', 1);
  const [voiceUri, setVoiceUri] = useLocalStorage<string>('da:voice', '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // STT
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  // Ruler position
  const [rulerY, setRulerY] = useState<number>(0);

  useEffect(() => {
    if (!supportsSpeechSynthesis()) return;
    const handleVoicesChanged = () => {
      const list = window.speechSynthesis.getVoices();
      voicesRef.current = list;
      if (!voiceUri) {
        const daVoice = list.find((v) => v.lang?.toLowerCase().startsWith('da')) || list.find((v) => v.lang?.toLowerCase().startsWith('en'));
        if (daVoice) setVoiceUri(daVoice.voiceURI);
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    handleVoicesChanged();
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, [voiceUri, setVoiceUri]);

  useEffect(() => {
    if (!rulerOn) return;
    const onMove = (e: MouseEvent) => setRulerY(e.clientY);
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [rulerOn]);

  const speak = () => {
    if (!supportsSpeechSynthesis() || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const v = voicesRef.current.find((vv) => vv.voiceURI === voiceUri);
    if (v) utter.voice = v;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if (!supportsSpeechSynthesis()) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    const rec = getRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    rec.lang = 'da-DK';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
  };

  const simplifiedText = useMemo(() => simplifyDanish(text), [text]);

  const applySimplified = () => setText(simplifiedText);

  const themeClasses = useMemo(() => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#F4ECD8] text-[#2E2A1F] border-[#E4DCC6]';
      case 'dark':
        return 'bg-[#121212] text-[#EAEAEA] border-[#333]';
      default:
        return 'bg-white text-gray-900 border-gray-200';
    }
  }, [theme]);

  const buttonClasses = useMemo(() => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#3A6EA5] text-white hover:bg-[#2e5987] focus:ring-[#aac3df]';
      case 'dark':
        return 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-300';
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-300';
    }
  }, [theme]);

  const controlLabel = 'text-sm font-medium opacity-80';

  const textStyles: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight.toString(),
    letterSpacing: `${letterSpacing}em`,
    fontFamily: useDyslexicFont ? 'OpenDyslexic, OpenDyslexic3, "OpenDyslexic Three", system-ui, Arial, sans-serif' : undefined,
  };

  const voiceOptions = voicesRef.current.map((v) => (
    <option key={v.voiceURI} value={v.voiceURI}>
      {v.name} ({v.lang})
    </option>
  ));

  return (
    <>
      {/* Ruler overlay */}
      {rulerOn && (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none z-40"
        >
          <div className="absolute left-0 right-0" style={{ top: Math.max(0, rulerY - 28), height: 56 }}>
            <div className="mx-0 my-0 w-full h-full bg-yellow-200/30 border-y-2 border-yellow-400/70" />
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        className={`${FLOATING_BTN_CLASSES} ${buttonClasses}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="dyslexia-assistant-panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm9-3a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
        </svg>
        <span>Assistent</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div id="dyslexia-assistant-panel" className={`${PANEL_BASE_CLASSES} ${themeClasses}`} role="dialog" aria-modal="true" aria-label="Ordblinde assistent">
          <div className="flex items-center justify-between px-4 py-3 border-b border-inherit/40">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Ordblinde Assistent</span>
              <span className="text-xs opacity-70">(TTS, STT, forenkling)</span>
            </div>
            <button className="text-sm opacity-70 hover:opacity-100" onClick={() => setIsOpen(false)} aria-label="Luk">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 p-4">
            {/* Text area */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className={controlLabel}>Tekst</label>
              <textarea
                className="w-full min-h-[200px] max-h-[42vh] p-3 rounded-lg border focus:outline-none focus:ring-2"
                style={textStyles}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Skriv eller indsæt tekst her..."
              />

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <button className={`px-3 py-2 rounded-lg ${buttonClasses}`} onClick={speak} disabled={!text || !supportsSpeechSynthesis()}>
                  Læs op
                </button>
                <button className={`px-3 py-2 rounded-lg border`} onClick={stopSpeaking} disabled={!isSpeaking}>
                  Stop
                </button>

                {getRecognition() ? (
                  isListening ? (
                    <button className={`px-3 py-2 rounded-lg border`} onClick={stopListening}>Stop diktering</button>
                  ) : (
                    <button className={`px-3 py-2 rounded-lg ${buttonClasses}`} onClick={startListening}>Dikter tekst</button>
                  )
                ) : (
                  <span className="text-xs opacity-70">Diktering ikke understøttet i denne browser</span>
                )}

                <button className={`px-3 py-2 rounded-lg ${buttonClasses}`} onClick={applySimplified} disabled={!text}>
                  Forenkle tekst
                </button>

                <button className="px-3 py-2 rounded-lg border" onClick={() => setText('')}>
                  Ryd
                </button>
              </div>

              {/* Simplified preview */}
              {text && (
                <div className="mt-3">
                  <div className="text-xs opacity-70 mb-1">Forslag til forenkling</div>
                  <pre className="whitespace-pre-wrap p-3 rounded-lg border overflow-auto max-h-[24vh]" style={textStyles}>{simplifiedText}</pre>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="md:col-span-1 flex flex-col gap-3">
              <div>
                <label className={controlLabel}>Tema</label>
                <select className="w-full mt-1 p-2 rounded border bg-transparent" value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
                  <option value="light">Lys</option>
                  <option value="sepia">Sepia</option>
                  <option value="dark">Mørk</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className={controlLabel}>Skrifttype for ordblinde</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input id="dysfont" type="checkbox" checked={useDyslexicFont} onChange={(e) => setUseDyslexicFont(e.target.checked)} />
                    <label htmlFor="dysfont" className="text-sm">OpenDyslexic</label>
                  </div>
                </div>
                <div>
                  <label className={controlLabel}>Størrelse</label>
                  <input type="range" min={14} max={28} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className={controlLabel}>Linjeafstand</label>
                  <input type="range" step="0.1" min={1.2} max={2.2} value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className={controlLabel}>Bogstavafstand</label>
                  <input type="range" step="0.01" min={0} max={0.12} value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={controlLabel}>Stemme</label>
                  <select className="w-full mt-1 p-2 rounded border bg-transparent" value={voiceUri} onChange={(e) => setVoiceUri(e.target.value)}>
                    <option value="">Standard</option>
                    {voiceOptions}
                  </select>
                </div>
                <div>
                  <label className={controlLabel}>Hastighed</label>
                  <input type="range" min={0.5} max={1.5} step={0.05} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className={controlLabel}>Tonehøjde</label>
                  <input type="range" min={0.5} max={2} step={0.05} value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} />
                </div>
              </div>

              <div className="mt-2">
                <label className={controlLabel}>Læsereglen (ruler)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input id="ruler" type="checkbox" checked={rulerOn} onChange={(e) => setRulerOn(e.target.checked)} />
                  <label htmlFor="ruler" className="text-sm">Fremhæv linjen under musen</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DyslexiaAssistant;
