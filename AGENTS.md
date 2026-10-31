# AGENTS.md — Bouncerback

Bouncerback is a retro-inspired 2D arcade game built with React + PixiJS, packaged for Web and Mobile via Capacitor. Read this file before making any changes.

---

## Documentation Map

Read the relevant docs before implementing anything. Do not guess at conventions.

**Read only what the task needs.** Don't read a doc whose area the task doesn't touch: no `docs/audio-map.md` for a task that has nothing to do with audio, no `docs/game-controller.md` for one that has nothing to do with controllers, and so on. In a large doc, read only the sections for the area being changed (`docs/graphical-specs.md` and `docs/game-rules.md` are split by topic; their headings say where to look). This file (AGENTS.md) is the only one to read for every task.

| File | What it answers | Read it when |
| :--- | :--- | :--- |
| `docs/tech-stack.md` | Technology choices, architectural boundaries, critical rules, development environment setup | Adding or changing a dependency or a build tool, setting up the development environment, or deciding which layer (React or PixiJS) new code belongs to |
| `docs/implementation-guidelines.md` | Summary of architectural and implementation rules | Writing new code that crosses the React / PixiJS boundary, or touching PixiJS setup, audio unlocking or the canvas container |
| `docs/project-structure.md` | Full folder and file layout | Looking for where something lives, or adding, moving or renaming a file or folder (update it afterwards) |
| `docs/navigation.md` | Screen flow and navigation hierarchy | Adding or changing a screen, a menu button or a path between screens (back buttons included) |
| `docs/graphical-specs.md` | Visual style, colors, fonts, layout rules | Changing anything visible: layout, colors, fonts, animations, visual feedback, transitions, the menu background or the logo. Read only the sections involved |
| `docs/mockups/` | Reference mockups — filenames indicate which screen they represent | Building or changing the layout of a screen: open only that screen's mockup |
| `docs/game-rules.md` | Game mechanics, scoring, win/loss conditions | Changing gameplay: atoms, paddles, the core, capture, scoring, lives, time, level unlocking or high score. Read only the sections involved |
| `docs/game-instructions.md` | The How To Play screen's text (the screen renders it) | Changing the How To Play screen, or a gameplay change the instructions describe (it is updated by hand: ask before editing it) |
| `docs/level-file-schema.json` | JSON Schema for all level files | Creating or editing a level file, or reading a new level field in the code |
| `docs/audio-map.md` | Which sound effect each game event triggers | Adding, changing or removing a sound or music track, or a game event that plays one |
| `docs/game-controller.md` | Game controller: button terms (by position), controls, how controllers are read, supported controllers | Touching controller input in the menus or in gameplay (`src/input/`, or the gamepad handling in `GameEngine`) |
| `docs/post-processing.md` | How the post-processing (`src/effects/`: zoom blur, CRT) works, step by step, and how to tune it | Touching `src/effects/`, the OLD TV setting, or anything that renders through the zoom blur or CRT |
| `docs/desktop-build.md` | The desktop (Electron) and Steam release plan, how to build and run the desktop test builds, and the Steam Deck test results | Building, running or changing the desktop build (`electron/`, `electron-builder.json`), or working on the Steam integration |
| `docs/mobile-build.md` | Where the iOS and Android test builds are, and how to build and launch them from the command line | Building, launching or testing the iOS or Android app, or changing Capacitor or native settings |
| `docs/info-for-testers.md` | Tricks and information for game testers (e.g. unlocking every level) | Testing something that needs a trick (such as unlocked levels), or changing one of those tricks (update it afterwards) |
| `docs/implementation-status.md` | Which implementation phases are completed and which are pending | Planning a new phase (for its number) or completing one (to mark it) |
| `docs/implementation-plan.md` | The phases still pending, and where new phases are planned | Planning a new phase, or implementing a pending one |
| `docs/design-decisions.md` | Design decisions taken while planning, with their reasons | Changing how an existing area works, to know why it is the way it is. Read only the section for that area |
| `docs/archive/` | Completed phases, one file per development cycle — history only | Only when working on, or asked about, a past phase (move a completed phase here) |
| `docs/react-pixi-example.jsx` | Reference example of a React + PixiJS component integration | Creating a new React component that hosts a PixiJS application |
| `docs/react-pixi-usage-example.jsx` | Reference example of using that component | Same as above |

---

## Workflow Rules

- **Planning and implementation are separate steps.** When asked to plan, stop once the plan is delivered. Never go on to implementation without first asking for and getting explicit approval.
- **Completed phases move to the archive.** New phases are planned in `docs/implementation-plan.md`. Once a phase is done, move its section and its verification items to its cycle's file in `docs/archive/`, and mark it in `docs/implementation-status.md`.

---

## Non-Negotiable Architectural Rules

Violating these rules will break the game or cause hard-to-debug issues.

### 1. React and PixiJS have strictly separate domains

- **Electron's main process** (`electron/`, desktop builds only) sits outside both: it opens the window and serves the files, and never reads or writes game state.
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
- Font: **"C64"** monospaced — `assets/fonts/c64.ttf`. Weight normal, line height 1, always uppercase (the exceptions are the non-interactive informative texts, which are mixed case: the Intro screen note, the Main Menu credits and gamepad indicator, the How To Play instructions and the Gameplay tips: see "Text and menus" in `docs/graphical-specs.md`).
- Font sizes (per `docs/graphical-specs.md`): **24px** for HUD text, the Main Menu credits and the Main Menu gamepad indicator, **32px** for menu buttons, **64px** for the "GAME OVER" and "YOU WIN!" titles — at the 1080px-tall reference; the whole UI scales with the viewport (see `docs/graphical-specs.md`).
- All text/menus wrapped in a **thin-border transparent rectangle** with 0.5em padding.
- All text boxes: **single line**, centered justification text, no breaks.

---

## Level Files

- Located in `src/levels/` (`level1.json` … `level5.json`).
- Must strictly conform to `docs/level-file-schema.json`.
- Level 1 is the easiest level — no special mechanics or tutorial logic.
- Do not add fields not defined in the schema (`additionalProperties: false` is enforced).
- **Validate after every change to a level file or to the schema:** run `npm run validate:levels` (all of `src/levels/*.json`) or `npm run validate:levels -- path/to/level.json`. It exits with a non-zero code and lists each error's path when a file is invalid. Run it yourself; do not rely on reading the JSON by eye.

---

## Off-Limits Directories

Do not modify or generate files inside these directories unless explicitly asked:

| Directory | Reason |
| :--- | :--- |
| `android/` | Capacitor-generated native project — managed by Capacitor CLI |
| `ios/` | Capacitor-generated native project — managed by Capacitor CLI |
| `project-files/` | Affinity Designer and Ableton Live source files — not code |
