// Atom charge rules of the levels where time goes backwards (see "The charge limit" in
// docs/time-goes-backwards-implementation-plan.md). Plain functions, no PixiJS.
//
// `travel` is the seconds an atom takes to cover the core-to-contact distance. From the center an
// atom's first bounce comes after `travel` and the next ones every 2 × travel, losing a charge on
// each, so with charge c it is back at the center at charge 1 after 2 × travel × (c − 1) seconds.
import { MAX_CHARGE, CAPTURE_MIN_CHARGE } from './entities/Atom.js'

const MIN_START_CHARGE = CAPTURE_MIN_CHARGE

// Seconds left under which the core stops emitting and the player can't create atoms: charges
// start at MIN_START_CHARGE, which needs 2 × travel × (MIN_START_CHARGE − 1) seconds to run out
export function cutoffSeconds (travel) {
  return 2 * travel * (MIN_START_CHARGE - 1)
}

// The highest charge an atom launched from the center can have with `timeLeft` seconds left and
// still be gone by the end
export function maxChargeFor (timeLeft, travel) {
  return Math.max(1, Math.min(MAX_CHARGE, 1 + Math.floor(timeLeft / (2 * travel))))
}

// Random whole charge from MIN_START_CHARGE to the limit (only called before the cutoff). Drawn
// from 0 to the limit and rounded up to MIN_START_CHARGE, so MIN_START_CHARGE is the most likely
// (with a limit of 10 it has 4 chances in 11, every other charge 1 in 11)
export function randomCharge (timeLeft, travel, random = Math.random) {
  const max = Math.max(MIN_START_CHARGE, maxChargeFor(timeLeft, travel))
  return Math.max(MIN_START_CHARGE, Math.floor(random() * (max + 1)))
}

// The atoms already in the arena when play starts. Each is defined by when it first reaches the
// paddles, spread evenly from `minContact` to the latest that works (2 × travel − settle / 2: later,
// the resting point of an atom heading inward would be outside the ring). Returns, for each, its
// signed `distance` at the start of play, its `direction` (+1 or −1 along its axis) and `charge`
// (limited by the time left at its first contact). `speed` and `contactDistance` are in px.
// An atom heading outward (first contact within `travel`) starts at most `maxOutwardProgress` of the
// way to the contact distance: that raises the lower end of the range, it never clamps an atom, so
// every allowed starting position stays equally likely.
export function initialAtomPlan ({ count, minContact: minContactSetting, maxOutwardProgress, travel, settle, speed, contactDistance, timer }, random = Math.random) {
  const latest = 2 * travel - settle / 2
  const minContact = Math.max(minContactSetting, (1 - maxOutwardProgress) * travel)
  const plan = []
  for (let i = 0; i < count; i++) {
    const contact = count === 1 ? minContact : minContact + (latest - minContact) * i / (count - 1)
    const direction = random() < 0.5 ? -1 : 1
    // Heading outward it starts short of the contact distance; heading inward it starts on the far
    // side, and crosses the core first
    const distance = contact <= travel
      ? direction * (contactDistance - speed * contact)
      : -direction * (speed * contact - contactDistance)
    // Back at the center at charge 1 once the contact (which costs one charge) and the bounces
    // that follow are done: the same as an atom launched from the center `travel` before
    const charge = randomCharge(timer - contact + travel, travel, random)
    plan.push({ distance, direction, charge })
  }
  return plan
}
