import { RenderTexture, Texture, UniformGroup } from 'pixi.js'
import FullscreenPass from '../FullscreenPass.js'
import { PHOSPHOR_SETTINGS } from './phosphorSettings.js'
import { fullBrightness } from '../color.js'
import historyFragment from './phosphor.frag.glsl?raw'
import glsl from './phosphor.glsl?raw'

// One 8-bit step of a texture channel: the unit of CUTOFF
const CHANNEL_STEP = 1 / 255
// The history is cleared to transparent before its pass: drawn over transparent, the pass writes
// its color and alpha (the freshness) exactly, with nothing blended in
const TRANSPARENT = [0, 0, 0, 0]

/**
 * Phosphor persistence effect for PostProcessing (docs/post-processing.md, "Phosphor
 * persistence"): bright things that move leave fading trails. prepare() writes the next history
 * (phosphor.frag.glsl) in its own pass; its chunk in the final pass (phosphor.glsl) shows the
 * previous one over the image. The two history textures take turns: each frame one is read and
 * the other written.
 *
 * Set `dt` (seconds since the last frame) before each render. Left at 0 (redraws while paused,
 * after a resize) the trails don't fade.
 */
export default class PhosphorEffect {
  constructor (renderer, overrides = {}) {
    this.renderer = renderer
    this.settings = { ...PHOSPHOR_SETTINGS, ...overrides }
    this.name = 'phosphor'
    this.glsl = glsl
    this.dt = 0
    this.finalResources = null // the final pass's resources, to show the history read this frame
    const { width, height } = renderer.screen
    const resolution = this.historyResolution(height)

    // WebGL creates textures zeroed: the history starts black, with no trails
    this.readTexture = RenderTexture.create({ width, height, resolution })
    this.writeTexture = RenderTexture.create({ width, height, resolution })

    this.passUniforms = new UniformGroup({
      uDecay: { value: 1, type: 'f32' },
      uCutoff: { value: 0, type: 'f32' }
    })
    this.historyPass = new FullscreenPass({
      name: 'phosphor-history',
      fragment: historyFragment,
      // The scene is set by PostProcessing (setScene); the history by prepare()
      resources: { uScene: Texture.EMPTY.source, uHistory: this.readTexture.source, passUniforms: this.passUniforms }
    })

    // What its chunk in the final pass uses
    this.uniforms = new UniformGroup({
      uPhosphorDecay: { value: 1, type: 'f32' },
      uPhosphorCutoff: { value: 0, type: 'f32' },
      uPhosphorMix: { value: this.settings.MIX, type: 'f32' },
      uPhosphorDriftColor: { value: fullBrightness(this.settings.DRIFT_COLOR), type: 'vec3<f32>' },
      uPhosphorDrift: { value: this.settings.DRIFT, type: 'f32' }
    })
    this.resources = { uPhosphorHistory: this.readTexture.source, phosphorUniforms: this.uniforms }
  }

  // The history textures are TEXTURE_HEIGHT pixels tall whatever the screen: same size as the
  // screen in PixiJS units, with fewer pixels
  historyResolution (height) {
    return this.settings.TEXTURE_HEIGHT / height
  }

  setScene (texture) {
    this.historyPass.resources.uScene = texture.source
  }

  // The history read changes every frame, so the effect sets it on the final pass itself
  setFinalPass (resources) {
    this.finalResources = resources
  }

  // Resizing empties both textures: the trails start over
  resize (width, height) {
    const resolution = this.historyResolution(height)
    this.readTexture.source.resize(width, height, resolution)
    this.writeTexture.source.resize(width, height, resolution)
    this.historyPass.resize(width, height)
  }

  // Its own pass: the next history, from this frame's scene and the faded history. The final pass
  // then shows the history read here, the previous frame's.
  prepare () {
    const { HALF_LIFE, CUTOFF } = this.settings
    const decay = 0.5 ** (this.dt / HALF_LIFE)
    const cutoff = this.dt > 0 ? CUTOFF * CHANNEL_STEP : 0
    setFade(this.passUniforms, 'uDecay', 'uCutoff', decay, cutoff)
    setFade(this.uniforms, 'uPhosphorDecay', 'uPhosphorCutoff', decay, cutoff)

    this.historyPass.resources.uHistory = this.readTexture.source
    if (this.finalResources) this.finalResources.uPhosphorHistory = this.readTexture.source
    this.renderer.render({ container: this.historyPass.view, target: this.writeTexture, clear: true, clearColor: TRANSPARENT })
    // The history written now is the one read next frame
    const written = this.writeTexture
    this.writeTexture = this.readTexture
    this.readTexture = written
  }

  // Nothing moves: each point shows the image point under it
  toScene (point) {
    return point
  }

  destroy () {
    this.historyPass.destroy()
    this.readTexture.destroy(true)
    this.writeTexture.destroy(true)
  }
}

// Sets a uniform group's decay and cutoff, named `decayName` and `cutoffName`
function setFade (group, decayName, cutoffName, decay, cutoff) {
  group.uniforms[decayName] = decay
  group.uniforms[cutoffName] = cutoff
  group.update()
}
