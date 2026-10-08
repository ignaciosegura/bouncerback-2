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
  - Credits at the bottom: "A game by NIK NAK STUDIO" and "Music and sfx by MAN FROM SPACE". The names are links that open in a new tab: https://niknak.es and https://manfromspace.com
- **Level Selection Screen**
  - One button per level, labeled with the level file's `name` (LEARN, FEMTOCOSMOS, CHRONOSAEDR0N, MEKANOMANCER, NEUTRONIKA). All levels are unlocked from the start.
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
- **Pause Overlay** *(second development cycle; shown on top of the frozen Game Screen, see the GAMEPLAY PAUSE MENU mockup)*
  - The same controls as the Settings Screen (Music Volume, Sound FX Volume, Old TV toggle), so there's no separate Settings button
  - Exit To Menu Button (leaves the level → Main Menu; the level's progress is lost)
  - Resume Button (`<<< RESUME`, in place of Settings' `<<< BACK`; closes the overlay and the game continues)
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

## Game controller

The menus can also be navigated with a game controller, except on the Intro. The controls are in `docs/game-controller.md`; the selected button's look is in `graphical-specs.md` ("Game controller selection").

> [!NOTE]
> When a doc and a mockup disagree on on-screen text, the mockup wins. For example: "HI-SCORE" (not "High Score" or "Best Score") and "TRY AGAIN" (not "Play Again").
