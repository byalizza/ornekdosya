var LocketWidget = {
  stream: null,
  facingMode: 'environment',
  isCapturing: false,
  allPhotos: [],
  currentFilter: 'none',
  likedPhotos: {},
  seenIds: {},
  unseenPhotos: [],
  isShowingQueue: false,
  _startingCamera: false,
  _hasActivated: false,
  _firebaseReady: false,

  _myName() {
    const u = window.currentUser || 'efe';
    return u === 'efe' ? 'Efe' : 'Ela';
  },

  _myUser() {
    return window.currentUser || 'efe';
  },

  init() {
    this.video = document.getElementById('cameraPreview');
    this.canvas = document.getElementById('cameraCanvas');
    this.shutter = document.getElementById('cameraShutter');
    this.flash = document.getElementById('cameraFlash');
    this.countdown = document.getElementById('cameraCountdown');
    this.switchBtn = document.getElementById('cameraSwitchBtn');
    this.filtersEl = document.getElementById('cameraFilters');
    this.galleryBtn = document.getElementById('cameraGalleryBtn');

    this.preview = document.getElementById('locketPreview');
    this.previewImg = document.getElementById('previewImage');
    this.previewSender = document.getElementById('previewSender');
    this.previewLikeBtn = document.getElementById('previewLikeBtn');

    this.galleryOverlay = document.getElementById('locketGalleryOverlay');
    this.galleryGrid = document.getElementById('galleryOverlayGrid');

    this.setupListeners();
    this.loadLikes();
    this.setupFirebase();
    this.startCleanup();
  },

  setupListeners() {
    this.shutter.addEventListener('click', () => this.capture());
    this.galleryBtn.addEventListener('click', () => this.openGallery());

    this.switchBtn.addEventListener('click', () => {
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
      this.stopCamera();
      this.startCamera();
    });

    this.filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filtersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setFilter(btn.dataset.filter);
      });
    });

    this.preview.addEventListener('click', (e) => {
      if (e.target === this.preview || e.target === this.previewImg) {
        this.dismissPreview();
      }
    });

    this.previewLikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.likeCurrentPhoto();
    });

    document.getElementById('galleryOverlayClose').addEventListener('click', () => this.closeGallery());
    this.galleryOverlay.addEventListener('click', (e) => {
      if (e.target === this.galleryOverlay) this.closeGallery();
    });
  },

  setFilter(name) {
    this.currentFilter = name;
    this.video.className = 'camera-preview';
    if (name !== 'none') {
      this.video.classList.add('cam-filter-' + name);
    }
  },

  startCamera() {
    if (this._startingCamera) return;
    this._startingCamera = true;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      }).then((stream) => {
        if (!this._startingCamera) { stream.getTracks().forEach(t => t.stop()); return; }
        this.stream = stream;
        this.video.srcObject = stream;
        this.video.play();
        this._startingCamera = false;

        if (this.unseenPhotos.length > 0) {
          this.showFromQueue();
        }
      }).catch(() => {
        this._startingCamera = false;
      });
    } else {
      this._startingCamera = false;
    }
  },

  stopCamera() {
    this._startingCamera = false;
    this.hidePreviewNow();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.video.srcObject = null;
    this.video.className = 'camera-preview';
    this.video.style.opacity = '1';
    this.isCapturing = false;
  },

  // ========== QUEUE / UNSEEN ==========

  onActivate() {
    this._hasActivated = true;
    if (this.allPhotos.length === 0) this.loadPhotos();
    const myName = this._myName();
    const myUser = this._myUser();
    this.loadSeen();
    this.buildUnseenQueue();
    if (!this.stream) {
      this.startCamera();
    } else if (this.unseenPhotos.length > 0 && !this.isShowingQueue) {
      this.showFromQueue();
    }
  },

  buildUnseenQueue() {
    const myName = this._myName();
    this.unseenPhotos = [];
    for (const p of this.allPhotos) {
      const pid = p.id || p.timestamp;
      if (p.from !== myName && !this.seenIds[pid]) {
        this.unseenPhotos.push(p);
      }
    }
  },

  showFromQueue() {
    if (this.unseenPhotos.length === 0) return;
    this.isShowingQueue = true;
    const photo = this.unseenPhotos.shift();
    this.showPreview(photo, true);
  },

  // ========== CAPTURE ==========

  capture() {
    if (this.isCapturing) return;
    this.isCapturing = true;

    this.countdown.textContent = '3';
    this.countdown.classList.add('show');
    this.countdown.style.animation = 'none';
    void this.countdown.offsetHeight;
    this.countdown.style.animation = 'countdownPop 0.6s ease';

    let count = 3;
    const ci = setInterval(() => {
      count--;
      if (count > 0) {
        this.countdown.textContent = count;
        this.countdown.style.animation = 'none';
        void this.countdown.offsetHeight;
        this.countdown.style.animation = 'countdownPop 0.6s ease';
      } else {
        clearInterval(ci);
        this.countdown.classList.remove('show');
        this.takePhoto();
      }
    }, 700);
  },

  takePhoto() {
    const myName = this._myName();
    this.flash.classList.add('fire');
    setTimeout(() => this.flash.classList.remove('fire'), 200);

    this.canvas.width = this.video.videoWidth || 1080;
    this.canvas.height = this.video.videoHeight || 1920;
    const ctx = this.canvas.getContext('2d');

    if (this.facingMode === 'user') {
      ctx.translate(this.canvas.width, 0);
      ctx.scale(-1, 1);
    }

    if (this.currentFilter !== 'none') {
      ctx.filter = this.getFilterCSS(this.currentFilter);
    }
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    ctx.filter = 'none';
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.85);

    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const max = 720;
      let w = img.width, h = img.height;
      if (w > max || h > max) {
        if (w > h) { h = h * max / w; w = max; }
        else { w = w * max / h; h = max; }
      }
      c.width = w; c.height = h;
      const cx = c.getContext('2d');
      if (this.facingMode === 'user') {
        cx.translate(w, 0);
        cx.scale(-1, 1);
      }
      cx.drawImage(img, 0, 0, w, h);
      const compressed = c.toDataURL('image/jpeg', 0.7);

      const photo = {
        url: compressed,
        from: myName,
        timestamp: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
      };

      this.allPhotos.unshift(photo);
      this.savePhotos();

      const db = getDatabase();
      if (db) {
        db.ref(APP_CONFIG.firebasePaths.photos).push(photo).catch(() => {});
      }

      const pid = photo.id || photo.timestamp;
      this.seenIds[pid] = true;
      this.saveSeen();
      this.showPreview(photo, false);
      this.isCapturing = false;
    };
    img.src = dataUrl;
  },

  // ========== PREVIEW ==========

  showPreview(photo, isFromQueue) {
    this.shutter.style.display = 'none';
    this.switchBtn.style.display = 'none';
    this.filtersEl.style.display = 'none';
    this.galleryBtn.style.display = 'none';
    if (this.video) this.video.style.opacity = '0';

    this.previewImg.src = photo.url;
    this.previewSender.textContent = photo.from === 'Efe' ? 'Efe' : 'Ela';

    const isLiked = this.likedPhotos[photo.id || photo.timestamp];
    this.previewLikeBtn.textContent = isLiked ? '❤️ Beğendin' : '💕 Beğen';
    this.previewLikeBtn.classList.toggle('liked', !!isLiked);
    this.previewLikeBtn.dataset.photoId = photo.id || photo.timestamp;

    this.preview.style.display = 'flex';
    this.preview.style.animation = 'fadeIn 0.3s ease';
    this.preview.dataset.queue = isFromQueue ? '1' : '0';
  },

  dismissPreview() {
    const isFromQueue = this.preview.dataset.queue === '1';
    const pid = this.previewLikeBtn.dataset.photoId;
    if (pid) { this.seenIds[pid] = true; this.saveSeen(); }
    this.preview.style.display = 'none';

    if (isFromQueue) {
      if (this.unseenPhotos.length > 0) {
        this.showFromQueue();
      } else {
        this.isShowingQueue = false;
        this.showCameraAfterDismiss();
      }
    } else {
      this.buildUnseenQueue();
      if (this.unseenPhotos.length > 0) {
        this.isShowingQueue = true;
        this.showFromQueue();
      } else {
        this.showCameraAfterDismiss();
      }
    }
  },

  showCameraAfterDismiss() {
    this.video.style.opacity = '1';
    this.shutter.style.display = '';
    this.switchBtn.style.display = '';
    this.filtersEl.style.display = '';
    this.galleryBtn.style.display = '';
  },

  hidePreviewNow() {
    this.preview.style.display = 'none';
    this.isShowingQueue = false;
  },

  // ========== LIKE ==========

  likeCurrentPhoto() {
    const photoId = this.previewLikeBtn.dataset.photoId;
    if (!photoId) return;

    const already = this.likedPhotos[photoId];
    if (already) {
      delete this.likedPhotos[photoId];
      this.previewLikeBtn.textContent = '💕 Beğen';
      this.previewLikeBtn.classList.remove('liked');
    } else {
      this.likedPhotos[photoId] = true;
      this.previewLikeBtn.textContent = '❤️ Beğendin';
      this.previewLikeBtn.classList.add('liked');
    }
    try { localStorage.setItem('locket_likes', JSON.stringify(this.likedPhotos)); } catch (e) {}
  },

  // ========== PERSISTENCE ==========

  loadSeen() {
    const u = this._myUser();
    try { this.seenIds = JSON.parse(localStorage.getItem('locket_seen_' + u) || '{}'); } catch (e) { this.seenIds = {}; }
  },

  saveSeen() {
    const u = this._myUser();
    try { localStorage.setItem('locket_seen_' + u, JSON.stringify(this.seenIds)); } catch (e) {}
  },

  loadLikes() {
    try { this.likedPhotos = JSON.parse(localStorage.getItem('locket_likes') || '{}'); } catch (e) { this.likedPhotos = {}; }
  },

  loadPhotos() {
    const saved = JSON.parse(localStorage.getItem('locket_gallery') || '[]');
    this.allPhotos = saved.filter(p => Date.now() < p.expiresAt);
  },

  savePhotos() {
    try { localStorage.setItem('locket_gallery', JSON.stringify(this.allPhotos)); } catch (e) {}
  },

  getFilterCSS(name) {
    const filters = {
      warm: 'sepia(0.3) saturate(1.3) brightness(1.1)',
      cool: 'hue-rotate(180deg) saturate(0.8) brightness(0.95)',
      vintage: 'sepia(0.6) contrast(0.85) brightness(0.9)',
      dramatic: 'contrast(1.4) saturate(0.7) brightness(0.85)'
    };
    return filters[name] || 'none';
  },

  // ========== FIREBASE ==========

  _notifReady: false,

  setupFirebase() {
    const db = getDatabase();
    if (!db) return;
    this._photosRef = db.ref(APP_CONFIG.firebasePaths.photos);

    this._photosRef.on('value', (snapshot) => {
      const data = snapshot.val();
      this.allPhotos = [];

      if (data) {
        Object.values(data).forEach(item => {
          if (item && item.url && Date.now() < (item.expiresAt || Infinity)) {
            if (!item.id) item.id = item.timestamp.toString(36);
            this.allPhotos.push(item);
          }
        });
      }

      this.allPhotos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.savePhotos();
      this._notifReady = true;

      if (this._hasActivated) {
        this.buildUnseenQueue();
        if (this.unseenPhotos.length > 0 && !this.isShowingQueue) {
          this.showFromQueue();
        }
      }
    });

    // Bildirimler için child_added
    const myName = this._myName();
    this._photosRef.on('child_added', (snapshot) => {
      if (!this._notifReady) return;
      const photo = snapshot.val();
      if (!photo || !photo.from) return;
      if (photo.from !== myName) {
        const sender = photo.from === 'Efe' ? 'Efe' : 'Ela';
        showNotification('📸', sender + ' yeni bir anlık paylaştı', 'Görmek için Anlık sekmesine git');
      }
    });
  },

  startCleanup() {
    setInterval(() => {
      const before = this.allPhotos.length;
      this.allPhotos = this.allPhotos.filter(p => Date.now() < p.expiresAt);
      if (this.allPhotos.length !== before) {
        this.savePhotos();
      }
    }, 60000);
  },

  // ========== GALLERY ==========

  openGallery() {
    this.galleryGrid.innerHTML = '';
    if (this.allPhotos.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'gallery-empty';
      emptyDiv.innerHTML = '<div class="gallery-empty-icon">📸</div><div class="gallery-empty-text">Henüz fotoğraf yok</div><button class="gallery-add-first-btn">İlk Anlık Ekle</button>';
      emptyDiv.querySelector('.gallery-add-first-btn').addEventListener('click', () => { this.closeGallery(); this.capture(); });
      this.galleryGrid.appendChild(emptyDiv);
    } else {
      this.allPhotos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'gallery-grid-item';
        const badge = p.from;
        const time = new Date(p.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `<img src="${p.url}" alt=""><span class="gallery-grid-badge">${badge}</span><span class="gallery-grid-time">${time}</span>`;
        let timer = null;
        let holdClick = false;
        const start = () => { timer = setTimeout(() => { timer = null; holdClick = true; showContextMenu('Fotoğraf', [{ icon: '🗑️', label: 'Sil', danger: true, onClick: () => this.deletePhoto(p) }]); }, 500); };
        const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
        div.addEventListener('click', () => {
          if (holdClick) { holdClick = false; return; }
          this.closeGallery();
          this.showPreview(p, false);
        });
        div.addEventListener('mousedown', start); div.addEventListener('mouseup', stop); div.addEventListener('mouseleave', stop);
        div.addEventListener('touchstart', start, { passive: true }); div.addEventListener('touchend', stop); div.addEventListener('touchmove', stop);
        this.galleryGrid.appendChild(div);
      });
    }
    this.galleryOverlay.style.display = 'flex';
  },

  deletePhoto(photo) {
    const db = getDatabase();
    const pid = photo.id || photo.timestamp;
    if (db) {
      const query = db.ref(APP_CONFIG.firebasePaths.photos).orderByChild('id').equalTo(pid);
      query.once('value', snap => {
        snap.forEach(child => child.ref.remove());
      });
    }
    this.allPhotos = this.allPhotos.filter(p => (p.id || p.timestamp) !== pid);
    this.savePhotos();
    this.openGallery();
  },

  closeGallery() {
    this.galleryOverlay.style.display = 'none';
  },

  onDeactivate() {
    if (this._photosRef) this._photosRef.off();
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.isCapturing = false;
  }
};