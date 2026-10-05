// Types shared across modules (docs/type-checking-plan.md). JSDoc only: nothing here runs.

/**
 * One visual-effects timeline entry. `time` is in bars in a level file, in seconds once loaded.
 * @typedef {Object} VfxEntry
 * @property {string} name
 * @property {number} time
 */

/**
 * A raw level file. Mirrors docs/level-file-schema.json: keep both in sync.
 * @typedef {Object} LevelFile
 * @property {string} name
 * @property {number} duration Length of the level, in bars
 * @property {{ bpm: number, signature: number }} timeSignature
 * @property {string} soundTrack Track file name ('learn.mp3')
 * @property {VfxEntry[]} [vfx]
 * @property {{ travelTime: number, barsInterval: number }} atoms travelTime in beats, barsInterval in bars
 * @property {{ angle: number, duration: number }} paddles angle in degrees, duration in seconds
 * @property {number} lives
 */

/**
 * A validated level with the runtime values the game engine uses (times in seconds).
 * @typedef {Object} LoadedLevel
 * @property {number} number The level's number (1–5), used by the score formulas
 * @property {string} name
 * @property {string} soundTrack
 * @property {number} lives
 * @property {number} secondsPerBeat
 * @property {number} timerTenths Initial timer value, in tenths of a second
 * @property {number} atomSpeed Core-to-ring trips per second
 * @property {number} spawnInterval Seconds
 * @property {number} paddleArc Radians
 * @property {number} paddleDuration Seconds
 * @property {VfxEntry[]} vfx
 */

/**
 * Sent with the end-of-level events.
 * @typedef {Object} GameResult
 * @property {number} score
 */

/**
 * The GameEngine's low-frequency events, the only data that reaches React.
 * @typedef {Object} GameCallbacks
 * @property {(score: number) => void} onScoreChange
 * @property {(lives: number) => void} onLivesChange
 * @property {(tenths: number) => void} onTimeChange
 * @property {(result: GameResult) => void} onGameOver
 * @property {(result: GameResult) => void} onLevelWin
 */

export {}
