// Color helpers shared by the effects. Plain functions, no PixiJS.

// 0xRRGGBB as red, green and blue from 0 to 1, for a vec3 uniform
export function rgb (color) {
  return new Float32Array([(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff].map((channel) => channel / 255))
}

// The hue of 0xRRGGBB at full brightness: its brightest channel scaled to 1 (e.g. 0x006666 and
// 0x00FFFF both give 0, 1, 1). Black gives black.
export function fullBrightness (color) {
  const channels = rgb(color)
  const brightest = Math.max(...channels)
  return brightest > 0 ? channels.map((channel) => channel / brightest) : channels
}
