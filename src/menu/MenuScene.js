import { Application, CanvasSource, Container, Sprite, Texture } from 'pixi.js'
// The canvas player with expression support: the animation uses loopOut('cycle') on two layers
// (lottie_light_canvas has no expressions)
import lottie from 'lottie-web/build/player/esm/lottie_canvas.min.js'
import animationData from '../../assets/motion/intro_animation.json'
import PostProcessing from '../effects/PostProcessing.js'
import CrtEffect from '../effects/crt/CrtEffect.js'
import { MENU_CRT_OVERRIDES, MENU_SETTINGS } from './menuSettings.js'
import MenuLogo from './MenuLogo.js'

// The content ends at frame 7485; the file's empty tail is cut to 5 s (300 frames at 60 fps)
const LOOP_END_FRAME = 7785
const TEARDOWN_DELAY = 100 // ms: margin for the GPU to display the next screen before the WebGL context is lost

/**
 * The menu screens' PixiJS scene, behind the menus' HTML layer: the menu background animation and
 * the Main Menu logo. Lottie draws the animation into an off-screen canvas with its own frame loop;
 * that canvas is a texture, uploaded to the GPU each time Lottie draws a new frame. With the
 * Settings "OLD TV" switch on, the scene is shown through the CRT effect of src/effects/, like the
 * game arena. Mounted by MenuBackground.jsx, which also passes the logo's state and box and the
 * OLD TV switch on (setLogo, setLogoRect, setOldTv).
 */
export default class MenuScene {
  constructor () {
    this.app = new Application()
    this.mounted = false
    this.destroyed = false
    this.dirty = false // Lottie drew a frame that isn't uploaded yet
    this.oldTv = false
    this.post = null

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

    // Also created now, so it takes its state and box before PixiJS is ready
    this.logo = new MenuLogo({
      base: cssColor('--color-black'),
      white: cssColor('--color-white'),
      tintYellow: cssColor('--color-tint-yellow'),
      tintRed: cssColor('--color-tint-red')
    })
  }

  async mount (container) {
    const resolution = Math.min(window.devicePixelRatio || 1, MENU_SETTINGS.MAX_RESOLUTION)
    await this.app.init({
      resizeTo: container,
      background: cssColor('--color-white-bg'),
      // The logo's edges
      antialias: true,
      resolution,
      autoDensity: true,
      preference: 'webgl'
    })

    // Unmounted while initializing (e.g. React StrictMode's double effect)
    if (this.destroyed) {
      this.logo.destroy({ children: true })
      this.app.destroy(true, { children: true, texture: true })
      return
    }

    this.mounted = true
    container.appendChild(this.app.canvas)
    this.backgroundColor = cssColor('--color-white-bg')

    const { width, height } = this.app.screen
    this.source = new CanvasSource({ resource: this.canvas, width, height, resolution })
    // Dynamic: the sprite follows the texture's size when the canvas is resized (otherwise it
    // keeps drawing at the size it had when it was created)
    this.background = new Sprite(new Texture({ source: this.source, dynamic: true }))
    // Everything the CRT effect processes. Its root is rendered as is: no position or scale on it.
    this.scene = new Container()
    this.scene.addChild(this.background, this.logo)
    this.buildPostProcessing()
    this.onResize(width, height)

    this.app.renderer.on('resize', this.onResize)
    this.app.ticker.add(this.update)
  }

  // Starts the animation from the beginning, looping over its content and the empty tail
  play () {
    this.animation.playSegments([0, LOOP_END_FRAME], true)
  }

  // The Settings "OLD TV" switch: the CRT effect on or off, changed at once (also before mounting)
  setOldTv (on) {
    if (on === this.oldTv) return
    this.oldTv = on
    if (this.mounted) this.buildPostProcessing()
  }

  // Puts the scene on the stage, through the CRT effect or straight. Called again when the OLD TV
  // switch changes, so it first takes down the previous effect.
  buildPostProcessing () {
    const { renderer, stage } = this.app
    this.post?.destroy()
    this.post = null
    stage.removeChildren()
    if (this.oldTv) {
      // Only the processed image goes on the stage; the scene is drawn into it by update()
      this.post = new PostProcessing(renderer, [new CrtEffect(renderer, MENU_CRT_OVERRIDES)])
      stage.addChild(this.post.view)
      this.renderScene()
    } else {
      stage.addChild(this.scene)
    }
  }

  // Draws the scene through the effect, which the stage then shows
  renderScene () {
    this.post?.render(this.scene, { background: this.backgroundColor })
  }

  // The logo's state in the screen transitions: 'hidden', 'in', 'shown' or 'out' (MenuLogo.js)
  setLogo (state) {
    this.logo.setState(state)
  }

  // The logo's box in the Main Menu's layout, in screen pixels
  setLogoRect (rect) {
    this.logo.setRect(rect)
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
      // Off the stage with the effect on, so app.destroy() wouldn't reach them
      this.post?.destroy()
      this.scene.destroy({ children: true })
      this.app.destroy(true, { children: true, texture: true })
    }, TEARDOWN_DELAY)))
  }

  onDrawnFrame = () => {
    this.dirty = true
  }

  // The off-screen canvas follows the screen (resizing it empties it), Lottie redraws the current
  // frame into it at the new size, and it's uploaded at once: PixiJS draws the stage right after
  // a resize. The effect's textures are reallocated empty, so the scene is drawn into them again.
  onResize = (width, height) => {
    this.source.resize(width, height, this.app.renderer.resolution)
    this.animation.resize(this.source.pixelWidth, this.source.pixelHeight)
    this.background.setSize(width, height)
    this.source.update()
    this.dirty = false
    this.post?.resize(width, height)
    this.renderScene()
  }

  // Before PixiJS draws the stage, every frame
  update = () => {
    this.logo.update()
    if (this.dirty) {
      this.source.update()
      this.dirty = false
    }
    this.renderScene()
  }
}

// A color token from index.css (e.g. '--color-white-bg', written #RRGGBB) as a 0xRRGGBB number,
// so the stylesheet stays the colors' only source
function cssColor (name) {
  return Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue(name).trim().slice(1), 16)
}
