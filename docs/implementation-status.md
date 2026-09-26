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
- [ ] **Phase 12** — Visual effects (`palette_invert`, `glow_pulse`, one-life-left dark red background, level `vfx` timelines)
- [ ] **Phase 13** — Level unlocking
- [ ] **Phase 14** — Results ambience track
- [ ] **Phase 15** — Capturable atom cue (charge ≥ 3 yellow → red)
