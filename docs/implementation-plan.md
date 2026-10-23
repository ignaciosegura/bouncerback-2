# Bouncerback — Implementation Plan

## Context

Bouncerback is fully documented (`AGENTS.md`, `docs/*`) but has zero implementation: no `package.json`, no bundler, no `src` code — only docs, mockups, and raw assets. The goal is to scaffold and implement the React + PixiJS + Capacitor game described in the docs.

Every doc, all seven mockups and the level schema were reviewed against each other. The gaps and contradictions found were resolved with the user; the resulting decisions are listed below and have also been written into the relevant docs (`game-rules.md`, `level-file-schema.json`, `navigation.md`, `project-structure.md`, `AGENTS.md`). If this plan and another doc disagree, the other doc is the source of truth and this plan should be corrected.

---

## How this file works

This file holds only the phases still pending. Completed phases are in `docs/archive/` (`cycle-1.md`, `cycle-2.md`, `cycle-3.md`), and the design decisions are in `docs/design-decisions.md`. New phases are planned here, numbered after the last one in `docs/implementation-status.md`; once a phase is done, its section and its verification items move to its cycle's archive file.

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

---

## Pending Phases

### Phase 54 — Gamepad indicator on the Main Menu

**Why.** The menus and the game can be played with a controller, but nothing tells the player so. The Main Menu now shows whether a controller is detected (MAIN MENU and MAIN MENU - gamepad not detected mockups).

**The component: `src/components/GamepadIndicator.jsx`** (React, menus' HTML layer)

- It shows one line of text with a controller drawing below it. It has two states: `gamepadDetected` true shows "Gamepad detected" with `assets/images/gamepad_detected.svg`, and false shows "You can use a gamepad" with `assets/images/gamepad_not_detected.svg` (the outline with a `?`). The false text is a hint, not a warning: once the player presses any button on a controller (any menu interaction does), the indicator switches to the detected state.
- **Live state.** `useState(hasGamepad)` sets the starting state, and `useEffect(() => watchGamepads(setGamepadDetected), [])` keeps it current (both from `src/input/gamepad.js`; the unsubscribe it returns is the cleanup). It switches as soon as the browser reports a controller connecting or disconnecting. This is a low-frequency event, so React state is fine (rule 2). No polling.
  - Browsers only expose a controller after one of its buttons is pressed on the page. A controller that is plugged in but untouched shows "You can use a gamepad" until its first button press, then switches. Only `standard`-mapping controllers count (the same rule as menu navigation), so a controller the game can't use is never "detected".
- **Drawing.** The two SVGs become inline SVG in JSX (not `<img>`), drawn in `currentColor` like `HowToPlayDiagram.jsx`, so they follow the screen's foreground color and the screen transitions' tint. The source art's black `fill` and `stroke` become `currentColor`, and Affinity's metadata is dropped. Both share the outline and the L1/R1 bumpers, so these are written once and only the inner details change (sticks, d-pad and face buttons, or the `?`).
  - The `viewBox` is cropped from `0 0 1000 1000` to the drawing's own bounds (about `91 199 818 569`, to be checked against the paths). The element's box is then the drawing itself, and the 350px offset and the vertical alignment apply to the visible lines, as in the mockup.
- **Text.** It's 24px (`TextBox size="hud"`), with no border, in sentence case exactly as written above (`text-transform: none`). It's a non-interactive informative text, like the How To Play instructions and the credits. It's one line, horizontally centered over the drawing; it's wider than the drawing and overflows it equally on both sides. Its bottom is about 27px above the drawing's top (about 548 → 575 in the mockup; to be confirmed against the mockup when it's built).
- The drawing is `aria-hidden`; the text is what screen readers read.
- **Not on mobile devices.** The component renders nothing on phones and tablets: in the native apps (`isNative` from `src/native.js`) and in mobile browsers. Mobile browsers are detected by a touch-only primary input, `matchMedia('(hover: none) and (pointer: coarse)')`. This is read once, when the component mounts. A touch-screen laptop still shows the indicator, because its primary input is the mouse or trackpad.

**On the Main Menu: `MainMenuScreen.jsx`, `index.css`**

- Placed inside the menu's `<nav>`, after the buttons, as an absolutely positioned element. `.main-menu-screen .menu` gets `position: relative`. The `<nav>` is horizontally centered on the screen, so its 50% is the screen's center, and its bottom is the HOW TO button's bottom.
- **Horizontal:** the drawing's left edge is at `left: calc(50% + 350 * var(--u))`.
- **Vertical:** the drawing runs from the SETTINGS button's top to the HOW TO button's bottom: `bottom: 0` and `top:` one button height plus one gap (`calc(2 * var(--font-menu) + 2 * var(--border-width) + 64 * var(--u))`: a button is 1em of text plus 0.5em of padding top and bottom, plus its borders). The drawing's height fills that span, and its width follows from the `viewBox`'s aspect ratio. The text sits above the drawing, positioned absolutely so it doesn't push the drawing down.
- Positioned with `left` / `top` / `bottom`, not with a `transform`: the screen-out's shake animates `transform` on the screen's children. Being inside the `<nav>`, it fades, tints and shakes with the buttons in the screen transitions, like the other elements.
- It has no buttons, so controller menu navigation never selects it, and it catches no taps.
- The logo, the buttons and the credits don't move.

**Docs**

- `docs/graphical-specs.md`: a new "Main Menu gamepad indicator" section (texts, sizes, position, the two drawings, live switching, not shown on mobile devices, part of the screen transitions). Also, in "Text and menus", add it to the mixed-case texts and to the 24px texts.
- `AGENTS.md`, "Visual & Style Rules": add the indicator to the mixed-case exceptions and to the 24px sizes.
- `docs/game-controller.md`: one line under "How controllers are read" (the indicator uses `hasGamepad` / `watchGamepads`, and the first press exposes a controller), and the component in its code map.
- `docs/project-structure.md`: add `GamepadIndicator.jsx` under `src/components/`.

**Verification**

- [ ] With no controller connected, the Main Menu matches the MAIN MENU - gamepad not detected mockup (as updated to "You can use a gamepad"): text, `?` drawing, the drawing's left edge 350px right of the center, and its top and bottom level with the SETTINGS top and the HOW TO bottom at 1920x1080.
- [ ] Pressing a button on a connected controller while on the Main Menu switches it at once to "Gamepad detected" with the full drawing (MAIN MENU mockup). Unplugging it switches it back at once.
- [ ] A controller already exposed (a button pressed on the Intro) shows "Gamepad detected" as soon as the Main Menu appears.
- [ ] It fades, tints and shakes with the buttons in the screen transitions to and from the Main Menu.
- [ ] It scales with the viewport and stays in place at other desktop aspect ratios (4:3, and a narrow window at the 0.4px `--u` floor).
- [ ] It isn't shown in the Android or iOS app, or in a mobile browser (the browser's device emulation with touch). The rest of the Main Menu is unchanged there.
- [ ] Controller navigation of the Main Menu is unchanged (PLAY → SETTINGS → HOW TO only).

The next phase after this one is Phase 55.
