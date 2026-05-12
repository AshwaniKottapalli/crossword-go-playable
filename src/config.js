// Single source of truth for the playable.

export const CONFIG = {
  // ---------- Grid layout ----------
  grid: {
    cols: 8,
    rows: 8,
  },

  // ---------- Puzzle ----------
  puzzle: {
    cells: [
      // ── Row 0: top clue row (dir-down) ─────────────────────────────────────
      { r: 0, c: 1, type: 'clue-text', text: ['HONORED', 'WITH'],  dir: 'down' },
      { r: 0, c: 2, type: 'clue-text', text: ['AWAK-', 'ENED'],     dir: 'down' },
      { r: 0, c: 3, type: 'clue-icon', icon: 'fence',  hintText: 'F_CE', dir: 'down' },
      { r: 0, c: 4, type: 'clue-text', text: 'SAVE',                dir: 'down' },
      { r: 0, c: 5, type: 'clue-icon', icon: 'donut',                   dir: 'down' },
      { r: 0, c: 6, type: 'clue-icon', icon: 'salad',  hintText: '_L', dir: 'down' },
      { r: 0, c: 7, type: 'clue-text', text: ['FROZEN', 'QUEEN'],   dir: 'down' },

      // ── Row 1: TARGET (AWESOME) ────────────────────────────────────────────
      { r: 1, c: 0, type: 'clue-text', text: 'EPIC', dir: 'right' },
      { r: 1, c: 1, type: 'letter', target: 'awesome' },
      { r: 1, c: 2, type: 'letter', target: 'awesome' },
      { r: 1, c: 3, type: 'letter', target: 'awesome' },
      { r: 1, c: 4, type: 'letter', target: 'awesome' },
      { r: 1, c: 5, type: 'letter', target: 'awesome' },
      { r: 1, c: 6, type: 'letter', target: 'awesome' },
      { r: 1, c: 7, type: 'letter', target: 'awesome' },

      // ── Row 3 (A1): WAS VICT-OUS + letters + _ATIVE/MEDITATE clue at E3 ─────
      { r: 2, c: 0, type: 'clue-text', text: ['WAS', 'VICT-', 'OUS'], dir: 'right' },
      { r: 2, c: 1, type: 'letter' },
      { r: 2, c: 2, type: 'letter', hint: 'O' },           // C3 hint (for AWAKENED → WOKE)
      { r: 2, c: 3, type: 'letter' },
      { r: 2, c: 4, type: 'clue-text', clues: [
        { text: '_ATIVE',   dir: 'right' },
        { text: 'MEDITATE', dir: 'down'  },
      ]},
      { r: 2, c: 5, type: 'letter' },
      { r: 2, c: 6, type: 'letter' },
      { r: 2, c: 7, type: 'letter' },

      // ── Row 4 (A1): cake + letters + hint K at C4 + POD VEGGIES at D4 ──────
      { r: 3, c: 0, type: 'clue-icon', icon: 'cake', hintText: 'C_E', dir: 'right' },
      { r: 3, c: 1, type: 'letter' },
      { r: 3, c: 2, type: 'letter', hint: 'K' },           // C4 hint (was I)
      { r: 3, c: 3, type: 'clue-text', clues: [
        { text: ['POD', 'VEGGIES'],  dir: 'right' },
        { text: ['EXPERI-', 'MENT'], dir: 'down'  },
      ]},
      { r: 3, c: 4, type: 'letter' },
      { r: 3, c: 5, type: 'letter' },
      { r: 3, c: 6, type: 'letter' },
      { r: 3, c: 7, type: 'letter' },

      // ── Row 5 (A1): OLD-SCHOOL + hint R at B5 + empty + hint R at E5 ───────
      { r: 4, c: 0, type: 'clue-text', text: ['OLD-', 'SCHOOL'], dir: 'right' },
      { r: 4, c: 1, type: 'letter', hint: 'R' },           // B5 hint
      { r: 4, c: 2, type: 'letter' },                       // C5 empty (was hint E)
      { r: 4, c: 3, type: 'letter' },
      { r: 4, c: 4, type: 'letter', hint: 'R' },           // E5 hint
      { r: 4, c: 5, type: 'letter' },
      { r: 4, c: 6, type: 'clue-text', clues: [
        { text: 'APRICOT',          dir: 'right' },
        { text: ['BREWED', 'DRINK'], dir: 'down'  },
      ]},
      { r: 4, c: 7, type: 'letter' },

      // ── Row 6 (A1): DELTA + E ON A COMPASS clue at C6 + hint E at D6 + gem H6
      { r: 5, c: 0, type: 'clue-text', text: 'DELTA', dir: 'right' },
      { r: 5, c: 1, type: 'letter' },
      { r: 5, c: 2, type: 'clue-text', clues: [
        { text: ['E ON A', 'COMPASS'], dir: 'right' },
        { text: 'BR_N',                dir: 'down'  },
      ]},
      { r: 5, c: 3, type: 'letter', hint: 'E' },           // D6 hint (was O)
      { r: 5, c: 4, type: 'letter' },
      { r: 5, c: 5, type: 'letter' },
      { r: 5, c: 6, type: 'letter' },
      { r: 5, c: 7, type: 'clue-icon', icon: 'gem', hintText: 'G_', dir: 'down' },

      // ── Row 7 (A1): EFFORT-LESS + hint A at C7 + GR_N/CASE clue at F7 + hint E at H7
      { r: 6, c: 0, type: 'clue-text', text: ['EFFORT-', 'LESS'], dir: 'right' },
      { r: 6, c: 1, type: 'letter' },
      { r: 6, c: 2, type: 'letter', hint: 'A' },           // C7 hint
      { r: 6, c: 3, type: 'letter' },
      { r: 6, c: 4, type: 'letter' },
      { r: 6, c: 5, type: 'clue-text', clues: [
        { text: 'GR_N', dir: 'right' },
        { text: 'CASE', dir: 'down'  },
      ]},
      { r: 6, c: 6, type: 'letter' },
      { r: 6, c: 7, type: 'letter', hint: 'E' },           // H7 hint (was A)

      // ── Row 8 (A1): _TO SAME + hint D at B8 + camera at E8 + CAM target F8-H8
      { r: 7, c: 0, type: 'clue-text', text: ['_TO', '(SAME)'], dir: 'right' },
      { r: 7, c: 1, type: 'letter', hint: 'D' },           // B8 hint
      { r: 7, c: 2, type: 'letter' },
      { r: 7, c: 3, type: 'letter' },
      { r: 7, c: 4, type: 'clue-icon', icon: 'camera', hintText: '_ERA', dir: 'right' },
      { r: 7, c: 5, type: 'letter', target: 'cam' },
      { r: 7, c: 6, type: 'letter', target: 'cam' },
      { r: 7, c: 7, type: 'letter', target: 'cam' },
    ],

    targets: [
      {
        // CAM — answer for the camera clue at (7,4). Cells sit immediately
        // to the right of the icon (arrow points right). Combined with the
        // icon's "_ERA" hint, reads as the visual word CAMERA.
        // Bank scrambled: target letters (C, A, M) spaced by decoys (T, K, P, R).
        id: 'easy',
        chars: 'CAM',
        cells: [[7,5],[7,6],[7,7]],
        bank: ['T', 'C', 'K', 'A', 'P', 'M', 'R'],
      },
      {
        // AWESOME = A _ E _ O _ E   clue: "EPIC" — user finds W, S, M
        // Bank scrambled: target letters (W, S, M) spaced by decoys (B, I, L, D).
        id: 'awesome',
        chars: 'AWESOME',
        cells: [[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7]],
        prefill: { 0: 'A', 2: 'E', 4: 'O', 6: 'E' },
        bank: ['B', 'W', 'I', 'S', 'L', 'M', 'D'],
      },
    ],

    // After AWESOME is solved, sweep through every remaining empty letter cell,
    // filling row-by-row. Skips cells that are already prefilled hints (I, E, O, A, D)
    // or filled by the user (CAM at row 7).
    cascadeFills: [
      // ── Cascade fills derived from the user's answer key ────────────────
      // Row 3 (A1): WON (B3-D3), REL (F3-H3 → end of _ATIVE).
      // Column intersections: AWARDED@B3=W, FENCE→EN gives D3=N, ELSA@H3=L.
      { r: 2, c: 1, char: 'W' },   // B3
      { r: 2, c: 3, char: 'N' },   // D3
      { r: 2, c: 5, char: 'R' },   // F3 (OREOS letter 2 + REL letter 1)
      { r: 2, c: 6, char: 'E' },   // G3 (MEA letter 2 + REL letter 2)
      { r: 2, c: 7, char: 'L' },   // H3 (ELSA letter 2 + REL letter 3)
      // Row 4 (A1): AK (B4-C4), PEAS (E4-H4 ← POD VEGGIES across).
      // Column intersections: AWARDED@B4=A, OREOS@F4=E, MEA@G4=A, ELSA@H4=S.
      { r: 3, c: 1, char: 'A' },   // B4
      { r: 3, c: 4, char: 'P' },   // E4 (PEAS letter 1 + PRAY letter 1)
      { r: 3, c: 5, char: 'E' },   // F4
      { r: 3, c: 6, char: 'A' },   // G4
      { r: 3, c: 7, char: 'S' },   // H4
      // Row 5 (A1): RETRO (B5-F5), APRICOT→A (H5).
      // Hints already cover B5=R, E5=R. TEST@D5=T, OREOS@F5=O, ELSA@H5=A.
      { r: 4, c: 2, char: 'E' },   // C5 (RETRO letter 2, WOKE letter 4)
      { r: 4, c: 3, char: 'T' },   // D5
      { r: 4, c: 5, char: 'O' },   // F5
      { r: 4, c: 7, char: 'A' },   // H5
      // Row 6 (A1): DELTA→D (B6), EAST (D6-G6).
      { r: 5, c: 1, char: 'D' },   // B6 (AWARDED letter 5 + DELTA→D)
      { r: 5, c: 4, char: 'A' },   // E6 (EAST letter 2 + PRAY letter 3)
      { r: 5, c: 5, char: 'S' },   // F6 (OREOS letter 5 + EAST letter 3)
      { r: 5, c: 6, char: 'T' },   // G6 (TEA letter 1 + EAST letter 4)
      // Row 7 (A1): EASY (B7-E7), EE (G7-H7).
      { r: 6, c: 1, char: 'E' },   // B7 (AWARDED letter 6 + EASY letter 1)
      { r: 6, c: 3, char: 'S' },   // D7 (TEST letter 3 + EASY letter 3)
      { r: 6, c: 4, char: 'Y' },   // E7 (PRAY letter 4 + EASY letter 4)
      { r: 6, c: 6, char: 'E' },   // G7 (TEA letter 2 + GR_N→EE letter 1)
      // Row 8 (A1): DIT (B8-D8); CAM (F8-H8) user-filled.
      { r: 7, c: 2, char: 'I' },   // C8 (AI letter 2 + DIT letter 2)
      { r: 7, c: 3, char: 'T' },   // D8 (TEST letter 4 + DIT letter 3)
    ],
  },

  decoyLetter: 'R',

  timing: {
    fakeFail: {
      botEnterMs: 400,
      botGrabMs: 1100,
      botDropMs: 2000,
      botResetMs: 2400,
      tutorialAppearMs: 2700,
    },
    demoDropsLimit: 1,
    idleHintMs: 10000,        // re-show demo finger after this long without activity
    interPhaseDelay: 700,
    bankRefreshMs: 400,
    cascadeStartDelay: 600,
    cascadeFillStaggerMs: 110,
    cascadeChimeEvery: 4,
    winBannerHoldMs: 1800,
    winBonusDelayMs: 1700,
    ctaShowMs: 22000,
  },

  score: {
    easyReward: 5,
    targetReward: 7,
    cascadeCellReward: 1,
    finalBonus: 50,
    opponentStart: 86,
  },

  copy: {
    bannerEasy: 'NICE!',
    bannerCascade: 'GENIUS!',
    bannerWin: 'LEVEL COMPLETE!',
    bannerBonus: '+50 BONUS',
    cta: {
      headline: 'Crossword Go',
      cta: 'DOWNLOAD FREE',
      sub: 'Play 1000+ puzzles',
      rating: '4.8',
      social: '10M+ players',
    },
  },

  audio: {
    masterGain: 0.5,
    cascadeNotes: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  },

  assets: {
    iconsBase: 'assets/icons/',
    uiBase: 'assets/ui/',
  },

  stores: {
    ios:     'https://apps.apple.com/us/app/crossword-go/id6739069151',
    android: 'https://play.google.com/store/apps/details?id=in.playsimple.crossword.go&hl=en_IN',
  },
  // Legacy fallback (and what ad-network adapters override at packaging time).
  ctaUrl: 'https://play.google.com/store/apps/details?id=in.playsimple.crossword.go&hl=en_IN',

  // ---------- "Save the hero" cinematic scene ----------
  // Three acts: INTRO (full-bleed 2.5s, snake lunging) → STRIP (persistent ~22% top during
  // puzzle, snake retreats per kill) → OUTRO (full-bleed 2s, hero saved → CTA).
  // 30 total kills = CAM(3) + AWESOME(3) + cascade(24). Each kill retreats the snake,
  // briefly swaps head to recoil sprite, fires a green splat + red vignette flash.
  saveScene: {
    assetsBase: 'assets/scene/',
    totalKills: 30,
    // snakePos: head's horizontal position in % of strip width.
    //   startSnakePos → only head peeks in from right edge
    //   minSnakePos   → head close to hero (clamped, can't bite)
    //   each correct letter retreats it by retreatPctPerKill
    startSnakePos: 75,          // head fully visible near right edge, body off-screen
    minSnakePos: 26,            // closest the head can creep to hero
    idleCreepPctPerSec: 6,      // brisk advance — creates time pressure
    retreatPctPerKill: 16,      // bigger knockback per kill so tension oscillates
    gracePeriodMs: 10000,       // delay before snake starts creeping (and clue appears)
    laserMs: 240,
    splatMs: 480,
    introMs: 2500,
    outroEnterMs: 700,
    outroHoldMs: 1800,
    moodBrave: 0.40,
    moodSafe:  0.97,
    vignetteMaxOpacity: 0.7,
  },

  themes: {
    default: {},
    nobot: { skipFakeFail: true },
  },
};

export function getActiveConfig() {
  const params = new URLSearchParams(location.search);
  const themeName = params.get('theme') || 'default';
  const theme = CONFIG.themes[themeName] || {};
  const cfg = JSON.parse(JSON.stringify(CONFIG));
  if (theme.skipFakeFail) cfg.skipFakeFail = true;
  if (theme.overrides) deepMerge(cfg, theme.overrides);
  cfg.themeName = themeName;
  return cfg;
}

function deepMerge(dst, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
      dst[k] = dst[k] || {};
      deepMerge(dst[k], src[k]);
    } else {
      dst[k] = src[k];
    }
  }
}
