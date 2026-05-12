// State machine — two-word solve, then cascade, then win, then CTA.

import { CONFIG } from './config.js';
import { Grid } from './grid.js';
import { LetterBank } from './letterBank.js';
import { UI, pickStoreUrl } from './ui.js';
import { Audio } from './audio.js';
import { Particles } from './particles.js';
import { SaveScene } from './saveScene.js';
import { runFakeFail } from './fakeFail.js';
import { runCascade, stageRelCellCenter } from './cascade.js';

export const STATE = {
  INIT: 'init',
  FAKE_FAIL: 'fake-fail',
  SOLVE_EASY: 'solve-easy',
  SOLVE_AWESOME: 'solve-awesome',
  CASCADE: 'cascade',
  WIN: 'win',
  CTA: 'cta',
};

export class Game {
  constructor() {
    this.state = STATE.INIT;
    this.ui = new UI();
    this.audio = new Audio();
    this.audio.init();
    this.grid = new Grid(CONFIG);
    this.bank = new LetterBank(CONFIG, (char, r, c) => this._onDrop(char, r, c));
    this.bank.onDragStart = () => {
      this.ui.stopDemo();
      this._userInteracted = true;
      this._armIdleHint();
    };
    this.particles = new Particles(document.getElementById('fx'));

    this.saveScene = new SaveScene({
      root: document.getElementById('save-scene'),
      intro: document.getElementById('intro-cinematic'),
      outro: document.getElementById('outro-cinematic'),
      stage: document.getElementById('stage'),
      audio: this.audio,
      particles: this.particles,
    });
    this.saveScene.onAllKilled = () => this._enterWin();

    this.targets = CONFIG.puzzle.targets;
    this.targetIdx = 0;
    this.dropsThisPhase = 0;
    this._userInteracted = false;

    this.ui.setOpponentScore(CONFIG.score.opponentStart);
    this._applyPrefills();

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // Pre-fill the partial letters for each target so the user only has to
  // figure out the missing ones. Each prefilled cell looks "already solved".
  _applyPrefills() {
    for (const target of this.targets) {
      if (!target.prefill) continue;
      for (const [idxStr, char] of Object.entries(target.prefill)) {
        const idx = +idxStr;
        const [r, c] = target.cells[idx];
        this.grid.setLetter(r, c, char, { animClass: 'placed' });
        // Tag as target immediately so prefilled cells render gold from the start
        this.grid.cell(r, c).el.classList.add('target');
      }
    }
  }

  start() {
    // Bank for the first target is loaded first so the fake-fail can grab its decoy.
    this.bank.setLetters(this.targets[0].bank);
    // Play the intro cinematic, then proceed with the bot's fake-fail.
    this.saveScene.playIntro(() => {
      // Snake creep starts immediately so threat is felt from word 1.
      this.saveScene?.activateCreep();
      if (CONFIG.skipFakeFail) {
        this._enterSolvePhase();
      } else {
        this._enterFakeFail();
      }
      // Demo finger (clue) stays on a delayed timer so the player gets a
      // chance to read the puzzle before help is offered.
      const graceMs = CONFIG.saveScene?.gracePeriodMs ?? 10000;
      this._graceTimer = setTimeout(() => {
        if (this.state === STATE.SOLVE_EASY || this.state === STATE.SOLVE_AWESOME) {
          this._maybeShowDemo();
        }
      }, graceMs);
    });
  }

  _enterFakeFail() {
    this.state = STATE.FAKE_FAIL;
    // Drop the decoy on the FIRST EMPTY cell (skip prefilled cells).
    const target = this.targets[0];
    const firstEmptyIdx = target.cells.findIndex((_, i) => !target.prefill?.[i]);
    const dropCell = target.cells[firstEmptyIdx];
    runFakeFail({
      grid: this.grid,
      bank: this.bank,
      ui: this.ui,
      audio: this.audio,
      target,
      dropCell,
    }, () => this._enterSolvePhase());
  }

  _enterSolvePhase() {
    const target = this.targets[this.targetIdx];
    this.state = (target.id === 'awesome') ? STATE.SOLVE_AWESOME : STATE.SOLVE_EASY;
    this.dropsThisPhase = 0;
    this.bank.setLocked(false);
    this.grid.highlightTarget(target.cells);
    // Demo finger no longer fires immediately — the grace-period timer (or
    // re-armed idle hint after user activity) controls when the clue appears.
    this._armIdleHint();
  }

  // Re-show the demo finger if the user goes idle in a solve phase.
  _armIdleHint() {
    clearTimeout(this._idleTimer);
    const ms = CONFIG.timing.idleHintMs || 10000;
    this._idleTimer = setTimeout(() => {
      if (this.state === STATE.SOLVE_EASY || this.state === STATE.SOLVE_AWESOME) {
        this._maybeShowDemo();
      }
    }, ms);
  }

  _onDrop(char, r, c) {
    if (this.state !== STATE.SOLVE_EASY && this.state !== STATE.SOLVE_AWESOME) return false;
    const target = this.targets[this.targetIdx];

    const idx = target.cells.findIndex(([tr, tc]) => tr === r && tc === c);
    if (idx === -1) return false;
    if (this.grid.cell(r, c).char) return false; // already filled (prefilled or user-placed)

    const expected = target.chars[idx];
    if (char !== expected) {
      // Distinguish a "needed letter dropped in wrong slot" from a "decoy letter".
      // Needed letters snap back (otherwise the player could exhaust them and get stuck).
      // Decoy letters get CONSUMED + -1 score (matches the bot's R behavior).
      const stillNeeded = target.cells.some(([tr, tc], i) =>
        target.chars[i] === char && !this.grid.cell(tr, tc).char
      );

      if (stillNeeded) {
        this.grid.flashWrong(r, c);
        this.audio.play('wrong');
        return false;
      }

      // Decoy — consume tile, penalize, brief letter-in-cell shake
      this.grid.setLetter(r, c, char);
      this.bank.removeTile(char);
      this.audio.play('wrong');
      this.ui.addScore(-1);
      const cen = stageRelCellCenter(this.grid, r, c);
      if (cen) this.ui.pop(cen.x, cen.y - 12, '-1', { size: '20px', color: '#ff5a5a' });
      setTimeout(() => this.grid.flashWrong(r, c, { autoClear: true }), 80);
      return true;
    }

    // Correct placement
    this.grid.setLetter(r, c, char);
    this.audio.play('snap');
    const center = stageRelCellCenter(this.grid, r, c);
    if (center) {
      this.ui.pop(center.x, center.y - 8, '+1', { size: '20px', color: '#4fcc70' });
      this.particles.sparkle(center.x, center.y);
    }
    this.bank.removeTile(char);
    this.dropsThisPhase++;
    this.ui.addScore(1);
    this.saveScene.zapSegment(this.grid.cell(r, c).el);

    if (this._isTargetComplete(target)) {
      this._onPhaseComplete();
    } else {
      if (this.dropsThisPhase < CONFIG.timing.demoDropsLimit) {
        this._maybeShowDemo();
      } else {
        this.ui.stopDemo();
      }
      this._armIdleHint();
    }
    return true;
  }

  _isTargetComplete(target) {
    return target.cells.every(([r, c]) => !!this.grid.cell(r, c).char);
  }

  _onPhaseComplete() {
    const target = this.targets[this.targetIdx];
    this.bank.setLocked(true);
    this.ui.stopDemo();
    clearTimeout(this._idleTimer);
    // Strip .active-target so the spotlight refocuses on the next phase's target.
    // (Solved cells still have .target.placed → stay gold.)
    this.grid.unhighlightTarget(target.cells);

    if (target.id === 'awesome') {
      // Final phase done → cascade
      this._enterCascade();
      return;
    }

    // Phase 1 (EASY) done — reward + transition to phase 2
    this.audio.play('targetWin');
    this.ui.showBanner(CONFIG.copy.bannerEasy, '', 900);
    // Bonus score: target gives +easyReward over the per-letter +1
    this.ui.addScore(Math.max(0, CONFIG.score.easyReward - target.chars.length));
    this.grid.glowRow(target.cells);

    // After short hold, swap bank to the next target and continue
    setTimeout(async () => {
      await this.bank.clearWithAnimation(180);
      this.targetIdx++;
      const next = this.targets[this.targetIdx];
      this.bank.setLetters(next.bank, { animate: true });
      setTimeout(() => this._enterSolvePhase(), CONFIG.timing.bankRefreshMs);
    }, CONFIG.timing.interPhaseDelay);
  }

  _maybeShowDemo() {
    const target = this.targets[this.targetIdx];
    let idx = -1;
    for (let i = 0; i < target.cells.length; i++) {
      const [r, c] = target.cells[i];
      if (!this.grid.cell(r, c).char) { idx = i; break; }
    }
    if (idx === -1) return;
    const expectedChar = target.chars[idx];
    const tileEl = this.bank.tileEl(expectedChar);
    const [r, c] = target.cells[idx];
    const cellEl = this.grid.cell(r, c).el;
    if (!tileEl || !cellEl) return;
    this.ui.startDragDemo(tileEl, cellEl, expectedChar);
  }

  _enterCascade() {
    this.state = STATE.CASCADE;
    this.bank.setLocked(true);
    this.ui.stopDemo();
    this.ui.hideFinger();
    clearTimeout(this._idleTimer);
    this.grid.el.classList.remove('solving'); // restore full opacity for the cascade reveal
    // Keep AWESOME row highlighted; show the "+7" corner badge on its last cell
    const awesome = this.targets.find(t => t.id === 'awesome');
    if (awesome) {
      this.grid.showCornerBadge(awesome.cells, `+${CONFIG.score.targetReward}`);
      this.ui.addScore(CONFIG.score.targetReward);
    }

    runCascade({
      grid: this.grid,
      ui: this.ui,
      audio: this.audio,
      particles: this.particles,
      saveScene: this.saveScene,
    }, () => this._enterWin());
  }

  _enterWin() {
    if (this.state === STATE.WIN || this.state === STATE.CTA) return;
    this.state = STATE.WIN;
    this.ui.showBanner(CONFIG.copy.bannerWin, '★ ★ ★', 2200);
    this.audio.play('win');

    const stage = document.getElementById('stage').getBoundingClientRect();
    this.particles.confetti(stage.width * 0.5, stage.height * 0.4);
    setTimeout(() => this.particles.confetti(stage.width * 0.3, stage.height * 0.5), 250);
    setTimeout(() => this.particles.confetti(stage.width * 0.7, stage.height * 0.5), 500);

    setTimeout(() => {
      this.ui.pop(stage.width * 0.5, stage.height * 0.55, CONFIG.copy.bannerBonus, { color: '#f5b740', size: '38px' });
      this.audio.play('bonus');
      this.ui.rollScoreTo(this.ui.score + CONFIG.score.finalBonus, 800);
    }, CONFIG.timing.winBonusDelayMs);

    setTimeout(() => this._enterCTA(), 1600);
  }

  _enterCTA() {
    this.state = STATE.CTA;
    this.audio.play('cta');
    this.ui.showCTA(() => {
      try { window.open(pickStoreUrl(), '_blank'); } catch (_) {}
    });
  }

  _loop(ts) {
    this.particles.tick(ts);
    requestAnimationFrame(this._loop);
  }
}
