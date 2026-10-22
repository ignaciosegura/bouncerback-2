import { BUTTONS } from './gamepad.js'

// The Konami Code on the d-pad, without the final B A (those buttons go back and activate in the
// menus): up up down down left right left right. No DOM, no React.
const SEQUENCE = [
  BUTTONS.UP, BUTTONS.UP, BUTTONS.DOWN, BUTTONS.DOWN,
  BUTTONS.LEFT, BUTTONS.RIGHT, BUTTONS.LEFT, BUTTONS.RIGHT
]

/**
 * Keeps the last d-pad presses and reports when they spell the code. Comparing the latest presses,
 * instead of counting steps, lets the code start over in the middle (up up up down down…).
 */
export class KonamiCode {
  constructor () {
    this.presses = []
  }

  // Records a d-pad press; true when it completes the code (then it starts over)
  press (button) {
    this.presses = [...this.presses, button].slice(-SEQUENCE.length)
    const complete = this.presses.length === SEQUENCE.length &&
      this.presses.every((pressed, index) => pressed === SEQUENCE[index])
    if (complete) this.reset()
    return complete
  }

  reset () {
    this.presses = []
  }
}
