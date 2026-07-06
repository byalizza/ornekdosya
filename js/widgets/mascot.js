var MessageWidget = {
  dbRef: null,
  messages: [],
  initialized: false,
  _pendingImages: {},
  petMessages: [
    'Ã‡ok gÃ¼zel kokuyorsun ğŸ’•',
    'Ã‡ok gÃ¼zel gÃ¶zÃ¼kÃ¼yorsun âœ¨',
    'SaÃ§larÄ±n Ã§ok gÃ¼zel ğŸŒ¸',
    'GÃ¼neÅŸ seni kÄ±skanÄ±yor â˜€ï¸',
    'HayatÄ±mÄ± aydÄ±nlatÄ±yorsun ğŸ’«',
    'IÅŸÄ±ltÄ±nla dÃ¼nyam gÃ¼zelleÅŸiyor ğŸŒŸ',
    'Bu kalp senden vazgeÃ§mez fÄ±stÄ±kk ğŸ’–',
    'Kalbimm ğŸ«€',
    'Prenses her zaman prensestir ğŸ‘‘',
    'Prensesimm ğŸŒ·'
  ],

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.msgList = document.getElementById('msgList');
    this.msgInput = document.getElementById('msgInput');
    this.msgSendBtn = document.getElementById('msgSendBtn');
    this.msgPhotoBtn = document.getElementById('msgPhotoBtn');
    this.petEl = document.getElementById('msgPet');
    this.petBubble = document.getElementById('msgPetBubble');
    this.petText = document.getElementById('msgPetText');
    this.petEmoji = document.getElementById('msgPetEmoji');

    this.user = window.currentUser || 'efe';
    this.badge = document.getElementById('msgBadge');
    this.navBtn = document.getElementById('navMesaj');

    this.setupListeners();
    this.setupFirebase();
    this.loadLocalMessages();
    this.startPetAnimations();
  },

  setupListeners() {
    this.msgSendBtn.addEventListener('click', () => this.sendMessage());
    this.msgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    this.msgInput.addEventListener('focus', () => setTimeout(() => this.scrollToBottom(), 300));

    this.msgPhotoBtn.addEventListener('click', () => this.pickPhoto());

    this.petEl.addEventListener('click', () => this.petInteraction());
    this.setupPetting();
  },

  setupPetting() {
    let isPetting = false;
    let petCount = 0;

    const startPet = () => {
      isPetting = true;
      petCount++;
      this.petEmoji.textContent = 'ğŸ˜Š';
      setTimeout(() => {
        if (!isPetting) this.petEmoji.textContent = 'ğŸ±';
      }, 600);
    };

    const endPet = () => {
      if (!isPetting) return;
      isPetting = false;
      this.petEmoji.textContent = 'ğŸ±';
      if (petCount > 3) {
        const msg = this.petMessages[Math.floor(Math.random() * this.petMessages.length)];
        this.petText.textContent = msg;
        this.petBubble.classList.remove('bubble-pop');
        void this.petBubble.offsetWidth;
        this.petBubble.classList.add('bubble-pop');
      }
      petCount = 0;
    };

    this.petEl.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) startPet();
    });
    this.petEl.addEventListener('mouseleave', endPet);
    this.petEl.addEventListener('touchmove', startPet, { passive: true });
    this.petEl.addEventListener('touchend', endPet);
    this.petEl.addEventListener('touchcancel', endPet);
  },

  pickPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this.compressAndSendPhoto(file);
    });
    input.click();
  },

  compressAndSendPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const maxDim = 800;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w *= ratio; h *= ratio;
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);

        const msg = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          from: this.user,
          text: '',
          image: dataUrl,
          timestamp: Date.now()
        };

        this.msgInput.value = '';
        this.messages.push(msg);
        this.renderMessage(msg);
        this.saveToLocal(msg);
        this.scrollToBottom();

        const db = getDatabase();
        if (db && this.dbRef) {
          const newRef = this.dbRef.push(msg);
          msg._key = newRef.key;
          const div = this.msgList.querySelector(`[data-msg-id="${msg.id}"]`);
          if (div) div.dataset.msgKey = msg._key;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  petInteraction() {
    this.petEmoji.style.transform = 'scale(1.4)';
    setTimeout(() => { this.petEmoji.style.transform = 'scale(1)'; }, 300);

    const msg = this.petMessages[Math.floor(Math.random() * this.petMessages.length)];
    this.petText.textContent = msg;
    this.petBubble.classList.remove('bubble-pop');
    void this.petBubble.offsetWidth;
    this.petBubble.classList.add('bubble-pop');
    this.petBubble.style.background = 'rgba(255,165,0,0.15)';
    setTimeout(() => { this.petBubble.style.background = 'rgba(255,165,0,0.06)'; }, 500);
  },

  startPetAnimations() {
    this._petAnimInterval = setInterval(() => {
      if (!document.getElementById('petWidget').classList.contains('active')) return;
      if (Math.random() > 0.5) return;
      const msg = this.petMessages[Math.floor(Math.random() * this.petMessages.length)];
      this.petText.textContent = msg;
      this.petBubble.classList.remove('bubble-pop');
      void this.petBubble.offsetWidth;
      this.petBubble.classList.add('bubble-pop');
    }, 10000 + Math.random() * 8000);
  },

  setupFirebase() {
    const db = getDatabase();
    if (!db) return;

    const path = APP_CONFIG.firebasePaths.messages;
    this.dbRef = db.ref(path);

    this.dbRef.limitToLast(1).on('child_added', (snapshot) => {
      try {
        const key = snapshot.key;
        const msg = snapshot.val();
        if (msg && msg.id) {
          msg._key = key;
          const exists = this.messages.some(m => m.id === msg.id);
          if (!exists) {
            this.messages.push(msg);
            this.renderMessage(msg);
            this.saveToLocal(msg);
          } else {
            // update _key on existing message
            const existing = this.messages.find(m => m.id === msg.id);
            if (existing && !existing._key) {
              existing._key = key;
              const div = this.msgList.querySelector(`[data-msg-id="${msg.id}"]`);
              if (div) div.dataset.msgKey = key;
            }
            return;
          }
            const isActive = document.getElementById('petWidget').classList.contains('active');
            if (isActive) {
              this.scrollToBottom();
            } else {
              this.showBadge();
            }
            if (this._msgNotifReady && msg.from !== window.currentUser) {
              const sender = msg.from === 'efe' ? 'Efe' : 'Ela';
              showNotification('ğŸ’¬', sender + ' sana mesaj gÃ¶nderdi', msg.text || 'FotoÄŸraf');
            }
          }
      } catch (e) { /* ignore */ }
    }, (err) => { /* permission denied - ignore */ });

    this.dbRef.once('value', (snapshot) => {
      try {
        if (!snapshot.val()) return;
        const loaded = [];
        snapshot.forEach(child => {
          const msg = child.val();
          if (msg && msg.id) {
            msg._key = child.key;
            const exists = this.messages.some(m => m.id === msg.id);
            if (!exists) loaded.push(msg);
          }
        });

        if (loaded.length > 0) {
          loaded.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          this.messages = [...this.messages, ...loaded];
          this.msgList.innerHTML = '';
          this.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          this.messages.forEach(msg => { this.renderMessage(msg); });
          this.saveToLocal(null, true);
          this.scrollToBottom();
        }
      } catch (e) { /* ignore */ }
      this._msgNotifReady = true;
    }, (err) => { /* permission denied - ignore */ });
  },

  loadLocalMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      if (saved.length > 0 && this.messages.length === 0) {
        this.messages = saved;
        this.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        this.messages.forEach(msg => this.renderMessage(msg));
        this.scrollToBottom();
      }
    } catch (e) { /* ignore */ }
  },

  sendMessage() {
    const text = this.msgInput.value.trim();
    if (!text) return;

    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      from: this.user,
      text: text,
      timestamp: Date.now()
    };

    this.msgInput.value = '';

    this.messages.push(msg);
    this.renderMessage(msg);
    this.saveToLocal(msg);
    this.scrollToBottom();

    const db = getDatabase();
    if (db && this.dbRef) {
      const newRef = this.dbRef.push(msg);
      msg._key = newRef.key;
      const div = this.msgList.querySelector(`[data-msg-id="${msg.id}"]`);
      if (div) div.dataset.msgKey = msg._key;
    }
  },

  renderMessage(msg) {
    const sender = msg.from === 'efe' ? 'Efe' : 'Ela';
    const isMe = msg.from === this.user;
    const bubbleClass = msg.from === 'efe' ? 'msg-efe' : 'msg-ela';

    const div = document.createElement('div');
    div.className = `msg-bubble ${bubbleClass}`;
    let inner = '';
    if (!isMe) inner += `<span class="msg-sender">${sender}</span>`;
    if (msg.image) {
      inner += `<div class="msg-image-wrapper"><img src="${msg.image}" class="msg-image" loading="lazy" onclick="MessageWidget.viewImage(this)"></div>`;
    }
    if (msg.text) inner += `<span class="msg-text">${this.escapeHtml(msg.text)}</span>`;
    inner += `<span class="msg-time">${this.formatTime(msg.timestamp)}</span>`;
    div.innerHTML = inner;
    div.dataset.msgId = msg.id;
    div.dataset.msgKey = msg._key || '';

    // Long-press for context menu
    let timer = null;
    const start = (e) => {
      timer = setTimeout(() => {
        timer = null;
        const id = div.dataset.msgId;
        const key = div.dataset.msgKey;
        const m = this.messages.find(x => x.id === id);
        const title = m?.text ? m.text.substring(0, 30) : (m?.image ? 'ğŸ“· FotoÄŸraf' : 'Mesaj');
        const items = [
          { icon: 'âœï¸', label: 'DÃ¼zenle', onClick: () => this.editMessage(id) }
        ];
        if (key) {
          items.push({ icon: 'ğŸ—‘ï¸', label: 'Sil', danger: true, onClick: () => this.deleteMessage(id) });
        } else {
          items.push({ icon: 'ğŸ—‘ï¸', label: 'Sil', danger: true, onClick: () => this.deleteMessage(id) });
        }
        showContextMenu(title, items);
      }, 500);
    };
    const stop = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };
    div.addEventListener('mousedown', start);
    div.addEventListener('mouseup', stop);
    div.addEventListener('mouseleave', stop);
    div.addEventListener('touchstart', start, { passive: true });
    div.addEventListener('touchend', stop);
    div.addEventListener('touchmove', stop);

    this.msgList.appendChild(div);
  },

  deleteMessage(msgId) {
    const idx = this.messages.findIndex(m => m.id === msgId);
    if (idx < 0) return;
    const msg = this.messages[idx];
    const db = getDatabase();
    if (db && msg._key && this.dbRef) {
      this.dbRef.child(msg._key).remove().catch(() => {});
    }
    this.messages.splice(idx, 1);
    this.saveToLocal(null, true);
    this.msgList.innerHTML = '';
    this.messages.forEach(m => this.renderMessage(m));
  },

  editMessage(msgId) {
    const msg = this.messages.find(m => m.id === msgId);
    if (!msg) return;
    const newText = prompt('MesajÄ± dÃ¼zenle:', msg.text || '');
    if (newText === null) return;
    msg.text = newText.trim();
    const db = getDatabase();
    if (db && msg._key && this.dbRef) {
      this.dbRef.child(msg._key).update({ text: msg.text }).catch(() => {});
    }
    this.saveToLocal(null, true);
    this.msgList.innerHTML = '';
    this.messages.forEach(m => this.renderMessage(m));
    this.scrollToBottom();
  },

  viewImage(img) {
    const overlay = document.createElement('div');
    overlay.className = 'msg-image-overlay';
    overlay.innerHTML = `<div class="msg-image-viewer"><img src="${img.src}"><button class="msg-image-close" onclick="this.parentElement.parentElement.remove()">âœ•</button></div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  },

  saveToLocal(msg, replaceAll) {
    try {
      if (replaceAll) {
        localStorage.setItem('chat_messages', JSON.stringify(this.messages));
        return;
      }
      const saved = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      if (!saved.some(m => m.id === msg.id)) {
        saved.push(msg);
        localStorage.setItem('chat_messages', JSON.stringify(saved));
      }
    } catch (e) { /* ignore */ }
  },

  showBadge() { if (this.badge) this.badge.style.display = 'block'; },

  hideBadge() { if (this.badge) this.badge.style.display = 'none'; },

  scrollToBottom() {
    setTimeout(() => {
      this.msgList.scrollTop = this.msgList.scrollHeight;
    }, 50);
  },

  formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    if (isToday) return `${hours}:${mins}`;
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${hours}:${mins}`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

