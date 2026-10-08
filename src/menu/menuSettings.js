// Tunable values of the menu screens' PixiJS scene (MenuScene.js): the menu background animation
// and the Main Menu logo.
export const MENU_SETTINGS = Object.freeze({
  // Cap on the device pixel ratio for the menu canvas and the off-screen canvas Lottie draws the
  // animation into. That canvas is uploaded to the GPU every time the animation draws a frame, so
  // its cost grows with the square of this value; lower it if phones struggle on the menus (the
  // animation's lines get softer). Range: 1–3.
  MAX_RESOLUTION: 2
})

// The CRT effect's values that differ on the menus (OLD TV on); the others are the arena's, from
// src/effects/crt/crtSettings.js, so the menus and the arena look like the same TV. The arena's are
// tuned for a black picture; the menus' is light grey (#D8D8D8) with light-grey and white lines,
// which the arena's brightness gain would push to white.
export const MENU_CRT_OVERRIDES = Object.freeze({
  // Gain that makes up for what scanlines, mask and vignette darken. Kept low enough that the
  // brightest parts of the background (the middle of a scanline, on its phosphor stripe) don't
  // reach white, so the lines stay distinct from it. Range: 1–1.6.
  BRIGHTNESS: 1.15,
  // Darkening toward the edges: the corners lose this share of their brightness. A light picture
  // shows it much more than a black one. Range: 0–0.6.
  VIGNETTE: 0.15
})
