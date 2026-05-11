// Letter bank — Pointer Events drag-and-drop.
// Drag a tile, snap to the empty cell under the pointer, or snap back to the bank.

import { CONFIG } from './config.js';

export class LetterBank {
  constructor(cfg, onDrop) {
    this.cfg = cfg;
    this.onDrop = onDrop;          // (char, cellR, cellC) => boolean — true if accepted
    this.onDragStart = null;       // optional: called when user starts dragging
    this.el = document.getElementById('bank');
    this.tiles = [];               // { el, char }
    this.locked = true;
    this.drag = null;
    this.hoverCell = null;
  }

  // Render a set of letters as tiles. Replaces any existing tiles.
  setLetters(letters, { animate = false } = {}) {
    this.tiles = [];
    this.el.innerHTML = '';
    letters.forEach((ch, i) => {
      const t = document.createElement('div');
      t.className = 'tile' + (animate ? ' enter' : '');
      t.textContent = ch;
      t.dataset.idx = i;
      t.dataset.char = ch;
      t.addEventListener('pointerdown', (ev) => this._onPointerDown(t, ch, ev));
      t.addEventListener('contextmenu', (ev) => ev.preventDefault());
      this.el.appendChild(t);
      this.tiles.push({ el: t, char: ch });
      if (animate) {
        setTimeout(() => t.classList.remove('enter'), 30 + i * 60);
      }
    });
  }

  // Soft-clear with exit animation, then resolve.
  clearWithAnimation(durMs = 240) {
    return new Promise(resolve => {
      this.tiles.forEach((t, i) => {
        setTimeout(() => t.el.classList.add('exit'), i * 40);
      });
      setTimeout(() => {
        this.el.innerHTML = '';
        this.tiles = [];
        resolve();
      }, durMs + this.tiles.length * 40);
    });
  }

  setLocked(locked) { this.locked = locked; }

  // ---------- drag start ----------
  _onPointerDown(tileEl, char, ev) {
    if (this.locked) return;
    if (tileEl.classList.contains('gone')) return;
    if (this.drag) return; // already dragging another tile

    ev.preventDefault();

    const rect = tileEl.getBoundingClientRect();
    const ghost = tileEl.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    document.body.appendChild(ghost);

    tileEl.classList.add('dragging-src');

    this.drag = {
      tileEl, char, ghost,
      pointerId: ev.pointerId,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
    };

    this._moveHandler = (e) => this._onPointerMove(e);
    this._upHandler   = (e) => this._onPointerUp(e);
    window.addEventListener('pointermove', this._moveHandler, { passive: false });
    window.addEventListener('pointerup', this._upHandler);
    window.addEventListener('pointercancel', this._upHandler);

    this.onDragStart?.(char);
  }

  // ---------- drag move ----------
  _onPointerMove(ev) {
    if (!this.drag || ev.pointerId !== this.drag.pointerId) return;
    ev.preventDefault();

    const dx = ev.clientX - this.drag.startX;
    const dy = ev.clientY - this.drag.startY;
    if (!this.drag.moved && (dx * dx + dy * dy) > 9) this.drag.moved = true;

    this.drag.ghost.style.left = (ev.clientX - this.drag.offsetX) + 'px';
    this.drag.ghost.style.top  = (ev.clientY - this.drag.offsetY) + 'px';

    this._updateHover(ev.clientX, ev.clientY);
  }

  _updateHover(x, y) {
    // Briefly hide the ghost so elementFromPoint sees what's under it.
    const g = this.drag.ghost;
    const prev = g.style.display;
    g.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    g.style.display = prev;

    const cell = el?.closest('.cell.letter');
    if (cell === this.hoverCell) return;
    if (this.hoverCell) this.hoverCell.classList.remove('hover');
    this.hoverCell = cell || null;
    if (this.hoverCell && !this.hoverCell.dataset.filled) {
      this.hoverCell.classList.add('hover');
    }
  }

  // ---------- drag end ----------
  _onPointerUp(ev) {
    if (!this.drag || ev.pointerId !== this.drag.pointerId) return;
    const { tileEl, char, ghost } = this.drag;

    // Hit-test under release point
    ghost.style.display = 'none';
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    ghost.style.display = '';

    let accepted = false;
    const cellEl = el?.closest('.cell.letter');
    if (cellEl) {
      const r = +cellEl.dataset.r;
      const c = +cellEl.dataset.c;
      accepted = this.onDrop?.(char, r, c) === true;
    }

    if (this.hoverCell) { this.hoverCell.classList.remove('hover'); this.hoverCell = null; }

    if (accepted) {
      // Game removed the tile already. Just remove ghost.
      ghost.remove();
      tileEl.classList.remove('dragging-src');
    } else {
      // Snap back
      this._snapGhostBack(ghost, tileEl);
    }

    window.removeEventListener('pointermove', this._moveHandler);
    window.removeEventListener('pointerup', this._upHandler);
    window.removeEventListener('pointercancel', this._upHandler);
    this.drag = null;
  }

  _snapGhostBack(ghost, tileEl) {
    const rect = tileEl.getBoundingClientRect();
    ghost.style.transition = 'left 220ms cubic-bezier(0.3,1.4,0.5,1), top 220ms cubic-bezier(0.3,1.4,0.5,1), transform 220ms ease';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.transform = 'scale(1)';
    setTimeout(() => {
      ghost.remove();
      tileEl.classList.remove('dragging-src');
    }, 240);
  }

  // ---------- programmatic helpers (used by fakeFail + ui demo) ----------

  highlightTile(char, on = true) {
    const t = this.tiles.find(t => t.char === char && !t.el.classList.contains('gone'));
    if (!t) return null;
    t.el.classList.toggle('bot-hand', on);
    return t.el;
  }

  removeTile(char) {
    const t = this.tiles.find(t => t.char === char && !t.el.classList.contains('gone'));
    if (t) t.el.classList.add('gone');
    return t?.el;
  }

  resetTile(char) {
    const t = this.tiles.find(t => t.char === char);
    if (!t) return;
    t.el.classList.remove('bot-hand', 'gone', 'dragging-src');
  }

  tileEl(char) {
    return this.tiles.find(t => t.char === char && !t.el.classList.contains('gone'))?.el || null;
  }

  // Spawn a ghost copy of a tile at the bank position. Returns the ghost element.
  spawnGhost(char) {
    const tile = this.tileEl(char);
    if (!tile) return null;
    const rect = tile.getBoundingClientRect();
    const ghost = tile.cloneNode(true);
    ghost.classList.add('ghost', 'bot-ghost');
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    document.body.appendChild(ghost);
    return ghost;
  }

  // Animate a ghost from current position to a target client-rect over durMs.
  static animateGhostTo(ghost, targetRect, durMs = 420, onDone) {
    ghost.style.transition = `left ${durMs}ms cubic-bezier(0.4,0.0,0.2,1), top ${durMs}ms cubic-bezier(0.4,0.0,0.2,1)`;
    ghost.style.left = (targetRect.left + (targetRect.width - parseFloat(ghost.style.width)) / 2) + 'px';
    ghost.style.top  = (targetRect.top  + (targetRect.height - parseFloat(ghost.style.height)) / 2) + 'px';
    setTimeout(() => onDone?.(), durMs + 20);
  }
}
