1. The Technology Stack

* UI, Menus, & Screens: React.js handles top-level navigation, menus, settings, and the HTML overlay layer.
* Game Rendering & Graphics: PixiJS runs the high-performance 60 FPS vector canvas, handling shapes, paths, and in-game visuals.
* Input Management: Plain JavaScript / PixiJS Event System handles touch and mouse interactions within the game canvas.
* Animations: PixiJS Ticker (app.ticker) drives continuous game-loop movements, physics ticks, and frame-by-frame updates.
* Audio: Howler.js manages cross-platform sound effects and background music playback.
* Mobile Packaging: Capacitor bundles the web app into a native mobile build (iOS and Android).

2. Architectural Division of Labor

* React Domain: Manages high-level app state, screen routers, HUD elements (scores, lives), and modal overlays. React sits on top of the game canvas.
* PixiJS Domain: Manages the game loop independently of React state re-renders. PixiJS owns the rendering canvas, asset management, and in-game entity logic to guarantee smooth 60 FPS performance.

3. Initial Implementation Guidelines & Best Practices

* Avoid the "Two Loops" Trap: Do not tie fast-moving game objects or high-frequency game logic to React state (useState). Let PixiJS run its internal ticker loop, and only pass low-frequency updates (like score milestones or game-over triggers) outward to React.
* Handle Mobile Safe Areas: Configure your root CSS (index.css) with proper mobile padding (env(safe-area-inset-top), etc.) and set touchAction: 'none' on the canvas container to prevent unwanted browser panning, zooming, or pull-to-refresh gestures.
* Initialize Audio Correctly: Because mobile browsers restrict audio playback until a user interacts with the screen, ensure Howler.js is bound or initialized after the player clicks "Start" on your React main menu.
* Proper Lifecycle Cleanups: Ensure your React wrapper component properly destroys the PixiJS application instance on unmount to avoid memory leaks or duplicate canvases in mobile WebViews.