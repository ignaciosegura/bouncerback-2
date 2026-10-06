import { RenderTexture, Texture, UniformGroup } from 'pixi.js'
import FullscreenPass from '../FullscreenPass.js'
import { ZOOM_BLUR_SETTINGS } from './zoomBlurSettings.js'
import blurFragment from './zoomBlur.frag.glsl?raw'
import glsl from './zoomBlurMix.glsl?raw'

/**
 * Zoom blur effect for PostProcessing (docs/post-processing.md, "Zoom blur"): streaks pointing
 * away from `center`, mixed over the image. prepare() blurs the scene into a low-resolution
 * texture, in its own pass; its chunk in the final pass (zoomBlurMix.glsl) mixes it in.
 */
export default class ZoomBlurEffect {
  constructor (renderer, overrides = {}) {
    this.renderer = renderer
    this.settings = { ...ZOOM_BLUR_SETTINGS, ...overrides }
    this.name = 'zoomBlur'
    this.glsl = glsl
    // Where the streaks come from, in screen pixels; null is the screen's center. Can change every
    // frame.
    this.center = null
    const { width, height } = renderer.screen

    this.blurTexture = RenderTexture.create({ width, height, resolution: this.blurResolution(height) })

    this.blurUniforms = new UniformGroup({
      uCenter: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
      uStrength: { value: this.settings.STRENGTH, type: 'f32' },
      uJitter: { value: this.settings.JITTER, type: 'f32' }
    })
    this.blurPass = new FullscreenPass({
      name: 'zoom-blur',
      fragment: `#define SAMPLES ${Math.max(1, Math.round(this.settings.SAMPLES))}\n${blurFragment}`,
      // The scene is set by PostProcessing (setScene)
      resources: { uScene: Texture.EMPTY.source, blurUniforms: this.blurUniforms }
    })

    // What its chunk in the final pass uses
    this.resources = {
      uZoomBlurTexture: this.blurTexture.source,
      zoomBlurUniforms: new UniformGroup({ uZoomBlurMix: { value: this.settings.MIX, type: 'f32' } })
    }
  }

  // The blur texture is TEXTURE_HEIGHT pixels tall whatever the screen: same size as the screen
  // in PixiJS units, with fewer pixels
  blurResolution (height) {
    return this.settings.TEXTURE_HEIGHT / height
  }

  setScene (texture) {
    this.blurPass.resources.uScene = texture.source
  }

  resize (width, height) {
    this.blurTexture.source.resize(width, height, this.blurResolution(height))
    this.blurPass.resize(width, height)
  }

  // Its own pass: the blurred copy, into the blur texture
  prepare () {
    const { renderer } = this
    const { width, height } = renderer.screen
    const uCenter = this.blurUniforms.uniforms.uCenter
    uCenter[0] = this.center ? this.center.x / width : 0.5
    uCenter[1] = this.center ? this.center.y / height : 0.5
    this.blurUniforms.update()
    renderer.render({ container: this.blurPass.view, target: this.blurTexture, clear: true })
  }

  // Nothing moves: each point shows the image point under it
  toScene (point) {
    return point
  }

  destroy () {
    this.blurPass.destroy()
    this.blurTexture.destroy(true)
  }
}
