# CRT Effect — How It Works

This document explains the CRT post-processing effect in `src/effects/crt/`, step by step. It's written as a learning resource: it assumes you know JavaScript and the basics of PixiJS, but not shaders. What the effect must look like is in `docs/graphical-specs.md` ("CRT effect (game arena)"); this document is about how it's built.

Status: the pipeline and the zoom blur are done (Phase 37). The CRT layers (curvature, chromatic aberration, scanlines, phosphor mask, vignette) come in Phase 38, and this document will be completed then.

---

## 1. Post-processing in one paragraph

Normally PixiJS draws the scene (the ring, the atoms, the paddles…) straight onto the canvas. **Post-processing** adds a step in between: the scene is first drawn into an off-screen image, and then a small program running on the GPU (a **shader**) reads that image and draws the canvas from it, changing it on the way: blurring it, bending it, darkening every other line. The scene's code doesn't know about any of this: it draws the same shapes as always.

```
 without the effect:   scene ──────────────────────────────────────────► canvas

 with the effect:      scene ──► scene texture ──┬──────────────────────► final pass ──► canvas
                                                 └──► zoom blur pass ──► blur texture ──┘
```

## 2. The building blocks

### Render textures

A **render texture** (`RenderTexture` in PixiJS) is an image that lives on the GPU and that PixiJS can draw into instead of the canvas: `renderer.render({ container, target: texture })`. Shaders can then read it like any picture.

The effect uses two:

| Texture | Size | Why |
| :--- | :--- | :--- |
| Scene texture | The screen's size, at the canvas resolution (capped by `MAX_RESOLUTION`) | Holds the scene exactly as it would have looked on the canvas. It's **antialiased (MSAA)**, like the canvas, so thin lines stay smooth. Without it, lines drawn into a texture come out jagged. |
| Blur texture | `BLUR_TEXTURE_HEIGHT` pixels tall, whatever the device | Holds the blurred copy. A blur is soft by nature, so a low resolution doesn't show, and it's much cheaper (see "Performance"). |

Both are the screen's size in PixiJS units (CSS pixels); what differs is their **resolution**, the number of real pixels per unit. That keeps every pass in the same coordinate space.

### Shaders: vertex and fragment

A shader program has two parts, both written in **GLSL** (a small C-like language that runs on the GPU):

- The **vertex shader** runs once per corner of the shape being drawn. It says where that corner lands on the target.
- The **fragment shader** runs once per **pixel** covered by the shape, in parallel on thousands of GPU cores. It returns that pixel's color. This is where all the effect's work happens.

The vertex shader hands values to the fragment shader through **varyings** (`out` in the vertex shader, `in` in the fragment shader). The GPU interpolates them between the corners, so each pixel gets its own value.

Values set from JavaScript, the same for every pixel of a draw, are **uniforms**: the blur strength, the blur center, a texture to read. A fragment shader reads a texture with `texture(sampler, uv)`, where `uv` is a position in that texture.

### Texture coordinates (UV)

Positions in a texture are given as **UV coordinates**, from 0 to 1 whatever the texture's size: `(0, 0)` is the top left, `(1, 1)` the bottom right, `(0.5, 0.5)` the center. Reading between two pixels blends them (linear filtering), which is how the small blur texture is smoothly scaled up to the screen.

Because the scene and blur textures both cover the whole screen, **one UV means the same screen point in both**. That's what lets the final pass read them at the same `vUV` and mix them.

### Full-screen quads (and why not PixiJS filters)

Each pass draws **one rectangle covering its whole target** (a "full-screen quad": two triangles, four corners). Every pixel of the target then runs the fragment shader once. In `CrtEffect.js` that's a PixiJS `Mesh` with a custom `Shader`, whose `Geometry` is a rectangle from `(0, 0)` to `(1, 1)` scaled to the screen's size. Its texture coordinates (`aUV`) go from 0 to 1 across it.

PixiJS also has **filters**, its usual tool for effects. They work on the bounds of whatever they're applied to, and add padding and coordinate conversions (`uInputSize`, `uOutputFrame`, `filterArea`…) that are hard to follow and a common source of offset bugs. Every pass here covers the whole screen anyway, so plain full-screen quads with plain 0–1 coordinates are simpler to read, to learn from, and slightly cheaper (no temporary textures).

The shared vertex shader (`fullscreen.vert.glsl`) uses the projection matrices that PixiJS sets for every draw (`uProjectionMatrix`, `uWorldTransformMatrix`, `uTransformMatrix`). Writing GPU positions directly would also work for the canvas, but WebGL stores render textures upside down compared to the canvas; PixiJS's projection already handles that, so every pass comes out the right way up.

