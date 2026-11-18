// The Settings "OLD TV" switch: the CRT layers on the game arena and the menu screens
// (docs/graphical-specs.md, "CRT effect"). On by default; persisted like the volumes and the high score.
const STORAGE_KEY = 'bouncerback.oldTv'

export function getOldTv () {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === 'true'
  } catch {
    // Storage unavailable: fall back to the default
  }
  return true
}

export function setOldTv (on) {
  try {
    localStorage.setItem(STORAGE_KEY, String(on))
  } catch {
    // Storage unavailable: the setting just won't persist
  }
}
