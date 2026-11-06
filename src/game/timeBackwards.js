// Atom charge rules of the levels where time goes backwards (see "The charge limit" in
// docs/time-goes-backwards-implementation-plan.md). Plain functions, no PixiJS.
//
// `travel` is the seconds an atom takes to cover the core-to-contact distance. From the center an
// atom's first bounce comes after `travel` and the next ones every 2 × travel, losing a charge on
// each, so with charge c it is back at the center at charge 1 after 2 × travel × (c − 1) seconds.
import { MAX_CHARGE, CAPTURE_MIN_CHARGE } from './entities/Atom.js'

export const MIN_START_CHARGE = CAPTURE_MIN_CHARGE

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

// Random whole charge from MIN_START_CHARGE to the limit (only called before the cutoff)
export function randomCharge (timeLeft, travel, random = Math.random) {
  const max = Math.max(MIN_START_CHARGE, maxChargeFor(timeLeft, travel))
  return MIN_START_CHARGE + Math.floor(random() * (max - MIN_START_CHARGE + 1))
}
