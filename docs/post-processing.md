# Post-processing — How It Works

This document explains the post-processing in `src/effects/`, step by step: the pipeline, and the two effects it chains today, the **zoom blur** and the **CRT**. It's written as a learning resource: it assumes you know JavaScript and the basics of PixiJS, but not shaders. What the effects must look like is in `docs/graphical-specs.md` ("CRT effect (game arena)"); this document is about how they're built.

It covers Phases 37–38 (the zoom blur, the CRT layers and input mapping), 39 (the OLD TV switch) and 40 (one folder per effect, composed into one final pass).

**About the numbers in this document:** the values of the settings live only in the settings files (`postProcessingSettings.js`, `zoomBlurSettings.js`, `crtSettings.js`), each commented with its unit and range. Numbers used here to explain how something works are **examples**, not the current values.

---

## 1. Post-processing in one paragraph

Normally PixiJS draws the scene (the ring, the atoms, the paddles…) straight onto the canvas. **Post-processing** adds steps in between: the scene is first drawn into an off-screen image, and then small programs running on the GPU (**shaders**) read that image and draw the canvas from it, changing it on the way: blurring it, bending it, darkening every other line. Each **effect** takes an image in and gives an image out, so effects can be chained, and the whole chain runs in **one final pass**. The scene's code doesn't know about any of this: it draws the same shapes as always.

```
 without post-processing:  scene ─────────────────────────────────────────────────────► canvas

 with it (OLD TV on):      scene ──► scene texture ──┬─────────────────────► final pass ──► canvas
                                                     │                  (zoom blur mix → CRT)
                                                     └──► zoom blur's own pass ──► blur texture ──┘
```

## 2. The files

```text
src/effects/
├── PostProcessing.js          The pipeline: scene texture, builds and runs the final pass, input mapping
├── postProcessing.frag.glsl   The final pass's template, where the effects' chunks go
├── postProcessingSettings.js  Values shared by the whole pipeline (resolution cap)
├── FullscreenPass.js          One full-screen pass: a screen-covering rectangle + a fragment shader
├── fullscreen.vert.glsl       The vertex shader every pass shares
├── zoomBlur/
│   ├── ZoomBlurEffect.js      The zoom blur effect
│   ├── zoomBlurSettings.js    Its values
│   ├── zoomBlur.frag.glsl     Its own pass: the blurred copy, at low resolution
│   └── zoomBlurMix.glsl       Its chunk of the final pass: the blur mixed over the image
└── crt/
    ├── CrtEffect.js           The CRT effect
    ├── crtSettings.js         Its values
    ├── crt.glsl               Its chunk of the final pass
    └── curvature.js           The curved glass's formula in JavaScript, for input
```

Each effect owns its folder: its settings, its GLSL and its JavaScript. The pipeline doesn't know what any effect does; it only joins their GLSL into the final pass, in chain order. Adding a third effect means adding a folder (see "Adding an effect"). `.frag.glsl` files are complete fragment shaders; `.glsl` files are **chunks**, pieces of the final pass's shader.

## 3. The building blocks

### Render textures

A **render texture** (`RenderTexture` in PixiJS) is an image that lives on the GPU and that PixiJS can draw into instead of the canvas: `renderer.render({ container, target: texture })`. Shaders can then read it like any picture.

| Texture | Owner | Size | Why |
| :--- | :--- | :--- | :--- |
| Scene texture | `PostProcessing` | The screen's size, at the canvas resolution (capped by `MAX_RESOLUTION`) | Holds the scene exactly as it would have looked on the canvas. It's **antialiased (MSAA)**, like the canvas, so thin lines stay smooth. Without it, lines drawn into a texture come out jagged. |
| Blur texture | `ZoomBlurEffect` | `TEXTURE_HEIGHT` pixels tall, whatever the device | Holds the blurred copy. A blur is soft by nature, so a low resolution doesn't show, and it's much cheaper (see "Performance"). |

