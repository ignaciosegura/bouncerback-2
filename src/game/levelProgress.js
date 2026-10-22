// Level unlocking (docs/game-rules.md): tier 0 is unlocked from the start; beating every level of the
// highest unlocked tier unlocks the next one. Persisted like the high score, and never goes down.
import { levels, highestTier } from './levelLoader.js'

const STORAGE_KEY = 'bouncerback.levelProgress'

const DEFAULT_PROGRESS = { unlockedTier: 0, beatenLevels: [] }

// Raises the unlocked tier while every level of it is beaten and a higher tier exists
export function unlockTiers (allLevels, { unlockedTier, beatenLevels }) {
  const maxTier = Math.max(...allLevels.map((level) => level.tier))
  let tier = unlockedTier
  while (tier < maxTier && allLevels
    .filter((level) => level.tier === tier)
    .every((level) => beatenLevels.includes(level.number))) {
    tier++
  }
  return { unlockedTier: tier, beatenLevels }
}

export function getLevelProgress () {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (stored && typeof stored === 'object') {
      const unlockedTier = Number.isInteger(stored.unlockedTier)
        ? Math.min(Math.max(stored.unlockedTier, 0), highestTier)
        : 0
      const beatenLevels = Array.isArray(stored.beatenLevels)
        ? levels.map((level) => level.number).filter((number) => stored.beatenLevels.includes(number))
        : []
      return { unlockedTier, beatenLevels }
    }
  } catch {
    // Storage unavailable or malformed: fall back to the default
  }
  return DEFAULT_PROGRESS
}

function setLevelProgress (progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable: the progress just won't persist
  }
}

/**
 * Records a won level and unlocks the next tiers it completes. Returns the resulting progress,
 * so callers can update their state with `setLevelProgress(registerLevelWin(number))` in one step.
 */
export function registerLevelWin (levelNumber) {
  const current = getLevelProgress()
  const beatenLevels = current.beatenLevels.includes(levelNumber)
    ? current.beatenLevels
    : [...current.beatenLevels, levelNumber]
  const progress = unlockTiers(levels, { unlockedTier: current.unlockedTier, beatenLevels })
  setLevelProgress(progress)
  return progress
}

export function isLevelUnlocked (level, progress) {
  return level.tier <= progress.unlockedTier
}
