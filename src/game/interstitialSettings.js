// Tunable values of the end-of-level interstitials (the pictures named by youWinInterstitial /
// gameOverInterstitial). Explained in "End-of-level interstitials" in docs/graphical-specs.md.
// Change them here and reload.
export const INTERSTITIAL_SETTINGS = Object.freeze({
  // Seconds after the picture appears during which presses are ignored, so a stray tap at the end
  // of the level doesn't skip it. Only a press that starts after this counts.
  INPUT_LOCK_TIME: 1
})
