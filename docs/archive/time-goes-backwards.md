

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
