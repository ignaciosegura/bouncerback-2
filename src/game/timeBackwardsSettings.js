// Tunable values of the time goes backwards level property. Explained in "Time runs backwards" in
// docs/game-rules.md. Change them here and reload.
export const TIME_BACKWARDS_SETTINGS = Object.freeze({
  // Whether the core emits atoms by itself. With false, only the player's presses create atoms
  CORE_EMITS_ATOMS: true,
  // Atoms already in the arena when play starts, coming out of the reversed core collapse
  INITIAL_ATOM_COUNT: 5,
  // The earliest an initial atom reaches the paddles, in beats from the start of play, so the
  // player has time to react
  INITIAL_FIRST_CONTACT_MIN_BEATS: 4,
  // How far to the paddles (0 to 1, as a share of the core-to-contact distance) an initial atom
  // heading outward can start, so it never begins right at the ring with no time to react
  INITIAL_ATOM_MAX_OUTWARD_PROGRESS: 0.75,
  // Seconds the arena stays empty at the end of the level before the level start plays in reverse
  END_DELAY_SECONDS: 1
})
