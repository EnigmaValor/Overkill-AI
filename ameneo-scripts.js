// AMENEO Arena - Quantum Tech JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Application State
let appState = {
    currentUser: null,
    isLoggedIn: false,
    battleInProgress: false,
    bots: [
        {
            id: 'quantum-builder',
            name: 'Quantum Builder AI',
            avatar: '⚛️',
            power: 95,
            specialty: 'Infrastructure & Project Management',
            status: 'online',
            actions: ['Deploy Project', 'Optimize System']
        },
        {
            id: 'neural-security',
            name: 'Neural Security AI',
            avatar: '🛡️',
            power: 88,
            specialty: 'Privacy & Digital Security',
            status: 'online',
            actions: ['Scan Threats', 'Monitor Communications']
        },
        {
            id: 'legal-warrior',
            name: 'Legal Warrior AI',
            avatar: '⚖️',
            power: 92,
            specialty: 'Legal Strategy & Documentation',
            status: 'online',
            actions: ['Legal Analysis', 'Draft Documents']
        },
        {
            id: 'father-nexus',
            name: 'Father Nexus AI',
            avatar: '🤝',
            power: 85,
            specialty: 'Network Building & Support',
            status: 'online',
            actions: ['Connect Fathers', 'Analyze Patterns']
        }
    ],
    userStats: {
        battlePoints: 1250,
        evidenceFiles: 47,
        networkAllies: 12,
        xp: 7500,
        maxXp: 10000,
        level: 5
    }
};

// Initialize Application
function initializeApp() {
    setupEventListeners();
    setupQuantumEffects();
    showSection('hero'); // Start with hero section
    
    // Check for existing session
    const savedUser = localStorage.getItem('ameneoUser');
    if (savedUser) {
        appState.currentUser = JSON.parse(savedUser);
        appState.isLoggedIn = true;
        updateUserInterface();
    }
}

// Event Listeners
function setupEventListeners() {
    // Modal event listeners
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
    
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Bot action buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('action-btn')) {
            handleBotAction(e.target);
        }
    });
    
    // Evidence buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('evidence-btn')) {
            handleEvidenceAction(e.target);
        }
    });
}

// Navigation Functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.hero-section, .dashboard-section, .about-section');
    sections.forEach(section => {
        section.classList.remove('active-section');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
    
    // Update navigation state
    updateNavigationState(sectionName);
}

function updateNavigationState(activeSection) {
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (activeSection === 'dashboard' && !appState.isLoggedIn) {
        // Redirect to login if trying to access dashboard without being logged in
        showLogin();
        return;
    }
    
    // Update navigation visual state if needed
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
}

// Modal Functions
function showLogin() {
    const loginModal = document.getElementById('loginModal');
    loginModal.style.display = 'block';
    
    // Add entrance animation
    const modalContent = loginModal.querySelector('.modal-content');
    modalContent.style.animation = 'modal-slide-in 0.3s ease-out';
}

function showRegister() {
    const registerModal = document.getElementById('registerModal');
    registerModal.style.display = 'block';
    
    // Add entrance animation
    const modalContent = registerModal.querySelector('.modal-content');
    modalContent.style.animation = 'modal-slide-in 0.3s ease-out';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    
    // Add exit animation
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.animation = 'modal-slide-out 0.3s ease-in';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simulate login process
    showQuantumLoading('Quantum Authentication in Progress...');
    
    setTimeout(() => {
        // Simulate successful login
        appState.currentUser = {
            name: 'Quantum Father',
            email: email,
            level: 5,
            joinDate: new Date().toISOString()
        };
        appState.isLoggedIn = true;
        
        // Save to localStorage
        localStorage.setItem('ameneoUser', JSON.stringify(appState.currentUser));
        
        hideQuantumLoading();
        closeModal('loginModal');
        
        // Show success message
        showQuantumNotification('🚀 Quantum Authentication Successful!', 'success');
        
        // Navigate to dashboard
        showSection('dashboard');
        updateUserInterface();
        
        // Clear form
        document.getElementById('loginForm').reset();
    }, 2000);
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const childrenCount = document.getElementById('childrenCount').value;
    
    // Simulate registration process
    showQuantumLoading('Creating Quantum Profile...');
    
    setTimeout(() => {
        // Simulate successful registration
        appState.currentUser = {
            name: name,
            email: email,
            level: 1,
            childrenCount: childrenCount,
            joinDate: new Date().toISOString()
        };
        appState.isLoggedIn = true;
        
        // Reset stats for new user
        appState.userStats = {
            battlePoints: 0,
            evidenceFiles: 0,
            networkAllies: 0,
            xp: 0,
            maxXp: 1000,
            level: 1
        };
        
        // Save to localStorage
        localStorage.setItem('ameneoUser', JSON.stringify(appState.currentUser));
        
        hideQuantumLoading();
        closeModal('registerModal');
        
        // Show success message
        showQuantumNotification('🌟 Quantum Profile Created! Welcome to the Revolution!', 'success');
        
        // Navigate to dashboard
        showSection('dashboard');
        updateUserInterface();
        
        // Clear form
        document.getElementById('registerForm').reset();
        
        // Show welcome sequence
        setTimeout(() => {
            startWelcomeSequence();
        }, 1000);
    }, 2500);
}

// UI Update Functions
function updateUserInterface() {
    if (!appState.isLoggedIn) return;
    
    // Update user name in profile
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = appState.currentUser.name;
    }
    
    // Update level badge
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) {
        levelBadge.setAttribute('data-level', appState.userStats.level);
    }
    
    // Update XP bar
    const xpProgress = document.querySelector('.xp-progress');
    const xpText = document.querySelector('.xp-text');
    if (xpProgress && xpText) {
        const xpPercentage = (appState.userStats.xp / appState.userStats.maxXp) * 100;
        xpProgress.style.width = xpPercentage + '%';
        xpText.textContent = `${appState.userStats.xp.toLocaleString()} / ${appState.userStats.maxXp.toLocaleString()} XP`;
    }
    
    // Update stats
    updateStatValues();
}

