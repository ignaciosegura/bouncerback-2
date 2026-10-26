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

### Phase D2 — EXIT GAME button on the desktop Main Menu

**Goal**

Desktop games need a way to quit from the Main Menu (`docs/desktop-build.md`, section 3, "Quit option"). The desktop builds get a fourth Main Menu button, `EXIT GAME`, under `HOW TO`, that closes the game (MAIN MENU - desktop mockup). The web and mobile builds keep the three-button Main Menu exactly as it is.

Out of scope: the rest of section 3 (keyboard controls, window size memory, save files), an Escape key or a controller button to quit, and the Steam integration. The bridge added here is the one the Steam phases will extend.

**Layout** (MAIN MENU - desktop mockup; sizes at the 1920x1080 reference)

| | Web / mobile (MAIN MENU) | Desktop (MAIN MENU - desktop) |
| :--- | :--- | :--- |
| Buttons | PLAY, SETTINGS, HOW TO | PLAY, SETTINGS, HOW TO, EXIT GAME |
| Button height | 70px (32px text, 0.5em padding top and bottom, two 3px borders) | 70px |
| Gap between buttons | 64px | a third of a button's height: 70 / 3 ≈ 23.3px |
| Logo bottom → PLAY top | 132px | 120px |
| Logo top, last button's bottom | — | unchanged |

Three buttons and two gaps of about a button's height make room for four buttons and three gaps of a third of a button: 3 × 70 + 2 × 64 = 338px on web / mobile, 4 × 70 + 3 × 70/3 = 350px on desktop. The 12px left over (the 64px gap is 6px short of a button) come out of the space between the logo and PLAY, so the logo, the last button's bottom, the credits and the gamepad indicator stay where they are. The mockup was drawn with 32px gaps and a 96px logo gap; the gap rule above is the one to implement, and the mockup is the reference for everything else. The block from the logo's top to the last button's bottom keeps its height, so the group stays centered with no other change. The gamepad indicator keeps its size and place: its bottom stays level with the last button's bottom (now EXIT GAME's), and its top no longer lines up with a button's top (it sits about 53px below SETTINGS' top).

