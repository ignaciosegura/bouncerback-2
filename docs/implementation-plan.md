# Bouncerback — Implementation Plan

## Context

Bouncerback is fully documented (`AGENTS.md`, `docs/*`) but has zero implementation: no `package.json`, no bundler, no `src` code — only docs, mockups, and raw assets. The goal is to scaffold and implement the React + PixiJS + Capacitor game described in the docs.

Before planning, every doc, all seven mockups, and the level schema were read in full, surfacing a few real gaps/contradictions. The three that would materially change the implementation were resolved via clarifying questions with the user; the rest are minor and are handled as stated assumptions below (flag if any are wrong).

### Already applied (per user answers)
1. **Stray `src/` asset dirs removed.** `src/fonts/`, `src/img/`, `src/sound/` duplicated (and partly diverged from — e.g. `bounce_dry/knackle/wet.mp3` instead of `bounce.mp3`, a leftover `tracks/tutorial.mp3`) the canonical `assets/` tree from `docs/project-structure.md`. Deleted via `git rm` — `assets/` is now the single source of truth for audio/fonts/vectors.
2. **`docs/level-file-schema.json` fixed:** `paddles.angle` description changed from "grads" to "degrees" (was a documentation error).
3. **`docs/level-file-schema.json` extended:** added a required `"lives"` (integer) field so each level can set its own starting life count — no per-level lives value existed before (only inferable from the GAMEPLAY.png mockup's 4 dots), and it needs to vary by level per the user's answer.

### Stated assumptions (not blocking, proceed unless corrected)
- **Bundler:** Vite (fast ESM dev server, pairs well with PixiJS v8's async `app.init()` and with Capacitor).
- **Language:** plain JavaScript/JSX — matches `.eslintrc.json` (no TS parser) and `project-structure.md` (all `.jsx`/`.js` files). The old deleted `docs/implementation-plan.md` mentioned TypeScript/Expo; that plan is stale/superseded and is ignored.
- **No routing library** — `App.jsx` is a simple state-based screen switcher, per `project-structure.md`'s description ("router / screen switcher").
- **Persistence:** `localStorage` for settings (music/SFX volume) and high score. Works identically in browser and Capacitor WebView; no extra plugin needed for v1.
- **Orientation lock:** CSS/layout-based landscape enforcement plus a "rotate your device" overlay when the viewport is portrait (covers desktop browsers, which have no reliable lock API), and the `@capacitor/screen-orientation` plugin for a hard lock on native iOS/Android. This plugin isn't listed in `docs/tech-stack.md`'s stack table but is necessary to satisfy AGENTS.md rule "forced landscape orientation" on native.
- **PixiJS v8**, matching the async `app.init()` pattern in `docs/react-pixi-example.jsx`.
- **VFX vocabulary:** `docs/level-file-schema.json`'s `vfx[].name` and `graphical-specs.md`'s "optional effects" are never given concrete identifiers. Two are introduced: `palette_invert` (black/white swap, used for the "one life left" state per graphical-specs) and `glow_pulse` (paddle glow). Level files can reference these by name in their `vfx` timeline; the 1-life-remaining trigger fires `palette_invert` directly from game state regardless of the level's own vfx list.
- **Score "level" multiplier** in the formulas (`10 * level * charge`, etc.) = the level's numeric index, 1–5.
- **Atom speed derivation:** `atoms.speed` ("bars for a round trip") combined with `timeSignature` gives `secondsPerBar = 60/bpm * signature`; atom pixel speed = `(2 * ringRadius) / (atoms.speed * secondsPerBar)`. Timer initial value (tenths of a second) = `round(duration * secondsPerBar * 10)`.
- No automated test framework is specified anywhere in the docs; a couple of lightweight Vitest unit tests for pure logic (score formulas, level-loader math) can be added since PixiJS/DOM rendering isn't practically unit-testable — this is additive, not required, and can be skipped to keep scope minimal.
- Mobile app icon: `src/img/icon.png` was deleted with the stray folder, and `assets/vectors/` only has the wordmark logo (not a square icon). Mobile packaging (Phase 8) will use a placeholder square icon derived from the logo mark until a real one is supplied.

---

## Implementation Phases

### Phase 0 — Project scaffolding
- `package.json`, Vite + `@vitejs/plugin-react`, deps: `react`, `react-dom`, `pixi.js@^8`, `howler`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/screen-orientation`.
- `index.html`, `src/main.jsx`, `capacitor.config.json` (placeholder appId/appName).
- `src/index.css`: `@font-face` for `assets/fonts/c64_angled.ttf`, global reset, black background, `env(safe-area-inset-*)` padding, base `touch-action: none`.

### Phase 1 — App shell & navigation
- `src/App.jsx`: screen-state switcher covering `navigation.md`'s flow (Intro → Main Menu → {Level Select, Settings} → Game → {Pause, Game Over, You Win} overlays).
- `src/components/Screen.jsx`: wraps each screen, applies safe-area padding and the portrait "rotate device" overlay.
- Generic UI: `Button.jsx`, `Menu.jsx`, `TextBox.jsx`, `Overlay.jsx` implementing `graphical-specs.md` exactly — thin border, transparent fill, 1em padding, uppercase, single line, C64 Angled font, light/dark (`#DDDDDD`/`#000000`) variants per screen.

### Phase 2 — Audio manager
- `src/audio/soundManager.js` (Howler wrapper): preloads all `assets/audio/*.mp3` + `assets/audio/tracks/*.mp3`; unlocks by playing `silence.mp3` on the Intro screen's first tap (which then advances to Main Menu); exposes `playSfx(name)`, `playTrack(name)` with crossfade, and "don't restart if same track" continuity (audio-map.md rules 1–3); music/SFX volume (0–10 scale per SETTINGS mockup) persisted to `localStorage` and read by every screen (available globally, not just in-game, per AGENTS.md rule 5).

### Phase 3 — Level data & loader
- Author `src/levels/level1.json`…`level5.json` against the corrected schema (level1 = easiest: lowest atom speed/frequency demand relative to duration, most lives; difficulty ramps to level5). Track assignment per `audio-map.md`'s suggested defaults (`learn.mp3`…`mekanomancer.mp3`).
- `src/game/levelLoader.js`: parses/validates a level JSON and returns derived runtime values (`timerTenths`, `atomSpeedPxPerSec`, `spawnIntervalSeconds` with the "random moment within interval" jitter from game-rules.md, paddle arc-degrees/duration, starting lives).

### Phase 4 — PixiJS GameEngine & entities
- `src/game/GameEngine.js`: owns the `PIXI.Application` and `app.ticker` loop; builds `ContainmentRing`, `AtomEmitter` (core), pooled `Atom`s and `Paddle`s; implements the two-stage pointer flow from game-rules.md (`pointerdown` draws an inactive paddle, `pointermove` rotates it with the cursor, `pointerup` commits it at the release angle, oldest paddle evicted FIFO on a 3rd placement); collision checks (atom↔paddle arc reflects + increments charge up to 10, atom↔ring escape fades the atom and costs a life, atom↔core tap destroys atoms with charge ≥ 3); emits only low-frequency callbacks (`onScoreChange`, `onLivesChange`, `onTimeChange`, `onGameOver`, `onLevelWin`) — no per-frame state ever crosses into React, per AGENTS.md rule 2. Calls `app.destroy(true, { children: true, texture: true })` on teardown (rule 3); canvas container has `touchAction: 'none'` (rule 4).
- `src/game/entities/{AtomEmitter,ContainmentRing,Paddle,Atom}.js`: `PIXI.Graphics`-based vector shapes (white lines/fills on black, no textures, per `graphical-specs.md`) with per-entity `update(deltaMS)`.

### Phase 5 — Screens & HUD wiring
- `src/screens/{MainMenuScreen,LevelSelectionMenuScreen,SettingsMenuScreen,GameScreen,GameOverOverlay,PauseOverlay}.jsx` + a `YouWinOverlay.jsx` (mirrors GameOver per the mockup, adds hi-score line), each matching its `docs/images/*.png` mockup.
- `src/components/HUD.jsx`: SCORE / TIME / HI-SCORE + life-dots row, updated only from the GameEngine's low-frequency callbacks (matches GAMEPLAY.png layout).
- Pause button stops `app.ticker`; Resume restarts it; Settings/Main Menu buttons inside Pause reuse the existing screens.

### Phase 6 — Scoring & rules
- Implement `game-rules.md`'s Score section verbatim (bounce, capture, end-of-level containment × remaining lives, time bonus), charge accumulation (+1 per bounce, cap 10, tap-to-destroy unlocked at charge ≥ 3), immediate high-score update+persist the moment it's beaten (visible on every screen per game-rules.md "High Score").

### Phase 7 — Visual effects
- Small vfx registry (`palette_invert`, `glow_pulse`) driven both by a level's `vfx` timeline (bar-offset → seconds, via the loader) and directly by game state (1 life left → `palette_invert`).

### Phase 8 — Mobile packaging
- `npx cap add ios android` (generated output is off-limits to hand-edit per AGENTS.md — only touch it via the Capacitor CLI), wire `@capacitor/screen-orientation` to lock landscape on native, generate icons/splash from a placeholder square icon (flag that a real one should replace it).

### Phase 9 — QA pass
- Manual verification per `implementation-guidelines.md`'s per-step "Verify" checklists; optional Vitest unit tests for the pure math (scoring, level loader) as a nice-to-have.

---

## Verification
- `npm run dev`: click through Intro → Main Menu → Level Select → Settings → Game; compare pixel layout against each `docs/images/*.png` mockup at a landscape viewport, and confirm the rotate-device overlay appears in a portrait emulated viewport.
- Manual gameplay pass on `level1`: paddle placement (down/drag/release), atom bounce/charge/escape/destroy, timer countdown, life loss, win/loss overlays, and score math all match `game-rules.md`'s formulas.
- Audio: confirm `silence.mp3` fires on first Intro tap before any other sound, track continuity/crossfade across screens, volume settings persist across a reload.
- `npx cap sync` completes cleanly; app boots in an Android/iOS simulator with landscape locked and audio unlocking on first tap.
