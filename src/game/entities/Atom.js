import { Graphics } from 'pixi.js'
import { lerpColor } from '../color.js'

export const ATOM_RADIUS = 20
export const MAX_CHARGE = 10
export const CAPTURE_MIN_CHARGE = 3

export const ATOM_STATE = {
  MOVING: 'moving',
  ESCAPING: 'escaping',
  COLLAPSING: 'collapsing'
}

const ESCAPE_FADE_TIME = 0.5
const COLOR_TRANSITION_TIME = 0.5

export const ATOM_COLORS = {
  WHITE: 0xffffff,
  YELLOW: 0xffff00, // charge CAPTURE_MIN_CHARGE
  RED: 0xff0000 // charge MAX_CHARGE
}

// White until capturable; then yellow at CAPTURE_MIN_CHARGE, stepping toward red with each
// further charge until MAX_CHARGE
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
  }

  spawn (angle) {
    this.angle = angle
    this.distance = 0
    this.direction = 1
    this.charge = 1
    this.state = ATOM_STATE.MOVING
    this.escapeTime = 0
    this.view.alpha = 1
    this.view.scale.set(1)
    this.view.visible = true
    this.color = ATOM_COLORS.WHITE
    this.colorFrom = ATOM_COLORS.WHITE
    this.colorTo = ATOM_COLORS.WHITE
    this.colorTime = COLOR_TRANSITION_TIME
    this.view.tint = ATOM_COLORS.WHITE
    this.render()
  }

  hide () {
    this.view.visible = false
  }

  // Angle of the atom's current position around the core
  get positionAngle () {
    return this.distance >= 0 ? this.angle : this.angle + Math.PI
  }

  get movingOutward () {
    return this.distance * this.direction > 0
  }

  move (step) {
    this.distance += this.direction * step
  }

  // Exact reversal at `contact` distance: the atom heads straight back through the core
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

  // Keeps its speed and direction while fading out; returns false once it has vanished
  updateEscape (dt, step) {
    this.move(step)
    this.escapeTime += dt
    this.view.alpha = Math.max(0, 1 - this.escapeTime / ESCAPE_FADE_TIME)
    return this.escapeTime < ESCAPE_FADE_TIME
  }

  startCollapse () {
    this.state = ATOM_STATE.COLLAPSING
    this.collapseFrom = this.distance
  }

  // progress 0 → 1: pulled into the core with increasing speed, spiralling by `spin` and shrinking
  updateCollapse (progress, spin) {
    const pull = progress * progress
    this.distance = this.collapseFrom * (1 - pull)
    this.angle += spin
    this.view.scale.set(1 - pull)
  }

  // `dt` advances the charge color transition
  render (dt = 0) {
    if (this.colorTime < COLOR_TRANSITION_TIME) {
      this.colorTime = Math.min(COLOR_TRANSITION_TIME, this.colorTime + dt)
      this.color = lerpColor(this.colorFrom, this.colorTo, this.colorTime / COLOR_TRANSITION_TIME)
      this.view.tint = this.color
    }
    this.view.position.set(Math.cos(this.angle) * this.distance, Math.sin(this.angle) * this.distance)
  }
}
