// Score formulas from docs/game-rules.md. `level` is the level's number (1–5).

/**
 * An atom bounces off a paddle; `charge` is the atom's charge as it hits (before the bounce adds one)
 * @param {number} level
 * @param {number} charge
 * @returns {number}
 */
export function bouncePoints (level, charge) {
  return 10 * level * charge
}

/**
 * An atom is tapped and destroyed while crossing the core
 * @param {number} level
 * @param {number} charge
 * @returns {number}
 */
export function capturePoints (level, charge) {
  return 100 * level * charge
}

/**
 * Level end: an atom still inside the ring is taken by the core collapse
 * @param {number} level
 * @param {number} charge
 * @param {number} lives
 * @returns {number}
 */
export function containmentPoints (level, charge, lives) {
  return 200 * level * charge * lives
}

/**
 * Level end: one point per level number for every tenth of a second of the level's initial timer
 * @param {number} level
 * @param {number} timerTenths
 * @returns {number}
 */
export function timeBonus (level, timerTenths) {
  return timerTenths * level
}
