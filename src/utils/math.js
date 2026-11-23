// Number helpers shared by every layer (game, menu scene, effects, audio, React). No PixiJS, no React.

// `value` limited to the range from `min` to `max`. The default range, 0 to 1, is the one of
// animation progress: clamp(elapsed / duration)
export function clamp (value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}
