import { useState, useEffect } from 'react';
import { Theme } from './PrivacyDashboard';

interface AdvancedPasswordManagerProps {
  theme?: Theme;
}

/* ------------------------------- GF(256) helpers ------------------------------- */
// Shamir's Secret Sharing over GF(2^8) with the AES polynomial (0x11B).
const GF_POLY = 0x11b;

function gfMul(a: number, b: number): number {
  let p = 0;
  let aa = a;
  let bb = b;
  for (let i = 0; i < 8; i++) {
    if (bb & 1) p ^= aa;
    const hi = aa & 0x80;
    aa = (aa << 1) & 0xff;
    if (hi) aa ^= GF_POLY;
    bb >>= 1;
  }
  return p & 0xff;
}

function gfPow(a: number, e: number): number {
  let r = 1;
  let base = a;
  for (let i = 0; i < 8; i++) {
    if (e & 1) r = gfMul(r, base);
    base = gfMul(base, base);
    e >>= 1;
  }
  return r;
}

function gfInv(a: number): number {
  if (a === 0) throw new Error('cannot invert zero');
  return gfPow(a, 254);
}

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

/** Bytes → hex (shares are displayed as text). */
function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (clean.length % 2 !== 0 || !/^[0-9a-f]*$/.test(clean)) throw new Error('invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

/**
 * Real Shamir Secret Sharing.
 * Each byte of the secret is a polynomial coefficient a0 over GF(256);
 * share i is the polynomial evaluated at x=i+1.
 */
export function makeShares(secret: string, threshold: number, total: number): string[] {
  if (threshold < 2 || threshold > 10) throw new Error('threshold must be 2..10');
  if (total < threshold || total > 10) throw new Error('total must be >= threshold and <= 10');
  const data = utf8Encode(secret);
  // One polynomial per secret byte; coefficients are drawn ONCE so every share
  // lies on the same polynomial (fresh coefficients per share would break
  // reconstruction).
  const coeffs: number[][] = [];
  for (let bi = 0; bi < data.length; bi++) {
    const row: number[] = [];
    for (let j = 1; j < threshold; j++) row.push(randomBytes(1)[0]);
    coeffs.push(row);
  }
  const slices: Uint8Array[] = [];
  for (let x = 1; x <= total; x++) {
    const ys = new Uint8Array(data.length);
    for (let bi = 0; bi < data.length; bi++) {
      let acc = data[bi];
      let xp = x;
      for (let j = 1; j < threshold; j++) {
        acc ^= gfMul(coeffs[bi][j - 1], xp);
        xp = gfMul(xp, x);
      }
      ys[bi] = acc;
    }
    slices.push(ys);
  }
  return slices.map((ys, i) => `SS1:${i + 1}:${bytesToHex(ys)}`);
}

export function reconstructSecret(shares: string[]): string {
  const parsed = shares
    .map((s) => {
      const m = /^SS1:(\d+):([0-9a-fA-F]+)$/.exec(s.trim());
      if (!m) return null;
      return { x: parseInt(m[1], 10), ys: hexToBytes(m[2]) };
    })
    .filter((v): v is { x: number; ys: Uint8Array } => v !== null && v.x >= 1);
  if (parsed.length < 1) throw new Error('no valid shares');
  const lens = [...new Set(parsed.map((p) => p.ys.length))];
  if (lens.length !== 1) throw new Error('share lengths differ — corrupt shares');
  const out = new Uint8Array(lens[0]);
  for (let bi = 0; bi < lens[0]; bi++) {
    let acc = 0;
    for (const p of parsed) {
      // Lagrange basis at x=0
      let num = 1;
      let den = 1;
      for (const q of parsed) {
        if (q.x === p.x) continue;
        num = gfMul(num, q.x);
        den = gfMul(den, q.x ^ p.x);
      }
      acc ^= gfMul(gfMul(p.ys[bi], num), gfInv(den));
    }
    out[bi] = acc;
  }
  return utf8Decode(out);
}

/* ------------------------------ WebCrypto helpers ------------------------------ */
// Portable format: PGV1:<salt b64>:<iv b64>:<ciphertext b64>
const PBKDF2_ITERATIONS = 210000;

function bytesToBase64(b: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < b.length; i += 0x8000) {
    bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Copy into a plain ArrayBuffer so WebCrypto's BufferSource typing accepts it. */
function toArrayBuffer(b: Uint8Array): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(utf8Encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWithPassphrase(plaintext: string, passphrase: string): Promise<string> {
  if (!plaintext || !passphrase) throw new Error('password and key required');
  if (typeof crypto.subtle === 'undefined') throw new Error('WebCrypto unavailable in this runtime');
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(utf8Encode(plaintext))
  );
  return `PGV1:${bytesToBase64(salt)}:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ct))}`;
}

export async function decryptWithPassphrase(ciphertext: string, passphrase: string): Promise<string> {
  const parts = ciphertext.trim().split(':');
  if (parts.length !== 4 || parts[0] !== 'PGV1') throw new Error('unsupported ciphertext format');
  const salt = base64ToBytes(parts[1]);
  const iv = base64ToBytes(parts[2]);
  const ct = base64ToBytes(parts[3]);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ct));
  return utf8Decode(new Uint8Array(pt));
}

