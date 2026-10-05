# Bouncerback — Type Checking Plan (JSDoc + `checkJs`)

## Context

The game is written in plain JavaScript/JSX (see "Language" in `docs/implementation-plan.md`). This plan adds static type checking **without converting to TypeScript**: every file stays `.js`/`.jsx`, types are written as JSDoc comments, and the TypeScript compiler only *checks* the code (`tsc --noEmit`). Vite, the build output, the runtime and the game's behaviour are unchanged.

It is a tooling track, not part of the game's development cycles, so it is not in `docs/implementation-plan.md` and its progress is tracked at the end of this file instead of in `docs/implementation-status.md`.

**Goal:** catch mistakes at module boundaries before play-testing: the React ↔ PixiJS contract (`GameEngine` callbacks), the shape of loaded levels, sound effect names and state values. These currently fail silently at runtime: a callback that is never called, `NaN` on the HUD, a sound that doesn't play, a state branch that is never taken.

**Scope:** `src/` only, plus the two reference examples in `docs/` (`react-pixi-example.jsx`, `react-pixi-usage-example.jsx`). `vite.config.js`, `eslint.config.js` and `scripts/` are not checked.

---

## Decisions

### Tooling
- **Checker:** `typescript` as a dev dependency, used only through `tsc --noEmit`. Vite keeps transpiling without type checking, so `npm run dev` and `npm run build` don't change and type errors never block a build.
- **New dev dependencies:** `typescript` (≥ 5.5, for the JSDoc `@import` tag), `@types/react`, `@types/react-dom`, `@types/howler`. PixiJS, lottie-web and Capacitor ship their own types. Vite's `vite/client` types (already installed) cover `import.meta.glob`, `?url` and CSS imports.
- **Config:** a `jsconfig.json` at the root (the JS equivalent of `tsconfig.json`; VS Code picks it up automatically):

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "lib": ["ES2023", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "jsx": "react-jsx",
      "resolveJsonModule": true,
      "types": ["vite/client"],
      "checkJs": false,
      "maxNodeModuleJsDepth": 0,
      "strict": false,
      "skipLibCheck": true,
      "noEmit": true
    },
    "include": ["src"]
  }
  ```

- **Script:** `"typecheck": "tsc -p jsconfig.json"` in `package.json`. It sits next to `lint`; neither runs automatically.
- **ESLint is unchanged.** The files keep their extensions, so the existing config already covers them.

### Strictness
- **`strict: false`.** With `noImplicitAny` off, unannotated parameters are `any` and are not checked. That's the point of this approach: only the boundaries are annotated, and internal code isn't forced to carry JSDoc on every parameter.
- **`strictNullChecks` off.** Turning it on would flag every `ref.current`, `localStorage.getItem()` and `tracks[currentTrack]` lookup, for little gain in a codebase this size. It can be a later, separate step once everything else is in place.
- **Opt-in per file during the migration, project-wide at the end.** Each phase adds `// @ts-check` as the first line of the files it covers, so `npm run typecheck` stays green between phases. Phase T6 switches `checkJs` to `true` and removes the per-file comments, so files added later are checked automatically.

### Annotation conventions
- **No `.ts` or `.d.ts` files in `src/`.** All types are JSDoc.
- **What must be annotated:**
  - every exported function: parameters and return type;
  - every exported class: constructor parameters and the public methods other modules call;
  - every React component: its props, as a `@typedef` right above the component;
  - every object used as an enum (`STATE`, `ATOM_STATE`, `SCREENS`, `BACKGROUND_COLORS`, `ATOM_COLORS`).

  Internal helpers and local variables are annotated only when the checker needs it (see "Expected fix-ups").
- **Shared types live in `src/game/types.js`**, a module containing only `@typedef` blocks and `export {}`. Types used by a single module are declared in that module.
- **Importing types:** `/** @import { LoadedLevel, GameCallbacks } from './types.js' */` at the top of the file, not inline `import('…')` types.
- **Enums:** `/** @type {const} */ ({ … })` (the parentheses are required), plus a derived typedef such as `/** @typedef {typeof STATE[keyof typeof STATE]} GameState */`. A class field that holds one of these values is declared with that type where it is first assigned (`/** @type {GameState} */ this.state = STATE.STARTING`). Without the declaration, the checker narrows the field to its first value and rejects later assignments.
- **Casts:** `/** @type {X} */ (expression)`; the parentheses are required.
- **Escape hatch:** `// @ts-expect-error <reason>` on the line above, never `@ts-ignore`. Unlike `@ts-ignore`, it reports an error itself once it is no longer needed.
- **The existing comment style stays.** JSDoc tags go inside the same `/** … */` block as the prose comment, after the text.
- **Runtime behaviour is unchanged.** Code changes are limited to adding comments, except where the checker finds a real bug. Any such fix is recorded in the status section with a one-line description.

