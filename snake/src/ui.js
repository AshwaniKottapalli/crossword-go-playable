// UI helpers — tutorial finger, banners, score, +N popups, CTA, drag-demo.

import { CONFIG } from './config.js';
import { uiUrl } from './assets.js';

export class UI {
  constructor() {
    this.stage = document.getElementById('stage');
    this.finger = document.getElementById('finger');
    this.banner = document.getElementById('banner');
    this.scoreEl = document.getElementById('score-you');
    this.scoreOppEl = document.getElementById('score-opp');
    this.cta = document.getElementById('cta');
    this.ctaBtn = document.getElementById('cta-btn');
    this.score = 0;
    this._demoTimers = [];
    this._demoGhost = null;
    this._applyBrandingAssets();
    this._wireInstallButton();
  }

  // If assets/ui/logo.png exists:
  //  - Set the top-bar brand logo
  //  - Show ONE app-icon thumbnail at the top of the final CTA card
  _applyBrandingAssets() {
    const logo = uiUrl('logo');
    if (!logo) return;

    const brand = document.getElementById('brand-logo');
    if (brand) brand.src = logo;

    const card = this.cta?.querySelector('.cta-card');
    if (!card) return;
    const logoEl = card.querySelector('.cta-logo');
    if (logoEl) logoEl.style.display = 'none';
    if (!card.querySelector('.cta-app-icon')) {
      const thumb = document.createElement('img');
      thumb.src = logo;
      thumb.alt = 'Crossword Go';
      thumb.className = 'cta-app-icon';
      thumb.draggable = false;
      card.insertBefore(thumb, card.firstChild);
    }
  }

