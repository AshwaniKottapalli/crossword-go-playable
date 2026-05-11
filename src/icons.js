// Inline SVG clue icons — cartoon-style placeholders matching the real game's vibe.
// At boot, assets.js HEAD-checks for PNG counterparts in assets/icons/<name>.png.
// If a PNG exists, getIconHTML(name) returns an <img>; otherwise it returns the inline SVG.

import { iconUrl } from './assets.js';

const wrap = (inner) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

export function getIconHTML(name) {
  const url = iconUrl(name);
  if (url) return `<img src="${url}" alt="" class="icon-img" draggable="false">`;
  return ICONS[name] || ICONS.star;
}

export const ICONS = {

  // Balcony — window with plant boxes
  balcony: wrap(`
    <rect x="14" y="10" width="36" height="32" rx="2" fill="#7fb8e8" stroke="#2a3a5a" stroke-width="2"/>
    <line x1="32" y1="10" x2="32" y2="42" stroke="#2a3a5a" stroke-width="2"/>
    <line x1="14" y1="26" x2="50" y2="26" stroke="#2a3a5a" stroke-width="2"/>
    <rect x="10" y="40" width="44" height="16" fill="#fdf5e0" stroke="#2a3a5a" stroke-width="2" rx="1"/>
    <g stroke="#2a3a5a" stroke-width="1.5">
      <line x1="14" y1="40" x2="14" y2="56"/>
      <line x1="20" y1="40" x2="20" y2="56"/>
      <line x1="26" y1="40" x2="26" y2="56"/>
      <line x1="32" y1="40" x2="32" y2="56"/>
      <line x1="38" y1="40" x2="38" y2="56"/>
      <line x1="44" y1="40" x2="44" y2="56"/>
      <line x1="50" y1="40" x2="50" y2="56"/>
    </g>
    <path d="M16 42 Q14 36 18 34 Q22 36 20 42 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1.5"/>
    <path d="M44 42 Q42 36 46 34 Q50 36 48 42 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1.5"/>
  `),

  // Wave — stylized water
  wave: wrap(`
    <path d="M4 36 Q14 24 24 36 T44 36 T60 36" stroke="#3a8fd6" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M4 48 Q14 36 24 48 T44 48 T60 48" stroke="#6fc4f0" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="48" cy="18" r="7" fill="#ffd84a" stroke="#9a5a2a" stroke-width="2"/>
    <g stroke="#9a5a2a" stroke-width="1.5" stroke-linecap="round">
      <line x1="48" y1="6"  x2="48" y2="10"/>
      <line x1="58" y1="18" x2="62" y2="18"/>
      <line x1="56" y1="10" x2="58" y2="8"/>
    </g>
  `),

  // Owl — round cartoon
  owl: wrap(`
    <path d="M14 14 L20 24 M50 14 L44 24" stroke="#8a5a2a" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="32" cy="36" rx="20" ry="22" fill="#c89060" stroke="#3a2410" stroke-width="2.5"/>
    <ellipse cx="32" cy="48" rx="14" ry="10" fill="#f0d4a0" stroke="#3a2410" stroke-width="1.5"/>
    <circle cx="24" cy="32" r="7" fill="#fff" stroke="#3a2410" stroke-width="2"/>
    <circle cx="40" cy="32" r="7" fill="#fff" stroke="#3a2410" stroke-width="2"/>
    <circle cx="24" cy="33" r="3" fill="#3a2410"/>
    <circle cx="40" cy="33" r="3" fill="#3a2410"/>
    <circle cx="25" cy="32" r="0.8" fill="#fff"/>
    <circle cx="41" cy="32" r="0.8" fill="#fff"/>
    <path d="M30 38 L32 42 L34 38 Z" fill="#f5b740" stroke="#3a2410" stroke-width="1"/>
    <path d="M20 14 L24 22 M44 14 L40 22" stroke="#3a2410" stroke-width="1.5"/>
  `),

  // Sun — bright with rays
  sun: wrap(`
    <g stroke="#f5a020" stroke-width="3.5" stroke-linecap="round">
      <line x1="32" y1="4"  x2="32" y2="12"/>
      <line x1="32" y1="52" x2="32" y2="60"/>
      <line x1="4"  y1="32" x2="12" y2="32"/>
      <line x1="52" y1="32" x2="60" y2="32"/>
      <line x1="11" y1="11" x2="17" y2="17"/>
      <line x1="47" y1="47" x2="53" y2="53"/>
      <line x1="53" y1="11" x2="47" y2="17"/>
      <line x1="11" y1="53" x2="17" y2="47"/>
    </g>
    <circle cx="32" cy="32" r="14" fill="#ffd84a" stroke="#c8742a" stroke-width="2.5"/>
    <path d="M26 30 Q26 26 28 28 Q26 32 26 30 Z" fill="#3a2410"/>
    <path d="M38 30 Q38 26 36 28 Q38 32 38 30 Z" fill="#3a2410"/>
    <path d="M26 38 Q32 42 38 38" stroke="#3a2410" stroke-width="2" fill="none" stroke-linecap="round"/>
  `),

  // Olive — branch with two olives
  olive: wrap(`
    <ellipse cx="22" cy="40" rx="11" ry="14" fill="#6ba23a" stroke="#3a5a1a" stroke-width="2"/>
    <ellipse cx="42" cy="38" rx="11" ry="14" fill="#8bc04a" stroke="#3a5a1a" stroke-width="2"/>
    <ellipse cx="20" cy="36" rx="3" ry="5" fill="#a0d860" opacity="0.6"/>
    <ellipse cx="40" cy="34" rx="3" ry="5" fill="#b8e078" opacity="0.6"/>
    <path d="M28 18 Q32 8 44 12" stroke="#3a5a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 14 L42 8" stroke="#3a5a1a" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 18 L34 13" stroke="#3a5a1a" stroke-width="2.5" stroke-linecap="round"/>
  `),

  // Wand — magic with sparkles
  wand: wrap(`
    <line x1="12" y1="50" x2="40" y2="22" stroke="#5a3a1a" stroke-width="5.5" stroke-linecap="round"/>
    <polygon points="44,8 48,18 58,18 50,24 53,34 44,28 35,34 38,24 30,18 40,18"
             fill="#ffd84a" stroke="#9a5a2a" stroke-width="2" stroke-linejoin="round"/>
    <g stroke="#ffd84a" stroke-width="2.5" stroke-linecap="round">
      <line x1="54" y1="40" x2="58" y2="44"/>
      <line x1="20" y1="14" x2="22" y2="10"/>
      <line x1="10" y1="22" x2="6"  y2="20"/>
    </g>
  `),

  // Globe — Earth with continents
  globe: wrap(`
    <circle cx="32" cy="32" r="22" fill="#5fa8e8" stroke="#1a4a7a" stroke-width="2.5"/>
    <ellipse cx="32" cy="32" rx="22" ry="9" stroke="#1a4a7a" stroke-width="1.8" fill="none"/>
    <ellipse cx="32" cy="32" rx="9" ry="22" stroke="#1a4a7a" stroke-width="1.8" fill="none"/>
    <path d="M20 22 Q14 26 16 32 Q22 32 26 28 Q28 26 26 22 Q22 20 20 22 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1.2"/>
    <path d="M38 38 Q44 40 46 44 Q42 48 36 46 Q34 42 38 38 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1.2"/>
    <path d="M30 14 Q34 16 36 14 Q34 18 30 16 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1"/>
  `),

  // BBQ — grill with flame
  bbq: wrap(`
    <ellipse cx="32" cy="28" rx="20" ry="6" fill="#3a2a2a" stroke="#1a1010" stroke-width="2"/>
    <path d="M12 28 L20 50 L44 50 L52 28" fill="#5a3a3a" stroke="#1a1010" stroke-width="2" stroke-linejoin="round"/>
    <line x1="14" y1="56" x2="18" y2="50" stroke="#1a1010" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="50" y1="56" x2="46" y2="50" stroke="#1a1010" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M28 8 Q32 14 32 20 Q36 14 38 20 Q40 14 36 24 Q32 28 26 22 Q24 16 28 8 Z"
          fill="#ff7a3a" stroke="#c84a1a" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M30 14 Q32 20 30 24 Q34 22 33 16 Z" fill="#ffd84a"/>
    <g stroke="#1a1010" stroke-width="1.2">
      <line x1="16" y1="28" x2="48" y2="28"/>
      <line x1="18" y1="32" x2="46" y2="32"/>
    </g>
  `),

  // Fence — wooden picket
  fence: wrap(`
    <g fill="#d8a050" stroke="#5a3a1a" stroke-width="2" stroke-linejoin="round">
      <polygon points="10,52 10,28 14,22 18,28 18,52"/>
      <polygon points="22,52 22,32 26,26 30,32 30,52"/>
      <polygon points="34,52 34,28 38,22 42,28 42,52"/>
      <polygon points="46,52 46,32 50,26 54,32 54,52"/>
    </g>
    <line x1="6"  y1="38" x2="58" y2="38" stroke="#5a3a1a" stroke-width="3"/>
    <line x1="6"  y1="46" x2="58" y2="46" stroke="#5a3a1a" stroke-width="3"/>
  `),

  // Donut/cookie with sprinkles
  donut: wrap(`
    <circle cx="32" cy="32" r="22" fill="#a06a3a" stroke="#3a1e0a" stroke-width="2.5"/>
    <circle cx="32" cy="32" r="8"  fill="#fdf5e0" stroke="#3a1e0a" stroke-width="2"/>
    <g fill="#fff7d6">
      <circle cx="22" cy="22" r="2"/>
      <circle cx="42" cy="22" r="2"/>
      <circle cx="44" cy="42" r="2"/>
      <circle cx="20" cy="44" r="2"/>
      <circle cx="32" cy="14" r="2"/>
      <circle cx="50" cy="32" r="2"/>
      <circle cx="14" cy="34" r="2"/>
    </g>
  `),

  // Salad bowl with greens
  salad: wrap(`
    <path d="M8 32 Q8 50 32 52 Q56 50 56 32 Z" fill="#fdf5e0" stroke="#3a1e0a" stroke-width="2"/>
    <ellipse cx="32" cy="32" rx="24" ry="6" fill="#fff8ea" stroke="#3a1e0a" stroke-width="2"/>
    <path d="M14 30 Q18 22 24 26 Q22 32 14 30 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1.5"/>
    <path d="M26 30 Q30 18 38 24 Q36 32 26 30 Z" fill="#8bc04a" stroke="#2a6a3a" stroke-width="1.5"/>
    <path d="M40 28 Q46 22 50 28 Q46 34 40 28 Z" fill="#6ed98a" stroke="#2a6a3a" stroke-width="1.5"/>
    <circle cx="22" cy="32" r="2" fill="#ff7a5a" stroke="#a04a30" stroke-width="1"/>
    <circle cx="42" cy="34" r="2" fill="#ff7a5a" stroke="#a04a30" stroke-width="1"/>
  `),

  // Birthday cake with candles
  cake: wrap(`
    <rect x="8"  y="36" width="48" height="18" rx="2" fill="#ff9bbd" stroke="#a03a5a" stroke-width="2"/>
    <rect x="10" y="38" width="44" height="4"  fill="#fff7d6"/>
    <rect x="14" y="26" width="36" height="12" rx="2" fill="#ffd0a0" stroke="#a03a5a" stroke-width="2"/>
    <path d="M14 32 Q20 28 26 32 Q32 28 38 32 Q44 28 50 32" stroke="#a03a5a" stroke-width="1.5" fill="none"/>
    <g stroke="#5a3a1a" stroke-width="2">
      <line x1="22" y1="24" x2="22" y2="14"/>
      <line x1="32" y1="24" x2="32" y2="10"/>
      <line x1="42" y1="24" x2="42" y2="14"/>
    </g>
    <g fill="#ffd84a">
      <path d="M22 14 Q19 10 22 6 Q25 10 22 14 Z" stroke="#c84a1a" stroke-width="1"/>
      <path d="M32 10 Q29 6  32 2 Q35 6 32 10 Z" stroke="#c84a1a" stroke-width="1"/>
      <path d="M42 14 Q39 10 42 6 Q45 10 42 14 Z" stroke="#c84a1a" stroke-width="1"/>
    </g>
  `),

  // Pink gem
  gem: wrap(`
    <polygon points="32,8 50,22 40,52 24,52 14,22"
             fill="#ff7a9d" stroke="#a04060" stroke-width="2.5" stroke-linejoin="round"/>
    <polygon points="32,8 50,22 32,26 14,22"
             fill="#ffaecc" stroke="#a04060" stroke-width="1.5" stroke-linejoin="round"/>
    <line x1="32" y1="26" x2="40" y2="52" stroke="#a04060" stroke-width="1.5"/>
    <line x1="32" y1="26" x2="24" y2="52" stroke="#a04060" stroke-width="1.5"/>
    <g stroke="#ff7a9d" stroke-width="2" stroke-linecap="round">
      <line x1="6"  y1="14" x2="10" y2="18"/>
      <line x1="58" y1="14" x2="54" y2="18"/>
      <line x1="6"  y1="56" x2="10" y2="52"/>
    </g>
  `),

  // Camera
  camera: wrap(`
    <rect x="6" y="20" width="52" height="32" rx="4" fill="#ff7a9d" stroke="#3a1e2a" stroke-width="2.5"/>
    <rect x="20" y="14" width="14" height="8" rx="2" fill="#ff5a7d" stroke="#3a1e2a" stroke-width="2"/>
    <circle cx="32" cy="36" r="10" fill="#3a1e2a" stroke="#fff" stroke-width="2"/>
    <circle cx="32" cy="36" r="6" fill="#5fa8e8" stroke="#fff" stroke-width="1.5"/>
    <circle cx="29" cy="33" r="2" fill="#fff" opacity="0.9"/>
    <circle cx="46" cy="26" r="2" fill="#fff"/>
  `),

  // Star — fallback
  star: wrap(`
    <path d="M32 8 L38 24 L56 26 L42 38 L46 56 L32 46 L18 56 L22 38 L8 26 L26 24 Z"
          fill="#ffd84a" stroke="#9a5a2a" stroke-width="2.5" stroke-linejoin="round"/>
  `),
};
