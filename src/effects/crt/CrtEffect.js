import { Container, Geometry, Mesh, RenderTexture, Shader, UniformGroup } from 'pixi.js'
import { CRT_SETTINGS } from './crtSettings.js'
import { warp } from './curvature.js'
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
 *   const point = crt.toScene(event.global)    // pointer input: the scene point shown there
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

    const settings = this.settings
    const crtUniforms = {
      uAspect: { value: width / height, type: 'f32' },
      uCurvature: { value: settings.CURVATURE, type: 'f32' },
      uCornerRadius: { value: settings.CORNER_RADIUS, type: 'f32' },
      uEdgeSoftness: { value: settings.EDGE_SOFTNESS, type: 'f32' },
      uAberration: { value: settings.ABERRATION, type: 'f32' },
      uScanlineCount: { value: settings.SCANLINE_COUNT, type: 'f32' },
      uScanlineIntensity: { value: settings.SCANLINE_INTENSITY, type: 'f32' },
      uMaskPitch: { value: settings.MASK_PITCH, type: 'f32' },
      uMaskIntensity: { value: settings.MASK_INTENSITY, type: 'f32' },
      uVignette: { value: settings.VIGNETTE, type: 'f32' },
      uBrightness: { value: settings.BRIGHTNESS, type: 'f32' }
    }
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
      crtUniforms.uBlurMix = { value: settings.BLUR_MIX, type: 'f32' }
      crtDefines += '#define BLUR\n'
    }
    this.crtUniforms = new UniformGroup(crtUniforms)
    crtResources.crtUniforms = this.crtUniforms

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
    const uniforms = this.crtUniforms.uniforms
    uniforms.uAspect = width / height
    uniforms.uScanlineIntensity = this.settings.SCANLINE_INTENSITY * this.scanlineFade(height)
    this.crtUniforms.update()
    if (this.blurPass) {
      this.blurTexture.source.resize(width, height, this.blurResolution(height))
      this.blurMesh.scale.set(width, height)
    }
  }

  // Scanlines thinner than about 2 device pixels shimmer as the image moves: from 2.5 down to 1.5
  // device pixels per line they fade out
  scanlineFade (height) {
    const pixelsPerLine = (height * this.renderer.resolution) / this.settings.SCANLINE_COUNT
    const t = Math.min(1, Math.max(0, pixelsPerLine - 1.5))
    return t * t * (3 - 2 * t) // smoothstep, as in GLSL
  }

  // The scene point shown at screen point `point` (screen pixels), through the curved glass. For
  // pointer input: what the player presses is what they see.
  toScene (point) {
    const { width, height } = this.renderer.screen
    return warp(point.x, point.y, width, height, this.settings.CURVATURE)
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
