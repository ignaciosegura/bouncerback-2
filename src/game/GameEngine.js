import { Application, Container } from 'pixi.js'
import * as soundManager from '../audio/soundManager.js'
import { bouncePoints, capturePoints, containmentPoints, timeBonus } from './scoring.js'
import { lerpColor } from './color.js'
import { easeInOutQuad, easeInQuad, easeOutQuad } from './easing.js'
import ContainmentRing, { RING_RADIUS } from './entities/ContainmentRing.js'
import AtomEmitter, { CORE_RADIUS } from './entities/AtomEmitter.js'
import Atom, { ATOM_RADIUS, ATOM_STATE, CAPTURE_MIN_CHARGE } from './entities/Atom.js'
import Paddle, { PADDLE_THICKNESS } from './entities/Paddle.js'
import { BUTTONS, GamepadReader } from '../input/gamepad.js'
import PostProcessing from '../effects/PostProcessing.js'
import { POST_PROCESSING_SETTINGS } from '../effects/postProcessingSettings.js'
import ZoomBlurEffect from '../effects/zoomBlur/ZoomBlurEffect.js'
import CrtEffect from '../effects/crt/CrtEffect.js'

// The playfield is laid out in mockup pixels for a 1080px-tall screen, then scaled to fit
const REFERENCE_SIZE = 1080

// Distance from the core at which an atom touches a paddle. Atoms cover it in exactly
// `atoms.travelTime` beats.
const CONTACT_DISTANCE = RING_RADIUS - PADDLE_THICKNESS / 2 - ATOM_RADIUS
// An atom escapes once its center crosses the ring. Until then a late paddle still bounces it.
const ESCAPE_DISTANCE = RING_RADIUS
// Angular half-size of an atom at the paddles: a paddle blocks any atom it overlaps
const ATOM_ANGULAR_RADIUS = ATOM_RADIUS / (RING_RADIUS - PADDLE_THICKNESS / 2)
// An atom can be captured while it overlaps the core
const CORE_CROSSING_DISTANCE = CORE_RADIUS + ATOM_RADIUS
// Pulses per core crossing: later beats would come as the atom leaves the core, when most of
// the pulse plays after it can no longer be captured
const MAX_PULSES_PER_CROSSING = 3
// Taps this close to the core target the atom crossing it (generous for small touch screens)
const CAPTURE_TAP_RADIUS = 60

const START_DELAY = 3 // seconds before the timer, spawns and music start: the menu music fades out, the player gets ready
// Level start animation, inside the start delay: the ring grows in, then the core
const RING_GROW_TIME = 0.25
const CORE_GROW_TIME = 0.5
const START_ANIMATION_TIME = RING_GROW_TIME + CORE_GROW_TIME // must stay ≤ START_DELAY
const MAX_ACTIVE_PADDLES = 2
// Controller: each stick drags and sets a paddle, like a finger; any of these buttons captures
const STICKS = ['left', 'right']
const CAPTURE_BUTTONS = [BUTTONS.A, BUTTONS.LT, BUTTONS.RT, BUTTONS.L3, BUTTONS.R3]
// Core collapse: the core grows to the ring while the atoms settle, then it collapses with them
const CORE_COLLAPSE_SETTLE_TIME = 1.85
const CORE_COLLAPSE_TIME = 2
// Last life zoom: the other atoms freeze at once; the last atom keeps escaping (without fading),
// then freezes too, and the view zooms on the point midway between it and where it crossed the ring
const LAST_ESCAPE_TIME = 0.5
const ZOOM_SCALE = 8
const ZOOM_TIME = 0.5
const ZOOM_HOLD = 1
const GAME_OVER_DELAY = LAST_ESCAPE_TIME + ZOOM_TIME + ZOOM_HOLD
const TEARDOWN_DELAY = 100 // ms: margin for the GPU to display the next screen before the WebGL context is lost
// The arena is shown through the post-processing of src/effects/: the zoom blur, then the CRT
// effect with the Settings "OLD TV" switch on. With it off (or no effect on), it's drawn straight
// to the canvas.
const POST_PROCESSING_ENABLED = true
const ZOOM_BLUR_ENABLED = true

