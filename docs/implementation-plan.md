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
  - At startup writes a short `launch-info.txt` to the app's user-data folder (`~/.config/Bouncerback/` on Linux): Electron and Chromium versions, `app.getGPUFeatureStatus()`, the display size and scale factor. On the Deck in Game Mode there are no DevTools at hand, so this is how to tell whether WebGL is hardware-accelerated.
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

### Phase D3 — Escape key on desktop

**Goal**

The desktop builds handle the Escape key, as desktop players expect: it backs out of the menus to the Main Menu, and in a level it pauses the game. This is the first part of "Keyboard and mouse controls" in `docs/desktop-build.md`, section 3. The web and mobile builds don't change: in a browser, Escape already has its own uses (leaving fullscreen, among others), so the game leaves it alone there.

Out of scope: the rest of the keyboard and mouse controls (menu navigation with the arrow keys, Enter, gameplay keys), quitting with Escape, and the Android back button, which keeps working exactly as today.

**Behavior** (desktop builds only)

| Screen | Escape |
| :--- | :--- |
| Intro, Main Menu | Nothing |
| Level Selection, How To Play, Settings, Game Over, You Win! | → Main Menu |
| Game Screen, while the game can be paused | Pauses the game and opens the Pause Overlay |
| Pause Overlay | Resumes the game (same as `<<< RESUME`) |
| Gameplay Tips | Leaves the level → Main Menu (same as the Pause Overlay's EXIT TO MENU) |
| Gameplay Tips, after READY (while the tip fades out) | Nothing |
| Game Screen, while the game can't be paused (the 3-second start delay, the core collapse, the Game Over delay) | Nothing |

Like taps, Escape is ignored while a screen transition runs. A key held down acts once (key repeats are ignored).

**Choices** (confirmed with the user)

- **Desktop only.** The listener exists only when the preload bridge is there (`isDesktop`, `src/desktop.js`), so the web build never takes Escape away from the browser.
- **The Main Menu and the Intro do nothing.** Quitting stays the deliberate EXIT GAME button; Escape never closes the game.
- **On the Pause Overlay, Escape resumes**, like `P`, the controller's menu button and the Android back button, so the same key opens and closes the overlay.
- **On the Gameplay Tips, Escape leaves the level.** The level hasn't started, so nothing is lost; it's the quick way out after choosing the wrong level. During play, Escape only pauses: leaving a level that has started still takes the Pause Overlay's EXIT TO MENU, so a stray key press can't lose a game. Once READY is pressed the level is about to start, so Escape does nothing during the tip's fade-out (it would race with the engine's `begin()`).
- **Electron's fullscreen isn't affected.** The window is fullscreen through `BrowserWindow` (`fullscreen: true`, F11), not the page's Fullscreen API, so Escape doesn't take it out of fullscreen. No change in `electron/`.

**Implementation**

- `src/App.jsx`:
  - A `keydown` listener on `window`, added only when `isDesktop`, acting on `event.key === 'Escape'` without `event.repeat`. It goes through a `useEffectEvent` handler, like `handleBackButton`.
  - The handler is ignored while a transition runs, and follows the table: Intro and Main Menu do nothing; the Game Screen calls `gameEscapeRef`; every other screen calls `goToMainMenu()`.
- `src/screens/GameScreen.jsx`:
  - A new `escapeRef` prop, next to `backRef`. `backRef` keeps its behavior (it does nothing during the tips, as today). While the tip is up and READY hasn't been pressed, `escapeRef` calls `exitToMenu()` (`engine.leave()` and back to the Main Menu). Otherwise it pauses or resumes, like `backRef` (the engine ignores a pause outside play).
  - The tip's state moves up from `GameplayTips`, so the Game Screen knows when READY has been pressed: `tipShown` becomes a three-way state (shown, leaving, gone). `GameplayTips` receives `leaving` and an `onLeave` callback in place of its own `useState`.
- `src/screens/GameplayTips.jsx`: uses the `leaving` prop and calls `onLeave` on READY; nothing else changes (same fade-out, same `onReady` at its end).
- No change to `GameEngine`: `P` and the controller's menu button keep their own handling there.

**Docs** (as part of the implementation)

- `docs/navigation.md`: a "Desktop Escape key" section after "Mobile back button", with the table above, the reason for the Gameplay Tips / Game Screen difference, and a note that the web build ignores Escape.
- `docs/desktop-build.md`, section 3: under "Keyboard and mouse controls", note that Escape is handled (Phase D3); the item stays open for the rest.
- `docs/design-decisions.md`, "Desktop build (Steam)": Escape is desktop only, never quits, resumes on the Pause Overlay, and leaves from the Gameplay Tips but only pauses during play, with the reasons.
- `docs/implementation-status.md`: Phase D3.

**Verification**

