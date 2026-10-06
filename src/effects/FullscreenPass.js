import { Container, Geometry, Mesh, Shader } from 'pixi.js'
import vertex from './fullscreen.vert.glsl?raw'

/**
 * One full-screen pass: a rectangle covering the screen, drawn with a fragment shader that runs
 * once per pixel (docs/post-processing.md, "Full-screen quads"): the final pass, and any pass an
 * effect runs on its own (the zoom blur's).
 *
 * `view` is what gets drawn: into a texture with renderer.render({ container: view, target }), or
 * on the stage. The mesh's scale goes on a child, because a container passed to renderer.render()
 * is drawn as is.
 */
export default class FullscreenPass {
  constructor ({ name, fragment, resources }) {
    // One rectangle from (0, 0) to (1, 1), scaled to the screen by resize(). aUV equals aPosition:
    // texture coordinates are 0–1 across the screen.
    const corners = [0, 0, 1, 0, 1, 1, 0, 1]
    this.geometry = new Geometry({
      attributes: {
        aPosition: { buffer: new Float32Array(corners), format: 'float32x2' },
        aUV: { buffer: new Float32Array(corners), format: 'float32x2' }
      },
      indexBuffer: new Uint32Array([0, 1, 2, 0, 2, 3])
    })
    this.shader = Shader.from({ gl: { name, vertex, fragment }, resources })
    this.mesh = new Mesh({ geometry: this.geometry, shader: this.shader })
    this.view = new Container()
    this.view.addChild(this.mesh)
  }

  // Shader resources (textures, uniform groups) by name, e.g. pass.resources.uInput = texture.source
  get resources () {
    return this.shader.resources
  }

  resize (width, height) {
    this.mesh.scale.set(width, height)
  }

  destroy () {
    this.view.destroy({ children: true })
    this.shader.destroy(true)
    this.geometry.destroy()
  }
}
