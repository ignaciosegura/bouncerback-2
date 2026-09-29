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
    ├── navigation.md               # Navigation flow
    ├── graphical-specs.md          # Graphical specifications
    ├── project-structure.md        # Project structure
    ├── implementation-guidelines.md  # Implementation guidelines
    ├── level-file-schema.json      # Level file schema
    ├── react-pixi-example.jsx      # Example of a React Pixi component
    └── react-pixi-usage-example.jsx  # Example of a React Pixi usage example
└── src/
    ├── audio/
    │   └── soundManager.js         # Centralized Howler.js sound controller
    ├── components/                 # React UI components (HUD, Menus, Modals)
    │   ├── Button.jsx              # Reusable button component
    │   ├── HUD.jsx                 # Heads-Up Display for in-game information
    │   ├── Menu.jsx                # Generic menu container component
    │   ├── MenuBackground.jsx      # Lottie animation behind the menu screens (mounted in App.jsx, persists across them)
    │   ├── Screen.jsx              # Base screen wrapper component (handles transitions, safe areas, etc.)
    │   ├── Overlay.jsx             # Generic overlay component to be placed on top of current screen content
    │   └── TextBox.jsx             # Floating text box component.
    ├── game/                       # Pure game logic & PixiJS implementation
    │   ├── GameEngine.js           # Main PixiJS application orchestrator
    │   ├── levelLoader.js          # Validates level JSON and derives runtime values (timer, speeds, intervals)
    │   ├── scoring.js              # Pure score formulas and high-score persistence
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
