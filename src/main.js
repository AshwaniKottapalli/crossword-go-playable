// Boot.

import { getActiveConfig, CONFIG } from './config.js';
import { detectMany, expectedAssetPaths } from './assets.js';
import { Audio } from './audio.js';
import { Game } from './game.js';

Object.assign(CONFIG, getActiveConfig());

// Initialize audio + register unlock listeners SYNCHRONOUSLY at module load.
// On iOS Safari, the AudioContext can only be unlocked by a touch event that
// hits a listener already attached at the time of the touch. If we waited for
// Game construction (after await detectMany + hideLoader), early taps on the
// loading screen / intro overlay would be lost and the user could end up with
// silent audio for the rest of the session.
const audio = new Audio();
audio.init();

const LOADER_MIN_MS = 200;
const _loaderStart = performance.now();

(async () => {
  // HEAD-check expected assets, then drop the loader. Scene sprites kicked off
  // by <img> tags in HTML continue loading in the background while Game boots.
  await detectMany(expectedAssetPaths());
  await hideLoader();

  const game = new Game({ audio });
  requestAnimationFrame(() => requestAnimationFrame(() => game.start()));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'r') location.reload();
  });
})();

async function hideLoader() {
  const loader = document.getElementById('loading-screen');
  if (!loader) return;
  const elapsed = performance.now() - _loaderStart;
  if (elapsed < LOADER_MIN_MS) {
    await new Promise(r => setTimeout(r, LOADER_MIN_MS - elapsed));
  }
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 360);
}
