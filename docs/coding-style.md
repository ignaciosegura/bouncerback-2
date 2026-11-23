# Coding Style

How the code is structured: when to write a class, a plain-function module, a helper function or an inline arrow function, and how to name and comment things. It describes how the code is already written. Formatting (no semicolons, two-space indentation, a space before function parentheses) is enforced by `eslint.config.js` and isn't repeated here.

The architectural rules in `AGENTS.md` (React and PixiJS in separate domains, no fast game state in React state) come first; this document only covers style within them.

---

## Modules

Every file is an ES module. Imports name the file extension (`'./color.js'`, `'./Button.jsx'`). Choose the shape of a module by what it holds:

| What the module holds | Shape | Examples |
| :--- | :--- | :--- |
| Pure calculations: formulas, curves, geometry | Named `export function`s, no state, no PixiJS, no React | `game/scoring.js`, `game/easing.js`, `game/color.js`, `game/geometry.js`, `game/timeBackwards.js`, `effects/crt/curvature.js` |
| One persisted setting or record (localStorage) | Named `get…` / `set…` functions around a `STORAGE_KEY` constant | `game/highScore.js`, `game/oldTv.js`, `game/levelProgress.js` |
| One app-wide service that is never instantiated twice | Module-level state (`let`) behind named exported functions: the module is the singleton | `audio/soundManager.js` |
| Something with its own state and lifecycle, of which there can be several, or which owns PixiJS objects | A class (see "Classes") | `GameEngine`, the entities, the effects, `MenuScene` |
| Tunable values | A `*Settings.js` file exporting one frozen object (see "Constants") | `game/timeBackwardsSettings.js`, `effects/crt/crtSettings.js` |
| A DOM behavior started once, with no React state | One exported `start…` function that returns its own cleanup function; its state lives in the closure | `input/menuNavigation.js` |

Platform layers (`native.js`, `desktop.js`) export an `is…` flag plus functions that do nothing where the platform is absent, so callers never branch on the platform themselves.

**Keep the logic you could check by hand apart from the code that draws it.** If a rule can be written as a plain function of numbers (a score, a charge limit, a curve), it goes in a pure-function module, and the class that uses it only calls it. `timeBackwards.js` states this at the top: "Plain functions, no PixiJS."

---

## Classes

Use a class when something has state that lives across frames or calls and a lifecycle (create → update → destroy), especially when it owns PixiJS objects.

- **One class per file, default export**, file named after the class in PascalCase (`entities/Atom.js`). Constants other modules need are exported by name next to it (`export const ATOM_RADIUS`, `import Atom, { ATOM_RADIUS } from …`).
- **Entities** hold their PixiJS display object in `this.view`, and keep to the same verbs: `draw(…)` redraws the shape, `update(dt)` / `render(dt)` advance it by one frame, `hide()` takes it off screen, and a state change starts with `start…()` (`startCapture()`, `startHold()`) and is advanced by the matching `update…()`. Returning `false` from an `update…()` means "finished".
- **The constructor only sets up state.** Anything async or anything that touches the DOM goes in a `mount(container)` method, and teardown in `destroy()`.
- **Methods by default.** Use an arrow-function class field (`onKeyDown = (event) => { … }`) only for a method that is passed as a callback to an event API or the ticker (`addEventListener`, `stage.on`, `app.ticker.add`, `renderer.on('resize')`), so `this` stays bound and the same reference can be removed later. Name these `on…` (or `update` / `layout` when the ticker or a resize calls them).
- **Getters** for values derived from the state (`get speedFactor ()`, `get movingOutward ()`), never for anything with side effects.
- **Object pools** for entities created and destroyed during play: `create…()` builds a new one, `release…()` hides it and puts it back in the pool, and spawning takes from the pool first (`this.atomPool.pop() ?? this.createAtom()`).
- **Long classes are split into sections** with a one-line comment heading the group of methods (`// Input`, `// Game loop`, `// Entity pools` in `GameEngine`).
- A class that wraps an API with no natural "one per file" home can be a named export next to its helpers (`GamepadReader` in `input/gamepad.js`).

Don't create a class just to group functions that share no state: use a module of functions.

---

## Functions

### Declarations, arrows and inline callbacks

