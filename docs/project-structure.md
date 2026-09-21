bouncerback 2/
├── android/                   # Capacitor Android native project
├── ios/                       # Capacitor iOS native project
├── capacitor.config.json      # Capacitor configuration
├── package.json
├── public/                    # Static assets (images, raw audio files)
│   ├── assets/
│   │   ├── audio/             # Sound effects & music for Howler.js
│   │   └── vectors/           # Optional SVG assets if loading externally
└── src/
    ├── audio/
    │   └── soundManager.js    # Centralized Howler.js sound controller
    ├── components/            # React UI components (Menus, HUD overlays)
    │   ├── HUD.jsx
    │   ├── MainMenu.jsx
    │   └── GameOverModal.jsx
    ├── game/                  # Pure game logic & PixiJS implementation
    │   ├── GameEngine.js      # Main PixiJS application orchestrator
    │   ├── scenes/            # Individual game states (Level1, Arena, etc.)
    │   │   └── MainScene.js
    │   └── entities/          # Game objects (Player, Enemies, Projectiles)
    │       └── Player.js
    ├── screens/               # React screen wrappers
    │   ├── GameScreen.jsx     # Houses the PixiCanvas component
    │   └── MenuScreen.jsx
    ├── App.jsx                # React router / screen switcher
    ├── main.jsx               # React entry point
    └── index.css              # Global styles (handling mobile safe areas)