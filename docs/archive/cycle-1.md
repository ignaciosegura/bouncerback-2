# Bouncerback — Cycle 1 Archive

Completed phases of the first development cycle, moved here from `docs/implementation-plan.md` once done. History only: the other docs are the source of truth for how the game works now; read this only when working on, or asked about, one of these phases.

---

## First Development Cycle (MVP)

### Phase 0 — Project scaffolding
- `package.json`, Vite + `@vitejs/plugin-react`, deps: `react`, `react-dom`, `pixi.js@^8`, `howler`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/screen-orientation` (Capacitor deps are installed now but only used from Phase 10).
- `index.html`, `src/main.jsx`, `capacitor.config.json` (placeholder appId/appName).
- `src/index.css`: `@font-face` for `assets/fonts/c64_angled.ttf` (relative path, processed by Vite), global reset, black background, `env(safe-area-inset-*)` padding, base `touch-action: none`.

### Phase 1 — App shell & navigation
- `src/App.jsx`: screen-state switcher covering `navigation.md`'s flow (Intro → Main Menu → {Level Select, Settings} → Game → {Game Over, You Win!}). Game Over and You Win! are full screens that replace the Game Screen. Try Again restarts the same level; Main Menu returns to the menu. All screen changes are immediate.
- `src/components/Screen.jsx`: wraps each screen, applies safe-area padding and the light/dark (`#D8D8D8`/`#000000`) background variant.
- Generic UI: `Button.jsx`, `Menu.jsx`, `TextBox.jsx`, `Overlay.jsx` implementing `graphical-specs.md` exactly — thin border in the text color, transparent fill, 0.5em padding, line height 1, uppercase, single line, C64 Angled font at the sizes listed in Decisions.

### Phase 2 — Audio manager
- `src/audio/soundManager.js` (Howler wrapper): loads all SFX and tracks via Vite imports; unlocks by playing `silence.mp3` on the Intro screen's first tap (which then advances to Main Menu; moved to the Enter screen's button in Phase 24); exposes `playSfx(name)`, `playTrack(name)` with crossfade, `stopTrack()` (fade out to silence, used by the Game Screen's start delay, Game Over and You Win!), `preloadTrack(name)` (load without playing, so the level track starts on time after the start delay), and "don't restart if same track" continuity (`audio-map.md` rules 1–4); music/SFX volume (10 steps, 0–9) persisted to `localStorage` and available on every screen (AGENTS.md rule 5).
- SFX mapping per `audio-map.md`: `launch` on spawn, `bounce` on paddle hit, `capture` on tap-destroy, `destroy` on escape, `vortex_creation` at the start of the core collapse.

### Phase 3 — Level data & loader
- Author `src/levels/level1.json`…`level5.json` against `docs/level-file-schema.json` (with `paddles` required). Level 1 is the easiest: slowest atoms, least frequent spawns, most lives, widest paddles; difficulty ramps up to level 5. Starting paddle values: 30° / 3 s, tuned per level. `name` values match the Level Select mockup; tracks per `audio-map.md` (`learn.mp3`…`mekanomancer.mp3`). `vfx` is `[]`.
- `src/game/levelLoader.js`: validates a level JSON and returns derived runtime values (`timerTenths`, `secondsPerBeat`, atom speed as a fraction of ring radius per second, spawn interval with random jitter, paddle arc in radians and duration, starting lives).

### Phase 4 — PixiJS GameEngine & entities
- `src/game/GameEngine.js`: owns the `PIXI.Application` and `app.ticker` loop; builds `ContainmentRing`, `AtomEmitter` (core), pooled `Atom`s and `Paddle`s; sizes the playfield from the viewport height and relayouts on resize.
- Input, per `game-rules.md`: `pointerdown` draws an inactive paddle at the pointer's angle, `pointermove` rotates it, `pointerup` sets it and starts its lifetime; a third paddle removes the oldest (first in, first out). A tap on an atom with charge ≥ 3 while it crosses the core destroys it.
- Collisions: atom ↔ active paddle arc reverses direction exactly and adds charge (max 10); atom ↔ ring with no paddle means escape: it fades out on the same path and costs a life.
- Start of level: 3-second start delay (see Decisions), then the engine starts the timer, spawns, input and the level track together.
- End of level: timer reaches 0 → 3-second core collapse (no spawns, no paddles, no input, no escapes), then containment and time-bonus scores are added and `onLevelWin` fires. Lives reach 0 → `onGameOver`.
- Emits only low-frequency callbacks (`onScoreChange`, `onLivesChange`, `onTimeChange`, `onGameOver`, `onLevelWin`) — no per-frame state crosses into React (AGENTS.md rule 2). Calls `app.destroy(true, { children: true, texture: true })` on teardown (rule 3); canvas container has `touchAction: 'none'` (rule 4).
- `src/game/entities/{AtomEmitter,ContainmentRing,Paddle,Atom}.js`: `PIXI.Graphics` vector shapes (white lines and filled circles on black, no textures) with per-entity `update(deltaMS)`.

### Phase 5 — Screens & HUD wiring
- `src/screens/{IntroScreen,MainMenuScreen,LevelSelectionMenuScreen,SettingsMenuScreen,GameScreen,GameOverScreen,YouWinScreen}.jsx`, each matching its `docs/mockups/*.png` mockup. Game Over and You Win! both show SCORE and HI-SCORE plus TRY AGAIN / MAIN MENU buttons.
- `src/components/HUD.jsx`: SCORE / TIME / HI-SCORE + life-dots row, updated only from the GameEngine's low-frequency callbacks (GAMEPLAY mockup layout).

### Phase 6 — Scoring & rules
- `src/game/scoring.js`: pure functions for the four score formulas in Decisions.
- `src/game/highScore.js`: reads/writes the high score in `localStorage` (`beatHiScore(score)` saves it the instant it's beaten); `App.jsx` calls it on every score change during gameplay, not just at level end, so it updates live on the HUD per `game-rules.md`.

### Phase 7 — QA pass (web)
- Manual verification per `implementation-guidelines.md` and the Verification section below, web build only; optional Vitest unit tests for scoring and level-loader math.

---

## Verification

- `npm run dev`: click through Intro → Main Menu → Level Select → Settings → Game → Game Over / You Win! → Try Again / Main Menu; compare each screen against its `docs/mockups/*.png` mockup at a landscape browser viewport, including font sizes (24/32/64px).
- Resize the browser window during gameplay: the ring stays centered and scales with the height; atom timing doesn't change.
- Manual gameplay pass on `level1`: 3-second start delay (timer, atoms and music start together), paddle placement (press/drag/release, lifetime starts on release, FIFO with a third paddle), straight-back bounce and charge, escape and life loss, tap-destroy at charge ≥ 3, timer countdown, 3-second safe core collapse, and score math (including the `timerTenths × level` time bonus) all match `game-rules.md`.
- High score updates live on the HUD when beaten and survives a reload.
- Audio: `silence.mp3` fires on the first Intro tap (the Enter screen's button from Phase 24) before any other sound; track continuity/crossfade across screens; the music fades out to silence on Game Over and You Win!; volume settings survive a reload.
- Production build (`npm run build` + `npm run preview`): assets load with hashed filenames.
