import { Graphics } from 'pixi.js'
import { lerpColor } from '../color.js'
import { easeInQuad } from '../easing.js'
import AtomPulse from './AtomPulse.js'

export const ATOM_RADIUS = 20
export const MAX_CHARGE = 10
export const CAPTURE_MIN_CHARGE = 3

export const ATOM_STATE = /** @type {const} */ ({
  MOVING: 'moving',
  ESCAPING: 'escaping',
  COLLAPSING: 'collapsing',
  CAPTURING: 'capturing'
})

/** @typedef {typeof ATOM_STATE[keyof typeof ATOM_STATE]} AtomState */

const ESCAPE_FADE_TIME = 0.5
const CAPTURE_TIME = 0.5
const COLOR_TRANSITION_TIME = 0.5

export const ATOM_COLORS = /** @type {const} */ ({
  WHITE: 0xffffff,
  YELLOW: 0xffff00, // charge CAPTURE_MIN_CHARGE
  RED: 0xff0000 // charge MAX_CHARGE
})

/**
 * White until capturable; then yellow at CAPTURE_MIN_CHARGE, stepping toward red with each
 * further charge until MAX_CHARGE
 * @param {number} charge
 * @returns {number}
 */
function chargeColor (charge) {
  if (charge < CAPTURE_MIN_CHARGE) return ATOM_COLORS.WHITE
  const t = (charge - CAPTURE_MIN_CHARGE) / (MAX_CHARGE - CAPTURE_MIN_CHARGE)
  return lerpColor(ATOM_COLORS.YELLOW, ATOM_COLORS.RED, t)
}

// Atoms only travel along a diameter of the ring: `angle` is that axis, `distance` the signed
// position along it (negative past the core) and `direction` the sign of the velocity.
export default class Atom {
  constructor () {
    this.view = new Graphics()
      .circle(0, 0, ATOM_RADIUS)
      .fill(ATOM_COLORS.WHITE)
    this.view.visible = false
    this.pulse = new AtomPulse()
  }

  /** @param {number} angle */
  spawn (angle) {
    this.angle = angle
    this.distance = 0
    this.direction = 1
    this.charge = 1
    /** @type {AtomState} */
    this.state = ATOM_STATE.MOVING
    this.escapeTime = 0
    this.view.alpha = 1
    this.view.scale.set(1)
    this.view.visible = true
    /** @type {number} */
    this.color = ATOM_COLORS.WHITE
    /** @type {number} */
    this.colorFrom = ATOM_COLORS.WHITE
    /** @type {number} */
    this.colorTo = ATOM_COLORS.WHITE
    this.colorTime = COLOR_TRANSITION_TIME
    this.view.tint = ATOM_COLORS.WHITE
    this.pulse.hide()
    this.pulseCount = 0 // pulses emitted during the current core crossing
    this.render()
  }

  hide () {
    this.view.visible = false
    this.pulse.hide()
  }

  /**
   * (Re)starts the capture window pulse, lasting `duration` seconds
   * @param {number} duration
   */
  startPulse (duration) {
    this.pulse.start(duration)
    this.pulse.update(0, this.view.x, this.view.y, this.color)
  }

  /**
   * Angle of the atom's current position around the core
   * @returns {number}
   */
  get positionAngle () {
    return this.distance >= 0 ? this.angle : this.angle + Math.PI
  }

  /** @returns {boolean} */
  get movingOutward () {
    return this.distance * this.direction > 0
  }

  /** @param {number} step */
  move (step) {
    this.distance += this.direction * step
  }

  /**
   * Exact reversal at `contact` distance: the atom heads straight back through the core
   * @param {number} contact
   */
  bounce (contact) {
    const overshoot = Math.abs(this.distance) - contact
    this.distance = Math.sign(this.distance) * (contact - overshoot)
    this.direction = -this.direction
    this.charge = Math.min(MAX_CHARGE, this.charge + 1)
    const target = chargeColor(this.charge)
    if (target !== this.colorTo) {
      this.colorFrom = this.color
      this.colorTo = target
      this.colorTime = 0
    }
  }

  escape () {
    this.state = ATOM_STATE.ESCAPING
    this.escapeTime = 0
  }

  /**
   * Keeps its speed and direction while fading out; returns false once it has vanished
   * @param {number} dt
   * @param {number} step
   * @returns {boolean}
   */
  updateEscape (dt, step) {
    this.move(step)
    this.escapeTime += dt
    this.view.alpha = Math.max(0, 1 - this.escapeTime / ESCAPE_FADE_TIME)
    return this.escapeTime < ESCAPE_FADE_TIME
  }

  // Captured: stops and is pulled into the center of the core, shrinking to 0
  startCapture () {
    this.state = ATOM_STATE.CAPTURING
    this.captureFrom = this.distance
    this.captureTime = 0
    this.pulse.hide()
  }

  /**
   * Renders the frame; returns false once it has reached the center
   * @param {number} dt
   * @returns {boolean}
   */
  updateCapture (dt) {
    this.captureTime += dt
    const p = easeInQuad(Math.min(1, this.captureTime / CAPTURE_TIME))
    this.distance = this.captureFrom * (1 - p)
    this.view.scale.set(1 - p)
    this.render(dt)
    return this.captureTime < CAPTURE_TIME
  }

  /**
   * Core collapse: the atom keeps its direction and slows to a stop over `settleTime`, starting
   * at `speed`, which covers half the distance it would at full speed
   * @param {number} speed
   * @param {number} settleTime
   */
  startCollapse (speed, settleTime) {
    this.state = ATOM_STATE.COLLAPSING
    this.collapseFrom = this.distance
    this.collapseDrift = this.direction * speed * settleTime / 2
  }

  /**
   * `settle` and `collapse` (already eased, 0 → 1): drifts to its resting point, then is pulled
   * into the core, shrinking with it
   * @param {number} settle
   * @param {number} collapse
   */
  updateCollapse (settle, collapse) {
    this.distance = (this.collapseFrom + this.collapseDrift * settle) * (1 - collapse)
    this.view.scale.set(1 - collapse)
  }

  /**
   * `dt` advances the charge color transition
   * @param {number} [dt]
   */
  render (dt = 0) {
    if (this.colorTime < COLOR_TRANSITION_TIME) {
      this.colorTime = Math.min(COLOR_TRANSITION_TIME, this.colorTime + dt)
      this.color = lerpColor(this.colorFrom, this.colorTo, this.colorTime / COLOR_TRANSITION_TIME)
      this.view.tint = this.color
    }
    const x = Math.cos(this.angle) * this.distance
    const y = Math.sin(this.angle) * this.distance
    this.view.position.set(x, y)
    this.pulse.update(dt, x, y, this.color)
  }
}
