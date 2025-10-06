// battle-animations.js

/**
 * Start a quantum battle simulation with AI bots
 */
function startQuantumBattle() {
    const battleLog = document.getElementById('battleLog');
    
    // Clear previous battle
    battleLog.innerHTML = '';
    
    // Show loading state
    const loadingElement = document.createElement('div');
    loadingElement.className = 'battle-round';
    loadingElement.innerHTML = `
        <div class="bot-action" style="text-align: center;">
            <span class="loading"></span>
            <span style="margin-left: 10px;">Initializing Quantum Battle Sequence...</span>
        </div>
    `;
    battleLog.appendChild(loadingElement);
    
    // Remove loading after 500ms
    setTimeout(() => {
        battleLog.removeChild(loadingElement);
    }, 500);
    
    // Define battle sequence with AI bots
    const battleSequence = [
        { 
            bot: "Quantum Builder AI", 
            action: "⚡ Quantum Deploy", 
            effect: "Infrastructure optimized",
            delay: 1000,
            xp: 250,
            confidence: 50
        },
        { 
            bot: "Neural Security AI", 
            action: "🛡️ Threat Neutralized", 
            effect: "Security protocols activated",
            delay: 1500,
            xp: 300,
            confidence: 40
        },
        { 
            bot: "Legal Warrior AI", 
            action: "⚖️ Legal Strategy Deployed", 
            effect: "Documentation strengthened",
            delay: 2000,
            xp: 350,
            confidence: 60
        },
        { 
            bot: "Father Nexus AI", 
            action: "🤝 Network Strength +50", 
            effect: "Allied support secured",
            delay: 2500,
            xp: 200,
            confidence: 45
        }
    ];
    
    // Execute battle sequence
    battleSequence.forEach((round, index) => {
        setTimeout(() => {
            const roundElement = document.createElement('div');
            roundElement.className = 'battle-round';
            roundElement.innerHTML = `
                <div class="round-number">Round ${index + 1}</div>
                <div class="bot-action">
                    <strong>${round.bot}</strong> uses <strong>${round.action}</strong>
                </div>
                <div style="color: rgba(255,255,255,0.7); margin: 8px 0; font-style: italic;">
                    ${round.effect}
                </div>
                <div class="battle-effects">
                    <span class="damage">+${round.xp} XP</span>
                    <span class="heal">+${round.confidence} Confidence</span>
                </div>
            `;
            
            // Add slide-in animation
            roundElement.style.animation = 'slideIn 0.5s ease-out';
            battleLog.appendChild(roundElement);
            
            // Scroll to bottom to show latest round
            battleLog.scrollTop = battleLog.scrollHeight;
            
            // Add success sound effect (visual feedback)
            roundElement.style.borderLeftColor = '#00ff00';
            setTimeout(() => {
                roundElement.style.borderLeftColor = 'var(--electric-cyan)';
            }, 300);
            
        }, round.delay);
    });
    
    // Show battle complete message
    setTimeout(() => {
        const completeElement = document.createElement('div');
        completeElement.className = 'battle-round success-animation';
        completeElement.style.background = 'rgba(0, 255, 0, 0.1)';
        completeElement.style.borderLeftColor = '#00ff00';
        completeElement.innerHTML = `
            <div class="bot-action" style="text-align: center; font-size: 1.2rem;">
                🎉 <strong>QUANTUM BATTLE COMPLETE!</strong> 🎉
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <div class="battle-effects" style="justify-content: center;">
                    <span class="damage">Total XP: +1,100</span>
                    <span class="heal">Total Confidence: +195</span>
                </div>
            </div>
            <div style="text-align: center; margin-top: 15px; color: rgba(255,255,255,0.7);">
                Battle Points increased! Check your profile for updates.
            </div>
        `;
        battleLog.appendChild(completeElement);
        battleLog.scrollTop = battleLog.scrollHeight;
        
        // Optional: Update stats (if you want to make it interactive)
        updateBattleStats(1100, 195);
        
    }, 3500);
}

/**
 * Update battle statistics after battle completion
 * @param {number} xpGained - Total XP gained
 * @param {number} confidenceGained - Total confidence gained
 */
function updateBattleStats(xpGained, confidenceGained) {
    // Find and update battle points if on dashboard
    const battlePointsElement = document.querySelector('.stat-value');
    if (battlePointsElement) {
        const currentPoints = parseInt(battlePointsElement.textContent.replace(',', ''));
        const newPoints = currentPoints + Math.floor(xpGained / 10);
        
        // Animate the change
        animateValue(battlePointsElement, currentPoints, newPoints, 1000);
    }
    
    // Update XP bar
    const xpProgress = document.querySelector('.xp-progress');
    if (xpProgress) {
        const currentWidth = parseInt(xpProgress.style.width);
        const newWidth = Math.min(100, currentWidth + 10); // Add 10% progress
        xpProgress.style.width = newWidth + '%';
        
        // Add level-up animation if reached 100%
        if (newWidth >= 100) {
            const levelBadge = document.querySelector('.level-badge');
            if (levelBadge) {
                levelBadge.classList.add('level-up-animation');
                setTimeout(() => {
                    levelBadge.classList.remove('level-up-animation');
                }, 500);
            }
        }
    }
}

/**
 * Animate number value change
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Animation duration in ms
 */
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16); // 60 FPS
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

/**
 * Initialize interactive bot actions
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add click handlers to action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add success animation
            this.classList.add('success-animation');
            
            // Show feedback
            const originalText = this.textContent;
            this.textContent = '✓ Activated!';
            this.style.background = 'linear-gradient(45deg, #00ff00, #00aa00)';
            
            // Reset after 1 second
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.classList.remove('success-animation');
            }, 1000);
        });
    });
    
    // Add hover effect to evidence cards
    const evidenceCards = document.querySelectorAll('.evidence-card');
    
    evidenceCards.forEach(card => {
        card.addEventListener('click', function() {
            // Toggle expanded view
            this.classList.toggle('expanded');
            
            // Could add more detailed view here
            console.log('Evidence card clicked:', this.querySelector('.evidence-title').textContent);
        });
    });
    
    // Add keyboard shortcut for quick battle start (Space key)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            const startBattleBtn = document.querySelector('.start-battle-btn');
            if (startBattleBtn) {
                startBattleBtn.click();
            }
        }
    });
});

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'rgba(0, 255, 0, 0.9)' : 'rgba(0, 255, 255, 0.9)'};
        color: black;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.5s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Export functions for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startQuantumBattle,
        updateBattleStats,
        showNotification
    };
}