  _wireInstallButton() {
    const btn = document.getElementById('install-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Network adapter would go here (Meta FbPlayableAd.onCTAClick / Google clickTag / IronSource MRAID).
      try { window.open(CONFIG.ctaUrl, '_blank'); } catch (_) {}
    });
  }

  setOpponentScore(v) { if (this.scoreOppEl) this.scoreOppEl.textContent = v; }

  // ---------- finger ----------
  // Position the tutorial finger over a target element (cell or tile).
  pointAt(el, opts = {}) {
    if (!el) return this.hideFinger();
    const rect = el.getBoundingClientRect();
    const stage = this.stage.getBoundingClientRect();
    this.finger.style.left = (rect.left - stage.left + rect.width * 0.5) + 'px';
    this.finger.style.top  = (rect.top  - stage.top  + rect.height * 0.6) + 'px';
    this.finger.classList.remove('hidden');
  }
  pointAtXY(x, y) {
    this.finger.style.left = x + 'px';
    this.finger.style.top = y + 'px';
    this.finger.classList.remove('hidden');
  }
  hideFinger() {
    this.finger.classList.add('hidden');
  }

  // ---------- banner ----------
  showBanner(text, sub = '', durMs = 1400) {
    this.banner.innerHTML = text + (sub ? `<span class="sub">${sub}</span>` : '');
    this.banner.classList.remove('hidden');
    // re-trigger animation
    this.banner.style.animation = 'none';
    void this.banner.offsetWidth;
    this.banner.style.animation = '';
    if (durMs > 0) {
      clearTimeout(this._bannerTimer);
      this._bannerTimer = setTimeout(() => this.banner.classList.add('hidden'), durMs);
    }
  }
  hideBanner() { this.banner.classList.add('hidden'); }

  // ---------- score ----------
  setScore(v) {
    this.score = v;
    this.scoreEl.textContent = v;
    this.scoreEl.style.animation = 'none';
    void this.scoreEl.offsetWidth;
    this.scoreEl.style.animation = 'cellPop 320ms cubic-bezier(0.25, 1.5, 0.5, 1)';
  }
  addScore(delta) {
    this.setScore(this.score + delta);
  }

  // Animate score from current to target over dur ms.
  rollScoreTo(target, dur = 600) {
    const start = this.score;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 2);
      const v = Math.round(start + (target - start) * eased);
      this.scoreEl.textContent = v;
      if (k < 1) requestAnimationFrame(step);
      else { this.score = target; }
    };
    requestAnimationFrame(step);
  }

  // ---------- +N popup ----------
  // x,y in stage-relative coords.
  pop(x, y, text, opts = {}) {
    const el = document.createElement('div');
    el.className = 'pop';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (opts.color) el.style.color = opts.color;
    if (opts.size) el.style.fontSize = opts.size;
    this.stage.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ---------- shake ----------
  shakeStage() {
    this.stage.classList.remove('shake');
    void this.stage.offsetWidth;
    this.stage.classList.add('shake');
    setTimeout(() => this.stage.classList.remove('shake'), 380);
  }

  // ---------- CTA ----------
  showCTA(onClick) {
    this.cta.classList.remove('hidden');
    const fire = () => onClick?.();
    this.cta.addEventListener('click', fire, { once: true });
  }

  // ---------- drag demo ----------
  // Show a looping finger + ghost-tile gesture from tileEl to cellEl, hinting "drag this here".
  // Pauses on stopDemo() (called when the user starts a real drag).
  startDragDemo(tileEl, cellEl, char) {
    this.stopDemo();
    if (!tileEl || !cellEl) return;

    const tileRect = tileEl.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();

    // Build the ghost (use the tile's visuals)
    const ghost = tileEl.cloneNode(true);
    ghost.classList.remove('dragging-src', 'bot-hand', 'gone');
    ghost.classList.add('ghost', 'demo');
    ghost.style.left = tileRect.left + 'px';
    ghost.style.top = tileRect.top + 'px';
    ghost.style.width = tileRect.width + 'px';
    ghost.style.height = tileRect.height + 'px';
    document.body.appendChild(ghost);
    this._demoGhost = ghost;

    const stageRect = this.stage.getBoundingClientRect();
    const tileCenter = {
      x: tileRect.left - stageRect.left + tileRect.width / 2,
      y: tileRect.top - stageRect.top + tileRect.height / 2,
    };
    const cellCenter = {
      x: cellRect.left - stageRect.left + cellRect.width / 2,
      y: cellRect.top - stageRect.top + cellRect.height / 2,
    };

    const cycle = () => {
      // Reset state
      ghost.style.transition = 'none';
      ghost.style.left = tileRect.left + 'px';
      ghost.style.top  = tileRect.top + 'px';
      ghost.style.opacity = '0';
      this.pointAtXY(tileCenter.x, tileCenter.y);

      // Phase 1: finger taps over tile, ghost fades in
      this._demoTimers.push(setTimeout(() => {
        ghost.style.transition = 'opacity 200ms ease';
        ghost.style.opacity = '0.85';
      }, 350));

      // Phase 2: drag — finger + ghost slide from tile to cell
      const dragDur = 700;
      this._demoTimers.push(setTimeout(() => {
        ghost.style.transition = `left ${dragDur}ms cubic-bezier(0.4,0,0.2,1), top ${dragDur}ms cubic-bezier(0.4,0,0.2,1)`;
        const targetLeft = cellRect.left + (cellRect.width - tileRect.width) / 2;
        const targetTop  = cellRect.top  + (cellRect.height - tileRect.height) / 2;
        ghost.style.left = targetLeft + 'px';
        ghost.style.top = targetTop + 'px';
        // Animate finger toward cell along same path via a smooth tween
        this._tweenFinger(tileCenter, cellCenter, dragDur);
      }, 700));

      // Phase 3: hold at cell
      this._demoTimers.push(setTimeout(() => {
        ghost.style.transition = 'opacity 220ms ease';
        ghost.style.opacity = '0';
      }, 700 + dragDur + 250));

      // Phase 4: schedule next loop
      this._demoTimers.push(setTimeout(cycle, 700 + dragDur + 250 + 380));
    };

    cycle();
  }

  _tweenFinger(from, to, dur) {
    const t0 = performance.now();
    const tick = (t) => {
      if (!this._demoGhost) return; // cancelled
      const k = Math.min(1, (t - t0) / dur);
      const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * eased;
      const y = from.y + (to.y - from.y) * eased;
      this.pointAtXY(x, y);
      if (k < 1) {
        this._demoTweenRAF = requestAnimationFrame(tick);
      }
    };
    cancelAnimationFrame(this._demoTweenRAF);
    this._demoTweenRAF = requestAnimationFrame(tick);
  }

  stopDemo() {
    this._demoTimers.forEach(clearTimeout);
    this._demoTimers = [];
    cancelAnimationFrame(this._demoTweenRAF);
    this._demoTweenRAF = 0;
    if (this._demoGhost) {
      this._demoGhost.remove();
      this._demoGhost = null;
    }
    this.hideFinger();
  }
}
