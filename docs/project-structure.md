## 1. Project Folder Structure

```text
root/
├── android/                        # Capacitor Android native project
├── ios/                            # Capacitor iOS native project
├── capacitor.config.json           # Capacitor configuration
├── package.json                  
└── assets/                         # Static assets
    ├── audio/                      # Sound effects & music files for Howler.js
    ├── vectors/                    # SVG Vector assets
    └── fonts/                      # Font files for the game (TTF and OTF formats).
└── docs/                           # Documentation for the implementation
    ├── images/                     # Reference images for layout and style
    ├── tech-stack.md               # Tech stack & architectural boundaries
    ├── navigation.md               # Navigation flow
    ├── graphical-specs.md          # Graphical specifications
    ├── project-structure.md        # Project structure
    ├── implementation-guidelines.md  # Implementation guidelines
    ├── level-file-schema.md        # Level file schema
    ├── react-pixi-example.jsx      # Example of a React Pixi component
    └── react-pixi-usage-example.jsx  # Example of a React Pixi usage example
└── src/
    ├── audio/
    │   └── soundManager.js         # Centralized Howler.js sound controller
    ├── components/                 # React UI components (HUD, Menus, Modals)
    │   ├── Button.jsx              # Reusable button component
    │   ├── HUD.jsx                 # Heads-Up Display for in-game information
    │   ├── MainMenu.jsx            # Main menu screen
    │   ├── Menu.jsx                # Generic menu container component
    │   ├── Screen.jsx              # Base screen wrapper component (handles transitions, safe areas, etc.)
    │   ├── SettingsMenu.jsx        # Settings menu screen
    │   ├── LevelSelectionMenu.jsx  # Level selection menu screen
    │   ├── Overlay.jsx             # Generic overlay component to be placed on top of current screen content
    │   └── TextBox.jsx             # Floating text box component. Used mostly for the tutorial level.
    │   └── TutorialSteps.jsx       # Tutorial steps component. A series of timed TextBox at specific times.
    ├── game/                       # Pure game logic & PixiJS implementation
    │   ├── GameEngine.js           # Main PixiJS application orchestrator
    │   └── entities/               # Game objects
    │   │   ├── Nucleus.js          # The central element that stays in place.
    │   │   ├── ContainmentRing.js  # The ring where the atoms are escaping from
    │   │   ├── Paddle.js           # The paddles to be spawned by the player
    │   │   └── Atom.js             # The balls moving around
    ├── levels/                     # Levels
    │   ├── level1.json             # Level 1 data
    │   ├── level2.json             # Level 2 data
    │   ├── level3.json             # Level 3 data
    │   ├── level4.json             # Level 4 data
    │   └── level5.json             # Level 5 data
    ├── screens/                    # React screen wrappers
    │   ├── GameScreen.jsx          # Houses the PixiCanvas component & HUD overlay
    │   ├── MainMenuScreen.jsx      # Main menu screen wrapper
    │   ├── SettingsMenuScreen.jsx  # Settings menu screen wrapper
    │   ├── LevelSelectionMenuScreen.jsx  # Level selection menu screen wrapper
    │   ├── GameOverOverlay.jsx     # Game over overlay screen wrapper
    │   └── PauseOverlay.jsx        # Pause overlay screen wrapper
    ├── App.jsx                     # React top-level router / screen switcher
    ├── main.jsx                    # React entry point
    └── index.css                   # Global styles & mobile safe-area setup
└── project-files/                  # non-code files for asset building (project files). Affinity, Ableton Live project files, 
