// Tunable values of the end-of-level interstitials (the pictures named by youWinInterstitial /
// gameOverInterstitial). Explained in "End-of-level interstitials" in docs/graphical-specs.md.
// Change them here and reload.
export const INTERSTITIAL_SETTINGS = Object.freeze({
  // Seconds after the picture appears during which presses are ignored, so a stray tap at the end
  // of the level doesn't skip it. Only a press that starts after this counts.
  INPUT_LOCK_TIME: 1
})

// The CRT values that differ on the interstitials, over the arena's (crtSettings.js). The arena's
// are tuned for a black picture with thin lines; a picture with light areas clips to white under
// the brightness gain. Placeholder values (the menus' own): to be tuned by eye.
export const INTERSTITIAL_CRT_OVERRIDES = Object.freeze({
  // Gain that makes up for what scanlines, mask and vignette darken. Range: 1–1.6.
  BRIGHTNESS: 0.25,
  // Darkening toward the edges: the corners lose this share of their brightness. Range: 0–0.6.
  VIGNETTE: 0.8
})
