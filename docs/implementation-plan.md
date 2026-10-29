# Bouncerback — Implementation Plan

## Context

Bouncerback is fully documented (`AGENTS.md`, `docs/*`) but has zero implementation: no `package.json`, no bundler, no `src` code — only docs, mockups, and raw assets. The goal is to scaffold and implement the React + PixiJS + Capacitor game described in the docs.

Every doc, all seven mockups and the level schema were reviewed against each other. The gaps and contradictions found were resolved with the user; the resulting decisions are listed below and have also been written into the relevant docs (`game-rules.md`, `level-file-schema.json`, `navigation.md`, `project-structure.md`, `AGENTS.md`). If this plan and another doc disagree, the other doc is the source of truth and this plan should be corrected.

---

## How this file works

This file holds only the phases still pending. Completed phases are in `docs/archive/` (`cycle-1.md`, `cycle-2.md`, `cycle-3.md`), and the design decisions are in `docs/design-decisions.md`. New phases are planned here, numbered after the last one in `docs/implementation-status.md`; once a phase is done, its section and its verification items move to its cycle's archive file. The desktop & Steam cycle has its own numbering (Phase D1, D2…) and its own archive file, `docs/archive/desktop-steam.md` (see "Development Cycles").

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

The **third development cycle** starts with game controller support (Phases 30–32). Pending cycle 2 phases (Pause, mobile packaging, optional VFX, level unlocking, results ambience track) stay in cycle 2.

The **desktop & Steam cycle** runs in parallel with the numbered cycles, on its own: the Electron desktop build and the Steam release planned in `docs/desktop-build.md`. Its phases are numbered separately (Phase D1, D2…) so they never clash with the main cycles' numbers, are listed in their own section of `docs/implementation-status.md`, and move to `docs/archive/desktop-steam.md` when done.

---

## Pending Phases

### Storytelling: end-of-level interstitials (Phases 56–57)

First step of the storytelling elements: a level can show a full-screen picture after it is won or lost, before the You Win! or Game Over screen. Phase 56 adds the level file fields and their checks (no visible change); Phase 57 shows the picture. There are no pictures yet (`assets/interstitials/` is empty), so no level file gets the fields in these phases.

**Choices** (confirmed with the user)

