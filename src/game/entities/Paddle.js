import { Graphics } from 'pixi.js'
import { RING_RADIUS } from './ContainmentRing.js'
import PaddleFlash from './PaddleFlash.js'

export const PADDLE_THICKNESS = 20
const OUTLINE_WIDTH = 2
// Lifetime fade: full opacity until FADE_START of the lifetime, then linear down to FADE_MIN_ALPHA
const FADE_START = 0.5
const FADE_MIN_ALPHA = 0.2

// Signed smallest difference between two angles, in (-π, π]
function angleDifference (a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b))
}

// An arc on the ring centred on `angle`. Drawn as an outline while the player drags it (inactive),
// filled once set (active). Expires `duration` seconds after being set, fading out over the end
// of its lifetime. Owns the flash shown when it bounces an atom. `stick` is the controller stick
// that set it ('left' / 'right'), or null: each stick owns one paddle.
export default class Paddle {
  constructor (arc, duration) {
    this.arc = arc
    this.duration = duration
    this.view = new Graphics()
    this.view.visible = false
    this.flash = new PaddleFlash()
    this.stick = null
  }

  start (angle) {
    this.active = false
    this.stick = null
    this.age = 0
    this.setAngle(angle)
    this.draw()
    this.view.alpha = 1
    this.view.visible = true
  }

  setAngle (angle) {
    this.angle = angle
    this.view.rotation = angle
  }

  activate () {
    this.active = true
    this.view.alpha = 1
    this.draw()
  }

  hide () {
    this.view.visible = false
  }

  bounce () {
    this.flash.start(this.angle, this.arc)
  }

  // Returns false once the paddle has expired
  update (dt) {
    this.age += dt
    const fadeStart = this.duration * FADE_START
    const progress = Math.min(Math.max((this.age - fadeStart) / (this.duration - fadeStart), 0), 1)
    this.view.alpha = 1 - (1 - FADE_MIN_ALPHA) * progress
    return this.age < this.duration
  }

  // Whether the paddle blocks something at `angle` whose angular half-size is `tolerance`
  covers (angle, tolerance) {
    return Math.abs(angleDifference(angle, this.angle)) <= this.arc / 2 + tolerance
  }

  draw () {
    const half = this.arc / 2
    this.view.clear()
    if (this.active) {
      this.view
        .arc(0, 0, RING_RADIUS, -half, half)
        .stroke({ width: PADDLE_THICKNESS, color: 0xffffff, cap: 'butt' })
    } else {
      this.view
        .arc(0, 0, RING_RADIUS + PADDLE_THICKNESS / 2, -half, half)
        .arc(0, 0, RING_RADIUS - PADDLE_THICKNESS / 2, half, -half, true)
        .closePath()
        .stroke({ width: OUTLINE_WIDTH, color: 0xffffff })
    }
  }
}
