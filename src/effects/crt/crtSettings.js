// Tunable values of the CRT effect. They're starting points meant to be tuned by eye: change them
// here (or override them when creating a CrtEffect) and reload. What each one does on screen, and
// how to tune it, is in docs/crt-effect.md ("Tuning").
export const CRT_SETTINGS = Object.freeze({
  // Cap on the device pixel ratio for the scene texture and the canvas. Phones go up to 3×; above
  // 2× the extra sharpness isn't visible under the effect, but the GPU cost grows with the square.
  // Range: 1–3.
  MAX_RESOLUTION: 2,

  // Zoom blur: a copy of the scene blurred into streaks pointing away from a center, mixed over it

  // Turns the zoom blur off. Off, its pass doesn't run and its texture isn't created (no cost).
  BLUR_ENABLED: true,
  // Height of the blur texture in pixels, whatever the device; its width follows the screen's
  // aspect ratio. The blur is soft and faint, so a low resolution doesn't show. Range: 180–720.
  BLUR_TEXTURE_HEIGHT: 360,
  // Points averaged per blur pixel. More gives smoother streaks at a higher GPU cost. Written into
  // the shader's source (GLSL loops need a constant bound), so it can't change after creation.
  // Range: 8–64.
  BLUR_SAMPLES: 24,
  // Streak length, as a share of each point's distance to the center: 0.38 makes an object at
  // 100 px from the center streak out to about 160 px. Range: 0–0.9.
  BLUR_STRENGTH: 0.38,
  // Opacity of the blur over the scene: 0 is no blur, 1 is only the blur. Range: 0–1.
  BLUR_MIX: 0.15,
  // Random offset of the samples, different for each pixel, which turns the visible steps
  // between samples into fine noise. 0 shows the steps (useful to compare). Range: 0–1.
  BLUR_JITTER: 1
})
