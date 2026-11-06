

## Phase T5 — Audio

Depends on the user's files. Until they exist, the sound manager warns about the missing names and those sounds are silent.

- Files, in `assets/audio/`, found by name without extension as usual: `bounce_reversed`, `capture_reversed`, `destroy_reversed`, `launch_reversed`, `hold_trigger_reversed`, `hold_loop_reversed` and `vortex_creation_reversed`. They are `.mp3` by convention, **except `hold_loop_reversed`, which must be `.flac`**: MP3's encoder padding would put a gap in the loop.
- `GameEngine.js`: a small method plays each effect with the `_reversed` suffix when the level is backwards, and every `playSfx` and `startLoopSfx` call goes through it. The engine is the only code that plays effects, so `soundManager.js` needs no global mode.
- Voice limits: the reversed names aren't in `SFX_VOICE_LIMITS`, so a new bounce doesn't cut the previous one off before its peak. Add a limit only if it sounds crowded. *Default.*
- Event map for this level:

| Event | Sound |
| :--- | :--- |
| Level start animation | `vortex_creation_reversed` |
| Core emits an atom | `launch_reversed` |
| Atom disappears at the core | `launch_reversed` |
| Atom bounces | `bounce_reversed` |
| Atom escapes | `destroy_reversed` |
| Press on the core | `capture_reversed` and the `hold_loop_reversed` loop |
| Launch of a created atom | `hold_trigger_reversed` |

- The level's track stays the `soundTrack` field, and must keep the level's 52 bars at 140 BPM to stay in step with the timer and beats. The Game Over and You Win! tracks stay normal.

Check: each event plays its reversed file, the loop has no gap, and pausing pauses the reversed sounds like any others.

## Phase T3 — Reversed effects during play

Each entity gets a `reversed` option at construction and runs its existing formula with progress mirrored, so forward and reverse can't drift apart:

- `CaptureCircle.js`: the ring contracts into the center while fading in, then disappears.
- `PaddleFlash.js`: the ghost starts drifted out and invisible, and arrives on the paddle at its strongest as it ends. It starts at the bounce and isn't anticipated, so its peak comes after the bounce by the effect's length.
- `AtomPulse.js`: the disc shrinks onto the atom while fading in, peaking on the next beat.
- `Paddle.js`: it starts faint, reaches full opacity at half its lifetime, stays there, and vanishes when it expires. The paddle being dragged stays at full opacity, and the red replacement warning is unchanged.

The paddle fade is the one to watch for playability, because a fresh paddle is faint.

Check: each effect, side by side with a normal level, looks like the same animation played backwards. Paddle lifetime and collisions are unchanged.

## Phase T4 — Reversed level start and end

**Start.** `updateStarting` for this level:

1. The ring is shown at full size at once, with no atoms and no core, as a normal level's last frame looks. It waits until the animation has to start (start delay minus collapse time).
2. The core collapse plays in reverse, ending exactly when the start delay does, so the timer, the music and input start as the atoms reach full speed. `vortex_creation_reversed` plays with it. Input stays disabled.
3. The atoms come out of the center with the expanding core, slow to a stop at their resting points while the core shrinks back to normal, then accelerate. They become normal moving atoms when play starts.

`updateCollapsing`'s per-frame calculation moves to one shared function, called with reversed time for this animation, so the two stay exact mirrors. Atoms reuse `startCollapse` and `updateCollapse` with a mirrored drift.

**The initial atoms.** Settings: `INITIAL_ATOM_COUNT` and `INITIAL_FIRST_CONTACT_MIN_BEATS`. Each atom is defined by when it first reaches the paddles, not by a random position:

- First-contact times are spread evenly, from the minimum up to the latest that works, so they don't all arrive together and no atom reaches a paddle before the player can react.
- The latest time is 2t minus half the settle time. Beyond that, an atom heading inward would have its resting point outside the ring.
- Direction is random. Charge is random from 3 to 10, limited as above, starting from its first contact. They score nothing at the start.

**End.** The timer reaching zero goes to a new `ENDING` state for this level, instead of the core collapse:

1. Paddles clear and input stops, as in the collapse. The arena has no atoms left, apart from any finishing an escape fade. The You Win! track preloads.
2. After `END_DELAY_SECONDS`, the level start animation plays in reverse (`drawStartAnimation` with reversed time): the core shrinks away, then the ring. It has no sound, as the level start has none.
3. `win()`. It takes no atoms, so no containment points are paid in this level.

Pause stays limited to the playing state, so it isn't available during either animation.

Check: at the start, atoms appear from the core with no jump in speed or position when play begins, and at least the minimum time passes before any first contact. At the end, the arena is empty when the timer runs out, and the You Win! screen follows. A normal level's collapse looks identical to before. Try Again repeats it all.

## Phase T6 — Safe initial atoms

A safety mechanism, so the start isn't randomly punishing: an initial atom must never begin play close to the ring while heading outward, with no time to react.

- **Rule:** an initial atom heading outward starts at most **75%** of the way from the core to the paddle contact distance (`CONTACT_DISTANCE`). Atoms heading inward are not affected: they cross the core first.
- **Setting:** `INITIAL_ATOM_MAX_OUTWARD_PROGRESS` (0.75) in `timeBackwardsSettings.js`.
- **Where:** `initialAtomPlan` in `timeBackwards.js`. An outward atom's start is `contactDistance − speed × contact`, so the rule is the same as a minimum first-contact time of `(1 − 0.75) × travel`.
- **No clamping:** the rule moves the *lower end of the range* the first-contact times are spread over, it never pushes an atom that fell outside it onto the limit. That would pile atoms at 75% and make that position more likely than the rest. The range runs from the larger of the two minimums to the latest allowed time, and the times are spread evenly across it as before, so every allowed starting position is equally likely. Charge, direction and the inward atoms are unchanged.
- **Interaction with `INITIAL_FIRST_CONTACT_MIN_BEATS`:** the larger of the two minimums applies. With today's values the beats minimum is already the stricter one, so the rule only matters if that setting or `atoms.travelTime` is lowered. *Default: nothing else changes at the current values.*
- **Open point, default taken:** "on their way out" is measured to the contact distance, where the paddles are, not to the ring itself, because that is where the player has to react.

Check: with `INITIAL_FIRST_CONTACT_MIN_BEATS` set to 0, no outward initial atom starts past 75% over many reloads, and the starting positions are spread evenly with none piling up at 75%. At the current values the start is identical to before.
