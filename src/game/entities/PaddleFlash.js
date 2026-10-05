import { Graphics } from 'pixi.js'
import { easeOutQuad } from '../easing.js'
import { RING_RADIUS } from './ContainmentRing.js'
import { PADDLE_THICKNESS } from './Paddle.js'

// The echo is as thick as the paddle. It starts on top of the paddle and drifts outward by
// FLASH_DRIFT paddle thicknesses, like a slight recoil
const FLASH_DRIFT = 0.3
const FLASH_START_ALPHA = 0.35
const FLASH_DURATION = 0.2 // seconds

// A subtle arc echo of a paddle that has just bounced an atom, like a slight recoil. One per paddle: a new bounce
// restarts it. It has its own view, so it keeps playing after its paddle is hidden.
export default class PaddleFlash {
  constructor () {
    this.view = new Graphics()
    this.view.visible = false
    this.playing = false
  }

  /**
   * @param {number} angle
   * @param {number} arc
   */
  start (angle, arc) {
    this.arc = arc
    this.time = 0
    this.playing = true
    this.view.rotation = angle
    this.view.visible = true
    this.draw()
  }

  hide () {
    this.playing = false
    this.view.visible = false
  }

  /** @param {number} dt */
  update (dt) {
    if (!this.playing) return
    this.time += dt
    if (this.time >= FLASH_DURATION) {
      this.hide()
      return
    }
    this.draw()
  }

  draw () {
    const progress = this.time / FLASH_DURATION
    // Paddle.js imports this module, so its constants are only read here, never at load time
    const radius = RING_RADIUS + PADDLE_THICKNESS * (FLASH_DRIFT * easeOutQuad(progress))
    const half = this.arc / 2
    this.view.alpha = FLASH_START_ALPHA * (1 - progress)
    this.view
      .clear()
      .arc(0, 0, radius, -half, half)
      .stroke({ width: PADDLE_THICKNESS, color: 0xffffff, cap: 'butt' })
  }
}
