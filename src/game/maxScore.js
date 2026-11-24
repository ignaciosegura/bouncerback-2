// The level's score ceiling, shown as MAX on the Game Over and You Win! screens and in the level
// difficulty table (scripts/level-difficulty-table.js). Plain functions, no PixiJS.
// The assumptions behind it: "Max score" in docs/level-difficulty-table.md
import { CORE_COLLAPSE_SETTLE_TIME, MAX_CHARGE, SUPERCHARGED_CHARGE, SUPERCHARGED_SPEED_FACTOR } from './entities/Atom.js'
import { ADDITIONAL_MECHANICS } from './additionalMechanics.js'
import { bouncePoints, containmentPoints, timeBonus, livesBonus } from './scoring.js'
import { TIME_BACKWARDS_SETTINGS } from './timeBackwardsSettings.js'
import { cutoffSeconds, initialAtomContacts, initialAtomTimeLeft, startChargeLimit } from './timeBackwards.js'
import { clamp } from '../utils/math.js'

/**
 * Bounce points of one atom bounced every time it reaches the paddles: it leaves the center
 * `start` seconds into a level of `durationSeconds`, so its first contact is one `travel` later and
 * the next ones every round trip (2 × `travel`), all before the end. Its charge starts at `charge` and changes by `chargeChange`
 * per bounce (kept from 1 to MAX_CHARGE). Where time goes backwards it falls by one per bounce,
 * and an atom at charge 1 is gone at the center: it makes no more contacts.
 * Returns the points and the charge left at the end.
 */
function bounceRun (level, durationSeconds, travel, start, { charge = 1, chargeChange = 0, vanishes = false } = {}) {
  const remaining = durationSeconds - start
  const contacts = remaining >= travel ? Math.floor((remaining - travel) / (2 * travel)) + 1 : 0
  let points = 0
  for (let i = 0; i < contacts; i++) {
    if (vanishes && charge === 1) break
    points += bouncePoints(level, charge)
    if (chargeChange) charge = clamp(charge + chargeChange, 1, MAX_CHARGE)
  }
  return { points, charge }
}

// Spawn time of every atom the core emits: one per interval, mid-interval (the game picks a random
// moment inside it)
function spawnTimes (atomCount, interval) {
  return Array.from({ length: atomCount }, (_, i) => i * interval + interval / 2)
}

// Forward time: atoms gain a charge per bounce (with atom capture) and every atom still in play at
// the end is contained
function forwardScore (level, durationSeconds, travel, spawns, capture) {
  let score = 0
  for (const spawn of spawns) {
    const { points, charge } = bounceRun(level, durationSeconds, travel, spawn, { chargeChange: capture ? 1 : 0 })
    score += points + containmentPoints(level, charge)
  }
  return score
}

// Time goes backwards: atoms start at the highest charge they can get, lose one per bounce and are
// gone at the center at charge 1, so none is left to contain at the end. The core stops emitting at
// the cutoff. The atoms the level starts with pay their containment points at their start charge
// instead (reversed, the player contained them)
function backwardsScore (level, durationSeconds, travel, spawns, secondsPerBeat) {
  let score = 0
  for (const spawn of spawns) {
    const timeLeft = durationSeconds - spawn
    if (!TIME_BACKWARDS_SETTINGS.CORE_EMITS_ATOMS || timeLeft < cutoffSeconds(travel)) continue
    const charge = startChargeLimit(timeLeft, travel)
    score += bounceRun(level, durationSeconds, travel, spawn, { charge, chargeChange: -1, vanishes: true }).points
  }
  const contacts = initialAtomContacts({
    count: TIME_BACKWARDS_SETTINGS.INITIAL_ATOM_COUNT,
    minContact: TIME_BACKWARDS_SETTINGS.INITIAL_FIRST_CONTACT_MIN_BEATS * secondsPerBeat,
    maxOutwardProgress: TIME_BACKWARDS_SETTINGS.INITIAL_ATOM_MAX_OUTWARD_PROGRESS,
    travel,
    settle: CORE_COLLAPSE_SETTLE_TIME
  })
  for (const contact of contacts) {
    const charge = startChargeLimit(initialAtomTimeLeft(durationSeconds, contact, travel), travel)
    score += bounceRun(level, durationSeconds, travel, contact - travel, { charge, chargeChange: -1, vanishes: true }).points
    score += containmentPoints(level, charge)
  }
  return score
}

/**
 * Score ceiling of a level, from its level file `data` and its number `level` (the score
 * multiplier): every bounce is made, no captures, no hold points, no lives lost.
 */
export function maxScore (data, level) {
  const { bpm, signature } = data.timeSignature
  const mechanics = data.additionalGameMechanics
  const secondsPerBeat = 60 / bpm
  const durationSeconds = data.duration * signature * secondsPerBeat
  const travel = data.atoms.travelTime * secondsPerBeat
  const interval = data.atoms.barsInterval * signature * secondsPerBeat
  const spawns = spawnTimes(Math.floor(data.duration / data.atoms.barsInterval), interval)
  const backwards = data.timeGoesBackwards ?? false

  let score = backwards
    ? backwardsScore(level, durationSeconds, travel, spawns, secondsPerBeat)
    : forwardScore(level, durationSeconds, travel, spawns, mechanics.includes(ADDITIONAL_MECHANICS.ATOM_CAPTURE))
  if (mechanics.includes(ADDITIONAL_MECHANICS.SUPERCHARGED_ATOM)) {
    // Appears at half the timer, faster, with a fixed charge. Where time goes backwards it is
    // never contained: the level ends with an empty arena
    const travelSuper = travel / SUPERCHARGED_SPEED_FACTOR
    const { points, charge } = bounceRun(level, durationSeconds, travelSuper, durationSeconds / 2, { charge: SUPERCHARGED_CHARGE })
    score += points + (backwards ? 0 : containmentPoints(level, charge))
  }
  return score + timeBonus(level, Math.round(durationSeconds * 10)) + livesBonus(level, data.lives, data.lives)
}
