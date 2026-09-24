import { Graphics } from 'pixi.js'
import { spawnDelay } from '../levelLoader.js'

export const CORE_RADIUS = 20
const LINE_WIDTH = 2

// The core: stays at the centre and schedules one spawn at a random moment inside each spawn interval
export default class AtomEmitter {
  constructor (spawnInterval) {
    this.spawnInterval = spawnInterval
    this.intervalStart = 0
    this.nextSpawn = spawnDelay(spawnInterval)
    this.view = new Graphics()
      .circle(0, 0, CORE_RADIUS)
      .stroke({ width: LINE_WIDTH, color: 0xffffff })
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
}
