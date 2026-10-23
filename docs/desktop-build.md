# Bouncerback — Desktop build and Steam release

Overview of what is needed to publish Bouncerback on Steam for Windows, macOS and Linux. **macOS is "to be considered"**: it is only explored for now, and nothing that costs money (the Apple Developer fee) is committed until it is decided. Windows and Linux are the firm targets. This is a checklist of areas and steps, not a design: each item gets its details (and its own phase in `docs/implementation-plan.md`) when we get to it.

"Steam verified" is taken here as **Steam Deck Verified** (Valve's compatibility rating), on top of the normal Steam release review every game goes through. Confirm this meaning before planning the phases.

---

**Platform order:** the native Linux version comes first, tested on the Steam Deck (SteamOS is Linux, so the Deck is the Linux test machine). Windows follows; macOS stays "to be considered".

---

## 1. Decisions to take first

- [ ] **Desktop wrapper.** Electron is the most likely candidate (it bundles Chromium, so WebGL and the Gamepad API behave like in the browser, and Steamworks bindings exist, e.g. `steamworks.js`). Tauri is lighter but uses the system WebView, which differs per OS and is riskier for the CRT shaders. Pick one, record it in `docs/design-decisions.md` and `docs/tech-stack.md`.
- [ ] **Steamworks integration scope.** Minimum: launching through Steam and the overlay. Optional: achievements, cloud saves, Steam Input, leaderboards for the high score.
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
- [ ] Quit option (desktop games need an exit path from the Main Menu).
- [ ] Keyboard and mouse controls for menus and gameplay (today: touch, mouse, gamepad).
- [ ] Persistent data (settings, unlocked levels, high score) stored in the OS user-data folder instead of browser storage, or at least verified to survive updates.
- [ ] Audio: autoplay unlocking is not an issue in the wrapper, but check volume and device-change behavior.
- [ ] Performance check of the CRT / zoom blur post-processing on integrated GPUs and on the Steam Deck.
- [ ] Remove web-only things from the desktop build (FTP deploy, web analytics if any).

---

## 4. Steam integration

- [ ] Initialize the Steamworks SDK in the wrapper; handle "Steam not running" and `steam_appid.txt` for development.
- [ ] Steam overlay working over the WebGL canvas (a known pain point with Electron: needs testing on each OS).
- [ ] Optional features chosen in section 1 (achievements, cloud saves, leaderboards).
- [ ] Steam Input: controller configuration so Steam's layer and the existing Gamepad API handling in `docs/game-controller.md` do not conflict.

---

## 5. Packaging per platform

| Platform | Output | Main points |
| :--- | :--- | :--- |
| **Windows** | x64 folder or installer-less build | Signing (optional), test on a clean machine, Visual C++ runtime not needed with Electron. |
| **macOS** *(to be considered)* | `.app` (universal: Intel + Apple Silicon) | Needs the paid Apple Developer account: signing, hardened runtime, notarization, entitlements, build on a Mac. Decide before investing in it. |
| **Linux** | x64 build, run under the Steam Linux Runtime | Test on a mainstream distro, Chromium sandbox flags, GPU drivers. |

- [ ] Add npm scripts for each target (e.g. `build:desktop:win`, `:mac`, `:linux`), reusing `vite build` for the web part.
- [ ] Desktop icons for each OS (from `assets/native/` sources).
- [ ] Version numbering shared with `package.json`.
- [ ] CI pipeline producing the three builds (optional but recommended).
- [ ] Add the new folder(s) to `docs/project-structure.md`; keep `android/`, `ios/` untouched.

---

## 6. Steam Deck Verified requirements (overview)

- [ ] Fully playable with the Deck's built-in controls, no keyboard or mouse needed (including every menu, and entering anything that needs text).
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
