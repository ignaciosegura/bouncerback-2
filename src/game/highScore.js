// High score persistence (docs/game-rules.md): common to all levels, saved the moment it's beaten.
import { readSaved, writeSaved } from '../utils/savedData.js'

const STORAGE_KEY = 'bouncerback.hiScore'

export function getHiScore () {
  const stored = Number.parseInt(readSaved(STORAGE_KEY), 10)
  return Number.isInteger(stored) && stored >= 0 ? stored : 0
}

/**
 * Saves `score` as the high score if it beats the current one. Returns the resulting high score,
 * so callers can update their state with `setHiScore(beatHiScore(score))` in one step.
 */
export function beatHiScore (score) {
  const current = getHiScore()
  if (score <= current) return current
  writeSaved(STORAGE_KEY, score)
  return score
}