- **Top-level functions are declarations:** `export function name ()` for the module's API, plain `function name ()` for private helpers. Private helpers stay unexported and are defined above the code that uses them when that reads naturally.
- **Inside a function or a component, use `const name = (…) => { … }`** for functions that close over local state: event handlers, the `select` / `cancelPress` helpers inside `startMenuNavigation`, a component's `navigate` or `exitToMenu`.
- **Write a callback inline** when it is short and used once: `array.map((level) => level.number)`, `onClick={() => navigate(SCREENS.SETTINGS)}`. When an inline callback grows beyond a line or two, or needs a comment, give it a name.
- **A function that returns a function** is fine when it removes repetition at the call sites: `endLevel(SCREENS.GAME_OVER)` in `App.jsx`, `openLink(url)` in `CreditsScreen.jsx`.
- **Functions that start something return their cleanup** (`watchGamepads`, `onTrackStart`, `onBackButton`, `startMenuNavigation`), so a React effect can `return` it directly.

### When to extract a helper

Extract a helper function when at least one of these holds:

- **It names a rule or formula** that is worth reading on its own, even if it's used once: `chargeColor(charge)`, `ringCollapseRadius(…)`, `rowsByTier(levels)`. The name and its comment say what the rule is; the caller reads as a sentence.
- **It's used in two or more places**, in the same file or across files. Shared math goes in its own module (`lerpColor` in `color.js`, used by the entities and the engine).
- **It isolates something that can fail or vary by platform**, so the caller doesn't deal with it: the `try { localStorage… } catch {}` wrappers, `standardGamepads()`.
- **A twin must be kept in sync:** when the same logic exists in two languages (GLSL and JavaScript) or two layers (CSS keyframes and PixiJS tweens), each side is one named function or constant, and each names the other in a comment ("Its twin is crtWarp() in crt.glsl: change both together").

Leave it inline when it is a single expression used once and the variable it's assigned to already names it (`const overshoot = Math.abs(this.distance) - contact`).

### Parameters

- **Optional settings go in a trailing options object with defaults:** `playTrack(name, { fadeIn = true } = {})`, `navigate(next, { cut = false } = {})`. Don't add positional boolean flags to a function with more than one optional setting.
- **Plain defaults for simple optional parameters:** `spawn (angle, supercharged = false, charge = 1)`.
- **Inject randomness** (`random = Math.random`) into pure functions that use it, so they can be tested with fixed values.

### Control flow

- **Return early** for guards (`if (!this.mounted) return`), and keep the main path unindented.
- **`for … of`** for loops over collections; `map` / `filter` / `some` / `every` when building or testing values. Avoid `forEach`.
- **`?.` and `??`** for optional objects and defaults (`this.post?.destroy()`, `navigator.getGamepads?.() ?? []`).
- **`switch`** for dispatching on a state or screen constant.
- **Errors:** throw only for programming mistakes (`PostProcessing: resource "x" is used twice`). Expected failures (storage blocked, unknown sound name) fall back to a default, with a comment in the empty `catch` or a `console.warn` prefixed with the module name.

---

## Constants

- **Module-level `UPPER_SNAKE_CASE`** for fixed values, at the top of the file, with a comment that gives the unit and what it does (`const CAPTURE_TAP_RADIUS = 60` "taps this close to the core target the atom crossing it"). No unexplained numbers in the code.
- **Derive constants from other constants** rather than repeating a computed number: `CONTACT_DISTANCE = RING_RADIUS - PADDLE_THICKNESS / 2 - ATOM_RADIUS`.
- **Tunable values** (adjusted by eye or by playtesting) go in a `*Settings.js` file: one exported `Object.freeze({ … })` object named `<AREA>_SETTINGS`, each value commented with its unit, its effect and, where useful, a sensible range or an example. These files are the only source of truth (see "Docs don't restate tunable values" in `AGENTS.md`).
- **States and enumerations** are objects of string values (`STATE.PLAYING = 'playing'`, `ATOM_STATE`, `SCREENS`), so values read well when logged. A comment after a value explains it when the name isn't enough.

---

## React components

