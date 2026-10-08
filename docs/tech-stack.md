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
| **Game Controller** | **Gamepad API** (browser, no library) | Polled once per frame: by the `GameEngine` in `app.ticker` during gameplay, and by a small DOM module (`src/input/`) for menu navigation. Only controllers with the `standard` mapping. See `docs/game-controller.md`. |
| **Post-processing** | **Custom GLSL shaders** on PixiJS full-screen meshes (WebGL only) | The zoom blur and CRT effects on the game arena, and the CRT on the menu screens (`src/effects/`, see `docs/post-processing.md`). |
| **Menu Background Animation** | **lottie-web** (canvas player) | Draws the Lottie vector animation behind the menu screens into an off-screen canvas, shown by the menus' own PixiJS application as a texture (`src/menu/`). |
| **Audio** | Manages cross-platform sound effects and background music playback. |
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
   * Let PixiJS run its internal `app.ticker` loop completely decoupled from React state. Only emit low-frequency updates (e.g., scoring milestones, game-over triggers, lives counter changes) outward to React when necessary.

2. **Mobile Touch & Viewport Handling:**
   * The container hosting the PixiJS canvas must have `touchAction: 'none'` applied via CSS or inline styles to prevent default mobile browser gestures like rubber-band scrolling, panning, or pinch-to-zoom.
   * Ensure mobile safe areas (`env(safe-area-inset-top)`, etc.) are respected in the root layout styling.

3. **Audio Context Initialization (Howler.js):**
   * Mobile browsers block audio playback until an explicit user interaction occurs. Ensure Howler sounds are initialized or unlocked upon clicking the "Start Game" or main menu button within React. Howler audio manager must be available across all screens, as there will be music and sound effects on all screens, not only during gameplay.

4. **Lifecycle Cleanup:**
   * Always properly destroy the PixiJS application instance on React component unmount (`app.destroy(true, { children: true, texture: true })`) to prevent memory leaks or duplicate canvases inside mobile WebViews.

---

## 4. Development Environment Prerequisites

| Target | Requirement | Notes |
| :--- | :--- | :--- |
| **Web dev (Vite)** | Node.js + npm | No Docker, VMs, or background daemons needed. `npm run dev` is a plain foreground process. |
| **iOS packaging (Capacitor)** | Full **Xcode** app (from the App Store), not just Xcode Command Line Tools | `npx cap add ios` and running/building in the iOS Simulator require the full Xcode app. CLI tools alone are insufficient — `xcodebuild` fails if `xcode-select` still points at a Command Line Tools-only install. After installing Xcode, run `xcode-select -s /Applications/Xcode.app`. |
| **Android packaging (Capacitor)** | Android Studio + Android SDK | Separate toolchain from iOS; not needed for the iOS path. |

Web development (Vite dev server, Phases 0–7) does not require any of the mobile toolchains above. They are only needed starting at mobile packaging (second development cycle).

---
