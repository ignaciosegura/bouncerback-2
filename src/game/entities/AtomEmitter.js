import { Graphics } from 'pixi.js'
import { spawnDelay } from '../levelLoader.js'
import { lerpColor } from '../color.js'

export const CORE_RADIUS = 25
const LINE_WIDTH = 2
const OUTLINE_COLOR = 0xffffff
const VORTEX_COLOR = 0x888888 // core fill and outline during the level-end core collapse

// The core: stays at the centre and schedules one spawn at a random moment inside each spawn interval
export default class AtomEmitter {
  constructor (spawnInterval) {
    this.spawnInterval = spawnInterval
    this.intervalStart = 0
    this.nextSpawn = spawnDelay(spawnInterval)
    this.view = new Graphics()
    // Hidden until the level start animation grows it
    this.draw(0)
  }

  // Returns how many atoms are due by game time `time` (seconds)
  update (time) {
    let due = 0
    while (time >= this.nextSpawn) {
      due++
      this.intervalStart += this.spawnInterval
      this.nextSpawn = this.intervalStart + spawnDelay(this.spawnInterval)
    }
    return due
  }

  // Redrawn (not scaled) so the outline keeps its width at every radius, up to ring size in the
  // core collapse. `fade` (0 → 1) fades the fill in and turns the outline from white to the same
  // grey; at 0 it's the normal core.
  draw (radius, fade = 0) {
    this.view.clear()
    this.view.visible = radius > 0
    if (!this.view.visible) return
    this.view
      .circle(0, 0, radius)
      .fill({ color: VORTEX_COLOR, alpha: fade })
      .stroke({ width: LINE_WIDTH, color: lerpColor(OUTLINE_COLOR, VORTEX_COLOR, fade) })
  }
}
