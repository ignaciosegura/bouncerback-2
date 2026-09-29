import { Howl } from 'howler'

export const MIN_VOLUME = 0
export const MAX_VOLUME = 9

// Track played on every screen except gameplay (see docs/audio-map.md)
export const MENU_TRACK = 'main_title.mp3'

// Gain at the top volume setting: -6 dB, so music and SFX at full volume can sum without clipping
const MAX_GAIN = 10 ** (-6 / 20)

const FADE_MS = 500
// Max simultaneous voices per sound effect; when full, the oldest voice is faded out (voice stealing)
const SFX_VOICE_LIMITS = { bounce: 1, destroy: 1 }
const STEAL_FADE_MS = 15
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

// Voice IDs of the voice-limited effects, oldest first, keyed like `sfx`
const activeVoices = {}

// Tracks are large once decoded: each one is loaded when it starts (or is preloaded) and unloaded
// when it stops. Keyed by file name ('learn.mp3'), as referenced by the level files' soundTrack field.
const tracks = {}
for (const [path, url] of Object.entries(trackUrls)) {
  tracks[baseName(path)] = { url, howl: null, started: false }
}

let musicVolume = readVolume(STORAGE_KEYS.music)
let sfxVolume = readVolume(STORAGE_KEYS.sfx)
let currentTrack = null
let fadeInTimer = null
let musicPaused = false
// Whether the current track fades in when it starts (see playTrack)
let currentFadeIn = true

// Callbacks for onTrackStart, keyed like `tracks`
const trackStartListeners = {}

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

// 0–9 setting → 0–MAX_GAIN gain
function gain (value) {
  return (value / MAX_VOLUME) * MAX_GAIN
}

function applySfxVolume () {
  for (const howl of Object.values(sfx)) howl.volume(gain(sfxVolume))
}

/**
 * Plays the near-silent stub. Must be called from the first user interaction
 * (the Enter screen's button) so mobile browsers allow audio from then on.
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

  const limit = SFX_VOICE_LIMITS[name]
  if (!limit) {
    howl.play()
    return
  }

  const voices = (activeVoices[name] ?? []).filter((id) => howl.playing(id))
  while (voices.length >= limit) stealVoice(howl, voices.shift())
  voices.push(howl.play())
  activeVoices[name] = voices
}

// Quick fade before stopping, so cutting a voice short doesn't click
function stealVoice (howl, id) {
  howl.fade(howl.volume(), 0, STEAL_FADE_MS, id)
  setTimeout(() => howl.stop(id), STEAL_FADE_MS)
}

/**
 * Switches the music: the current track fades out, then the new one fades in
 * (or starts straight at the music volume with `fadeIn: false`).
 * Requesting the track that is already playing does nothing, so it continues seamlessly.
 */
export function playTrack (name, { fadeIn = true } = {}) {
  if (name === currentTrack) return
  if (!tracks[name]) {
    console.warn(`soundManager: unknown track "${name}"`)
    return
  }

  currentTrack = name
  currentFadeIn = fadeIn
  musicPaused = false
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
  musicPaused = false
  clearTimeout(fadeInTimer)
  fadeOutOtherTracks()
  fadeInTimer = setTimeout(() => unloadOtherTracks(), FADE_MS)
}

/**
 * Pauses the current track where it is (game paused). A track due to start meanwhile waits for resumeTrack.
 */
export function pauseTrack () {
  musicPaused = true
  const track = tracks[currentTrack]
  if (track?.started) track.howl.pause()
}

/**
 * Resumes the current track from where it was paused, fading it back in.
 */
export function resumeTrack () {
  if (!musicPaused) return
  musicPaused = false
  const track = tracks[currentTrack]
  if (!track?.started) return
  track.howl.play()
  // Pausing interrupts any fade in progress: finish it now
  track.howl.fade(track.howl.volume(), gain(musicVolume), FADE_MS)
}

/**
 * Loads a track without playing it, so a later playTrack starts it without a loading delay.
 */
export function preloadTrack (name) {
  const track = tracks[name]
  if (!track) {
    console.warn(`soundManager: unknown track "${name}"`)
    return
  }
  if (!track.howl) track.howl = createTrackHowl(name)
}

/**
 * Calls `callback` every time the track actually starts playing (after loading, not when requested).
 * Returns a function that removes the callback.
 */
export function onTrackStart (name, callback) {
  const listeners = trackStartListeners[name] ??= new Set()
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function isTrackPlaying (name) {
  return tracks[name]?.howl?.playing() ?? false
}

function createTrackHowl (name) {
  const howl = new Howl({ src: [tracks[name].url], volume: 0 })
  howl.on('play', () => trackStartListeners[name]?.forEach((callback) => callback()))
  return howl
}

// Fades out every playing track except the current one; returns whether any was fading
function fadeOutOtherTracks () {
  let fadingOut = false
  for (const [trackName, track] of Object.entries(tracks)) {
    if (trackName !== currentTrack && track.started) {
      track.howl.fade(track.howl.volume(), 0, FADE_MS)
      fadingOut = true
    }
  }
  return fadingOut
}

// Unloads every track except the current one; preloaded tracks are kept unless `includePreloaded`
function unloadOtherTracks (includePreloaded = false) {
  for (const [trackName, track] of Object.entries(tracks)) {
    if (trackName !== currentTrack && track.howl && (track.started || includePreloaded)) {
      track.howl.unload()
      track.howl = null
      track.started = false
    }
  }
}

function startCurrentTrack () {
  unloadOtherTracks(true)

  const track = tracks[currentTrack]
  if (!track.howl) track.howl = createTrackHowl(currentTrack)
  // Without a fade-in, the track starts straight at the music volume
  if (!currentFadeIn) track.howl.volume(gain(musicVolume))
  if (!track.started) {
    if (!musicPaused) track.howl.play()
    track.started = true
  }
  // Also fades a track back in if it was requested again while fading out
  if (currentFadeIn) track.howl.fade(track.howl.volume(), gain(musicVolume), FADE_MS)
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
