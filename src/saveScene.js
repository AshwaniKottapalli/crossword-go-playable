// "Save the hero" three-act cinematic scene.
//
// ACT 1 — INTRO  (0–2.5s, full-bleed overlay): snake lunges at terrified hero,
//                vignette flashes, camera shakes, "OH NO!" badge punches in.
// ACT 2 — STRIP  (persistent ~22% top): bg + hero + snake live above the puzzle.
//                Every correct letter zaps the snake: laser → recoil head sprite
//                + green splat + red vignette flash + screen shake. Snake retreats.
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
    this.snakeEl   = root.querySelector('.scene-snake');
    this.headNormal = root.querySelector('.head-normal');
    this.headRecoil = root.querySelector('.head-recoil');
    this.vignetteEl = root.querySelector('.scene-vignette');

    this.kills = 0;
    // retreatPct: 0 = head at closest CSS position (most menace), positive = retreated.
    this.retreatPct = this.cfg.initialRetreatPct;
    this.running = false;
    this.onAllKilled = null;
    this._winFired = false;
    this._recoilTimer = 0;

    this._setMood('scared');
    this._updateSnakeTransform();
  }

  // ---------- Lifecycle ----------

  // Called at game boot. Starts the idle creep and (if intro overlay exists) plays the cinematic.
  playIntro(onIntroDone) {
    this._startTickLoop();
    this.audio?.play?.('hiss');
    if (!this.intro) {
      onIntroDone?.();
      return;
    }
    this.intro.classList.remove('hidden');
    this.intro.classList.add('playing');
    // Stage shakes throughout the intro for added menace
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

  // Called from game._onDrop on every correct letter, and from cascade.js per fill.
  // cellEl = the cell DOM the letter just landed in (laser source).
  // Laser targets the front-most live body segment (or head if no body left).
  zapSegment(cellEl) {
    if (!cellEl || this.kills >= this.cfg.totalKills) return;
    this.kills++;

    const targetBody = this._nextBodyTarget();
    const targetEl = targetBody || this.headNormal;

    const targetRect = targetEl.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();
    const startX = (cellRect.left + cellRect.width / 2) - stageRect.left;
    const startY = (cellRect.top + cellRect.height / 2) - stageRect.top;
    const endX = (targetRect.left + targetRect.width / 2) - stageRect.left;
    const endY = (targetRect.top + targetRect.height / 2) - stageRect.top;

    this.audio?.play?.('laser');
    this.particles.laser(startX, startY, endX, endY, '#9aff4a', () => {
      this._onLaserHit(endX, endY, targetBody);
    }, this.cfg.laserMs);
  }

  _nextBodyTarget() {
    const live = this.snakeEl.querySelectorAll('.snake-body:not(.dying):not(.dead)');
    return live[0] || null;     // front-most (closest to head)
  }

  _onLaserHit(hitX, hitY, destroyedBody) {
    this.audio?.play?.('boom');
    this.particles.boom(hitX, hitY, '#9aff4a');
    this._showSplat(hitX, hitY);
    this._flashVignette();
    this._shakeStage();
    this._flashHeadRecoil();

    if (destroyedBody) {
      // Pop the body segment, then remove it from flex flow so the chain compacts.
      destroyedBody.classList.add('dying');
      setTimeout(() => destroyedBody.classList.add('dead'), 360);
      // Small symbolic retreat when body is lost
      this.retreatPct += 1.0;
    } else {
      // No body left — head + tail retreat per kill
      this.retreatPct += this.cfg.retreatPctPerKill;
    }
    this._updateSnakeTransform();

    this._updateMood();
    if (this.kills >= this.cfg.totalKills && !this._winFired) {
      this._winFired = true;
      this._playOutro();
    }
  }

  _flashHeadRecoil() {
    this.headNormal.classList.add('hit');
    this.headRecoil.classList.add('hit');
    clearTimeout(this._recoilTimer);
    this._recoilTimer = setTimeout(() => {
      this.headNormal.classList.remove('hit');
      this.headRecoil.classList.remove('hit');
    }, this.cfg.recoilHoldMs);
  }

  _playOutro() {
    this.retreatPct += 40;
    this._updateSnakeTransform();
    this._setMood('safe');

    if (!this.outro) {
      setTimeout(() => this.onAllKilled?.(), 400);
      return;
    }
    this.outro.classList.remove('hidden');
    requestAnimationFrame(() => this.outro.classList.add('playing'));

    // Hold the YOU SAVED HIM screen, then fade out, then hand off to win flow.
    setTimeout(() => {
      this.outro.classList.remove('playing');
      setTimeout(() => {
        this.outro.classList.add('hidden');
        this.onAllKilled?.();
      }, this.cfg.outroEnterMs);
    }, this.cfg.outroEnterMs + this.cfg.outroHoldMs);
  }

  // ---------- Per-frame updates ----------

  _startTickLoop() {
    if (this.running) return;
    this.running = true;
    this._lastTs = 0;
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _tick(ts) {
    if (!this.running) return;
    if (!this._lastTs) this._lastTs = ts;
    const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
    this._lastTs = ts;

    if (!this._winFired && this.kills < this.cfg.totalKills) {
      // Idle creep toward hero — retreatPct decreases (snake advances)
      this.retreatPct -= this.cfg.idleCreepPctPerSec * dt;
      if (this.retreatPct < 0) this.retreatPct = 0;
      this._updateSnakeTransform();
      // Closer = more red. retreatPct above 40 = no danger; at 0 = max.
      const proximity = Math.max(0, 1 - this.retreatPct / 40);
      const baseOpacity = 0.12 + proximity * this.cfg.vignetteMaxOpacity * 0.5;
      this.vignetteEl.style.setProperty('--vignette-opacity', baseOpacity.toFixed(2));
    }

    requestAnimationFrame(this._tick);
  }

  _updateSnakeTransform() {
    // CSS positions the snake group with head's closest-to-hero spot at retreatPct=0.
    // Positive retreatPct shifts the entire group rightward (away from hero, off-screen).
    this.snakeEl.style.transform = `translate(${this.retreatPct}%, -50%)`;
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
    this.retreatPct = this.cfg.initialRetreatPct;
    this._winFired = false;
    this._setMood('scared');
    this._updateSnakeTransform();
    this.outro?.classList.add('hidden');
    this.outro?.classList.remove('playing');
    // Resurrect all body segments
    this.snakeEl.querySelectorAll('.snake-body').forEach(el => {
      el.classList.remove('dying', 'dead');
    });
  }
}
