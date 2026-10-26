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

### Phase 55 — Blinking buttons: ENTER BOUNCERBACK and pending levels

**Why.** Players unlock tiers by beating every level of the current one, but Level Select doesn't show which levels of a tier are already beaten. The name of an unlocked level that still needs beating now blinks. Decided with the user, after rejecting lowercase names (it breaks the uppercase rule), a filled / empty dot next to the name (no room beside the longest names, such as CHRONOSAEDR0N) and an underline on beaten levels (cluttered once most levels are beaten). Blinking marks the pending levels, which are always few: few levels are unlocked early on, and few are left late in the game. It's also an early arcade cue (the blinking 1UP).

The Intro's `ENTER BOUNCERBACK` button blinks too. It's the player's first click, so it teaches the cue from the start: a blinking button is the one to press next. Level Select then uses the same cue without explaining it.

**The blink** (the same everywhere)

- Only the button's text blinks: visible for 1 s, invisible for 1 s, with no fade (a hard on/off). It starts visible.
- The button's border, its size, the game controller's double border and the pressed look stay as they are, so nothing moves.
- Every blinking text on a screen is in sync, also when one starts blinking while the screen is shown (on Level Select, after the Konami Code's reset, see `docs/info-for-testers.md`).
- It keeps blinking while the button is selected with the game controller, and while a controller button or the mouse is held on it (the pressed look: inverted colors, with the text blinking in the inverted color).
- **On activation it stops:** when the button is activated (click, tap, or the controller's release, see Phase 35), its text becomes steadily visible and stays so through the screen-out, so the choice is readable as it fades out. Nothing is saved. Other blinking buttons keep blinking during the screen-out.

**Where it's used**

- **Intro:** `ENTER BOUNCERBACK` blinks from the screen-in on. The note above it ("Grab your best headphones first ;)") stays steady. The controller can't select this button (unchanged), so only the mouse and touch apply.
- **Level Select**, where a level button has three states:
  - Locked: `------------`, steady (unchanged).
  - Unlocked and not beaten (pending): the name blinks.
  - Beaten: the name is steady.
  - A pending level activated and then lost blinks again the next time Level Select is shown.
- No other button blinks.

**Implementation** (React / CSS only: menus' HTML layer; no PixiJS, no per-frame state)

- `src/components/Button.jsx`: a new `blinking` prop. When it's true, the children go in a `<span className="button__label button__label--blinking">`; otherwise the button renders as today.
- `src/index.css`:
  - One shared clock per menu, so every blinking text stays in sync: a registered custom property `--blink` (`@property`, `<number>`, inherited, initial value 1), animated on `.menu__items` with `@keyframes blink` (1 for the first half, 0 for the second), 2 s, `step-end`, infinite.
  - `.button__label--blinking { opacity: var(--blink); }`. A button that starts blinking later reads the same clock, so it's in phase at once. Using `opacity`, not `visibility` or `display`, keeps the box and the layout fixed, and screen readers always read the text.
  - The clock is on `.menu__items`, not on `.screen` or its direct children: those get the screen transitions' `animation` (screen-out, shake, tint, screen-in), which would replace it. The texts still fade, tint and shake with their buttons as before. Both the Intro button and the level buttons are inside a `Menu`'s `.menu__items`; BACK is in `.menu__footer` and never blinks.
  - No new constants file: the 1 s / 1 s timing is in the CSS keyframes, like the screen transitions.
- `src/screens/IntroScreen.jsx`: `useState` for "activated", set in the button's `onClick` before `onEnter()`; the button gets `blinking={!activated}`.
- `src/screens/LevelSelectionMenuScreen.jsx`:
  - A level is pending when it's unlocked and its number isn't in `levelProgress.beatenLevels` (already passed in from `App.jsx`; `src/game/levelProgress.js` doesn't change).
  - `useState` for the activated level's number, set in the button's `onClick` before `onSelectLevel(level)`. The button gets `blinking={pending && level.number !== activatedLevel}`.
- Both are single, low-frequency changes (rule 2). A second activation can't happen: taps and controller presses are ignored during the screen-out.

**Docs** (as part of the implementation)

- `docs/graphical-specs.md`: a new "Blinking buttons" section (the blink, its timing, sync, the controller selection and pressed look, the steady text on activation, and where it's used), referenced from "Intro screen note" (the button blinks, the note doesn't) and from "Level Select" (the three states).
- `docs/game-rules.md`, "Level unlocking": one line saying Level Select shows the levels still to beat by blinking their name (see `graphical-specs.md`).
- `docs/design-decisions.md`, "Layout & UI": the decision and the rejected options (lowercase, dot, underline) with their reasons; why ENTER BOUNCERBACK blinks too; why How To Play doesn't mention it and why there's no reduced-motion fallback.
- `docs/info-for-testers.md`: the Konami Code reset makes every tier 0 level blink again.
- `docs/implementation-status.md`: Phase 55.
- `docs/game-instructions.md` is not changed (decided with the user): How To Play doesn't explain the blink, and players work it out from the Intro and from how Level Select changes as they progress. No reduced-motion fallback either: the game, the menu animation and the transitions don't follow that setting, and a 0.5 Hz text blink isn't the motion it protects from.

---

## Verification

- Blinking buttons (Phase 55): on launch, `ENTER BOUNCERBACK` blinks (1 s visible, 1 s invisible, hard on/off) inside its steady border, from the screen-in on; the headphones note doesn't blink. Holding the mouse on it shows the pressed look with the text still blinking; releasing makes the text steady at once, and it stays steady through the screen-out. On Level Select, on a fresh install, LEARN blinks and the locked rows show steady dashes. After beating LEARN, it's steady and the three tier 1 levels blink, all in sync; after beating one of them, only the other two blink. With every level beaten, nothing blinks. BACK, the Main Menu, Settings, How To Play, Game Over and You Win! buttons never blink. The buttons' borders and the layout never move, and the width is the same as before. With the controller, the selected level keeps blinking inside its double border; holding the bottom face button on it shows the inverted pressed look with the name still blinking. Activating a pending level (mouse click, tap, controller release) makes its name steady at once; it fades, tints and shakes steadily through the screen-out while the other pending names keep blinking. Back on Level Select after losing it (Game Over → Main Menu → PLAY), it blinks again; after winning it, it's steady. The Konami Code unlocking every level makes the newly unlocked unbeaten levels blink in sync with the others; entering it again turns them to dashes and LEARN blinks. Check in Safari, Firefox and Chrome, and in the iOS/Android apps.
