

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
