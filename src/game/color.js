
/**
 * Linear interpolation between two 0xRRGGBB colors, channel by channel (t: 0 → 1)
 * @param {number} from
 * @param {number} to
 * @param {number} t
 * @returns {number}
 */
export function lerpColor (from, to, t) {
  let color = 0
  for (const shift of [16, 8, 0]) {
    const a = (from >> shift) & 0xff
    const b = (to >> shift) & 0xff
    color |= Math.round(a + (b - a) * t) << shift
  }
  return color
}
