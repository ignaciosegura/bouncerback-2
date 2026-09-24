// Score formulas from docs/game-rules.md. `level` is the level's number (1–5).

// An atom bounces off a paddle; `charge` is the atom's charge as it hits (before the bounce adds one)
export function bouncePoints (level, charge) {
  return 10 * level * charge
}

// An atom is tapped and destroyed while crossing the core
export function capturePoints (level, charge) {
  return 100 * level * charge
}

// Level end: an atom still inside the ring is swallowed by the core
export function containmentPoints (level, charge, lives) {
  return 200 * level * charge * lives
}

// Level end: one point per level number for every tenth of a second of the level's initial timer
export function timeBonus (level, timerTenths) {
  return timerTenths * level
}