### Shared types (`src/game/types.js`)

| Type | Describes | Used by |
| :--- | :--- | :--- |
| `LevelFile` | A raw level file, mirroring `docs/level-file-schema.json` (written by hand; keep in sync when the schema changes) | `levelLoader.js` |
| `VfxEntry` | One `vfx` timeline entry `{ name, time }` | `LevelFile`, `LoadedLevel` |
| `LoadedLevel` | What `loadLevel()` returns: `number`, `name`, `soundTrack`, `lives`, `secondsPerBeat`, `timerTenths`, `atomSpeed`, `spawnInterval`, `paddleArc`, `paddleDuration`, `vfx` | `GameEngine.js`, `App.jsx`, `GameScreen.jsx`, `LevelSelectionMenuScreen.jsx` |
| `GameResult` | `{ score }`, sent with `onGameOver` / `onLevelWin` | `GameEngine.js`, `App.jsx`, `GameScreen.jsx` |
| `GameCallbacks` | The engine → React events: `onScoreChange(score)`, `onLivesChange(lives)`, `onTimeChange(tenths)`, `onGameOver(result)`, `onLevelWin(result)`. All required. | `GameEngine.js`, `GameScreen.jsx` |

Sound effect names (`SfxName`) are declared in `soundManager.js` itself, as a union of the files in `assets/audio/` (`'bounce' | 'capture' | 'destroy' | 'launch' | 'silence' | 'vortex_creation'`). Track names stay `string`: they come from the level files, which are validated at runtime, so a union type would need a cast in the loader without catching anything new.

---

## Phases

Each phase ends with the checks in "Verification". Effort estimates are for one developer working with an agent.

### Phase T1 — Tooling (~30 min)
- Install the dev dependencies listed in "Tooling".
- Add `jsconfig.json` and the `typecheck` script.
- Add this file to the Documentation Map in `AGENTS.md`.
- Check that `npm run typecheck` passes with no file opted in, and that `dev`, `build` and `lint` behave as before.

### Phase T2 — Shared types & level loader (~1 h)
- Create `src/game/types.js` with the types in "Shared types".
- `levelLoader.js` (`// @ts-check`):
  - `validateLevel(level: any): string[]` and `loadLevel(data: any, number: number): LoadedLevel`. The input stays `any` because it is untrusted JSON until it passes validation; inside `loadLevel`, the validated data is read through a `LevelFile`-typed local.
  - `spawnDelay(spawnInterval: number, random?: () => number): number`.
  - `levels` is a `LoadedLevel[]`. The `import.meta.glob` result needs a cast (see "Expected fix-ups").
- Add `src/game/types.js` to `docs/project-structure.md`.

### Phase T3 — Pure helpers & audio (~1–1.5 h)
- `scoring.js`, `color.js`, `easing.js`, `highScore.js` (`// @ts-check`): parameter and return types on every export (all `number`). Mostly mechanical.
- `soundManager.js` (`// @ts-check`):
  - `SfxName` union; `playSfx(name: SfxName)`.
  - Every other export typed: `playTrack(name: string, options?: { fadeIn?: boolean })`, `onTrackStart(name: string, callback: () => void): () => void`, the volume getters and setters, etc.
  - Type the module-level maps: `sfx` and `activeVoices` as `Record<string, …>`, `tracks` as `Record<string, { url: string, howl: Howl | null, started: boolean }>`, `trackStartListeners` as `Record<string, Set<() => void>>`.
  - Cast the two `import.meta.glob` results to `Record<string, string>`.

### Phase T4 — Game engine & entities (~2–3 h)
- `GameEngine.js` (`// @ts-check`):
  - Constructor `(level: LoadedLevel, callbacks: GameCallbacks)`; `mount(container: HTMLElement): Promise<void>`; `destroy(): void`.
  - `STATE` and `BACKGROUND_COLORS` as const enums; `GameState` typedef; `this.state` declared as `GameState`.
  - `emit` made generic, so each event's arguments are checked against `GameCallbacks`:
    ```js
    /**
     * @template {keyof GameCallbacks} K
     * @param {K} name
     * @param {Parameters<GameCallbacks[K]>} args
     */
    emit (name, ...args) {
    ```
    With this, `this.emit('onGameOver', this.score)` is an error (the event takes `{ score }`), and so is a misspelled event name.
  - Pixi handlers: `@param {FederatedPointerEvent} event` on the pointer handlers, `@param {Ticker} ticker` on `update`, both imported from `pixi.js`. `onKeyDown` takes a `KeyboardEvent`.
  - Pools and arrays declared where they are created: `/** @type {Atom[]} */ this.atoms = []`, `/** @type {Map<number, Paddle>} */ this.draggedPaddles = new Map()`, and so on.
