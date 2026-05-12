// "Save the hero" three-act cinematic scene.
//
// ACT 1 — INTRO  (0–2.5s, full-bleed overlay): snake lunges at terrified hero,
//                vignette flashes, camera shakes, "OH NO!" badge punches in.
// ACT 2 — STRIP  (persistent ~22% top): bg + hero + snake live above the puzzle.
//                Single painted snake (head→body→tail in one PNG). Each correct
//                letter advances a clip-path from the right that "snips off" the
//                tail end. Once the body is fully clipped (only head remains),
//                subsequent kills retreat the whole group rightward off-screen.
// ACT 3 — OUTRO  (on all kills, full-bleed overlay): hero pops up in safe pose,
//                "YOU SAVED HIM!" badge, then hands off to CTA via onAllKilled().

import { CONFIG } from './config.js';

export class SaveScene {
  constructor({ root, audio, particles, intro, outro, stage }) {
    this.root = root;
    this.audio = audio;
    this.particles = particles;
    this.intro = intro;
    this.outro = outro;
    this.stage = stage || document.getElementById('stage');
    this.cfg = CONFIG.saveScene;

    this.heroSprites = {
      scared: root.querySelector('.hero-scared'),
      brave:  root.querySelector('.hero-brave'),
      safe:   root.querySelector('.hero-safe'),
    };
    this.snakeEl  = root.querySelector('.scene-snake');
    this.snakeImg = root.querySelector('.snake-full');
    this.vignetteEl = root.querySelector('.scene-vignette');

    this.kills = 0;
    this.clipPct = 0;       // 0 = full snake visible, maxClipPct = only head visible
    this.retreatPct = 0;    // applied after body is fully clipped
    this.running = false;
    this.onAllKilled = null;
    this._winFired = false;

    this._setMood('scared');
    this._updateSnakeTransform();
  }

  // ---------- Lifecycle ----------

  playIntro(onIntroDone) {
    this._startTickLoop();
    this.audio?.play?.('hiss');
    if (!this.intro) {
      onIntroDone?.();
      return;
    }
    this.intro.classList.remove('hidden');
    this.intro.classList.add('playing');
    this.stage.classList.add('intro-shaking');
    setTimeout(() => {
      this.intro.classList.add('exit');
      this.stage.classList.remove('intro-shaking');
      setTimeout(() => {
        this.intro.classList.add('hidden');
        this.intro.classList.remove('playing', 'exit');
        onIntroDone?.();
      }, 320);
    }, this.cfg.introMs);
  }

  // Called per correct letter (user drop + cascade fill).
  zapSegment(cellEl) {
    if (!cellEl || this.kills >= this.cfg.totalKills) return;
    this.kills++;

    // Laser aims at the CURRENT right edge of the visible snake (where the
    // next snip will happen). Resolved before any clip advance.
    const cut = this._currentCutPoint();
    const cellRect = cellEl.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();
    const startX = (cellRect.left + cellRect.width / 2) - stageRect.left;
    const startY = (cellRect.top + cellRect.height / 2) - stageRect.top;

    this.audio?.play?.('laser');
    this.particles.laser(startX, startY, cut.x, cut.y, '#9aff4a', () => {
      this._onLaserHit(cut.x, cut.y);
    }, this.cfg.laserMs);
  }

  // The right edge of the snake-full image AFTER current clip, in stage coords.
  _currentCutPoint() {
    const stageRect = this.stage.getBoundingClientRect();
    const rect = this.snakeImg.getBoundingClientRect();
    const visibleWidth = rect.width * (1 - this.clipPct / 100);
    return {
      x: rect.left + visibleWidth - 18 - stageRect.left,
      y: rect.top + rect.height / 2 - stageRect.top,
    };
  }

