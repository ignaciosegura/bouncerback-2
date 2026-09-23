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
| `docs/implementation-guidelines.md` | Summary of architectural and implementation rules |
| `docs/level-file-schema.json` | JSON Schema for all level files |
| `docs/images/` | Reference mockups — filenames indicate which screen they represent |
| `docs/react-pixi-example.jsx` | Reference example of a React + PixiJS component integration |

---

## Non-Negotiable Architectural Rules

Violating these rules will break the game or cause hard-to-debug issues.

### 1. React and PixiJS have strictly separate domains

- **React** owns: routing, menus, HUD overlays, modal screens, settings. It sits on top of the canvas as an HTML layer.
- **PixiJS** owns: the game canvas, the game loop, all in-game entities, physics, rendering, and in-game input handling.
- These layers must never cross. React does not read or write frame-by-frame game state.

### 2. Never bind fast-moving game state to React `useState`

Do not put atom positions, paddle states, or any high-frequency game data into React state. PixiJS runs its own `app.ticker` loop completely decoupled from React. Only pass low-frequency updates outward to React (e.g., score milestones, game-over triggers, lives count changes).

### 3. Destroy PixiJS on unmount

Always call `app.destroy(true, { children: true, texture: true })` when the React component housing PixiJS unmounts. Omitting this causes memory leaks and duplicate canvases in mobile WebViews.

### 4. Canvas container must have `touchAction: 'none'`

Apply `touchAction: 'none'` via CSS or inline style on the PixiJS canvas container. This prevents mobile browser gestures (rubber-band scrolling, pinch-to-zoom, panning) from interfering with gameplay.

### 5. Howler.js must be unlocked on first user interaction

Mobile browsers block audio until an explicit user interaction. Ensure Howler.js is initialized or unlocked when the player first interacts (e.g., pressing "Start" on the main menu). The audio manager must be available across all screens, not only during gameplay.

---

## Visual & Style Rules

- Forced **landscape** orientation.
- **Black background** (`#000000`) during gameplay; white (`#DDDDDD`) background only for inverted menu layouts.
- All graphics: **2D vector only**, no textures, no images. White lines and filled circles on black.
- Font: **"C64 Angled"** monospaced — `assets/fonts/c64_angled.ttf`. Size always 24px, weight normal, always uppercase.
- All text/menus wrapped in a **thin-border transparent rectangle** with 1em padding.
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
