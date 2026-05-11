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

  // Save-scene: a guided projectile that lerps from start to end, then fires onArrive.
  laser(startX, startY, endX, endY, color, onArrive, durationMs = 230) {
    this.parts.push({
      kind: 'laser',
      x: startX, y: startY,
      startX, startY, endX, endY,
      color,
      duration: durationMs / 1000,
      age: 0,
      life: durationMs / 1000,
      onArrive,
      size: 4, vx: 0, vy: 0, gravity: 0, rot: 0, rotSpeed: 0,
    });
  }

  // Save-scene: expanding colored ring + sparkle burst at segment-death point.
  boom(x, y, color) {
    this.parts.push({
      kind: 'ring',
      x, y,
      startSize: 4, endSize: 34,
      color,
      age: 0, life: 0.36,
      size: 0, vx: 0, vy: 0, gravity: 0, rot: 0, rotSpeed: 0,
    });
    this.emit(x, y, 14, {
      kind: 'sparkle',
      color,
      speedMin: 90, speedMax: 280,
      gravity: 60, upBias: 30,
      life: 0.55,
      sizeMin: 2, sizeMax: 6,
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
      if (p.age >= p.life) {
        if (p.kind === 'laser' && p.onArrive) p.onArrive();
        this.parts.splice(i, 1);
        continue;
      }

      if (p.kind === 'laser') {
        const k = p.age / p.life;
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const x = p.startX + (p.endX - p.startX) * eased;
        const y = p.startY + (p.endY - p.startY) * eased;
        const trailFrac = Math.max(0, eased - 0.35);
        const tx = p.startX + (p.endX - p.startX) * trailFrac;
        const ty = p.startY + (p.endY - p.startY) * trailFrac;
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3.2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(tx, ty);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        continue;
      }

      if (p.kind === 'ring') {
        const k = p.age / p.life;
        const r = p.startSize + (p.endSize - p.startSize) * k;
        this.ctx.globalAlpha = 1 - k;
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 3 * (1 - k * 0.6);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        continue;
      }

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
