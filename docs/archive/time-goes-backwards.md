# Bouncerback — Time Goes Backwards Archive

Completed phases of the time goes backwards work, moved here from `docs/time-goes-backwards-implementation-plan.md` once done. History only: the other docs are the source of truth for how the game works now.

---

## Time Goes Backwards

### Phase T1 — Level property, lives and timer

- `docs/level-file-schema.json`: `timeGoesBackwards`.
- `src/game/levelLoader.js`: exposes `timeGoesBackwards` and `livesShown(level, lives)`, the lives the player sees (`lives` − lives left + 1, or the lives left in any other level).
- `src/game/GameEngine.js`: lives are unchanged. Only `backgroundTarget` uses `livesShown`.
- `src/screens/GameScreen.jsx`: `HUD` receives `livesShown` and, for this level, elapsed time. The engine's lives and `timeTenths` don't change meaning.
- `src/levels/level6.json`: `timeGoesBackwards: true`. Run `npm run validate:levels`.

Check: the level starts red with one life and TIME 0, with no first-frame flash of other values. TIME reaches the level's full time as the collapse starts. With `lives: 4`, the fourth escape shows 5 lives and triggers the last life zoom and Game Over. Normal levels are unaffected.
