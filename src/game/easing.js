// Easing curves: each maps progress 0 → 1 onto 0 → 1

export function easeInQuad (t) {
  return t * t
}

export function easeOutQuad (t) {
  return t * (2 - t)
}

export function easeInOutQuad (t) {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
}

// screen-shake's keyframes (0 → up at 25% → down at 75% → 0), as −1…1, for t from 0 to 1
export function shakeOffset (t) {
  if (t <= 0 || t >= 1) return 0
  if (t < 0.25) return -t / 0.25
  if (t < 0.75) return -1 + (t - 0.25) / 0.25
  return 1 - (t - 0.75) / 0.25
}
