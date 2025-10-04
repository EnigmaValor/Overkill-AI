import React from 'react';

export default function BuildGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans p-8">
      <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        Cloud Setup Builder - Build & Run Guide
      </h1>
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-3">1. Forudsætninger</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li><strong>Node.js</strong> (v18+): <a href="https://nodejs.org/" className="text-cyan-400 underline" target="_blank" rel="noreferrer">Download her</a></li>
            <li><strong>npm</strong> eller <strong>yarn</strong>: Kommer med Node.js</li>
            <li><strong>Multipass</strong> (til Linux VMs): <code className="bg-slate-800 px-2 py-1 rounded">sudo snap install multipass</code></li>
            <li><strong>Android Studio</strong> (til Android-udvikling): <a href="https://developer.android.com/studio" className="text-cyan-400 underline" target="_blank" rel="noreferrer">Download her</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">2. Klon og kør projektet</h2>
          <pre className="bg-slate-800 p-4 rounded text-sm font-mono overflow-x-auto">
{`# Klon repository
git clone <din-repo-url>
cd cloud-setup-builder

# Installer afhængigheder
npm install

# Start udviklingsserveren
npm run dev
`}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">3. Byg til produktion</h2>
          <pre className="bg-slate-800 p-4 rounded text-sm font-mono overflow-x-auto">
{`# Byg projektet
npm run build

# Start produktionsserver
npm start
`}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">4. Konfigurer Multipass til Linux-udvikling</h2>
          <pre className="bg-slate-800 p-4 rounded text-sm font-mono overflow-x-auto">
{`# Opret en ny Ubuntu VM
multipass launch --name ubuntu-dev --mem 4G --disk 40G

# Adgang til VM
multipass shell ubuntu-dev

# Installer afhængigheder i VM
sudo apt update
sudo apt install -y build-essential git python3
`}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">5. Konfigurer Android Studio</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Åbn Android Studio</li>
            <li>Gå til <code>Tools &gt; SDK Manager</code></li>
            <li>Installer:
              <ul className="list-disc list-inside ml-6">
                <li>Android SDK Platform-Tools</li>
                <li>NDK (Native Development Kit)</li>
                <li>Emulator</li>
              </ul>
            </li>
            <li>Opret en virtuel enhed i AVD Manager</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">6. Byg dine projekter</h2>
          <p className="text-gray-300">I applikationen kan du:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Oprette nye projekter (Android/Linux/Hybrid)</li>
            <li>Generere kode med AI</li>
            <li>Bygge og deploye direkte fra UI</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">7. Byg ISO/APK</h2>
          <p className="text-gray-300"><strong>Til Linux:</strong></p>
          <pre className="bg-slate-800 p-4 rounded text-sm font-mono overflow-x-auto">
{`multipack build --format iso --output my-app.iso
`}
          </pre>
          <p className="text-gray-300"><strong>Til Android:</strong></p>
          <pre className="bg-slate-800 p-4 rounded text-sm font-mono overflow-x-auto">
{`./gradlew assembleRelease
`}
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">8. Kør i produktion</h2>
          <pre className="bg-slate-800 p-4 rounded text-sm font-mono overflow-x-auto">
{`# Stop udviklingsserver (Ctrl+C)
# Start produktionsserver
npm start
`}
          </pre>
          <p className="text-gray-300">Applikationen vil nu køre på <code>http://localhost:3000</code></p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3">Tips til optimal brug</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Brug "Guide"-tabben for trin-for-trin opsætning</li>
            <li>Generer kode med AI ved at beskrive din app i "AI"-tabben</li>
            <li>Overvåg build-metrics i realtid på dashboardet</li>
            <li>Brug Multipass til at teste Linux-applikationer i isolerede miljøer</li>
          </ul>
          <p className="mt-4 text-gray-400 text-sm italic">Har du problemer med installationen? Tjek "Guide"-tabben i applikationen for detaljerede instruktioner med kommandoer og fejlfinding.</p>
        </section>
      </div>
    </div>
  );
}