// Procedural SFX engine.
// Web Audio context lives suspended until first user interaction (CLAUDE.md §7).
// Any play() calls before unlock are queued and drained on `running`.

import { CONFIG } from './config.js';

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.queue = [];
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.audio.masterGain;
    this.master.connect(this.ctx.destination);

    const unlock = () => {
      if (this.ctx.state !== 'running') this.ctx.resume();
    };
    ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
      window.addEventListener(ev, unlock, { once: false, passive: true }));

    this.ctx.addEventListener('statechange', () => {
      if (this.ctx.state === 'running' && !this.ready) {
        this.ready = true;
        while (this.queue.length) this.queue.shift()();
      }
    });
  }

  play(name, opts = {}) {
    if (!this.ctx) this.init();
    const fire = () => this._dispatch(name, opts);
    if (this.ctx.state !== 'running') {
      this.queue.push(fire);
      return;
    }
    fire();
  }

  _dispatch(name, opts) {
    switch (name) {
      case 'snap':       return this._snap();
      case 'wrong':      return this._wrong();
      case 'chime':      return this._chime(opts.noteIdx || 0);
      case 'targetWin':  return this._targetWin();
      case 'pop':        return this._pop();
      case 'bonus':      return this._bonus();
      case 'win':        return this._win();
      case 'cta':        return this._ctaSwoosh();
    }
  }

  // ---------- recipes ----------

  _tone(freq, dur, type = 'sine', gain = 0.4, attack = 0.005, release = 0.08) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + release);
    return { osc, g, start: t };
  }

  _snap() {
    // Wood-block click: short triangle + noise blip
    this._tone(880, 0.08, 'triangle', 0.35, 0.002, 0.04);
    this._tone(1320, 0.05, 'sine', 0.2, 0.001, 0.03);
  }

  _wrong() {
    // Two-note descending buzz
    const t = this.ctx.currentTime;
    this._tone(220, 0.12, 'sawtooth', 0.3, 0.003, 0.06);
    setTimeout(() => this._tone(165, 0.18, 'sawtooth', 0.3, 0.003, 0.08), 90);
  }

  _chime(noteIdx) {
    const notes = CONFIG.audio.cascadeNotes;
    const f = notes[Math.min(noteIdx, notes.length - 1)];
    // Bell-ish: fundamental + fifth + octave
    this._tone(f,     0.45, 'sine',     0.32, 0.003, 0.25);
    this._tone(f * 2, 0.35, 'sine',     0.10, 0.003, 0.20);
    this._tone(f * 3, 0.25, 'triangle', 0.05, 0.003, 0.15);
  }

  _pop() {
    this._tone(1200, 0.05, 'sine', 0.18, 0.002, 0.03);
  }

  _targetWin() {
    // Triumphant 3-note arpeggio
    const base = 523.25; // C5
    this._tone(base,        0.18, 'triangle', 0.35);
    setTimeout(() => this._tone(base * 1.25, 0.18, 'triangle', 0.35), 90);
    setTimeout(() => this._tone(base * 1.5,  0.30, 'triangle', 0.4), 180);
  }

  _bonus() {
    this._tone(660, 0.1,  'square',   0.18, 0.003, 0.05);
    setTimeout(() => this._tone(990, 0.18, 'square', 0.18, 0.003, 0.08), 80);
  }

  _win() {
    // Fanfare: C-E-G-C ascending, then sustained C major chord
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => setTimeout(() => this._tone(f, 0.22, 'triangle', 0.35), i * 110));
    setTimeout(() => {
      this._tone(523.25, 0.9, 'triangle', 0.22);
      this._tone(659.25, 0.9, 'triangle', 0.22);
      this._tone(783.99, 0.9, 'triangle', 0.22);
    }, 470);
  }

  _ctaSwoosh() {
    // Brief upward swoosh
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.35);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.45);
  }
}