// The background turns dark red while the player has only one life left
const BACKGROUND_COLORS = {
  DEFAULT: 0x000000,
  ONE_LIFE_LEFT: 0x550000 // dark enough for the red paddle replacement warning to stand out
}
const BACKGROUND_TRANSITION_TIME = 0.5

const STATE = {
  STARTING: 'starting',
  PLAYING: 'playing',
  COLLAPSING: 'collapsing',
  LOST: 'lost',
  ENDED: 'ended'
}

/**
 * Owns the PixiJS application and the game loop. Only low-frequency events reach React,
 * through the callbacks: onScoreChange(score), onLivesChange(lives), onTimeChange(tenths),
 * onGameOver({ score }) and onLevelWin({ score }).
 */
export default class GameEngine {
  // `oldTv`: the Settings "OLD TV" switch (the CRT layers)
  constructor (level, callbacks, { oldTv = false } = {}) {
    this.oldTv = oldTv
    this.postProcessing = POST_PROCESSING_ENABLED && (ZOOM_BLUR_ENABLED || oldTv)
    this.level = level
    this.callbacks = callbacks
    this.app = new Application()
    this.mounted = false
    this.destroyed = false
    this.paused = false

    this.state = STATE.STARTING
    this.time = 0
    this.stateTime = 0
    this.score = 0
    this.lives = level.lives
    this.timeTenths = level.timerTenths
    this.lastBeat = -1 // last beat of the music on which capturable atoms pulsed
    this.atomSpeed = CONTACT_DISTANCE * level.atomSpeed
    // Camera for the last life zoom. `offset` is the share of the focus point's normal offset from
    // the screen center still left (1: centered layout, 0: the focus is at the center)
    this.zoom = { scale: 1, focusX: 0, focusY: 0, offset: 1 }
    this.lastAtom = null // the atom that took the last life

    // Starts on its target color: no fade if the level begins with a single life
    this.backgroundColor = this.backgroundTarget()
    this.backgroundFrom = this.backgroundColor
    this.backgroundTo = this.backgroundColor
    this.backgroundTime = BACKGROUND_TRANSITION_TIME

    this.atoms = []
    this.atomPool = []
    this.activePaddles = []
    this.draggedPaddles = new Map() // input (pointerId, or a controller stick: 'left' / 'right') → inactive paddle
    this.paddlePool = []
    this.paddles = [] // every paddle instance, active or pooled, to update their flashes
    this.gamepad = new GamepadReader()
  }

  async mount (container) {
    // Ready to start the moment the start delay ends
    soundManager.preloadTrack(this.level.soundTrack)

    await this.app.init({
      resizeTo: container,
      // With post-processing, the canvas shows black only outside the CRT effect's glass; the
      // arena's own background goes to post.render()
      background: this.postProcessing ? 0x000000 : this.backgroundColor,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, POST_PROCESSING_SETTINGS.MAX_RESOLUTION),
      autoDensity: true,
      // The post-processing shaders are GLSL (WebGL only)
      preference: 'webgl'
    })

    // Unmounted while initializing (e.g. React StrictMode's double effect)
    if (this.destroyed) {
      this.app.destroy(true, { children: true, texture: true })
      return
    }

    this.mounted = true
    container.appendChild(this.app.canvas)
    this.buildScene()
    this.bindInput()
    this.layout()
    this.app.renderer.on('resize', this.onResize)
    this.app.ticker.add(this.update)

