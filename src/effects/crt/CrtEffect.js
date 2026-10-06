import { Container, Geometry, Mesh, RenderTexture, Shader, UniformGroup } from 'pixi.js'
import { CRT_SETTINGS } from './crtSettings.js'
import vertex from './fullscreen.vert.glsl?raw'
import zoomBlurFragment from './zoomBlur.frag.glsl?raw'
import crtFragment from './crt.frag.glsl?raw'

/**
 * CRT post-processing for anything drawn with a PixiJS v8 WebGL renderer. How it works, step by
 * step, is in docs/crt-effect.md. Usage:
 *
 *   const crt = new CrtEffect(app.renderer)   // or new CrtEffect(app.renderer, { BLUR_MIX: 0.3 })
 *   app.stage.addChild(crt.view)              // the processed image; `scene` stays off the stage
 *   app.renderer.on('resize', (w, h) => crt.resize(w, h))
 *   app.ticker.add(() => crt.render(scene))   // before PixiJS draws the stage
 *   crt.destroy()                             // before app.destroy()
 *
 * Every frame: `scene` is drawn into the scene texture, the zoom blur pass draws a blurred copy
 * of it into the low-resolution blur texture, then `view` (on the stage) draws the canvas from
 * both.
 */
export default class CrtEffect {
  constructor (renderer, overrides = {}) {
    this.renderer = renderer
    this.settings = { ...CRT_SETTINGS, ...overrides }
    const { width, height } = renderer.screen

    // One rectangle from (0, 0) to (1, 1), shared by both passes; each mesh is scaled to the
    // screen. aUV equals aPosition: texture coordinates are 0–1 across the screen.
    const corners = [0, 0, 1, 0, 1, 1, 0, 1]
    this.geometry = new Geometry({
      attributes: {
        aPosition: { buffer: new Float32Array(corners), format: 'float32x2' },
        aUV: { buffer: new Float32Array(corners), format: 'float32x2' }
      },
      indexBuffer: new Uint32Array([0, 1, 2, 0, 2, 3])
    })

    // Antialiased (MSAA), so the scene's thin lines stay smooth: rendering into a plain texture
    // would lose the canvas' antialiasing
    this.sceneTexture = RenderTexture.create({ width, height, resolution: renderer.resolution, antialias: true })

    const crtResources = { uScene: this.sceneTexture.source }
    let crtDefines = ''

    if (this.settings.BLUR_ENABLED) {
      this.blurTexture = RenderTexture.create({ width, height, resolution: this.blurResolution(height) })
      this.blurUniforms = new UniformGroup({
        uCenter: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
        uStrength: { value: this.settings.BLUR_STRENGTH, type: 'f32' },
        uJitter: { value: this.settings.BLUR_JITTER, type: 'f32' }
      })
      this.blurShader = Shader.from({
        gl: {
          name: 'crt-zoom-blur',
          vertex,
          fragment: `#define SAMPLES ${Math.max(1, Math.round(this.settings.BLUR_SAMPLES))}\n${zoomBlurFragment}`
        },
        resources: { uScene: this.sceneTexture.source, blurUniforms: this.blurUniforms }
      })
      this.blurMesh = new Mesh({ geometry: this.geometry, shader: this.blurShader })
      // Rendered on its own into the blur texture, never on the stage
      this.blurPass = new Container()
      this.blurPass.addChild(this.blurMesh)

      crtResources.uBlur = this.blurTexture.source
      crtResources.crtUniforms = new UniformGroup({
        uBlurMix: { value: this.settings.BLUR_MIX, type: 'f32' }
      })
      crtDefines += '#define BLUR\n'
    }

    this.crtShader = Shader.from({
      gl: { name: 'crt', vertex, fragment: crtDefines + crtFragment },
      resources: crtResources
    })
    this.view = new Mesh({ geometry: this.geometry, shader: this.crtShader })

    this.resize(width, height)
  }

  // The blur texture is BLUR_TEXTURE_HEIGHT pixels tall whatever the screen: same size as the
  // screen in PixiJS units, with fewer pixels
  blurResolution (height) {
    return this.settings.BLUR_TEXTURE_HEIGHT / height
  }

  // Call when the screen size changes. The textures' contents are lost: render() again before
  // the next stage render.
  resize (width, height) {
    this.sceneTexture.source.resize(width, height, this.renderer.resolution)
    this.view.scale.set(width, height)
    if (this.blurPass) {
      this.blurTexture.source.resize(width, height, this.blurResolution(height))
      this.blurMesh.scale.set(width, height)
    }
  }

  // Draws `scene` into the scene texture, cleared with `background`, then the blur. `center` is
  // where the blur streaks come from, in screen pixels (default: the screen's center).
  render (scene, { background = 0x000000, center } = {}) {
    const { renderer } = this
    renderer.render({ container: scene, target: this.sceneTexture, clear: true, clearColor: background })

    if (this.blurPass) {
      const { width, height } = renderer.screen
      const uCenter = this.blurUniforms.uniforms.uCenter
      uCenter[0] = center ? center.x / width : 0.5
      uCenter[1] = center ? center.y / height : 0.5
      this.blurUniforms.update()
      renderer.render({ container: this.blurPass, target: this.blurTexture, clear: true })
    }
  }

  destroy () {
    this.view.destroy()
    this.crtShader.destroy(true)
    if (this.blurPass) {
      this.blurPass.destroy({ children: true })
      this.blurShader.destroy(true)
      this.blurTexture.destroy(true)
    }
    this.geometry.destroy()
    this.sceneTexture.destroy(true)
  }
}
