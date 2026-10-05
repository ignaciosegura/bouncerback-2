import { Graphics } from 'pixi.js'
import { easeOutQuad } from '../easing.js'
import { ATOM_RADIUS } from './Atom.js'

const PULSE_MAX_SCALE = 2
const PULSE_START_ALPHA = 0.5

// Capture window cue: a disc in the atom's color that grows and fades behind a charged atom
// crossing the core, once per beat. One per atom: a new beat restarts it. It has its own view
// because PixiJS v8 Graphics can't hold children.
export default class AtomPulse {
  constructor () {
    // Atom.js imports this module, so its constants are only read here, never at load time
    this.view = new Graphics()
      .circle(0, 0, ATOM_RADIUS)
      .fill(0xffffff)
    this.view.visible = false
    this.playing = false
  }

  /**
   * Restarts from time 0; update() places it on the atom
   * @param {number} duration
   */
  start (duration) {
    this.duration = duration
    this.time = 0
    this.playing = true
    this.view.visible = true
  }

  hide () {
    this.playing = false
    this.view.visible = false
  }

  /**
   * Follows the atom at (`x`, `y`) and keeps its `color`
   * @param {number} dt
   * @param {number} x
   * @param {number} y
   * @param {number} color
   */
  update (dt, x, y, color) {
    if (!this.playing) return
    this.time += dt
    if (this.time >= this.duration) {
      this.hide()
      return
    }
    const progress = this.time / this.duration
    this.view.position.set(x, y)
    this.view.scale.set(1 + (PULSE_MAX_SCALE - 1) * easeOutQuad(progress))
    this.view.alpha = PULSE_START_ALPHA * (1 - progress)
    this.view.tint = color
  }
}
