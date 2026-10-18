The objective of the game is to keep the atoms inside the containment ring for a specific amount of time. The core mechanic, which every level has, is using paddles to bounce the atoms back. Every other mechanic is an additional one: each level chooses which ones it adds to the core mechanic, and the player can't opt out of them (see "Additional game mechanics" below).

# Game mechanics

## Additional game mechanics

The core mechanic is using paddles to bounce atoms back (see "Core mechanics"). It is always on: every level has it, and it is never listed in the level file.

Every other mechanic is an additional one, and the player can't switch it off. Each level adds the ones it uses through the `additionalGameMechanics` array in its level file. The array is required; an empty one means the level only uses the core mechanic. Each item is the name of a mechanic, one of the following (lowercase text, spaces included, exactly as written; any other name makes the level file invalid):

| Name | What it does | Status |
| :--- | :--- | :--- |
| `atom capture` | Atoms get charged on every bounce and can be captured (see "Atom capture") | Defined |
| `supercharged atom` | Halfway through the level, an additional atom is generated that travels at double the speed of all other atoms in that level and it already has twenty charges | Defined |
| `charged atom catch` | The atoms that can be captured can also be retained. Pressing a capture button catches the atom, which scores at a fixed rate per second while the button is held, and it is captured as usual upon release (see "Charged atom catch") | Defined |

The names live in one constant in the code (an enum), and the level file schema lists the same names.

**A level's additional mechanics are fixed for the whole level.** They are read when the level starts and can't be switched on or off while it is being played: the rules in force at the start stay in force until the level ends, through pauses and resumes, and TRY AGAIN starts the level again with the same ones.

Currently only level 1 plays without `atom capture`; levels 2 to 5 include it. `charged atom catch` is also in level 3 onwards. `supercharged atom` is added at levels 4 and 5. 

## Level start

If the level file has a `tip`, the Gameplay Tips (see `graphical-specs.md`) come first: the level waits, with an empty arena, until READY is pressed, and what follows starts then. Nothing can be paused or played meanwhile.

When the level starts, the containment ring and then the core grow in from nothing (a 0.75-second animation, see "Level start" in `graphical-specs.md`), but the game waits **3 seconds** before it begins: the timer doesn't count, no atoms are emitted, the level's music hasn't started yet and player input is disabled. This gives the previous screen's music time to fade out and the player time to get ready. After the delay, the timer, the atom emitter and the level's music all start at the same moment.

## Core mechanics

At the center of the containment ring there's the atom emitter, or core. It will start emitting atoms (with a initial charge value of 1) in random directions at semi-random intervals. All atoms travel at the same speed, specified in the level settings file.

The player can place paddles by clicking or tapping at the screen. These paddles will appear at the containment ring for a short period of time, and they will bounce the atoms back, reversing their course. The player can only set two paddles at a time. If it puts a third one, the first one will dissapear inmediately ("first in, first out").

An atom escapes the containment ring when its center crosses the ring. Until then, a paddle set at the last moment still bounces it back, even if the atom already overlaps the paddle; the atom is then placed back where a bounce at the exact moment of contact would have left it, so it stays on the beat (a small visible jump back).

If an atom escapes the containment ring, the player will lose one life immediately, and the atom will vanish (fade out) while keeping the same speed and direction.

## Game over condition

If the player runs out of lives (it reaches zero), the game will end in a "Game over" screen. Before it, the game freezes and then zooms in on the atom that took the last life (see "Last life lost" in `docs/graphical-specs.md`); the "Game over" screen comes 2 seconds after the loss.

## Level end condition

When the timer runs out, the core will attract all atoms and collapse, taking them with it. The level will end succesfuly and the player will be taken to the "YOU WIN!" screen.

The core collapse is safe for the player:

* When the timer reaches zero, the core stops emitting atoms, all paddles disappear and player input is disabled.
* Every atom still inside the containment ring is pulled into the core. No atom can escape during the core collapse, so no lives can be lost. Atoms that were already fading out after escaping are ignored.
* The core collapse lasts 2 seconds and plays together with the `vortex_creation` sound effect. The core grows to the size of the ring while every atom slows down to a stop, then the core collapses and takes all atoms with it (see "Level end (core collapse)" in `graphical-specs.md`). Then the "YOU WIN!" screen is shown.

# Player input mechanics

## Paddles

