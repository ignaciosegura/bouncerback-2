# Navigation Flow

Every change from one screen to another plays the screen transition (see "Screen transitions" in `graphical-specs.md`). The Pause Overlay is shown on top of the Game Screen, not as a screen change, so it doesn't use it.

- **Intro Screen** *(first screen on every launch; light layout, no menu background animation, silent)*
  - "Grab your best headphones first ;)" note (mixed case) above the button (text only, not interactive)
  - ENTER BOUNCERBACK Button (unlocks audio) → Main Menu
- **Main Menu**
  - Game logo at the top
  - The first time it's reached from the Intro, the menu music and the menu background animation start together
  - Play Button
  - Settings Button
  - How To Button
  - Exit Game Button *(desktop builds only; see the MAIN MENU - desktop mockup)*: the screen-out plays and the music fades out, then the game quits. No confirmation.
  - Credits at the bottom: "A game by NIK NAK STUDIO" and "Music and sfx by MAN FROM SPACE". The names are links that open in a new tab: https://niknak.es and https://manfromspace.com
- **Level Selection Screen**
  - One button per level, labeled with the level file's `name` (LEARN, FEMTOCOSMOS, CHRONOSAEDR0N, MEKANOMANCER, NEUTRONIKA), arranged in one row per tier (see "Level unlocking" in `game-rules.md` and the LEVEL MENU mockup).
  - Locked levels show 12 dashes instead of their name and can't be selected: clicks and taps do nothing, and the game controller skips them (see the LEVEL MENU (LOCKED LEVELS) mockup).
  - Back Button
- **How To Play Screen**
  - The game's instructions (`docs/game-instructions.md`) and an example drawing of the arena (Paddle, Atom, Core, Containment ring)
  - Back Button
- **Settings Screen**
  - Music Volume dual-button
  - Sound FX Volume dual-button
  - OLD TV switch (the CRT layers on the game arena and on the menu screens' background animation and logo; off by default). Shows its current state: OLD TV ON / OLD TV OFF.
  - Back Button
- **Game Screen** *(During gameplay)*
  - HUD (score, time, hi-score, lives)
  - Game Canvas
  - Pause Button (top‑right) *(second development cycle)*
- **Gameplay Tips** *(shown on top of the Game Screen, with the HUD visible, before the level starts, only for levels whose file has a `tip`; see the GAMEPLAY TIPS mockup)*
  - The level's tip text
  - READY Button (fades the tip out, then the level starts as usual). Not a screen change.
- **Pause Overlay** *(second development cycle; shown on top of the frozen Game Screen, see the GAMEPLAY PAUSE MENU mockup)*
  - The same controls as the Settings Screen (Music Volume, Sound FX Volume, Old TV toggle), so there's no separate Settings button
  - Exit To Menu Button (leaves the level → Main Menu; the level's progress is lost)
  - Resume Button (`<<< RESUME`, in place of Settings' `<<< BACK`; closes the overlay and the game continues)
- **End-of-level interstitial** *(not a screen: a picture drawn on the Game Screen's canvas, only for levels whose file names one for the outcome; see "End-of-level interstitials" in `graphical-specs.md`)*
  - Comes when the end animation is over (last life zoom or core collapse), in place of going to the result screen; the HUD disappears
  - Continue: tap or click anywhere, the controller's bottom face button or RT, or Enter / Space, once its short input lock has passed. It continues on the release. The Game Over or You Win! screen then replaces the Game Screen at once (no screen-out, only its screen-in)
  - The level's result (the score, and a win's level progress) is saved when the picture appears, not when the player continues
- **Game Over Screen** *(replaces the Game Screen when the player runs out of lives)*
  - Score
  - Hi-Score
  - Try Again Button (restarts the same level from scratch: score reset to 0, lives reset to the level file's value)
  - Main Menu Button
- **You Win! Screen** *(replaces the Game Screen after the core collapse takes the remaining atoms)*
  - Score
  - Hi-Score
  - Try Again Button (restarts the same level from scratch: score reset to 0, lives reset to the level file's value)
  - Main Menu Button

## Mobile back button

The Android system back button (and its gesture) follows the navigation below. It is ignored while a screen transition runs, like taps. iOS has no such button.

| Screen | Back button |
| :--- | :--- |
| Level Selection, How To Play, Settings, Game Over, You Win! | → Main Menu |
| Game Screen | Opens the Pause Overlay (never leaves the game) |
| Pause Overlay | Resumes the game (same as `<<< RESUME`) |
| Intro, Main Menu | Leaves the app (the system default) |

The Game Screen and the Pause Overlay are the exceptions on purpose: a player who taps the back button by mistake must not lose the current game. Leaving a level takes the deliberate EXIT TO MENU button of the Pause Overlay. While the game can't be paused (the 3-second start delay, the core collapse, the Game Over delay, the Gameplay Tips, an end-of-level interstitial), the back button does nothing.

## Desktop Escape key

In the desktop builds, the Escape key follows the navigation below. Like taps, it is ignored while a screen transition runs, and a key held down acts only once. The web build ignores Escape: in a browser it has its own uses (leaving fullscreen, among others). It doesn't take the desktop window out of fullscreen.

| Screen | Escape |
| :--- | :--- |
| Level Selection, How To Play, Settings, Game Over, You Win! | → Main Menu |
| Game Screen | Opens the Pause Overlay (never leaves the game) |
| Pause Overlay | Resumes the game (same as `<<< RESUME`) |
| Gameplay Tips | Leaves the level → Main Menu (same as the Pause Overlay's EXIT TO MENU) |
| Intro, Main Menu | Nothing (quitting takes the EXIT GAME button) |

The Gameplay Tips and the Game Screen differ on purpose: before the level starts nothing is lost, so Escape is the quick way out after choosing the wrong level; once it has started, a stray key press must not lose the game, as with the mobile back button. Once READY is pressed, Escape does nothing while the tip fades out, and on the Game Screen it does nothing while the game can't be paused (the 3-second start delay, the core collapse, the Game Over delay, an end-of-level interstitial).

## Game controller

The menus can also be navigated with a game controller, except on the Intro. The controls are in `docs/game-controller.md`; the selected button's look is in `graphical-specs.md` ("Game controller selection").

> [!NOTE]
> When a doc and a mockup disagree on on-screen text, the mockup wins. For example: "HI-SCORE" (not "High Score" or "Best Score") and "TRY AGAIN" (not "Play Again").
