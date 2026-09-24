// High score persistence (docs/game-rules.md): common to all levels, saved the moment it's beaten.
const STORAGE_KEY = 'bouncerback.hiScore'

export function getHiScore () {
  try {
    const stored = Number.parseInt(localStorage.getItem(STORAGE_KEY), 10)
    if (Number.isInteger(stored) && stored >= 0) return stored
  } catch {
    // Storage unavailable: fall back to the default
  }
  return 0
}

function setHiScore (value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Storage unavailable: the high score just won't persist
  }
}

/**
 * Saves `score` as the high score if it beats the current one. Returns the resulting high score,
 * so callers can update their state with `setHiScore(beatHiScore(score))` in one step.
 */
export function beatHiScore (score) {
  const current = getHiScore()
  if (score <= current) return current
  setHiScore(score)
  return score
}
