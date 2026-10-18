# Audio Map

This document maps every audio file to the game event or context that triggers it. The `soundManager.js` module must implement this mapping.

Music tracks are **not** listed here — they are mapped per-level inside each `src/levels/levelN.json` file via the `soundTrack` field.

---

## Sound Effects (`assets/audio/`)

| File | Event | Notes |
| :--- | :--- | :--- |
| `bounce.mp3` | An atom is deflected by a paddle | Plays every time a paddle successfully reverses an atom's direction. |
| `capture.mp3` | An atom is captured (tap released) and destroyed at the core | Plays when the player destroys a charged atom by tapping it while it crosses the core. Only in levels with the `atom capture` additional mechanic; elsewhere it never plays. With `charged atom catch` it plays when a caught atom is released, not when it's caught (the catch has its own looped sound). It does not play for the supercharged atom, which uses `capture_supercharged`. |
| `destroy.mp3` | An atom escapes the containment ring | Plays when an atom exits the ring and the player loses a life. |
| `launch.mp3` | An atom is emitted from the core | Plays each time the atom emitter spawns a new atom. It does not play for the supercharged atom, which has its own sound (`launch_supercharged`). |
| `launch_supercharged.mp3` | The supercharged atom is generated | Plays once, halfway through the level, instead of `launch` (only in levels with the `supercharged atom` additional mechanic). |
| `capture_supercharged.mp3` | The supercharged atom is captured | Plays instead of `capture` when the captured atom is the supercharged one. Same timing as `capture`, including a capture on release of a catch. |
| `catch.*` | A standard atom is caught | A **loop**: starts when the press catches the atom and keeps playing while it is held. Fades out over a fixed 15 ms (`STEAL_FADE_MS` in `soundManager.js`) when the hold ends. Only in levels with the `charged atom catch` additional mechanic. |
| `catch_supercharged.*` | The supercharged atom is caught | Same as `catch`, for the supercharged atom. |
| `vortex_creation.mp3` | Level end — core collapse takes all remaining atoms | Plays once when the timer runs out and the core begins attracting all atoms. |
| `silence.mp3` | Reserved / fallback | A near-silent stub used to unlock the audio context on first user interaction (mobile browsers). Must be played on the first tap/click before any other sound. |

**Formats.** Sound effects can be MP3, WAV or FLAC, found by file name without extension (hence names must be unique across formats). The two catch loops are provided as WAV or FLAC (lossless, so they loop without a gap, which MP3's encoder padding can't guarantee), trimmed so that the whole file loops from its first to its last sample; loop points stored inside the file are ignored.

**Catch loops.** Each hold ends in one of these ways, and each stops its loop with the 15 ms fadeout: release (followed by the capture sound), pause, core collapse, or the last life lost. Pausing the game pauses the loop like any other effect, until the hold is cancelled.

---

## Music Tracks (`assets/audio/tracks/`)

Tracks are assigned to screens or levels. Each level's track is declared in its level file (`soundTrack` field). Menu tracks are hardcoded in `soundManager.js`.

| File | Screen / Level |
| :--- | :--- |
| `main_title.mp3` | Main Menu, Settings, Level Selection (the Intro screen is silent) |
| *(none)* | Game Over, You Win! — the music fades out and the screen is silent. A dedicated ambience track is planned for the second development cycle. |
| `learn.mp3` | Level 1 |
| `femtocosmos.mp3` | Level 2 |
| `chronosaedron.mp3` | Level 3 |
| `mekanomancer.mp3` | Level 4 |
| `neutronika.mp3` | Level 5 |

> [!NOTE]
> The track assignment for levels 2–5 above is a suggested default. Adjust the `soundTrack` field in each level file to change the mapping without touching code.

---

## Audio Lifecycle Rules

1. **Unlock on first interaction** — Play `silence.mp3` immediately when the player presses ENTER BOUNCERBACK on the Intro screen. This satisfies the mobile browser audio policy and ensures all subsequent sounds play without delay.
2. **Music crossfade** — When transitioning between screens, fade out the current track before fading in the new one. When the destination screen has no track (Game Over, You Win!), just fade out. Exception: the menu track's first start, when ENTER BOUNCERBACK takes the player to the Main Menu, has no fade-in (it starts together with the menu background animation).
3. **Level start** — Entering the Game Screen fades the music out. The level's track starts when the level's 3-second start delay ends, at the same moment as the timer (see `game-rules.md`); it is preloaded during the delay so it starts on time.
4. **Music continuity** — If the destination screen uses the same track as the origin (e.g., navigating Settings → Main Menu), do **not** restart or crossfade the track; let it continue playing seamlessly.
5. **SFX volume and music volume** — Controlled independently via the Settings screen buttons and persisted in `soundManager.js`. Both are capped at -6 dB (setting 9), so music and SFX at full volume sum to at most 0 dB instead of clipping.
