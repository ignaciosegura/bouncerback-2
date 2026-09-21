## 1. Project Folder Structure

```text
root/
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
└── project-files/             # non-code files for asset building (project files). Affinity, Ableton Live project files, etc.