# Game Controller

Single source of truth for game controller (gamepad) support: the terms the docs use, the controls, and how the game reads controllers. Other docs use the terms below as they are and link here instead of repeating brand names or rules. The look of the menu selection is a visual spec, so it lives in `graphical-specs.md` ("Game controller selection").

Mouse, touch and keyboard keep working alongside the controller.

---

## Terminology

Buttons are named by **position**, not by the label printed on them, because that's how the browser reports them (the Gamepad API's `standard` mapping) and what the code reads. The docs always use the names in the first column.

| Term in the docs | Xbox | PlayStation | Standard index | Code (`BUTTONS.*`) |
| :--- | :--- | :--- | :--- | :--- |
| **bottom face button** | A | Cross | 0 | `A` |
| **right face button** | B | Circle | 1 | `B` |
| **LT / RT** (left / right trigger) | LT / RT | L2 / R2 | 6 / 7 | `LT` / `RT` |
| **L3 / R3** (pressing a stick down) | LS / RS | L3 / R3 | 10 / 11 | `L3` / `R3` |
| **menu button** | Menu (≡) | Options | 9 | `MENU` (added in Phase 8) |
| **d-pad** up / down / left / right | d-pad | d-pad | 12 / 13 / 14 / 15 | `UP` / `DOWN` / `LEFT` / `RIGHT` |
| **left / right stick** | left / right stick | left / right stick | axes 0–1 / 2–3 | `stick('left' \| 'right')` |

Other terms:

* **Press:** a button going down. Actions fire once per press; holding does nothing more.
* **Pushed / released** (sticks): a stick is pushed from 75% deflection and released again below 35% (see "How controllers are read").
* **Controller mode** (menus): the state in which a menu item is shown as selected.

---

## Controls

### Menus

* **d-pad or left stick:** moves the selection to the nearest button in that direction. One step per push: holding doesn't repeat, and there's no wrap-around. Only buttons can be selected (menu buttons and the Settings `-` / `+` steps); the Main Menu credit links are skipped.
* **bottom face button or RT:** activates the selected button, exactly like a click: the button shows pressed (inverted, as under a held mouse button) while the control is held, and it activates on release.
* **right face button:** goes back, by activating the screen's `<<< BACK` button (Level Select and Settings) or the Pause overlay's `<<< RESUME` button, with the same press and release: the button shows pressed while it's held. It does nothing on the other screens.
* **Cancelling a press:** like dragging the mouse off a button before releasing it, a held press is cancelled without activating anything if the selection moves, a mouse click or touch happens, the button leaves the screen, or the controller is disconnected or another one takes over.
* **Selection:** nothing is selected until the controller is used. Connecting a controller counts as using it: browsers only expose a controller after one of its buttons has been pressed. The first push or press on a screen with nothing selected only selects its first button. In controller mode, every new screen arrives with its first button selected. A mouse click, a touch or disconnecting the last controller leaves controller mode and hides the selection.
* **Screen transitions:** controller input is ignored while a transition runs, like taps and clicks.
* **Intro:** the controller doesn't work there. Browsers don't count controller input as a user interaction for unlocking audio (only keyboard, mouse and touch count), so pressing `ENTER BOUNCERBACK` with the controller would leave the game silent. The Intro needs a click, tap or key press.

### Gameplay

* **Left and right stick:** each stick places a paddle the same way the mouse does. Pushed → an inactive paddle appears on the ring at the angle the stick points to; moved → it follows; released → it's set and its lifetime starts. It's set at the angle where the stick was last fully pushed, not where it lands while springing back.
* **The sticks share the paddles:** either stick places the next paddle, like a finger on a touch screen. With two paddles set, setting a third one removes the oldest (first in, first out), whichever stick, mouse or touch set it. Until then, the paddle that will be removed is shown in red (see "Paddles" in `game-rules.md`).
* **bottom face button, LT, RT, L3 or R3:** captures the charged atom crossing the core, like a tap at the core. One capture per press. A press with nothing to capture does nothing (unlike a tap, it never places a paddle).
* **When it's ignored:** during the 3-second start delay, the core collapse and the Game Over delay. A stick held through the start delay places its paddle as soon as play starts.
* **menu button:** pauses the game and opens the Pause overlay; on the overlay, it resumes (like `<<< RESUME`). Same as `P` on the keyboard. Pausing also freezes gameplay controller input, and a button pressed during the pause doesn't fire on resume. On the overlay, the controller navigates the menu as on any other menu screen (see "Menus").

