# AGENTS.md — Bouncerback

Bouncerback is a retro-inspired 2D arcade game built with React + PixiJS, packaged for Web and Mobile via Capacitor. Read this file before making any changes.

---

## Documentation Map

Read the relevant docs before implementing anything. Do not guess at conventions.

| File | What it answers |
| :--- | :--- |
| `docs/tech-stack.md` | Technology choices, architectural boundaries, critical rules |
| `docs/project-structure.md` | Full folder and file layout |
| `docs/navigation.md` | Screen flow and navigation hierarchy |
| `docs/graphical-specs.md` | Visual style, colors, fonts, layout rules |
| `docs/game-rules.md` | Game mechanics, scoring, win/loss conditions |
| `docs/audio-map.md` | Which sound effect each game event triggers |
| `docs/game-controller.md` | Game controller: button terms (by position), controls, how controllers are read, supported controllers |
| `docs/implementation-guidelines.md` | Summary of architectural and implementation rules |
| `docs/implementation-plan.md` | Design decisions and the phase-by-phase implementation plan |
| `docs/implementation-status.md` | Which implementation phases are completed and which are pending |
| `docs/level-file-schema.json` | JSON Schema for all level files |
| `docs/mockups/` | Reference mockups — filenames indicate which screen they represent |
| `docs/post-processing.md` | How the post-processing (`src/effects/`: zoom blur, CRT) works, step by step, and how to tune it |
| `docs/react-pixi-example.jsx` | Reference example of a React + PixiJS component integration |

---

## Workflow Rules

- **Planning and implementation are separate steps.** When asked to plan, stop once the plan is delivered. Never go on to implementation without first asking for and getting explicit approval.

---

## Non-Negotiable Architectural Rules

Violating these rules will break the game or cause hard-to-debug issues.

### 1. React and PixiJS have strictly separate domains

- **React** owns: routing, menus, HUD overlays, modal screens, settings. It sits on top of the canvas as an HTML layer.
- **PixiJS** owns: the game canvas, the game loop, all in-game entities, physics, rendering, and in-game input handling. It also draws the menu screens' background animation and the Main Menu logo, behind the menus' HTML layer (`src/menu/`); React only tells it, on screen changes and resizes, which screen transition the logo plays and where the logo's box is.
- These layers must never cross. React does not read or write frame-by-frame game state.

### 2. Never bind fast-moving game state to React `useState`

Do not put atom positions, paddle states, or any high-frequency game data into React state. PixiJS runs its own `app.ticker` loop completely decoupled from React. Only pass low-frequency updates outward to React (e.g., score milestones, game-over triggers, lives count changes).

### 3. Destroy PixiJS on unmount

Always call `app.destroy(true, { children: true, texture: true })` when the React component housing PixiJS unmounts. Omitting this causes memory leaks and duplicate canvases in mobile WebViews.

### 4. Canvas container must have `touchAction: 'none'`

Apply `touchAction: 'none'` via CSS or inline style on the PixiJS canvas container. This prevents mobile browser gestures (rubber-band scrolling, pinch-to-zoom, panning) from interfering with gameplay.

### 5. Howler.js must be unlocked on first user interaction

Mobile browsers block audio until an explicit user interaction. Ensure Howler.js is initialized or unlocked when the player first interacts (the ENTER BOUNCERBACK button on the Intro screen). The audio manager must be available across all screens, not only during gameplay.

---

## Visual & Style Rules

- Forced **landscape** orientation.
- **Black background** (`#000000`) during gameplay, except dark red (`#550000`) when the player has only one life left (see "Visual feedback" in `docs/graphical-specs.md`); white (`#D8D8D8`) background only for inverted menu layouts.
- All graphics: **2D vector only**, no textures, no images. White lines and filled circles on black; the only color exceptions are the gameplay feedback colors in "Visual feedback" and the tint of the screen transitions ("Screen transitions": transition dark yellow `#666600` and transition dark red `#660000`, separate from the `#550000` background; see "Colors"), both in `docs/graphical-specs.md`. The menu screens' Lottie background animation (`assets/motion/`) is vector too and is allowed (see "Menu background animation" in `docs/graphical-specs.md`). The game arena is shown through a CRT post-process (zoom blur, curved glass, scanlines…) applied to the finished image, and with the OLD TV switch on so are the menu background animation and the Main Menu logo; the shapes themselves stay vector (see "CRT effect" in `docs/graphical-specs.md` and `docs/post-processing.md`).
- Font: **"C64 Angled"** monospaced — `assets/fonts/c64_angled.ttf`. Weight normal, line height 1, always uppercase (the exceptions are the Intro screen note and the Main Menu credits, which are mixed case: see "Text and menus" in `docs/graphical-specs.md`).
- Font sizes (per `docs/graphical-specs.md`): **24px** for HUD text and the Main Menu credits, **32px** for menu buttons, **64px** for the "GAME OVER" and "YOU WIN!" titles — at the 1080px-tall reference; the whole UI scales with the viewport (see `docs/graphical-specs.md`).
- All text/menus wrapped in a **thin-border transparent rectangle** with 0.5em padding.
- All text boxes: **single line**, centered justification text, no breaks.

---

## Level Files

- Located in `src/levels/` (`level1.json` … `level5.json`).
- Must strictly conform to `docs/level-file-schema.json`.
- Level 1 is the easiest level — no special mechanics or tutorial logic.
- Do not add fields not defined in the schema (`additionalProperties: false` is enforced).

---

## Off-Limits Directories

Do not modify or generate files inside these directories unless explicitly asked:

| Directory | Reason |
| :--- | :--- |
| `android/` | Capacitor-generated native project — managed by Capacitor CLI |
| `ios/` | Capacitor-generated native project — managed by Capacitor CLI |
| `project-files/` | Affinity Designer and Ableton Live source files — not code |
