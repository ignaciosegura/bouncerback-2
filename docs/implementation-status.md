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

- [ ] **Phase 8** — Pause functionality
  - Groundwork only: the `P` key toggles pause in `GameEngine` (ticker stop/start + music pause/resume). The Pause button and `PauseOverlay` (Resume / Settings / Main Menu) are still missing.
- [x] **Phase 9** — Screen transitions (old-TV effect on every screen change, pure CSS, on the screen's elements only — backgrounds, the menu animation and the game canvas stay still: 1 s screen-out — fade out, color blends to dark yellow then dark red, vertical shake at the end — then 0.5 s fade-in)
- [ ] **Phase 10** — Mobile packaging (Capacitor iOS/Android, orientation lock, icons/splash)
- [ ] **Phase 11** — Rotate-device overlay
- [ ] **Phase 12** — Optional visual effects (`palette_invert`, `glow_pulse`, level `vfx` timelines)
- [ ] **Phase 13** — Level unlocking
- [ ] **Phase 14** — Results ambience track
- [x] **Phase 15** — Capturable atom cue (charge ≥ 3 yellow → red)
- [x] **Phase 16** — One-life-left background (fade to dark red `#660000`)
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
