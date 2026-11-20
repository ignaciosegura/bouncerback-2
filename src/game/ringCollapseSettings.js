// Tunable values of the ring collapse ending (levels with `ringCollapse`). Explained in "Level end,
// ring collapse" in docs/graphical-specs.md. Change them here and reload.
export const RING_COLLAPSE_SETTINGS = Object.freeze({
  // Seconds the empty ring holds after the core collapse, before it collapses too
  DELAY_SECONDS: 1,
  // Big rings that collapse after the containment ring, back to back, each starting outside the
  // screen (radius: half the canvas diagonal)
  OUTER_RING_COUNT: 40,
  // Speed factor of the first big ring: 1 takes as long as the containment ring's collapse. Its
  // ring_collapse sound plays at the same factor (playback rate)
  OUTER_RING_FIRST_SPEED: 1,
  // Added to the speed factor for each following big ring (e.g. with a step of 0.2 the factors are
  // 1, 1.2, 1.4 and so on)
  OUTER_RING_SPEED_STEP: 0.1,
  // Added to the playback rate of ring_collapse for each following big ring, starting from
  // OUTER_RING_FIRST_SPEED. Separate from the rings' step so the sound can stay within Howler's
  // playback rate range (up to 4)
  OUTER_RING_SOUND_SPEED_STEP: 0.07,
  // Seconds the empty arena holds after the last big ring reaches the center, before the You Win!
  // interstitial (or screen)
  END_DELAY_SECONDS: 5
})
