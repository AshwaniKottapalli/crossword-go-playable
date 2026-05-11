// Crossword grid renderer.

import { CONFIG } from './config.js';
import { getIconHTML } from './icons.js';

export class Grid {
  constructor(cfg) {
    this.cfg = cfg;
    this.el = document.getElementById('grid');
    this.cells = {};
    this._build();
  }

  _build() {
    const { cols, rows } = this.cfg.grid;
    this.el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.el.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    const map = {};
    for (const c of this.cfg.puzzle.cells) map[`${c.r},${c.c}`] = c;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spec = map[`${r},${c}`];
        const div = document.createElement('div');
        div.className = 'cell ' + (spec ? spec.type : 'block');
        div.dataset.r = r;
        div.dataset.c = c;

        if (spec) {
          if (spec.type === 'clue-text') {
            if (spec.clues) {
              this._renderMultiClue(div, spec.clues);
            } else {
              this._renderClueText(div, spec.text);
            }
          } else if (spec.type === 'clue-icon') {
            div.innerHTML = `<div class="icon-wrap">${getIconHTML(spec.icon)}</div>`;
            if (spec.hintText) {
              const h = document.createElement('div');
              h.className = 'clue-hint';
              h.textContent = spec.hintText;
              div.appendChild(h);
            }
          } else if (spec.type === 'letter') {
            div.classList.add('empty');
            if (spec.target) div.dataset.target = spec.target;
            if (spec.hint) {
              div.textContent = spec.hint;
              div.classList.add('hint');
              div.dataset.filled = '1';
            }
          }

          // Cell-level direction arrow only for single-clue cells.
          // Multi-clue cells set their arrows on each .clue-part instead.
          if (!spec.clues) {
            if (spec.dir === 'down')  div.classList.add('clue-down');
            if (spec.dir === 'right') div.classList.add('clue-right');
          }
        }

        this.el.appendChild(div);
        this.cells[`${r},${c}`] = { el: div, spec, char: '' };
      }
    }
  }

  _renderClueText(div, text) {
    const lines = Array.isArray(text) ? text : [text];
    lines.forEach(line => {
      const s = document.createElement('span');
      s.className = 'clue-line';
      s.textContent = line;
      div.appendChild(s);
    });
  }

  _renderMultiClue(div, clues) {
    div.classList.add('multi');
    clues.forEach(c => {
      const part = document.createElement('div');
      part.className = 'clue-part';
      if (c.dir === 'right') part.classList.add('clue-right');
      if (c.dir === 'down')  part.classList.add('clue-down');
      const lines = Array.isArray(c.text) ? c.text : [c.text];
      lines.forEach(line => {
        const s = document.createElement('span');
        s.className = 'clue-line';
        s.textContent = line;
        part.appendChild(s);
      });
      div.appendChild(part);
    });
  }

  cell(r, c) { return this.cells[`${r},${c}`]; }

  cellCenter(r, c) {
    const cell = this.cell(r, c);
    if (!cell) return null;
    const cr = cell.el.getBoundingClientRect();
    const wrap = this.el.parentElement.getBoundingClientRect();
    return { x: cr.left - wrap.left + cr.width / 2, y: cr.top - wrap.top + cr.height / 2 };
  }

  setLetter(r, c, char, { animClass = 'placed' } = {}) {
    const cell = this.cell(r, c);
    if (!cell) return;
    cell.char = char;
    // Preserve `target` so solved target rows keep their highlight styling.
    cell.el.classList.remove('empty', 'wrong', 'hover');
    cell.el.classList.add(animClass);
    cell.el.dataset.filled = '1';
    cell.el.textContent = char;
    setTimeout(() => cell.el.classList.remove(animClass), 500);
  }

  clearLetter(r, c) {
    const cell = this.cell(r, c);
    if (!cell) return;
    cell.char = '';
    cell.el.textContent = '';
    cell.el.classList.remove('placed');
    cell.el.classList.add('empty');
    delete cell.el.dataset.filled;
  }

  highlightTarget(coords) {
    // Mark every target cell as .active-target (gets the pulse / brightest highlight).
    // Then brighten ONLY the word segment in each target row — that is the contiguous
    // run of letter cells containing the target, plus the clue cell immediately to
    // its left that labels the word. Everything else in the row stays dimmed.
    const rowBounds = {};
    coords.forEach(([r, c]) => {
      const cell = this.cell(r, c);
      if (cell) cell.el.classList.add('target', 'active-target');
      if (!rowBounds[r]) rowBounds[r] = { min: c, max: c };
      rowBounds[r].min = Math.min(rowBounds[r].min, c);
      rowBounds[r].max = Math.max(rowBounds[r].max, c);
    });

    for (const rStr in rowBounds) {
      const r = +rStr;
      const { min, max } = rowBounds[rStr];

      // Walk left from the leftmost target cell. Extend through letter cells,
      // stop at (and include) the first clue cell — it labels the word.
      let leftBound = min;
      for (let c = min - 1; c >= 0; c--) {
        const cell = this.cell(r, c);
        if (!cell) break;
        const type = cell.spec?.type;
        if (type === 'clue-text' || type === 'clue-icon') {
          leftBound = c;
          break;
        } else if (type === 'letter') {
          leftBound = c;
        } else {
          break; // block — stop, don't include
        }
      }

      // Walk right. Extend through letter cells, stop BEFORE the next clue (it
      // belongs to a different word).
      let rightBound = max;
      for (let c = max + 1; c < this.cfg.grid.cols; c++) {
        const cell = this.cell(r, c);
        if (!cell) break;
        if (cell.spec?.type === 'letter') {
          rightBound = c;
        } else {
          break;
        }
      }

      for (let c = leftBound; c <= rightBound; c++) {
        const cell = this.cell(r, c);
        if (cell) cell.el.classList.add('active-row');
      }
    }

    this.el.classList.add('solving');
  }
  unhighlightTarget(coords) {
    coords.forEach(([r, c]) => {
      const cell = this.cell(r, c);
      if (cell) cell.el.classList.remove('active-target');
    });
    // Just strip .active-row from every cell that has it (avoids tracking)
    this.el.querySelectorAll('.active-row').forEach(el => el.classList.remove('active-row'));
    if (!this.el.querySelector('.active-target')) {
      this.el.classList.remove('solving');
    }
  }

  flashWrong(r, c, { autoClear = false } = {}) {
    const cell = this.cell(r, c);
    if (!cell) return;
    cell.el.classList.add('wrong');
    setTimeout(() => {
      cell.el.classList.remove('wrong');
      if (autoClear) this.clearLetter(r, c);
    }, 400);
  }

  glowRow(coords) {
    coords.forEach(([r, c]) => this.cell(r, c)?.el.classList.add('row-glow'));
    setTimeout(() => coords.forEach(([r, c]) => this.cell(r, c)?.el.classList.remove('row-glow')), 600);
  }

  // Show a "+7" corner badge floating over the last target cell.
  showCornerBadge(coords, text) {
    const last = coords[coords.length - 1];
    const cell = this.cell(last[0], last[1]);
    if (!cell) return;
    const badge = document.createElement('div');
    badge.className = 'corner-badge';
    badge.textContent = text;
    cell.el.appendChild(badge);
    setTimeout(() => badge.classList.add('show'), 20);
    return badge;
  }
}
