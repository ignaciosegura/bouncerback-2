// The Settings "OLD TV" switch: the CRT layers on the game arena and the menu screens
// (docs/graphical-specs.md, "CRT effect"). On by default; persisted like the volumes and the high score.
import { readSaved, writeSaved } from '../utils/savedData.js'

const STORAGE_KEY = 'bouncerback.oldTv'

export function getOldTv () {
  const stored = readSaved(STORAGE_KEY)
  return stored === null ? true : stored === 'true'
}

export function setOldTv (on) {
  writeSaved(STORAGE_KEY, on)
}
