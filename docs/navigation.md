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
  - Credits at the bottom: "A game by NIK NAK STUDIO" and "Music and sfx by MAN FROM SPACE". The names are links that open in a new tab: https://niknak.es and https://manfromspace.com
- **Level Selection Screen**
  - One button per level, labeled with the level file's `name` (LEARN, FEMTOCOSMOS, CHRONOSAEDR0N, MEKANOMANCER, NEUTRONIKA). All levels are unlocked from the start.
  - Back Button
- **Settings Screen**
  - Sound FX Volume dual-button
  - Music Volume dual-button
  - Back Button
- **Game Screen** *(During gameplay)*
  - HUD (score, time, hi-score, lives)
  - Game Canvas
  - Pause Button (top‑right) *(second development cycle)*
- **Pause Overlay** *(second development cycle; shown on top of the Game Screen. No mockup yet: follow the style of the other menus)*
  - Resume Button
  - Settings Button
  - Main Menu Button
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

Menus can be navigated with a game controller (Xbox-style layout): the d-pad or the left stick moves the selection, A or the right trigger (RT) activates the selected button, and B goes back (the `<<< BACK` button on Level Select and Settings; B does nothing on the other screens). The selected button gets a double border (see "Game controller selection" in `graphical-specs.md`). The controller doesn't work on the Intro: its button must be clicked, tapped or pressed with the keyboard, because browsers only unlock audio on those. The Main Menu credit links can't be selected with the controller. Controller input is ignored during screen transitions. In-game controls are in `game-rules.md` ("Game controller").

> [!NOTE]
> When a doc and a mockup disagree on on-screen text, the mockup wins. For example: "HI-SCORE" (not "High Score" or "Best Score") and "TRY AGAIN" (not "Play Again").
