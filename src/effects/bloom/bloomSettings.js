// Tunable values of the bloom: a wide, soft copy of the image added on top of it, so bright
// shapes look a bit bigger, shinier and less sharp. Starting points meant to be tuned by eye:
// change them here (or override them when creating a BloomEffect) and reload. Explained in
// docs/post-processing.md ("Tuning").
export const BLOOM_SETTINGS = Object.freeze({
  // Height of the blur textures in pixels, whatever the device; their width follows the screen's
  // aspect ratio. The glow is soft, so a low resolution doesn't show. Range: 180–540.
  TEXTURE_HEIGHT: 540,
  // How far the glow spreads, as a multiple of one blur-texture pixel between taps (e.g. 1 is
  // about 8 px of spread on a 1080p screen). Above ~2 the taps show as separate copies. Range: 0.5–2.
  RADIUS: 0.75,
  // How much glow is added to the image: 0 is none. A thin line spreads its light over a wide
  // area, so the glow is faint unless this is well above 1. Range: 0–4.
  INTENSITY: 1.5
})
