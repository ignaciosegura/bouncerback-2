import { BUTTONS, GamepadReader, hasGamepad, watchGamepads } from './gamepad.js'

// Game controller navigation of the menu screens. DOM only: it marks the selected button with a
// class and activates it with click(), so the screens' own onClick handlers run unchanged. Like a
// mouse click, a button shows pressed while the control is held and activates on release.
// No React state.

const SELECTED_CLASS = 'gamepad-selected'
const PRESSED_CLASS = 'gamepad-pressed'
const ACTIVATE_BUTTONS = [BUTTONS.A, BUTTONS.RT]
// Every button of the current screen, except the ones opted out (the Intro's: controller input
// can't unlock audio)
const ITEMS_SELECTOR = '.screen button:not([data-gamepad="ignore"])'
const BACK_SELECTOR = '.screen [data-gamepad="back"]'
const TRANSITION_CLASSES = ['screen-transition--out', 'screen-transition--in']
// Moving prefers the items in line with the selected one: the offset across the direction counts double
const CROSS_AXIS_WEIGHT = 2

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
}

const DPAD = [
  [BUTTONS.UP, DIRECTIONS.UP],
  [BUTTONS.DOWN, DIRECTIONS.DOWN],
  [BUTTONS.LEFT, DIRECTIONS.LEFT],
  [BUTTONS.RIGHT, DIRECTIONS.RIGHT]
]

function center (element) {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

// The nearest item beyond `from` in `direction`; ties go to DOM order
function nearestItem (from, direction, items) {
  const origin = center(from)
  let best = null
  let bestScore = Infinity
  for (const item of items) {
    const target = center(item)
    const dx = target.x - origin.x
    const dy = target.y - origin.y
    const along = dx * direction.x + dy * direction.y
    if (along < 1) continue // same row / column, or behind
    const score = along + CROSS_AXIS_WEIGHT * Math.abs(dx * direction.y - dy * direction.x)
    if (score < bestScore) {
      best = item
      bestScore = score
    }
  }
  return best
}

/**
 * Starts controller navigation of the screens inside `root` (the screen transition wrapper).
 * Polls only while a controller is connected. Returns a function that stops it.
 */
export function startMenuNavigation (root) {
  const reader = new GamepadReader()
  let frame = null
  let selected = null
  let press = null // { element, button }: a button held down on a menu button
  // On from the first controller use; a mouse click or touch turns it off
  let controllerMode = false

  const select = (item) => {
    selected?.classList.remove(SELECTED_CLASS)
    selected = item
    selected?.classList.add(SELECTED_CLASS)
  }

  const startPress = (element, button) => {
    press = { element, button }
    element.classList.add(PRESSED_CLASS)
  }

  const cancelPress = () => {
    press?.element.classList.remove(PRESSED_CLASS)
    press = null
  }

  // The held button activates on release, like a mouse click. It's cancelled if the control stops
  // being down any other way (controller switched or disconnected) or the button left the screen
  const updatePress = () => {
    if (!press) return
    const { element, button } = press
    if (reader.wasReleased(button) && element.isConnected) {
      cancelPress()
      element.click()
    } else if (!reader.isDown(button) || !element.isConnected) {
      cancelPress()
    }
  }

  const leaveControllerMode = () => {
    controllerMode = false
    cancelPress()
    select(null)
  }

  // D-pad, or the left stick reduced to its dominant axis
  const readDirection = () => {
    for (const [button, direction] of DPAD) {
      if (reader.wasPressed(button)) return direction
    }
    const { justEngaged, angle } = reader.stick('left')
    if (!justEngaged) return null
    const x = Math.cos(angle)
    const y = Math.sin(angle)
    if (Math.abs(x) >= Math.abs(y)) return x > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT
    return y > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP
  }

  const update = () => {
    frame = requestAnimationFrame(update)
    reader.poll()

    // The screen changed: in controller mode the new screen arrives with its first item selected
    // (at the swap, so the selection fades in with its button)
    const items = Array.from(root.querySelectorAll(ITEMS_SELECTOR))
    if (selected && !selected.isConnected) selected = null
    if (controllerMode && !selected && items.length > 0) select(items[0])

    // Ignored during screen transitions, like taps and clicks
    if (TRANSITION_CLASSES.some((name) => root.classList.contains(name))) {
      cancelPress()
      return
    }

    updatePress()

    // Back presses the screen's BACK button. While a press is held, other presses are ignored
    if (reader.wasPressed(BUTTONS.B)) {
      controllerMode = true
      const back = root.querySelector(BACK_SELECTOR)
      if (back && !press) startPress(back, BUTTONS.B)
      return
    }

    const direction = readDirection()
    const activateButton = ACTIVATE_BUTTONS.find((button) => reader.wasPressed(button))
    if (!direction && activateButton === undefined) return

    controllerMode = true
    // The first press only shows the selection
    if (!selected) {
      select(items[0] ?? null)
    } else if (direction) {
      // Moving cancels a held press, like dragging the mouse off a button
      cancelPress()
      const next = nearestItem(selected, direction, items.filter((item) => item !== selected))
      if (next) select(next)
    } else if (!press) {
      startPress(selected, activateButton)
    }
  }

  const startLoop = () => {
    if (frame === null) frame = requestAnimationFrame(update)
  }

  const stopLoop = () => {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    leaveControllerMode()
  }

  // Browsers only expose a controller once one of its buttons has been pressed, so a new
  // connection is already controller use: the selection shows right away
  const stopWatching = watchGamepads((connected) => {
    if (!connected) {
      stopLoop()
      return
    }
    controllerMode = true
    startLoop()
  })
  if (hasGamepad()) startLoop()
  window.addEventListener('pointerdown', leaveControllerMode, true)

  return () => {
    stopWatching()
    stopLoop()
    window.removeEventListener('pointerdown', leaveControllerMode, true)
  }
}
