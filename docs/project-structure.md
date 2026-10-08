## 1. Project Folder Structure

```text
root/
├── android/                        # Capacitor Android native project
├── ios/                            # Capacitor iOS native project
├── capacitor.config.json           # Capacitor configuration
├── package.json                  
└── assets/                         # Static assets
    ├── audio/                      # Sound effects & music files for Howler.js
    ├── images/                     # SVG vector assets and mobile app icon
    ├── motion/                     # Lottie animations (menu background)
    └── fonts/                      # Font files for the game (TTF and OTF formats).
└── docs/                           # Documentation for the implementation
    ├── mockups/                    # Reference images for layout and style
    ├── tech-stack.md               # Tech stack & architectural boundaries
    ├── game-instructions.md        # The How To Play screen's text (the screen renders it)
    ├── navigation.md               # Navigation flow
    ├── game-controller.md          # Game controller terms, controls and input reading
    ├── graphical-specs.md          # Graphical specifications
    ├── project-structure.md        # Project structure
    ├── implementation-guidelines.md  # Implementation guidelines
    ├── level-file-schema.json      # Level file schema
    ├── react-pixi-example.jsx      # Example of a React Pixi component
    ├── post-processing.md          # How the post-processing (zoom blur, CRT) works (learning resource) and how to tune it
    └── react-pixi-usage-example.jsx  # Example of a React Pixi usage example
└── src/
    ├── audio/
    │   └── soundManager.js         # Centralized Howler.js sound controller
    ├── components/                 # React UI components (HUD, Menus, Modals)
    │   ├── Button.jsx              # Reusable button component
    │   ├── HUD.jsx                 # Heads-Up Display for in-game information
    │   ├── HowToPlayDiagram.jsx    # Inline SVG example drawing of the arena for the How To Play screen
    │   ├── Logo.jsx                # The Main Menu logo's empty box in the layout: reports its position to the menu scene, which draws the logo
    │   ├── Menu.jsx                # Generic menu container component
    │   ├── MenuBackground.jsx      # Mounts the menu scene (src/menu/) behind the menu screens (mounted in App.jsx, persists across them)
    │   ├── SettingsControls.jsx    # MUSIC / SFX volume controls and the OLD TV button (Settings screen and Pause overlay)
    │   ├── Screen.jsx              # Base screen wrapper component (handles transitions, safe areas, etc.)
    │   ├── Overlay.jsx             # Generic overlay component to be placed on top of current screen content
    │   └── TextBox.jsx             # Floating text box component.
    ├── effects/                    # Reusable PixiJS post-processing; no game logic, no React (see docs/post-processing.md)
    │   ├── PostProcessing.js       # The pipeline: scene texture, builds the final pass from the effects' chunks, input mapping
    │   ├── postProcessing.frag.glsl  # The final pass's template, where the effects' GLSL chunks go
    │   ├── postProcessingSettings.js  # Values shared by the whole pipeline (resolution cap)
    │   ├── FullscreenPass.js       # One full-screen pass: a screen-covering rectangle + a fragment shader
    │   ├── fullscreen.vert.glsl    # Vertex shader shared by every pass
    │   ├── zoomBlur/               # Zoom blur effect: streaks pointing away from a center
    │   │   ├── ZoomBlurEffect.js   # The effect
    │   │   ├── zoomBlurSettings.js # Its tunable values
    │   │   ├── zoomBlur.frag.glsl  # Its own pass: the blurred copy (low resolution)
    │   │   └── zoomBlurMix.glsl    # Its chunk of the final pass: the blur mixed over the image
    │   └── crt/                    # CRT effect: curved glass, chromatic aberration, scanlines, mask, vignette
    │       ├── CrtEffect.js        # The effect
    │       ├── crtSettings.js      # Its tunable values
    │       ├── crt.glsl            # Its chunk of the final pass
    │       └── curvature.js        # The curved glass's formula in JavaScript, for pointer input (twin of crtWarp() in crt.glsl)
    ├── input/                      # Game controller (Gamepad API); no React, no PixiJS
    │   ├── gamepad.js              # Polled controller reader: button presses, sticks with drift thresholds
    │   └── menuNavigation.js       # Controller navigation of the menu screens (selection class + click())
    ├── menu/                       # The menu screens' PixiJS scene, behind their HTML layer; no React
    │   ├── MenuScene.js            # PixiJS application: the Lottie background animation (canvas renderer) as a texture, and the logo
    │   ├── MenuLogo.js             # The Main Menu logo: one shape per piece, blink, and the screen transitions (twin of index.css's)
    │   ├── logoPieces.js           # The logo's vector paths, one per piece
    │   └── menuSettings.js         # Its tunable values (resolution cap)
    ├── game/                       # Pure game logic & PixiJS implementation
    │   ├── GameEngine.js           # Main PixiJS application orchestrator
    │   ├── levelLoader.js          # Validates level JSON and derives runtime values (timer, speeds, intervals)
    │   ├── scoring.js              # Pure score formulas and high-score persistence
    │   ├── oldTv.js                # The Settings "OLD TV" switch (the CRT effect), persisted
    │   ├── color.js                # Color helpers (interpolation for the gameplay color transitions)
    │   ├── easing.js               # Easing curves for the gameplay animations (quadratic in / out / in-out)
    │   └── entities/               # Game objects
    │   │   ├── AtomEmitter.js      # The central element that stays in place and spawns atoms.
    │   │   ├── ContainmentRing.js  # The ring where the atoms are escaping from
    │   │   ├── Paddle.js           # The paddles to be spawned by the player
    │   │   ├── PaddleFlash.js      # Subtle echo arc drawn outside the ring when a paddle bounces an atom
    │   │   ├── AtomPulse.js        # Beat pulse around a charged atom while it crosses the core (capture window)
    │   │   └── Atom.js             # The balls moving around
    ├── levels/                     # Levels
    │   ├── level1.json             # Level 1 data
    │   ├── level2.json             # Level 2 data
    │   ├── level3.json             # Level 3 data
    │   ├── level4.json             # Level 4 data
    │   └── level5.json             # Level 5 data
    ├── screens/                    # React screens, built from the generic components above
    │   ├── IntroScreen.jsx         # First screen: ENTER BOUNCERBACK button (unlocks audio)
    │   ├── MainMenuScreen.jsx      # Main menu screen with the game logo (menu music and background animation start here)
    │   ├── SettingsMenuScreen.jsx  # Settings menu screen
    │   ├── HowToPlayScreen.jsx     # How To Play screen: instructions text, example drawing, Back
    │   ├── LevelSelectionMenuScreen.jsx  # Level selection menu screen
    │   ├── GameScreen.jsx          # Houses the PixiCanvas component & HUD overlay
    │   ├── GameOverScreen.jsx      # Game over screen (replaces the Game Screen)
    │   ├── YouWinScreen.jsx        # You win screen (replaces the Game Screen)
    │   ├── ResultScreen.jsx        # Shared layout of the Game Over and You Win screens
    │   └── PauseOverlay.jsx        # Pause overlay on top of the Game Screen (second development cycle)
    ├── App.jsx                     # React top-level router / screen switcher
    ├── main.jsx                    # React entry point
    └── index.css                   # Global styles & mobile safe-area setup
└── project-files/                  # non-code files for asset building (project files). Affinity, Ableton Live project files, 
