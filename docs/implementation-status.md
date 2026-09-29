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
- [ ] **Phase 9** — Screen transitions
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
