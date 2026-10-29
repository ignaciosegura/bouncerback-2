import schema from '../../docs/level-file-schema.json'
import { ADDITIONAL_MECHANICS } from './additionalMechanics.js'

// Level Select buttons are sized for names this long (the longest planned: QUANTAMORPHICA)
export const LEVEL_NAME_MAX_LENGTH = 14

// The end-of-level pictures named by youWinInterstitial / gameOverInterstitial: file name → bundled URL
const interstitialFiles = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/interstitials/*.png', { eager: true, query: '?url', import: 'default' }))
    .map(([path, url]) => [path.split('/').pop(), url])
)
const INTERSTITIAL_FIELDS = ['youWinInterstitial', 'gameOverInterstitial']

// Missing or blank (empty, or only spaces): no picture
function interstitialName (value) {
  return value?.trim() || null
}

/**
 * Checks a value against the subset of JSON Schema used by docs/level-file-schema.json
 * (type, enum, pattern, required, properties, additionalProperties, items). Returns a list of problems.
 */
function checkSchema (value, rule, path) {
  const problems = []
  const type = Array.isArray(value) ? 'array' : typeof value

  if (rule.enum && !rule.enum.includes(value)) {
    return [`${path} must be one of: ${rule.enum.map((name) => `"${name}"`).join(', ')}`]
  }
  if (rule.pattern && typeof value === 'string' && !new RegExp(rule.pattern).test(value)) {
    return [`${path} must match ${rule.pattern}`]
  }

  switch (rule.type) {
  case 'object':
    if (type !== 'object' || value === null) return [`${path} must be an object`]
    for (const key of rule.required ?? []) {
      if (!(key in value)) problems.push(`${path}.${key} is required`)
    }
    for (const [key, child] of Object.entries(value)) {
      if (rule.properties?.[key]) {
        problems.push(...checkSchema(child, rule.properties[key], `${path}.${key}`))
      } else if (rule.additionalProperties === false) {
        problems.push(`${path}.${key} is not allowed`)
      }
    }
    return problems
  case 'array':
    if (type !== 'array') return [`${path} must be an array`]
    value.forEach((item, i) => problems.push(...checkSchema(item, rule.items, `${path}[${i}]`)))
    return problems
  case 'integer':
    return Number.isInteger(value) ? [] : [`${path} must be an integer`]
  case 'number':
    return Number.isFinite(value) ? [] : [`${path} must be a number`]
  default:
    return type === rule.type ? [] : [`${path} must be a ${rule.type}`]
  }
}

// The schema's list of mechanic names and the code's constant must be the same
const schemaMechanics = schema.properties.additionalGameMechanics.items.enum
const codeMechanics = Object.values(ADDITIONAL_MECHANICS)
if (schemaMechanics.length !== codeMechanics.length || !codeMechanics.every((name) => schemaMechanics.includes(name))) {
  throw new Error('level-file-schema.json and additionalMechanics.js list different additional game mechanics')
}

// Rules the schema doesn't express but the game needs
function checkRanges (level) {
  const problems = []
  const positive = {
    duration: level.duration,
    'timeSignature.bpm': level.timeSignature.bpm,
    'timeSignature.signature': level.timeSignature.signature,
    'atoms.travelTime': level.atoms.travelTime,
    'atoms.barsInterval': level.atoms.barsInterval,
    'paddles.angle': level.paddles.angle,
    'paddles.duration': level.paddles.duration,
    lives: level.lives
  }
  for (const [key, value] of Object.entries(positive)) {
    if (!(value > 0)) problems.push(`level.${key} must be greater than 0`)
  }
  if (level.paddles.angle >= 360) problems.push('level.paddles.angle must be less than 360')
  if (level.name.trim() === '') problems.push('level.name must not be empty')
  if (level.name.length > LEVEL_NAME_MAX_LENGTH) problems.push(`level.name must be at most ${LEVEL_NAME_MAX_LENGTH} characters`)
  if (level.tier < 0) problems.push('level.tier must be 0 or greater')
  for (const field of INTERSTITIAL_FIELDS) {
    const name = interstitialName(level[field])
    if (name && !(name in interstitialFiles)) problems.push(`level.${field}: assets/interstitials/${name} doesn't exist`)
  }
  return problems
}

export function validateLevel (level) {
  const problems = checkSchema(level, schema, 'level')
  return problems.length > 0 ? problems : checkRanges(level)
}

/**
 * Validates a level file and derives the runtime values the game engine uses (times in seconds).
 * `number` is the level's number (1–5), used by the score formulas.
 * Throws if the file doesn't match docs/level-file-schema.json.
 */
export function loadLevel (data, number) {
  const problems = validateLevel(data)
  if (problems.length > 0) {
    throw new Error(`Invalid level ${number}:\n  ${problems.join('\n  ')}`)
  }

  const { bpm, signature } = data.timeSignature
  const secondsPerBeat = 60 / bpm
  const secondsPerBar = signature * secondsPerBeat

  return {
    number,
    name: data.name,
    tier: data.tier,
    soundTrack: data.soundTrack,
    lives: data.lives,
    tip: data.tip ?? null,
    // URLs of the end-of-level pictures, or null for none
    youWinInterstitial: interstitialFiles[interstitialName(data.youWinInterstitial)] ?? null,
    gameOverInterstitial: interstitialFiles[interstitialName(data.gameOverInterstitial)] ?? null,
    // Fixed when the level is loaded: mechanics never change while a level is played
    additionalGameMechanics: Object.freeze([...data.additionalGameMechanics]),
    atomCapture: data.additionalGameMechanics.includes(ADDITIONAL_MECHANICS.ATOM_CAPTURE),
    superchargedAtom: data.additionalGameMechanics.includes(ADDITIONAL_MECHANICS.SUPERCHARGED_ATOM),
    chargedAtomHold: data.additionalGameMechanics.includes(ADDITIONAL_MECHANICS.CHARGED_ATOM_HOLD),
    secondsPerBeat,
    // Initial timer value, in tenths of a second
    timerTenths: Math.round(data.duration * secondsPerBar * 10),
    // Atom speed in core-to-ring trips per second (multiply by that distance in px to get px/s)
    atomSpeed: 1 / (data.atoms.travelTime * secondsPerBeat),
    // One atom spawns at a random moment inside each interval (see spawnDelay)
    spawnInterval: data.atoms.barsInterval * secondsPerBar,
    paddleArc: data.paddles.angle * Math.PI / 180,
    paddleDuration: data.paddles.duration,
    vfx: (data.vfx ?? []).map(({ name, time }) => ({ name, time: time * secondsPerBar }))
  }
}

/**
 * Seconds from the start of a spawn interval to its spawn: a random moment inside the interval.
 */
export function spawnDelay (spawnInterval, random = Math.random) {
  return random() * spawnInterval
}

// levelN.json → loaded level N, ordered by N
const levelFiles = import.meta.glob('../levels/level*.json', { eager: true, import: 'default' })

export const levels = Object.entries(levelFiles)
  .map(([path, data]) => [Number(path.match(/level(\d+)\.json$/)[1]), data])
  .sort(([a], [b]) => a - b)
  .map(([number, data]) => loadLevel(data, number))

// Tiers unlock one after another, so they must run from 0 with no gaps: a missing tier would keep
// every tier after it locked forever
export const highestTier = Math.max(...levels.map((level) => level.tier))
for (let tier = 0; tier <= highestTier; tier++) {
  if (!levels.some((level) => level.tier === tier)) {
    throw new Error(`No level has tier ${tier}: level tiers must run from 0 with no gaps`)
  }
}
