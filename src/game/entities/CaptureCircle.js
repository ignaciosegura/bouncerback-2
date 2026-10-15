import { Graphics } from 'pixi.js'
import { easeOutQuad } from '../easing.js'
import { CORE_RADIUS } from './AtomEmitter.js'
import { RING_RADIUS } from './ContainmentRing.js'

const FADE_IN_TIME = 0.1 // seconds: opacity 0 → PEAK_ALPHA at radius 0
const DURATION = 0.5 // seconds, as long as the atom's pull-in: the radius grows and the opacity fades out
const PEAK_ALPHA = 0.25
const MAX_RADIUS = RING_RADIUS * 1.25

// Capture burst: a ring in the captured atom's color that grows from the center behind everything
// and fades out. One per capture, so several captures overlap and none interrupts another.
export default class CaptureCircle {
  constructor (color) {
    this.color = color
    this.time = 0
    this.view = new Graphics()
    this.view.alpha = 0
    this.draw(0)
  }

  // Returns false once it has finished and can be destroyed
  update (dt) {
    this.time += dt
    if (this.time >= DURATION) return false
    if (this.time < FADE_IN_TIME) {
      this.view.alpha = PEAK_ALPHA * (this.time / FADE_IN_TIME)
      return true
    }
    const progress = (this.time - FADE_IN_TIME) / (DURATION - FADE_IN_TIME)
    this.view.alpha = PEAK_ALPHA * (1 - progress)
    this.draw(MAX_RADIUS * easeOutQuad(progress))
    return true
  }

  // Redrawn (not scaled) so the stroke keeps the core's radius as its width at every radius
  draw (radius) {
    this.view
      .clear()
      .circle(0, 0, radius)
      .stroke({ width: CORE_RADIUS, color: this.color })
  }
}
