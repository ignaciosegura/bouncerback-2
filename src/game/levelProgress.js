// Level unlocking (docs/game-rules.md): tier 0 is unlocked from the start; beating every level of the
// highest unlocked tier unlocks the next one. Persisted like the high score, and never goes down.
import { levels, highestTier } from './levelLoader.js'
import { clamp } from '../utils/math.js'
import { readSavedJson, writeSavedJson } from '../utils/savedData.js'

const STORAGE_KEY = 'bouncerback.levelProgress'

const DEFAULT_PROGRESS = Object.freeze({ unlockedTier: 0, beatenLevels: Object.freeze([]) })

// Raises the unlocked tier while every level of it is beaten and a higher tier exists
function unlockTiers (allLevels, { unlockedTier, beatenLevels }) {
  const maxTier = Math.max(...allLevels.map((level) => level.tier))
  let tier = unlockedTier
  while (tier < maxTier && allLevels
    .filter((level) => level.tier === tier)
    .every((level) => beatenLevels.includes(level.number))) {
    tier++
  }
  return { unlockedTier: tier, beatenLevels }
}

// What was saved, checked against the current levels; the default when nothing usable was saved
export function getLevelProgress () {
  const stored = readSavedJson(STORAGE_KEY)
  if (!stored || typeof stored !== 'object') return DEFAULT_PROGRESS
  const unlockedTier = Number.isInteger(stored.unlockedTier)
    ? clamp(stored.unlockedTier, 0, highestTier)
    : 0
  const beatenLevels = Array.isArray(stored.beatenLevels)
    ? levels.map((level) => level.number).filter((number) => stored.beatenLevels.includes(number))
    : []
  return { unlockedTier, beatenLevels }
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
  writeSavedJson(STORAGE_KEY, progress)
  return progress
}

/**
 * The Konami Code on Level Select (docs/game-controller.md): unlocks every tier, keeping the beaten
 * levels; with every tier already unlocked, it goes back to a fresh install's progress instead.
 * Returns the resulting progress, like registerLevelWin.
 */
export function toggleAllLevelsUnlocked () {
  const current = getLevelProgress()
  const progress = current.unlockedTier >= highestTier
    ? DEFAULT_PROGRESS
    : { unlockedTier: highestTier, beatenLevels: current.beatenLevels }
  writeSavedJson(STORAGE_KEY, progress)
  return progress
}

export function isLevelUnlocked (level, progress) {
  return level.tier <= progress.unlockedTier
}