  _onLaserHit(hitX, hitY) {
    this.audio?.play?.('boom');
    this.particles.boom(hitX, hitY, '#9aff4a');
    this._showSplat(hitX, hitY);
    this._flashVignette();
    this._shakeStage();
    this._flashSnake();

    // First N kills advance the clip-path (eating the body from the tail end).
    // Kills beyond that translate the whole group right (head retreats).
    if (this.kills <= this.cfg.bodyKills) {
      this.clipPct = (this.kills / this.cfg.bodyKills) * this.cfg.maxClipPct;
      this.retreatPct += 1.2;
    } else {
      this.retreatPct += this.cfg.retreatPctPerKill;
    }
    this._updateSnakeTransform();

    this._updateMood();
    if (this.kills >= this.cfg.totalKills && !this._winFired) {
      this._winFired = true;
      this._playOutro();
    }
  }

  _flashSnake() {
    this.snakeImg.classList.add('hit');
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => this.snakeImg.classList.remove('hit'), 180);
  }

  _playOutro() {
    this.retreatPct += 50;
    this._updateSnakeTransform();
    this._setMood('safe');

    if (!this.outro) {
      setTimeout(() => this.onAllKilled?.(), 400);
      return;
    }
    this.outro.classList.remove('hidden');
    requestAnimationFrame(() => this.outro.classList.add('playing'));

    setTimeout(() => {
      this.outro.classList.remove('playing');
      setTimeout(() => {
        this.outro.classList.add('hidden');
        this.onAllKilled?.();
      }, this.cfg.outroEnterMs);
    }, this.cfg.outroEnterMs + this.cfg.outroHoldMs);
  }

  // ---------- Per-frame ----------

  _startTickLoop() {
    if (this.running) return;
    this.running = true;
    this._lastTs = 0;
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _tick(ts) {
    if (!this.running) return;
    // Vignette intensity scales with how much of the body remains (closer to
    // "no body left" = less danger). Snake doesn't creep on idle in this
    // single-image model; kills drive all motion.
    if (!this._winFired && this.kills < this.cfg.totalKills) {
      const remaining = 1 - (this.clipPct / this.cfg.maxClipPct);
      const baseOpacity = 0.12 + remaining * this.cfg.vignetteMaxOpacity * 0.5;
      this.vignetteEl.style.setProperty('--vignette-opacity', baseOpacity.toFixed(2));
    }
    requestAnimationFrame(this._tick);
  }

  _updateSnakeTransform() {
    this.snakeEl.style.transform = `translate(${this.retreatPct}%, -50%)`;
    this.snakeImg.style.setProperty('--snake-clip', this.clipPct + '%');
  }

  // ---------- Mood ----------

  _updateMood() {
    const ratio = this.kills / this.cfg.totalKills;
    if (ratio >= this.cfg.moodSafe) this._setMood('safe');
    else if (ratio >= this.cfg.moodBrave) this._setMood('brave');
    else this._setMood('scared');
  }

  _setMood(name) {
    if (this._mood === name) return;
    this._mood = name;
    for (const key of ['scared', 'brave', 'safe']) {
      this.heroSprites[key].classList.toggle('show', key === name);
    }
  }

  // ---------- Effects ----------

  _showSplat(x, y) {
    const splat = document.createElement('img');
    splat.src = this.cfg.assetsBase + 'fx_splat.png';
    splat.className = 'splat';
    splat.style.left = x + 'px';
    splat.style.top = y + 'px';
    splat.draggable = false;
    this.stage.appendChild(splat);
    setTimeout(() => splat.remove(), this.cfg.splatMs);
  }

  _flashVignette() {
    this.vignetteEl.classList.remove('flash');
    void this.vignetteEl.offsetWidth;
    this.vignetteEl.classList.add('flash');
  }

  _shakeStage() {
    this.stage.classList.remove('mini-shake');
    void this.stage.offsetWidth;
    this.stage.classList.add('mini-shake');
    setTimeout(() => this.stage.classList.remove('mini-shake'), 260);
  }

  reset() {
    this.kills = 0;
    this.clipPct = 0;
    this.retreatPct = 0;
    this._winFired = false;
    this._setMood('scared');
    this._updateSnakeTransform();
    this.outro?.classList.add('hidden');
    this.outro?.classList.remove('playing');
  }
}
