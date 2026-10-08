// The Settings "OLD TV" switch: the CRT layers on the game arena and the menu screens
// (docs/graphical-specs.md, "CRT effect"). Off by default; persisted like the volumes and the high score.
const STORAGE_KEY = 'bouncerback.oldTv'

export function getOldTv () {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    // Storage unavailable: fall back to the default
  }
  return false
}

export function setOldTv (on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Storage unavailable: the setting just won't persist
  }
}
