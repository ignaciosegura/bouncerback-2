// What the game remembers between sessions (high score, settings, level progress), kept in the
// browser's localStorage. Storage can be unavailable (private browsing, blocked by the browser):
// reads then return null, so the caller falls back to its default, and writes do nothing, so the
// value just won't persist.

// The saved string, or null if there is none or storage is unavailable
export function readSaved (key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// The saved value stored as JSON, or null if there is none, it's malformed or storage is unavailable
export function readSavedJson (key) {
  try {
    return JSON.parse(readSaved(key))
  } catch {
    return null
  }
}

// Saves `value` as a string (numbers and booleans read back with readSaved as their text)
export function writeSaved (key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Storage unavailable: the value just won't persist
  }
}

export function writeSavedJson (key, value) {
  writeSaved(key, JSON.stringify(value))
}