- Entities (`Atom`, `AtomPulse`, `AtomEmitter`, `ContainmentRing`, `Paddle`, `PaddleFlash`, all `// @ts-check`):
  - Constructor parameters and public methods typed.
  - `ATOM_STATE` and `ATOM_COLORS` as const enums; `AtomState` typedef; `Atom#state` declared as `AtomState`.
  - Getters (`positionAngle`, `movingOutward`) get `@returns`.

### Phase T5 — React layer (~2 h)
- Every component and screen (`// @ts-check`): a props `@typedef` above the component, applied with `@param {XProps} props`.
  - Components that spread `...rest` onto a DOM element extend that element's props. For example, `Button`'s props are `ComponentProps<'button'>` plus `className`, and `Screen`'s are `ComponentProps<'div'>` plus `variant` and `transparent`.
  - `variant: 'light' | 'dark'`; `TextBox`'s `size: 'hud' | 'menu' | 'title'`.
  - `GameOverScreen` and `YouWinScreen` take `ResultScreen`'s props without `title` (`Omit<ResultScreenProps, 'title'>`).
- `GameScreen.jsx`: props typed with `LoadedLevel` and `GameResult`. The callbacks object passed to `new GameEngine(…)` is checked against `GameCallbacks`, so a missing or misspelled callback is a compile error.
- `App.jsx`:
  - `SCREENS` as a const enum with a `ScreenName` typedef.
  - `useState` calls whose initial value is `null` get their type through a cast, e.g. `useState(/** @type {LoadedLevel | null} */ (null))` and `useState(/** @type {'in' | 'out' | null} */ ('in'))`.
  - `handleTransitionEnd` takes an `AnimationEvent<HTMLDivElement>` from React.
- `MenuBackground.jsx`: the `lottie_svg.min.js` build has no type declarations, so cast its default import to `LottiePlayer` from `lottie-web`'s own types (`/** @type {import('lottie-web').LottiePlayer} */`).
- `main.jsx`: no annotations expected beyond `// @ts-check`.

### Phase T6 — Project-wide checking & docs (~1 h)
- `jsconfig.json`: `"checkJs": true`. Remove every `// @ts-check` line from `src/`, which is now redundant.
- `AGENTS.md`:
  - A rule under "Workflow Rules": "Run `npm run typecheck` and `npm run lint` after every change to `src/`; both must pass."
  - A short pointer to "Annotation conventions" in this file.
- `docs/tech-stack.md`: a stack table row for type checking (TypeScript compiler over JSDoc-annotated JS, no build step).
- `docs/implementation-guidelines.md`: one line on the annotation rule (exports, component props and enums are typed with JSDoc).
- `docs/implementation-plan.md`, "Language" decision: add that the code is type-checked with JSDoc + `checkJs` and link to this file. The decision itself (plain JS/JSX) doesn't change.

### Phase T7 — Reference examples (~45 min)
Both examples are what agents copy from, so they must show the conventions above. They are not part of `npm run typecheck` (its scope is `src/`), but they start with `// @ts-check` so the editor checks them.
- `docs/react-pixi-example.jsx`:
  - Add `// @ts-check` and a `PixiCanvasProps` typedef (`onGameReady?: (app: Application) => void`).
  - Type the refs: `useRef(/** @type {HTMLDivElement | null} */ (null))` and the same with `Application`.
  - Remove `baseTexture: true` from the `destroy()` options. It is a PixiJS v7 option that v8's types reject, and the project already uses `{ children: true, texture: true }` (AGENTS.md rule 3).
  - Type the ticker callback parameter (`Ticker`).
- `docs/react-pixi-usage-example.jsx`:
  - Add `// @ts-check`, a `GameScreenProps` typedef using `GameResult`, and a typed `handleGameReady`.
- Both files:
  - Remove the unused `React` default import (React 19 uses the automatic JSX runtime).
  - Match the project's code style: no semicolons, space before function parentheses, 2-space indentation, `import { Application } from 'pixi.js'` rather than `import * as PIXI`. `docs/` is outside ESLint's scope, so apply this by hand.
- Check in VS Code that neither file reports errors other than unresolved imports. The usage example imports illustrative paths (`../components/PixiCanvas`) that don't exist relative to `docs/`; that's expected.

---

## Expected fix-ups

These patterns will produce errors when a file is first checked. They are known ahead of time and are not bugs:

