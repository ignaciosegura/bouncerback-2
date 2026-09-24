import { Graphics } from 'pixi.js'

// Playfield sizes are in mockup pixels (1080px-tall reference); the engine scales the playfield to the screen
export const RING_RADIUS = 335
const LINE_WIDTH = 2

export default class ContainmentRing {
  constructor () {
    this.view = new Graphics()
      .circle(0, 0, RING_RADIUS)
      .stroke({ width: LINE_WIDTH, color: 0xffffff })
  }
}
