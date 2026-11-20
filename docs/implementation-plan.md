# Bouncerback — Implementation Plan

## Context

Bouncerback is a React + PixiJS + Capacitor game, documented in `AGENTS.md` and `docs/*`. The first three development cycles are implemented (see `docs/implementation-status.md`).

If this plan and another doc disagree, the other doc is the source of truth and this plan should be corrected.

---

## How this file works

This file holds only the phases still pending and the issues deferred for later. Completed phases are in `docs/archive/` (`cycle-1.md`, `cycle-2.md`, `cycle-3.md`), and the design decisions are in `docs/design-decisions.md`. New phases are planned here, numbered after the last one in `docs/implementation-status.md`; once a phase is done, its section and its verification items move to its cycle's archive file. The desktop & Steam cycle has its own numbering (Phase D1, D2…) and its own archive file, `docs/archive/desktop-steam.md` (see "Development Cycles").

---

## Development Cycles

Implementation is split into development cycles. The **first development cycle** builds a fully playable MVP in the browser: core navigation, audio, level data, the PixiJS game engine, and scoring. The following are deferred to the **second development cycle**:

- Pause game functionality and overlay (no Pause screen/button in cycle 1; the game simply runs until win/loss).
- Transitions between screens (all screen changes are immediate swaps in cycle 1).
- The native `@capacitor/screen-orientation` hard lock (cycle 1 forces landscape via CSS/layout only; the "rotate your device" portrait overlay was later dropped, see Phase 11).
- VFX (`palette_invert`, `glow_pulse`, and the "one life left" dark red background). The `vfx` field stays in the level files as an empty array (`[]`) in cycle 1.
- Level unlocking (all levels are playable from the start in cycle 1).
- Results ambience track (Game Over and You Win! are silent in cycle 1: the music just fades out).
- Visual cue for capturable atoms (charge ≥ 3). In cycle 1 all atoms look the same.
- Mobile build (Capacitor `ios`/`android` packaging, native icons/splash, native orientation lock). Cycle 1 targets the web build only; Capacitor deps are installed in Phase 0 but `cap add`/`cap sync` and everything native happen in cycle 2.

The **third development cycle** started with game controller support (Phases 30–32). All cycle 2 phases are done or won't-do. The Time Goes Backwards feature (Phases T1–T6) was planned in `docs/time-goes-backwards-implementation-plan.md` and is complete.

The **desktop & Steam cycle** runs in parallel with the numbered cycles, on its own: the Electron desktop build and the Steam release planned in `docs/desktop-build.md`. Its phases are numbered separately (Phase D1, D2…) so they never clash with the main cycles' numbers, are listed in their own section of `docs/implementation-status.md`, and move to `docs/archive/desktop-steam.md` when done.

---

## Deferred Issues

Known issues the user chose to deal with later. Don't fix them unprompted.

- **Intro screen layout (noted 2026-09-30):** the note and the button don't match `docs/mockups/INTRO.png`. When measured, the note's box was at 368–400px and the button at about 497–567px, against about 415–447px and 506–573px (button centered) in the mockup. `src/index.css` uses `.intro-screen__note { margin-bottom: 96u }` and `.intro-screen .menu { margin-bottom: 145u }`, while the Phase 28 plan specified 59 and 91. When this is picked up, first check whether 96 and 145 were intentional.
- **Lives bonus, all levels (noted 2026-11-06):** `win()` in `GameEngine.js` pays the bonus on the level's starting lives (`this.level.lives`), while `docs/game-rules.md` says remaining lives, so the bonus is the same however many lives were lost. The bonus is to be reconsidered for every level.
- **Anticoherence atom escape (noted 2026-11-06):** the escape keeps its normal animation in the time-backwards level (Phases T1–T5) until a reversed version that still shows the player where the atom left is designed.
- **Anticoherence score balance (noted 2026-11-06):** creating atoms scores capture points with no limit, and hold points are paid while one is held, so tapping the core can inflate the high score shared by all levels. Accepted for now; review it if it turns out to be a problem.

---

## Pending Phases

### Phase 59 — Ring collapse at the end of the last level

**Goal**

A bigger ending for the last level (Neutronika, level 9). When the player wins:

