// Boot.

import { getActiveConfig, CONFIG } from './config.js';
import { detectMany, expectedAssetPaths } from './assets.js';
import { Game } from './game.js';

Object.assign(CONFIG, getActiveConfig());

const LOADER_MIN_MS = 200;
const _loaderStart = performance.now();

(async () => {
  // HEAD-check expected assets, then drop the loader. Scene sprites kicked off
  // by <img> tags in HTML continue loading in the background while Game boots.
  await detectMany(expectedAssetPaths());
  await hideLoader();

  const game = new Game();
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