The paddle's exact position on the circumference of the ring will be calculated from the angle of the click position relative to the core and the horizontal axis. The paddle will be placed on the circumference at the angle closest to the pointer's angle. The arc length of the paddle is specified in the level settings file, centered at the placement angle.

To help the player set the paddles at the exact desired place, two events will be used: onMouseDown the paddle will be drawn, but inactive. The user can drag 
the mouse while holding the left-click button (or doing the equivalent gesture with a touchscreen), and the paddle will rotate around the core following the mouse position. When the user releases the button, the paddle will be set at the current position.

The paddle's lifetime (the `paddles.duration` value in the level file) starts counting when the paddle is set (on release), not when the button is pressed. While the player is dragging, the paddle is inactive and doesn't expire. Once set, the paddle fades out gradually during the second half of its lifetime so the player can see how much time it has left, and it flashes every time it bounces an atom (see "Visual feedback" in `graphical-specs.md`; planned for the second development cycle).

While the player is placing a new paddle and the two-paddle limit means an existing paddle will disappear when the new one is set ("first in, first out"), that paddle turns red, so its removal doesn't come as a surprise (see "Visual feedback" in `graphical-specs.md`).

## Atom capture

This section applies only to levels that include the `atom capture` additional mechanic (see "Additional game mechanics"). Without it, atoms don't get a charge when they bounce back: they keep their initial charge of 1 for as long as they live, they never change color, and they can't be captured (a tap on the core or a controller capture button does nothing). They are still bounced back, and still score points for bouncing and for being contained (see "Score").

