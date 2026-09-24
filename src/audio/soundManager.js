import { Howl } from 'howler'

export const MIN_VOLUME = 0
export const MAX_VOLUME = 9

// Track played on every screen except gameplay (see docs/audio-map.md)
export const MENU_TRACK = 'main_title.mp3'

const FADE_MS = 500
const STORAGE_KEYS = {
  music: 'bouncerback.musicVolume',
  sfx: 'bouncerback.sfxVolume'
}

const baseName = (path) => path.split('/').pop()

const sfxUrls = import.meta.glob('../../assets/audio/*.mp3', { eager: true, query: '?url', import: 'default' })
const trackUrls = import.meta.glob('../../assets/audio/tracks/*.mp3', { eager: true, query: '?url', import: 'default' })

// Sound effects are small: load them all up front, keyed by name without extension ('bounce')
const sfx = {}
for (const [path, url] of Object.entries(sfxUrls)) {
  sfx[baseName(path).replace(/\.mp3$/, '')] = new Howl({ src: [url] })
}

// Tracks are large once decoded: each one is loaded when it starts and unloaded when it stops.
// Keyed by file name ('learn.mp3'), as referenced by the level files' soundTrack field.
const tracks = {}
for (const [path, url] of Object.entries(trackUrls)) {
  tracks[baseName(path)] = { url, howl: null }
}

let musicVolume = readVolume(STORAGE_KEYS.music)
let sfxVolume = readVolume(STORAGE_KEYS.sfx)
let currentTrack = null
let fadeInTimer = null

applySfxVolume()

function readVolume (key) {
  try {
    const stored = Number.parseInt(localStorage.getItem(key), 10)
    if (Number.isInteger(stored)) return clampVolume(stored)
  } catch {
    // Storage unavailable: fall back to the default
  }
  return MAX_VOLUME
}

function writeVolume (key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Storage unavailable: the setting just won't persist
  }
}

function clampVolume (value) {
  return Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, value))
}

// 0–9 setting → 0–1 gain
function gain (value) {
  return value / MAX_VOLUME
}

function applySfxVolume () {
  for (const howl of Object.values(sfx)) howl.volume(gain(sfxVolume))
}

/**
 * Plays the near-silent stub. Must be called from the first user interaction
 * (the Intro screen tap) so mobile browsers allow audio from then on.
 */
export function unlock () {
  sfx.silence?.play()
}

export function playSfx (name) {
  const howl = sfx[name]
  if (!howl) {
    console.warn(`soundManager: unknown sound effect "${name}"`)
    return
  }
  howl.play()
}

/**
 * Switches the music: the current track fades out, then the new one fades in.
 * Requesting the track that is already playing does nothing, so it continues seamlessly.
 */
export function playTrack (name) {
  if (name === currentTrack) return
  if (!tracks[name]) {
    console.warn(`soundManager: unknown track "${name}"`)
    return
  }

  currentTrack = name
  clearTimeout(fadeInTimer)
  const fadingOut = fadeOutOtherTracks()
  fadeInTimer = setTimeout(startCurrentTrack, fadingOut ? FADE_MS : 0)
}

/**
 * Fades out the music and leaves silence (used by screens without a track).
 */
export function stopTrack () {
  if (currentTrack === null) return

  currentTrack = null
  clearTimeout(fadeInTimer)
  fadeOutOtherTracks()
  fadeInTimer = setTimeout(unloadOtherTracks, FADE_MS)
}

// Fades out every loaded track except the current one; returns whether any was fading
function fadeOutOtherTracks () {
  let fadingOut = false
  for (const [trackName, track] of Object.entries(tracks)) {
    if (trackName !== currentTrack && track.howl) {
      track.howl.fade(track.howl.volume(), 0, FADE_MS)
      fadingOut = true
    }
  }
  return fadingOut
}

function unloadOtherTracks () {
  for (const [trackName, track] of Object.entries(tracks)) {
    if (trackName !== currentTrack && track.howl) {
      track.howl.unload()
      track.howl = null
    }
  }
}

function startCurrentTrack () {
  unloadOtherTracks()

  const track = tracks[currentTrack]
  if (!track.howl) {
    track.howl = new Howl({ src: [track.url], loop: true, volume: 0 })
    track.howl.play()
  }
  // Also fades a track back in if it was requested again while fading out
  track.howl.fade(track.howl.volume(), gain(musicVolume), FADE_MS)
}

export function getMusicVolume () {
  return musicVolume
}

export function getSfxVolume () {
  return sfxVolume
}

export function setMusicVolume (value) {
  musicVolume = clampVolume(value)
  writeVolume(STORAGE_KEYS.music, musicVolume)
  tracks[currentTrack]?.howl?.volume(gain(musicVolume))
}

export function setSfxVolume (value) {
  sfxVolume = clampVolume(value)
  writeVolume(STORAGE_KEYS.sfx, sfxVolume)
  applySfxVolume()
}
