# Bouncerback — Desktop build and Steam release

Overview of what is needed to publish Bouncerback on Steam for Windows, macOS and Linux. **macOS is "to be considered"**: it is only explored for now, and nothing that costs money (the Apple Developer fee) is committed until it is decided. Windows and Linux are the firm targets. This is a checklist of areas and steps, not a design: each item gets its details (and its own phase in `docs/implementation-plan.md`) when we get to it.

"Steam verified" is taken here as **Steam Deck Verified** (Valve's compatibility rating), on top of the normal Steam release review every game goes through. Confirm this meaning before planning the phases.

---

**Platform order:** the native Linux version comes first, tested on the Steam Deck (SteamOS is Linux, so the Deck is the Linux test machine). Windows follows; macOS stays "to be considered".

---

## 1. Decisions to take first

- [x] **Desktop wrapper: Electron.** It bundles Chromium, so WebGL, the CRT shaders and the Gamepad API behave the same on every OS and like in the browser, and Node bindings for Steamworks exist (see "Binding library" in section 4). Tauri was rejected: lighter, but it uses the system WebView, which differs per OS (WebKitGTK on Linux and the Deck) and is riskier for the shaders and the Gamepad API. Recorded in `docs/design-decisions.md` ("Desktop build") and `docs/tech-stack.md`.
- [x] **Steamworks integration scope: minimum.** Only what a Steam release and Steam Deck Verified need: launching through Steam, the overlay, and a default controller configuration (details in section 4). Everything else Steamworks offers is listed in section 4 as **nice to have**, not planned: each one can become its own phase after release, or before it if we decide so.
- [ ] **Game name, price, release date target.**
- [ ] **Where the build runs.** Windows and Linux builds can come from CI runners (e.g. GitHub Actions) or local machines. (macOS, if it goes ahead, needs a Mac for building and notarization.)
- [ ] **macOS: to be considered.** Decide later whether it is worth the Apple Developer fee. Until then, keep the wrapper choice and the code macOS-compatible, but do not set up signing or notarization.

---

## 2. Accounts, legal and business (can start now, they take time)

- [ ] Steamworks partner account, with the identity, tax and bank information Valve requires.
- [ ] Steam Direct fee for the app (per game) and the waiting period before release.
- [ ] *(macOS, to be considered)* Apple Developer Program membership (paid; needed to sign and notarize the macOS build). Not to be bought just to explore the option.
- [ ] Windows code-signing certificate (not mandatory for Steam, but avoids SmartScreen warnings for any build distributed outside it).
- [ ] **Font license (open issue).** The font ("C64 Angled") comes from Devin D. Cook's "Commodore 64 Font" package (version 6.22, 2004-2005, www.DevinCook.com). Its READ ME states no license or terms of use. The dafont page (https://www.dafont.com/es/commodore-64.font) labels it "100% Gratis" and says nothing about commercial use; dafont's own FAQ says the label is "only an indication" and to contact the author in case of doubt. So commercial use is not covered. dafont lists newer files (Commodore Angled v1.2) than the v1-1 we have. Steps: (1) look for terms on the author's website (devincook.com had an expired HTTPS certificate when checked; try an archived copy); (2) ask the author for written permission for commercial use in a Steam game; (3) if that fails, replace it with a font with a clear license (e.g. an OFL pixel font, which also lets us embed it freely). **Fallback candidate:** https://github.com/zeiche/c64font (`c64.ttf`/`.otf`, plus `c64-commodore` and `c64-shift` variants), dedicated to the public domain under CC0 1.0. Caveats: the repo names no author and gives no source (1 commit, 2 stars), so CC0 is only as reliable as the uploader's right to grant it (it could be a copy of someone else's font, or drawn from the C64 ROM character set, whose copyright is murky in itself); and it is not the "Angled" look, so the game would change visually. If we adopt it, check its glyphs and metrics against the UI (font sizes, 1 line height, text boxes), and prefer a font with a traceable author.
 The package also includes company logos and game characters (Commodore, Pac-Man, Atari, Apple...) as dingbats; the game does not use those, but they are a reason to ship only the letter glyphs, or the replacement font. (Music and sound effects are the author's own production: no issue.)
- [ ] Age rating / content questionnaire in Steamworks, privacy policy URL if needed.

---

## 3. Game changes for desktop

- [ ] Remove or disable the mobile-only parts on desktop (Capacitor plugins in `src/native.js`, safe areas, forced orientation).
- [ ] Window behavior: fullscreen toggle, windowed resizing, remembered window size, aspect ratio handling on the 1080px reference layout.
- [x] Quit option (desktop games need an exit path from the Main Menu): the Main Menu's EXIT GAME button, desktop builds only (Phase D2).
- [ ] Keyboard and mouse controls for menus and gameplay (today: touch, mouse, gamepad). The Escape key is handled (Phase D3, see "Desktop Escape key" in `docs/navigation.md`); the rest is pending.
- [ ] Persistent data (settings, unlocked levels, high score) stored in the OS user-data folder instead of browser storage, or at least verified to survive updates.
- [ ] Audio: autoplay unlocking is not an issue in the wrapper, but check volume and device-change behavior.
- [ ] Performance check of the CRT / zoom blur post-processing on integrated GPUs and on the Steam Deck.
- [ ] Remove web-only things from the desktop build (FTP deploy, web analytics if any).

---

## 4. Steam integration

The Steamworks SDK is reached through a Node binding, which still has to be chosen (see "Binding library" below). It runs in Electron's **main process** only; the game (renderer) never calls it directly. Whatever the renderer needs from Steam (e.g. "the overlay opened") crosses through a small preload bridge, as low-frequency messages, the same way React and PixiJS talk today. The web and mobile builds must keep working without any of it: on those builds the bridge simply isn't there.

### Binding library (checked 2026-10-26, current Electron 45)

- **`steamworks.js`** (ceifa): the best known. Its last npm release is 0.4.0 from August 2024, and the last commit to its repo is from September 2025. It is built on N-API, so in principle a newer Electron doesn't need a rebuild, but nobody has confirmed it works on recent Electron versions, and its own test app uses Electron 24. Its overlay support (`electronEnableSteamOverlay()`, Chromium switches) has open reports of **not working on native Linux** and on macOS; it is reported to work on Windows. That rules it out for us as it stands, since Linux comes first.
- **`steamworks-ffi-node`** (ArtyProf, MIT): newer (since October 2025), actively released (0.11.3 in September 2026), needs Node 22 or newer (Electron 45 has it). Calls the SDK through `koffi` instead of a compiled addon. Its overlay draws the Electron window's content into its own native window (OpenGL on Windows and Linux, Metal on macOS) where Steam can inject the overlay. It says this was tested on Windows, macOS and the Steam Deck's Desktop Mode, and it needs **X11 on Linux (no Wayland yet)**. It is still young and maintained by one person, and copying every frame adds a cost. Both its native files must be unpacked from the `.asar` archive when packaging.
- **The Deck's Game Mode** might not need any of this: there the screen is composed by gamescope, which draws the Steam overlay itself. Check this on the Deck first; if it holds, the overlay problem is limited to desktop Linux and Windows.
- **To decide at the start of the phase:** first build a small test app with Electron 45 and `steamworks-ffi-node` (init, overlay, overlay event) and run it on the Deck (Game Mode and Desktop Mode), desktop Linux and Windows. If the overlay can't be made to work on desktop Linux, decide whether to accept that (Steam doesn't require the overlay) rather than block the release on it.

### Minimum scope (planned)

- [ ] **Initialize Steamworks** in the main process at startup, with the game's App ID.
- [ ] **Launched outside Steam:** ask Steam to relaunch the game through it (the SDK's "restart app if necessary" check) and quit. If Steam can't be reached at all, show a plain error and quit, rather than starting without Steam.
- [ ] **Development:** a `steam_appid.txt` next to the executable when running from source or from a local build, never shipped in the Steam depots.
- [ ] **Steam overlay** (Shift+Tab, or the Steam button on the Deck) drawn over the WebGL canvas. A known pain point with Electron: it needs specific Chromium switches and a canvas that repaints continuously (ours does, `app.ticker` runs every frame). Test on each OS and on the Deck.
- [ ] **Pause when the overlay opens.** The game already pauses when the window loses focus, but the overlay doesn't take the focus away; listen to Steam's overlay-activated event and open the Pause Overlay, as the focus loss does (only while playing, same rules as `P`).
- [ ] **Default controller configuration** in Steamworks (Steam Input "gamepad" template), so Steam presents every controller (including the Deck's built-in controls) to the game as a standard gamepad, which the existing Gamepad API handling in `docs/game-controller.md` already reads. No Steam Input API calls in the code. Check that Steam's layer and the game don't both react to the same press (e.g. the menu button).
- [ ] **No Steam DRM wrapper** on the executable (it is known to break Electron apps, and it isn't required).

### Nice to have (not planned)

Extended Steamworks features, listed so they can be picked up later. None of them is needed for the release or for Steam Deck Verified. Each needs its own design (what exactly is tracked or shown) and its own phase.

- **Achievements.** E.g. beating each level, beating the game, capturing the supercharged atom, a long charged atom hold, a level with no life lost. Needs the list and the icons (locked and unlocked) designed, set up in Steamworks, and the game events that trigger them sent from the engine to the main process (low frequency, at the end of a level or on a capture). Must work when unlocked offline (Steam syncs later).
- **Stats.** Counters behind the achievements (total captures, atoms bounced, levels played). Only worth it together with achievements or leaderboards.
- **Leaderboards.** One per level for the high score, with the player's rank and friends' scores. Needs a place on screen to show them (e.g. Game Over / You Win! or Level Select), which is new UI: plan it with a mockup. Scores are client-submitted, so cheating can't really be prevented: accept it for a casual game.
- **Steam Cloud.** Saves settings, unlocked levels and high scores across machines. **Auto-Cloud** (set up in Steamworks, no code) needs the save data in plain files under a known folder; today it is in `localStorage`, which Electron keeps in a database folder that isn't safe to sync. So it needs the save data moved to a file first (see "Persistent data" in section 3), and a rule for conflicts (e.g. keep the most progress).
- **Rich Presence.** What friends see in their Steam friends list, e.g. "In the menus" / "Playing LEVEL NAME". A few calls on screen changes.
- **Steam Input API** (full integration, beyond the default configuration): named actions ("place paddle", "capture", "pause") and action sets for menus and gameplay, so players can remap them in Steam, and Steam's own button glyphs for whatever controller is in use. Large change: it would replace or sit beside the Gamepad API handling, and all of `docs/game-controller.md`.
- **Game recording timeline** (Steam's game recording feature): markers on the recording's timeline for moments like a capture, a life lost, a level won, so players find their highlights easily.
- **Overlay web browser** for the Main Menu credit links (niknak.es, manfromspace.com), so they open inside the Steam overlay instead of switching to the desktop browser (better on the Deck, where there is no desktop in Game Mode).
- **Steam Deck detection** to adapt defaults on the Deck, e.g. the OLD TV switch or a lighter post-processing if the performance check in section 3 asks for it.
- **Steam Workshop** for player-made levels: the levels are already JSON files with a schema (`docs/level-file-schema.json`). Large feature: a way to make and test levels, upload, browse and play them, validation of untrusted files.
- **Steam Trading Cards, badges, profile items.** No code: art and Steamworks setup only, and Valve enables them only once the game has enough sales.

---

## 5. Packaging per platform

| Platform | Output | Main points |
| :--- | :--- | :--- |
| **Windows** | x64 folder or installer-less build | Signing (optional), test on a clean machine, Visual C++ runtime not needed with Electron. |
| **macOS** *(to be considered)* | `.app` (universal: Intel + Apple Silicon) | Needs the paid Apple Developer account: signing, hardened runtime, notarization, entitlements, build on a Mac. Decide before investing in it. |
| **Linux** | x64 build, run under the Steam Linux Runtime | Test on a mainstream distro, Chromium sandbox flags, GPU drivers. |

- [ ] Add npm scripts for each target, reusing `vite build` for the web part. *(Linux done in Phase D1: `desktop:build:linux`; Windows and macOS to come.)*
- [ ] Desktop icons for each OS (from `assets/native/` sources).
- [ ] Version numbering shared with `package.json`.
- [ ] CI pipeline producing the three builds (optional but recommended).
- [x] Add the new folder(s) to `docs/project-structure.md`; keep `android/`, `ios/` untouched. *(Phase D1: `electron/`, `electron-builder.json`, `release/`.)*

---

### Test builds

**Linux x64 (Phase D1).** Built on the Mac; no Steam integration.

1. `npm run desktop:start` builds the web app and runs it in Electron on the Mac, as a check before copying. (From a VS Code terminal, run `unset ELECTRON_RUN_AS_NODE` first: VS Code sets it, and it makes Electron run as plain Node.)
2. `npm run desktop:build:linux` builds `release/bouncerback-<version>.tar.gz` (about 130 MB). `release/linux-unpacked/` is the same build, unpacked.
3. Copy the archive to the Deck (USB stick, or a network share in Desktop Mode) and extract it, e.g. to `~/Games/`, keeping the permissions (Dolphin's "Extract here" does). It extracts to a `bouncerback-<version>/` folder.
4. **Desktop Mode:** run `./bouncerback` in that folder (double click, or from Konsole to see the console output). If it stops at once with a message about the sandbox (`chrome-sandbox`), try `./bouncerback --no-sandbox` and note it in the results: it gets fixed in the packaging, not on the Deck.
5. **Game Mode:** Game Mode only starts things from the Steam library, so in Desktop Mode add the executable as a non-Steam game (Steam → Add a Game → Add a Non-Steam Game → Browse). It's still the native Linux build, with no Steamworks and no Proton: check that "Force the use of a specific Steam Play compatibility tool" stays off in its properties. Then switch to Game Mode and start it from the library. Steam Input gives the game a virtual controller, as it will on release.

The build starts fullscreen. F11 toggles windowed mode; Ctrl+Shift+I opens DevTools (Desktop Mode: Steam + X brings up the keyboard). Saved data and `launch-info.txt` (Electron and Chromium versions, display, GPU and WebGL status) are in `~/.config/Bouncerback/`. In Game Mode the Deck's performance overlay (Quick Access → Performance) shows FPS and GPU load.

### Steam Deck test results

To be filled after testing the Phase D1 build, in both modes unless noted. Date and SteamOS version:

- **Starts?** Time to the Intro; any white flash; console output; `launch-info.txt` (is WebGL hardware-accelerated?):
- **Display at 1280x800:** whole UI scaled correctly at 16:10, nothing cut off; menu background cropped as expected; arena and CRT glass fit:
- **Text legibility:** HUD, credits, How To Play, gameplay tips:
- **Performance:** 60 fps in menus and in level 5, OLD TV off and on; last life zoom; stutter at level start; battery draw:
- **Audio:** music and effects, crackle, volume steps; after sleep and wake:
- **Controller:** seen by the game in Desktop Mode? in Game Mode? Menus (d-pad, A, B), gameplay (both sticks, captures, holds), pause with the menu button; does one press of A enter from the Intro (Phase D4); any button acting in Steam and in the game at once:
- **Gamepad indicator** (Main Menu): shown or hidden; switches to "Gamepad detected"?
- **Touchscreen:** menus and gameplay; trackpad as mouse in Desktop Mode:
- **Saved data** survives closing and reopening (OLD TV, volumes, unlocked levels, high score):
- **Pause when leaving the game:** Steam button / Quick Access in Game Mode; switching windows in Desktop Mode:
- **Quitting:** Game Mode (Steam button → Exit game), Desktop Mode (closing the window), and the Main Menu's EXIT GAME button in both (with the build that has it, Phase D2); no process left running:
- **Credit links:** what happens in each mode:
- **Sleep and resume** during a level and in the menus:
- **Other:**

---

## 6. Steam Deck Verified requirements (overview)

- [ ] Fully playable with the Deck's built-in controls, no keyboard or mouse needed (including every menu, and entering anything that needs text). The Intro's `ENTER BOUNCERBACK` takes the controller on desktop from Phase D4.
- [ ] Default controller glyphs and button names match the Deck's controller.
- [ ] Text legible at the Deck's 1280x800 screen (smallest text size check, mixed-case informative texts).
- [ ] Runs on the Deck's default configuration without extra setup or launchers.
- [ ] Performance stable at the Deck's resolution and refresh rate.
- [ ] Sleep/resume and Steam overlay behave properly.
- [ ] Test on the real Steam Deck we already have (no need to buy one), then wait for Valve's review of the rating.

---

## 7. Steam store setup

- [ ] Create the app in Steamworks and the store page: description, tags, supported languages, system requirements for each OS.
- [ ] Store art: capsule images (several sizes), header, library assets, screenshots, trailer.
- [ ] Depots and builds: one depot per OS (or shared), SteamPipe upload with `steamcmd` and build scripts, launch options per OS.
- [ ] Release branches (e.g. `default`, `beta`) for testing before going public.
- [ ] Coming-soon page published as early as possible (Steam asks for a period of visibility before release).

---

## 8. Testing and review

- [ ] Test matrix: Windows 10/11, one or two Linux distros, Steam Deck; current macOS (Intel and Apple Silicon) only if macOS goes ahead.
- [ ] Install, update and uninstall through Steam on each OS.
- [ ] Valve's review of the store page and of the build (can send changes back).
- [ ] Release checklist: price, regions, release date, press/keys, launch announcement.

---

## 9. Suggested order

1. Take the decisions (section 1) and open the accounts (section 2), since approvals take days or weeks.
2. Wrap the web build in the desktop wrapper and make the native **Linux** build first (section 5, first pass). Run it on the Steam Deck early (before any Steam integration) to check the CRT shaders, performance and gamepad handling on its hardware.
3. Desktop game changes (section 3), tested on the Linux build and the Deck.
4. Steamworks integration (section 4).
5. Windows build, then signing and CI (section 5, second pass); macOS notarization only if macOS is confirmed.
6. Steam Deck pass (section 6).
7. Store page, depots and review (sections 7 and 8).
8. Release.
