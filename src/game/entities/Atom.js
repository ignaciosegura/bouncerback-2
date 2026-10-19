import { Graphics } from 'pixi.js'
import { lerpColor } from '../color.js'
import { easeInQuad, shakeOffset } from '../easing.js'
import { circlePoints } from '../geometry.js'
import AtomPulse from './AtomPulse.js'

export const ATOM_RADIUS = 20
export const MAX_CHARGE = 10
export const CAPTURE_MIN_CHARGE = 3
// The supercharged atom (supercharged atom mechanic): double the speed, double the maximum charge
export const SUPERCHARGED_SPEED_FACTOR = 2
export const SUPERCHARGED_CHARGE = 20

export const ATOM_STATE = {
  MOVING: 'moving',
  ESCAPING: 'escaping',
  COLLAPSING: 'collapsing',
  CAPTURING: 'capturing',
  HELD: 'held' // by the player (charged atom hold): stopped, shaking
}

const ESCAPE_FADE_TIME = 0.5
// Escape shake: the atom vibrates vertically, up then down like the menus' screen-shake, a few
// times in a row, while it keeps moving out. A held atom shakes the same way, without limit
const SHAKE_COUNT = 3
const SHAKE_CYCLE_TIME = 0.1
const SHAKE_DISTANCE = 2 // px at the 1080px reference
// Escape tint, as the screen-out's (index.css, --color-tint-yellow and --color-tint-red): the
// atom's color blends to transition dark yellow, then to transition dark red, one half of the
// fade each
const ESCAPE_TINT_YELLOW = 0x666600
const ESCAPE_TINT_RED = 0x660000
const CAPTURE_TIME = 0.5
const COLOR_TRANSITION_TIME = 0.5

export const ATOM_COLORS = {
  WHITE: 0xffffff,
  YELLOW: 0xffff00, // charge CAPTURE_MIN_CHARGE
  RED: 0xff0000, // charge MAX_CHARGE
  SUPERCHARGED: 0xbb00ff // the supercharged atom, whatever its charge
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
      .poly(circlePoints(ATOM_RADIUS))
      .fill(ATOM_COLORS.WHITE)
    this.view.visible = false
    this.pulse = new AtomPulse()
  }

  spawn (angle, supercharged = false) {
    this.supercharged = supercharged
    this.angle = angle
    this.distance = 0
    this.direction = 1
    this.charge = supercharged ? SUPERCHARGED_CHARGE : 1
    const startColor = supercharged ? ATOM_COLORS.SUPERCHARGED : ATOM_COLORS.WHITE
    this.state = ATOM_STATE.MOVING
    this.escapeTime = 0
    this.shakeTime = 0
    this.view.alpha = 1
    this.view.scale.set(1)
    this.view.visible = true
    this.color = startColor
    this.colorFrom = startColor
    this.colorTo = startColor
    this.colorTime = COLOR_TRANSITION_TIME
    this.view.tint = startColor
    this.pulse.hide()
    this.pulseCount = 0 // pulses emitted during the current core crossing
    this.render()
  }

  hide () {
    this.view.visible = false
    this.pulse.hide()
  }

  // (Re)starts the capture window pulse, lasting `duration` seconds
  startPulse (duration) {
    this.pulse.start(duration)
    this.pulse.update(0, this.view.x, this.view.y, this.color)
  }

  // Multiplies the level's atom speed
  get speedFactor () {
    return this.supercharged ? SUPERCHARGED_SPEED_FACTOR : 1
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

  // Exact reversal at `contact` distance: the atom heads straight back through the core. With
  // `charges` (the atom capture mechanic) it also gains a charge and starts its color change. A
  // supercharged atom never changes its charge or color
  bounce (contact, charges) {
    const overshoot = Math.abs(this.distance) - contact
    this.distance = Math.sign(this.distance) * (contact - overshoot)
    this.direction = -this.direction
    if (!charges || this.supercharged) return
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
    this.shakeTime = 0
  }

  // Keeps its speed and direction while fading out; returns false once it has vanished
  updateEscape (dt, step) {
    this.move(step)
    this.escapeTime += dt
    this.view.alpha = Math.max(0, 1 - this.escapeTime / ESCAPE_FADE_TIME)
    return this.escapeTime < ESCAPE_FADE_TIME
  }

  // Held (charged atom hold): stops where it is and shakes until it is captured
  startHold () {
    this.state = ATOM_STATE.HELD
    this.shakeTime = 0
    this.pulse.hide()
  }

  // Captured: stops and is pulled into the center of the core, shrinking to 0
  startCapture () {
    this.state = ATOM_STATE.CAPTURING
    this.captureFrom = this.distance
    this.captureTime = 0
    this.pulse.hide()
  }

  // Renders the frame; returns false once it has reached the center
  updateCapture (dt) {
    this.captureTime += dt
    const p = easeInQuad(Math.min(1, this.captureTime / CAPTURE_TIME))
    this.distance = this.captureFrom * (1 - p)
    this.view.scale.set(1 - p)
    this.render(dt)
    return this.captureTime < CAPTURE_TIME
  }

  // Core collapse: the atom keeps its direction and slows to a stop over `settleTime`, starting
  // at `speed`, which covers half the distance it would at full speed
  startCollapse (speed, settleTime) {
    this.state = ATOM_STATE.COLLAPSING
    this.collapseFrom = this.distance
    this.collapseDrift = this.direction * speed * settleTime / 2
  }

  // `settle` and `collapse` (already eased, 0 → 1): drifts to its resting point, then is pulled
  // into the core, shrinking with it
  updateCollapse (settle, collapse) {
    this.distance = (this.collapseFrom + this.collapseDrift * settle) * (1 - collapse)
    this.view.scale.set(1 - collapse)
  }

  escapeTint () {
    const t = Math.min(1, this.escapeTime / ESCAPE_FADE_TIME)
    return t < 0.5
      ? lerpColor(this.color, ESCAPE_TINT_YELLOW, t * 2)
      : lerpColor(ESCAPE_TINT_YELLOW, ESCAPE_TINT_RED, t * 2 - 1)
  }

  // Vertical offset of the escape shake (limited to SHAKE_COUNT vibrations) or of the hold
  // shake (without limit); `dt` advances it
  shakeY (dt) {
    if (this.state !== ATOM_STATE.ESCAPING && this.state !== ATOM_STATE.HELD) return 0
    this.shakeTime += dt
    const cycles = this.shakeTime / SHAKE_CYCLE_TIME
    if (this.state === ATOM_STATE.ESCAPING && cycles >= SHAKE_COUNT) return 0
    return shakeOffset(cycles % 1) * SHAKE_DISTANCE
  }

  // `dt` advances the charge color transition and the shake
  render (dt = 0) {
    if (this.colorTime < COLOR_TRANSITION_TIME) {
      this.colorTime = Math.min(COLOR_TRANSITION_TIME, this.colorTime + dt)
      this.color = lerpColor(this.colorFrom, this.colorTo, this.colorTime / COLOR_TRANSITION_TIME)
      this.view.tint = this.color
    }
    const x = Math.cos(this.angle) * this.distance
    const y = Math.sin(this.angle) * this.distance + this.shakeY(dt)
    if (this.state === ATOM_STATE.ESCAPING && this.escapeTime > 0) this.view.tint = this.escapeTint()
    this.view.position.set(x, y)
    this.pulse.update(dt, x, y, this.color)
  }
}
