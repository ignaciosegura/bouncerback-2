import schema from '../../docs/level-file-schema.json'

/**
 * Checks a value against the subset of JSON Schema used by docs/level-file-schema.json
 * (type, required, properties, additionalProperties, items). Returns a list of problems.
 */
function checkSchema (value, rule, path) {
  const problems = []
  const type = Array.isArray(value) ? 'array' : typeof value

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
    soundTrack: data.soundTrack,
    lives: data.lives,
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
