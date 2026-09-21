# Tech Stack & Architecture Specification: Casual Arcade Game

This document defines the core technology stack, architectural boundaries, project structure, and implementation guidelines for developing a cross-platform (Web and Mobile via Capacitor) casual arcade game. It is designed to guide AI agents and developers working on the codebase.

---

## 1. Core Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **UI & Screens** | **React.js** | Manages application routing, menus, settings, HUD overlays, and modal screens. |
| **Rendering & Graphics** | **PixiJS** | High-performance WebGL 2D rendering engine utilizing `PIXI.Graphics` for real-time vector graphics and shape drawing. |
| **Animations** | **PixiJS Ticker (`app.ticker`)** | Drives the 60 FPS game loop, physics steps, frame-by-frame updates, and continuous animations. |
| **Input Management** | **PixiJS Event System / Vanilla JS** | Handles touch and mouse interactions seamlessly across desktop browsers and mobile webviews (`touchAction: 'none'`). |
| **Audio** | **Howler.js** | Manages cross-platform sound effects and background music playback. |
| **Mobile Packaging** | **Capacitor** | Wraps the web application into native iOS and Android packages. |

---

## 2. Architectural Division of Labor

To maintain high performance (60 FPS) and clean code organization, a **strict separation of concerns** is enforced between React and PixiJS:

### React Domain (DOM Layer)
* **Responsibility:** Static UI layouts, state-driven menus, pause overlays, score HUDs, and screen transitions.
* **Rule:** React sits *on top* of the game canvas as an absolute or fixed HTML layer. It does not control frame-by-frame game object properties.

### PixiJS Domain (Canvas Layer)
* **Responsibility:** The isolated game loop, scene management, asset loading, vector rendering, physics calculations, and in-game touch/mouse event handling.
* **Rule:** PixiJS owns the canvas entirely. 

---

## 3. Critical Architectural Rules & Guidelines

1. **Avoid the "Two Loops" Trap:**
   * Never bind fast-moving game state (player coordinates, particle positions, active enemy loops) to React's `useState`. 
   * Let PixiJS run its internal `app.ticker` loop completely decoupled from React state. Only emit low-frequency updates (e.g., scoring milestones, game-over triggers, health point changes) outward to React when necessary.

2. **Mobile Touch & Viewport Handling:**
   * The container hosting the PixiJS canvas must have `touchAction: 'none'` applied via CSS or inline styles to prevent default mobile browser gestures like rubber-band scrolling, panning, or pinch-to-zoom.
   * Ensure mobile safe areas (`env(safe-area-inset-top)`, etc.) are respected in the root layout styling.

3. **Audio Context Initialization (Howler.js):**
   * Mobile browsers block audio playback until an explicit user interaction occurs. Ensure Howler sounds are initialized or unlocked upon clicking the "Start Game" or main menu button within React.

4. **Lifecycle Cleanup:**
   * Always properly destroy the PixiJS application instance on React component unmount (`app.destroy(true, { children: true, texture: true })`) to prevent memory leaks or duplicate canvases inside mobile WebViews.

---

## 4. Project Folder Structure

```text
bouncerback/
├── android/                   # Capacitor Android native project
├── ios/                       # Capacitor iOS native project
├── capacitor.config.json      # Capacitor configuration
├── package.json
├── public/                    # Static assets
│   └── assets/
│       ├── audio/             # Sound effects & music files for Howler.js
│       └── vectors/           # Optional external SVG/vector assets
└── src/
    ├── audio/
    │   └── soundManager.js    # Centralized Howler.js sound controller
    ├── components/            # React UI components (HUD, Menus, Modals)
    │   ├── HUD.jsx
    │   ├── MainMenu.jsx
    │   └── GameOverModal.jsx
    ├── game/                  # Pure game logic & PixiJS implementation
    │   ├── GameEngine.js      # Main PixiJS application orchestrator
    │   ├── scenes/            # Individual game states (MainScene, etc.)
    │   │   └── MainScene.js
    │   └── entities/          # Game objects (Player, Enemies, Projectiles)
    │       └── Player.js
    ├── screens/               # React screen wrappers
    │   ├── GameScreen.jsx     # Houses the PixiCanvas component & HUD overlay
    │   └── MenuScreen.jsx
    ├── App.jsx                # React top-level router / screen switcher
    ├── main.jsx               # React entry point
    └── index.css              # Global styles & mobile safe-area setup
└── project-files/             # Project files for asset building. Affinity, Ableton Live project files, etc.