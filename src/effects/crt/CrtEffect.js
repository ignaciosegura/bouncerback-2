import { UniformGroup } from 'pixi.js'
import { CRT_SETTINGS } from './crtSettings.js'
import { warp } from './curvature.js'
import glsl from './crt.glsl?raw'

/**
 * CRT effect for PostProcessing (docs/post-processing.md, "CRT"): curved glass, chromatic
 * aberration, scanlines, phosphor mask and vignette, all in its chunk of the final pass
 * (crt.glsl). It bends the image, so toScene() bends pointer input the same way.
 */
export default class CrtEffect {
  constructor (renderer, overrides = {}) {
    this.renderer = renderer
    const settings = this.settings = { ...CRT_SETTINGS, ...overrides }
    this.name = 'crt'
    this.glsl = glsl
    const { width, height } = renderer.screen

    this.uniforms = new UniformGroup({
      uCrtAspect: { value: width / height, type: 'f32' },
      uCrtCurvature: { value: settings.CURVATURE, type: 'f32' },
      uCrtZoom: { value: settings.ZOOM, type: 'f32' },
      uCrtCornerRadius: { value: settings.CORNER_RADIUS, type: 'f32' },
      uCrtEdgeSoftness: { value: settings.EDGE_SOFTNESS, type: 'f32' },
      uCrtEdgeColor: { value: rgb(settings.EDGE_COLOR), type: 'vec3<f32>' },
      uCrtAberration: { value: settings.ABERRATION, type: 'f32' },
      uCrtScanlineCount: { value: settings.SCANLINE_COUNT, type: 'f32' },
      uCrtScanlineIntensity: { value: settings.SCANLINE_INTENSITY, type: 'f32' },
      uCrtMaskPitch: { value: settings.MASK_PITCH, type: 'f32' },
      uCrtMaskIntensity: { value: settings.MASK_INTENSITY, type: 'f32' },
      uCrtVignette: { value: settings.VIGNETTE, type: 'f32' },
      uCrtBrightness: { value: settings.BRIGHTNESS, type: 'f32' }
    })
    // What its chunk in the final pass uses
    this.resources = { crtUniforms: this.uniforms }
  }

  resize (width, height) {
    const uniforms = this.uniforms.uniforms
    uniforms.uCrtAspect = width / height
    uniforms.uCrtScanlineIntensity = this.settings.SCANLINE_INTENSITY * this.scanlineFade(height)
    this.uniforms.update()
  }

  // Scanlines thinner than about 2 device pixels shimmer as the image moves: from 2.5 down to 1.5
  // device pixels per line they fade out
  scanlineFade (height) {
    const pixelsPerLine = (height * this.renderer.resolution) / this.settings.SCANLINE_COUNT
    const t = Math.min(1, Math.max(0, pixelsPerLine - 1.5))
    return t * t * (3 - 2 * t) // smoothstep, as in GLSL
  }

  // The image point shown at screen point `point` (screen pixels), through the curved glass. For
  // pointer input: what the player presses is what they see.
  toScene (point) {
    const { width, height } = this.renderer.screen
    return warp(point.x, point.y, width, height, this.settings.CURVATURE, this.settings.ZOOM)
  }

  destroy () {}
}

// 0xRRGGBB as red, green and blue from 0 to 1, for a vec3 uniform
function rgb (color) {
  return new Float32Array([(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff].map((channel) => channel / 255))
}
