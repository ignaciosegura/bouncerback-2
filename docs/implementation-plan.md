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

### Phase D5 — Windows test build

**Goal**

A Windows x64 build of the game, wrapped in Electron like the Linux one, made on the Mac and tried on the Mac under CrossOver. It is the first pass of the Windows row in `docs/desktop-build.md`, section 5 (step 5 of "Suggested order", moved forward: it needs no Steam work and shows early whether anything in the wrapper behaves differently on Windows).

Out of scope: code signing, an installer, CI, Steamworks, Windows on ARM, and testing on a real Windows PC (none is available for now; it stays open in `docs/desktop-build.md`, section 8). The game runs exactly as in the Linux build; no change in `src/`.

**Choices** (confirmed with the user)

- **Output: a `.zip` of the unpacked app**, like the Linux `.tar.gz`: extract it and run `Bouncerback.exe`. No NSIS installer or portable `.exe`: Steam installs a depot's folder itself, so the zip is closest to what ships, and a portable `.exe` unpacks itself to a temporary folder on every launch.
- **x64 only.** Steam's Windows build is x64; Windows on ARM PCs run it under emulation.
- **Built on the Mac**, as the Linux build. electron-builder 26 edits the `.exe` (icon, version information) in JavaScript (`resedit`), so no Wine is needed to build; there are still no native modules. CI is left for a later phase.
- **Unsigned.** On a real Windows PC, SmartScreen warns on the first launch ("Windows protected your PC" → More info → Run anyway). Signing becomes its own phase once a certificate is bought (`docs/desktop-build.md`, section 2).
- **Tested under CrossOver on this Mac** (Wine, with the x64 code running through Rosetta 2). It shows whether the build is sound: it starts, the files and the saved-data folder are in place, the Windows code paths of Electron work (fullscreen, F11, quitting, links), the controller and the keyboard reach the game. It does **not** show how the game performs on Windows: the GPU calls go through translation layers (Direct3D → Metal) and the CPU through Rosetta, so frame rate, GPU status and controller details are noted but not taken as Windows results.
- **Executable name `Bouncerback.exe`** (the product name, as Windows apps usually are), not the Linux build's lowercase `bouncerback`.

**Implementation**

- `package.json`: a `desktop:build:win` script (`vite build`, then `electron-builder --win zip --x64`).
- `electron-builder.json`:
  - A `win` section: target `zip` x64, icon from `assets/native/icon-only.png` (1024×1024; electron-builder makes the `.ico` from it), `artifactName` `bouncerback-${version}-win-x64.${ext}` so it sits next to the Linux archive in `release/` without confusion.
  - A top-level `copyright` (`© 2026 Nik Nak Studio`), shown in the `.exe`'s file properties with the version and the company (`author` in `package.json`).
  - `files` stays as it is: only `dist/`, `electron/` and `package.json`, no `node_modules`.
