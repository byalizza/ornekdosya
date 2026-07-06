var AnilarWidget = {
  memories: [],
  dbRef: null,
  editIdx: -1,

  init() {
    this.gridEl = document.getElementById('anilarGrid');
    this.viewerEl = document.getElementById('anilarViewer');
    this.viewerImg = document.getElementById('anilarViewerImg');
    this.viewerTitle = document.getElementById('anilarViewerTitle');
    this.viewerDate = document.getElementById('anilarViewerDate');
    this.viewerStory = document.getElementById('anilarViewerStory');

    document.getElementById('anilarViewerClose').addEventListener('click', () => this.closeViewer());
    this.viewerEl.addEventListener('click', (e) => { if (e.target === this.viewerEl) this.closeViewer(); });

    const addBtn = document.getElementById('aniAddBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.openEditModal(-1));

    // Edit modal listeners (cloned to avoid dupes)
    this.setupEditModal();

    this.loadLocal();
    this.setupFirebase();
  },

  setupEditModal() {
    const saveBtn = document.getElementById('memEditSaveBtn');
    const delBtn = document.getElementById('memEditDeleteBtn');
    const closeBtn = document.getElementById('memoryEditClose');
    if (!saveBtn) return;

    const ns = (btn, cb) => {
      if (!btn) return;
      const c = btn.cloneNode(true);
      btn.parentNode.replaceChild(c, btn);
      c.addEventListener('click', cb);
    };

    ns(saveBtn, () => this.saveEdit());
    ns(delBtn, () => this.deleteEdit());
    ns(closeBtn, () => this.closeEditModal());
  },

  setupFirebase() {
    fetch(APP_CONFIG.localDataPaths.memories)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        const fromJson = data.map((m, i) => ({ ...m, _key: m._firebaseKey || 'local_' + i }));
        const localOnly = this.memories.filter(m => !m._firebaseKey);
        this.memories = [...fromJson, ...localOnly];
        this.saveLocal();
        this.renderGrid();
      })
      .catch(e => console.warn('Anilar yukleme hatasi:', e));
  },

  loadLocal() {
    if (this.memories.length > 0) return;
    try {
      const s = JSON.parse(localStorage.getItem('memories_data') || '[]');
      if (s.length > 0) { this.memories = s; this.renderGrid(); }
    } catch (e) {}
  },

  saveLocal() {
    try { localStorage.setItem('memories_data', JSON.stringify(this.memories)); } catch (e) {}
  },

  renderGrid() {
    this.gridEl.innerHTML = '';
    this.memories.forEach((mem, i) => {
      const btn = document.createElement('button');
      btn.className = 'ani-btn';
      btn.innerHTML = `<div class="ani-ring"><div class="ani-avatar">${mem.image ? '<img src="' + mem.image + '" loading="lazy">' : '<span class="ani-emoji">' + (mem.emoji || '💖') + '</span>'}</div></div><span class="ani-label">${mem.title || ''}</span>`;

      // Long press: edit/delete
      let timer = null;
      let holdClick = false;
      const start = () => {
        timer = setTimeout(() => {
          timer = null; holdClick = true;
          const m = this.memories[i];
          if (!m) return;
          showContextMenu(m.title || 'Anı', [
            { icon: '✏️', label: 'Düzenle', onClick: () => this.openEditModal(i) },
            { icon: '🗑️', label: 'Sil', danger: true, onClick: () => this.deleteMemory(i) }
          ]);
        }, 500);
      };
      const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', stop);
      btn.addEventListener('mouseleave', stop);
      btn.addEventListener('touchstart', start, { passive: true });
      btn.addEventListener('touchend', stop);
      btn.addEventListener('touchmove', stop);

      btn.addEventListener('click', () => {
        if (holdClick) { holdClick = false; return; }
        this.openViewer(i);
      });
      this.gridEl.appendChild(btn);
    });
  },

  openViewer(idx) {
    const mem = this.memories[idx];
    if (!mem) return;
    this.viewerImg.style.display = mem.image ? 'block' : 'none';
    this.viewerImg.src = mem.image || '';
    this.viewerImg.alt = mem.title || '';
    this.viewerTitle.textContent = mem.title || '';
    this.viewerDate.textContent = mem.date || '';
    this.viewerStory.textContent = mem.story || '';
    this.viewerEl.style.display = 'flex';
  },

  closeViewer() {
    this.viewerEl.style.display = 'none';
  },

  /* --- EDIT MODAL --- */
  openEditModal(idx) {
    this.editIdx = idx;
    const isEdit = idx >= 0 && idx < this.memories.length;
    const mem = isEdit ? this.memories[idx] : {};

    document.getElementById('memoryEditTitle').textContent = isEdit ? 'Anı Düzenle' : 'Yeni Anı Ekle';
    document.getElementById('memEditTitle').value = mem.title || '';
    document.getElementById('memEditDate').value = mem.date || '';
    document.getElementById('memEditEmoji').value = mem.emoji || '';
    document.getElementById('memEditStory').value = mem.story || '';
    document.getElementById('memEditPhoto').value = '';
    document.getElementById('memEditError').textContent = '';
    document.getElementById('memEditDeleteBtn').style.display = isEdit ? 'inline-block' : 'none';

    document.getElementById('memoryEditModal').style.display = 'flex';
  },

  closeEditModal() {
    document.getElementById('memoryEditModal').style.display = 'none';
  },

  saveEdit() {
    if (this._saving) return;
    this._saving = true;
    const title = document.getElementById('memEditTitle').value.trim();
    const date = document.getElementById('memEditDate').value.trim();
    const emoji = document.getElementById('memEditEmoji').value.trim() || '📸';
    const story = document.getElementById('memEditStory').value.trim();
    const photoFile = document.getElementById('memEditPhoto').files[0];

    if (!title) { document.getElementById('memEditError').textContent = 'Başlık gerekli'; this._saving = false; return; }
    if (!story) { document.getElementById('memEditError').textContent = 'Hikaye gerekli'; this._saving = false; return; }

    const memory = { title, date, emoji, story, image: '' };

    const saveToDb = (imgUrl) => {
      if (imgUrl) memory.image = imgUrl;
      if (this.editIdx >= 0 && this.editIdx < this.memories.length) {
        this.memories[this.editIdx] = { ...memory, _key: 'local_' + Date.now() };
      } else {
        this.memories.push({ ...memory, _key: 'local_' + Date.now() });
      }
      this.saveLocal();
      this.renderGrid();
      this.closeEditModal();
      this._saving = false;
    };

    if (photoFile) {
      this.compressImage(photoFile, (base64) => saveToDb(base64));
    } else {
      saveToDb('');
    }
  },

  deleteEdit() {
    if (this.editIdx < 0 || this.editIdx >= this.memories.length) return;
    this.deleteMemory(this.editIdx);
    this.closeEditModal();
  },

  deleteMemory(idx) {
    if (idx < 0 || idx >= this.memories.length) return;
    this.memories.splice(idx, 1);
    this.saveLocal();
    this.renderGrid();
  },

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const max = 1200;
        if (w > max || h > max) {
          if (w > h) { h = h * max / w; w = max; }
          else { w = w * max / h; h = max; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  onActivate() {
    this.setupFirebase();
  },

  onDeactivate() {
    if (this.dbRef) this.dbRef.off();
  }
};