## 3. One frame, step by step

`GameEngine` calls `crt.render(arena, { background, center })` at the end of every game-loop update. PixiJS draws the stage right after (the ticker runs the game update first, then the stage render).

1. **Scene pass:** `renderer.render({ container: arena, target: sceneTexture, clearColor: background })`. The texture is first cleared to the arena's background (black, or dark red with one life left), then the arena is drawn into it. The arena is **not on the stage**: the stage only holds the final pass's mesh (`crt.view`), so the shapes are drawn once, into the texture.
2. **Zoom blur pass** (only with `BLUR_ENABLED`): the blur mesh, with `zoomBlur.frag.glsl`, is drawn into the blur texture. Its shader reads the scene texture.
3. **Final pass:** PixiJS draws the stage, i.e. `crt.view`, a full-screen mesh with `crt.frag.glsl`. For every canvas pixel it reads the scene and the blur at the same UV and mixes them.

On a resize the textures are reallocated (and emptied), so the engine redraws the arena into them straight away. PixiJS draws the stage right after a resize, even while the game is paused.

## 4. The zoom blur

`zoomBlur.frag.glsl`. The look: every bright object leaves a streak pointing **away** from a center (the core), like Resolume Avenue's Radial Blur.

### The idea

For each pixel of the blur texture, the shader averages `BLUR_SAMPLES` points of the scene on the straight line **from that pixel toward the center**, up to `BLUR_STRENGTH` of the way:

```glsl
vec2 toCenter = uCenter - vUV;
for (int i = 0; i < SAMPLES; i++) {
  float t = (float(i) + offset) / float(SAMPLES);   // 0 → 1
  sum += texture(uScene, vUV + toCenter * (uStrength * t));
}
finalColor = sum / float(SAMPLES);
```

Why does that make streaks pointing outward? Take an atom at 100 px from the center, with `BLUR_STRENGTH = 0.38`:

- A pixel at 130 px from the center looks inward from 130 down to 130 × (1 − 0.38) ≈ 81 px. The atom (at 100) is on that line, so the pixel picks up some of its brightness.
- A pixel at 170 px looks from 170 down to ≈ 105 px: it just misses the atom. So the streak ends at about 100 / (1 − 0.38) ≈ 160 px.
- A pixel at 90 px (between the atom and the center) looks further inward, away from the atom: no streak on that side.

So the streak runs from the object outward, and its length grows with the object's distance from the center: the paddles streak a lot, the core almost not at all.

`toCenter` is in UV units, and both its x and y are multiplied by the same `t`, so every pixel moves straight toward the center on screen even though the screen isn't square.

### Jitter: fewer samples, no stepping

With 24 samples spread along a 60 px streak, the samples are 2–3 px apart, and a small, sharp object shows up as a row of separate copies instead of a smooth streak. Doubling the samples doubles the cost. Instead, each pixel starts its samples at a slightly different point (`offset`, between 0 and 1 sample step), so neighboring pixels see the object at different steps. The copies blend into a fine, even noise that's invisible at 15% opacity.

The offset comes from `pixelNoise()`, an "interleaved gradient noise" formula: a fixed pseudo-random value for each pixel position. It doesn't change from frame to frame, so it doesn't sparkle. `BLUR_JITTER = 0` turns it off, to see the difference.

### The sample count is built into the shader

GLSL needs a loop's bound to be a constant known when the shader is compiled. `CrtEffect.js` writes `#define SAMPLES 24` (from `BLUR_SAMPLES`) at the top of the shader's source before compiling it. That's also why `BLUR_SAMPLES` can't change while the game runs.

### The center follows the core

The streaks must come from the core, also during the last life zoom, when the camera moves it across the screen. Each frame the engine passes the core's screen position (`playfield.position`); `CrtEffect` divides it by the screen size to get UV (`uCenter`).

## 5. The final pass

`crt.frag.glsl`. For now:

```glsl
vec4 color = texture(uScene, vUV);
#ifdef BLUR
color = mix(color, texture(uBlur, vUV), uBlurMix);
#endif
finalColor = vec4(color.rgb, 1.0);
```

