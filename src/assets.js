// Asset existence cache.
// At boot, HEAD-fetch every expected file. Hits get cached as their URL;
// misses cache as null so renderers can fall back to inline placeholders.
// Pattern follows CLAUDE.md §4 (async loaders auto-fallback).

import { CONFIG } from './config.js';

const cache = Object.create(null);

export async function detectAsset(path) {
  if (path in cache) return cache[path];
  try {
    const r = await fetch(path, { method: 'HEAD', cache: 'no-store' });
    cache[path] = r.ok ? path : null;
  } catch (_) {
    cache[path] = null;
  }
  return cache[path];
}

export function detectMany(paths) {
  return Promise.all(paths.map(detectAsset));
}

export function iconUrl(name) {
  return cache[`${CONFIG.assets.iconsBase}${name}.png`] || null;
}

export function uiUrl(name) {
  return cache[`${CONFIG.assets.uiBase}${name}.png`] || null;
}

// Build the full list of paths the playable wants to probe.
export function expectedAssetPaths() {
  const { iconsBase, uiBase } = CONFIG.assets;
  const iconNames = new Set();
  for (const cell of CONFIG.puzzle.cells) {
    if (cell.type === 'clue-icon' && cell.icon) iconNames.add(cell.icon);
  }
  const uiNames = ['logo']; // single file, used for both CTA logo + app-icon thumbnail
  return [
    ...Array.from(iconNames).map(n => `${iconsBase}${n}.png`),
    ...uiNames.map(n => `${uiBase}${n}.png`),
  ];
}
