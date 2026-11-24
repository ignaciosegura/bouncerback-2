// Tunable values of the phosphor persistence: bright things that move leave a trail that fades
// out, like a CRT phosphor's afterglow, while still shapes look unchanged. Starting points meant to
// be tuned by eye: change them here (or override them when creating a PhosphorEffect) and reload.
// Explained in docs/post-processing.md ("Phosphor persistence" and "Tuning").
export const PHOSPHOR_SETTINGS = Object.freeze({
  // Seconds for a trail to lose half its brightness, whatever the frame rate. Longer makes longer
  // trails: for example, 0.05 leaves a trail visible for about 0.2 s behind a moving atom.
  // Range: 0.01–0.3.
  HALF_LIFE: 0.04,
  // How bright the trails are over the image: 0 is no trails (the pass still runs: switch the
  // effect off in GameEngine.js to save it), 1 is the full brightness of what left them.
  // Range: 0–1.
  MIX: 0.6,
  // Brightness taken off the trails at every frame, in 8-bit steps (1 = 1/255). Without it the
  // faintest values round back up and never fade to black, which leaves permanent ghosts; it also
  // cuts the trails' faint ends a little shorter. Range: 1–4.
  CUTOFF: 1,
  // Height of the trails' textures in pixels, whatever the device; their width follows the
  // screen's aspect ratio. Lower is cheaper (two textures of this size) but makes the trails
  // softer, a little dimmer on thin lines, and puts a faint soft halo around still shapes. Below
  // about 360 the thin lines flicker as they move. Range: 360–1080.
  TEXTURE_HEIGHT: 540,

  // Color drift: as a trail fades, its color drifts toward DRIFT_COLOR (gameplay's white lines
  // drift to cyan, as the menus' black text drifts to red in the screen transitions). Only its hue
  // counts: it's scaled to the trail's own brightness, so the trail still fades the same way.
  // 0xRRGGBB.
  DRIFT_COLOR: 0x00ffff,
  // How far toward DRIFT_COLOR a trail gets: the drift grows as the trail fades, reaching this
  // share when it's gone (e.g. 0.5 ends halfway between its own color and cyan). 0 is no drift.
  // Range: 0–1.
  DRIFT: 1
})
