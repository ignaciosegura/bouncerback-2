import { Application, CanvasSource, Sprite, Texture } from 'pixi.js'
// The canvas player with expression support: the animation uses loopOut('cycle') on two layers
// (lottie_light_canvas has no expressions)
import lottie from 'lottie-web/build/player/esm/lottie_canvas.min.js'
import animationData from '../../assets/motion/intro_animation.json'
import { MENU_SETTINGS } from './menuSettings.js'

// The content ends at frame 7485; the file's empty tail is cut to 5 s (300 frames at 60 fps)
const LOOP_END_FRAME = 7785
const TEARDOWN_DELAY = 100 // ms: margin for the GPU to display the next screen before the WebGL context is lost

/**
 * The menu screens' PixiJS scene: the menu background animation, behind the menus' HTML layer.
 * Lottie draws the animation into an off-screen canvas with its own frame loop; that canvas is a
 * texture, uploaded to the GPU each time Lottie draws a new frame. Mounted by MenuBackground.jsx.
 */
export default class MenuScene {
  constructor () {
    this.app = new Application()
    this.mounted = false
    this.destroyed = false
    this.dirty = false // Lottie drew a frame that isn't uploaded yet

    // Created now rather than on mount, so play() can start it before PixiJS is ready. PixiJS sizes
    // the canvas on mount; Lottie is then given the same size in canvas pixels (dpr 1).
    this.canvas = document.createElement('canvas')
    this.animation = lottie.loadAnimation({
      renderer: 'canvas',
      loop: true,
      autoplay: false,
      animationData,
      rendererSettings: {
        context: this.canvas.getContext('2d'),
        clearCanvas: true,
        preserveAspectRatio: 'xMidYMid slice',
        dpr: 1
      }
    })
    this.animation.addEventListener('drawnFrame', this.onDrawnFrame)
  }

  async mount (container) {
    const resolution = Math.min(window.devicePixelRatio || 1, MENU_SETTINGS.MAX_RESOLUTION)
    await this.app.init({
      resizeTo: container,
      background: cssColor('--color-white-bg'),
      resolution,
      autoDensity: true,
      preference: 'webgl'
    })

    // Unmounted while initializing (e.g. React StrictMode's double effect)
    if (this.destroyed) {
      this.app.destroy(true, { children: true, texture: true })
      return
    }

    this.mounted = true
    container.appendChild(this.app.canvas)

    const { width, height } = this.app.screen
    this.source = new CanvasSource({ resource: this.canvas, width, height, resolution })
    // Dynamic: the sprite follows the texture's size when the canvas is resized (otherwise it
    // keeps drawing at the size it had when it was created)
    this.background = new Sprite(new Texture({ source: this.source, dynamic: true }))
    this.app.stage.addChild(this.background)
    this.onResize(width, height)

    this.app.renderer.on('resize', this.onResize)
    this.app.ticker.add(this.update)
  }

  // Starts the animation from the beginning, looping over its content and the empty tail
  play () {
    this.animation.playSegments([0, LOOP_END_FRAME], true)
  }

  destroy () {
    this.destroyed = true
    this.animation.destroy()
    if (!this.mounted) return
    this.mounted = false
    this.app.ticker.stop()
    // Losing the WebGL context while the canvas is still on screen flashes it white: wait until
    // the next screen has been painted (two frames), then until the GPU has put it on screen
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
      this.app.destroy(true, { children: true, texture: true })
    }, TEARDOWN_DELAY)))
  }

  onDrawnFrame = () => {
    this.dirty = true
  }

  // The off-screen canvas follows the screen (resizing it empties it), Lottie redraws the current
  // frame into it at the new size, and it's uploaded at once: PixiJS draws the stage right after
  // a resize
  onResize = (width, height) => {
    this.source.resize(width, height, this.app.renderer.resolution)
    this.animation.resize(this.source.pixelWidth, this.source.pixelHeight)
    this.background.setSize(width, height)
    this.source.update()
    this.dirty = false
  }

  update = () => {
    if (!this.dirty) return
    this.source.update()
    this.dirty = false
  }
}

// A color token from index.css (e.g. '--color-white-bg'), so the stylesheet stays its only source
function cssColor (name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