Every time an atom is blocked by a paddle, its direction will be reversed and it will gain a "charge". The reversal is exact: the atom travels straight back through the core and out toward the opposite side of the ring. When the atom has three chargers, the player can destroy it by tapping on it (the capture happens when the tap is released) while crossing the core, that is, while the atom overlaps the core. Capturable atoms change color, and while one is crossing the core it emits a pulse on every beat, so the player can see when it can be captured (see "Visual feedback for additional game mechanics" in `graphical-specs.md`. A captured atom is pulled into the center of the core while shrinking, and then disappears.

Destroying atoms is optional, the player can keep bouncing them for extra points and charges, up to a limit of ten charges. At ten charges, the atom will not gain charges, but otherwise it will behave as a normal atom. (The supercharged atom is the exception: it has twenty, see "Supercharged atom".)

## Supercharged atom

This section applies only to levels that include the `supercharged atom` additional mechanic (see "Additional game mechanics"). It doesn't depend on `atom capture`, but what the charges do does (see below).

* **One extra atom, halfway.** When half of the level's time has elapsed (half of the timer's initial value, counted in game time, so pauses don't count), one additional atom is generated, once per level. It is separate from the core's regular emission (it doesn't replace or delay any of its atoms) and it plays its own sound, `launch_supercharged`, instead of `launch` (see `audio-map.md`). TRY AGAIN starts the level again, so it is generated again at the halfway point.
* **Double speed.** It travels at double the speed of all other atoms in the level (the level's speed from the level settings file; the factor is `SUPERCHARGED_SPEED_FACTOR` in `src/game/entities/Atom.js`, the only place that holds it). Every other atom keeps the level's speed. The atom's own speed applies to everything it does: travelling, escaping, the last life zoom and the core collapse. Since it is faster, the time it spends crossing the core (the capture window) is shorter.
* **Twenty charges from the start.** It is generated with twenty charges, double the ten limit of the other atoms (see "Atom capture"; the value is `SUPERCHARGED_CHARGE` in `src/game/entities/Atom.js`, the only place that holds it), and it never gains or loses any: its charge value is always 20. In the score, every bounce scores 10 points * level * 20, a capture 100 points * level * 20, and, if it is still inside the ring when the core collapses, 200 points * level * 20 (see "Score").
* **Otherwise a normal atom.** Paddles bounce it back, and it costs a life if it escapes. In levels with `atom capture` it can be captured as soon as it crosses the core, and, with `charged atom catch`, caught (see "Atom capture" and "Charged atom catch").
* **Without `atom capture`.** Its twenty charges still count for the score, but charges do nothing else without that mechanic: the atom can't be captured or caught, and it doesn't pulse.

## Charged atom catch

This section applies only to levels that include the `charged atom catch` additional mechanic (see "Additional game mechanics"), which builds on `atom capture`. Without it, a capture happens on release, as described in "Atom capture": the press does nothing to the atom.

With it, the press matters too. Pressing a capture input (a click or touch on the core, or a controller capture button, see `game-controller.md`) while a capturable atom is crossing the core **catches** it, and releasing the input **captures** it.

* **Catch (press).** The atom stops travelling at once, where it is, and stays there for as long as it is caught: it can't bounce, escape or be hit by a paddle. The other atoms carry on. If several capturable atoms are crossing the core, the one nearest to its center is caught, the same one a capture would take. It shakes while it's caught (see "Visual feedback for additional game mechanics" in `graphical-specs.md`) and sound plays: a one-shot (`catch_trigger`) at the catch, and a loop (`catch_loop`) for as long as it is held, the same for any atom (see `audio-map.md`).
* **Score while caught.** A caught atom scores at a fixed rate per second, paid in fixed steps so the score and the HUD don't have to change on every frame. Each increment shows on the HUD as soon as it is paid. The rate does not depend on the level or the atom's charge. Whatever is left unpaid (less than one step) is paid when the catch ends, so the total for a catch is always the rate times the time it lasted, rounded to a whole number of points. Both the rate and the step are in `src/game/chargedAtomCatchSettings.js`, the only place that holds their values.
* **Release.** Releasing the input captures the atom it caught, exactly as a capture does without the mechanic: the capture points (see "Score"), the pull-in animation, the capture burst and the `capture` sound (`capture_supercharged` for the supercharged atom). The catch loop fades out. The points scored while holding are on top of them.
* **One atom at a time.** Only one atom can be caught at once, and only one is captured at a time. The input that caught it (a pointer or a capture button) is the only one whose release captures it. While an atom is caught, pressing any other input catches nothing: a click or touch places a paddle, and a controller capture button does nothing, and neither captures anything on release. Once the atom is captured, the next press can catch another.
* **A press that catches nothing.** If no capturable atom is crossing the core when the input is pressed, nothing is caught. A click or touch places a paddle, as always. A controller capture button does nothing, and its release captures nothing either, even if an atom is crossing the core by then: only a press that caught an atom can capture it. (This is different from levels without the mechanic, where the release captures whatever is in the core.)
* **Pause.** Pausing cancels the hold. The caught atom is captured as soon as the game resumes, so it never stays caught for good. The catch sound stops when the hold is cancelled.
* **End of the level.** If the timer runs out while an atom is caught, the core collapse takes it like any other atom still inside the ring, and it scores the containment points (see "Score"). Its input's release then does nothing. The catch sound stops.
* **Last life lost.** If the last life is lost while an atom is caught, everything freezes as usual (see "Lives"), and the release does nothing. The catch sound stops.

## Game controller

The game can also be played with a game controller, alongside mouse and touch: either stick places a paddle, and buttons capture atoms (in levels with `atom capture`), or catch them and capture them on release (in levels with `charged atom catch`). The controls are in `docs/game-controller.md`.

# Lives

The player loses a live every time an atom escapes the containment ring. 

# Time

The timer specifies the time remaining to beat the level, in tenths of a second. For example, a 2 minutes long level will have an initial time value of 1200 (120 * 10). The timer will decrease 1 unit every 0.1 seconds.

The level file will specify the length of the level in musical notation format: tempo (in BPM), time signature and number of bars. The timer will start counting down from the calculated time.

# Score

The player will get:

* 10 points * level * atom charge value every time it bounces back an atom using a paddle. 
* 100 points * level * atom charge value for every atom captured (only with `atom capture`, since without it nothing can be captured)
* With `charged atom catch`, additional points while an atom is caught, at the fixed rate set in `chargedAtomCatchSettings.js` (not multiplied by level or charge): see "Charged atom catch".
* 200 points * level * atom charge value for every atom contained at the end of the level, when the core collapse takes all remaining atoms.

Without `atom capture`, the charge value of every atom is always 1, so those two formulas become 10 points * level per bounce and 200 points * level per contained atom.
* 500 points * level * remaining lives.
* Additional time bonus after the core collapse has taken all remaining atoms (the player needs to pass the level): 1 point * level for every 0.1 seconds of the level's total duration. In other words, the level's initial timer value (in tenths of a second) * level. For example, a 2-minute level 3 gives 1200 * 3 = 3600 points.
 
# High Score

The high score will be visible for the whole game. If the user beats the high score, it will be updated immediately at the same time as the score. The high score is common to all levels.