    this.emit('onScoreChange', this.score)
    this.emit('onLivesChange', this.lives)
    this.emit('onTimeChange', this.timeTenths)
  }

  destroy () {
    this.destroyed = true
    if (!this.mounted) return
    this.mounted = false
    window.removeEventListener('keydown', this.onKeyDown)
    this.app.ticker.stop()
    // Losing the WebGL context while the canvas is still on screen flashes it white: wait until
    // the next screen has been painted (two frames), then until the GPU has put it on screen
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
      // Off the stage with post-processing, so app.destroy() wouldn't reach them
      this.post?.destroy()
      this.arena.destroy({ children: true })
      this.app.destroy(true, { children: true, texture: true })
    }, TEARDOWN_DELAY)))
  }

  emit (name, ...args) {
    this.callbacks[name]?.(...args)
  }

  buildScene () {
    this.playfield = new Container()
    this.ring = new ContainmentRing()
    this.emitter = new AtomEmitter(this.level.spawnInterval)
    this.flashLayer = new Container()
    this.paddleLayer = new Container()
    this.pulseLayer = new Container() // over the core, behind every atom
    this.atomLayer = new Container()
    this.playfield.addChild(this.ring.view, this.flashLayer, this.paddleLayer, this.emitter.view, this.pulseLayer, this.atomLayer)
    // Everything the post-processing processes. Its root is rendered as is, so the playfield's
    // layout (position, scale) goes on a child.
    this.arena = new Container()
    this.arena.addChild(this.playfield)

    if (this.postProcessing) {
      const { renderer } = this.app
      const effects = []
      if (ZOOM_BLUR_ENABLED) {
        this.zoomBlur = new ZoomBlurEffect(renderer)
        effects.push(this.zoomBlur)
      }
      if (this.oldTv) effects.push(new CrtEffect(renderer))
      // Only the processed image goes on the stage; the arena is drawn into it by renderArena()
      this.post = new PostProcessing(renderer, effects)
      this.app.stage.addChild(this.post.view)
    } else {
      this.app.stage.addChild(this.arena)
    }
  }

  // Draws the arena through the post-processing, which the stage then shows. The blur's streaks
  // come from the core: the playfield's position on screen, also during the last life zoom.
  renderArena () {
    if (!this.post) return
    if (this.zoomBlur) this.zoomBlur.center = this.playfield.position
    this.post.render(this.arena, { background: this.backgroundColor })
  }

  // Centres the playfield and scales it with the screen, applying the last life zoom; game state
  // is unaffected
  layout = () => {
    const { width, height } = this.app.screen
    const { scale, focusX, focusY, offset } = this.zoom
    const base = Math.min(width, height) / REFERENCE_SIZE
    const s = base * scale
    this.playfield.position.set(
      width / 2 + focusX * (base * offset - s),
      height / 2 + focusY * (base * offset - s)
    )
    this.playfield.scale.set(s)
  }

  // PixiJS draws the stage right after a resize, also while paused: the post-processing textures are
  // reallocated empty, so the arena is drawn into them again first
  onResize = (width, height) => {
    this.layout()
    if (!this.post) return
    this.post.resize(width, height)
    this.renderArena()
  }

  // Input

  bindInput () {
    const { stage } = this.app
    stage.eventMode = 'static'
    stage.hitArea = this.app.screen
    stage.on('pointerdown', this.onPointerDown)
    stage.on('globalpointermove', this.onPointerMove)
    stage.on('pointerup', this.onPointerUp)
    stage.on('pointerupoutside', this.onPointerUp)
    window.addEventListener('keydown', this.onKeyDown)
  }

  onKeyDown = (event) => {
    if (event.code === 'KeyP' && !event.repeat) this.togglePause()
  }

  // Pause freezes the game loop (and with it the clock and the rendering) and the music
  togglePause () {
    if (this.state === STATE.ENDED) return

    this.paused = !this.paused
    if (this.paused) {
      this.app.ticker.stop()
      soundManager.pauseTrack()
    } else {
      // A controller button pressed during the pause doesn't fire on resume
      this.gamepad.reset()
      this.app.ticker.start()
      soundManager.resumeTrack()
    }
  }

  onPointerDown = (event) => {
    if (this.state !== STATE.PLAYING || this.paused) return

    const { x, y } = this.playfield.toLocal(this.scenePoint(event.global))
    if (Math.hypot(x, y) <= CAPTURE_TAP_RADIUS && this.captureAtCore()) return

    this.startPaddleDrag(event.pointerId, Math.atan2(y, x))
  }

  onPointerMove = (event) => {
    if (!this.draggedPaddles.has(event.pointerId) || this.paused) return

    const { x, y } = this.playfield.toLocal(this.scenePoint(event.global))
    this.dragPaddle(event.pointerId, Math.atan2(y, x))
  }

  // Where the pointer is in the arena: the point shown under it, through the effects (the CRT
  // effect's curved glass)
  scenePoint (global) {
    return this.post?.toScene(global) ?? global
  }

  onPointerUp = (event) => {
    this.setPaddle(event.pointerId)
  }

  // Controller: a stick pushed past its engage threshold drags a paddle, released it sets it
  // (the angle maps straight to the paddle: both have y pointing down). A capture button captures
  // like a tap at the core, but a press with nothing to capture does nothing.
  handleGamepad () {
    if (CAPTURE_BUTTONS.some((button) => this.gamepad.wasPressed(button))) this.captureAtCore()

    for (const stick of STICKS) {
      const { engaged, angle } = this.gamepad.stick(stick)
      if (engaged) {
        if (this.draggedPaddles.has(stick)) this.dragPaddle(stick, angle)
        else this.startPaddleDrag(stick, angle)
      } else {
        this.setPaddle(stick)
      }
    }
  }

  // Paddle input, shared by the pointer and the controller's sticks. `input` is the pointerId or
  // the stick's name.

  // Press: an inactive paddle appears at `angle`
  startPaddleDrag (input, angle) {
    this.releaseDraggedPaddle(input)
    const paddle = this.paddlePool.pop() ?? this.createPaddle()
    paddle.start(angle)
    this.draggedPaddles.set(input, paddle)
  }

  dragPaddle (input, angle) {
    this.draggedPaddles.get(input)?.setAngle(angle)
  }

  // Release: the paddle is set and its lifetime starts; a third one removes the oldest, whatever
  // input set it
  setPaddle (input) {
    const paddle = this.draggedPaddles.get(input)
    if (!paddle) return

    this.draggedPaddles.delete(input)
    paddle.activate()
    this.activePaddles.push(paddle)
    while (this.activePaddles.length > MAX_ACTIVE_PADDLES) {
      this.releasePaddle(this.activePaddles.shift())
    }
  }

  // Set paddles that the paddles being dragged will push out when released turn red: the oldest
  // ones beyond MAX_ACTIVE_PADDLES (activePaddles is ordered oldest first)
  updatePaddleWarnings () {
    const pushedOut = this.activePaddles.length + this.draggedPaddles.size - MAX_ACTIVE_PADDLES
    this.activePaddles.forEach((paddle, i) => paddle.setWarning(i < pushedOut))
  }

  // Game loop

  update = (ticker) => {
    const dt = ticker.deltaMS / 1000
    // Polled every frame, so a button held through the start delay doesn't count as a press later
    this.gamepad.poll()
    if (this.state === STATE.PLAYING) this.handleGamepad()
    this.updateBackground(dt)
    // Flashes outlive their paddles and finish during the core collapse
    for (const paddle of this.paddles) paddle.flash.update(dt)

    switch (this.state) {
    case STATE.STARTING:
      this.updateStarting(dt)
      break
    case STATE.PLAYING:
      this.updatePlaying(dt)
      break
    case STATE.COLLAPSING:
      this.updateCollapsing(dt)
      break
    case STATE.LOST:
      this.updateLost(dt)
      break
    default:
      break
    }

    this.renderArena()
  }

  // Start delay: the ring and core grow in, but the timer, spawns, music and input wait
  updateStarting (dt) {
    this.stateTime += dt
    // Progress is clamped, so the last call draws both at full size; no redraws after that
    if (this.stateTime - dt < START_ANIMATION_TIME) this.drawStartAnimation(this.stateTime)
    if (this.stateTime < START_DELAY) return

    this.state = STATE.PLAYING
    soundManager.playTrack(this.level.soundTrack)
    this.updatePlaying(this.stateTime - START_DELAY)
  }

  drawStartAnimation (t) {
    const ring = easeOutQuad(Math.min(1, t / RING_GROW_TIME))
    const core = easeOutQuad(Math.min(1, Math.max(0, (t - RING_GROW_TIME) / CORE_GROW_TIME)))
    this.ring.draw(RING_RADIUS * ring)
    this.emitter.draw(CORE_RADIUS * core)
  }

  updatePlaying (dt) {
    this.time += dt

    for (let due = this.emitter.update(this.time); due > 0; due--) this.spawnAtom()

    for (let i = this.activePaddles.length - 1; i >= 0; i--) {
      const paddle = this.activePaddles[i]
      if (!paddle.update(dt)) {
        this.activePaddles.splice(i, 1)
        this.releasePaddle(paddle)
      }
    }
    this.updatePaddleWarnings()

    const step = this.atomSpeed * dt
    for (let i = this.atoms.length - 1; i >= 0; i--) {
      const atom = this.atoms[i]
      if (atom.state === ATOM_STATE.ESCAPING) {
        this.updateEscapingAtom(atom, dt, step)
        continue
      }
      if (atom.state === ATOM_STATE.CAPTURING) {
        this.updateCapturingAtom(atom, dt)
        continue
      }
      atom.move(step)
      if (atom.movingOutward && Math.abs(atom.distance) >= CONTACT_DISTANCE) this.checkContact(atom)
      atom.render(dt)
    }

    this.pulseCapturableAtoms()

    if (this.lives === 0) {
      this.lose()
      return
    }

    const timeTenths = Math.max(0, this.level.timerTenths - Math.floor(this.time * 10))
    if (timeTenths !== this.timeTenths) {
      this.timeTenths = timeTenths
      this.emit('onTimeChange', timeTenths)
    }
    if (timeTenths === 0) this.startCoreCollapse()
  }

  // An atom between the paddles and the ring: bounced if a paddle covers it (mirrored around the
  // contact distance, so it stays on the beat even when the paddle is set late), escapes once its
  // center crosses the ring, otherwise keeps moving
  checkContact (atom) {
    const angle = atom.positionAngle
    const paddle = this.activePaddles.find((p) => p.covers(angle, ATOM_ANGULAR_RADIUS))
    if (paddle) {
      paddle.bounce()
      this.addScore(bouncePoints(this.level.number, atom.charge))
      atom.bounce(CONTACT_DISTANCE)
      soundManager.playSfx('bounce')
    } else if (Math.abs(atom.distance) >= ESCAPE_DISTANCE) {
      atom.escape()
      this.lives = Math.max(0, this.lives - 1)
      this.emit('onLivesChange', this.lives)
      if (this.lives === 0 && !this.lastAtom) this.lastAtom = atom
      this.fadeBackgroundTo(this.backgroundTarget())
      soundManager.playSfx('destroy')
    }
  }

  updateEscapingAtom (atom, dt, step) {
    if (atom.updateEscape(dt, step)) {
      atom.render(dt)
    } else {
      this.releaseAtom(atom)
    }
  }

  updateCapturingAtom (atom, dt) {
    if (!atom.updateCapture(dt)) this.releaseAtom(atom)
  }

  // A charged atom overlapping the core. Shared by the capture and its pulse, so the cue always
  // matches what a tap does
  isCapturable (atom) {
    return atom.state === ATOM_STATE.MOVING &&
      atom.charge >= CAPTURE_MIN_CHARGE &&
      Math.abs(atom.distance) <= CORE_CROSSING_DISTANCE
  }

  // On each beat of the music, every capturable atom emits one pulse lasting a beat, up to
  // MAX_PULSES_PER_CROSSING per crossing. An atom takes several beats to come back to the core,
  // so checking the count on the beat is enough to reset it between crossings
  pulseCapturableAtoms () {
    const beat = Math.floor(this.time / this.level.secondsPerBeat)
    if (beat === this.lastBeat) return
    this.lastBeat = beat
    for (const atom of this.atoms) {
      if (!this.isCapturable(atom)) {
        atom.pulseCount = 0
      } else if (atom.pulseCount < MAX_PULSES_PER_CROSSING) {
        atom.startPulse(this.level.secondsPerBeat)
        atom.pulseCount++
      }
    }
  }

  // Destroys the charged atom crossing the core, if any; returns whether one was captured
  captureAtCore () {
    let target = null
    for (const atom of this.atoms) {
      if (this.isCapturable(atom) && (!target || Math.abs(atom.distance) < Math.abs(target.distance))) target = atom
    }
    if (!target) return false

    this.addScore(capturePoints(this.level.number, target.charge))
    target.startCapture()
    soundManager.playSfx('capture')
    return true
  }

  // The zoom frames both the frozen atom and the exact point where its center crossed the ring
  focusLastAtom () {
    const atom = this.lastAtom
    const distance = (RING_RADIUS + Math.abs(atom.distance)) / 2
    this.zoom.focusX = Math.cos(atom.positionAngle) * distance
    this.zoom.focusY = Math.sin(atom.positionAngle) * distance
  }

  // Lives reached 0: every other atom freezes, the last one keeps escaping for a moment, then it
  // freezes too and the view zooms on it; then Game Over
  lose () {
    this.state = STATE.LOST
    this.stateTime = 0
    this.clearPaddles()
  }

  updateLost (dt) {
    const escapeLeft = Math.max(0, LAST_ESCAPE_TIME - this.stateTime)
    this.stateTime += dt
    if (escapeLeft > 0) {
      // Full speed and opacity, cut at exactly LAST_ESCAPE_TIME
      const escapeDt = Math.min(dt, escapeLeft)
      this.lastAtom.move(this.atomSpeed * escapeDt)
      this.lastAtom.render(escapeDt)
      if (this.stateTime >= LAST_ESCAPE_TIME) this.focusLastAtom()
      return
    }
    const e = easeOutQuad(Math.min(1, (this.stateTime - LAST_ESCAPE_TIME) / ZOOM_TIME))
    this.zoom.scale = ZOOM_SCALE ** e
    this.zoom.offset = 1 - e
    this.layout()
    if (this.stateTime >= GAME_OVER_DELAY) {
      this.state = STATE.ENDED
      this.emit('onGameOver', { score: this.score })
    }
  }

  // Timer reached 0: no spawns, paddles or input; the core takes every atom inside the ring
  startCoreCollapse () {
    this.state = STATE.COLLAPSING
    this.stateTime = 0
    this.clearPaddles()
    for (const atom of this.atoms) {
      atom.pulse.hide()
      if (atom.state === ATOM_STATE.MOVING) atom.startCollapse(this.atomSpeed, CORE_COLLAPSE_SETTLE_TIME)
    }
    soundManager.playSfx('vortex_creation')
  }

  // Settle: the core grows to the ring and turns grey while the atoms slow to a stop (no
  // collisions, nothing escapes). Collapse: the core shrinks to 0, taking the atoms with it.
  updateCollapsing (dt) {
    this.stateTime += dt
    const t = this.stateTime
    const settleProgress = Math.min(1, t / CORE_COLLAPSE_SETTLE_TIME)
    const grow = easeInOutQuad(settleProgress)
    const settle = easeOutQuad(settleProgress)
    const collapse = easeInQuad(Math.min(1, Math.max(0,
      (t - CORE_COLLAPSE_SETTLE_TIME) / (CORE_COLLAPSE_TIME - CORE_COLLAPSE_SETTLE_TIME))))

    const radius = t < CORE_COLLAPSE_SETTLE_TIME
      ? CORE_RADIUS + (RING_RADIUS - CORE_RADIUS) * grow
      : RING_RADIUS * (1 - collapse)
    this.emitter.draw(radius, grow)

    this.updateVanishingAtoms(dt)
    for (const atom of this.atoms) {
      if (atom.state !== ATOM_STATE.COLLAPSING) continue
      atom.updateCollapse(settle, collapse)
      atom.render(dt)
    }

    if (t >= CORE_COLLAPSE_TIME) this.win()
  }

  win () {
    let bonus = timeBonus(this.level.number, this.level.timerTenths)
    for (const atom of this.atoms.filter((a) => a.state === ATOM_STATE.COLLAPSING)) {
      bonus += containmentPoints(this.level.number, atom.charge, this.lives)
      this.releaseAtom(atom)
    }
    this.addScore(bonus)
    this.state = STATE.ENDED
    this.emit('onLevelWin', { score: this.score })
  }

  // Escaping and captured atoms finish their animations after play has stopped
  updateVanishingAtoms (dt) {
    const step = this.atomSpeed * dt
    for (let i = this.atoms.length - 1; i >= 0; i--) {
      const atom = this.atoms[i]
      if (atom.state === ATOM_STATE.ESCAPING) this.updateEscapingAtom(atom, dt, step)
      else if (atom.state === ATOM_STATE.CAPTURING) this.updateCapturingAtom(atom, dt)
    }
  }

  // Background

  // Stays dark red at 0 lives, through the Game Over delay
  backgroundTarget () {
    return this.lives <= 1 ? BACKGROUND_COLORS.ONE_LIFE_LEFT : BACKGROUND_COLORS.DEFAULT
  }

  fadeBackgroundTo (color) {
    if (color === this.backgroundTo) return
    this.backgroundFrom = this.backgroundColor
    this.backgroundTo = color
    this.backgroundTime = 0
  }

  updateBackground (dt) {
    if (this.backgroundTime >= BACKGROUND_TRANSITION_TIME) return
    this.backgroundTime = Math.min(BACKGROUND_TRANSITION_TIME, this.backgroundTime + dt)
    this.backgroundColor = lerpColor(this.backgroundFrom, this.backgroundTo, this.backgroundTime / BACKGROUND_TRANSITION_TIME)
    if (!this.post) this.app.renderer.background.color = this.backgroundColor
  }

  addScore (points) {
    this.score += points
    this.emit('onScoreChange', this.score)
  }

  // Entity pools

  spawnAtom () {
    const atom = this.atomPool.pop() ?? this.createAtom()
    // New atoms go behind all the others, so fresh atoms never hide charged ones. Pooled atoms
    // keep their old slot in the layer, so they are moved to the back too
    this.atomLayer.addChildAt(atom.view, 0)
    atom.spawn(Math.random() * 2 * Math.PI)
    this.atoms.push(atom)
    soundManager.playSfx('launch')
  }

  createAtom () {
    const atom = new Atom()
    this.pulseLayer.addChild(atom.pulse.view)
    return atom
  }

  releaseAtom (atom) {
    this.atoms.splice(this.atoms.indexOf(atom), 1)
    atom.hide()
    this.atomPool.push(atom)
  }

  createPaddle () {
    const paddle = new Paddle(this.level.paddleArc, this.level.paddleDuration)
    this.paddleLayer.addChild(paddle.view)
    this.flashLayer.addChild(paddle.flash.view)
    this.paddles.push(paddle)
    return paddle
  }

  releasePaddle (paddle) {
    paddle.hide()
    this.paddlePool.push(paddle)
  }

  releaseDraggedPaddle (pointerId) {
    const paddle = this.draggedPaddles.get(pointerId)
    if (!paddle) return
    this.draggedPaddles.delete(pointerId)
    this.releasePaddle(paddle)
  }

  clearPaddles () {
    for (const paddle of this.activePaddles) this.releasePaddle(paddle)
    for (const paddle of this.draggedPaddles.values()) this.releasePaddle(paddle)
    this.activePaddles = []
    this.draggedPaddles.clear()
  }
}