They're all the screen's size in PixiJS units (CSS pixels); what differs is their **resolution**, the number of real pixels per unit. That keeps every pass in the same coordinate space.

### Shaders: vertex and fragment

A shader program has two parts, both written in **GLSL** (a small C-like language that runs on the GPU):

- The **vertex shader** runs once per corner of the shape being drawn. It says where that corner lands on the target.
- The **fragment shader** runs once per **pixel** covered by the shape, in parallel on thousands of GPU cores. It returns that pixel's color. This is where all the effects' work happens.

The vertex shader hands values to the fragment shader through **varyings** (`out` in the vertex shader, `in` in the fragment shader). The GPU interpolates them between the corners, so each pixel gets its own value.

Values set from JavaScript, the same for every pixel of a draw, are **uniforms**: the blur strength, the blur center, a texture to read. A fragment shader reads a texture with `texture(sampler, uv)`, where `uv` is a position in that texture.

### Texture coordinates (UV)

Positions in a texture are given as **UV coordinates**, from 0 to 1 whatever the texture's size: `(0, 0)` is the top left, `(1, 1)` the bottom right, `(0.5, 0.5)` the center. Reading between two pixels blends them (linear filtering), which is how the small blur texture is smoothly scaled up to the screen.

Because every texture covers the whole screen, **one UV means the same screen point in all of them**. That's what lets the final pass read the scene and the blur at the same `uv`.

### Full-screen quads (and why not PixiJS filters)

Each pass draws **one rectangle covering its whole target** (a "full-screen quad": two triangles, four corners). Every pixel of the target then runs the fragment shader once. `FullscreenPass.js` builds one: a PixiJS `Mesh` with a custom `Shader`, whose `Geometry` is a rectangle from `(0, 0)` to `(1, 1)` scaled to the screen's size. Its texture coordinates (`aUV`) go from 0 to 1 across it. The final pass and the zoom blur's own pass are both `FullscreenPass`es.

PixiJS also has **filters**, its usual tool for effects. They work on the bounds of whatever they're applied to, and add padding and coordinate conversions (`uInputSize`, `uOutputFrame`, `filterArea`…) that are hard to follow and a common source of offset bugs. Every pass here covers the whole screen anyway, so plain full-screen quads with plain 0–1 coordinates are simpler to read, to learn from, and slightly cheaper (no temporary textures).

The shared vertex shader (`fullscreen.vert.glsl`) uses the projection matrices that PixiJS sets for every draw (`uProjectionMatrix`, `uWorldTransformMatrix`, `uTransformMatrix`). Writing GPU positions directly would also work for the canvas, but WebGL stores render textures upside down compared to the canvas; PixiJS's projection already handles that, so every pass comes out the right way up.

## 4. The pipeline

### What an effect is

`PostProcessing` chains any objects that have:

