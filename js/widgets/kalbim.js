var KalbimWidget = {
  memories: [],
  slideIdx: 0,
  slideTimer: null,
  audio: null,
  isPlaying: false,
  currentSong: 0,
  playlist: [],
  dbRef: null,

  init() {
    this.audio = document.getElementById('bgMusic');

    this.carouselImg = document.getElementById('carouselImg');
    this.carouselTitle = document.getElementById('carouselTitle');
    this.carouselDots = document.getElementById('carouselDots');
    this.carouselEl = document.getElementById('hmCarousel');

    this.daysEl = document.getElementById('hmDays');
    this.hoursEl = document.getElementById('hmHours');
    this.minsEl = document.getElementById('hmMinutes');
    this.secsEl = document.getElementById('hmSeconds');

    this.playBtn = document.getElementById('hmPlayBtn');
    this.prevBtn = document.getElementById('hmPrevBtn');
    this.nextBtn = document.getElementById('hmNextBtn');
    this.songName = document.getElementById('hmSongName');
    this.artistName = document.getElementById('hmArtist');
    this.progressFill = document.getElementById('hmProgress');
    this.progressBar = document.getElementById('hmProgressBar');
    this.playlistEl = document.getElementById('hmPlaylist');

    this.loadLocal();
    this.startCounter();
    this.setupMusic();
    this.setupEdit();
    this.loadData();
  },

  setupEdit() {
    const target = this.carouselImg;

    let timer = null;
    const start = () => {
      timer = setTimeout(() => {
        timer = null;
        if (this.memories.length === 0) {
          this.pickPhoto();
          return;
        }
        const idx = this.slideIdx;
        const m = this.memories[idx];
        const items = [
          { icon: '📸', label: 'Ekle', onClick: () => this.pickPhoto() }
        ];
        if (m) {
          items.push({ icon: '✏️', label: 'Düzenle', onClick: () => this.editSlide(idx) });
          items.push({ icon: '🗑️', label: 'Sil', danger: true, onClick: () => this.deleteSlide(idx) });
        }
        showContextMenu('Slayt', items);
      }, 500);
    };
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
    target.addEventListener('mousedown', start);
    target.addEventListener('mouseup', stop);
    target.addEventListener('mouseleave', stop);
    target.addEventListener('touchstart', start, { passive: true });
    target.addEventListener('touchend', stop);
    target.addEventListener('touchmove', stop);
  },

  pickPhoto() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          let w = img.width, h = img.height;
          const max = 800;
          if (w > max || h > max) { const r = Math.min(max/w, max/h); w *= r; h *= r; }
          c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = c.toDataURL('image/jpeg', 0.7);

          const title = prompt('Slayt başlığı:');
          if (!title) return;
          const date = prompt('Tarih (opsiyonel):') || '';
          const story = prompt('Hikaye (opsiyonel):') || '';

          const mem = { title, date, story, image: dataUrl, emoji: '💖', timestamp: Date.now() };
          this.memories.push(mem);
          this.saveLocal();
          this.startCarousel();
          this.showSlide(this.memories.length - 1);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    fileInput.click();
  },

  editSlide(idx) {
    const m = this.memories[idx];
    if (!m) return;
    const title = prompt('Başlık:', m.title || '');
    if (!title) return;
    const date = prompt('Tarih:', m.date || '');
    const story = prompt('Hikaye:', m.story || '');
    m.title = title;
    m.date = date || '';
    m.story = story || '';
    this.saveLocal();
    if (idx === this.slideIdx) this.showSlide(idx);
  },

  deleteSlide(idx) {
    const m = this.memories[idx];
    if (!m) return;
    if (!confirm('Bu slaytı silmek istediğine emin misin?')) return;
    this.memories.splice(idx, 1);
    this.saveLocal();
    if (this.memories.length === 0) {
      this.carouselImg.src = '';
      this.carouselTitle.textContent = 'Henüz slayt eklenmemiş';
      this.carouselDots.innerHTML = '';
      if (this.slideTimer) clearInterval(this.slideTimer);
    } else {
      this.startCarousel();
    }
  },

  saveLocal() {
    try { localStorage.setItem('kalbim_data', JSON.stringify(this.memories)); } catch (e) {}
    const serverUrl = APP_CONFIG.serverUrl || 'http://localhost:3001';
    fetch(serverUrl + '/api/kalbim', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.memories)
    }).catch(() => {});
  },

  /* --- CAROUSEL --- */
  loadData() {
    const serverUrl = APP_CONFIG.serverUrl || 'http://localhost:3001';
    fetch(serverUrl + '/api/kalbim')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        if (data.length > 0) {
          this.memories = data.map((m, i) => ({ ...m, _key: 'local_' + i }));
          this.saveLocal();
          this.startCarousel();
        } else {
          this.loadLocalFile();
        }
      })
      .catch(() => this.loadLocalFile());
  },

  loadLocalFile() {
    fetch(APP_CONFIG.localDataPaths.kalbim)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        if (data.length > 0) {
          this.memories = data.map((m, i) => ({ ...m, _key: 'local_' + i }));
          this.saveLocal();
          this.startCarousel();
        }
      })
      .catch(e => console.warn('Kalbim yukleme hatasi:', e));
  },

  loadLocal() {
    if (this.memories.length > 0) return;
    try {
      const s = JSON.parse(localStorage.getItem('kalbim_data') || '[]');
      if (s.length > 0) { this.memories = s; this.startCarousel(); }
    } catch (e) {}
  },

  startCarousel() {
    if (this.slideTimer) clearInterval(this.slideTimer);
    this.renderDots();
    this.slideIdx = 0;
    this.showSlide(0);
    if (this.memories.length > 1) {
      this.slideTimer = setInterval(() => {
        this.slideIdx = (this.slideIdx + 1) % this.memories.length;
        this.showSlide(this.slideIdx);
      }, 2500);
    }
  },

  showSlide(idx) {
    const mem = this.memories[idx];
    if (!mem) {
      this.carouselImg.src = '';
      this.carouselTitle.textContent = 'Henüz slayt eklenmemiş';
      return;
    }
    this.carouselImg.style.opacity = '0';
    setTimeout(() => {
      if (mem.image) {
        this.carouselImg.src = mem.image;
        this.carouselImg.style.display = 'block';
      } else {
        this.carouselImg.src = '';
        this.carouselImg.style.display = 'none';
      }
      this.carouselImg.alt = mem.title || '';
      this.carouselTitle.textContent = (mem.emoji || '💖') + ' ' + (mem.title || '');
      this.carouselImg.style.opacity = '1';
    }, 200);

    const dots = this.carouselDots.querySelectorAll('.cr-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  },

  renderDots() {
    this.carouselDots.innerHTML = '';
    this.memories.forEach((_, i) => {
      const d = document.createElement('span');
      d.className = 'cr-dot' + (i === 0 ? ' active' : '');
      this.carouselDots.appendChild(d);
    });
  },

  /* --- COUNTER --- */
  startCounter() {
    const s = APP_CONFIG.relationshipStart;
    this.startDate = new Date(s.year, s.month - 1, s.day, s.hour || 0, s.minute || 0);
    this.updateCounter();
    setInterval(() => this.updateCounter(), 1000);
  },

  updateCounter() {
    const diff = Date.now() - this.startDate.getTime();
    if (diff < 0) return;
    const t = Math.floor(diff / 1000);
    this.setNum(this.daysEl, Math.floor(t / 86400), 3);
    this.setNum(this.hoursEl, Math.floor((t % 86400) / 3600), 2);
    this.setNum(this.minsEl, Math.floor((t % 3600) / 60), 2);
    this.setNum(this.secsEl, t % 60, 2);
  },

  setNum(el, v, pad) {
    const s = String(v).padStart(pad, '0');
    if (el && el.textContent !== s) {
      el.textContent = s;
      el.style.transform = 'scale(1.08)';
      setTimeout(() => { if (el) el.style.transform = 'scale(1)'; }, 150);
    }
  },

  /* --- MUSIC --- */
  setupMusic() {
    this.playlist = APP_CONFIG.playlist ? [...APP_CONFIG.playlist] : [];
    this.renderPlaylist();
    if (this.playlist.length > 0) this.loadSong(0);
    if (this.audio) this.audio.volume = 0.7;

    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
    this.progressBar.addEventListener('click', (e) => {
      const r = this.progressBar.getBoundingClientRect();
      const p = (e.clientX - r.left) / r.width;
      if (this.audio && this.audio.duration) this.audio.currentTime = p * this.audio.duration;
    });
    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio.duration) return;
      this.progressFill.style.width = (this.audio.currentTime / this.audio.duration * 100) + '%';
    });
    this.audio.addEventListener('ended', () => this.next());
  },

  renderPlaylist() {
    if (!this.playlistEl) return;
    this.playlistEl.innerHTML = '';
    this.playlist.forEach((s, i) => {
      const item = document.createElement('button');
      item.className = 'hm-pl-item' + (i === this.currentSong ? ' active' : '');
      item.innerHTML = `
        <span class="hm-pl-idx">${i + 1}</span>
        <span class="hm-pl-title">${this.esc(s.title || '')}</span>
        <span class="hm-pl-artist">${this.esc(s.artist || '')}</span>
        <span class="hm-pl-play">${i === this.currentSong && this.isPlaying ? '🔊' : '🎵'}</span>
      `;
      item.addEventListener('click', () => this.play(i));
      this.playlistEl.appendChild(item);
    });
  },

  loadSong(idx) {
    const s = this.playlist[idx];
    if (!s) return;
    this.currentSong = idx;
    this.songName.textContent = s.title || '';
    this.artistName.textContent = s.artist || '';
    this.audio.src = 'assets/sounds/' + (s.fileName || '').replace(/^\//, '');
    this.audio.load();
    document.querySelectorAll('.hm-pl-item').forEach((el, i) => el.classList.toggle('active', i === idx));
  },

  play(idx) {
    this.loadSong(idx);
    if (!this.isPlaying) this.togglePlay();
  },

  togglePlay() {
    if (!this.audio.src) return;
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.playBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>';
      this.playBtn.classList.remove('pulsing');
    } else {
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.playBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
        this.playBtn.classList.add('pulsing');
        this.renderPlaylist();
      }).catch(() => {});
    }
    this.renderPlaylist();
  },

  prev() {
    if (this.playlist.length === 0) return;
    this.play((this.currentSong - 1 + this.playlist.length) % this.playlist.length);
  },

  next() {
    if (this.playlist.length === 0) return;
    this.play((this.currentSong + 1) % this.playlist.length);
  },

  autoPlay() {
    if (this.playlist.length === 0) return;
    setTimeout(() => {
      this.loadSong(0);
      setTimeout(() => this.togglePlay(), 500);
    }, 1000);
  },

  esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; },

  onActivate() {
    this.loadData();
  },

  onDeactivate() {
    if (this.slideTimer) { clearInterval(this.slideTimer); this.slideTimer = null; }
  }
};