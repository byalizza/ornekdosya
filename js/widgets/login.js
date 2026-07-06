// ============================================
// LOGIN + USER SELECTION
// ============================================

const LoginWidget = {
  currentUser: null,

  init() {
    this.pinInput = document.getElementById('loginPin');
    this.loginBtn = document.getElementById('loginBtn');
    this.loginError = document.getElementById('loginError');
    this.loginScreen = document.getElementById('loginScreen');
    this.userSelectScreen = document.getElementById('userSelectScreen');
    this.welcomeOverlay = document.getElementById('welcomeOverlay');
    this.mainApp = document.getElementById('mainApp');

    this.setupListeners();
    this.createParticles('loginParticles');
    this.createParticles('selectParticles');

    // Eski sistem varsa temizle
    if (localStorage.getItem('last_user')) localStorage.removeItem('last_user');

    // Kayıtlı kullanıcı varsa direkt şifre ekranı
    const saved = localStorage.getItem('app_user');
    if (saved) {
      this.currentUser = saved;
      window.currentUser = saved;
      this.showLoginScreen();
      return;
    }

    // İlk açılış: kullanıcı seçim ekranı
    this.userSelectScreen.style.display = 'flex';
  },

  setupListeners() {
    const claimUser = (user) => {
      this.currentUser = user;
      window.currentUser = user;
      localStorage.setItem('app_user', user);
      this.userSelectScreen.style.display = 'none';
      this.showLoginScreen();
    };

    document.getElementById('selectEfeBtn').addEventListener('click', () => claimUser('efe'));
    document.getElementById('selectElaBtn').addEventListener('click', () => claimUser('ela'));

    this.loginBtn.addEventListener('click', () => this.checkPassword());

    this.pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkPassword();
    });
    this.pinInput.addEventListener('input', () => {
      this.loginError.classList.remove('show');
      if (this.pinInput.value.length >= 8) this.checkPassword();
    });
  },

  createParticles(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (4 + Math.random() * 6) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      p.style.width = (2 + Math.random() * 4) + 'px';
      p.style.height = p.style.width;
      p.style.opacity = 0.1 + Math.random() * 0.3;
      container.appendChild(p);
    }
  },

  showLoginScreen() {
    this.loginScreen.style.display = 'flex';
    this.loginScreen.style.animation = 'fadeIn 0.6s ease';
  },

  checkPassword() {
    const pin = this.pinInput.value.trim();
    const secret = APP_CONFIG.secretDate;
    const expected = String(secret.day).padStart(2, '0') + String(secret.month).padStart(2, '0') + String(secret.year);

    if (pin === expected) {
      this.goToApp();
    } else {
      this.showError('Bu şifre bize ait değil... Bir daha dene 💕');
      this.shakeForm();
      this.pinInput.value = '';
      this.pinInput.focus();
    }
  },

  showError(msg) {
    this.loginError.textContent = msg;
    this.loginError.classList.add('show');
  },

  shakeForm() {
    const form = document.querySelector('.login-form');
    form.style.animation = 'shake 0.5s ease';
    setTimeout(() => form.style.animation = '', 500);
  },

  goToApp() {
    this.loginScreen.style.display = 'none';
    this.welcomeOverlay.style.display = 'flex';

    if (typeof ConfettiEffects !== 'undefined') {
      ConfettiEffects.fire(3000);
    }

    window.currentUser = this.currentUser;

    setTimeout(() => {
      this.welcomeOverlay.style.opacity = '0';
      this.welcomeOverlay.style.transition = 'opacity 0.6s ease';
      setTimeout(() => {
        this.welcomeOverlay.style.display = 'none';
        this.mainApp.style.display = 'flex';

        if (typeof KalbimWidget !== 'undefined') KalbimWidget.autoPlay();
        requestNotificationPermission();
      }, 600);
    }, 3000);
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
    20%, 40%, 60%, 80% { transform: translateX(6px); }
  }
`;
document.head.appendChild(styleSheet);
