# Navigation Flow

- **Intro Screen** *(first screen on every launch; light layout, no menu background animation, silent)*
  - ENTER BOUNCERBACK Button (unlocks audio) → Main Menu
- **Main Menu**
  - Game logo at the top
  - The first time it's reached from the Intro, the menu music and the menu background animation start together
  - Play Button
  - Settings Button
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

> [!NOTE]
> When a doc and a mockup disagree on on-screen text, the mockup wins. For example: "HI-SCORE" (not "High Score" or "Best Score") and "TRY AGAIN" (not "Play Again").
