// Tunable values of the zoom blur: a copy of the image blurred into streaks pointing away from a
// center, mixed over it. Starting points meant to be tuned by eye: change them here (or override
// them when creating a ZoomBlurEffect) and reload. Explained in docs/post-processing.md ("Tuning").
export const ZOOM_BLUR_SETTINGS = Object.freeze({
  // Height of the blur texture in pixels, whatever the device; its width follows the screen's
  // aspect ratio. The blur is soft and faint, so a low resolution doesn't show. Range: 180–720.
  TEXTURE_HEIGHT: 360,
  // Points averaged per blur pixel. More gives smoother streaks at a higher GPU cost. Written into
  // the shader's source (GLSL loops need a constant bound), so it can't change after creation.
  // Range: 8–64.
  SAMPLES: 8,
  // Streak length, as a share of each point's distance to the center: for example, 0.35 makes an
  // object at 100 px from the center streak out to about 155 px. Range: 0–0.9.
  STRENGTH: 0.35,
  // Opacity of the blur over the image: 0 is no blur, 1 is only the blur. Range: 0–1.
  MIX: 0.05,
  // Random offset of the samples, different for each pixel, which turns the visible steps
  // between samples into fine noise. 0 shows the steps (useful to compare). Range: 0–1.
  JITTER: 1
})
