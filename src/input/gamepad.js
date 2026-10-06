// Game controller input (Gamepad API). The API has no input events: the state is read by polling
// once per frame. Shared by the menus (React domain) and the GameEngine (PixiJS domain), so it
// imports neither React nor PixiJS.
// Only controllers the browser reports with the `standard` mapping (Xbox-style layout) are used.

// Sticks count as pushed from 75% deflection and as released below 35%. Worn sticks often rest at
// 10–30%: they never engage, and a stick resting a bit off-center still counts as released. The
// gap between the two (hysteresis) stops a stick near one threshold from toggling on and off.
export const STICK_ENGAGE = 0.75
export const STICK_RELEASE = 0.35
// Triggers are analog: pressed from half travel
export const TRIGGER_THRESHOLD = 0.5

// Button indices in the standard mapping
export const BUTTONS = {
  A: 0,
  B: 1,
  LT: 6,
  RT: 7,
  MENU: 9, // Xbox Menu (≡), PlayStation Options
  L3: 10, // left stick pressed down
  R3: 11, // right stick pressed down
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15
}

const TRIGGERS = [BUTTONS.LT, BUTTONS.RT]

// Axes of each stick; y points down, as on screen
const STICK_AXES = {
  left: [0, 1],
  right: [2, 3]
}

// Connected controllers with the standard mapping. Empty where the API is missing or blocked
// (insecure contexts: it needs https:// or localhost)
function standardGamepads () {
  let pads
  try {
    pads = navigator.getGamepads?.() ?? []
  } catch {
    return []
  }
  return Array.from(pads).filter((pad) => pad?.connected && pad.mapping === 'standard')
}

function isButtonDown (button, index) {
  return TRIGGERS.includes(index) ? button.value >= TRIGGER_THRESHOLD : button.pressed
}

// A button pressed or a stick pushed past the engage threshold (drift doesn't count)
function hasInput (pad) {
  return pad.buttons.some(isButtonDown) ||
    Object.values(STICK_AXES).some(([x, y]) => Math.hypot(pad.axes[x] ?? 0, pad.axes[y] ?? 0) >= STICK_ENGAGE)
}

export function hasGamepad () {
  return standardGamepads().length > 0
}

// Calls onChange(hasGamepad()) when a controller connects or disconnects; returns an unsubscribe
// function. Browsers only expose a controller once a button has been pressed on the page.
export function watchGamepads (onChange) {
  const handleChange = () => onChange(hasGamepad())
  window.addEventListener('gamepadconnected', handleChange)
  window.addEventListener('gamepaddisconnected', handleChange)
  return () => {
    window.removeEventListener('gamepadconnected', handleChange)
    window.removeEventListener('gamepaddisconnected', handleChange)
  }
}

/**
 * Polled state of the active controller. Each consumer owns a reader, so their press detection
 * never interferes. With several controllers connected, the one used last is active.
 *
 * Presses are detected between polls: a button already held when reading starts (first poll,
 * after reset(), or when the active controller changes) never counts as a press.
 */
export class GamepadReader {
  constructor () {
    this.index = null // navigator index of the active controller
    this.buttons = []
    this.previousButtons = []
    this.sticks = {}
    this.recordOnly = true
    this.resetSticks()
  }

  poll () {
    const pad = this.pickActive(standardGamepads())
    if (!pad) {
      // No controller: everything is released, and the next one starts fresh
      this.index = null
      this.buttons = []
      this.previousButtons = []
      this.resetSticks()
      this.recordOnly = true
      return
    }

    if (pad.index !== this.index) {
      this.index = pad.index
      this.resetSticks()
      this.recordOnly = true
    }

    this.previousButtons = this.buttons
    this.buttons = pad.buttons.map(isButtonDown)
    for (const name of Object.keys(STICK_AXES)) this.updateStick(name, pad.axes)

    // Only record the state: nothing held from before counts as a press
    if (this.recordOnly) {
      this.recordOnly = false
      this.previousButtons = this.buttons
      for (const stick of Object.values(this.sticks)) stick.justEngaged = false
    }
  }

  // The next poll only records the state (e.g. after a pause)
  reset () {
    this.recordOnly = true
  }

  isDown (button) {
    return this.buttons[button] === true
  }

  // Down now, up on the previous poll
  wasPressed (button) {
    return this.isDown(button) && this.previousButtons[button] !== true
  }

  // Up now, down on the previous poll. Never reported on a record-only poll or with no controller.
  wasReleased (button) {
    return !this.isDown(button) && this.previousButtons[button] === true
  }

  // { engaged, justEngaged, angle } of 'left' or 'right'. The angle (radians, y down) only follows
  // the stick while it's past the engage threshold, so the spring-back to the center doesn't skew it.
  stick (name) {
    return { ...this.sticks[name] }
  }

  // Keeps the active controller until another one has input; falls back to any connected one
  pickActive (pads) {
    return pads.find((pad) => pad.index !== this.index && hasInput(pad)) ??
      pads.find((pad) => pad.index === this.index) ??
      pads[0] ??
      null
  }

  updateStick (name, axes) {
    const [xAxis, yAxis] = STICK_AXES[name]
    const x = axes[xAxis] ?? 0
    const y = axes[yAxis] ?? 0
    const magnitude = Math.hypot(x, y)
    const stick = this.sticks[name]
    const wasEngaged = stick.engaged
    stick.engaged = magnitude >= (wasEngaged ? STICK_RELEASE : STICK_ENGAGE)
    stick.justEngaged = stick.engaged && !wasEngaged
    if (magnitude >= STICK_ENGAGE) stick.angle = Math.atan2(y, x)
  }

  resetSticks () {
    for (const name of Object.keys(STICK_AXES)) {
      this.sticks[name] = { engaged: false, justEngaged: false, angle: 0 }
    }
  }
}
