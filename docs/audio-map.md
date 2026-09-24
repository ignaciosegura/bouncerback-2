# Audio Map

This document maps every audio file to the game event or context that triggers it. The `soundManager.js` module must implement this mapping.

Music tracks are **not** listed here — they are mapped per-level inside each `src/levels/levelN.json` file via the `soundTrack` field.

---

## Sound Effects (`assets/audio/`)

| File | Event | Notes |
| :--- | :--- | :--- |
| `bounce.mp3` | An atom is deflected by a paddle | Plays every time a paddle successfully reverses an atom's direction. |
| `capture.mp3` | An atom is tapped and destroyed at the core | Plays when the player destroys a charged atom by tapping it while it crosses the core. |
| `destroy.mp3` | An atom escapes the containment ring | Plays when an atom exits the ring and the player loses a life. |
| `launch.mp3` | An atom is emitted from the core | Plays each time the atom emitter spawns a new atom. |
| `vortex_creation.mp3` | Level end — core swallows all remaining atoms | Plays once when the timer runs out and the core begins attracting all atoms. |
| `silence.mp3` | Reserved / fallback | A near-silent stub used to unlock the audio context on first user interaction (mobile browsers). Must be played on the first tap/click before any other sound. |

---

## Music Tracks (`assets/audio/tracks/`)

Tracks are assigned to screens or levels. Each level's track is declared in its level file (`soundTrack` field). Menu tracks are hardcoded in `soundManager.js`.

| File | Screen / Level |
| :--- | :--- |
| `main_title.mp3` | Main Menu, Settings, Level Selection |
| *(none)* | Game Over, You Win! — the music fades out and the screen is silent. A dedicated ambience track is planned for the second development cycle. |
| `learn.mp3` | Level 1 |
| `neutronika.mp3` | Level 2 |
| `femtocosmos.mp3` | Level 3 |
| `chronosaedron.mp3` | Level 4 |
| `mekanomancer.mp3` | Level 5 |

> [!NOTE]
> The track assignment for levels 2–5 above is a suggested default. Adjust the `soundTrack` field in each level file to change the mapping without touching code.

---

## Audio Lifecycle Rules

1. **Unlock on first interaction** — Play `silence.mp3` immediately when the player first interacts with any screen (e.g., tapping the main menu). This satisfies the mobile browser audio policy and ensures all subsequent sounds play without delay.
2. **Music crossfade** — When transitioning between screens, fade out the current track before fading in the new one. When the destination screen has no track (Game Over, You Win!), just fade out.
3. **Music continuity** — If the destination screen uses the same track as the origin (e.g., navigating Settings → Main Menu), do **not** restart or crossfade the track; let it continue playing seamlessly.
4. **SFX volume and music volume** — Controlled independently via the Settings screen buttons and persisted in `soundManager.js`.
