# Time Goes Backwards — Implementation Plan (Phases T1–T5)

Status: waiting for the user's review and go-ahead. Nothing here is implemented yet.

## Goal

Level 6, Anticoherence, looks and sounds as if time ran backwards. It opens with the core collapse played in reverse, which throws atoms into the arena, and ends with the level start played in reverse, leaving an empty arena. Time and lives count up. A capture input now creates an atom instead of removing one, and atoms lose a charge per bounce until they disappear at the core.

Bouncing is unchanged, and the core still emits atoms outward. Every other level must play exactly as before.

## Decisions (confirmed with the user unless marked as a default)

| Area | Decision |
| :--- | :--- |
| Level file | New optional boolean `timeGoesBackwards`, false if missing. It is a level property, not an item of `additionalGameMechanics`. Anticoherence sets it and `lives: 5` |
| Tier rules | This level is an exception to "new mechanics only at the first level of a tier" and "once added, a mechanic stays". The exception is documented in `game-rules.md` |
| Lives | Start at 1 and go up with each escape. The level is lost when they reach `lives`, so 5 allows 4 escapes. There is no extra warning or HUD slot: not knowing the limit is part of the challenge |
| Background | Red at 1 life, as today, so it starts red and turns black at 2. No code change in the color rule |
| Timer | The engine counts as usual. Only the React layer shows elapsed time (initial timer minus time left) |
| Core emission | Stays on, behind a flag in the settings file, so it can be switched off (and so a later "endless zen" level can reuse atom creation) |
| Atom charge | Every atom is born with a random charge from 3 to 10, limited by the time left (see "The charge limit"). It loses one per bounce |
| Disappearing | An atom at charge 1 disappears when it crosses the center of the core and plays `launch_reversed` |
| Capture input | A press on the core always creates an atom, at any time until the cutoff, even while an atom is crossing the core. There is no capture |
| Capture pulse | Kept, reversed. It no longer means anything: the player discovers that trying to capture creates an atom instead |
| Atom escape | Unchanged for now (see "Deferred Issues" in `docs/implementation-plan.md`) |
| Last life zoom | Unchanged. *Default* |
| Score | Unchanged formulas, high score risk accepted. Capture points are paid when a created atom is launched, and hold points while it is held. *Default: when each one is paid* |
| Sound files | The user makes a reversed copy of each sound, `[name]_reversed`, and the level's reversed track |
| Supercharged atoms | Not considered: `timeGoesBackwards` only has to work with this level's mechanics |

## The charge limit

The level must end with an empty arena, so no atom may outlive the timer. This can be calculated exactly, because an atom covers the core-to-contact distance in exactly `atoms.travelTime` beats (call it t seconds), bouncing keeps it on that schedule, and it can only leave early by escaping.

- From the center, an atom's first bounce comes after t, and the next ones every 2t. It loses a charge on each, so with charge c it is back at the center at charge 1 after **2t(c − 1)** seconds.
- The highest charge allowed for an atom launched from the center with L seconds left is therefore **1 + floor(L / 2t)**, and never more than 10.
- **Cutoff:** charges start at 3, so once fewer than **4t** seconds are left, the core stops emitting and the player can't create atoms.
- Example with Anticoherence's current values (t = 3 s, level about 89 s): the cutoff is the last 12 s, and a charge of 10 is only possible with at least 54 s left. So the limit lowers charges through the last 60% of the level.

Consequences for atoms the player creates:

- The charge is drawn at the press, and limited again at launch, because holding uses up time. The atom's color follows if the charge drops.
- A held atom is launched automatically at the cutoff.
- After the cutoff a press on the core creates nothing, and places a paddle like a press anywhere else. *Default.*
- The press also needs to leave time for the creation animation to finish before the cutoff.

If frame timing leaves an atom in play when the timer ends, it is removed at that moment. By then it is within a fraction of a second of disappearing anyway.

## Phase T1 — Level property, lives and timer

