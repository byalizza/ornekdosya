const BlockBlast = {
  grid: [],
  score: 0,
  pieces: [],
  selectedPiece: null,
  gridEl: null,
  piecesEl: null,
  scoreEl: null,
  overlayEl: null,
  fabEl: null,
  closeEl: null,
  resetEl: null,
  isOpen: false,
  dragGhost: null,
  dragCells: [],
  _dragStartX: 0,
  _dragStartY: 0,
  _gameOverShown: false,

  CELL_SIZE: 8,
  PIECES_POOL: [
    { shape: [[1]] },
    { shape: [[1,1]] },
    { shape: [[1,1,1]] },
    { shape: [[1,1,1,1]] },
    { shape: [[1,1],[1,1]] },
    { shape: [[1,1,1],[0,0,1]] },
    { shape: [[1,1,1],[1,0,0]] },
    { shape: [[1,0],[1,1]] },
    { shape: [[0,1],[1,1]] },
    { shape: [[1,1,1],[0,1,0]] },
    { shape: [[0,1,0],[1,1,1]] },
    { shape: [[1,0],[1,0],[1,1]] },
    { shape: [[0,1],[0,1],[1,1]] },
    { shape: [[1,1],[1,0],[1,0]] },
    { shape: [[1,1],[0,1],[0,1]] },
    { shape: [[1],[1],[1]] },
    { shape: [[1,1,1,1,1]] },
    { shape: [[1,1],[1,0]] },
  ],

  init() {
    this.gridEl = document.getElementById('gameGrid');
    this.piecesEl = document.getElementById('gamePieces');
    this.scoreEl = document.getElementById('gameScore');
    this.overlayEl = document.getElementById('gameOverlay');
    this.fabEl = document.getElementById('navGame');
    this.closeEl = document.getElementById('gameClose');
    this.resetEl = document.getElementById('gameReset');

    this.fabEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open();
    });
    this.closeEl.addEventListener('click', () => this.close());
    this.resetEl.addEventListener('click', () => this.resetGame());
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    document.addEventListener('mousemove', (e) => this.onDragMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', (e) => this.onDragEnd(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (t) this.onDragMove(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      this.onDragEnd(t.clientX, t.clientY);
    });

    this.resetGame();
  },

  open() {
    this.isOpen = true;
    this.overlayEl.classList.add('open');
    this.fabEl.classList.add('active');
  },

  close() {
    this.isOpen = false;
    this.overlayEl.classList.remove('open');
    this.fabEl.classList.remove('active');
    this.clearGhost();
  },

  resetGame() {
    this.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
    this.score = 0;
    this.selectedPiece = null;
    this.pieces = [];
    this._gameOverShown = false;
    this.scoreEl.textContent = '0';
    this.renderGrid();
    this.spawnPieces();
  },

  randomPiece() {
    return this.PIECES_POOL[Math.floor(Math.random() * this.PIECES_POOL.length)];
  },

  spawnPieces() {
    this.pieces = [this.randomPiece(), this.randomPiece(), this.randomPiece()];
    this.selectedPiece = null;
    this.renderPieces();
  },

  renderGrid() {
    this.gridEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'game-cell' + (this.grid[r][c] ? ' filled' : '');
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => this.onCellClick(r, c));
        cell.addEventListener('mouseenter', () => this.onCellHover(r, c));
        cell.addEventListener('mouseleave', () => this.clearHover());
        this.gridEl.appendChild(cell);
      }
    }
  },

  renderPieces() {
    this.piecesEl.innerHTML = '';
    this.pieces.forEach((piece, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'game-piece' + (this.selectedPiece === idx ? ' selected' : '');
      const rows = piece.shape.length;
      const cols = piece.shape[0].length;
      wrap.style.gridTemplateColumns = `repeat(${cols}, 22px)`;
      wrap.style.gridTemplateRows = `repeat(${rows}, 22px)`;
      wrap.dataset.idx = idx;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = document.createElement('div');
          cell.className = 'game-piece-cell';
          cell.style.visibility = piece.shape[r][c] ? 'visible' : 'hidden';
          wrap.appendChild(cell);
        }
      }

      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectPiece(idx);
      });

      // Touch drag from piece
      wrap.addEventListener('touchstart', (e) => {
        this.selectPiece(idx);
        const t = e.touches[0];
        this._dragStartX = t.clientX;
        this._dragStartY = t.clientY;
        this.startDrag(t.clientX, t.clientY, piece);
      }, { passive: true });

      wrap.addEventListener('mousedown', (e) => {
        this.selectPiece(idx);
        this._dragStartX = e.clientX;
        this._dragStartY = e.clientY;
        this.startDrag(e.clientX, e.clientY, piece);
      });

      this.piecesEl.appendChild(wrap);
    });
  },

  selectPiece(idx) {
    this.selectedPiece = idx;
    document.querySelectorAll('.game-piece').forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
    });
  },

  canPlace(r, c, shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    if (r + rows > 8 || c + cols > 8) return false;
    for (let dr = 0; dr < rows; dr++) {
      for (let dc = 0; dc < cols; dc++) {
        if (shape[dr][dc] && this.grid[r + dr][c + dc]) return false;
      }
    }
    return true;
  },

  placePiece(r, c, shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    for (let dr = 0; dr < rows; dr++) {
      for (let dc = 0; dc < cols; dc++) {
        if (shape[dr][dc]) this.grid[r + dr][c + dc] = 1;
      }
    }
  },

  clearLines() {
    let cleared = 0;
    for (let r = 7; r >= 0; r--) {
      if (this.grid[r].every(cell => cell === 1)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(8).fill(0));
        cleared++;
        r++;
      }
    }
    for (let c = 7; c >= 0; c--) {
      let full = true;
      for (let r = 0; r < 8; r++) {
        if (!this.grid[r][c]) { full = false; break; }
      }
      if (full) {
        for (let r = 0; r < 8; r++) this.grid[r].splice(c, 1);
        for (let r = 0; r < 8; r++) this.grid[r].unshift(0);
        cleared++;
        c++;
      }
    }
    if (cleared > 0) {
      const bonus = cleared === 1 ? 100 : cleared === 2 ? 250 : 500;
      this.score += bonus;
      this.scoreEl.textContent = this.score;
    }
    return cleared > 0;
  },

  onCellClick(r, c) {
    if (this.selectedPiece === null || this.selectedPiece >= this.pieces.length) return;
    const piece = this.pieces[this.selectedPiece];
    if (!piece || !this.canPlace(r, c, piece.shape)) return;
    this.placePiece(r, c, piece.shape);
    this.pieces.splice(this.selectedPiece, 1);
    this.selectedPiece = null;
    this.clearLines();
    this.renderGrid();
    if (this.pieces.length === 0) {
      this.spawnPieces();
    } else {
      this.renderPieces();
    }
    this.checkGameOver();
  },

  onCellHover(r, c) {
    this.clearHover();
    if (this.selectedPiece === null || this.selectedPiece >= this.pieces.length) return;
    const piece = this.pieces[this.selectedPiece];
    if (!piece) return;
    const shape = piece.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    if (r + rows > 8 || c + cols > 8) return;
    const cells = this.gridEl.querySelectorAll('.game-cell');
    for (let dr = 0; dr < rows; dr++) {
      for (let dc = 0; dc < cols; dc++) {
        if (shape[dr][dc]) {
          const idx = (r + dr) * 8 + (c + dc);
          cells[idx].classList.add('highlight');
        }
      }
    }
  },

  clearHover() {
    this.gridEl.querySelectorAll('.game-cell.highlight').forEach(el => el.classList.remove('highlight'));
  },

  startDrag(cx, cy, piece) {
    this.clearGhost();
    this.dragGhost = document.createElement('div');
    this.dragGhost.className = 'game-drag-ghost';
    this.dragGhost.style.position = 'fixed';
    this.dragGhost.style.pointerEvents = 'none';
    this.dragGhost.style.zIndex = '9999';
    this.dragGhost.style.display = 'grid';
    this.dragGhost.style.gap = '2px';
    this.dragGhost.style.padding = '4px';
    this.dragGhost.style.background = 'rgba(102,126,234,0.2)';
    this.dragGhost.style.borderRadius = '6px';
    this.dragGhost.style.left = (cx - 20) + 'px';
    this.dragGhost.style.top = (cy - 20) + 'px';

    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    this.dragGhost.style.gridTemplateColumns = `repeat(${cols}, 22px)`;
    this.dragGhost.style.gridTemplateRows = `repeat(${rows}, 22px)`;

    this.dragCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.style.width = '22px';
        cell.style.height = '22px';
        cell.style.borderRadius = '3px';
        cell.style.background = piece.shape[r][c] ? '#667eea' : 'transparent';
        cell.style.visibility = piece.shape[r][c] ? 'visible' : 'hidden';
        this.dragGhost.appendChild(cell);
        this.dragCells.push(cell);
      }
    }
    document.body.appendChild(this.dragGhost);
  },

  clearGhost() {
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }
    this.dragCells = [];
  },

  onDragMove(cx, cy) {
    if (!this.dragGhost) return;
    this.dragGhost.style.left = (cx - 20) + 'px';
    this.dragGhost.style.top = (cy - 20) + 'px';
    // highlight cell under cursor
    this.clearHover();
    const el = document.elementFromPoint(cx, cy);
    if (el && el.classList.contains('game-cell')) {
      const r = parseInt(el.dataset.r);
      const c = parseInt(el.dataset.c);
      this.onCellHover(r, c);
    }
  },

  onDragEnd(cx, cy) {
    if (!this.dragGhost) return;
    const dist = Math.hypot(cx - this._dragStartX, cy - this._dragStartY);
    if (dist < 5) {
      this.clearGhost();
      this.clearHover();
      return;
    }
    this.clearGhost();
    this.clearHover();
    const el = document.elementFromPoint(cx, cy);
    if (el && el.classList.contains('game-cell')) {
      const r = parseInt(el.dataset.r);
      const c = parseInt(el.dataset.c);
      this.onCellClick(r, c);
    }
  },

  checkGameOver() {
    if (this._gameOverShown) return;
    for (const piece of this.pieces) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (this.canPlace(r, c, piece.shape)) return;
        }
      }
    }
    this._gameOverShown = true;
    this.showBubble('Oyun Bitti! Skor: ' + this.score);
  },

  showBubble(text) {
    const el = document.createElement('div');
    el.className = 'game-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => BlockBlast.init());
