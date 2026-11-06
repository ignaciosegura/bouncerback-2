# Time Goes Backwards — Implementation Plan (Phases T1–T6)

Status: T1–T6 complete (see `docs/archive/time-goes-backwards.md`).

## Goal

Level 6, Anticoherence, looks and sounds as if time ran backwards. It opens with the core collapse played in reverse, which throws atoms into the arena, and ends with the level start played in reverse, leaving an empty arena. Time and lives count up. A capture input now creates an atom instead of removing one, and atoms lose a charge per bounce until they disappear at the core.

Bouncing is unchanged, and the core still emits atoms outward. Every other level must play exactly as before.

## Decisions (confirmed with the user unless marked as a default)

| Area | Decision |
| :--- | :--- |
| Level file | New optional boolean `timeGoesBackwards`, false if missing. It is a level property, not an item of `additionalGameMechanics`. Anticoherence sets it |
| Tier rules | This level is an exception to "new mechanics only at the first level of a tier" and "once added, a mechanic stays". The exception is documented in `game-rules.md` |
| Lives | Computed as usual, counting down from `lives` to 0, and the score uses them as usual. Only the HUD changes: it shows 1 at the start and one more per escape (`lives` − lives left + 1), so `lives: 4` allows 4 escapes and shows 5 at the loss. There is no extra warning or HUD slot: not knowing the limit is part of the challenge |
| Background | Red when the HUD shows 1 life, so it starts red and turns black when it shows 2 |
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
