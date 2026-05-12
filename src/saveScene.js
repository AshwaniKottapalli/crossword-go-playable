// "Save the hero" three-act cinematic scene.
//
// ACT 1 — INTRO  (0–2.5s, full-bleed overlay): snake lunges at terrified hero,
//                vignette flashes, camera shakes, "OH NO!" badge punches in.
// ACT 2 — STRIP  (persistent ~22% top): bg + hero + snake live above the puzzle.
//                Snake starts with only its head poking in from the right edge.
//                Idle creep advances it leftward toward the hero (time pressure).
//                Each correct letter retreats it rightward (knockback) and flashes
//                a bright green-glow + splat + screen shake.
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
    // snakePos: head's horizontal position in % of strip width.
    //   100 = head at right edge (only head peeking in, body off-screen right)
    //    30 = head close to hero (max threat)
    //   200 = fully retreated off-screen
    this.snakePos = this.cfg.startSnakePos;
    this.running = false;
    // Snake is dormant (just peeking) until activateCreep() is called by game.js
    // after the grace period. This gives the player time to read the puzzle
    // before the time-pressure kicks in.
    this._creepActive = false;
    this.onAllKilled = null;
    this._winFired = false;

    this._setMood('scared');
    this._updateSnakeTransform();
  }

  // Called by game.js after the grace-period timeout. Snake starts creeping.
  activateCreep() {
    this._creepActive = true;
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

    // Laser flies to the head's current position. With each kill the head
    // moves right (retreat), so the laser tracks where the snake is.
    const head = this._headPoint();
    const cellRect = cellEl.getBoundingClientRect();
    const stageRect = this.stage.getBoundingClientRect();
    const startX = (cellRect.left + cellRect.width / 2) - stageRect.left;
    const startY = (cellRect.top + cellRect.height / 2) - stageRect.top;

    this.audio?.play?.('laser');
    this.particles.laser(startX, startY, head.x, head.y, '#9aff4a', () => {
      this._onLaserHit(head.x, head.y);
    }, this.cfg.laserMs);
  }

  // Head position in stage-relative coords. Head is at the LEFT of the
  // snake_full image with a small inset for the eye/mouth area.
  _headPoint() {
    const stageRect = this.stage.getBoundingClientRect();
    const rect = this.snakeImg.getBoundingClientRect();
    // The .snake-full element fills the container. With object-fit:contain on
    // a 3:1 image inside a wider-than-tall container, the image is letterboxed
    // vertically — the rendered head sits at rect.left, vertically centered.
    return {
      x: rect.left + rect.width * 0.10 - stageRect.left,
      y: rect.top + rect.height * 0.50 - stageRect.top,
    };
  }

  _onLaserHit(hitX, hitY) {
    this.audio?.play?.('boom');
    this.particles.boom(hitX, hitY, '#9aff4a');
    this._showSplat(hitX, hitY);
    this._flashVignette();
    this._shakeStage();
    this._flashSnake();

    // Knockback: snake retreats rightward by configured amount. Any active
    // bite animation breaks immediately so the retreat reads cleanly.
    this.snakePos += this.cfg.retreatPctPerKill;
    this.snakeEl.classList.remove('biting');
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
    // Slither fully off-screen
    this.snakePos = Math.max(this.snakePos, 220);
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

  // ---------- Per-frame: idle creep (time pressure) ----------

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

    if (this._creepActive && !this._winFired && this.kills < this.cfg.totalKills) {
      // Idle creep: snake advances leftward (snakePos decreases) at a brisk
      // pace so the user feels time pressure.
      this.snakePos -= this.cfg.idleCreepPctPerSec * dt;
      if (this.snakePos <= this.cfg.minSnakePos) {
        this.snakePos = this.cfg.minSnakePos;
        // At max threat: keep tension alive with a lunging bite animation.
        this.snakeEl.classList.add('biting');
      } else {
        this.snakeEl.classList.remove('biting');
      }
      this._updateSnakeTransform();

      // Vignette intensity scales with proximity. minSnakePos = max red,
      // startSnakePos = least red.
      const range = Math.max(1, this.cfg.startSnakePos - this.cfg.minSnakePos);
      const proximity = Math.max(0, Math.min(1, (this.cfg.startSnakePos - this.snakePos) / range));
      const baseOpacity = 0.10 + proximity * this.cfg.vignetteMaxOpacity * 0.7;
      this.vignetteEl.style.setProperty('--vignette-opacity', baseOpacity.toFixed(2));
    }

    requestAnimationFrame(this._tick);
  }

  _updateSnakeTransform() {
    this.snakeEl.style.setProperty('--snake-pos', this.snakePos + '%');
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
    this.snakePos = this.cfg.startSnakePos;
    this._creepActive = false;
    this._winFired = false;
    this._setMood('scared');
    this._updateSnakeTransform();
    this.outro?.classList.add('hidden');
    this.outro?.classList.remove('playing');
  }
}
