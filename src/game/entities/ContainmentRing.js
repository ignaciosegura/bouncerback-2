import { Graphics } from 'pixi.js'

// Playfield sizes are in mockup pixels (1080px-tall reference); the engine scales the playfield to the screen
export const RING_RADIUS = 335
const LINE_WIDTH = 2

export default class ContainmentRing {
  constructor () {
    this.view = new Graphics()
    // Hidden until the level start animation grows it
    this.draw(0)
  }

  /**
   * Redrawn (not scaled) so the outline keeps its width at every radius
   * @param {number} radius
   */
  draw (radius) {
    this.view.clear()
    this.view.visible = radius > 0
    if (!this.view.visible) return
    this.view
      .circle(0, 0, radius)
      .stroke({ width: LINE_WIDTH, color: 0xffffff })
  }
}