- `electron/main.js`: nothing Windows-specific is expected. The Linux-only X11 switch is already behind `process.platform === 'linux'`; the user-data folder becomes `%APPDATA%\Bouncerback\` by itself. If the CrossOver test needs a change in the wrapper (and not only a launch flag, see below), it is discussed before being made.
- No change in `src/`.

**Running it in CrossOver** (goes into `docs/desktop-build.md`, "Test builds")

1. On the Mac: `npm run desktop:start` to check the build, then `npm run desktop:build:win`; the archive is `release/bouncerback-<version>-win-x64.zip`, and `release/win-unpacked/` is the same build, unpacked.
2. In CrossOver, create a bottle for it (Windows 10 64-bit), e.g. "Bouncerback".
3. Extract the zip into the bottle's C: drive (CrossOver → the bottle → Open C: Drive), e.g. to `C:\Games\Bouncerback\`.
4. Bottle → Run Command → Browse to `Bouncerback.exe` → Run. Tick "Debug options → create log file" the first time, to keep the console output. "Save command as a launcher" keeps it in the bottle for the next runs.
5. **If it doesn't start, or shows a blank window**, try these one at a time in Run Command's command line, and note which one was needed: `--no-sandbox` (Chromium's sandbox often fails under Wine), `--disable-gpu-sandbox`, then a different graphics backend in the bottle's settings (Auto, D3DMetal, DXVK), then `--use-angle=gl`. A flag that only CrossOver needs stays a launch flag, not a change in the wrapper.

The build starts fullscreen; F11 toggles windowed mode; Ctrl+Shift+I opens DevTools. Saved data and `launch-info.txt` are in the bottle, under `drive_c/users/crossover/AppData/Roaming/Bouncerback/` (the bottle's folder is in `~/Library/Application Support/CrossOver/Bottles/`).

**Feedback to collect** (results go into `docs/desktop-build.md`, a new "Windows test results (CrossOver)" section)

- Starts? Which launch flags and graphics backend were needed; time to the Intro; any white flash; the log file and `launch-info.txt` (Electron and Chromium versions, GPU feature status: is WebGL hardware-accelerated?).
- Display: fullscreen on the Mac's screen, the whole UI scaled and nothing cut off; F11 to windowed and back; resizing the window.
- Rendering: the CRT and zoom blur look as in the browser (OLD TV off and on), no missing shapes or black screen. Frame rate noted, not judged.
- Audio: music and effects play, no crackle, volume steps work.
- Controller (the one used with the Mac): seen by the game, menus, ENTER BOUNCERBACK with it (Phase D4), gameplay, pause with the menu button.
- Keyboard and mouse: Escape on the menus and in a level (Phase D3), `P`, F11; mouse in menus and gameplay.
- Saved data survives closing and reopening, and is in the folder above.
- Quitting: EXIT GAME (Phase D2) and closing the window; no `Bouncerback.exe` left running in the bottle (CrossOver → the bottle → Quit / task list).
- Credit links: open in the Mac's default browser (CrossOver hands URLs to macOS)?
- The `.exe`'s icon and file properties (version, company, copyright) as shown under CrossOver, if it shows them.

**Docs** (as part of the implementation)

- `docs/desktop-build.md`:
  - Section 1, "Where the build runs": the Linux and Windows test builds are made on the Mac; CI still open.
  - Section 5: the Windows row's first pass (zip, unsigned, built on the Mac); the npm scripts item notes `desktop:build:win` (Phase D5), macOS to come.
  - "Test builds": a "Windows x64 (Phase D5)" part with "Running it in CrossOver" above, and an empty "Windows test results (CrossOver)" section with the feedback list, to fill after the test.
  - Section 8: note that a real Windows 10/11 PC test is still needed before release, since CrossOver isn't representative.
- `docs/tech-stack.md`: the Desktop Packaging row (Windows x64 zip next to the Linux build); the development environment row (the Windows build is made on the Mac too; CrossOver for a first test); `desktop:build:win` in the desktop commands.
- `docs/project-structure.md`: `electron-builder.json`'s comment names both build scripts.
- `docs/design-decisions.md`, "Desktop build (Steam)": Windows zip, x64 only, built on the Mac, unsigned, CrossOver as a smoke test only, with the reasons.
- `docs/implementation-status.md`: Phase D5.

**Verification**

- `npm run desktop:build:win` on the Mac produces `release/bouncerback-<version>-win-x64.zip` containing `Bouncerback.exe`, with no project `node_modules` inside the app's `resources/app.asar`; size noted next to the Linux archive's (about 130 MB).
- `npm run desktop:build:linux`, `npm run desktop:start`, the web build (`npm run build`) and the mobile builds (`npm run cap:sync`) are unchanged.
- In CrossOver: the steps in "Running it in CrossOver" work, and every item in "Feedback to collect" has an answer written into `docs/desktop-build.md`.
- `npm run lint` passes.
