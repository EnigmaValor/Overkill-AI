function startQuantumBattle() {
  const battleLog = document.getElementById('battleLog');
  if (!battleLog) return;
  battleLog.innerHTML = '';

  const battleSequence = [
    { bot: 'Quantum Builder AI', action: '⚡ Quantum Deploy', delay: 1000 },
    { bot: 'Neural Security AI', action: '🛡️ Threat Neutralized', delay: 1500 },
    { bot: 'Legal Warrior AI', action: '⚖️ Legal Strategy Deployed', delay: 2000 },
    { bot: 'Father Nexus AI', action: '🤝 Network Strength +50', delay: 2500 },
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
      roundElement.style.animation = 'slideIn 0.5s ease-out';
      battleLog.appendChild(roundElement);
      battleLog.scrollTop = battleLog.scrollHeight;
    }, round.delay);
  });
}