- `docs/level-file-schema.json`: `timeGoesBackwards`, and the new meaning of `lives` in its description.
- `src/game/levelLoader.js`: exposes `timeGoesBackwards`, `startingLives` (1 or `lives`), `livesLostAt` (`lives` or 0) and `livesStep` (+1 or −1), so no other code has to tell the two cases apart for lives.
- `src/game/GameEngine.js`: uses those three in the constructor, `checkContact` and the lose check in `updatePlaying`. `backgroundTarget` stays as it is.
- `src/screens/GameScreen.jsx`: lives start from `level.startingLives`, and `HUD` receives elapsed time for this level. `timeTenths` from the engine doesn't change meaning.
- `src/levels/level6.json`: `timeGoesBackwards: true`, `lives: 5`. Run `npm run validate:levels`.

Check: the level starts red with one life and TIME 0, with no first-frame flash of other values. TIME reaches the level's full time as the collapse starts. The fourth escape after the start triggers the last life zoom and Game Over. Normal levels are unaffected.

## Phase T2 — Atom creation, charge loss and disappearing

- New `src/game/timeBackwardsSettings.js`: `CORE_EMITS_ATOMS`, plus the values added in Phase T4.
- New `src/game/timeBackwards.js`, plain functions with no PixiJS: the charge limit, the cutoff and the random charge.
- `src/game/entities/Atom.js`:
  - `spawn` takes an optional starting charge, and the color matches it at once.
  - `bounce` takes the charge change (+1 or −1). Below 3 charges an atom is white, through the existing color transition.
  - New `CREATING` state, the capture's pull-in in reverse: the atom grows from radius zero at the center, using the same curve played backwards.
- `src/game/GameEngine.js`:
  - `onPointerDown` and `handleGamepad`: in this level a press on the core goes to a new `createAtom(input)` instead of `holdNearest`. A press that can't create (one is already held, or it is past the cutoff) behaves as today: a pointer places a paddle, and a button does nothing.
  - `createAtom`: draws the charge, starts the atom in `CREATING`, starts the reversed capture burst, plays `capture_reversed`, and starts the hold loop and hold points through the existing `held` object. The input that created the atom is the one that launches it.
  - Release: the atom launches at once, or when its animation ends if the release came first (a quick tap). The launch limits the charge, pays the capture points and plays `hold_trigger_reversed`, and `held` is cleared.
  - Hold shake, one atom at a time, pause (launches on resume) and last life lost keep the existing rules.
  - Cutoff, in `updatePlaying`: skips emission, and launches a held atom. `CORE_EMITS_ATOMS` skips emission too.
  - Disappearing, in the moving-atom branch of `updatePlaying`: an atom at charge 1 whose distance changes sign is released and plays `launch_reversed`.
  - Every atom emitted by the core uses the random, limited charge.

Check: atoms lose charge and color on each bounce and vanish at the center at charge 1. Quick taps, long holds, a hold through a pause and a hold through the cutoff all launch one atom. Both pointer and controller work. A second finger or capture button during a hold creates nothing. Logging each disappearance confirms that none happens after the timer.

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

## Docs (each with the phase it describes)

- `docs/game-rules.md`: a "Time runs backwards" section, exceptions to the tier rules, lives, timer, charge limit and level end.
- `docs/graphical-specs.md`: reversed versions of each effect, and the level start and end.
- `docs/audio-map.md`: the reversed files and event map.
- `docs/level-difficulty-table.md` and `scripts/level-difficulty-table.js`: this level's maximum score becomes an estimate, using the highest allowed charge at each emission, losing charge per bounce, plus the initial atoms, with no containment points and no atoms created by the player. The paddle demand column assumes atoms never leave, so it needs adapting too.
- `docs/design-decisions.md`: why this is a level property, and why the charge limit and cutoff exist.
- `docs/project-structure.md`: the two new files.
- `AGENTS.md`: the "Level Files" rule about new mechanics, if the exception needs noting there.
- `docs/game-instructions.md`: not touched (see "Deferred Issues" in `docs/implementation-plan.md`).

## Verification (whole feature)

- `npm run validate:levels`, `npm run lint` and `npm run level:table` pass.
- Play levels 2 and 7 for regressions in capture, hold, collapse, the supercharged atom and the level start, as they share the code paths changed here.
- Play Anticoherence with a pointer, touch and a controller, with OLD TV on and off, through a win, a loss, a pause in each state of a created atom, and Try Again.
- Tune `INITIAL_ATOM_COUNT`, `INITIAL_FIRST_CONTACT_MIN_BEATS`, `END_DELAY_SECONDS`, `lives` and `atoms.barsInterval` by eye.