function updateStatValues() {
    const stats = document.querySelectorAll('.stat');
    
    stats.forEach((stat, index) => {
        const valueElement = stat.querySelector('.stat-value');
        if (valueElement) {
            switch(index) {
                case 0:
                    valueElement.textContent = appState.userStats.battlePoints.toLocaleString();
                    break;
                case 1:
                    valueElement.textContent = appState.userStats.evidenceFiles;
                    break;
                case 2:
                    valueElement.textContent = appState.userStats.networkAllies;
                    break;
            }
        }
    });
}

// Battle System
function startQuantumBattle() {
    if (appState.battleInProgress) return;
    
    appState.battleInProgress = true;
    const battleLog = document.getElementById('battleLog');
    const startButton = document.querySelector('.start-battle-btn');
    
    // Disable start button
    startButton.disabled = true;
    startButton.textContent = '⚔️ Battle in Progress...';
    
    // Clear previous battle
    battleLog.innerHTML = '';
    
    // Show battle initiation
    addBattleMessage('🎮 Quantum Battle Arena Activated!', 'system');
    addBattleMessage('🤖 AI Squadron Deployment Initiated...', 'system');
    
    // Battle sequence
    const battleSequence = [
        { 
            bot: 'Quantum Builder AI', 
            action: '⚡ Quantum Deploy Protocol', 
            result: 'Infrastructure optimized +250 XP',
            delay: 1500 
        },
        { 
            bot: 'Neural Security AI', 
            action: '🛡️ Threat Matrix Scan', 
            result: 'Security vulnerabilities neutralized +200 XP',
            delay: 2500 
        },
        { 
            bot: 'Legal Warrior AI', 
            action: '⚖️ Legal Strategy Matrix', 
            result: 'Documentation framework deployed +300 XP',
            delay: 3500 
        },
        { 
            bot: 'Father Nexus AI', 
            action: '🤝 Network Amplification', 
            result: 'Alliance strength increased +150 XP',
            delay: 4500 
        }
    ];
    
    // Execute battle sequence
    battleSequence.forEach((round, index) => {
        setTimeout(() => {
            executeBattleRound(round, index + 1);
            
            // If this is the last round, end the battle
            if (index === battleSequence.length - 1) {
                setTimeout(() => {
                    endQuantumBattle();
                }, 1000);
            }
        }, round.delay);
    });
}

function executeBattleRound(round, roundNumber) {
    const battleLog = document.getElementById('battleLog');
    
    // Create round element
    const roundElement = document.createElement('div');
    roundElement.className = 'battle-round';
    roundElement.style.animation = 'slideIn 0.5s ease-out';
    
    roundElement.innerHTML = `
        <div class="round-number">Round ${roundNumber}</div>
        <div class="bot-action">${round.bot} uses ${round.action}</div>
        <div class="battle-effects">
            <span class="heal">${round.result}</span>
        </div>
    `;
    
    battleLog.appendChild(roundElement);
    battleLog.scrollTop = battleLog.scrollHeight;
    
    // Add XP based on result
    const xpGain = parseInt(round.result.match(/\d+/)[0]);
    addXP(xpGain);
    
    // Visual effects
    addQuantumEffect();
}

