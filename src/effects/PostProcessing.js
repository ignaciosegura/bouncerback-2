import { RenderTexture } from 'pixi.js'
import FullscreenPass from './FullscreenPass.js'
import { POST_PROCESSING_SETTINGS } from './postProcessingSettings.js'
import template from './postProcessing.frag.glsl?raw'

/**
 * Post-processing for anything drawn with a PixiJS v8 WebGL renderer: the scene is drawn into a
 * texture, then a chain of effects runs in one final pass. How it works, step by step, is in
 * docs/post-processing.md. Usage:
 *
 *   const zoomBlur = new ZoomBlurEffect(app.renderer)
 *   const post = new PostProcessing(app.renderer, [zoomBlur, new CrtEffect(app.renderer)])
 *   app.stage.addChild(post.view)               // the processed image; `scene` stays off the stage
 *   app.renderer.on('resize', (w, h) => { post.resize(w, h); post.render(scene) })
 *   app.ticker.add(() => post.render(scene))    // before PixiJS draws the stage
 *   const point = post.toScene(event.global)     // pointer input: the scene point shown there
 *   post.destroy()                               // before app.destroy(); destroys the effects too
 *
 * An effect is an object with:
 *   name               the name of its GLSL function, unique in the chain
 *   glsl               its GLSL chunk: defines vec3 <name>(vec2 uv), reading its input with INPUT(uv)
 *   resources          the textures and uniform groups its chunk uses (unique names in the chain)
 *   resize(w, h)
 *   setScene(texture)  optional: the scene texture, for its own passes
 *   prepare()          optional: its own passes, run before the final pass (e.g. the zoom blur's)
 *   toScene(point)     the input point shown at an output point (input mapping)
 *   destroy()
 */
export default class PostProcessing {
  constructor (renderer, effects, overrides = {}) {
    this.renderer = renderer
    this.effects = effects
    this.settings = { ...POST_PROCESSING_SETTINGS, ...overrides }
    const { width, height } = renderer.screen

    // Antialiased (MSAA), so the scene's thin lines stay smooth: rendering into a plain texture
    // would lose the canvas' antialiasing
    this.sceneTexture = RenderTexture.create({ width, height, resolution: renderer.resolution, antialias: true })
    for (const effect of effects) effect.setScene?.(this.sceneTexture)

    const resources = { uScene: this.sceneTexture.source }
    for (const effect of effects) {
      for (const [key, resource] of Object.entries(effect.resources)) {
        if (key in resources) throw new Error(`PostProcessing: resource "${key}" is used twice`)
        resources[key] = resource
      }
    }
    // The final pass draws the canvas: it's the only thing PostProcessing puts on the stage
    this.pass = new FullscreenPass({ name: 'post-processing', fragment: composeFragment(effects), resources })
    this.view = this.pass.view

    this.resize(width, height)
  }

  // Call when the screen size changes. The textures' contents are lost: render() again before
  // the next stage render.
  resize (width, height) {
    this.sceneTexture.source.resize(width, height, this.renderer.resolution)
    this.pass.resize(width, height)
    for (const effect of this.effects) effect.resize(width, height)
  }

  // Draws `scene` into the scene texture, cleared with `background`, then the effects' own passes.
  // The stage render that PixiJS does afterwards runs the final pass.
  render (scene, { background = 0x000000 } = {}) {
    this.renderer.render({ container: scene, target: this.sceneTexture, clear: true, clearColor: background })
    for (const effect of this.effects) effect.prepare?.()
  }

  // The scene point shown at screen point `point` (screen pixels), through every effect: the last
  // effect is the one on screen, so it maps first.
  toScene (point) {
    return this.effects.reduceRight((p, effect) => effect.toScene(p), { x: point.x, y: point.y })
  }

  destroy () {
    for (const effect of this.effects) effect.destroy()
    this.pass.destroy()
    this.sceneTexture.destroy(true)
  }
}

// The final pass's source: the template with the effects' GLSL chunks in chain order. Each chunk
// reads the previous function (`scene` for the first) as INPUT; LAST is the last function, which
// main() calls. With no effects, the pass copies the scene.
function composeFragment (effects) {
  const marker = '// EFFECTS'
  if (!template.includes(marker)) throw new Error('PostProcessing: the template has no EFFECTS marker')
  let input = 'scene'
  const chunks = effects.map((effect) => {
    const chunk = `// Effect: ${effect.name}\n#define INPUT ${input}\n${effect.glsl}\n#undef INPUT`
    input = effect.name
    return chunk
  })
  chunks.push(`#define LAST ${input}`)
  return template.replace(marker, chunks.join('\n\n'))
}
