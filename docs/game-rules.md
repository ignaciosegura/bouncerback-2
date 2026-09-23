The objective of the game is to keep the atoms inside the containment ring for a specific amount of time. Optionally, the player can destroy atoms using a mechanic specified below.

# Game mechanics

## Core mechanics

At the center of the containment ring there's the atom emitter, or core. It will start emitting atoms (with a initial charge value of 1) in random directions at semi-random intervals. All atoms travel at the same speed, specified in the level settings file.

The player can place paddles by clicking or tapping at the screen. These paddles will appear at the containment ring for a short period of time, and they will bounce the atoms back, reversing their course. The player can only set two paddles at a time. If it puts a third one, the first one will dissapear inmediately ("first in, first out").

If an atom escapes the containment ring, the player will lose one life immediately, and the atom will vanish (fade out) while keeping the same speed and direction.

## Game over condition

If the player runs out of lives (it reaches zero), the game will end in a "Game over" screen.

## Level end condition

When the timer runs out, the core will attract all atoms and "swallow" them. The level will end succesfuly and the player will be taken to the "YOU WIN!" screen.

# Player input mechanics

## Paddles

The paddle's exact position on the circumference of the ring will be calculated from the angle of the click position relative to the core and the horizontal axis. The paddle will be placed on the circumference at the angle closest to the pointer's angle. The arc length of the paddle is specified in the level settings file, centered at the placement angle.

To help the player set the paddles at the exact desired place, two events will be used: onMouseDown the paddle will be drawn, but inactive. The user can drag 
the mouse while holding the left-click button (or doing the equivalent gesture with a touchscreen), and the paddle will rotate around the core following the mouse position. When the user releases the button, the paddle will be set at the current position.

## Atom capture

Every time an atom is blocked by a paddle, its direction will be reversed and it will gain a "charge". When the atom has three chargers, the player can destroy it by tapping on it while crossing the core.

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
* Additional bonus after all remaining atoms have been swallowed (the player needs to pass the level): 1 point for every 0.1 seconds.
 
# High Score

The high score will be visible for the whole game. If the user beats the high score, it will be updated immediately at the same time as the score. The high score is common to all levels.
