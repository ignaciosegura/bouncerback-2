import { Container, Graphics, GraphicsPath } from 'pixi.js'
import { lerpColor } from '../game/color.js'
import { LOGO_PIECES, LOGO_VIEWBOX } from './logoPieces.js'

// Blink: a random piece turns white, then fades back to the logo's color. The wait must stay
// longer than the fade, so only one piece blinks at a time.
const BLINK_MIN_WAIT = 500 // ms
const BLINK_MAX_WAIT = 3500 // ms
const BLINK_FADE = 150 // ms

// The screen transitions, as the CSS plays them on the other elements of the screen (keyframes
// screen-out, screen-tint, screen-shake and screen-in in index.css): change them together. All
// linear, in ms from the start of the transition.
const OUT_DURATION = 1000 // screen-out: fades from 1 to 0
const OUT_TINT_START = 500 // screen-tint: from the logo's color to transition dark yellow…
const OUT_TINT_MIDDLE = 750 // …then to transition dark red
const OUT_TINT_END = 1000
const OUT_SHAKE_START = 875 // screen-shake: 0, up, down, 0
const OUT_SHAKE_DURATION = 125
const OUT_SHAKE_DISTANCE = 2 // px at the 1080px reference
const IN_DURATION = 500 // screen-in: fades from 0 to 1

// Width of the logo at the 1920x1080 reference (index.css, .main-menu__logo): the shake is in
// reference pixels, so it scales with the logo
const REFERENCE_WIDTH = 1518

/**
 * The Main Menu logo, drawn in the menu scene (docs/graphical-specs.md, "Game logo"): one shape
 * per piece, so each piece can blink on its own. Placed over the invisible box that holds its
 * place in the Main Menu's layout (setRect), and shown, hidden and faded with the Main Menu's
 * screen transitions (setState). update() runs every frame.
 */
export default class MenuLogo extends Container {
  // `colors`: { base, white, tintYellow, tintRed } as 0xRRGGBB numbers
  constructor (colors) {
    super()
    this.colors = colors
    this.visible = false
    this.rect = null
    this.state = 'hidden'
    this.stateStart = 0

    // White, so tint sets the color
    this.pieces = LOGO_PIECES.map((d) => this.addChild(pieceGraphics(d)))
    this.blinkPiece = -1
    this.blinkStart = 0
    this.nextBlink = 0
  }

  // The box measured in the DOM, in screen pixels
  setRect (rect) {
    this.rect = rect
    this.scale.set(rect.width / LOGO_VIEWBOX.width)
    this.x = rect.x
  }

  // 'hidden', 'in' (screen-in), 'shown' or 'out' (screen-out). Timed from the call: the CSS
  // transitions start in the same frame or the one before.
  setState (state, now = performance.now()) {
    if (state === this.state) return
    if (this.state === 'hidden') this.scheduleBlink(now)
    this.state = state
    this.stateStart = now
  }

  update (now = performance.now()) {
    this.visible = this.state !== 'hidden' && this.rect !== null
    if (!this.visible) return

    const elapsed = now - this.stateStart
    let alpha = 1
    let color = this.colors.base
    let shake = 0
    if (this.state === 'in') {
      alpha = clamp(elapsed / IN_DURATION)
    } else if (this.state === 'out') {
      alpha = 1 - clamp(elapsed / OUT_DURATION)
      color = this.outColor(elapsed)
      shake = shakeOffset(clamp((elapsed - OUT_SHAKE_START) / OUT_SHAKE_DURATION))
    }
    this.alpha = alpha
    this.y = this.rect.y + shake * OUT_SHAKE_DISTANCE * (this.rect.width / REFERENCE_WIDTH)

    this.updateBlink(now)
    const blink = this.blinkPiece === -1 ? 1 : clamp((now - this.blinkStart) / BLINK_FADE)
    this.pieces.forEach((piece, i) => {
      piece.tint = i === this.blinkPiece ? lerpColor(this.colors.white, color, blink) : color
    })
  }

  outColor (elapsed) {
    const { base, tintYellow, tintRed } = this.colors
    if (elapsed < OUT_TINT_MIDDLE) {
      return lerpColor(base, tintYellow, clamp((elapsed - OUT_TINT_START) / (OUT_TINT_MIDDLE - OUT_TINT_START)))
    }
    return lerpColor(tintYellow, tintRed, clamp((elapsed - OUT_TINT_MIDDLE) / (OUT_TINT_END - OUT_TINT_MIDDLE)))
  }

  // A random piece, never the same one twice in a row
  updateBlink (now) {
    if (now < this.nextBlink) return
    const previous = this.blinkPiece
    const choices = previous === -1 ? this.pieces.length : this.pieces.length - 1
    let next = Math.floor(Math.random() * choices)
    if (previous !== -1 && next >= previous) next++
    this.blinkPiece = next
    this.blinkStart = now
    this.scheduleBlink(now)
  }

  scheduleBlink (now) {
    this.nextBlink = now + BLINK_MIN_WAIT + Math.random() * (BLINK_MAX_WAIT - BLINK_MIN_WAIT)
  }
}

// One piece from its path data, with its holes. Each subpath starts with an absolute M; one inside
// an odd number of others is a hole (the counters, the inside of the O's ring), else it's filled
// (the O's dot sits inside its ring's hole). Done here rather than with Graphics.svg(), whose hole
// detection measures relative path commands wrongly and fills or drops the wrong subpaths.
function pieceGraphics (d) {
  const subpaths = d.split(/(?=M)/).map((subpath) => new GraphicsPath(subpath))
  const bounds = subpaths.map((path) => path.bounds)
  const depths = bounds.map((inner) => bounds.filter((outer) => outer !== inner && contains(outer, inner)).length)
  // Outermost first, so every hole is cut from the shape it's in, before what's inside it is filled
  const order = subpaths.map((_, i) => i).sort((a, b) => depths[a] - depths[b])
  const graphics = new Graphics()
  for (const i of order) {
    graphics.beginPath().path(subpaths[i])
    if (depths[i] % 2 === 1) graphics.cut()
    else graphics.fill(0xffffff)
  }
  return graphics
}

function contains (outer, inner) {
  return inner.minX >= outer.minX && inner.maxX <= outer.maxX && inner.minY >= outer.minY && inner.maxY <= outer.maxY
}

function clamp (t) {
  return Math.min(1, Math.max(0, t))
}

// screen-shake's keyframes (0 → up at 25% → down at 75% → 0), as −1…1, for t from 0 to 1
function shakeOffset (t) {
  if (t <= 0 || t >= 1) return 0
  if (t < 0.25) return -t / 0.25
  if (t < 0.75) return -1 + (t - 0.25) / 0.25
  return 1 - (t - 0.75) / 0.25
}