`mix(a, b, 0.15)` is `a × 0.85 + b × 0.15`: exactly what drawing the blur on top of the scene at 15% opacity gives, but in one step, with no extra drawing. (Resolume's effect opacity works the same way.)

**`#ifdef BLUR`**: `CrtEffect.js` writes `#define BLUR` at the top of the source only when `BLUR_ENABLED` is on. With it off, the compiler never sees the blur lines, the blur texture isn't created and the blur pass doesn't run: no cost at all, not just a 0% mix.

Phase 38 adds, in this order: curvature, the black outside the glass, chromatic aberration, scanlines, the phosphor mask, the vignette and a brightness gain.

## 6. Using the module elsewhere

`src/effects/crt/` doesn't know about the game. Anything drawn with a PixiJS v8 **WebGL** renderer can use it:

```js
import { Application, Container, Graphics } from 'pixi.js'
import CrtEffect from './effects/crt/CrtEffect.js'

const app = new Application()
await app.init({ resizeTo: window, preference: 'webgl' })
document.body.appendChild(app.canvas)

// What to process: kept off the stage
const scene = new Container()
scene.addChild(new Graphics().circle(400, 300, 50).fill(0xffffff))

const crt = new CrtEffect(app.renderer, { BLUR_MIX: 0.3 }) // any setting can be overridden
app.stage.addChild(crt.view)
app.renderer.on('resize', (width, height) => {
  crt.resize(width, height)
  crt.render(scene)
})
app.ticker.add(() => crt.render(scene, { background: 0x000000 })) // runs before the stage render

// On teardown, before app.destroy():
// crt.destroy(); scene.destroy({ children: true })
```

Things to know:

- **The scene's root is drawn as is.** Put any position or scale on a child, not on the container you pass to `render()` (the game uses an `arena` container holding the `playfield`).
- **The scene isn't on the stage**, so `app.destroy()` doesn't reach it: destroy it yourself. Pointer events still work on the stage (the game listens on the stage with a `hitArea`); converting a pointer position with `toLocal()` works on containers off the stage too.
- **WebGL only:** the shaders are GLSL. Ask for `preference: 'webgl'`.

## 7. Tuning

Every value lives in `src/effects/crt/crtSettings.js`. Change it and reload (the dev server reloads on save).

| Setting | Start | What you'll see | Notes |
| :--- | :--- | :--- | :--- |
| `MAX_RESOLUTION` | 2 | Sharpness of everything in the arena | Above 2 the difference is barely visible, but the GPU cost grows with its square |
| `BLUR_ENABLED` | `true` | Streaks on / off | Off costs nothing |
| `BLUR_TEXTURE_HEIGHT` | 360 | Softness of the streaks | Lower is blurrier and cheaper; below ~180 the streaks start to look blocky |
| `BLUR_SAMPLES` | 24 | Smoothness of the streaks | Each extra sample costs a texture read per blur pixel. Raise it if you see copies along the streaks even with jitter |
| `BLUR_STRENGTH` | 0.38 | Length of the streaks | Measured on the Resolume reference: an object at 100 px from the core streaks out to about 160 px. Close to 1 the streaks reach the center |
| `BLUR_MIX` | 0.15 | How visible the streaks are | Also slightly dims the sharp scene (85% of it remains) |
| `BLUR_JITTER` | 1 | Stepping vs. fine noise | 0 shows the separate sample copies |

## 8. Performance

GPU cost depends on **pixels × texture reads per pixel**; the CPU only sets a few uniforms and issues three draws per frame.

| Pass | Pixels (1080p screen, resolution 2) | Reads per pixel | Rough GPU time, mid-range phone |
| :--- | :--- | :--- | :--- |
| Scene | Full resolution, MSAA | (the scene's own drawing) | ~0.3–1 ms, mostly the MSAA resolve |
| Zoom blur | 640 × 360 ≈ 230,000 | 24 | ~0.3–0.8 ms |
| Final | Full resolution | 2 | Under 1 ms (Phase 38 adds a few reads) |

That's why the blur runs at a fixed low resolution, the resolution is capped at 2×, and the CRT layers will all share the final pass instead of each adding its own.

## 9. Pitfalls met along the way

- **Lost antialiasing:** drawing into a plain render texture loses the canvas' MSAA, and the 2 px ring turns jagged. The scene texture is created with `antialias: true`.
- **Upside-down passes:** WebGL's render textures and the canvas use opposite vertical directions. Using PixiJS's projection in the vertex shader keeps every pass the right way up.
- **Empty frame after a resize:** resizing a render texture empties it, and PixiJS draws the stage right after a resize, even while paused. The engine redraws the arena into the textures in its resize handler.
- **GLSL loops:** the loop bound must be a compile-time constant, hence the `#define SAMPLES` written into the source.
