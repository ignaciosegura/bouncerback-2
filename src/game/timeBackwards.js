// Atom charge rules of the levels where time goes backwards (see "The charge limit" in
// docs/time-goes-backwards-implementation-plan.md). Plain functions, no PixiJS.
//
// `travel` is the seconds an atom takes to cover the core-to-contact distance. From the center an
// atom's first bounce comes after `travel` and the next ones every 2 × travel, losing a charge on
// each, so with charge c it is back at the center at charge 1 after 2 × travel × (c − 1) seconds.
import { MAX_CHARGE, CAPTURE_MIN_CHARGE } from './entities/Atom.js'
import { clamp } from '../utils/math.js'

const MIN_START_CHARGE = CAPTURE_MIN_CHARGE

// Seconds left under which the core stops emitting and the player can't create atoms: charges
// start at MIN_START_CHARGE, which needs 2 × travel × (MIN_START_CHARGE − 1) seconds to run out
export function cutoffSeconds (travel) {
  return 2 * travel * (MIN_START_CHARGE - 1)
}

// The highest charge an atom launched from the center can have with `timeLeft` seconds left and
// still be gone by the end
export function maxChargeFor (timeLeft, travel) {
  return clamp(1 + Math.floor(timeLeft / (2 * travel)), 1, MAX_CHARGE)
}

// The highest charge randomCharge() can give with `timeLeft` seconds left: the limit, but never
// under MIN_START_CHARGE
export function startChargeLimit (timeLeft, travel) {
  return Math.max(MIN_START_CHARGE, maxChargeFor(timeLeft, travel))
}

// Random whole charge from MIN_START_CHARGE to the limit (only called before the cutoff). Drawn
// from 0 to the limit and rounded up to MIN_START_CHARGE, so MIN_START_CHARGE is the most likely
// (with a limit of 10 it has 4 chances in 11, every other charge 1 in 11)
export function randomCharge (timeLeft, travel, random = Math.random) {
  return Math.max(MIN_START_CHARGE, Math.floor(random() * (startChargeLimit(timeLeft, travel) + 1)))
}

// Seconds from the start of play to each initial atom's first contact with the paddles, spread
// evenly from `minContact` to the latest that works (2 × travel − settle / 2: later, the resting
// point of an atom heading inward would be outside the ring). An atom heading outward starts at
// most `maxOutwardProgress` of the way to the contact distance, which raises the lower end
export function initialAtomContacts ({ count, minContact: minContactSetting, maxOutwardProgress, travel, settle }) {
  const latest = 2 * travel - settle / 2
  const minContact = Math.max(minContactSetting, (1 - maxOutwardProgress) * travel)
  return Array.from({ length: count }, (_, i) => count === 1 ? minContact : minContact + (latest - minContact) * i / (count - 1))
}

// The time left that limits the charge of an initial atom whose first contact is `contact` seconds
// into play: it must be back at the center at charge 1 once the contact (which costs one charge)
// and the bounces that follow are done, the same as an atom launched from the center `travel` before
export function initialAtomTimeLeft (timer, contact, travel) {
  return timer - contact + travel
}

// The atoms already in the arena when play starts. Each is defined by when it first reaches the
// paddles (see initialAtomContacts). Returns, for each, its signed `distance` at the start of play,
// its `direction` (+1 or −1 along its axis) and `charge` (limited by the time left at its first
// contact). `speed` and `contactDistance` are in px. The outward limit raises the lower end of the
// range, it never clamps an atom, so every allowed starting position stays equally likely.
export function initialAtomPlan ({ count, minContact, maxOutwardProgress, travel, settle, speed, contactDistance, timer }, random = Math.random) {
  const plan = []
  for (const contact of initialAtomContacts({ count, minContact, maxOutwardProgress, travel, settle })) {
    const direction = random() < 0.5 ? -1 : 1
    // Heading outward it starts short of the contact distance; heading inward it starts on the far
    // side, and crosses the core first
    const distance = contact <= travel
      ? direction * (contactDistance - speed * contact)
      : -direction * (speed * contact - contactDistance)
    const charge = randomCharge(initialAtomTimeLeft(timer, contact, travel), travel, random)
    plan.push({ distance, direction, charge })
  }
  return plan
}
