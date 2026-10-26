# Bouncerback — Desktop & Steam Archive

Completed phases of the desktop & Steam cycle, moved here from `docs/implementation-plan.md` once done. History only: the other docs are the source of truth for how the game works now; read this only when working on, or asked about, one of these phases.

---

## Desktop & Steam Cycle

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