- `npm run desktop:start`, Escape on every row of the table: Level Selection, How To Play, Settings, Game Over and You Win! go to the Main Menu with the screen transition; the Main Menu and the Intro do nothing; in a level, Escape opens the Pause Overlay and Escape again resumes; on a level with a tip (e.g. level 2), Escape leaves to the Main Menu and the menu music comes back; after READY, Escape during the fade does nothing; during the start delay, the core collapse and the Game Over delay it does nothing.
- Escape held down: one action only (it doesn't open and close the Pause Overlay repeatedly). Escape pressed during a screen transition: ignored.
- The window stays fullscreen after every Escape press; F11 still toggles it.
- `P`, the controller's menu button and the controller's right face button behave as before.
- `npm run dev` in a browser: Escape does nothing in the game (and still leaves the browser's fullscreen). The Android back button behaves as before, including doing nothing on the Gameplay Tips.
- `npm run lint` passes.

### Phase D4 — ENTER BOUNCERBACK with the controller on desktop

**Goal**

On the desktop builds, the Intro's `ENTER BOUNCERBACK` button works with the game controller, so the Steam Deck can be played from launch with its built-in controls only (a Steam Deck Verified requirement, `docs/desktop-build.md` section 6). A single press of the bottom face button (or RT) enters, even though that press is also the one that makes the controller visible to the game. The web and mobile builds don't change: there the Intro still ignores the controller, because browsers don't unlock audio on controller input.

Out of scope: any other screen's controller behavior, keyboard controls on the Intro, and skipping the Intro on desktop.

**The problem**

- The Intro button has `data-gamepad="ignore"`, so the menu navigation never selects it (`docs/game-controller.md`, "Intro"). The reason (audio needs a click, tap or key press) is a browser rule; Electron's autoplay policy doesn't need a user gesture, so on desktop the reason doesn't hold.
- Chromium only exposes a controller once one of its buttons is pressed on the page, also on the Deck in Game Mode where Steam's virtual controller exists from launch. That press fires `gamepadconnected`, but it never counts as a press: the reader's first poll only records the state, and the first frame with a new menu resets the reader. Making the button selectable alone would therefore need two presses: the first shows the selection, the second enters.

**Choices** (confirmed with the user)

- **Desktop only.** The Intro button stays ignored by the controller on the web and in the native apps (`isDesktop`, `src/desktop.js`).
- **The connecting press enters, on the Intro only.** When a controller connects while the Intro is up and the press that connected it is the bottom face button or RT, it becomes a held press on `ENTER BOUNCERBACK` (pressed look at once) and activates on release, like any other controller press (Phase 35). Any other button, the d-pad or a stick only shows the selection, as on every screen today.
- **Only on a button marked for it.** A new `data-gamepad` role, `connect-press`, marks the one button the connecting press may activate. On every other screen the connecting press still only shows the selection: on the Main Menu, picking up the controller must not start PLAY.
- **Missed presses are accepted.** A press during the Intro's screen-in (the first 0.5 s), or a tap so short it's released before the first poll after `gamepadconnected`, only shows the selection, or nothing during the transition; the player presses again.
- **The autoplay policy is set explicitly** in the Electron window (`autoplayPolicy: 'no-user-gesture-required'`, Electron's current default), so the game never depends on a default that could change.

**Implementation**

- `electron/main.js`: `autoplayPolicy: 'no-user-gesture-required'` in the window's `webPreferences`, with a comment (the Intro button is pressed with the controller on desktop, and controller input isn't a user gesture).
- `src/screens/IntroScreen.jsx`: the button's `data-gamepad` is `connect-press` when `isDesktop`, `ignore` otherwise. The comment explains both.
- `src/input/menuNavigation.js`:
  - A `connectPress` flag, set by the `watchGamepads` callback when a controller connects (next to `controllerMode = true`). The loop starting at mount because a controller is already exposed doesn't set it.
  - In `update()`, once the frame gets past the new-menu reset and the transition check: if the flag is set, it is cleared, and when the selected item has the `connect-press` role and the bottom face button or RT is down (`reader.isDown`, not `wasPressed`), `startPress(selected, button)` runs. The existing `updatePress()` activates it on release. The flag is also cleared when the frame stops at the transition check, so a connection during a transition never turns into a press later.
  - A `CONNECT_PRESS_SELECTOR` (`[data-gamepad~="connect-press"]`) next to the other role selectors; `ITEMS_SELECTOR` is unchanged (the role isn't `ignore`, so the button is selectable).
- No change in `src/input/gamepad.js`, the Intro's layout or its audio code: `unlock()` runs from the button's `onClick`, which `click()` triggers as it does for a mouse.

**Docs** (as part of the implementation)

- `docs/game-controller.md`: the "Intro" bullet (ignored on the web and in the apps; on desktop selectable, and the connecting press enters, with the reason); the `data-gamepad` row of the file table gets the `connect-press` role and notes that `ignore` is web and mobile only.
- `docs/design-decisions.md`, "Desktop build (Steam)": why the Intro takes the controller on desktop (Electron's autoplay policy; Steam Deck Verified), why the connecting press enters only on the Intro, and that missed presses during the screen-in are accepted.
- `docs/desktop-build.md`: section 6's "fully playable with the Deck's built-in controls" item notes the Intro is covered by Phase D4; the "Steam Deck test results" Controller item asks whether one press enters from the Intro.
- `docs/implementation-status.md`: Phase D4.

**Verification**

- `npm run desktop:start` with a controller connected to the Mac, and no button pressed since launch:
  - After the Intro's screen-in, one press and release of the bottom face button enters: the button shows selected and pressed while held, activates on release, and the Main Menu's music starts as usual. Same with RT.
  - Restart; first press on the d-pad, B or a stick: the selection shows, nothing else. The bottom face button then enters.
  - Restart; first press during the screen-in: nothing happens; a later press works.
  - Restart; click `ENTER BOUNCERBACK` with the mouse: works as before. On the Main Menu, the first controller press (bottom face button) only shows the selection on PLAY; it doesn't start a level.
- `npm run dev` in a browser: the controller still can't select or press the Intro button; the other menus behave as before.
- On the Deck (with the Phase D1 test, Game Mode and Desktop Mode): one press of A on the Intro enters, and the music plays.
- `npm run lint` passes.
