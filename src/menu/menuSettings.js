// Tunable values of the menu screens' PixiJS scene (MenuScene.js): the menu background animation.
export const MENU_SETTINGS = Object.freeze({
  // Cap on the device pixel ratio for the menu canvas and the off-screen canvas Lottie draws the
  // animation into. That canvas is uploaded to the GPU every time the animation draws a frame, so
  // its cost grows with the square of this value; lower it if phones struggle on the menus (the
  // animation's lines get softer). Range: 1–3.
  MAX_RESOLUTION: 2
})