---

## How controllers are read

* **Gamepad API, no library.** It has no input events: the state is read by polling `navigator.getGamepads()` once per frame. The `gamepadconnected` / `gamepaddisconnected` events are only used to start and stop polling in the menus.
* **Only the `standard` mapping.** Controllers the browser doesn't report with the `standard` mapping are ignored.
* **Secure context only.** Browsers hide controllers outside `https://` and `localhost`.
* **One controller at a time.** With several connected, the one used last drives the game (the last one with a button pressed or a stick pushed).
* **Presses, not holds.** A button already held when reading starts never counts as a press: on the first read, after a pause, or when another controller takes over. For example, the bottom face button still held from the level's menu button doesn't capture when play starts.
* **Triggers** are analog: they count as pressed from half travel (`TRIGGER_THRESHOLD = 0.5`).
* **Sticks and drift.** A stick counts as pushed from 75% deflection (`STICK_ENGAGE = 0.75`) and as released below 35% (`STICK_RELEASE = 0.35`). Worn sticks often rest at 10–30%: they never count as pushed, and a stick resting a bit off-center still counts as released. The gap between the two thresholds stops a stick near one of them from toggling. The angle only follows the stick while it's pushed past 75%, since the reading during the spring-back to the center is noise. Stick y points down, as on screen, so the stick's angle is the paddle's angle.
* **Each consumer reads on its own.** The menus and the game each own a `GamepadReader`, so their press detection never interferes. The menus poll in their own `requestAnimationFrame` loop (React domain, DOM only, no React state); the game polls in `app.ticker` (PixiJS domain).

### Code map

| File | Role |
| :--- | :--- |
| `src/input/gamepad.js` | `GamepadReader` (polling, presses, sticks), `BUTTONS`, thresholds, `watchGamepads` / `hasGamepad` |
| `src/input/menuNavigation.js` | Menu navigation: marks the selected button with the `gamepad-selected` class and activates it with `click()` |
| `src/App.jsx` | Starts the menu navigation on the screen-transition wrapper |
| `src/game/GameEngine.js` | `handleGamepad()`: stick paddles and capture during play |
| Screens | `data-gamepad="ignore"` (Intro button: never selected), `data-gamepad="back"` (the `<<< BACK` buttons) |

---

## Supported controllers and known limitations

* **Supported:** controllers the browser reports with the `standard` mapping. That covers Xbox controllers and, in Chrome and Safari, PlayStation controllers (DualShock 4, DualSense); PlayStation controllers haven't been tested yet. Firefox recognizes fewer controllers, especially on macOS.
* **Test device:** a Trust GXT pad with an Xbox layout, which macOS sees as an *Xbox Wireless Controller* (Bluetooth, vendor `045E`, product `02E0`).
* **Not supported yet:**
    * Controllers without the `standard` mapping (generic or DirectInput pads, many cheap and retro pads, arcade sticks, wheels): ignored.
    * Controllers without two analog sticks (SNES-style pads, a single Joy-Con): they can use the menus and capture, but can't place paddles (a single stick gets one paddle).
    * **Nintendo layout:** Nintendo prints A on the right and B on the bottom, so on a Nintendo controller the bottom face button (labelled B) confirms and the right face button (labelled A) goes back: the opposite of what Nintendo players expect. Gameplay isn't affected. To be addressed later.
    * The native iOS / Android apps (Capacitor) haven't been tested with controllers (see Phase 10).
