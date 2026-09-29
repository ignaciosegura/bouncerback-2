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
- **Late bounce (grace window):** an atom reaching the paddles (`contactDistance`) with no paddle covering it doesn't escape yet: it keeps moving and is checked every frame until its center crosses the ring (`RING_RADIUS`), and only then escapes (life lost). A paddle set inside that window bounces it, mirrored around `contactDistance` so it stays on the beat — a visible jump back of up to twice the window, accepted as a trade-off.
- **Paddle lifetime** (`paddles.duration`) starts when the paddle is set (pointer released). While dragging, the paddle is inactive and doesn't expire.
- **Paddle lifetime fade (cycle 2):** a set paddle stays at full opacity for the first half of its lifetime; during the second half its opacity drops linearly from 100% to 20%, then it disappears. A freshly set paddle is always fully visible, and the fade starting means half of its time is gone. The 20% floor keeps a paddle that is still blocking atoms clearly visible until the moment it expires. Dragged (inactive) paddles are always drawn at full opacity; the fade is purely visual and doesn't change the collision rules.
- **Paddle bounce flash (cycle 2):** a subtle echo of the paddle that bounced the atom: a semi-transparent white arc with the paddle's angle, arc length and thickness, starting on top of the paddle and drifting outward by about half a paddle thickness while fading out in 0.2 s, like a slight recoil. It never reaches further inside the ring than the paddle itself, so it never clutters the playable area. Each paddle has a single echo: a new bounce on the same paddle while its echo is still playing interrupts it and restarts it from the beginning. Two different paddles can show their echoes at the same time. The echo plays to the end even if its paddle expires or is replaced right after the bounce. Purely cosmetic: eye candy that complements the `bounce` SFX.
- **Larger core (cycle 2):** the core radius grows 25%, `CORE_RADIUS` 20 → 25. The capture window (`CORE_CROSSING_DISTANCE = CORE_RADIUS + ATOM_RADIUS`, "the atom overlaps the core") grows with it, 40 → 45 px from the center, so capturing gets slightly easier. That's intended: the window the player sees and the window in which a tap captures stay the same. `CAPTURE_TAP_RADIUS` (60) is still larger than the window and doesn't change.
- **Capture window pulse (cycle 2):** a charged atom (charge ≥ 3, `MOVING`) that overlaps the core emits one pulse per beat of the music. Beats are counted on the level's beat grid (`floor(time / secondsPerBeat)`, where `time` starts together with the music), not from the moment the atom enters the core, so the pulses match the music. Atoms spawn at random moments, so the entry point is off-grid. The first pulse comes on the first beat after entry, not on entry. At most 3 pulses per crossing (`MAX_PULSES_PER_CROSSING`): on long crossings (`travelTime` 16) later beats come as the atom is leaving the core, so most of their fade would play once it can no longer be captured. With the larger core a crossing lasts 90 × `travelTime` / 305 beats (≈ 2.4 beats at `travelTime` 8, the shortest in the current levels), so every crossing gets at least two pulses. A pulse is a filled circle in the atom's current color, drawn behind the atom and following it. Its radius grows from `ATOM_RADIUS` to `2 × ATOM_RADIUS` (ease-out) while its alpha goes from 0.5 to 0 over one beat, so each pulse ends as the next one starts. The capture test and the pulse test share one predicate, so the cue can never disagree with what a tap does. Purely visual; no SFX.
- **Capture animation (cycle 2):** a captured atom no longer vanishes instantly. Over **0.5 s** it moves from where it was tapped to the center of the core while shrinking from full size to 0, both on the same ease-in (quadratic) curve: slow at first, fast at the end, so it looks sucked into the core. It stops travelling along its path the moment it's captured. The score and the `capture` SFX still happen on the tap; the animation is purely visual. A capturing atom keeps its current color, can't be captured again (a second tap takes the next capturable atom, if any), doesn't pulse, and ignores collisions (it's already inside the core). A pulse in progress is cut off at capture, since the atom is no longer capturable. If the core collapse starts during the animation, the animation finishes as normal (like an escaping atom's fade) and the atom doesn't count for containment, because it was already captured.
- **`paddles` is required** in the level schema. Suggested starting values: `angle` 30°, `duration` 3 s.
- **Start delay:** entering a level shows the ring and core, then waits **3 seconds** before the timer, the atom emitter, the level track and player input start. The menu track fades out during the delay and the level track is preloaded, so music and timer start together.
- **Core collapse (timer reaches 0):** spawning stops, paddles disappear, input is disabled and every atom inside the ring is pulled into the core over **3 seconds** (**2 seconds** from cycle 2, see "Core collapse animation"). Nothing can escape, so no lives can be lost; atoms already fading out after escaping are ignored. Then the You Win! screen is shown.
- **Core collapse animation (cycle 2):** replaces cycle 1's spiral pull and plays together with the `vortex_creation` SFX. It has two stages:
  - **Settle (0 → 1.85 s):** the core's radius grows from `CORE_RADIUS` to `RING_RADIUS` (ease-in-out) while its fill fades from transparent to `#888888` (fill alpha 0 → 1 with the same easing, so it looks right over the dark red one-life background too). The outline grows with it and turns from white to `#888888` with the same easing. At the same time every collapsing atom slows down to a stop with an ease-out (quadratic) curve. It keeps moving in its own direction and starts at its playing speed, so there's no jolt at the start. That gives it a total drift of `speed × 1.85 / 2`, half the distance it would cover at full speed.
  - **Collapse (1.85 → 2 s):** the core shrinks from `RING_RADIUS` to 0 (ease-in). Every atom moves from its resting point to the center and shrinks from full size to 0, using the same ease-in curve, so the atoms and the core arrive together.
  - No collision checks during the core collapse. An atom that was near the ring (or already in the grace window) can drift past the ring before it stops. That's accepted: it still collapses into the core and never escapes. Atoms keep their charge colors and are drawn over the grey core; nothing spins.
- **Score** (`level` = the level's number, 1–5):
  - Bounce: `10 × level × charge`, using the charge the atom has as it hits (before the bounce adds one).
  - Capture (tap-destroy at the core): `100 × level × charge`.
  - Containment at level end: `200 × level × charge × remaining lives` for every atom taken by the core collapse.
  - Time bonus at level end: `initial timer value (tenths of a second) × level`. Example: a 2-minute level 3 gives `1200 × 3 = 3600`.
- **Charge:** atoms start at 1, gain +1 per bounce, capped at 10; they can be tap-destroyed at the core once charge ≥ 3.
- **High score:** common to all levels, updated and saved the moment it's beaten, visible on the HUD, Game Over and You Win! screens.
- **Timing math:** `secondsPerBeat = 60 / bpm`. Atom pixel speed = `contactDistance / (atoms.travelTime × secondsPerBeat)`, where `contactDistance` is the distance from the core at which an atom touches a paddle (ring radius − half the paddle thickness − atom radius), so atoms reach the ring exactly `travelTime` beats after leaving the core. Initial timer (tenths of a second) = `round(duration × signature × secondsPerBeat × 10)`. Spawn interval = `atoms.barsInterval × signature × secondsPerBeat`: an atom can only appear once every `barsInterval` bars, at a random moment inside each interval.

### Layout & UI
- **Playfield scaling:** ring radius ≈ 31% of viewport height (a ring about 62% of the screen height, as in the GAMEPLAY mockup), centered; the core, atoms and paddle thickness scale with it. Recalculated on window resize/rotation. Because atom speed is defined in beats, gameplay timing is the same on every screen size.
- **Font sizes** (per `graphical-specs.md`): 24px HUD, 32px menu buttons, 64px "GAME OVER" / "YOU WIN!" titles. Line height 1, weight normal, always uppercase, single line.
- **UI scaling:** the mockups are 1:1 at 1920x1080. All UI sizes are written in mockup pixels (`--u` in `src/index.css`) and scale with the viewport (min of height/1080 and width/1920, floor 0.4px), so every screen keeps the mockup proportions on phones too. Button padding is 0.5em, as in the mockups.
- **Mockups win on on-screen text:** where a doc and a mockup disagree, follow the mockup. Labels: "HI-SCORE" (not "High Score"/"Best Score"), "TRY AGAIN" (not "Play Again"), "<<< BACK".
- **Level Select** buttons show each level file's `name` (LEARN, NEUTRONIKA, FEMTOCOSMOS, CHRONOSAEDR0N, MEKANOMANCER). All levels are unlocked in cycle 1; unlocking comes in cycle 2.
- **Try Again** restarts the same level from scratch (score reset to 0, lives from the level file).
- **Menu background animation (cycle 2):** `assets/motion/intro_animation.json` (Lottie, 1920x1080, 60 fps, transparent background, light-grey/white lines) plays behind the Intro, Main Menu, Level Select and Settings screens, on top of the `#DDDDDD` background. It plays uninterrupted while the player moves between those four screens: it is one instance mounted in `App.jsx` outside the screens, so switching screens never restarts it. Leaving for the Game Screen unmounts it; returning to the menus from Game Over / You Win! starts it again from frame 0. The file's timeline is 10,800 frames (180 s), but its content ends at frame 7485 and the original project is lost, so it can't be re-exported: we loop frames **0 → 7785** (the content plus 5 s / 300 frames of the empty tail) and skip the rest of the empty tail. The file uses `loopOut('cycle')` expressions on two time-remapped layers, so it needs lottie-web's SVG player with expression support (`lottie_svg`), not `lottie_light`. It scales like a cover background (`xMidYMid slice`): it fills the whole viewport, cropping top/bottom on screens wider than 16:9, and ignores safe areas.

### VFX vocabulary
`level-file-schema.json`'s `vfx[].name` and `graphical-specs.md`'s "optional effects" have no concrete identifiers yet. Two are introduced for cycle 2: `palette_invert` (black/white swap) and `glow_pulse` (paddle glow). Level files can reference these by name in their `vfx` timeline. The "one life left" state is not a timeline vfx: per graphical-specs "Visual feedback", the gameplay background fades to dark red (`#660000`) over 0.5 s, driven directly by game state regardless of the level's own vfx list.

---

## Development Cycles

Implementation is split into two cycles. The **first development cycle** builds a fully playable MVP in the browser: core navigation, audio, level data, the PixiJS game engine, and scoring. The following are deferred to the **second development cycle**:

- Pause game functionality and overlay (no Pause screen/button in cycle 1; the game simply runs until win/loss).
- Transitions between screens (all screen changes are immediate swaps in cycle 1).
- The "rotate your device" portrait overlay (cycle 1 still forces landscape via CSS/layout; the portrait-warning overlay and the native `@capacitor/screen-orientation` hard lock are both deferred).
- VFX (`palette_invert`, `glow_pulse`, and the "one life left" dark red background). The `vfx` field stays in the level files as an empty array (`[]`) in cycle 1.
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

### Phase 12 — Optional visual effects
- Small vfx registry (`palette_invert`, `glow_pulse`) driven by a level's `vfx` timeline (bar offset → seconds, via the loader).
- Fill in the `vfx` arrays in `src/levels/level1.json`…`level5.json`.

### Phase 13 — Level unlocking
- Only level 1 is available at first; winning a level unlocks the next, saved in `localStorage`. Needs a visual style for locked buttons on Level Select (to be designed).

### Phase 14 — Results ambience track
- Compose a dedicated ambience track for the Game Over and You Win! screens (silent in cycle 1) and add it to `assets/audio/tracks/` and `docs/audio-map.md`; those screens call `playTrack` with it instead of `stopTrack()`.

### Phase 15 — Capturable atom cue
- Make atoms with charge ≥ 3 (capturable at the core) visually distinct from the others, so the player knows which ones can be tapped. Per graphical-specs "Visual feedback": at charge 3 the atom fades from white to yellow (`#FFFF00`), then shifts a step closer to red (`#FF0000`) on each further charge, reaching red at charge 10. Each color change transitions over 0.5 s.

### Phase 16 — One-life-left background
- "One life left" state, driven directly by game state (not part of the level `vfx` timeline): the gameplay background fades from black to dark red (`#660000`) over 0.5 s (graphical-specs "Visual feedback").

### Phase 17 — Late-paddle grace window
- An atom with no paddle at the contact distance keeps being checked every frame until its center crosses the ring; only then does it escape. A paddle set within that window bounces it, repositioned back on the beat (see "Late bounce" in Decisions).

### Paddle visual feedback (Phases 18–19)
Two small, independent phases that make the paddles easier to read. Neither changes gameplay, timing or scoring; both stay within the white-on-black vector style (opacity only, no new colors).

### Phase 18 — Paddle lifetime fade
- Gives the player a visual cue of how much time a set paddle has left (see "Paddle lifetime fade" in Decisions and graphical-specs "Visual feedback").
- `src/game/entities/Paddle.js`: in `update(dt)`, set `view.alpha` from the paddle's age: 1 while `age < duration / 2`, then `1 − 0.8 × (age − duration / 2) / (duration / 2)` (100% → 20% over the second half), as tunable constants (`FADE_START = 0.5` as a fraction of the lifetime, `FADE_MIN_ALPHA = 0.2`). Only active paddles fade: `start()` and `activate()` reset `view.alpha` to 1, so a paddle reused from the pool never keeps a faded alpha.
- Using `view.alpha` (not a redraw) keeps the per-frame cost at zero extra `Graphics` work. Expiry, FIFO removal and the core collapse still hide the paddle instantly, as today.
- Pause freezes the fade automatically, since `update()` runs on `app.ticker`.

### Phase 19 — Paddle bounce flash
- Visual counterpart to the `bounce` SFX (see "Paddle bounce flash" in Decisions and graphical-specs "Visual feedback").
- New `src/game/entities/PaddleFlash.js`: a `PIXI.Graphics` arc, one per `Paddle` instance (created with it, so pooled paddles reuse their flash). `start(angle, arc)` (re)starts it at the paddle's angle from time 0, interrupting a flash already in progress. `update(dt)` draws a single arc stroke, white, `PADDLE_THICKNESS` wide with butt caps (like a set paddle). It starts on top of the paddle (center radius `RING_RADIUS`) and drifts outward by `FLASH_DRIFT = 0.5` paddle thicknesses (ease-out), so it never reaches further inside the ring than the paddle. Its alpha fades from `FLASH_START_ALPHA = 0.2` to 0 over `FLASH_DURATION = 0.2` s, then it hides itself. All values are tunable constants; keep the effect subtle.
- `src/game/GameEngine.js`: a `flashLayer` container below the paddle layer holding the flashes' views (separate from the paddle's own view, so hiding an expired paddle doesn't hide its flash). In the bounce branch of the atom update, replace `activePaddles.some(...)` with `find(...)` so the engine knows which paddle bounced the atom, and call that paddle's `flash.start(...)`. Late bounces (grace window) flash too.
- Flashes are updated in the ticker for every paddle instance (active or pooled; an idle flash returns immediately), keep playing when their paddle expires or is removed, are allowed to finish during the core collapse, and are hidden on level restart and teardown. No state goes to React.

### Phase 20 — Capture window feedback
- Tells the player when a charged atom can be captured (see "Larger core" and "Capture window pulse" in Decisions and graphical-specs "Visual feedback"). The capture rules don't change; only the core radius, which also sets the capture window.
- `src/game/entities/AtomEmitter.js`: `CORE_RADIUS` 20 → 25. `CORE_CROSSING_DISTANCE` in `GameEngine.js` already derives from it, so the capture window follows without other changes.
- New `src/game/entities/AtomPulse.js`: a `PIXI.Graphics` filled circle of radius `ATOM_RADIUS`, drawn white and colored with `tint`, one per `Atom` instance (created with it, so pooled atoms reuse their pulse). It's a separate object because PixiJS v8 `Graphics` can't hold children. `start(color, duration)` (re)starts it from time 0. `update(dt, x, y)` moves it to the atom's position, scales it from 1 to `PULSE_MAX_SCALE = 2` (ease-out) and fades its alpha from `PULSE_START_ALPHA = 0.5` to 0 over `duration`, then hides itself. `hide()` stops it at once. All values are tunable constants.
- `src/game/entities/Atom.js`: owns its `pulse`. `spawn()` hides it. `render(dt)` updates it at the atom's position and keeps its `tint` on `this.color`, so a pulse started during a color transition still follows the atom's color. Hiding the atom (capture, escape fade end, release, restart) also hides its pulse.
- `src/game/GameEngine.js`:
  - A `pulseLayer` container between the emitter and the atom layer, holding the pulses' views, so pulses are drawn over the core and behind every atom.
  - Pull the capture test out of `captureAtCore()` into a shared `isCapturable(atom)` (`MOVING`, charge ≥ `CAPTURE_MIN_CHARGE`, `|distance| ≤ CORE_CROSSING_DISTANCE`), used by both capture and the pulse.
  - In `updatePlaying`, after the atoms have moved, compute `beat = floor(this.time / level.secondsPerBeat)`. When it differs from `this.lastBeat`, store it and call `atom.startPulse(level.secondsPerBeat)` for every atom where `isCapturable(atom)` is true, as long as its `pulseCount` for the current crossing is below `MAX_PULSES_PER_CROSSING = 3`; an atom that isn't capturable on a beat resets its `pulseCount` to 0 (it also resets on spawn). `lastBeat` resets with the rest of the level state on start and Try Again.
  - Core collapse: no new pulses (capture is impossible), and `startCoreCollapse()` hides the pulses in progress. Pause freezes them automatically, since everything runs on `app.ticker`. No state goes to React.

### Phase 21 — Core collapse animation
- Replaces the cycle-1 core collapse (quadratic pull and spin over 3 s) with the timed animation described in "Core collapse animation" in Decisions and in graphical-specs "Visual feedback". The rules don't change (no spawns, paddles, input or escapes; same containment and time bonus). Only the duration changes, 3 → 2 s.
- New `src/game/easing.js`: `easeOutQuad`, `easeInOutQuad`, `easeInQuad`, each mapping 0 → 1 onto 0 → 1. Phases 19 and 20 can reuse `easeOutQuad`.
- `src/game/entities/AtomEmitter.js`: `drawCollapse(radius, fade)` clears the `Graphics` and redraws one circle: fill `VORTEX_COLOR = 0x888888` at alpha `fade`, then the `LINE_WIDTH` stroke on top, its color interpolated from white to `VORTEX_COLOR` by `fade`. It redraws instead of scaling the view so the outline stays 2 px wide at ring size. At radius 0 it hides the view. That's one circle per frame and only during the core collapse, so the cost is negligible.
- `src/game/entities/Atom.js`: `startCollapse(speed, settleTime)` stores `collapseFrom = distance` and `collapseDrift = direction × speed × settleTime / 2`. `updateCollapse(settle, collapse)` (both already eased, 0 → 1) sets `distance = (collapseFrom + collapseDrift × settle) × (1 − collapse)` and `scale = 1 − collapse`, with no spin. During the settle `collapse` is 0, and at `settle = 1` the atom is at its resting point, where the collapse starts.
- `src/game/GameEngine.js`:
  - Constants: `CORE_COLLAPSE_SETTLE_TIME = 1.85`, `CORE_COLLAPSE_TIME = 3 → 2` (the collapse takes the difference). Remove `CORE_COLLAPSE_SPIN`.
  - `startCoreCollapse()`: calls `atom.startCollapse(this.atomSpeed, CORE_COLLAPSE_SETTLE_TIME)`. Everything else stays as it is, including `playSfx('vortex_creation')`.
  - `updateCollapsing(dt)`: with `t = stateTime`, `grow = easeInOutQuad(min(1, t / SETTLE))`, `settle = easeOutQuad(min(1, t / SETTLE))` and `collapse = easeInQuad(clamp01((t − SETTLE) / (CORE_COLLAPSE_TIME − SETTLE)))`. The emitter's radius is `CORE_RADIUS + (RING_RADIUS − CORE_RADIUS) × grow` until the collapse starts, then `RING_RADIUS × (1 − collapse)`, and its fade (fill alpha and outline color) is `grow`. Each collapsing atom calls `updateCollapse(settle, collapse)`, then `render(dt)`, so charge color transitions finish. Escaping atoms keep fading as today. `win()` runs once `t ≥ CORE_COLLAPSE_TIME`, after the final frame (everything at radius 0) has been rendered.
  - Layer order doesn't change. The emitter stays above the ring and paddles and below the atoms, so the grey disc covers the ring's inner half and the atoms stay on top of it. Atoms that drifted past the ring stay visible.
- The emitter doesn't need a reset: the Game Screen unmounts on You Win!, and Try Again builds a new `GameEngine`. No state goes to React.
- Pause (`P`) freezes the animation through `app.ticker`, but the SFX keeps playing (SFX aren't paused anywhere yet). Phase 8 should handle that.

### Phase 22 — Capture animation
- Visual feedback for a successful capture (see "Capture animation" in Decisions and graphical-specs "Visual feedback"). The capture rules, score and SFX don't change; only what happens to the atom after the tap.
- `src/game/entities/Atom.js`:
  - `ATOM_STATE.CAPTURING` alongside `MOVING`, `ESCAPING` and `COLLAPSING`. Constant `CAPTURE_TIME = 0.5`.
  - `startCapture()`: sets the state to `CAPTURING`, stores `captureFrom = distance`, resets `captureTime = 0` and hides the pulse.
  - `updateCapture(dt)`: advances `captureTime`; with `p = easeInQuad(min(1, captureTime / CAPTURE_TIME))` sets `distance = captureFrom × (1 − p)` and `view.scale = 1 − p`, then calls `render(dt)` (so a charge color transition in progress keeps going). Returns `false` once `captureTime ≥ CAPTURE_TIME`, after rendering the final frame (radius 0 at the center), like `updateEscape`.
  - `spawn()` already resets `view.scale` to 1, so a pooled atom never keeps a shrunk scale.
- `src/game/GameEngine.js`:
  - `captureAtCore()`: keep the target search, `addScore` and `playSfx('capture')`; replace `releaseAtom(target)` with `target.startCapture()`. The atom stays in `this.atoms` until its animation ends.
  - `isCapturable()` needs no change: it already requires `MOVING`, so a capturing atom can't be captured twice and never pulses.
  - `updatePlaying`: in the per-atom loop, route `CAPTURING` atoms (next to the `ESCAPING` branch) to a new `updateCapturingAtom(atom, dt)`, which calls `atom.updateCapture(dt)` and `releaseAtom(atom)` when it returns `false`. No `move()`, no contact check.
  - Core collapse: `startCoreCollapse()` only takes `MOVING` atoms, so capturing atoms are left out of the collapse and of the containment score. The animation (0.5 s) always ends before `win()` (2 s).
  - `updateEscapingAtoms` becomes `updateVanishingAtoms`, which advances both escaping and capturing atoms. `updateCollapsing` and `updateLost` call it, so a capture animation also finishes during the core collapse and the Game Over delay.
- Pause freezes the animation through `app.ticker`. Try Again needs nothing extra: it builds a new `GameEngine`. No state goes to React.

### Phase 23 — Menu background animation
- Plays the Lottie animation behind the menu screens (see "Menu background animation" in Decisions and graphical-specs "Menu background animation"). DOM layer, React domain: PixiJS isn't involved and no animation state goes to React (lottie-web runs its own `requestAnimationFrame` loop).
- Dependency: `lottie-web`, imported as `lottie-web/build/player/lottie_svg` (SVG renderer with expressions). The JSON is imported through Vite like the other assets.
- `src/components/MenuBackground.jsx`:
  - A full-viewport `div.menu-background` (`position: absolute; inset: 0; pointer-events: none; background: var(--color-white-bg)`), used as the Lottie container.
  - `useEffect`: `lottie.loadAnimation({ container, renderer: 'svg', animationData, loop: true, autoplay: false, rendererSettings: { preserveAspectRatio: 'xMidYMid slice' } })`, then `anim.playSegments([0, LOOP_END_FRAME], true)` with `LOOP_END_FRAME = 7785` (content ends at 7485, plus 300 frames = 5 s of the empty tail). Cleanup calls `anim.destroy()`, the same way the Game Screen destroys the PixiJS app.
- `src/App.jsx`:
  - Move the screen `switch` into a `renderScreen()` helper, and return `<>{showMenuBackground ? <MenuBackground /> : null}{renderScreen()}</>`, where `showMenuBackground` is true on `INTRO`, `MAIN_MENU`, `LEVEL_SELECT` and `SETTINGS`.
  - The background always sits in the same place in the tree, outside the screen components, so React keeps the same instance (and the animation keeps playing) when the screen changes between those four screens. It unmounts on `GAME` and mounts fresh (frame 0) when coming back from Game Over / You Win!.
- `src/components/Screen.jsx` + `src/index.css`: a `transparent` prop (`screen--transparent`) that drops the screen's own background but keeps the `light` colors (black text and borders), so the animation shows through. `IntroScreen`, `MainMenuScreen`, `LevelSelectionMenuScreen` and `SettingsMenuScreen` use `<Screen variant="light" transparent>`. Screens come after the background in the DOM, so they sit on top of it and keep receiving taps and clicks (the Intro's tap-anywhere included).
- Phase 9 (screen transitions), when implemented, must animate the screens only, not the background, so the animation stays continuous.
- The Settings screen opened from the Pause overlay (Phase 8) is out of scope here: it's shown over the game, where the background isn't mounted.

---

## Verification

### First development cycle
- `npm run dev`: click through Intro → Main Menu → Level Select → Settings → Game → Game Over / You Win! → Try Again / Main Menu; compare each screen against its `docs/mockups/*.png` mockup at a landscape browser viewport, including font sizes (24/32/64px).
- Resize the browser window during gameplay: the ring stays centered and scales with the height; atom timing doesn't change.
- Manual gameplay pass on `level1`: 3-second start delay (timer, atoms and music start together), paddle placement (press/drag/release, lifetime starts on release, FIFO with a third paddle), straight-back bounce and charge, escape and life loss, tap-destroy at charge ≥ 3, timer countdown, 3-second safe core collapse, and score math (including the `timerTenths × level` time bonus) all match `game-rules.md`.
- High score updates live on the HUD when beaten and survives a reload.
- Audio: `silence.mp3` fires on the first Intro tap before any other sound; track continuity/crossfade across screens; the music fades out to silence on Game Over and You Win!; volume settings survive a reload.
- Production build (`npm run build` + `npm run preview`): assets load with hashed filenames.

### Second development cycle
- Pause/Resume works mid-game via `app.ticker` stop/start, and Settings/Main Menu are reachable from Pause without losing game state incorrectly.
- Screen transitions play consistently across every navigation path in `navigation.md`.
- `npx cap sync` completes cleanly; app boots in an Android/iOS simulator with landscape locked and audio unlocking on first tap.
- Rotate-device overlay appears in a portrait emulated viewport (browser and native) and disappears when rotated back to landscape.
- VFX fire at the correct level-timeline moments.
- Level unlocking: only level 1 is available on a fresh install; winning unlocks the next one and survives a reload.
- Game Over and You Win! play the ambience track; returning to the menu crossfades back to `main_title.mp3`.
- Visual feedback for the atoms being charged: an atom turns yellow (`#FFFF00`) on the bounce that brings it to charge 3, then moves toward red (`#FF0000`) with each further charge until charge 10, with 0.5 s color transitions.
- One-life-left background: the gameplay background fades to dark red (`#660000`) over 0.5 s when the player drops to one life.
- Late-paddle grace window: a paddle released while an atom already overlaps it (center still inside the ring) bounces the atom, which jumps back and returns to the core on the beat; releasing after the center crosses the ring doesn't save it, and the life is lost at that moment.
- Paddle lifetime fade: a set paddle stays at full opacity for the first half of `paddles.duration`, then fades steadily to 20% over the second half and vanishes at the end; a dragged paddle stays at full opacity; a paddle reused after expiring or being pushed out (FIFO) starts at full opacity again; pausing freezes the fade. Check on a short-duration and a long-duration level.
- Paddle bounce flash: every bounce (including late bounces) shows a subtle, semi-transparent arc that starts on top of the paddle, drifts outward and fades in about 0.2 s, like a slight recoil; it never reaches further inside the ring than the paddle; a second bounce on the same paddle while its flash is playing restarts it (only one echo per paddle visible); two different paddles bouncing at once each show their own; the flash finishes even if the paddle expires right after; no leftover flashes after Try Again or leaving the level.
- Capture window feedback: the core is visibly larger (radius 25 vs the atoms' 20). A charged (yellow–red) atom crossing the core pulses on the beat of the music, in its own color, at least twice and at most 3 times per crossing. White atoms (charge < 3) never pulse. No new pulse starts once the atom has left the core, and the last one fades out while following it. A tap during any pulse captures the atom, and a tap after the core has emptied doesn't. Two charged atoms crossing at once both pulse. Nothing pulses during the core collapse or after Try Again. Check on a `travelTime` 8 level and on the `travelTime` 16 level.
- Core collapse animation: when the timer hits 0, `vortex_creation` plays and, over 1.85 s, the core grows smoothly (ease-in-out) to exactly cover the ring (its outline lands on the ring, no gap or overshoot) while its fill fades in to grey `#888888` and its outline turns from white to the same grey. Every atom decelerates without a jolt at the start and comes to a full stop at 1.85 s. Then, in 0.15 s, the core and all atoms collapse into the center together, and You Win! appears at 2 s. An atom that was about to hit the ring may drift past it, but no life is lost. Check with the one-life-left red background, with several atoms moving in different directions (including one crossing the core), and with an atom that has just escaped (it keeps fading and isn't taken by the core collapse). Try Again shows a normal core.
- Capture animation: tapping a charged atom crossing the core plays `capture` and adds the score at once; the atom stops, then moves to the center of the core while shrinking to nothing in 0.5 s, slowly at first and fast at the end, in its own color. Its pulse stops at the tap. Tapping again during the animation doesn't capture it twice (it captures another atom crossing the core, if there is one). Capturing an atom just before the timer hits 0: its animation finishes during the core collapse and it doesn't add containment points. A new atom spawned during the animation looks normal (full size, white).
- Menu background animation: the animation starts on the Intro screen, behind the logo, and keeps playing without a jump or restart through Intro → Main Menu → Level Select / Settings → back, in any order. Its lines are subtle light grey/white on the `#DDDDDD` background. All menu buttons and the Intro tap still work. It fills the viewport with no bars at 16:9 and at wider phone ratios (cropped top/bottom). After frame 7785 (≈ 129.75 s: the content plus about 5 s of empty background) it loops back to the beginning. Starting a level removes it (a single SVG in the DOM while in the menus, none during gameplay, no leftover CPU use); returning from Game Over / You Win! starts it from the beginning. Check in the browser and in the iOS/Android WebView.
