// Canvas2D particle bursts — multi-channel (sparkle / confetti / glow).
// Mirrors the multi-channel structure from CLAUDE.md §4 (Three.Points) but in 2D.

export class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._lastTs = 0;
    this._resize();
    window.addEventListener('resize', () => this._resize());
    if (window.ResizeObserver) {
      new ResizeObserver(() => this._resize()).observe(canvas);
    }
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width  = Math.max(1, Math.floor(rect.width  * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // x,y in canvas-relative CSS pixels.
  emit(x, y, count, opts) {
    const kind = opts.kind || 'sparkle';
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = (opts.speedMin || 60) + Math.random() * ((opts.speedMax || 240) - (opts.speedMin || 60));
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed - (opts.upBias || 0);
      this.parts.push({
        kind,
        x, y, vx, vy,
        gravity: opts.gravity ?? 320,
        life: opts.life || 0.8,
        age: 0,
        size: (opts.sizeMin || 4) + Math.random() * ((opts.sizeMax || 10) - (opts.sizeMin || 4)),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8,
        color: opts.color || '#ffd84a',
        colors: opts.colors,
      });
    }
  }

  // Convenience: confetti burst from a grid coord
  confetti(x, y) {
    this.emit(x, y, 60, {
      kind: 'confetti',
      colors: ['#f5b740', '#4fcc70', '#5fa8e8', '#ff6b9d', '#9b6bff'],
      speedMin: 200, speedMax: 460,
      gravity: 380,
      upBias: 220,
      life: 1.4,
      sizeMin: 5, sizeMax: 11,
    });
  }

  sparkle(x, y) {
    this.emit(x, y, 12, {
      kind: 'sparkle',
      color: '#fff7a8',
      speedMin: 60, speedMax: 180,
      gravity: 0,
      life: 0.55,
      sizeMin: 2, sizeMax: 5,
    });
  }

  cascadeBurst(x, y, color = '#4fcc70') {
    this.emit(x, y, 18, {
      kind: 'sparkle',
      color,
      speedMin: 100, speedMax: 260,
      gravity: 120,
      upBias: 60,
      life: 0.7,
      sizeMin: 3, sizeMax: 7,
    });
  }

  tick(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
    this._lastTs = ts;

    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    this.ctx.clearRect(0, 0, w, h);

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.age += dt;
      if (p.age >= p.life) { this.parts.splice(i, 1); continue; }

      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;

      const lifeFrac = p.age / p.life;
      const alpha = 1 - lifeFrac;

      this.ctx.globalAlpha = alpha;

      if (p.kind === 'confetti') {
        const c = p.colors ? p.colors[Math.floor((p.x * 13 + p.y * 7) % p.colors.length + p.colors.length) % p.colors.length] : p.color;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.fillStyle = c;
        this.ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
        this.ctx.restore();
      } else {
        // sparkle: small radial blob with hot center
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * (1 - lifeFrac * 0.5), 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.globalAlpha = 1;
  }
}
