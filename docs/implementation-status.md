# Bouncerback — Implementation Status

Tracks progress against the phases defined in `docs/implementation-plan.md`. Update this file whenever a phase is completed.

Legend: `[x]` done · `[ ]` pending

---

## First Development Cycle (MVP) — ✅ Complete

- [x] **Phase 0** — Project scaffolding
- [x] **Phase 1** — App shell & navigation
- [x] **Phase 2** — Audio manager
- [x] **Phase 3** — Level data & loader
- [x] **Phase 4** — PixiJS GameEngine & entities
- [x] **Phase 5** — Screens & HUD wiring
- [x] **Phase 6** — Scoring & rules
- [x] **Phase 7** — QA pass (web)

## Second Development Cycle (Quality of Life) — ⏳ Pending

- [x] **Phase 8** — Pause functionality (`PauseOverlay` over the frozen game: MUSIC / SFX / OLD TV, EXIT TO MENU, RESUME, on a panel in the gameplay background's color; `P` or the controller's menu button toggles it, only while playing; auto-pause when the tab is hidden or the window loses focus; music and SFX pause with the game. The on-screen Pause button for touch-only devices is left for a later phase)
- [x] **Phase 9** — Screen transitions (old-TV effect on every screen change, pure CSS, on the screen's elements only — backgrounds, the menu animation and the game canvas stay still: 1 s screen-out — fade out, color blends to transition dark yellow `#666600` then transition dark red `#660000`, vertical shake at the end — then 0.5 s fade-in)
- [x] **Phase 10** — Mobile packaging (Capacitor `ios/` and `android/` added; landscape-only in `Info.plist` and the Android manifest plus a runtime lock; icons and a logo-on-black splash generated from `assets/native/`; Android fullscreen with the system bars hidden; the game pauses when the app goes to the background; `npm run cap:*` scripts. Checked on the Android emulator, and on the iOS simulator up to the splash and Intro; the iOS credit links and background pause still need a manual check)
- [ ] **Phase 11** — Rotate-device overlay
- [ ] **Phase 12** — Optional visual effects (`palette_invert`, `glow_pulse`, level `vfx` timelines)
- [ ] **Phase 13** — Level unlocking
- [ ] **Phase 14** — Results ambience track
- [x] **Phase 15** — Capturable atom cue (charge ≥ 3 yellow → red)
- [x] **Phase 16** — One-life-left background (fade to dark red `#660000`; `#550000` from Phase 34)
- [x] **Phase 17** — Late-paddle grace window (atoms escape only once their center crosses the ring)
- Paddle visual feedback:
  - [x] **Phase 18** — Paddle lifetime fade (set paddles fade 100% → 20% opacity over the second half of their lifetime)
  - [x] **Phase 19** — Paddle bounce flash (subtle arc echo drifting outward from the paddle, outside the ring; restarts on each bounce)
- [x] **Phase 20** — Capture window feedback (core 25% larger; charged atoms crossing the core pulse once per beat in their color, 50% → 0% opacity)
- [x] **Phase 21** — Core collapse animation (2 s: core grows to ring size with grey fill while atoms ease to a stop, then everything collapses into the center)
- [x] **Phase 22** — Capture animation (a captured atom moves to the center of the core while shrinking to 0 over 0.5 s, ease-in)
- [x] **Phase 23** — Menu background animation (Lottie `intro_animation.json` plays uninterrupted behind Intro, Main Menu, Level Select and Settings; loops frames 0–7785)
- [x] **Phase 24** — Enter screen & menu music start (`ENTER BOUNCERBACK` screen before the Intro unlocks audio; the menu track starts on the Intro with no fade-in, and the menu animation starts with it)
- [x] **Phase 25** — Level start animation (the ring grows from radius 0 in 0.25 s, then the core grows from radius 0 in 0.5 s, both ease-out, inside the 3 s start delay)
- [x] **Phase 26** — Intro & Main Menu merge (the `ENTER BOUNCERBACK` screen becomes the Intro; the old logo-only Intro is removed; the logo moves to the top of the Main Menu, where the menu track and animation now start)
- [x] **Phase 27** — Logo blink (about once every 2 seconds, at random moments, a random logo piece turns white and fades back to black in 0.15 s)
- [x] **Phase 28** — Intro headphones note ("GRAB YOUR BEST HEADPHONES FIRST ;)" above the `ENTER BOUNCERBACK` button, 32px, no border; the button stays centered)
- [x] **Phase 29** — Main Menu credits & mixed-case text ("A game by NIK NAK STUDIO" / "Music and sfx by MAN FROM SPACE" at the bottom of the Main Menu, 24px, mixed case, the names link to niknak.es / manfromspace.com in a new tab with no link styling or feedback; the Intro note becomes "Grab your best headphones first ;)")

## Third Development Cycle — ⏳ Pending

- Game controller support (see `docs/game-controller.md`):
  - [x] **Phase 30** — Gamepad API fundamentals (`src/input/gamepad.js`: polled reader, one active controller, press detection, stick engage/release thresholds against drift)
  - [x] **Phase 31** — Menu navigation (d-pad / left stick move, bottom face button or RT activate, right face button back; selected item gets a double border via `outline`; not on the Intro, which must unlock audio)
  - [x] **Phase 32** — Gameplay (each stick drags and sets its own paddle; bottom face button, LT, RT, L3 or R3 captures; no pause action yet)
  - [x] **Phase 33** — Shared paddles for both sticks (either stick places the next paddle; the two-paddle FIFO decides which one goes, replacing one paddle per stick)
- [x] **Phase 34** — Paddle replacement warning (while a new paddle is being dragged, the set paddle its release will push out turns red `#FF0000` at once; mouse, touch and sticks; the one-life-left background darkens to `#550000` so the red stands out)
- [x] **Phase 35** — Controller press feedback (a menu button activated with the controller shows the mouse's pressed look while held and activates on release; a press can be cancelled)
- [x] **Phase 36** — Last life zoom (on the loss of the last life, the other atoms freeze; the last atom keeps escaping without fading for 0.5 s, then freezes; the camera then zooms 8× in 0.5 s, ease-out, on the point midway between the atom and where it crossed the ring, panning it to the center; Game Over 2 s after the loss)
- CRT effect on the game arena (reusable post-processing in `src/effects/`, one folder and settings file per effect, documented in `docs/post-processing.md`; the HUD stays flat in React):
  - [x] **Phase 37** — Post-processing pipeline & zoom blur (arena rendered to a texture; low-res zoom blur from the core mixed at 15%)
  - [x] **Phase 38** — CRT layers & input mapping (curved glass, chromatic aberration, scanlines, phosphor mask, vignette; touch and mouse follow the curved image)
  - [x] **Phase 39** — Old TV setting (Settings switch for the CRT layers, off by default and saved; the zoom blur stays on)
  - [x] **Phase 40** — Effects split (`zoomBlur/` and `crt/` each with their own settings, GLSL chunk and code; `PostProcessing` composes the chunks into one final pass, so no extra GPU time)
- [x] **Phase 41** — How To Play screen (`HOW TO` button on the Main Menu below SETTINGS; opens a screen with the instructions from `docs/game-instructions.md`, the example drawing and Back, over the menu background animation like the other menu screens)
- CRT on the menus (the OLD TV switch also covers the menu background animation and the Main Menu logo on Main Menu, Level Select, Settings and How To Play; buttons and texts stay flat in React):
  - [x] **Phase 42** — Menu background in PixiJS (Lottie's canvas renderer into a texture in a new `src/menu/MenuScene`; no visible change)
  - [x] **Phase 43** — Logo in the menu scene (the logo's pieces drawn by PixiJS with their blink and screen transitions; an invisible DOM box keeps its layout; no visible change)
  - [x] **Phase 44** — CRT on the menus (the menu scene through `CrtEffect` with its own brightness and vignette, following OLD TV, live on Settings; new configurable glass-edge color, black by default)
