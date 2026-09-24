# Bouncerback — Implementation Plan

## Context

Bouncerback is fully documented (`AGENTS.md`, `docs/*`) but has zero implementation: no `package.json`, no bundler, no `src` code — only docs, mockups, and raw assets. The goal is to scaffold and implement the React + PixiJS + Capacitor game described in the docs.

Every doc, all seven mockups and the level schema were reviewed against each other. The gaps and contradictions found were resolved with the user; the resulting decisions are listed below and have also been written into the relevant docs (`game-rules.md`, `level-file-schema.json`, `navigation.md`, `project-structure.md`, `AGENTS.md`). If this plan and another doc disagree, the other doc is the source of truth and this plan should be corrected.

---

## Decisions

### Tooling & architecture
- **Bundler:** Vite (fast ESM dev server, pairs well with PixiJS v8's async `app.init()` and with Capacitor).
- **Language:** plain JavaScript/JSX — matches `eslint.config.js` (no TS parser) and `project-structure.md` (all `.jsx`/`.js` files).
- **PixiJS v8**, matching the async `app.init()` pattern in `docs/react-pixi-example.jsx`.
- **No routing library** — `App.jsx` is a simple state-based screen switcher, per `project-structure.md` ("router / screen switcher").
- **Screens only:** every screen lives in `src/screens/` and is built from the generic components in `src/components/` (`Button`, `Menu`, `TextBox`, `Overlay`, `HUD`, `Screen`). There are no separate `components/*Menu.jsx` files.
- **Game Over and You Win! are full screens**, not overlays: they replace the Game Screen (`GameOverScreen.jsx`, `YouWinScreen.jsx`). Only the Pause screen (cycle 2) is an overlay.
- **Assets are imported through Vite.** `assets/` stays at the repo root; code imports files (`import.meta.glob` / `?url`) so built filenames get a content hash (cache-busting) and only used files are shipped. The font is referenced from `src/index.css` by relative path so Vite processes it too.
- **Persistence:** `localStorage` for settings (music/SFX volume) and high score. Works identically in browser and Capacitor WebView; no extra plugin needed.
- **Orientation lock:** CSS/layout-based landscape in cycle 1; a "rotate your device" overlay and the `@capacitor/screen-orientation` native hard lock in cycle 2. The plugin isn't in `docs/tech-stack.md`'s stack table but is needed to satisfy AGENTS.md's "forced landscape orientation" on native.
- **Tests:** no test framework is specified in the docs. A few Vitest unit tests for pure logic (score formulas, level-loader math) are an optional nice-to-have; PixiJS/DOM rendering isn't practically unit-testable.
- **Mobile app icon:** `assets/images/icon.png` is the real square app icon; native icons/splash are generated from it in Phase 10.

### Gameplay
- **Bounce:** a paddle reverses an atom's direction exactly — it travels straight back through the core and out toward the opposite side of the ring (this is what makes the tap-at-the-core capture possible).
- **Paddle lifetime** (`paddles.duration`) starts when the paddle is set (pointer released). While dragging, the paddle is inactive and doesn't expire.
- **`paddles` is required** in the level schema. Suggested starting values: `angle` 30°, `duration` 3 s.
- **Start delay:** entering a level shows the ring and core, then waits **3 seconds** before the timer, the atom emitter, the level track and player input start. The menu track fades out during the delay and the level track is preloaded, so music and timer start together.
- **Swallow phase (timer reaches 0):** spawning stops, paddles disappear, input is disabled and every atom inside the ring is pulled into the core over **3 seconds**. Nothing can escape, so no lives can be lost; atoms already fading out after escaping are ignored. Then the You Win! screen is shown.
- **Score** (`level` = the level's number, 1–5):
  - Bounce: `10 × level × charge`, using the charge the atom has as it hits (before the bounce adds one).
  - Capture (tap-destroy at the core): `100 × level × charge`.
  - Containment at level end: `200 × level × charge × remaining lives` for every atom swallowed.
  - Time bonus at level end: `initial timer value (tenths of a second) × level`. Example: a 2-minute level 3 gives `1200 × 3 = 3600`.
- **Charge:** atoms start at 1, gain +1 per bounce, capped at 10; they can be tap-destroyed at the core once charge ≥ 3.
- **High score:** common to all levels, updated and saved the moment it's beaten, visible on the HUD, Game Over and You Win! screens.
- **Timing math:** `secondsPerBeat = 60 / bpm`. Atom pixel speed = `contactDistance / (atoms.travelTime × secondsPerBeat)`, where `contactDistance` is the distance from the core at which an atom touches a paddle (ring radius − half the paddle thickness − atom radius), so atoms reach the ring exactly `travelTime` beats after leaving the core. Initial timer (tenths of a second) = `round(duration × signature × secondsPerBeat × 10)`. Spawn interval = `atoms.frequency × signature × secondsPerBeat`, with the actual spawn at a random moment inside each interval.

### Layout & UI
- **Playfield scaling:** ring radius ≈ 31% of viewport height (a ring about 62% of the screen height, as in the GAMEPLAY mockup), centered; the core, atoms and paddle thickness scale with it. Recalculated on window resize/rotation. Because atom speed is defined in beats, gameplay timing is the same on every screen size.
- **Font sizes** (per `graphical-specs.md`): 24px HUD, 32px menu buttons, 64px "GAME OVER" / "YOU WIN!" titles. Line height 1, weight normal, always uppercase, single line.
- **UI scaling:** the mockups are 1:1 at 1920x1080. All UI sizes are written in mockup pixels (`--u` in `src/index.css`) and scale with the viewport (min of height/1080 and width/1920, floor 0.4px), so every screen keeps the mockup proportions on phones too. Button padding is 0.5em, as in the mockups.
- **Mockups win on on-screen text:** where a doc and a mockup disagree, follow the mockup. Labels: "HI-SCORE" (not "High Score"/"Best Score"), "TRY AGAIN" (not "Play Again"), "<<< BACK".
- **Level Select** buttons show each level file's `name` (LEARN, NEUTRONIKA, FEMTOCOSMOS, CHRONOSAEDR0N, MEKANOMANCER). All levels are unlocked in cycle 1; unlocking comes in cycle 2.
- **Try Again** restarts the same level from scratch (score reset to 0, lives from the level file).

### VFX vocabulary
`level-file-schema.json`'s `vfx[].name` and `graphical-specs.md`'s "optional effects" have no concrete identifiers yet. Two are introduced for cycle 2: `palette_invert` (black/white swap, used for the "one life left" state per graphical-specs) and `glow_pulse` (paddle glow). Level files can reference these by name in their `vfx` timeline; the one-life-left trigger fires `palette_invert` directly from game state regardless of the level's own vfx list.

---

## Development Cycles

Implementation is split into two cycles. The **first development cycle** builds a fully playable MVP in the browser: core navigation, audio, level data, the PixiJS game engine, and scoring. The following are deferred to the **second development cycle**:

- Pause game functionality and overlay (no Pause screen/button in cycle 1; the game simply runs until win/loss).
- Transitions between screens (all screen changes are immediate swaps in cycle 1).
- The "rotate your device" portrait overlay (cycle 1 still forces landscape via CSS/layout; the portrait-warning overlay and the native `@capacitor/screen-orientation` hard lock are both deferred).
- VFX (`palette_invert`, `glow_pulse`, and the "one life left" trigger). The `vfx` field stays in the level files as an empty array (`[]`) in cycle 1.
- Level unlocking (all levels are playable from the start in cycle 1).
- Results ambience track (Game Over and You Win! are silent in cycle 1: the music just fades out).
- Visual cue for capturable atoms (charge ≥ 3). In cycle 1 all atoms look the same.
- Mobile build (Capacitor `ios`/`android` packaging, native icons/splash, native orientation lock). Cycle 1 targets the web build only; Capacitor deps are installed in Phase 0 but `cap add`/`cap sync` and everything native happen in cycle 2.

---

## First Development Cycle (MVP)

### Phase 0 — Project scaffolding
- `package.json`, Vite + `@vitejs/plugin-react`, deps: `react`, `react-dom`, `pixi.js@^8`, `howler`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/screen-orientation` (Capacitor deps are installed now but only used from Phase 10).
- `index.html`, `src/main.jsx`, `capacitor.config.json` (placeholder appId/appName).
- `src/index.css`: `@font-face` for `assets/fonts/c64_angled.ttf` (relative path, processed by Vite), global reset, black background, `env(safe-area-inset-*)` padding, base `touch-action: none`.

### Phase 1 — App shell & navigation
- `src/App.jsx`: screen-state switcher covering `navigation.md`'s flow (Intro → Main Menu → {Level Select, Settings} → Game → {Game Over, You Win!}). Game Over and You Win! are full screens that replace the Game Screen. Try Again restarts the same level; Main Menu returns to the menu. All screen changes are immediate.
- `src/components/Screen.jsx`: wraps each screen, applies safe-area padding and the light/dark (`#DDDDDD`/`#000000`) background variant.
- Generic UI: `Button.jsx`, `Menu.jsx`, `TextBox.jsx`, `Overlay.jsx` implementing `graphical-specs.md` exactly — thin border in the text color, transparent fill, 0.5em padding, line height 1, uppercase, single line, C64 Angled font at the sizes listed in Decisions.

### Phase 2 — Audio manager
- `src/audio/soundManager.js` (Howler wrapper): loads all SFX and tracks via Vite imports; unlocks by playing `silence.mp3` on the Intro screen's first tap (which then advances to Main Menu); exposes `playSfx(name)`, `playTrack(name)` with crossfade, `stopTrack()` (fade out to silence, used by the Game Screen's start delay, Game Over and You Win!), `preloadTrack(name)` (load without playing, so the level track starts on time after the start delay), and "don't restart if same track" continuity (`audio-map.md` rules 1–4); music/SFX volume (10 steps, 0–9) persisted to `localStorage` and available on every screen (AGENTS.md rule 5).
- SFX mapping per `audio-map.md`: `launch` on spawn, `bounce` on paddle hit, `capture` on tap-destroy, `destroy` on escape, `vortex_creation` at the start of the swallow.

### Phase 3 — Level data & loader
- Author `src/levels/level1.json`…`level5.json` against `docs/level-file-schema.json` (with `paddles` required). Level 1 is the easiest: slowest atoms, least frequent spawns, most lives, widest paddles; difficulty ramps up to level 5. Starting paddle values: 30° / 3 s, tuned per level. `name` values match the Level Select mockup; tracks per `audio-map.md` (`learn.mp3`…`mekanomancer.mp3`). `vfx` is `[]`.
- `src/game/levelLoader.js`: validates a level JSON and returns derived runtime values (`timerTenths`, `secondsPerBeat`, atom speed as a fraction of ring radius per second, spawn interval with random jitter, paddle arc in radians and duration, starting lives).

### Phase 4 — PixiJS GameEngine & entities
- `src/game/GameEngine.js`: owns the `PIXI.Application` and `app.ticker` loop; builds `ContainmentRing`, `AtomEmitter` (core), pooled `Atom`s and `Paddle`s; sizes the playfield from the viewport height and relayouts on resize.
- Input, per `game-rules.md`: `pointerdown` draws an inactive paddle at the pointer's angle, `pointermove` rotates it, `pointerup` sets it and starts its lifetime; a third paddle removes the oldest (first in, first out). A tap on an atom with charge ≥ 3 while it crosses the core destroys it.
- Collisions: atom ↔ active paddle arc reverses direction exactly and adds charge (max 10); atom ↔ ring with no paddle means escape: it fades out on the same path and costs a life.
- Start of level: 3-second start delay (see Decisions), then the engine starts the timer, spawns, input and the level track together.
- End of level: timer reaches 0 → 3-second swallow (no spawns, no paddles, no input, no escapes), then containment and time-bonus scores are added and `onLevelWin` fires. Lives reach 0 → `onGameOver`.
- Emits only low-frequency callbacks (`onScoreChange`, `onLivesChange`, `onTimeChange`, `onGameOver`, `onLevelWin`) — no per-frame state crosses into React (AGENTS.md rule 2). Calls `app.destroy(true, { children: true, texture: true })` on teardown (rule 3); canvas container has `touchAction: 'none'` (rule 4).
- `src/game/entities/{AtomEmitter,ContainmentRing,Paddle,Atom}.js`: `PIXI.Graphics` vector shapes (white lines and filled circles on black, no textures) with per-entity `update(deltaMS)`.

### Phase 5 — Screens & HUD wiring
- `src/screens/{IntroScreen,MainMenuScreen,LevelSelectionMenuScreen,SettingsMenuScreen,GameScreen,GameOverScreen,YouWinScreen}.jsx`, each matching its `docs/mockups/*.png` mockup. Game Over and You Win! both show SCORE and HI-SCORE plus TRY AGAIN / MAIN MENU buttons.
- `src/components/HUD.jsx`: SCORE / TIME / HI-SCORE + life-dots row, updated only from the GameEngine's low-frequency callbacks (GAMEPLAY mockup layout).

### Phase 6 — Scoring & rules
- `src/game/scoring.js`: pure functions for the four score formulas in Decisions, plus the high-score update that saves to `localStorage` the moment it's beaten.

### Phase 7 — QA pass (web)
- Manual verification per `implementation-guidelines.md` and the Verification section below, web build only; optional Vitest unit tests for scoring and level-loader math.

---

## Second Development Cycle (Quality of Life)

Builds on top of the playable MVP from the first cycle. Each item below assumes cycle 1 is complete and merged.

### Phase 8 — Pause functionality
- `src/screens/PauseOverlay.jsx` (the only overlay screen), with Resume / Settings / Main Menu per `navigation.md`. No mockup exists yet; follow the style of the other menus.
- A Pause button (top-right of the Game Screen) stops `app.ticker`; Resume restarts it. Settings opened from Pause returns to Pause without losing game state.

### Phase 9 — Screen transitions
- Replace the immediate screen swaps in `src/App.jsx` / `Screen.jsx` with animated transitions (a simple, consistent fade or cut unless the specs define one).

### Phase 10 — Mobile packaging
- **Prerequisites (verify before starting):** full **Xcode** app installed from the App Store (Xcode Command Line Tools alone are not sufficient for `npx cap add ios` or building/running in the iOS Simulator — confirm with `xcodebuild -version`; if it errors, install Xcode and run `xcode-select -s /Applications/Xcode.app`), and Android Studio + Android SDK for the Android side. See `docs/tech-stack.md` §4.
- `npx cap add ios android` (generated output is off-limits to hand-edit per AGENTS.md — only touch it via the Capacitor CLI), wire `@capacitor/screen-orientation` to lock landscape on native, generate icons/splash from `assets/images/icon.png`.

### Phase 11 — Rotate-device overlay
- Add the portrait "rotate your device" overlay to `src/components/Screen.jsx`, shown whenever the viewport is portrait (covers desktop browsers without a reliable orientation-lock API, and native before the Phase 10 hard lock takes effect).

### Phase 12 — Visual effects
- Small vfx registry (`palette_invert`, `glow_pulse`) driven both by a level's `vfx` timeline (bar offset → seconds, via the loader) and directly by game state (one life left → `palette_invert`).
- Fill in the `vfx` arrays in `src/levels/level1.json`…`level5.json`.

### Phase 13 — Level unlocking
- Only level 1 is available at first; winning a level unlocks the next, saved in `localStorage`. Needs a visual style for locked buttons on Level Select (to be designed).

### Phase 14 — Results ambience track
- Compose a dedicated ambience track for the Game Over and You Win! screens (silent in cycle 1) and add it to `assets/audio/tracks/` and `docs/audio-map.md`; those screens call `playTrack` with it instead of `stopTrack()`.

### Phase 15 — Capturable atom cue
- Make atoms with charge ≥ 3 (capturable at the core) visually distinct from the others, so the player knows which ones can be tapped. Style to be designed; it must stay within the 2D vector, white-on-black rules of `graphical-specs.md`.

---

## Verification

### First development cycle
- `npm run dev`: click through Intro → Main Menu → Level Select → Settings → Game → Game Over / You Win! → Try Again / Main Menu; compare each screen against its `docs/mockups/*.png` mockup at a landscape browser viewport, including font sizes (24/32/64px).
- Resize the browser window during gameplay: the ring stays centered and scales with the height; atom timing doesn't change.
- Manual gameplay pass on `level1`: 3-second start delay (timer, atoms and music start together), paddle placement (press/drag/release, lifetime starts on release, FIFO with a third paddle), straight-back bounce and charge, escape and life loss, tap-destroy at charge ≥ 3, timer countdown, 3-second safe swallow, and score math (including the `timerTenths × level` time bonus) all match `game-rules.md`.
- High score updates live on the HUD when beaten and survives a reload.
- Audio: `silence.mp3` fires on the first Intro tap before any other sound; track continuity/crossfade across screens; the music fades out to silence on Game Over and You Win!; volume settings survive a reload.
- Production build (`npm run build` + `npm run preview`): assets load with hashed filenames.

### Second development cycle
- Pause/Resume works mid-game via `app.ticker` stop/start, and Settings/Main Menu are reachable from Pause without losing game state incorrectly.
- Screen transitions play consistently across every navigation path in `navigation.md`.
- `npx cap sync` completes cleanly; app boots in an Android/iOS simulator with landscape locked and audio unlocking on first tap.
- Rotate-device overlay appears in a portrait emulated viewport (browser and native) and disappears when rotated back to landscape.
- VFX fire at the correct level-timeline moments and the "one life left" `palette_invert` triggers correctly.
- Level unlocking: only level 1 is available on a fresh install; winning unlocks the next one and survives a reload.
- Game Over and You Win! play the ambience track; returning to the menu crossfades back to `main_title.mp3`.
- Atoms with charge ≥ 3 are visually distinct, and the cue appears on the bounce that brings an atom to charge 3.