EXIT GAME is a normal menu button: same width as the others (they stretch to the widest, and EXIT GAME is the widest label at 9 characters; check that the column doesn't get wider than in the mockup, 283px), uppercase, single line.

**Choices** (confirmed with the user)

- **Desktop detection through a preload bridge**, not by sniffing the user agent or the `app:` protocol. `docs/design-decisions.md` already plans "a small preload bridge" for Steamworks; this phase creates it with its first message. The page asks one question, "is the bridge there?", so the web and mobile builds need no flag: the bridge simply isn't there.
- **Quitting plays the screen-out.** EXIT GAME behaves like any other Main Menu button: the screen-out transition plays (elements fade, tint and shake, 1 s) and the music fades out (`soundManager.stopTrack()`, 0.5 s) during it, then the app quits at the end of the screen-out, on the tinted, empty background. No confirmation dialog for now: nothing is lost by quitting from the Main Menu (progress and settings are saved as they change).
- **Quitting is done by the main process** (`app.quit()`), not `window.close()` from the page: the main process is the one that will also have to shut Steamworks down cleanly later.

**Implementation**

- `electron/preload.cjs` (new): CommonJS, since a sandboxed preload can't be an ES module. With `contextBridge.exposeInMainWorld('bouncerbackDesktop', { quit: () => ipcRenderer.send('quit') })`. Nothing else is exposed: no `ipcRenderer`, no Node.
- `electron/main.js`:
  - `webPreferences.preload` set to the preload (context isolation and the sandbox stay on).
  - `ipcMain.on('quit', …)` calls `app.quit()`, only for messages from the game's own frame (`event.senderFrame.url` on `app://bouncerback/`).
- `src/desktop.js` (new, next to `src/native.js` and in its style): `isDesktop` (the bridge exists) and `quitDesktop()` (a no-op without the bridge).
- `src/App.jsx`: an `exitGame` handler for the Main Menu, ignored while a transition runs like `navigate`. It fades the music out and starts the screen-out with no next screen to show; `handleTransitionEnd` calls `quitDesktop()` when the screen-out ends instead of swapping screens. The screen stays on its tinted, empty state until the window closes.
- `src/screens/MainMenuScreen.jsx`: `EXIT GAME` button after `HOW TO`, rendered only when `isDesktop`; the screen gets a `main-menu-screen--desktop` class in that case. The gamepad indicator stays the last child of the menu.
- `src/index.css`, Main Menu section:
  - `--button-height` (now defined on `.gamepad-indicator` only) moves up to `.main-menu-screen`, so both use it.
  - `.main-menu-screen--desktop .menu__items`: gap `calc(var(--button-height) / 3)`, so it follows the button's real height (the border has a 1px floor on small screens).
  - `.main-menu-screen--desktop .main-menu__logo`: bottom margin 120px, written as 132px minus the extra height (`calc(132 * var(--u) - (var(--button-height) + var(--button-height) - 2 * 64 * var(--u)))`, i.e. the fourth button plus the three new gaps minus the two old ones), so the group's height stays the same at any scale.
  - `.gamepad-indicator`: its height stays two buttons plus 64px, written as its own value and not from the menu's gap (it must not shrink with the desktop gap). Update its comment ("from the SETTINGS top to the HOW TO bottom" holds on web / mobile only).
- Controller navigation needs no change: it moves between every button of the screen, so EXIT GAME is reachable with the d-pad and activated with the bottom face button like the others. The right face button still does nothing on the Main Menu (it never quits).

**Docs** (as part of the implementation)

- `docs/navigation.md`, Main Menu: `Exit Game Button (desktop builds only; quits the game after the screen-out)`.
- `docs/graphical-specs.md`:
  - "Game logo": the three buttons on web / mobile, four on desktop; the desktop gaps (a third of a button's height between buttons, the logo → PLAY gap shrunk by the extra height so the logo and the last button's bottom don't move), MAIN MENU - desktop mockup (its gaps are drawn at 32px; the rule wins).
  - "Main Menu gamepad indicator": the drawing's size and place don't change on desktop; it keeps its bottom level with the last button's.
- `docs/desktop-build.md`, section 3: tick "Quit option".
- `docs/design-decisions.md`, "Desktop build (Steam)": the preload bridge created (detection by its presence), quitting through the main process after the screen-out, and the desktop Main Menu layout taking the room from the logo gap.
- `docs/project-structure.md`: `electron/preload.cjs`, `src/desktop.js`.
- `docs/implementation-status.md`: Phase D2.

**Verification**

- `npm run desktop:start`: the Main Menu shows four buttons and matches the MAIN MENU - desktop mockup at 1920x1080 (gaps of 23.3px between buttons, logo → PLAY 120px; the logo, EXIT GAME's bottom, the gamepad indicator and the credits exactly where the logo, HOW TO's bottom, the indicator and the credits are on the web build), and scales with the window (F11, then resize the window).
- EXIT GAME with the mouse and with the controller (d-pad down to it, bottom face button): the screen-out plays, the music fades, the window closes, and no Electron process is left running. Clicking it twice or pressing it during a transition does nothing more.
- Other screens are unchanged on desktop; the credit links still open in the system browser.
- `npm run dev` in a browser and the mobile builds (`npm run cap:sync`, a quick Android check): three buttons, layout exactly as the MAIN MENU mockup, and `window.bouncerbackDesktop` is undefined.
- `npm run lint` passes. `npm run desktop:build:linux` still builds, and the archive contains `electron/preload.cjs`. On the Deck (with the next D1 test): EXIT GAME closes the game in Desktop Mode and returns to the library in Game Mode.
