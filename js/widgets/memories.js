var MemoriesWidget = {
  memories: [],
  dbRef: null,
  editIndex: -1,
  slideIndex: 0,
  slideTimer: null,
  isPaused: false,

  init() {
    this.slideshowEl = document.getElementById('memoriesSlideshow');
    this.imgEl = document.getElementById('slideshowImg');
    this.titleEl = document.getElementById('slideshowTitle');
    this.dateEl = document.getElementById('slideshowDate');
    this.storyEl = document.getElementById('slideshowStory');
    this.dotsEl = document.getElementById('slideshowDots');
    this.addBtn = document.getElementById('addMemoryBtn');

    this.setupFirebase();
    this.loadLocal();
    this.setupLongPress();

    this.slideshowEl.addEventListener('click', (e) => {
      if (e.target === this.addBtn) return;
      this.togglePause();
    });
    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.openEditModal(-1));
    }
  },

  setupLongPress() {
    let timer = null;
    const start = () => {
      timer = setTimeout(() => {
        timer = null;
        const idx = this.slideIndex;
        const mem = this.memories[idx];
        if (!mem) return;
        showContextMenu('AnÄ±: ' + (mem.title || ''), [
          { icon: 'âœï¸', label: 'DÃ¼zenle', onClick: () => this.openEditModal(idx) },
          { icon: 'ğŸ—‘ï¸', label: 'Sil', danger: true, onClick: () => this.deleteMemory(idx) }
        ]);
      }, 500);
    };
    const stop = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };
    this.slideshowEl.addEventListener('mousedown', start);
    this.slideshowEl.addEventListener('mouseup', stop);
    this.slideshowEl.addEventListener('mouseleave', stop);
    this.slideshowEl.addEventListener('touchstart', start, { passive: true });
    this.slideshowEl.addEventListener('touchend', stop);
    this.slideshowEl.addEventListener('touchmove', stop);
  },

  _memNotifReady: false,

  setupFirebase() {
    const db = getDatabase();
    if (!db) return;
    const path = APP_CONFIG.firebasePaths.memories;
    this.dbRef = db.ref(path);
    this.dbRef.on('value', (snapshot) => {
      try {
        const data = snapshot.val();
        this.memories = [];
        if (data) {
          Object.keys(data).forEach(key => {
            const m = data[key];
            if (m) { m._key = key; this.memories.push(m); }
          });
        }
        this.saveLocal();
        this.startSlideshow();
        this._memNotifReady = true;
      } catch (e) { /* ignore */ }
    }, () => {});

    this.dbRef.on('child_added', (snapshot) => {
      if (!this._memNotifReady) return;
      const mem = snapshot.val();
      if (mem && mem.title) {
        showNotification('ğŸ“–', 'Yeni bir anÄ± eklendi', mem.title + ' - ' + (mem.date || ''));
      }
    });
  },

  loadLocal() {
    if (this.memories.length > 0) return;
    try {
      this.memories = JSON.parse(localStorage.getItem('memories_data') || '[]');
      if (this.memories.length === 0) {
        this.memories = [
          { title: 'Ä°lk GÃ¼nÃ¼mÃ¼z', date: '19 Mart 2025', story: 'Her ÅŸeyin baÅŸladÄ±ÄŸÄ± gÃ¼n... GÃ¶zlerinin iÃ§inde kaybolduÄŸum an.', image: 'https://picsum.photos/seed/mem1/400/600', emoji: 'ğŸ’«' },
          { title: 'Birlikte GeÃ§en Zaman', date: 'Nisan 2025', story: 'Her saniyen ayrÄ± bir gÃ¼zel. Seninle her an bir Ã¶mÃ¼r.', image: 'https://picsum.photos/seed/mem2/400/600', emoji: 'ğŸŒ¸' },
          { title: 'Sonsuz Sevgi', date: 'Her Zaman', story: 'Bu kalp senden vazgeÃ§meyecek. Sonsuza kadar seninle.', image: 'https://picsum.photos/seed/mem3/400/600', emoji: 'ğŸ’–' }
        ];
      }
      this.startSlideshow();
    } catch (e) { this.startSlideshow(); }
  },

  saveLocal() {
    try { localStorage.setItem('memories_data', JSON.stringify(this.memories)); } catch (e) {}
  },

  startSlideshow() {
    if (this.slideTimer) clearInterval(this.slideTimer);
    this.renderDots();
    this.slideIndex = 0;
    this.showSlide(0);
    this.slideTimer = setInterval(() => {
      if (!this.isPaused && this.memories.length > 0) {
        this.slideIndex = (this.slideIndex + 1) % this.memories.length;
        this.showSlide(this.slideIndex);
      }
    }, 3000);
  },

  togglePause() {
    if (this.memories.length === 0) return;
    this.isPaused = !this.isPaused;
    this.slideshowEl.style.opacity = this.isPaused ? '0.6' : '1';
  },

  showSlide(index) {
    const mem = this.memories[index];
    if (!mem) return;

    this.imgEl.style.opacity = '0';
    setTimeout(() => {
      this.titleEl.textContent = mem.title || '';
      this.dateEl.textContent = mem.date || '';
      this.storyEl.textContent = mem.story || '';
      this.imgEl.src = mem.image || '';
      this.imgEl.alt = mem.title || '';
      this.imgEl.style.opacity = '1';
    }, 150);

    document.querySelectorAll('.slide-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  },

  renderDots() {
    this.dotsEl.innerHTML = '';
    this.memories.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'slide-dot' + (i === this.slideIndex ? ' active' : '');
      this.dotsEl.appendChild(dot);
    });
  },

  openEditModal(index) {
    this.editIndex = index;
    const isEdit = index >= 0 && index < this.memories.length;
    const mem = isEdit ? this.memories[index] : {};

    document.getElementById('memoryEditTitle').textContent = isEdit ? 'AnÄ± DÃ¼zenle' : 'Yeni AnÄ± Ekle';
    document.getElementById('memEditTitle').value = mem.title || '';
    document.getElementById('memEditDate').value = mem.date || '';
    document.getElementById('memEditEmoji').value = mem.emoji || '';
    document.getElementById('memEditStory').value = mem.story || '';
    document.getElementById('memEditPhoto').value = '';
    document.getElementById('memEditError').textContent = '';
    document.getElementById('memEditDeleteBtn').style.display = isEdit ? 'inline-block' : 'none';

    document.getElementById('memoryEditModal').style.display = 'flex';

    const saveBtn = document.getElementById('memEditSaveBtn');
    const delBtn = document.getElementById('memEditDeleteBtn');
    const closeBtn = document.getElementById('memoryEditClose');
    const newSave = saveBtn.cloneNode(true);
    const newDel = delBtn.cloneNode(true);
    const newClose = closeBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);
    delBtn.parentNode.replaceChild(newDel, delBtn);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);

    newSave.addEventListener('click', () => this.saveEdit());
    newDel.addEventListener('click', () => this.deleteEdit());
    newClose.addEventListener('click', () => this.editModalClose());
  },

  saveEdit() {
    const title = document.getElementById('memEditTitle').value.trim();
    const date = document.getElementById('memEditDate').value.trim();
    const emoji = document.getElementById('memEditEmoji').value.trim() || 'ğŸ“¸';
    const story = document.getElementById('memEditStory').value.trim();
    const photoFile = document.getElementById('memEditPhoto').files[0];

    if (!title) { document.getElementById('memEditError').textContent = 'BaÅŸlÄ±k gerekli'; return; }
    if (!story) { document.getElementById('memEditError').textContent = 'Hikaye gerekli'; return; }

    const memory = { title, date, emoji, story, image: '' };

    const saveToFirebase = (imgUrl) => {
      if (imgUrl) memory.image = imgUrl;
      if (this.editIndex >= 0 && this.editIndex < this.memories.length) {
        this.memories[this.editIndex] = { ...memory, _key: this.memories[this.editIndex]._key };
      } else {
        this.memories.push({ ...memory });
      }
      this.saveLocal();
      this.startSlideshow();
      this.editModalClose();

      const db = getDatabase();
      if (!db || !this.dbRef) return;
      if (this.editIndex >= 0 && this.editIndex < this.memories.length) {
        const existing = this.memories[this.editIndex];
        if (existing._key) db.ref(`${APP_CONFIG.firebasePaths.memories}/${existing._key}`).update(memory).catch(() => {});
        else this.dbRef.push(memory).catch(() => {});
      } else {
        this.dbRef.push(memory).catch(() => {});
      }
    };

    if (photoFile) {
      this.compressImage(photoFile, (base64) => saveToFirebase(base64));
    } else {
      saveToFirebase('');
    }
  },

  deleteEdit() {
    if (this.editIndex < 0 || this.editIndex >= this.memories.length) return;
    const mem = this.memories[this.editIndex];
    const db = getDatabase();
    if (mem._key && db) {
      db.ref(`${APP_CONFIG.firebasePaths.memories}/${mem._key}`).remove();
    } else {
      this.memories.splice(this.editIndex, 1);
      this.saveLocal();
      this.startSlideshow();
    }
    this.editModalClose();
  },

  editModalClose() {
    document.getElementById('memoryEditModal').style.display = 'none';
  },

  deleteMemory(index) {
    if (index < 0 || index >= this.memories.length) return;
    const mem = this.memories[index];
    const db = getDatabase();
    if (mem._key && db) {
      db.ref(`${APP_CONFIG.firebasePaths.memories}/${mem._key}`).remove();
    }
    this.memories.splice(index, 1);
    this.saveLocal();
    this.slideIndex = Math.min(this.slideIndex, this.memories.length - 1);
    if (this.memories.length === 0) this.slideIndex = 0;
    this.startSlideshow();
  },

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const max = 800;
        if (w > max || h > max) {
          if (w > h) { h = h * max / w; w = max; }
          else { w = w * max / h; h = max; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

