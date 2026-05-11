// Scripted 0-3s opening: a "bot" drags the decoy X tile across the screen
// and drops it into the A slot. Grid shakes red, tutorial finger appears.
// The whole point is to trigger the "I'd do better" instinct.

import { CONFIG } from './config.js';

export function runFakeFail({ grid, bank, ui, audio, target, dropCell }, onDone) {
  const t = CONFIG.timing.fakeFail;
  const decoy = CONFIG.decoyLetter;
  const firstSlot = dropCell || target.cells[0];
  const stage = document.getElementById('stage');

  bank.setLocked(true);

  let ghost = null;
  const timers = [];
  const sched = (ms, fn) => timers.push(setTimeout(fn, ms));

  // 0–botEnterMs: bot finger appears near the decoy tile
  sched(t.botEnterMs, () => {
    const decoyEl = bank.tileEl(decoy);
    if (decoyEl) ui.pointAt(decoyEl);
  });

  // botGrabMs: bot "grabs" the decoy — spawn ghost, snap sound, dim original
  sched(t.botGrabMs, () => {
    const decoyEl = bank.tileEl(decoy);
    if (!decoyEl) return;
    ghost = bank.spawnGhost(decoy);
    decoyEl.classList.add('dragging-src');
    audio.play('snap');
  });

  // Drag the ghost toward the target cell over ~600ms
  const dragStart = t.botGrabMs + 200;
  const dragDur = Math.max(200, t.botDropMs - dragStart);
  sched(dragStart, () => {
    if (!ghost) return;
    const cell = grid.cell(firstSlot[0], firstSlot[1]);
    if (!cell) return;
    const cellRect = cell.el.getBoundingClientRect();
    const w = parseFloat(ghost.style.width);
    const h = parseFloat(ghost.style.height);
    ghost.style.transition = `left ${dragDur}ms cubic-bezier(0.4,0,0.2,1), top ${dragDur}ms cubic-bezier(0.4,0,0.2,1)`;
    ghost.style.left = (cellRect.left + (cellRect.width - w) / 2) + 'px';
    ghost.style.top  = (cellRect.top  + (cellRect.height - h) / 2) + 'px';
    // Move the finger along with the ghost
    animateFingerToCell(ui, cellRect, dragDur);
  });

  // botDropMs: drop arrives — show X in cell, shake red, remove ghost
  sched(t.botDropMs, () => {
    const [r, c] = firstSlot;
    if (ghost) { ghost.remove(); ghost = null; }
    grid.setLetter(r, c, decoy, { animClass: 'placed' });
    bank.removeTile(decoy);
    setTimeout(() => {
      audio.play('wrong');
      grid.flashWrong(r, c);
      ui.shakeStage();
      ui.hideFinger();
    }, 120);
  });

  // botResetMs: cleanup — clear cell, highlight the target row
  sched(t.botResetMs, () => {
    const [r, c] = firstSlot;
    grid.clearLetter(r, c);
    grid.highlightTarget(target.cells);
  });

  // tutorialAppearMs: unlock bank, signal that user should drag now
  sched(t.tutorialAppearMs, () => {
    bank.setLocked(false);
    onDone?.();
  });
}

function animateFingerToCell(ui, cellRect, dur) {
  const stage = document.getElementById('stage').getBoundingClientRect();
  const fingerEl = document.getElementById('finger');
  if (!fingerEl) return;
  // Take current finger position from style
  const startLeft = parseFloat(fingerEl.style.left) || 0;
  const startTop  = parseFloat(fingerEl.style.top)  || 0;
  const endLeft = cellRect.left - stage.left + cellRect.width / 2;
  const endTop  = cellRect.top  - stage.top  + cellRect.height * 0.6;
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    ui.pointAtXY(startLeft + (endLeft - startLeft) * eased, startTop + (endTop - startTop) * eased);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
