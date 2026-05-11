// Boot.

import { getActiveConfig, CONFIG } from './config.js';
import { detectMany, expectedAssetPaths } from './assets.js';
import { Game } from './game.js';

Object.assign(CONFIG, getActiveConfig());

const INTRO_VIDEO_PATH = 'assets/video/intro.mp4';

(async () => {
  // HEAD-check every expected asset before constructing the game so that
  // icons.js / ui.js can synchronously choose PNG vs. inline SVG/CSS.
  await detectMany(expectedAssetPaths());

  // Play the intro video first if one was dropped at assets/video/intro.mp4.
  // If missing or autoplay blocked and untapped, falls back cleanly to the game.
  await playIntroVideo();

  const game = new Game();
  // Tiny delay so layout settles before the bot starts moving.
  requestAnimationFrame(() => requestAnimationFrame(() => game.start()));

  // Replay (dev convenience): press R to reload.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'r') location.reload();
  });
})();

async function playIntroVideo() {
  const overlay = document.getElementById('intro-video');
  const videoEl = document.getElementById('intro-video-el');
  const skipBtn = document.getElementById('intro-skip');
  if (!overlay || !videoEl) return;

  // Only show the overlay if the file actually exists.
  try {
    const res = await fetch(INTRO_VIDEO_PATH, { method: 'HEAD' });
    if (!res.ok) { overlay.remove(); return; }
  } catch (_) {
    overlay.remove();
    return;
  }

  overlay.classList.remove('hidden');

  return new Promise((resolve) => {
    const finish = () => {
      videoEl.pause();
      overlay.classList.add('hidden');
      resolve();
    };
    videoEl.addEventListener('ended', finish, { once: true });
    skipBtn?.addEventListener('click', finish, { once: true });

    videoEl.play().catch(() => {
      // Autoplay blocked: wait for any tap on the overlay to start it.
      const tap = () => {
        overlay.removeEventListener('click', tap);
        videoEl.play().catch(finish);
      };
      overlay.addEventListener('click', tap);
    });
  });
}
