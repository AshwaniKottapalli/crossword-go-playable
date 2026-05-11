// The cascade — fires after AWESOME is solved.
// Sweeps through every remaining empty letter cell, filling it with the configured
// letter, scoring +1 per cell, with rising chime notes for rhythm.

import { CONFIG } from './config.js';

export function runCascade({ grid, ui, audio, particles }, onDone) {
  const fills = CONFIG.puzzle.cascadeFills;
  const t = CONFIG.timing;
  const reward = CONFIG.score.cascadeCellReward;

  // Beat 1: AWESOME row glow + targetWin sound (the +7 corner badge already shown by Game)
  const awesome = CONFIG.puzzle.targets.find(x => x.id === 'awesome');
  if (awesome) grid.glowRow(awesome.cells);
  audio.play('targetWin');

  // Beat 2: GENIUS! banner after a short hold
  setTimeout(() => ui.showBanner(CONFIG.copy.bannerCascade, '', 1500), 280);

  // Beat 3: cascade fills
  setTimeout(() => {
    fills.forEach((f, i) => {
      setTimeout(() => {
        const cell = grid.cell(f.r, f.c);
        if (!cell) return;
        grid.setLetter(f.r, f.c, f.char, { animClass: 'cascade-hit' });

        // Score + pop every cell
        ui.addScore(reward);
        const cen = stageRelCellCenter(grid, f.r, f.c);
        if (cen) {
          ui.pop(cen.x, cen.y - 8, `+${reward}`, { size: '16px', color: '#4ec96a' });
          particles.cascadeBurst(cen.x, cen.y);
        }

        // Chime on every Nth fill to keep the rhythm musical, not chaotic.
        if (i % (t.cascadeChimeEvery || 4) === 0) {
          const noteIdx = Math.floor(i / (t.cascadeChimeEvery || 4));
          audio.play('chime', { noteIdx });
        }
      }, i * t.cascadeFillStaggerMs);
    });

    // After last fill, fire onDone
    const totalDur = fills.length * t.cascadeFillStaggerMs + 200;
    setTimeout(() => onDone?.(), totalDur);
  }, t.cascadeStartDelay);
}

// Convert a grid cell center into stage-relative coordinates.
export function stageRelCellCenter(grid, r, c) {
  const cell = grid.cell(r, c);
  if (!cell) return null;
  const cr = cell.el.getBoundingClientRect();
  const stage = document.getElementById('stage').getBoundingClientRect();
  return { x: cr.left - stage.left + cr.width / 2, y: cr.top - stage.top + cr.height / 2 };
}