function endQuantumBattle() {
    const battleLog = document.getElementById('battleLog');
    const startButton = document.querySelector('.start-battle-btn');
    
    // Add victory message
    addBattleMessage('🏆 Quantum Battle Complete! Victory Achieved!', 'victory');
    addBattleMessage('📊 Battle Statistics Updated', 'system');
    
    // Update battle points
    appState.userStats.battlePoints += Math.floor(Math.random() * 200) + 100;
    updateStatValues();
    
    // Re-enable start button
    startButton.disabled = false;
    startButton.textContent = '⚡ Start Quantum Battle';
    appState.battleInProgress = false;
    
    // Show completion notification
    showQuantumNotification('🎯 Quantum Battle Completed Successfully!', 'success');
}

function addBattleMessage(message, type = 'normal') {
    const battleLog = document.getElementById('battleLog');
    const messageElement = document.createElement('div');
    messageElement.className = `battle-message ${type}`;
    
    let icon = '🎮';
    switch(type) {
        case 'system': icon = '🔧'; break;
        case 'victory': icon = '🏆'; break;
        case 'warning': icon = '⚠️'; break;
    }
    
    messageElement.innerHTML = `
        <span class="battle-icon">${icon}</span>
        <span class="battle-text">${message}</span>
    `;
    
    battleLog.appendChild(messageElement);
    battleLog.scrollTop = battleLog.scrollHeight;
}

// XP and Leveling System
function addXP(amount) {
    appState.userStats.xp += amount;
    
    // Check for level up
    if (appState.userStats.xp >= appState.userStats.maxXp) {
        levelUp();
    }
    
    updateUserInterface();
}

function levelUp() {
    appState.userStats.level++;
    appState.userStats.xp = appState.userStats.xp - appState.userStats.maxXp;
    appState.userStats.maxXp = Math.floor(appState.userStats.maxXp * 1.5);
    
    // Visual level up effect
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) {
        levelBadge.style.animation = 'level-up-animation 1s ease-in-out';
        setTimeout(() => {
            levelBadge.style.animation = '';
        }, 1000);
    }
    
    // Show level up notification
    showQuantumNotification(`🌟 Level Up! You are now Level ${appState.userStats.level}!`, 'success');
    
    // Save progress
    localStorage.setItem('ameneoUser', JSON.stringify(appState.currentUser));
}

// Bot Actions
function handleBotAction(button) {
    const botCard = button.closest('.bot-card');
    const botName = botCard.querySelector('.bot-name').textContent;
    const actionText = button.textContent.trim();
    
    // Disable button temporarily
    button.disabled = true;
    button.style.opacity = '0.6';
    
    // Show action notification
    showQuantumNotification(`${botName} is executing: ${actionText}`, 'info');
    
    // Simulate action completion
    setTimeout(() => {
        button.disabled = false;
        button.style.opacity = '1';
        
        // Add some XP for using bots
        addXP(Math.floor(Math.random() * 50) + 25);
        
        // Success notification
        showQuantumNotification(`${actionText} completed successfully!`, 'success');
        
        // Update stats
        if (actionText.includes('Evidence') || actionText.includes('Analysis')) {
            appState.userStats.evidenceFiles++;
        }
        if (actionText.includes('Connect') || actionText.includes('Network')) {
            appState.userStats.networkAllies += Math.floor(Math.random() * 2) + 1;
        }
        
        updateStatValues();
    }, 2000);
}

// Evidence Actions
function handleEvidenceAction(button) {
    const evidenceCard = button.closest('.evidence-card');
    const evidenceTitle = evidenceCard.querySelector('.evidence-title').textContent;
    const actionText = button.textContent.trim();
    
    // Show action feedback
    button.style.background = 'var(--neural-green)';
    button.style.color = 'white';
    
    setTimeout(() => {
        button.style.background = '';
        button.style.color = '';
    }, 500);
    
    showQuantumNotification(`${actionText}: ${evidenceTitle}`, 'info');
}

