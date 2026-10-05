// Easing curves: each maps progress 0 → 1 onto 0 → 1

/**
 * @param {number} t
 * @returns {number}
 */
export function easeInQuad (t) {
  return t * t
}

/**
 * @param {number} t
 * @returns {number}
 */
export function easeOutQuad (t) {
  return t * (2 - t)
}

/**
 * @param {number} t
 * @returns {number}
 */
export function easeInOutQuad (t) {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
}
