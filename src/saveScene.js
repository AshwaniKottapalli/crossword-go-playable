// Top-strip "Save the Hero" scene.
// A snake creeps in from the right toward a cartoon character hiding behind a bush.
// Every correct letter the player places fires a colored laser from the cell up here,
// blasts the snake's head segment, and pushes the snake back. The snake can never bite
// (clamped at minDistanceFromHero) — pure positive emotional feedback.

import { CONFIG } from './config.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SaveScene {
  constructor({ root, audio, particles }) {
    this.root = root;
    this.audio = audio;
    this.particles = particles;
    this.svg = root.querySelector('.scene-svg');

    this.cfg = CONFIG.saveScene;
    this.colors = this.cfg.segmentColors;
    this.segmentEls = [];

    this.headIdx = 0;          // first live segment (drives head-face position + creep clamp)
    this.nextTargetIdx = 0;    // next segment a new laser will target (advances on zap, not arrival)
    this.translateX = this.cfg.startX;
    this.running = false;
    this.onAllSegmentsKilled = null;
    this._winFired = false;

    this._build();
    this._updateTransform();
  }

  _build() {
    this.svg.setAttribute('viewBox', `0 0 ${this.cfg.viewBoxW} ${this.cfg.viewBoxH}`);
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);

    // Background ground line (faint)
    const ground = document.createElementNS(SVG_NS, 'ellipse');
    ground.setAttribute('cx', this.cfg.heroX);
    ground.setAttribute('cy', this.cfg.midY + 22);
    ground.setAttribute('rx', 50);
    ground.setAttribute('ry', 5);
    ground.setAttribute('fill', 'rgba(0,0,0,0.08)');
    this.svg.appendChild(ground);

    // Hero (peeking over a bush)
    this.heroGroup = this._buildHero();
    this.svg.appendChild(this.heroGroup);

    // Snake (built BEFORE hero so it can render in front of bush — append after hero to layer above)
    this.snakeGroup = this._buildSnake();
    this.svg.appendChild(this.snakeGroup);

    // Bring the bush forward so the hero appears to peek FROM BEHIND it.
    // We do this by rendering the bush as a separate group on top.
    this.bushFront = this._buildBushFront();
    this.svg.appendChild(this.bushFront);

    // Hero state class init
    this.heroGroup.classList.add('hiding');
  }

  _buildHero() {
    // Hero coordinate system: feet at (0, 0). All body parts extend UPWARD (negative y).
    // CSS classes translate this group to different ground heights to simulate
    // hiding-behind-bush → peeking → standing tall.
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'hero');
    g.innerHTML = `
      <!-- legs (y=-14 to 0) -->
      <rect class="leg" x="-7" y="-14" width="5" height="14" rx="2" fill="#3a5fad"/>
      <rect class="leg" x="2"  y="-14" width="5" height="14" rx="2" fill="#3a5fad"/>
      <!-- torso (y=-30 to -14) -->
      <rect class="torso" x="-10" y="-30" width="20" height="16" rx="6" fill="#ff6b9d"/>
      <!-- arms (origin near shoulders for rotate-on-cheer) -->
      <g class="arm arm-l"><rect x="-15" y="-28" width="5" height="14" rx="2.5" fill="#ffd8b0"/></g>
      <g class="arm arm-r"><rect x="10"  y="-28" width="5" height="14" rx="2.5" fill="#ffd8b0"/></g>
      <!-- head (cy=-39, r=10) -->
      <circle class="head" cx="0" cy="-39" r="10" fill="#ffd8b0"/>
      <!-- hair -->
      <path class="hair" d="M-10 -42 Q0 -52 10 -42 L10 -39 Q0 -45 -10 -39 Z" fill="#3a2410"/>
      <!-- eyes -->
      <circle class="eye eye-l" cx="-3.5" cy="-39" r="1.6" fill="#222"/>
      <circle class="eye eye-r" cx="3.5"  cy="-39" r="1.6" fill="#222"/>
      <!-- mouths (only one visible per mood) -->
      <path class="mouth mouth-worried" d="M-3 -34 Q0 -36 3 -34" stroke="#5a2a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path class="mouth mouth-smile"   d="M-3 -34 Q0 -31.5 3 -34" stroke="#5a2a2a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <!-- sweat drop (hiding/peeking mood) -->
      <ellipse class="sweat" cx="-9" cy="-42" rx="1.4" ry="2.2" fill="#5fa8e8"/>
    `;
    return g;
  }

  _buildBushFront() {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'bush');
    g.setAttribute('transform', `translate(${this.cfg.heroX}, ${this.cfg.midY})`);
    g.innerHTML = `
      <ellipse cx="-12" cy="20" rx="14" ry="9" fill="#3aa362"/>
      <ellipse cx="0"   cy="22" rx="18" ry="10" fill="#2e8b57"/>
      <ellipse cx="14"  cy="20" rx="13" ry="9" fill="#3aa362"/>
      <ellipse cx="-4"  cy="14" rx="9"  ry="6" fill="#4fbf73"/>
      <ellipse cx="8"   cy="13" rx="7"  ry="5" fill="#4fbf73"/>
    `;
    return g;
  }

  _buildSnake() {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'snake');

    // Segments — segment[0] is the head (leftmost, faces hero), segment[N-1] is tail tip.
    for (let i = 0; i < this.colors.length; i++) {
      const cx = i * this.cfg.spacing;
      const cy = this._segY(i);
      const seg = document.createElementNS(SVG_NS, 'circle');
      seg.setAttribute('cx', cx);
      seg.setAttribute('cy', cy);
      seg.setAttribute('r', this.cfg.segmentR);
      seg.setAttribute('fill', this.colors[i]);
      seg.setAttribute('stroke', 'rgba(0,0,0,0.18)');
      seg.setAttribute('stroke-width', '0.6');
      seg.setAttribute('class', 'segment');
      seg.style.transformOrigin = `${cx}px ${cy}px`;
      seg.style.animationDelay = `${i * 0.05}s`;
      g.appendChild(seg);
      this.segmentEls.push(seg);
    }

    // Head face — eyes + tongue, follows the current head segment.
    this.headFace = document.createElementNS(SVG_NS, 'g');
    this.headFace.setAttribute('class', 'snake-head-face');
    g.appendChild(this.headFace);
    this._renderHeadFace();

    return g;
  }

  _segY(i) {
    return this.cfg.midY + this.cfg.slitherAmp * Math.sin(i * 0.55);
  }

  _renderHeadFace() {
    if (!this.headFace) return;
    if (this.headIdx >= this.colors.length) {
      this.headFace.innerHTML = '';
      return;
    }
    const cx = this.headIdx * this.cfg.spacing;
    const cy = this._segY(this.headIdx);
    // Forked tongue extends LEFT (toward hero)
    this.headFace.innerHTML = `
      <circle cx="${cx - 1.8}" cy="${cy - 1.6}" r="1.3" fill="#fff"/>
      <circle cx="${cx - 1.8}" cy="${cy - 1.6}" r="0.6" fill="#222"/>
      <circle cx="${cx + 1.8}" cy="${cy - 1.6}" r="1.3" fill="#fff"/>
      <circle cx="${cx + 1.8}" cy="${cy - 1.6}" r="0.6" fill="#222"/>
      <path d="M${cx - 4} ${cy + 0.8} Q${cx - 7} ${cy + 1.5} ${cx - 9} ${cy - 0.5} M${cx - 7} ${cy + 1.5} L${cx - 9} ${cy + 2.8}"
            stroke="#d22" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    `;
  }

  _updateTransform() {
    if (this.snakeGroup) {
      this.snakeGroup.setAttribute('transform', `translate(${this.translateX}, 0)`);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTs = 0;
    this.audio?.play?.('hiss');
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  // Called from game.js on every CORRECT letter placement and every cascade fill.
  // cellEl is the DOM element of the cell the letter just landed in.
  zapSegment(cellEl) {
    if (this.nextTargetIdx >= this.colors.length || !cellEl) return;
    const killIdx = this.nextTargetIdx++;
    const segEl = this.segmentEls[killIdx];
    if (!segEl) return;

    const color = this.colors[killIdx];
    const segRect = segEl.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();
    const stageRect = document.getElementById('stage').getBoundingClientRect();

    const startX = (cellRect.left + cellRect.width / 2) - stageRect.left;
    const startY = (cellRect.top + cellRect.height / 2) - stageRect.top;
    const endX = (segRect.left + segRect.width / 2) - stageRect.left;
    const endY = (segRect.top + segRect.height / 2) - stageRect.top;

    this.particles.laser(startX, startY, endX, endY, color, () => {
      this._killSegment(killIdx, endX, endY, color);
    }, this.cfg.projectileMs);

    this.audio?.play?.('laser');
  }

  _killSegment(idx, hitX, hitY, color) {
    const segEl = this.segmentEls[idx];
    if (!segEl || segEl.classList.contains('dead')) return;

    segEl.classList.add('dead');
    this.particles.boom(hitX, hitY, color);
    this.audio?.play?.('boom');

    // Knockback: bump translateX so visual head retreats faster than just-vanish would.
    this.translateX += this.cfg.knockbackPx;

    // Advance head pointer to the next live segment (in case zaps fired faster than projectiles arrived).
    while (this.headIdx < this.colors.length && this.segmentEls[this.headIdx].classList.contains('dead')) {
      this.headIdx++;
    }
    this._renderHeadFace();
    this._updateHeroMood();

    if (this.headIdx >= this.colors.length && !this._winFired) {
      this._winFired = true;
      // Snake fully retreats off-screen — animated in tick loop
      this._vanishFrom = this.translateX;
      this._vanishTo = this.translateX + 500;
      this._vanishStartTs = performance.now();
      this._vanishing = true;
      this.heroGroup.classList.remove('hiding', 'peeking', 'half-out');
      this.heroGroup.classList.add('cheering');
      setTimeout(() => this.onAllSegmentsKilled?.(), this.cfg.winRetreatMs);
    }
  }

  _updateHeroMood() {
    const ratio = this.headIdx / this.colors.length;
    this.heroGroup.classList.remove('hiding', 'peeking', 'half-out', 'cheering');
    if (ratio < 0.2) this.heroGroup.classList.add('hiding');
    else if (ratio < 0.55) this.heroGroup.classList.add('peeking');
    else if (ratio < 0.98) this.heroGroup.classList.add('half-out');
    else this.heroGroup.classList.add('cheering');
  }

  _tick(ts) {
    if (!this.running) return;
    if (!this._lastTs) this._lastTs = ts;
    const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
    this._lastTs = ts;

    if (this._vanishing) {
      const k = Math.min(1, (ts - this._vanishStartTs) / 700);
      const eased = 1 - Math.pow(1 - k, 2);
      this.translateX = this._vanishFrom + (this._vanishTo - this._vanishFrom) * eased;
      if (k >= 1) this._vanishing = false;
    } else if (this.headIdx < this.colors.length) {
      this.translateX -= this.cfg.idleSpeedPxPerSec * dt;
      const minHeadX = this.cfg.heroX + this.cfg.minDistanceFromHero;
      const minTranslateX = minHeadX - this.headIdx * this.cfg.spacing;
      if (this.translateX < minTranslateX) this.translateX = minTranslateX;
    }

    this._updateTransform();
    requestAnimationFrame(this._tick);
  }

  reset() {
    this.headIdx = 0;
    this.nextTargetIdx = 0;
    this.translateX = this.cfg.startX;
    this._winFired = false;
    this._vanishing = false;
    for (const seg of this.segmentEls) seg.classList.remove('dead');
    this.heroGroup?.classList.remove('cheering', 'peeking', 'half-out');
    this.heroGroup?.classList.add('hiding');
    this._renderHeadFace();
    this._updateTransform();
  }
}
