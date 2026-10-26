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
