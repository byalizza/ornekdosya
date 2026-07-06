// ============================================
// MAIN APP - Bu Aşk Bitmez
// ============================================

const App = {
  isReady: false,

  async init() {
    initFirebase();

    // Splash'a tıklayınca tam ekran + login'e geç
    const splash = document.getElementById('splashScreen');
    const splashInner = document.getElementById('splashInner');
    if (splashInner) {
      splashInner.style.cursor = 'pointer';
      const onSplashTap = () => {
        document.documentElement.requestFullscreen().catch(() => {});
        splashInner.removeEventListener('click', onSplashTap);
        splashInner.removeEventListener('touchstart', onSplashTap);
      };
      splashInner.addEventListener('click', onSplashTap);
      splashInner.addEventListener('touchstart', onSplashTap);
    }

    setTimeout(() => {
      splash.style.display = 'none';
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('loginScreen').style.animation = 'fadeIn 0.6s ease';

      this.navHistory = [];
      this.initializeWidgets();
      this.setupNavigation();
      this.setupBackButton();
    }, 2800);
  },

  initializeWidgets() {
    try { LoginWidget.init(); } catch (e) { console.warn('Login hatasi:', e); }
    try { KalbimWidget.init(); } catch (e) { console.warn('Kalbim hatasi:', e); }
    try { AnilarWidget.init(); } catch (e) { console.warn('Anilar hatasi:', e); }
    try { ProfilWidget.init(); } catch (e) { console.warn('Profil hatasi:', e); }
    try { MessageWidget.init(); } catch (e) { console.warn('Mesaj hatasi:', e); }
    try { LocketWidget.init(); } catch (e) { console.warn('Locket hatasi:', e); }
    try { initTheme(); } catch (e) { console.warn('Tema hatasi:', e); }

    // MessageWidget welcome sonrasi init edilir (login.js icinde)
    this.setupFullscreen();
    this.setupInitialWidgetState();
    this.setupKeyboardHandler();
    this.isReady = true;
    console.log('💖 Bu Aşk Bitmez - Uygulama hazır!');
  },

  setupInitialWidgetState() {
    document.querySelectorAll('.widget').forEach(w => {
      if (!w.classList.contains('active')) {
        w.style.display = 'none';
      }
    });
  },

  setupKeyboardHandler() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        // keyboard handling
      });
    }
  },

  setupFullscreen() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
    document.addEventListener('fullscreenchange', () => {
      btn.innerHTML = document.fullscreenElement
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
    });
  },

  switchTo(targetId, saveHistory) {
    if (!targetId) return;
    const navItems = document.querySelectorAll('.nav-item');
    const currentActive = document.querySelector('.nav-item.active');
    if (saveHistory && currentActive) {
      const prevId = currentActive.dataset.target;
      if (prevId !== targetId) this.navHistory.push(prevId);
    }

    // Deactivate current widget
    if (currentActive) {
      const prevWidget = document.querySelector('.widget.active');
      if (prevWidget && prevWidget.id) {
        const wName = prevWidget.id.replace('Widget', '');
        const wObj = window[wName + 'Widget'];
        if (wObj && typeof wObj.onDeactivate === 'function') wObj.onDeactivate();
      }
    }

    navItems.forEach(n => n.classList.remove('active'));
    const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (targetNav) targetNav.classList.add('active');

    document.querySelectorAll('.widget').forEach(w => {
      w.classList.remove('active');
      w.style.display = 'none';
    });
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
      target.style.display = '';
      const wName = targetId.replace('Widget', '');
      const wObj = window[wName + 'Widget'];
      if (wObj && typeof wObj.onActivate === 'function') wObj.onActivate();
    }
  },

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        this.switchTo(item.dataset.target, true);
        if (item.dataset.target === 'petWidget' && typeof MessageWidget !== 'undefined') {
          MessageWidget.hideBadge();
        }
      });
    });
  },

  setupBackButton() {
    const btn = document.getElementById('backBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const prev = this.navHistory.pop();
      if (prev) this.switchTo(prev, false);
    });
  }
};

// ============================================
// THEME SYSTEM
// ============================================

const THEMES = [
  { id: 'romantic', label: 'Romantik', icon: '❤️' },
  { id: 'ocean', label: 'Okyanus', icon: '🌊' },
  { id: 'midnight', label: 'Gece', icon: '🌙' },
  { id: 'sunset', label: 'Günbatımı', icon: '🌅' }
];

let currentThemeIdx = 0;

function initTheme() {
  const saved = localStorage.getItem('bks_theme');
  if (saved) {
    const idx = THEMES.findIndex(t => t.id === saved);
    if (idx >= 0) currentThemeIdx = idx;
  }
  applyTheme(currentThemeIdx);

  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
    applyTheme(currentThemeIdx);
    const theme = THEMES[currentThemeIdx];
    showNotification(theme.icon, 'Tema Değişti', theme.label);
  });
}

function applyTheme(idx) {
  const theme = THEMES[idx];
  document.body.className = theme.id === 'romantic' ? '' : 'theme-' + theme.id;
  localStorage.setItem('bks_theme', theme.id);
}

// ============================================
// CONFETTI EFFECTS
// ============================================

const ConfettiEffects = {
  fire(duration = 2000) {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ff6b6b', '#fd79a8', '#ff9f9f', '#e17055', '#fdcb6e', '#ff7675', '#d63031'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 4,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        decay: 0.005 + Math.random() * 0.01
      });
    }

    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.05;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }

    animate();

    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, duration + 500);
  }
};

// ============================================
// TOAST BILDIRIM SISTEMI
// ============================================

let _notificationTimer = null;

function showNotification(icon, title, message) {
  // Sistem bildirimi (izin varsa)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body: message,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>' + encodeURIComponent(icon) + '</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💖</text></svg>',
        tag: 'buaskbitmez-' + Date.now(),
        data: { url: '/-bu-kalp-senden/' },
        vibrate: [200, 100, 200]
      });
    });
  }

  // Toast bildirimi (ui icinde)
  const toast = document.getElementById('notificationToast');
  const toastIcon = document.getElementById('toastIcon');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  if (!toast) return;

  if (_notificationTimer) clearTimeout(_notificationTimer);

  toastIcon.textContent = icon;
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.style.display = 'flex';
  toast.style.animation = 'none';
  void toast.offsetHeight;
  toast.style.animation = 'toastSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

  _notificationTimer = setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => {
      toast.style.display = 'none';
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.transition = '';
      _notificationTimer = null;
    }, 400);
  }, 3500);
}

function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

// ============================================
// CONTEXT MENU
// ============================================

function showContextMenu(title, items) {
  const overlay = document.getElementById('contextMenuOverlay');
  const titleEl = document.getElementById('contextMenuTitle');
  const container = document.getElementById('contextMenuItems');
  const cancelBtn = document.getElementById('contextMenuCancel');
  if (!overlay) return;

  titleEl.textContent = title;
  container.innerHTML = '';

  items.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.className = 'context-menu-item' + (item.danger ? ' danger' : '');
    btn.innerHTML = '<span class="menu-icon">' + (item.icon || '') + '</span>' + item.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      if (item.onClick) item.onClick();
    });
    container.appendChild(btn);
  });

  cancelBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }, { once: true });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }, { once: true });

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ============================================
// BAŞLANGIÇ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // Mobil native context menüyü engelle
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Service Worker kaydı (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.catch(() => {});
      deferredPrompt = null;
    }, { once: true });
  });
});

window.addEventListener('resize', () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