| Member | What it does |
| :--- | :--- |
| `name` | The name of its GLSL function in the final pass (`zoomBlur`, `crt`), unique in the chain |
| `glsl` | Its **chunk**: GLSL source defining `vec3 <name>(vec2 uv)`, which returns the effect's image at `uv` and reads its input image with `INPUT(uv)` |
| `resources` | The textures and uniform groups its chunk uses, by name (unique in the chain) |
| `resize(width, height)` | Resizes its own textures, updates size-dependent uniforms |
| `setScene(texture)` | Optional: receives the scene texture, for its own passes |
| `prepare()` | Optional: its own passes, run before the final pass (the zoom blur's low-resolution blur) |
| `toScene(point)` | For input: the input-image point shown at an output point |
| `destroy()` | Frees its textures and shaders |

### The final pass: one shader built from chunks

GLSL has no `#include`, and no way to pass a function as a value. So `PostProcessing` builds the final pass's source as text, from `postProcessing.frag.glsl` (the template) and each effect's chunk, before compiling it. The template starts the chain with the scene itself:

```glsl
vec3 scene(vec2 uv) { return texture(uScene, uv).rgb; }

// EFFECTS            ← replaced by the chunks

void main() { finalColor = vec4(LAST(vUV), 1.0); }
```

`composeFragment()` replaces the `// EFFECTS` line with each chunk, in chain order, with a `#define` before each one naming its input. With the zoom blur and the CRT, the shader the GPU compiles reads:

```glsl
#define INPUT scene
uniform sampler2D uZoomBlurTexture; …
vec3 zoomBlur(vec2 uv) { return mix(INPUT(uv), texture(uZoomBlurTexture, uv).rgb, uZoomBlurMix); }
#undef INPUT

#define INPUT zoomBlur
uniform float uCrtCurvature; …
vec3 crt(vec2 uv) { … INPUT(crtToUV(p)) … }
#undef INPUT

#define LAST crt
```

`#define INPUT zoomBlur` makes the preprocessor replace every `INPUT` in the CRT's chunk with `zoomBlur` before compiling, so `crt()` calls `zoomBlur()`, which calls `scene()`. Each pixel of the canvas runs `crt(vUV)` once. The chain is **function calls inside one pass**: no texture between effects, no extra pass.

Because an effect reads its input through a function, it can read it **anywhere and as often as it needs**: the CRT reads it at a bent point (curvature), three times (chromatic aberration), and each read runs the zoom blur's mix at that exact point. The result is the same as running the effects one after another on whole images.

Two rules keep the chunks from clashing, since they all end up in one shader:

- **Unique names:** an effect's uniforms and helper functions start with its name (`uCrtCurvature`, `crtWarp()`, `uZoomBlurMix`). `PostProcessing` refuses two resources with the same name.
- **Only `INPUT` to read the image:** a chunk never reads `uScene` itself, so it works wherever it sits in the chain.

With no effect, `LAST` is `scene`, and the pass just copies the scene.

### One frame, step by step

`GameEngine` calls `post.render(arena, { background })` at the end of every game-loop update. PixiJS draws the stage right after (the ticker runs the game update first, then the stage render).

1. **Scene:** `renderer.render({ container: arena, target: sceneTexture, clearColor: background })`. The texture is first cleared to the arena's background (black, or dark red with one life left), then the arena is drawn into it. The arena is **not on the stage**: the stage only holds `post.view`, so the shapes are drawn once, into the texture.
2. **Effects' own passes:** each effect's `prepare()` (the zoom blur draws its blurred copy into the blur texture).
3. **Final pass:** `post.view`, on the stage, is the final pass's mesh, so the stage render runs it: one full-screen pass with every effect's chunk.

On a resize the textures are reallocated (and emptied), so the engine redraws the arena through the pipeline straight away. PixiJS draws the stage right after a resize, even while the game is paused.

### The chain in the game

`GameEngine` builds the chain from two switches: the zoom blur (`ZOOM_BLUR_ENABLED`, always on) and the CRT (the Settings **OLD TV** switch, off by default). The order is blur, then CRT. Neither: no pipeline at all, the arena goes back on the stage (`POST_PROCESSING_ENABLED = false` does the same, to compare).

**The order matters.** The CRT comes last because it plays the screen: its curvature bends the blur's streaks with everything else, and its scanlines and mask sit on top of the whole picture, like a real CRT showing an image.

### Why one pass, not a pass per effect

Running each effect as its own full-screen pass, writing a texture that the next one reads, is simpler to build but costs one full-resolution write and read per extra effect (~0.3–0.8 ms of GPU time on a mid-range phone each). Composing the chunks into one shader costs nothing extra per effect beyond its own maths and texture reads. The price is the two naming rules above. Effects that need a different resolution (the zoom blur's low-resolution blur) still run that part as their own pass in `prepare()`.

### Input: what you press is what you see

A touch at a screen point must land on the scene point **shown** there. `post.toScene(point)` asks each effect, **last first** (the last one is what's on screen): "which point of your input do you show here?". The zoom blur doesn't move anything (`toScene` returns the point); the CRT bends it through its curved glass (see "CRT"). The engine then converts the result to the playfield: `playfield.toLocal(post.toScene(event.global))`.

## 5. Zoom blur

`src/effects/zoomBlur/`. The look: every bright object leaves a streak pointing **away** from a center (the core), like Resolume Avenue's Radial Blur. Two parts: in `prepare()`, its own pass draws the blurred copy of the scene into the low-resolution blur texture (`zoomBlur.frag.glsl`); then its chunk of the final pass mixes it over the image (`zoomBlurMix.glsl`).

### The idea

For each pixel of the blur texture, the shader averages `SAMPLES` points of the scene on the straight line **from that pixel toward the center**, up to `STRENGTH` of the way:

```glsl
vec2 toCenter = uCenter - vUV;
for (int i = 0; i < SAMPLES; i++) {
  float t = (float(i) + offset) / float(SAMPLES);   // 0 → 1
  sum += texture(uScene, vUV + toCenter * (uStrength * t));
}
finalColor = sum / float(SAMPLES);
```

Why does that make streaks pointing outward? Take an atom at 100 px from the center, with, for example, `STRENGTH = 0.35`:

- A pixel at 130 px from the center looks inward from 130 down to 130 × (1 − 0.35) ≈ 85 px. The atom (at 100) is on that line, so the pixel picks up some of its brightness.
- A pixel at 165 px looks from 165 down to ≈ 107 px: it just misses the atom. So the streak ends at about 100 / (1 − 0.35) ≈ 155 px.
- A pixel at 90 px (between the atom and the center) looks further inward, away from the atom: no streak on that side.

So the streak runs from the object outward, and its length grows with the object's distance from the center: the paddles streak a lot, the core almost not at all.

`toCenter` is in UV units, and both its x and y are multiplied by the same `t`, so every pixel moves straight toward the center on screen even though the screen isn't square.

### Jitter: fewer samples, no stepping

With, say, 8 samples spread along a 60 px streak, the samples are about 7 px apart, and a small, sharp object shows up as a row of separate copies instead of a smooth streak. Doubling the samples doubles the cost. Instead, each pixel starts its samples at a slightly different point (`offset`, between 0 and 1 sample step), so neighboring pixels see the object at different steps. The copies blend into a fine noise. The fewer the samples, the coarser that noise; at a low `MIX` it's invisible, so a few samples are enough. A stronger mix needs more samples.

The offset comes from `pixelNoise()`, an "interleaved gradient noise" formula: a fixed pseudo-random value for each pixel position. It doesn't change from frame to frame, so it doesn't sparkle. `JITTER = 0` turns it off, to see the difference.

### The sample count is built into the shader

GLSL needs a loop's bound to be a constant known when the shader is compiled. `ZoomBlurEffect.js` writes the `SAMPLES` setting as a constant (`#define SAMPLES 8`, for example) at the top of the shader's source before compiling it. That's also why `SAMPLES` can't change while the game runs.

### The mix

```glsl
vec3 zoomBlur(vec2 uv) {
  return mix(INPUT(uv), texture(uZoomBlurTexture, uv).rgb, uZoomBlurMix);
}
```

`mix(a, b, m)` is `a × (1 − m) + b × m`: exactly what drawing the blur on top of the image at opacity `m` (`MIX`) gives (Resolume's effect opacity works the same way). The blur texture is smaller than the screen; reading it at `uv` scales it up smoothly.

Its own pass blurs the **scene**, not its input: a pass that runs before the final pass can't see the effects that run inside it. As the first effect in the chain that makes no difference; an effect placed before it would not be blurred.

### The center follows the core

The streaks must come from the core, also during the last life zoom, when the camera moves it across the screen. Each frame the engine sets `zoomBlur.center` to the core's screen position (`playfield.position`); `prepare()` divides it by the screen size to get UV (`uCenter`). Left `null`, it's the screen's center.

## 6. CRT

`src/effects/crt/`. Its chunk, `crt.glsl`, defines `vec3 crt(vec2 uv)`, run once for every screen pixel in the final pass. It does six steps, in this order; the order matters, as explained after them. Its uniforms and helpers are prefixed (`uCrtCurvature`, `crtWarp()`…); the snippets below drop the prefixes to stay readable.

### Two kinds of coordinates

- `vUV`: 0–1 texture coordinates, as everywhere else.
- **Centered coordinates** `c = vUV × 2 − 1`: −1…1 on each axis, (0, 0) at the screen's center. The bending maths is simpler around the center.

On a 16:9 screen, one unit of `c` is wider horizontally than vertically. When a step needs a true distance (the same in every direction on screen), it multiplies x by the aspect ratio first (`uAspect`, width / height). `radius2()` does that, and divides by the corner's value, so it's **0 at the center and 1 at the corners**:

```glsl
float radius2(vec2 c) {
  vec2 q = c * vec2(uAspect, 1.0);
  return dot(q, q) / (uAspect * uAspect + 1.0);   // dot(q, q) is the squared length
}
```

### Step 1 — Curved glass

```glsl
vec2 warp(vec2 c) {
  return c * (1.0 + uCurvature * radius2(c));
}
```

A fragment shader can't move pixels: each pixel can only choose **where to read from**. So instead of "push the image outward", the question is "which image point does this pixel show?". The answer here: a point a little farther from the center than the pixel itself, `1 + CURVATURE × r²` times as far. At the center that's 1 (no change); at the corners `1 + CURVATURE` (8% farther with a `CURVATURE` of 0.08, for example).

What that looks like:

- Near the edges, each pixel shows content from farther out, so the image looks **squeezed toward the center more and more toward the edges**, which is how straight lines near the edges bow outward, like on a curved CRT.
- Near the edges, pixels look past the image's border (beyond ±1): there's nothing there, so those pixels are outside the glass (step 2). That's what makes the black border, wider at the corners, where the push is strongest.

**Why this formula:** `c` is multiplied by one number, the same for x and y, so every pixel looks **straight along the line from the center**. Directions from the center don't change, only distances. The core is at the screen's center, so a paddle placed at an angle stays at that angle, and circles centered on the core (the ring) stay circles. That's also why `radius2()` measures true distances: with the stretched `c`, the ring would bend into an oval. Many CRT shaders online bend x and y separately (`uv.x *= 1 + uv.y² × k`); that skews angles, so it isn't used here.

### Step 2 — Outside the glass

```glsl
float inside = glass(p);
if (inside <= 0.0) return vec3(0.0);
```

`glass()` tests the bent point `p` against a rectangle with rounded corners (`CORNER_RADIUS`). It uses a **signed distance function** (SDF), a standard shader trick: a formula giving the distance from a point to a shape's outline, negative inside and positive outside. `smoothstep(-softness, 0, outline)` then turns it into a value that goes from 1 well inside to 0 at the outline, over `EDGE_SOFTNESS`: a soft edge, with no jagged pixels. Pixels fully outside stop right there, which skips the texture reads for them.

### Step 3 — Chromatic aberration

```glsl
float spread = uAberration * radius2(p);
vec3 color = vec3(
  INPUT(toUV(p * (1.0 + spread))).r,
  INPUT(toUV(p)).g,
  INPUT(toUV(p * (1.0 - spread))).b
);
```

A cheap lens doesn't focus all colors at the same place. The image is read three times (through `INPUT`, so the zoom blur's mix runs at each of the three points): red slightly farther out, blue slightly closer in, green in place. White lines (and the blur's streaks) then get faint red and blue fringes, growing toward the edges. Like the curvature, the shift is along the line from the center.

### Step 4 — Scanlines

```glsl
float lines = toUV(p).y * uScanlineCount;   // +1 per scanline, down the screen
float wave = sin(3.14159265 * lines);
float profile = wave * wave;                  // 0 between two lines, 1 in the middle of one
color *= mix(1.0 - uScanlineIntensity, 1.0, profile);
```

- **A fixed count:** `SCANLINE_COUNT` lines per screen height, on every device, so the look is the same on a phone and on a 4K monitor.
- **On the bent image:** counted from `p`, so the lines curve with the glass.
- **A smooth profile:** `sin²` rises and falls gently. Hard on/off lines would be 1 pixel bright, 2 pixels dark and so on, and on screens where the pattern doesn't fit the pixel grid it would flicker and show bands (**moiré**).
- **Fading on small screens:** with fewer than about 2 device pixels per line, even the smooth profile can't be drawn and shimmers. `CrtEffect.scanlineFade()` computes the device pixels per line on each resize and fades the intensity out between 2.5 and 1.5 pixels per line. It's done in JavaScript, once per resize, rather than per pixel.
- `sin` is squared by hand: GLSL's `pow()` is undefined for negative numbers.

### Step 5 — Phosphor mask

```glsl
float stripe = floor(mod(gl_FragCoord.x, uMaskPitch) * 3.0 / uMaskPitch);  // 0, 1 or 2
vec3 phosphor = vec3(stripe == 0.0, stripe == 1.0, stripe == 2.0);       // red, green or blue
color *= mix(vec3(1.0), phosphor, uMaskIntensity);
```

A CRT's picture is made of tiny red, green and blue phosphor stripes (an "aperture grille"). Each device pixel column is given one of the three colors; the other two channels are dimmed by `MASK_INTENSITY`. `gl_FragCoord` is the pixel's position on the canvas in **device pixels**, not bent: the stripes belong to the screen, not to the image. `MASK_PITCH` is a whole number of device pixels, so the stripes line up with the real pixels (a fractional pitch would make moiré).

### Step 6 — Vignette and brightness

`color *= 1 − VIGNETTE × r²` darkens toward the corners, using the pixel's own distance (`r2`, before bending). Then `color *= BRIGHTNESS`: scanlines, the mask and the vignette all darken the image, and the gain brings the whites and colors back close to their real values. Finally the color is multiplied by `inside`, which fades the glass's edge.

### Why this order

- **Bend first:** every later read uses the bent point, so the image and the scanlines curve together.
- **Scanlines before the mask:** scanlines follow the image (bent); the mask follows the screen's pixels (not bent).
- **Darkening, then the gain:** the gain compensates for all the darkening at once.

### Input through the glass

The shader already answers, for every pixel, "which image point do I show?": `crtWarp()`. So the CRT's `toScene()` is the same formula, run in JavaScript (`curvature.js`), with no inverse to solve. Because the formula keeps angles, paddle placement wouldn't even need it; the capture tap and any future input that uses distances do.

`curvature.js` and the chunk's `crtWarp()` must stay identical: each one names the other in a comment.

## 7. Using it elsewhere

`src/effects/` doesn't know about the game. Anything drawn with a PixiJS v8 **WebGL** renderer can use it:

```js
import { Application, Container, Graphics } from 'pixi.js'
import PostProcessing from './effects/PostProcessing.js'
import ZoomBlurEffect from './effects/zoomBlur/ZoomBlurEffect.js'
import CrtEffect from './effects/crt/CrtEffect.js'

const app = new Application()
await app.init({ resizeTo: window, preference: 'webgl' })
document.body.appendChild(app.canvas)

// What to process: kept off the stage
const scene = new Container()
scene.addChild(new Graphics().circle(400, 300, 50).fill(0xffffff))

// The chain, in order. Any setting can be overridden per effect.
const zoomBlur = new ZoomBlurEffect(app.renderer, { MIX: 0.3 })
const post = new PostProcessing(app.renderer, [zoomBlur, new CrtEffect(app.renderer)])
app.stage.addChild(post.view)
app.renderer.on('resize', (width, height) => {
  post.resize(width, height)
  post.render(scene)
})
app.ticker.add(() => {
  zoomBlur.center = { x: 400, y: 300 }
  post.render(scene, { background: 0x000000 }) // runs before the stage render
})

// Pointer input: the scene point shown under the pointer
app.stage.eventMode = 'static'
app.stage.hitArea = app.screen
app.stage.on('pointerdown', (event) => {
  const point = scene.toLocal(post.toScene(event.global))
})

// On teardown, before app.destroy(): post.destroy() (destroys the effects too),
// scene.destroy({ children: true })
```

Things to know:

- **The scene's root is drawn as is.** Put any position or scale on a child, not on the container you pass to `render()` (the game uses an `arena` container holding the `playfield`).
- **The scene isn't on the stage**, so `app.destroy()` doesn't reach it: destroy it yourself. Pointer events still work on the stage (the game listens on the stage with a `hitArea`); converting a pointer position with `toLocal()` works on containers off the stage too.
- **WebGL only:** the shaders are GLSL. Ask for `preference: 'webgl'`.

## 8. Adding an effect

1. A folder `src/effects/<name>/` with:
   - `<name>Settings.js`: one frozen object; each value with its unit, what it does on screen and a range.
   - `<name>.glsl`: its chunk. It defines `vec3 <name>(vec2 uv)` and reads the previous image only through `INPUT(uv)`. Every uniform and helper function starts with the effect's name (`u<Name>…`, `<name>…()`).
   - `<Name>Effect.js`: `name`, `glsl`, `resources` (its uniform groups and textures, named after the effect too), `resize()`, `toScene()` (return the point unchanged unless the effect moves the image), `destroy()`, and `setScene()` / `prepare()` if it needs a pass of its own (build it with `FullscreenPass`).
2. Add it to the chain in `GameEngine.buildScene()`, in the right place (before the CRT, unless it's meant to sit on top of the screen).
3. Document it here, with its own section and tuning table.

## 9. Tuning

Each value lives only in its effect's settings file, with its unit and range in a comment; the tables below say what each one does, not its value. Change it and reload (the dev server reloads on save); it applies from the next level started. To tune the CRT, switch **OLD TV** on in Settings.

`src/effects/postProcessingSettings.js`:

| Setting | What you'll see | Notes |
| :--- | :--- | :--- |
| `MAX_RESOLUTION` | Sharpness of everything in the arena | Above 2 the difference is barely visible, but the GPU cost grows with its square. The engine caps the canvas resolution with it |

`src/effects/zoomBlur/zoomBlurSettings.js`:

| Setting | What you'll see | Notes |
| :--- | :--- | :--- |
| `MIX` | How visible the streaks are (opacity) | Also slightly dims the sharp image (`1 − MIX` of it remains). The Resolume reference was around 0.15; lower is subtler. Raising it shows the samples' noise sooner: raise `SAMPLES` with it |
| `STRENGTH` | Length of the streaks | An object at distance `d` from the core streaks out to about `d / (1 − STRENGTH)` (the Resolume reference measured around 0.38). Close to 1 the streaks reach the center |
| `TEXTURE_HEIGHT` | Softness of the streaks | Lower is blurrier and cheaper; below ~180 the streaks start to look blocky |
| `SAMPLES` | Smoothness of the streaks | Each extra sample costs a texture read per blur pixel. A few are enough with a low `MIX`; raise it (16–24, for example) if you see copies or grain along the streaks with a stronger `MIX` or `STRENGTH` |
| `JITTER` | Stepping vs. fine noise | 0 shows the separate sample copies |

`src/effects/crt/crtSettings.js`:

| Setting | What you'll see | Notes |
| :--- | :--- | :--- |
| `CURVATURE` | How much the glass bulges, and how wide the black border is | 0 is a flat screen. Touch input follows it automatically |
| `CORNER_RADIUS` | Rounding of the glass's corners | Share of the screen height |
| `EDGE_SOFTNESS` | Sharp or blurry glass edge | Share of the screen height. Too low looks jagged |
| `ABERRATION` | Red / blue fringes toward the edges | For example, 0.002 is about 2 px at the corners of a 1080p screen. Above ~0.006 white lines look doubled |
| `SCANLINE_COUNT` | Size of the scanlines | Fixed per screen height. Higher looks finer but fades out sooner on small screens |
| `SCANLINE_INTENSITY` | How dark the gaps between lines are | Darkens the whole image: raise `BRIGHTNESS` with it |
| `MASK_PITCH` | Width of the RGB stripes | Whole device pixels only |
| `MASK_INTENSITY` | How visible the RGB stripes are | Above ~0.3 colors visibly shift |
| `VIGNETTE` | Darkening toward the corners | |
| `BRIGHTNESS` | Overall brightness | Compensates scanlines, mask and vignette. Too high clips colors to white |

**On a black background most CRT layers don't show:** scanlines, the mask, the vignette and the glass's border darken what's there, and black can't get darker. They're visible on the lit shapes (the ring, atoms, paddles, streaks) and on the dark red one-life-left background, where the glass's shape shows clearly. To see every layer while tuning, temporarily set the engine's `BACKGROUND_COLORS.DEFAULT` to a grey such as `0x404040`.

## 10. Performance

GPU cost depends on **pixels × texture reads per pixel**; the CPU only sets a few uniforms and issues a handful of draws per frame.

Example figures, for a 1080p screen at resolution 2, a 360 px tall blur texture and 8 blur samples:

| Pass | Pixels | Reads per pixel | Rough GPU time, mid-range phone |
| :--- | :--- | :--- | :--- |
| Scene | Full resolution, MSAA | (the scene's own drawing) | ~0.3–1 ms, mostly the MSAA resolve |
| Zoom blur's own pass | 640 × 360 ≈ 230,000 | `SAMPLES` (8) | ~0.1–0.3 ms (it grows with `SAMPLES` and `TEXTURE_HEIGHT`) |
| Final pass, OLD TV off (blur mix) | Full resolution | 2 | ~0.3–0.8 ms |
| Final pass, OLD TV on (blur mix + CRT) | Full resolution (minus the black outside the glass) | 6 (the CRT's three reads, each with the blur's two) | ~1–2 ms |

That's why the blur runs at a fixed low resolution, the resolution is capped at 2×, and the effects share one final pass instead of each adding its own.

## 11. Pitfalls met along the way

- **Lost antialiasing:** drawing into a plain render texture loses the canvas' MSAA, and the 2 px ring turns jagged. The scene texture is created with `antialias: true`.
- **Upside-down passes:** WebGL's render textures and the canvas use opposite vertical directions. Using PixiJS's projection in the vertex shader keeps every pass the right way up.
- **Empty frame after a resize:** resizing a render texture empties it, and PixiJS draws the stage right after a resize, even while paused. The engine redraws the arena through the pipeline in its resize handler.
- **GLSL loops:** the loop bound must be a compile-time constant, hence the `#define SAMPLES` written into the source.
- **Built-in names:** GLSL has built-in functions such as `distance()`, `length()`, `mix()`; naming a variable `distance` fails to compile on some drivers.
- **`pow()` and negative numbers:** `pow(x, 2.0)` is undefined for negative `x` in GLSL (it may return garbage or 0). Square by hand: `x * x`.
- **Stretched distances:** centered coordinates are stretched by the screen's shape; without the aspect correction, the curvature would turn the ring into an oval.
