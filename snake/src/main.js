// Boot.

import { getActiveConfig, CONFIG } from './config.js';
import { detectMany, expectedAssetPaths } from './assets.js';
import { Game } from './game.js';

Object.assign(CONFIG, getActiveConfig());

(async () => {
  // HEAD-check every expected asset before constructing the game so that
  // icons.js / ui.js can synchronously choose PNG vs. inline SVG/CSS.
  await detectMany(expectedAssetPaths());

  const game = new Game();
  // Tiny delay so layout settles before the bot starts moving.
  requestAnimationFrame(() => requestAnimationFrame(() => game.start()));

  // Replay (dev convenience): press R to reload.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'r') location.reload();
  });
})();
