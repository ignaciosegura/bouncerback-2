import { Graphics } from 'pixi.js'

export const ATOM_RADIUS = 20
export const MAX_CHARGE = 10
export const CAPTURE_MIN_CHARGE = 3

export const ATOM_STATE = {
  MOVING: 'moving',
  ESCAPING: 'escaping',
  SWALLOWED: 'swallowed'
}

const ESCAPE_FADE_TIME = 0.5

// Atoms only travel along a diameter of the ring: `angle` is that axis, `distance` the signed
// position along it (negative past the core) and `direction` the sign of the velocity.
export default class Atom {
  constructor () {
    this.view = new Graphics()
      .circle(0, 0, ATOM_RADIUS)
      .fill(0xffffff)
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

  startSwallow () {
    this.state = ATOM_STATE.SWALLOWED
    this.swallowFrom = this.distance
  }

  // progress 0 → 1: pulled into the core with increasing speed, spiralling by `spin` and shrinking
  updateSwallow (progress, spin) {
    const pull = progress * progress
    this.distance = this.swallowFrom * (1 - pull)
    this.angle += spin
    this.view.scale.set(1 - pull)
  }

  render () {
    this.view.position.set(Math.cos(this.angle) * this.distance, Math.sin(this.angle) * this.distance)
  }
}