| Where | Error | Fix |
| :--- | :--- | :--- |
| `const x = {}` in JS files | None: an empty object literal accepts any key, so it's untyped rather than an error | Declare the map anyway where its values matter: `/** @type {Record<string, Howl>} */` |
| `this.atoms = []` and other empty arrays | Element type inferred as `never` or `any` | Declare the element type: `/** @type {Atom[]} */` |
| Enum fields (`this.state`, `atom.state`) | Later assignments rejected | Declare the field with the enum's typedef |
| `useState(null)` | State stuck at `null` / `any` | Cast the initial value to the intended union |
| `lottie_svg.min.js` import | Module has no types | Cast to `LottiePlayer` |
| `this.callbacks[name]?.(...args)` in `emit` | Spread not assignable to the callback's parameters | Keep the generic signature above; if needed, cast the callback once inside `emit` |

---

## Verification

After each phase:
1. **`npm run typecheck` passes.** Zero errors, and no `@ts-expect-error` without a reason.
2. **`npm run lint` passes.**
3. **`npm run build` succeeds**, with no new warnings.
4. **Play-test after phases T4 and T5:**
   - Enter → Main Menu → Settings (change both volumes) → Level Select → Level 1;
   - in the level: bounce, capture, lose a life (background turns red at one life) and pause with `P`;
   - reach Game Over → Try Again;
   - win a level → You Win! → Main Menu (the menu animation and track restart together).

   Annotations don't change the generated code, so any difference in behaviour means a code change slipped in.
5. **Phase T6 only:**
   - `git grep "@ts-check" src` returns nothing;
   - introducing a deliberate error in a new, unannotated file in `src/` makes `npm run typecheck` fail. Revert that file afterwards.

---

## Status

Legend: `[x]` done · `[ ]` pending

- [x] **Phase T1** — Tooling (`jsconfig.json`, dev dependencies, `typecheck` script). Installed TypeScript 7.0.2 (the native compiler); `checkJs` support confirmed with a throwaway `// @ts-check` file.
- [x] **Phase T2** — Shared types & level loader (`src/game/types.js`). The `import.meta.glob` cast wasn't needed here: Vite already types the eager JSON glob as `Record<string, unknown>`; only the `[number, data]` pairs needed a tuple cast.
- [x] **Phase T3** — Pure helpers & audio (`SfxName`). No glob casts needed: Vite types eager `?url` globs as `Record<string, string>`. The module-level maps are declared with `Partial<Record<SfxName, …>>` where keyed by sound effect.
- [x] **Phase T4** — Game engine & entities (typed `emit`, state enums). No errors when first opted in; the only fix-up was the `emit` spread, solved with a cast to a local `callback`. Probes caught a wrong `onGameOver` payload, a misspelled event, a misspelled SFX name and an invalid state value. Automated smoke test (Playwright, level 1): settings, bounce scoring, life loss, pause, You Win! with containment and time bonus, back to Main Menu; no page errors. Game Over path not exercised.
- [x] **Phase T5** — React layer (component props, `App` state). When first opted in, the checker inferred `Menu`'s `footer` as required from its usage; the prop typedefs fixed that. The `lottie_svg.min.js` cast had to go through `unknown`: the checker infers types from the minified build, and they don't overlap enough with `LottiePlayer` for a direct cast. *(Superseded in T6: with `maxNodeModuleJsDepth: 0` the build is no longer inferred, and the cast is direct.)* Probes caught a missing `GameScreen` callback, a misspelled `GameResult` field, invalid `TextBox` size and `Screen` variant values, and an invalid Lottie renderer. Automated smoke test (Playwright): menu animation, Neutronika played to Game Over with no input, Try Again (timer and lives reset), Settings, back to Main Menu; no page errors.
- [x] **Phase T6** — Project-wide checking (`checkJs: true`) & docs. Turning `checkJs` on globally surfaced 72 errors, all inside `node_modules/lottie-web/build/player/esm/lottie_svg.min.js`: a config named `jsconfig.json` defaults `maxNodeModuleJsDepth` to 2, so the compiler loaded and checked that untyped JS build. Fixed with `"maxNodeModuleJsDepth": 0` (added to the config snippet in "Tooling"); the import is now untyped, so the `MenuBackground.jsx` cast is a direct one again, without `unknown`.
- [x] **Phase T7** — Reference examples. Verified by copying both files into `src/` at the paths their header comments name (so imports resolve against the real project), running `npm run typecheck`, then removing the copies. That found a real mismatch: the usage example rendered `<HUD score={score} />`, but the project's `HUD` also requires `timeTenths`, `hiScore` and `lives`; the example now passes all four. The same check confirmed v8's types reject the old `baseTexture` destroy option. The project's ESLint style rules pass on both; ESLint still reports the unused placeholders the skeletons already had (`ticker`, `onGameOver`, the state setters) and a missing `onGameReady` hook dependency, left as they are.

Bugs found by the checker (fixed during the phase that found them):

- *(none yet)*
