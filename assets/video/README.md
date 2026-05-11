# Intro video

Drop a file named `intro.mp4` in this folder to enable the intro video.

- Format: MP4 (H.264) is the most compatible for in-browser playback.
- The boot logic HEAD-checks `assets/video/intro.mp4`. If missing, the overlay
  is skipped and the game starts immediately.
- The video element is `muted` + `playsinline` so it can autoplay on mobile.
- A "Skip ›" button appears bottom-right; tapping the overlay also dismisses.