- **Two optional level file fields**, `youWinInterstitial` and `gameOverInterstitial`: the file name of a PNG in `assets/interstitials/` (just the name, e.g. `level3_win.png`, no folder). Missing or blank (empty, or only spaces) means no picture: the level goes straight to the result screen, exactly as now.
- **Drawn in the PixiJS game canvas**, not in React, so it goes through the same post-processing as the arena and follows OLD TV (curved glass, scanlines… with it on; flat with it off). No zoom blur: it radiates from the core, which the picture doesn't have.
- **Cut in, cut out.** When the end animation finishes (after the last life zoom on a loss, after the core collapse on a win: the moment the result screen's screen-out starts today), the picture replaces the arena at once and the HUD disappears at once. On continue, the result screen replaces it at once and plays only its usual screen-in (no screen-out: nothing is left on the Game Screen to animate).
- **Press to continue.** Tap or click anywhere, the controller's bottom face button or RT (the menus' activate buttons), or Enter / Space. It continues on the release, like the menus, so the release can't land on the result screen. Presses are ignored for a short moment after the picture appears, so a stray tap at the end of the level doesn't skip it; only a press that starts after that moment counts (a button held from gameplay doesn't). The moment's length goes in a new settings file, `src/game/interstitialSettings.js`.
- **Contain fit.** The whole picture is always visible, scaled to fit the screen and centered, with black bars where the screen's shape differs from the picture's (e.g. the Steam Deck's 16:10, wide phones). Pictures are meant to be made at 1920×1080, like the mockups.
- **Complete silence during the picture.** The level track and any sound effect still playing stop the moment the picture appears (cut, with only the few milliseconds of fade that keep a stop from clicking); nothing plays until the result screen, which plays its ambience as now. How the result ambiences are used will be reconsidered later.
- **The result is saved when the level ends, not on continue.** The win (level progress) and the score are registered when the end animation finishes, as now, so closing the app on the picture loses nothing.
- **Mobile back button and desktop Escape do nothing on the picture**, as during the other moments when the game can't be paused (core collapse, Game Over delay).
- **An exception to "no images"** (`AGENTS.md`, "Visual & Style Rules", and `docs/graphical-specs.md`, "The background"): the interstitials are bitmaps. They come between player actions, after the level has ended, so gameplay itself (and the menus) still follows the rule: 2D vector only.
- **Same CRT and bloom values as the arena.** The pictures are deliberately low fidelity, so they need no values of their own.

### Phase 56 — Interstitial fields in the level files

**Goal**

The level files can name a You Win! and a Game Over picture; the loader checks them and gives the engine their URLs. No visible change.

**Implementation**

- `docs/level-file-schema.json`: two optional string properties, `youWinInterstitial` and `gameOverInterstitial`, not in `required`. Each has a `pattern` allowing a blank value or a single file name ending in `.png` (no `/` or `\`), and a description: the PNG in `assets/interstitials/` shown after the level is won / lost, before the result screen; missing or blank means none.
- `src/game/levelLoader.js`:
  - `checkSchema()` learns `pattern` (its subset of JSON Schema doesn't have it yet; without it the in-game check would silently skip the rule).
  - Collects the pictures with `import.meta.glob('../../assets/interstitials/*.png', { eager: true, query: '?url', import: 'default' })`: file name → bundled URL (an empty folder gives an empty map). Only the PNGs there are bundled.
  - `checkRanges()` adds a problem when a non-blank name isn't one of those files (catches typos when the game starts, like the other level checks).
  - `loadLevel()` returns `youWinInterstitial` and `gameOverInterstitial`: the URL, or `null` when missing or blank.
- `scripts/validate-levels.js`: after the schema check, checks that each non-blank name exists in `assets/interstitials/`, with the same kind of error line, so `npm run validate:levels` catches a missing picture too.
- No level file changes (there are no pictures yet).

**Docs** (as part of the implementation)

- `AGENTS.md`, "Level Files": the two fields are optional and name a PNG that must exist in `assets/interstitials/`; `validate:levels` checks it.
- `docs/project-structure.md`: `assets/interstitials/` (end-of-level PNGs named by the level files).
- `docs/game-rules.md`, "Game over condition" and "Level end condition": a level can show a picture before the result screen (details in Phase 57's docs).

**Verification**

- `npm run validate:levels` passes on the five level files.
- With a temporary test PNG in `assets/interstitials/` (removed afterwards, not committed): a level copy naming it passes; one naming a missing file, a name with a folder, or a `.jpg` fails with a clear error line; `""` and `"  "` pass. The same cases in-game: the missing file makes the loader throw at startup with the level's number; blank gives `null`.
- The game plays exactly as before (build and dev run, no console errors).

### Phase 57 — Interstitial display

**Goal**

After a level that names a picture for its outcome, the picture is shown in the game canvas, through the post-processing, until the player continues; then the result screen.

**Implementation**

- `src/game/interstitialSettings.js` (new): the input lock time after the picture appears.
- `src/game/GameEngine.js`:
  - **Loading.** At mount, starts loading the level's pictures with PixiJS `Assets.load()` (both, if present; it doesn't hold up the level). If the end comes before a picture is ready, the frozen last frame stays until it is; if it fails to load, a console warning and straight to the result screen, as with no picture.
  - **New state `INTERSTITIAL`**, after `LOST` (Game Over delay) and `COLLAPSING` (core collapse), in place of going to `ENDED` when the outcome has a picture. Entering it: cuts the level track and every sound effect still playing (see `soundManager.js` below), resets the controller reader (no press carries over), shows the picture, and emits the result (`onGameOver` / `onLevelWin`) with `{ score, interstitial: true }`. Without a picture, `ENDED` and the result as now, with `interstitial: false`.
  - **Drawing.** The picture is a `Sprite` in its own container, kept off the arena. With a picture shown, `buildPostProcessing()` builds the picture's chain instead of the arena's: the same effects minus the zoom blur (with OLD TV on: bloom and CRT, as on the arena; with it off: no effects, the container straight on the stage), cleared to black. `layout()` sizes the sprite with the contain fit; it follows resizes. The effects use the arena's settings as they are (no overrides).
  - **Continue.** Once the lock time has passed: a pointer pressed on the stage and released, an Enter / Space press and release, or the controller's bottom face button or RT pressed and released (through the engine's `GamepadReader`). Then emits `onContinue` (once) and goes to `ENDED`.
  - **Teardown.** The picture's textures come from `Assets`' cache: they're taken off the stage and released with `Assets.unload()` instead of being destroyed by `app.destroy(… texture: true)`, which would leave a broken texture in the cache for the next play of the level.
  - The class comment's callback list gets `onContinue()` and the results' `interstitial` flag.
- `src/screens/GameScreen.jsx`: hides the HUD at once when a result comes with `interstitial: true`; passes `onContinue` up. The back button and Escape handlers do nothing while the picture is shown.
- `src/App.jsx`:
  - `endLevel()` / `winLevel()` register the score and the win at once as now; with `interstitial: true` they keep the result screen pending instead of navigating.
  - `onContinue` from the Game Screen goes to the pending result screen with a cut: `navigate()` gets an option to skip the screen-out (the screen changes at once and plays its screen-in). Taps are still ignored while that screen-in runs.
- `src/audio/soundManager.js`: `stopTrack()` gets a `{ cut: true }` option that stops the track at once with the short anti-click fade the SFX voices already use, instead of the screen-change fade; and a `stopAllSfx()` that stops every SFX voice (one-shots and loops) the same way.
- Music otherwise unchanged: the result screens start their ambience when they appear, as now (the ambience is still preloaded when the outcome is known).

**Docs** (as part of the implementation)

- `docs/graphical-specs.md`: a new "End-of-level interstitials" section (full screen in the game canvas, contain fit with black bars, made at 1920×1080, cut in and out, HUD hidden, through the CRT with OLD TV on and never the zoom blur); "The background" and "CRT effect" mention them; the "no textures" wording notes the interstitials as the exception.
- `AGENTS.md`, "Visual & Style Rules": the interstitial PNGs are the one bitmap exception: shown between player actions, after a level ends, through the CRT post-process like the arena; gameplay stays vector only.
- `docs/navigation.md`: the interstitial between the Game Screen and Game Over / You Win! (not a screen: drawn on the Game Screen's canvas), how to continue, the cut, and that the back button and Escape do nothing on it.
- `docs/game-rules.md`, "Game over condition" and "Level end condition": the picture comes in place of going straight to the result screen; the result is saved when the level ends.
- `docs/audio-map.md`, "Audio Lifecycle Rules": complete silence during an interstitial: the level track and any sound effect are cut when it appears; the result ambience still starts on the result screen.
- `docs/game-controller.md`: bottom face button or RT continue from an interstitial.
- `docs/post-processing.md`, "The chain in the game": the interstitial's chain (no zoom blur).
- `docs/project-structure.md`: `interstitialSettings.js`.
- `docs/design-decisions.md`: a new "Storytelling (interstitials)" section with the choices above and their reasons (PixiJS for OLD TV, contain for pictures with text, release to continue, saving at the level's end).
- `docs/info-for-testers.md`: how to try an interstitial before the real pictures exist (put a PNG in `assets/interstitials/`, name it in a level file, don't commit it).
- `docs/implementation-status.md`: Phases 56 and 57.

**Verification** (with a temporary test PNG named in a level, not committed)

- Losing that level: after the last life zoom, the picture replaces the arena at once, the HUD vanishes, and the music and any sound effect stop at once (silence until the result screen, no click). Winning: the same after the core collapse. A level with no picture (or a blank name) goes to the result screen with the usual transition, unchanged.
- Contain fit at 16:9, 16:10 (Steam Deck size) and a wide phone shape, in portrait-sized windows during a resize too: the whole picture visible, centered, black bars.
- OLD TV on: curved glass, scanlines and the rest on the picture; no zoom blur streaks. OLD TV off: flat and sharp.
- Taps, clicks, Enter / Space and the controller during the lock time do nothing; a button held from gameplay doesn't continue; after it, a press and release continues; the result screen appears at once with its screen-in, shows the right score and hi-score, and its buttons don't react to that release. The result ambience plays on the result screen.
- The level counts as won (Level Select) even if the app is reloaded while the picture is shown.
- Mobile back button (Android) and Escape (desktop) do nothing on the picture. Auto-pause doesn't trigger on it.
- Playing the same level again (TRY AGAIN) shows the picture again with no broken texture; no console errors or warnings; no leftover canvas after leaving.
- On the Android emulator and the desktop build as well as the browser.

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
  - Links that open a new window (the Main Menu credits) go to the system browser (`shell.openExternal`), and the app never opens a second Electron window.
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
- Performance (Game Mode: the Deck's performance overlay, Quick Access → Performance, shows FPS and GPU load): smooth 60 fps in menus and in level 5, with OLD TV off and on; the last life zoom; any stutter when a level starts. Battery draw if visible.
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
