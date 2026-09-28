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
