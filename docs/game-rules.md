The objective of the game is to keep the atoms inside the containment ring for a specific amount of time. Optionally, the player can destroy atoms using a mechanic specified below.

# Game mechanics

## Level start

When the level starts, the containment ring and the core are shown, but the game waits **3 seconds** before it begins: the timer doesn't count, no atoms are emitted, the level's music hasn't started yet and player input is disabled. This gives the previous screen's music time to fade out and the player time to get ready. After the delay, the timer, the atom emitter and the level's music all start at the same moment.

## Core mechanics

At the center of the containment ring there's the atom emitter, or core. It will start emitting atoms (with a initial charge value of 1) in random directions at semi-random intervals. All atoms travel at the same speed, specified in the level settings file.

The player can place paddles by clicking or tapping at the screen. These paddles will appear at the containment ring for a short period of time, and they will bounce the atoms back, reversing their course. The player can only set two paddles at a time. If it puts a third one, the first one will dissapear inmediately ("first in, first out").

An atom escapes the containment ring when its center crosses the ring. Until then, a paddle set at the last moment still bounces it back, even if the atom already overlaps the paddle; the atom is then placed back where a bounce at the exact moment of contact would have left it, so it stays on the beat (a small visible jump back).

If an atom escapes the containment ring, the player will lose one life immediately, and the atom will vanish (fade out) while keeping the same speed and direction.

## Game over condition

If the player runs out of lives (it reaches zero), the game will end in a "Game over" screen.

## Level end condition

When the timer runs out, the core will attract all atoms and "swallow" them. The level will end succesfuly and the player will be taken to the "YOU WIN!" screen.

The swallow phase is safe for the player:

* When the timer reaches zero, the core stops emitting atoms, all paddles disappear and player input is disabled.
* Every atom still inside the containment ring is pulled into the core. No atom can escape during the swallow, so no lives can be lost. Atoms that were already fading out after escaping are ignored.
* The swallow lasts 3 seconds. Then the "YOU WIN!" screen is shown.

# Player input mechanics

## Paddles

The paddle's exact position on the circumference of the ring will be calculated from the angle of the click position relative to the core and the horizontal axis. The paddle will be placed on the circumference at the angle closest to the pointer's angle. The arc length of the paddle is specified in the level settings file, centered at the placement angle.

To help the player set the paddles at the exact desired place, two events will be used: onMouseDown the paddle will be drawn, but inactive. The user can drag 
the mouse while holding the left-click button (or doing the equivalent gesture with a touchscreen), and the paddle will rotate around the core following the mouse position. When the user releases the button, the paddle will be set at the current position.

The paddle's lifetime (the `paddles.duration` value in the level file) starts counting when the paddle is set (on release), not when the button is pressed. While the player is dragging, the paddle is inactive and doesn't expire.

## Atom capture

Every time an atom is blocked by a paddle, its direction will be reversed and it will gain a "charge". The reversal is exact: the atom travels straight back through the core and out toward the opposite side of the ring. When the atom has three chargers, the player can destroy it by tapping on it while crossing the core. (A visual cue that tells capturable atoms apart — the atom color changes described in "Visual feedback" in `graphical-specs.md` — is planned for the second development cycle; in the first cycle all atoms look the same.)

Destroying atoms is optional, the player can keep bouncing them for extra points and charges, up to a limit of ten charges. At ten charges, the atom will not gain charges, but otherwise it will behave as a normal atom.

# Lives

The player loses a live every time an atom escapes the containment ring. 

# Time

The timer specifies the time remaining to beat the level, in tenths of a second. For example, a 2 minutes long level will have an initial time value of 1200 (120 * 10). The timer will decrease 1 unit every 0.1 seconds.

The level file will specify the length of the level in musical notation format: tempo (in BPM), time signature and number of bars. The timer will start counting down from the calculated time.

# Score

The player will get:

* 10 points * level * atom charge value every time it bounces back an atom using a paddle. 
* 100 points * level * atom charge value for every atom captured
* 200 points * level * atom charge value * remaining lives for every atom contained at the end of the level, when the core "swallows" all remaining atoms.
* Additional time bonus after all remaining atoms have been swallowed (the player needs to pass the level): 1 point * level for every 0.1 seconds of the level's total duration. In other words, the level's initial timer value (in tenths of a second) * level. For example, a 2-minute level 3 gives 1200 * 3 = 3600 points.
 
# High Score

The high score will be visible for the whole game. If the user beats the high score, it will be updated immediately at the same time as the score. The high score is common to all levels.
