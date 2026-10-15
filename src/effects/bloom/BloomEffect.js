import { RenderTexture, Texture, UniformGroup } from 'pixi.js'
import FullscreenPass from '../FullscreenPass.js'
import { BLOOM_SETTINGS } from './bloomSettings.js'
import blurFragment from './bloom.frag.glsl?raw'
import glsl from './bloom.glsl?raw'

/**
 * Bloom effect for PostProcessing (docs/post-processing.md, "Bloom"): a soft glow around bright
 * shapes. prepare() blurs the scene into a low-resolution texture, in two passes of its own
 * (horizontal, then vertical); its chunk in the final pass (bloom.glsl) adds it over the image.
 */
export default class BloomEffect {
  constructor (renderer, overrides = {}) {
    this.renderer = renderer
    this.settings = { ...BLOOM_SETTINGS, ...overrides }
    this.name = 'bloom'
    this.glsl = glsl
    const { width, height } = renderer.screen
    const resolution = this.blurResolution(height)

    // Horizontal pass: scene -> horizontalTexture. Vertical pass: horizontalTexture -> bloomTexture
    this.horizontalTexture = RenderTexture.create({ width, height, resolution })
    this.bloomTexture = RenderTexture.create({ width, height, resolution })

    this.horizontalUniforms = this.createUniforms()
    this.verticalUniforms = this.createUniforms()
    this.horizontalPass = this.createPass('bloom-horizontal', this.horizontalUniforms, Texture.EMPTY.source)
    this.verticalPass = this.createPass('bloom-vertical', this.verticalUniforms, this.horizontalTexture.source)

    // What its chunk in the final pass uses
    this.resources = {
      uBloomTexture: this.bloomTexture.source,
      bloomUniforms: new UniformGroup({ uBloomIntensity: { value: this.settings.INTENSITY, type: 'f32' } })
    }
  }

  createUniforms () {
    return new UniformGroup({
      uStep: { value: new Float32Array(2), type: 'vec2<f32>' },
      uCross: { value: new Float32Array(2), type: 'vec2<f32>' }
    })
  }

  createPass (name, uniforms, input) {
    return new FullscreenPass({
      name,
      fragment: blurFragment,
      resources: { uInput: input, blurUniforms: uniforms }
    })
  }

  // The blur textures are TEXTURE_HEIGHT pixels tall whatever the screen: same size as the screen
  // in PixiJS units, with fewer pixels
  blurResolution (height) {
    return this.settings.TEXTURE_HEIGHT / height
  }

  // The scene is set by PostProcessing
  setScene (texture) {
    this.horizontalPass.resources.uInput = texture.source
  }

  resize (width, height) {
    this.horizontalTexture.source.resize(width, height, this.blurResolution(height))
    this.bloomTexture.source.resize(width, height, this.blurResolution(height))
    this.horizontalPass.resize(width, height)
    this.verticalPass.resize(width, height)

    // One blur-texture pixel, in 0–1 coordinates
    const pixelX = 1 / (this.settings.TEXTURE_HEIGHT * (width / height))
    const pixelY = 1 / this.settings.TEXTURE_HEIGHT
    const radius = this.settings.RADIUS
    this.setDirection(this.horizontalUniforms, radius * pixelX, 0, 0, pixelY / 2)
    this.setDirection(this.verticalUniforms, 0, radius * pixelY, pixelX / 2, 0)
  }

  setDirection (group, stepX, stepY, crossX, crossY) {
    const { uStep, uCross } = group.uniforms
    uStep[0] = stepX
    uStep[1] = stepY
    uCross[0] = crossX
    uCross[1] = crossY
    group.update()
  }

  // Its own passes: the scene blurred horizontally, then that blurred vertically
  prepare () {
    const { renderer } = this
    renderer.render({ container: this.horizontalPass.view, target: this.horizontalTexture, clear: true })
    renderer.render({ container: this.verticalPass.view, target: this.bloomTexture, clear: true })
  }

  // Nothing moves: each point shows the image point under it
  toScene (point) {
    return point
  }

  destroy () {
    this.horizontalPass.destroy()
    this.verticalPass.destroy()
    this.horizontalTexture.destroy(true)
    this.bloomTexture.destroy(true)
  }
}