1. The normal core collapse plays and takes the core and the atoms with it.
2. The empty containment ring holds for a moment, then collapses to the center with the `ring_collapse` sound.
3. Then every ring collapses: eight big rings, one after another, each one starting outside the screen and collapsing to the center with `ring_collapse`. Each ring is faster than the one before, and so is its sound.
4. The You Win! interstitial or screen follows as usual.

No other level changes.

**Choices** (confirmed with the user)

- **Only the ring collapses in step 2.** The core collapse already shrinks the core to radius zero, so no core comes back. The ring plays the level start's ring step in reverse: from full size to radius zero, over `RING_GROW_TIME`, with the ease mirrored, as in the Anticoherence ending (which plays the whole reversed start; this ending plays only its last part, the ring).
- **A level file flag**, `ringCollapse` (optional boolean, false if missing), set on `level9.json`. It works like `timeGoesBackwards` and stays with the level if levels are reordered or added. It turns on steps 2 and 3 together.
- **A tunable pause** between the end of the core collapse and the start of step 2: a constant in a new settings file (`src/game/ringCollapseSettings.js`).
- **The big rings (step 3):**
  - Each one starts with **half the canvas diagonal as its radius**, so it is fully outside the screen and sweeps in from the corners. The radius is worked out from the canvas size in arena units (the arena is scaled by `min(width, height) / REFERENCE_SIZE` in `layout()`), so it is right on any screen shape.
  - **Same duration as the ring collapse**, whatever the size: at factor 1 a big ring takes `RING_GROW_TIME`, like the containment ring, with the same ease. At factor `f` it takes `RING_GROW_TIME / f`.
  - **Eight rings, back to back:** each new ring appears in the frame where the previous one reaches the center, with no pause between them. Factors 1, 1.2, 1.4 … 2.4 (the factor goes up by 0.2 per ring).
  - **Sound:** `ring_collapse` plays as each ring starts, at a playback rate equal to its factor (Howler's `rate`, which also raises the pitch, like speeding up a tape). Each sound plays to its end, so if it lasts longer than its ring, the sounds overlap. The user adjusts the sound file itself if needed; the code doesn't depend on its length.
  - The ring count, the first factor and the factor step are in `ringCollapseSettings.js` as tunable values.
- **The sound file** is `assets/audio/ring_collapse.flac` (already in the repo). `vortex_creation` still plays at the start of the core collapse, as in every level.

**Implementation**

- `docs/level-file-schema.json`: `ringCollapse`, boolean, default false. Its description says what it does and that it has no effect together with `timeGoesBackwards` (that level has its own ending).
- `src/game/levelLoader.js`: `ringCollapse: data.ringCollapse ?? false`.
- `src/levels/level9.json`: `"ringCollapse": true`. Run `npm run validate:levels`.
- `src/game/ringCollapseSettings.js` (new): `RING_COLLAPSE_SETTINGS = Object.freeze({ DELAY_SECONDS, OUTER_RING_COUNT, OUTER_RING_FIRST_SPEED, OUTER_RING_SPEED_STEP })`. Comments say what each one does and label any number as an example, like `timeBackwardsSettings.js`.
- `src/audio/soundManager.js`: `playSfx(name, { rate } = {})`. With a rate other than 1 it sets `howl.rate(rate, id)` on the voice it just started. Existing calls don't change. The rate only touches that voice, so later plays of the same sound are back at normal speed.
- `src/game/GameEngine.js`:
  - A new state, `RING_COLLAPSING`, covering steps 2 and 3, included in the `update` switch. Pause and input stay off, as in `COLLAPSING` (the existing `state !== PLAYING` checks already cover it). The You Win! track preload is unchanged (it starts at the core collapse).
  - `updateCollapsing`: when the core collapse ends, a level with `ringCollapse` (and not `timeGoesBackwards`) goes to `RING_COLLAPSING` with `stateTime` reset. The others call `win()` as now.
  - A shared formula for a ring collapsing: `ringCollapseRadius(startRadius, progress)` = `startRadius * easeOutQuad(1 - progress)`, the level start's ring step in reverse. `drawStartAnimation`, the Anticoherence ending, the containment ring collapse and the big rings all go through it, so they can't drift apart.
  - `updateRingCollapsing(dt)` keeps `updateVanishingAtoms(dt)` running and works through a short list of collapses, built when the state starts:
    - the containment ring: after `DELAY_SECONDS`, radius `RING_RADIUS`, factor 1;
    - then the big rings: start radius from the canvas diagonal, factors from the settings.
    Each collapse plays `ring_collapse` at its factor in its first frame, then draws `this.ring.draw(ringCollapseRadius(radius, t * factor / RING_GROW_TIME))` (the containment ring's own `Graphics` is reused for every ring, so the line width and color are the same). Time left over at the end of one collapse carries over into the next, so the steps keep exact timing regardless of the frame rate. After the last big ring it calls `win()`.
  - The big ring's start radius is read from `this.app.screen` when that ring starts. A resize during the sequence only affects the next ring.
  - The collapsed atoms: `win()` still pays containment points for the atoms in `COLLAPSING` and releases them. They are at radius zero by then, so nothing shows. The new state doesn't redraw them.
  - `playSfx` goes through `sfxName`, which only changes names in `timeGoesBackwards` levels, and the two flags never act together.
- Check during implementation: a ring of that radius at the arena's 128 circle segments looks smooth at the screen edge. If it doesn't, the ring draws more segments for big radii.

**Docs** (as part of the implementation)

- `docs/game-rules.md`, "Level end condition": in levels with `ringCollapse`, the ring collapse and the big rings follow the core collapse, and the win counts when the last ring reaches the center.
- `docs/graphical-specs.md`, "Visual feedback": a "Level end, ring collapse (levels with `ringCollapse`)" item after the core collapse item, describing the pause, the containment ring collapse and the accelerating big rings (from half the canvas diagonal, back to back, sound sped up with each ring). Behavior and formulas only, no values from the settings file.
- `docs/audio-map.md`: a `ring_collapse.flac` row (played at the containment ring collapse and at each big ring, at the ring's speed factor), and a note that `playSfx` accepts a playback rate.
- `docs/project-structure.md`: `src/game/ringCollapseSettings.js`.
- `docs/design-decisions.md`: a short entry with the choices above and their reasons.
- `docs/implementation-status.md`: Phase 59.
- `docs/game-instructions.md`: nothing (it doesn't describe level endings).

**Verification**

- `npm run validate:levels` passes. A level file with `"ringCollapse": "yes"` is rejected.
- Level 9, won: the core collapse plays with `vortex_creation` as before. Then the empty ring holds for `DELAY_SECONDS` and collapses with `ring_collapse`. Then eight rings sweep in from beyond the screen corners, each one faster and each sound higher and faster, back to back. Then the You Win! interstitial cuts in. Score, containment points and level progress are as before, and the result is saved.
- The big rings start fully off-screen and enter from the corners, on 16:9, 16:10 (Steam Deck), 4:3 (iPad) and a phone in landscape.
- The sequence keeps the same timing at 30, 60 and 120 fps (e.g. the browser's CPU throttling, or a high refresh rate display).
- An atom escaping or being captured when the timer runs out finishes its fade during the ring collapse, and no life is lost.
- Pause (button, Escape, Android back, app in background) does nothing during the core and ring collapses.
- With OLD TV on and off, the rings collapse through the CRT as the rest of the arena does.
- Every other sound effect still plays at normal speed after the ending (e.g. play level 9 again).
- Levels 1–8: unchanged ending. Level 6 (Anticoherence): unchanged ending.
- Losing level 9: the last life zoom and Game Over, unchanged.

### Phase D1 — Desktop test build for the Steam Deck

**Goal**

A native Linux x64 build of the game, wrapped in Electron, that can be copied to the Steam Deck by hand and run there, to see how the game behaves on the Deck's hardware before any Steam work. This is step 2 of "Suggested order" in `docs/desktop-build.md`.

Out of scope: Steamworks, the overlay, Proton, Steam depots, Windows and macOS builds, signing, CI, and the desktop game changes of `docs/desktop-build.md` section 3 (quit option, keyboard controls, window size memory, save files). The game runs exactly as in the browser; this phase only wraps it and collects feedback. The feedback decides what the next phases fix first.

**Choices** (confirmed with the user)

- **Packaging tool: electron-builder.** It builds Linux, Windows and macOS packages from one config, which the later phases need, and it is the usual choice for Electron games on Steam. Electron Forge was the alternative; it adds a more opinionated project layout for no gain here.
- **Electron 44**, pinned to an exact version: its latest patch at implementation time (44.9.3 when planned). Electron 45.0.0 came out on 2026-10-21, too fresh to start on; moving up is a later, separate step.
- **Output: a `.tar.gz` of the unpacked app**, not an AppImage. An archive keeps the files' executable permissions through a USB stick formatted as exFAT or FAT, it needs nothing on the Deck to run (an AppImage needs FUSE), and it is closest to what goes into a Steam depot later.
- **Built on the Mac.** electron-builder can make the Linux x64 package on macOS, since the game has no native modules. No Linux machine or CI needed yet.
- **The game is served through a custom `app://` protocol**, not opened as `file://`. Under `file://` Chromium blocks or limits `fetch` / XHR, which Howler and the hashed asset URLs rely on, and the page has no stable origin for `localStorage`. With `app://bouncerback/` the build behaves like the deployed web site, and the saved data (settings, unlocked levels, high score) lives in one fixed place.
- **X11 forced on Linux** (`--ozone-platform=x11`). Recent Electron versions choose Wayland on their own when they find it; the Deck's Game Mode (gamescope) runs games through Xwayland, and the overlay approach planned later (`steamworks-ffi-node`) needs X11. Using X11 from the start means the test matches what will ship.
- **Fullscreen from launch.** F11 toggles windowed mode for testing on a desktop. No menu bar.

**Implementation**

- `package.json`:
  - `electron` and `electron-builder` as exact-version dev dependencies.
  - `"main": "electron/main.js"` (Electron's entry point; Vite ignores it).
  - Scripts: `desktop:start` (`vite build`, then run Electron on it, for a check on the Mac before copying) and `desktop:build:linux` (`vite build`, then `electron-builder --linux tar.gz --x64`).
- `electron/main.js` (new folder; ES module, like the rest of the project):
  - Registers the `app://` scheme as privileged (standard, secure, fetch, streaming for audio) and serves files from `dist/` through it, refusing any path that leaves `dist/`.
  - Creates one `BrowserWindow`: fullscreen, black background (no white flash at start), no menu bar, the window title "Bouncerback", context isolation and the sandbox on, no Node in the page, no preload.
  - Loads `app://bouncerback/index.html`.
  - Links that open a new window (the Credits screen's LICENSES button) go to the system browser (`shell.openExternal`), and the app never opens a second Electron window.
  - F11 toggles fullscreen. Ctrl+Shift+I opens DevTools (test build convenience; reconsider before release).
  - On Linux, appends the `ozone-platform=x11` switch.
  - At startup writes a short `launch-info.txt` to the app's user-data folder (`~/.config/bouncerback/` on Linux): Electron and Chromium versions, `app.getGPUFeatureStatus()`, the display size and scale factor. On the Deck in Game Mode there are no DevTools at hand, so this is how to tell whether WebGL is hardware-accelerated.
- `electron-builder.json` (new): app ID, product name `Bouncerback`, executable name `bouncerback`, Linux target `tar.gz` x64, icon from `assets/native/icon-only.png`, output to `release/`. Packs only `dist/` and `electron/`: the game is fully bundled by Vite, so no `node_modules` go into the app (in particular none of the Capacitor packages). Check the archive's contents and size after the first build.
- `.gitignore`: `release/`.
- No change in `src/`. On Electron, `Capacitor.isNativePlatform()` is false, so `src/native.js` already does nothing, as in a browser.

**Running it on the Deck** (goes into `docs/desktop-build.md`, "Test builds")

1. On the Mac: `npm run desktop:start` to check the build, then `npm run desktop:build:linux`; the archive is in `release/`.
2. Copy the archive to the Deck (USB stick, or a network share in Desktop Mode) and extract it, e.g. to `~/Games/Bouncerback/`, keeping the permissions (Dolphin's "Extract here" does).
3. **Desktop Mode:** run `./bouncerback` from the folder (double click, or from Konsole to see the console output). If it stops at once with a message about the sandbox (`chrome-sandbox`), try `./bouncerback --no-sandbox` and note it in the feedback: it is fixed in the packaging, not on the Deck.
4. **Game Mode:** Game Mode can only start things from the Steam library, so in Desktop Mode add the executable as a non-Steam game (Steam → Add a Game → Add a Non-Steam Game → Browse). It is still the native Linux build with no Steamworks and no Proton (check that "Force the use of a specific Steam Play compatibility tool" stays off). Then switch to Game Mode and start it from the library. Steam Input will give the game a virtual controller, as it will on release.

**Feedback to collect** (on the Deck, in both modes unless noted; results go into `docs/desktop-build.md`, "Steam Deck test results")

- Starts? Time to the Intro; any white flash; the console output and `launch-info.txt` (WebGL and GPU status).
- Fullscreen at 1280x800: is the whole UI scaled correctly at 16:10, nothing cut off, menu background cropped as expected; the arena and the CRT glass fit.
- Text legibility at the Deck's size: HUD, credits, How To Play, the tips (the smallest text).
- Performance (Game Mode: the Deck's performance overlay, Quick Access → Performance, shows FPS and GPU load): smooth 60 fps in menus and in level 9, with OLD TV off and on; the last life zoom; any stutter when a level starts. Battery draw if visible.
- Audio: music and effects play, no crackle, volume steps work; audio after the Deck sleeps and wakes.
- Controller: is the built-in controller seen by the game at all in Desktop Mode (where Steam applies its desktop configuration) and in Game Mode; menus (d-pad, A to activate, B to go back), gameplay (both sticks, captures, holds), pause with the menu button; does any button do something in Steam and in the game at once.
- Main Menu gamepad indicator: shown or hidden on the Deck (it hides on touch-only devices, and the Deck has a touchscreen and trackpads), and does it switch to "Gamepad detected".
- Touchscreen: menus and gameplay by touch; trackpad as mouse in Desktop Mode.
- Saved data survives closing and reopening (OLD TV, volumes, unlocked levels, high score).
- Pause when leaving the game: Steam button / Quick Access in Game Mode, switching windows in Desktop Mode.
- Quitting: in Game Mode, Steam button → Exit game; in Desktop Mode, closing the window. Does it close cleanly (no process left running)?
- Credit links: what happens on each mode (Game Mode has no desktop browser in front).
- Sleep and resume during a level and in the menus.

**Docs** (as part of the implementation)

- `docs/desktop-build.md`: a "Test builds" section (how to build, copy and run, as above) and an empty "Steam Deck test results" section with the feedback list, to fill after the test. Tick the first pass of section 5's Linux row where it applies.
- `docs/project-structure.md`: `electron/`, `electron-builder.json`, `release/`.
- `docs/tech-stack.md`: the Desktop Packaging row (electron-builder, the `app://` protocol); the development environment table gets a Desktop row (nothing beyond Node and npm; the Linux build is made on the Mac).
- `AGENTS.md`: `docs/desktop-build.md` added to the Documentation Map (read it when building, running or changing the desktop build or the Steam integration), and `electron/` noted as the desktop wrapper's main process, outside the React / PixiJS split (it never touches game state).
- `docs/design-decisions.md`, "Desktop build (Steam)": electron-builder, Electron 44, tar.gz, `app://`, forced X11, with their reasons.
- `docs/implementation-status.md`: Phase D1, in the desktop & Steam section.

**Verification**

- On the Mac: `npm run desktop:start` opens the game fullscreen, with no white flash, no menu bar and no console errors; it plays as in the browser (music from the Intro button, menus, a level with the controller and the mouse, OLD TV on and off). The credit links open in the default browser and no second window appears. F11 leaves and re-enters fullscreen. Settings and progress survive a restart. `launch-info.txt` is written. The web build (`npm run build`, `npm run dev`) and the mobile builds (`npm run cap:sync`) are unchanged.
- `npm run desktop:build:linux` produces a `.tar.gz` in `release/` containing an executable `bouncerback`, with no `node_modules` from the project inside the app archive.
- On the Deck: the steps in "Running it on the Deck" work in both modes, and every item in "Feedback to collect" has an answer written into `docs/desktop-build.md`.
