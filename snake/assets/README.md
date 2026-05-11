# Assets

Drop files here exactly as named below. The playable auto-detects what's present at boot via a HEAD-check; missing files fall back to the inline-SVG / CSS placeholders.

```
assets/
├── icons/                  Clue icons for the top row of the grid
│   ├── balcony.png         (512×512 PNG, transparent)
│   ├── wave.png
│   ├── owl.png
│   ├── sun.png
│   ├── olive.png
│   ├── wand.png
│   └── globe.png
└── ui/
    └── logo.png            Used for BOTH the CTA logo and the in-card app icon (512×512 PNG, transparent)
```

After dropping a file in, just reload the page — no code edits needed.

If you want to swap which icon goes in which clue slot, edit `src/config.js` → `puzzle.cells` → `icon` field.