- **One component per file, `export default function Name (props)`**, with the props destructured in the signature. A small sub-component used only in that file stays in it as a plain `function` above the main one (`VolumeControl` in `SettingsControls.jsx`, `Stat` in `HUD.jsx`).
- **Event handlers are `const` arrows in the component body**, named after what they do (`exitToMenu`, `changeMusicVolume`) or `handle…` when they react to an event (`handleTransitionEnd`).
- **Callback props are named `on…`** (`onBack`, `onSelectLevel`); a component never calls a parent's state setter directly.
- **Effects that need the latest props without re-running use `useEffectEvent`** (`handleScoreChange` in `GameScreen.jsx`). Imperative objects (the `GameEngine`, the `MenuScene`) live in a `useRef`, are created in an effect and destroyed in its cleanup.
- **Branches that render whole screens** are a `switch` in a `render…()` function (`renderScreen` in `App.jsx`); small conditionals are `&&` or a ternary in the JSX.
- **CSS classes follow BEM:** `block`, `block__element`, `block--modifier` (`level-select__button`, `button__label--blinking`).

---

## Naming

- **Files:** PascalCase for classes and components (`GameEngine.js`, `Button.jsx`), camelCase for everything else (`soundManager.js`, `levelLoader.js`), `*Settings.js` for tunables.
- **Functions** are verbs (`playTrack`, `registerLevelWin`, `startCapture`); pure calculations may be named after the value they return (`bouncePoints`, `maxChargeFor`, `shakeOffset`).
- **Booleans** read as statements: `paused`, `mounted`, `supercharged`, `isNative`, `hasGamepad()`.
- **Units** go in the name when they aren't seconds or mockup pixels at the 1080px reference: `timerTenths`, `FADE_MS`, `TEARDOWN_DELAY` (with a `// ms` comment).
- **Words a player reads** follow the "Terminology" rules in `AGENTS.md` (core, not emitter); code names may keep their functional name.

---

## Comments

- **Comment the why and the effect on screen**, not what the next line does. Good comments say what the player sees or what would break otherwise ("Losing the WebGL context while the canvas is still on screen flashes it white: wait until…").
- **Point to the docs** for rules defined there: `(docs/game-rules.md)`, `see "Charged atom hold" in docs/game-rules.md`. Don't restate the rule in full in the code.
- **Above a function or class, a `//` comment** of one or two lines says what it does, its parameters in backticks (`` `charge` ``) and what it returns. Use a `/** … */` block for exported APIs whose description needs a paragraph, a usage example or a list of callbacks (`PostProcessing`, `GameEngine`).
- **Trailing comments** after a constant or a field explain it in a few words (`this.lastAtom = null // the atom that took the last life`).
- **Empty `catch` blocks always have a comment** saying what the fallback is.
- Comments are in plain English, mixed case, full sentences or fragments without a final period on one-liners.

---

## Inconsistencies to settle

The code mostly follows the patterns above. These are the places where it doesn't follow one pattern; each needs a decision on which way becomes the rule:

1. **Exported arrow functions.** `exitApp` (`native.js`) and `quitDesktop` (`desktop.js`) are `export const name = () => …`; every other exported function is a declaration. Suggested rule: declarations everywhere at top level.
2. **Top-level arrow helpers.** `baseName` (`soundManager.js`) and `openLink` (`CreditsScreen.jsx`) are top-level `const` arrows, as are most helpers in `scripts/`; elsewhere private helpers are declarations. Decide whether one-line top-level arrows are allowed, or whether `scripts/` may follow its own style.
3. **Named vs default export of classes.** `KonamiCode` is the only class alone in its file with a named export; the other single-class files use a default export. (`GamepadReader` shares `gamepad.js` with other exports, so its named export fits.)
4. **Frozen constants.** The `*Settings.js` objects and some data (`logoPieces.js`, `levelLoader.js`) are `Object.freeze`d; enumerations and lookup objects (`STATE`, `ATOM_STATE`, `SCREENS`, `BUTTONS`, `STORAGE_KEYS`, `DEFAULT_PROGRESS`) are not. Decide whether every module-level constant object is frozen, or only the settings.
5. **Clamping.** `Math.min(max, Math.max(min, value))` is written out in about a dozen places, and `VolumeControl` has a local `clamp` that repeats `soundManager`'s `clampVolume`. A shared `clamp` (e.g. in a small math module next to `color.js` and `easing.js`) would follow the "used in two or more places" rule.
6. **The localStorage wrappers.** `highScore.js`, `oldTv.js`, `levelProgress.js` and `soundManager.js` each repeat the same `try` / `catch` read and write. A shared `readStored` / `writeStored` helper would remove that, at the cost of one more module; keeping each module self-contained is also defensible.
7. **`forEach`.** Used in four places against about fifty `for … of` loops.
8. **JSDoc blocks.** `soundManager.js` uses `/** … */` for short one-line descriptions, where the rest of the code uses `//`.