// Notification System
function showQuantumNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.quantum-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `quantum-notification ${type}`;
    
    let backgroundColor, borderColor;
    switch(type) {
        case 'success':
            backgroundColor = 'rgba(0, 255, 136, 0.2)';
            borderColor = 'var(--neural-green)';
            break;
        case 'warning':
            backgroundColor = 'rgba(255, 107, 53, 0.2)';
            borderColor = 'var(--warning-orange)';
            break;
        case 'error':
            backgroundColor = 'rgba(255, 0, 255, 0.2)';
            borderColor = 'var(--plasma-pink)';
            break;
        default:
            backgroundColor = 'rgba(0, 255, 255, 0.2)';
            borderColor = 'var(--electric-cyan)';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 3000;
        background: ${backgroundColor};
        border: 2px solid ${borderColor};
        border-radius: 12px;
        padding: 16px 24px;
        color: white;
        font-weight: 600;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Loading System
function showQuantumLoading(message = 'Processing...') {
    // Remove existing loader
    const existingLoader = document.querySelector('.quantum-loader');
    if (existingLoader) {
        existingLoader.remove();
    }
    
    const loader = document.createElement('div');
    loader.className = 'quantum-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 4000;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
    `;
    
    loader.innerHTML = `
        <div style="font-size: 3rem; animation: quantum-spin 2s linear infinite; margin-bottom: 20px;">⚛️</div>
        <div style="font-family: var(--font-primary); font-size: 1.2rem; color: var(--electric-cyan);">${message}</div>
        <div style="margin-top: 20px; width: 200px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: var(--cyber-gradient); animation: loading-bar 2s ease-in-out infinite;"></div>
        </div>
    `;
    
    document.body.appendChild(loader);
}

function hideQuantumLoading() {
    const loader = document.querySelector('.quantum-loader');
    if (loader) {
        loader.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (loader.parentNode) {
                loader.remove();
            }
        }, 300);
    }
}

// Welcome Sequence for New Users
function startWelcomeSequence() {
    const messages = [
        '🌟 Welcome to AMENEO Arena!',
        '🤖 Your AI Squadron is Ready for Deployment',
        '📊 Start Building Your Evidence Vault',
        '⚔️ Ready for Your First Quantum Battle?'
    ];
    
    messages.forEach((message, index) => {
        setTimeout(() => {
            showQuantumNotification(message, 'info');
        }, index * 1500);
    });
}

// Quantum Visual Effects
function setupQuantumEffects() {
    // Add particle effects to hero section
    createQuantumParticles();
    
    // Add periodic quantum pulses
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every interval
            addQuantumEffect();
        }
    }, 5000);
}

function createQuantumParticles() {
    const particleContainer = document.querySelector('.quantum-particles');
    if (!particleContainer) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--electric-cyan);
            border-radius: 50%;
            animation: particle-float ${3 + Math.random() * 4}s ease-in-out infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: 0.6;
        `;
        particleContainer.appendChild(particle);
    }
}

function addQuantumEffect() {
    const glowElements = document.querySelectorAll('.bot-card, .profile-card, .evidence-card');
    const randomElement = glowElements[Math.floor(Math.random() * glowElements.length)];
    
    if (randomElement) {
        randomElement.style.animation = 'quantum-pulse 1s ease-in-out';
        setTimeout(() => {
            randomElement.style.animation = '';
        }, 1000);
    }
}

// Logout Function
function logout() {
    appState.currentUser = null;
    appState.isLoggedIn = false;
    localStorage.removeItem('ameneoUser');
    
    showQuantumNotification('🔐 Quantum Session Terminated', 'info');
    showSection('hero');
}

// Add additional CSS for animations via JavaScript
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes loading-bar {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(0); }
}

@keyframes particle-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
    25% { transform: translateY(-20px) rotate(90deg); opacity: 1; }
    50% { transform: translateY(-10px) rotate(180deg); opacity: 0.8; }
    75% { transform: translateY(-30px) rotate(270deg); opacity: 0.6; }
}

@keyframes level-up-animation {
    0% { transform: scale(1); filter: hue-rotate(0deg); }
    50% { transform: scale(1.2); filter: hue-rotate(180deg); }
    100% { transform: scale(1); filter: hue-rotate(360deg); }
}

.modal-slide-out {
    animation: modal-slide-out 0.3s ease-in !important;
}

@keyframes modal-slide-out {
    from { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
    to { 
        opacity: 0; 
        transform: translateY(-50px) scale(0.9); 
    }
}
`;
document.head.appendChild(additionalStyles);

// Make functions globally available
window.showSection = showSection;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.closeModal = closeModal;
window.startQuantumBattle = startQuantumBattle;
window.logout = logout;