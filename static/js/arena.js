// AMENEO Arena interactions
function showLogin() {
  alert('Quantum Login coming soon');
}

function showRegister() {
  alert('Join Revolution flow coming soon');
}

function startQuantumBattle() {
  const battleLog = document.getElementById('battleLog');
  if (!battleLog) return;
  battleLog.innerHTML = '';

  const battleSequence = [
    { bot: 'Quantum Builder AI', action: '⚡ Quantum Deploy', delay: 800 },
    { bot: 'Neural Security AI', action: '🛡️ Threat Neutralized', delay: 1400 },
    { bot: 'Legal Warrior AI', action: '⚖️ Legal Strategy Deployed', delay: 2000 },
    { bot: 'Father Nexus AI', action: '🤝 Network Strength +50', delay: 2600 }
  ];

  battleSequence.forEach((round, index) => {
    setTimeout(() => {
      const roundElement = document.createElement('div');
      roundElement.className = 'battle-round';
      roundElement.innerHTML = `
        <div class="round-number">Round ${index + 1}</div>
        <div class="bot-action">${round.bot} uses ${round.action}</div>
        <div class="battle-effects">
          <span class="damage">+250 XP</span>
          <span class="heal">+50 Confidence</span>
        </div>
      `;
      battleLog.appendChild(roundElement);
      battleLog.scrollTop = battleLog.scrollHeight;
    }, round.delay);
  });

  // Simulate XP bar animation if present
  const xpProgress = document.querySelector('.xp-progress');
  if (xpProgress) {
    requestAnimationFrame(() => {
      xpProgress.style.width = '75%';
      xpProgress.classList.add('level-up-animation');
      setTimeout(() => xpProgress.classList.remove('level-up-animation'), 800);
    });
  }
}

// Expose globally for inline onclick handlers
window.showLogin = showLogin;
window.showRegister = showRegister;
window.startQuantumBattle = startQuantumBattle;