/* --------------------------------- component --------------------------------- */

const AdvancedPasswordManager = ({ theme }: AdvancedPasswordManagerProps) => {
  const cyber = !!theme?.cyberpunk;
  const cardCls = cyber
    ? 'bg-gray-900/70 border border-purple-500/30 rounded-xl shadow-lg p-6'
    : 'bg-white rounded-xl shadow-lg p-6';
  const headingCls = cyber ? 'text-cyan-400 text-xl font-bold mb-4' : 'text-gray-800 text-xl font-bold mb-4';
  const inputCls = cyber
    ? 'w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
    : 'w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = cyber ? 'block text-sm font-medium text-gray-300 mb-1' : 'block text-sm font-medium text-gray-700 mb-1';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [shamirShares, setShamirShares] = useState<string[]>([]);
  const [shamirReconstructInput, setShamirReconstructInput] = useState('');
  const [shamirReconstructed, setShamirReconstructed] = useState('');
  const [shamirThreshold, setShamirThreshold] = useState(3);
  const [shamirTotal, setShamirTotal] = useState(5);
  const [encryptedPassword, setEncryptedPassword] = useState('');
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [decryptInput, setDecryptInput] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [cryptoError, setCryptoError] = useState('');
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setRequirements(newRequirements);
    const fulfilled = Object.values(newRequirements).filter(Boolean).length;
    if (fulfilled === 0) {
      setStrength(0);
      setStrengthLabel('');
    } else if (fulfilled <= 1) {
      setStrength(1);
      setStrengthLabel('Very Weak');
    } else if (fulfilled <= 2) {
      setStrength(2);
      setStrengthLabel('Weak');
    } else if (fulfilled <= 3) {
      setStrength(3);
      setStrengthLabel('Medium');
    } else if (fulfilled <= 4) {
      setStrength(4);
      setStrengthLabel('Strong');
    } else {
      setStrength(5);
      setStrengthLabel('Very Strong');
    }
  }, [password]);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*(),.?":{}|<>';
    if (!charset) {
      setGeneratedPassword('');
      return;
    }
    // CSPRNG with rejection sampling to avoid modulo bias.
    const max = 256 - (256 % charset.length);
    let newPassword = '';
    while (newPassword.length < length) {
      const buf = randomBytes(length * 2);
      for (const v of buf) {
        if (newPassword.length >= length) break;
        if (v < max) newPassword += charset[v % charset.length];
      }
    }
    setGeneratedPassword(newPassword);
    setPassword(newPassword);
  };

  const generateShamirShares = () => {
    setCryptoError('');
    setShamirReconstructed('');
    if (!password) {
      alert('Please enter a password first');
      return;
    }
    try {
      setShamirShares(makeShares(password, shamirThreshold, shamirTotal));
    } catch (e) {
      setCryptoError(e instanceof Error ? e.message : 'Shamir generation failed');
    }
  };

  const reconstructShamir = () => {
    setCryptoError('');
    try {
      const lines = shamirReconstructInput.split('\n').map((l) => l.trim()).filter(Boolean);
      const secret = reconstructSecret(lines);
      setShamirReconstructed(secret);
    } catch (e) {
      setCryptoError(e instanceof Error ? e.message : 'reconstruction failed');
    }
  };

  const encryptPassword = async () => {
    setCryptoError('');
    try {
      setEncryptedPassword(await encryptWithPassphrase(password, encryptionKey));
      setDecryptedPassword('');
    } catch (e) {
      setCryptoError(e instanceof Error ? e.message : 'encryption failed');
    }
  };

  const decryptPassword = async () => {
    setCryptoError('');
    try {
      const text = decryptInput || encryptedPassword;
      if (!text) {
        alert('Enter ciphertext to decrypt');
        return;
      }
      setDecryptedPassword(await decryptWithPassphrase(text, encryptionKey));
    } catch (e) {
      setCryptoError(e instanceof Error ? e.message : 'decryption failed (wrong key or corrupt data)');
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const clearAll = () => {
    setPassword('');
    setGeneratedPassword('');
    setShamirShares([]);
    setShamirReconstructed('');
    setShamirReconstructInput('');
    setEncryptedPassword('');
    setDecryptedPassword('');
    setDecryptInput('');
    setEncryptionKey('');
    setCryptoError('');
  };

  return (
    <div className={`rounded-2xl p-4 md:p-8 ${cyber ? 'bg-gradient-to-br from-black to-purple-950/40 border border-purple-500/20' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="mx-auto">
        <header className="text-center mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${cyber ? 'text-cyan-400' : 'text-gray-800'}`}>Advanced Password Manager</h1>
          <p className={`max-w-2xl mx-auto ${cyber ? 'text-gray-300' : 'text-gray-600'}`}>
            Passwords generated with a CSPRNG, vault entries protected by real AES-256-GCM (PBKDF2-SHA256),
            and secrets split with real Shamir sharing over GF(256).
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strength */}
          <div className={cardCls}>
            <h2 className={headingCls}>Password Strength Checker</h2>
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cyber ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-300'}`}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className={`px-4 py-3 rounded-r-lg border border-l-0 ${cyber ? 'bg-gray-700 text-white border-gray-700' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className={`text-sm font-medium ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>Password Strength</span>
                  <span className={`text-sm font-medium ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>{strengthLabel}</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div key={bar} className={`h-2 flex-1 rounded-full ${bar <= strength ? (bar <= 2 ? 'bg-red-500' : bar <= 3 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-300'}`} />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`font-medium mb-2 ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>Requirements:</h3>
                <ul className="space-y-1">
                  {[
                    { ok: requirements.length, label: 'At least 8 characters' },
                    { ok: requirements.uppercase, label: 'At least one uppercase letter' },
                    { ok: requirements.lowercase, label: 'At least one lowercase letter' },
                    { ok: requirements.number, label: 'At least one number' },
                    { ok: requirements.special, label: 'At least one special character' }
                  ].map((r) => (
                    <li key={r.label} className="flex items-center">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${r.ok ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {r.ok && <span className="text-white text-xs">✓</span>}
                      </span>
                      <span className={`text-sm ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>{r.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => copyToClipboard(password)} disabled={!password} className={`flex-1 py-2 px-4 rounded-lg font-medium ${password ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                Copy Password
              </button>
              <button onClick={clearAll} className={`py-2 px-4 rounded-lg font-medium ${cyber ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                Clear All
              </button>
            </div>
          </div>

          {/* Generator */}
          <div className={cardCls}>
            <h2 className={headingCls}>Password Generator <span className="text-xs font-normal opacity-70">CSPRNG</span></h2>
            <div className="mb-6">
              <label className={labelCls}>Password Length</label>
              <div className="flex items-center">
                <input type="range" min="6" max="64" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer" />
                <span className={`ml-4 w-10 text-center font-medium ${cyber ? 'text-white' : 'text-gray-800'}`}>{length}</span>
              </div>
            </div>
            <div className="mb-6">
              <label className={labelCls}>Character Types</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'uppercase', label: 'Uppercase (A-Z)', value: includeUppercase, set: setIncludeUppercase },
                  { id: 'lowercase', label: 'Lowercase (a-z)', value: includeLowercase, set: setIncludeLowercase },
                  { id: 'numbers', label: 'Numbers (0-9)', value: includeNumbers, set: setIncludeNumbers },
                  { id: 'symbols', label: 'Symbols (!@#$...)', value: includeSymbols, set: setIncludeSymbols }
                ].map((opt) => (
                  <div key={opt.id} className="flex items-center">
                    <input type="checkbox" id={opt.id} checked={opt.value} onChange={() => opt.set(!opt.value)} className="h-4 w-4 rounded" />
                    <label htmlFor={opt.id} className={`ml-2 text-sm ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>{opt.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input type="text" value={generatedPassword} readOnly placeholder="Generated password will appear here" className={`flex-1 p-3 border rounded-l-lg ${cyber ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 border-gray-300'}`} />
                <button onClick={() => copyToClipboard(generatedPassword)} disabled={!generatedPassword} className={`px-4 py-3 rounded-r-lg ${generatedPassword ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>📋</button>
              </div>
            </div>
            <button onClick={generatePassword} className={`w-full py-3 text-white font-medium rounded-lg ${cyber ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              Generate Password
            </button>
          </div>

          {/* Shamir */}
          <div className={cardCls}>
            <h2 className={headingCls}>Shamir Secret Sharing <span className="text-xs font-normal opacity-70">GF(256)</span></h2>
            <div className="mb-4">
              <label className={labelCls}>Threshold (k)</label>
              <input type="number" min="2" max="10" value={shamirThreshold} onChange={(e) => setShamirThreshold(parseInt(e.target.value) || 2)} className={inputCls} />
              <p className={`text-xs mt-1 ${cyber ? 'text-gray-400' : 'text-gray-500'}`}>Minimum shares required to reconstruct</p>
            </div>
            <div className="mb-4">
              <label className={labelCls}>Total Shares (n)</label>
              <input type="number" min="2" max="10" value={shamirTotal} onChange={(e) => setShamirTotal(parseInt(e.target.value) || 5)} className={inputCls} />
            </div>
            <button onClick={generateShamirShares} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg mb-4">
              Generate Shares
            </button>
            {shamirShares.length > 0 && (
              <div className="mb-4">
                <h3 className={`font-medium mb-2 ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>Generated Shares</h3>
                <div className={`space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg ${cyber ? 'border-gray-700' : 'border-gray-200'}`}>
                  {shamirShares.map((share, index) => (
                    <div key={index} className={`flex items-center justify-between p-2 rounded ${cyber ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <span className={`text-sm font-mono truncate ${cyber ? 'text-green-300' : 'text-gray-700'}`}>{share}</span>
                      <button onClick={() => copyToClipboard(share)} className={`ml-2 ${cyber ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-500 hover:text-blue-700'}`}>📋</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              <h3 className={`font-medium mb-2 ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>Reconstruct (paste shares, one per line)</h3>
              <textarea value={shamirReconstructInput} onChange={(e) => setShamirReconstructInput(e.target.value)} rows={3} placeholder="SS1:1:…&#10;SS1:2:…" className={inputCls} />
              <button onClick={reconstructShamir} className={`mt-2 w-full py-2 rounded-lg font-medium ${cyber ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                Reconstruct Secret
              </button>
              {shamirReconstructed && (
                <div className={`mt-3 p-3 rounded-lg font-mono text-sm ${cyber ? 'bg-black/40 text-green-300 border border-green-500/40' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                  {shamirReconstructed}
                </div>
              )}
            </div>
          </div>

          {/* Encryption */}
          <div className={cardCls}>
            <h2 className={headingCls}>Vault Encryption <span className="text-xs font-normal opacity-70">AES-256-GCM</span></h2>
            <div className="mb-4">
              <label className={labelCls}>Master Key (passphrase)</label>
              <input type="password" value={encryptionKey} onChange={(e) => setEncryptionKey(e.target.value)} placeholder="Enter encryption key" className={inputCls} />
            </div>
            <div className="flex space-x-3 mb-4">
              <button onClick={() => void encryptPassword()} className={`flex-1 py-3 rounded-lg text-white font-medium ${cyber ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
                Encrypt Password
              </button>
              <button onClick={() => void decryptPassword()} className={`flex-1 py-3 rounded-lg font-medium ${cyber ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                Decrypt
              </button>
            </div>
            {encryptedPassword && (
              <div className="mb-4">
                <h3 className={`font-medium mb-2 ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>Encrypted Ciphertext (PGV1)</h3>
                <div className="flex items-center mb-2">
                  <input type="text" value={encryptedPassword} readOnly className={`flex-1 p-2 border rounded-lg ${cyber ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-100 border-gray-300'}`} />
                  <button onClick={() => copyToClipboard(encryptedPassword)} className="ml-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">Copy</button>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className={labelCls}>Ciphertext to decrypt (optional; uses result above)</label>
              <input type="text" value={decryptInput} onChange={(e) => setDecryptInput(e.target.value)} placeholder="PGV1:…" className={inputCls} />
            </div>
            {decryptedPassword && (
              <div className={`mb-4 p-3 rounded-lg font-mono text-sm ${cyber ? 'bg-black/40 text-green-300 border border-green-500/40' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                {decryptedPassword}
              </div>
            )}
            {cryptoError && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${cyber ? 'bg-red-950/50 text-red-300 border border-red-500/50' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                ⚠ {cryptoError}
              </div>
            )}
            <div className="mt-6">
              <h3 className={`font-medium mb-2 ${cyber ? 'text-gray-300' : 'text-gray-700'}`}>Security Tips</h3>
              <ul className={`text-sm space-y-1 ${cyber ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span>Use unique passwords for each account</span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span>Enable two-factor authentication where possible</span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span>Keep the vault master key offline; it is never stored</span></li>
                <li className="flex items-start"><span className="text-green-500 mr-2">✓</span><span>Regularly update your passwords</span></li>
              </ul>
            </div>
          </div>
        </div>

        <footer className={`mt-8 text-center text-sm ${cyber ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>Real cryptography in-app: PBKDF2-SHA256 (210k iterations) → AES-256-GCM, Shamir sharing over GF(2⁸) with the AES polynomial, CSPRNG generation. Ciphertexts never leave the device unless you export them.</p>
        </footer>
      </div>
    </div>
  );
};

export default AdvancedPasswordManager;
