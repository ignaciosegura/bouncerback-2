// Tunable values of the charged atom catch mechanic: how a caught atom scores while it is held.
// Explained in "Charged atom catch" in docs/game-rules.md. Change them here and reload.
export const CHARGED_ATOM_CATCH_SETTINGS = Object.freeze({
  // Points per second that each caught atom scores while it is held, whatever the level or the
  // atom's charge.
  POINTS_PER_SECOND: 60,
  // Size of each score increment, in points (a whole number, 1 or more). With 1 the score goes up
  // point by point, which updates the HUD on every frame. A larger step pays the same total in
  // bigger, less frequent jumps: for example, a step of 5 at 60 points per second updates the
  // HUD 12 times per second. What is left unpaid when the catch ends is paid then.
  SCORE_STEP: 1
})
