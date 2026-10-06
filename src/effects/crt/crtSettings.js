// Tunable values of the CRT effect: curved glass, chromatic aberration, scanlines, phosphor mask,
// vignette. Starting points meant to be tuned by eye: change them here (or override them when
// creating a CrtEffect) and reload. Explained in docs/post-processing.md ("Tuning").
export const CRT_SETTINGS = Object.freeze({
  // Curved glass

  // How far the glass bulges: the image at the corners is pushed this share farther out (0.08 =
  // 8%), less toward the middle of the edges, nothing at the center. What's pushed past the edges
  // falls outside the glass (black). 0 is a flat screen. Range: 0–0.3.
  CURVATURE: 0.08,
  // Rounding of the glass's corners, as a share of the screen height. Range: 0–0.15.
  CORNER_RADIUS: 0.03,
  // Width of the glass edge's fade to black, as a share of the screen height. Range: 0.001–0.02.
  EDGE_SOFTNESS: 0.004,

  // Chromatic aberration: red is read this share farther from the center at the corners, blue
  // this share closer (0.002 = 0.2%, about 2 px at the corners of a 1080p screen), less toward the
  // center, none at the center. Range: 0–0.01.
  ABERRATION: 0.002,

  // Scanlines: horizontal lines across the screen, whatever its size or pixel density (270 is
  // about a 240p arcade screen). They fade out by themselves when a line would be under about
  // 2 device pixels (a small window), where they'd shimmer. Range: 120–540.
  SCANLINE_COUNT: 270,
  // How dark the gap between two lines gets: 0 no scanlines, 1 black gaps. Range: 0–0.6.
  SCANLINE_INTENSITY: 0.3,

  // Phosphor mask: vertical red, green and blue stripes, like an aperture grille. Width of one
  // red-green-blue group in device pixels; a whole number, so the stripes line up with the
  // pixels (no moiré). Range: 3–6.
  MASK_PITCH: 3,
  // How strong the stripes are: 0 none, 1 pure red, green and blue. Range: 0–0.4.
  MASK_INTENSITY: 0.12,

  // Darkening toward the edges: the corners lose this share of their brightness. Range: 0–0.6.
  VIGNETTE: 0.3,
  // Gain that makes up for what scanlines, mask and vignette darken. Range: 1–1.6.
  BRIGHTNESS: 1.2
})
