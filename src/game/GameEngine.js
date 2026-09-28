import { Application, Container } from 'pixi.js'
import * as soundManager from '../audio/soundManager.js'
import { bouncePoints, capturePoints, containmentPoints, timeBonus } from './scoring.js'
import { lerpColor } from './color.js'
import ContainmentRing, { RING_RADIUS } from './entities/ContainmentRing.js'
import AtomEmitter, { CORE_RADIUS } from './entities/AtomEmitter.js'
import Atom, { ATOM_RADIUS, ATOM_STATE, CAPTURE_MIN_CHARGE } from './entities/Atom.js'
import Paddle, { PADDLE_THICKNESS } from './entities/Paddle.js'

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
// Taps this close to the core target the atom crossing it (generous for small touch screens)
const CAPTURE_TAP_RADIUS = 60

const START_DELAY = 3 // seconds before the timer, spawns and music start: the menu music fades out, the player gets ready
const MAX_ACTIVE_PADDLES = 2
const CORE_COLLAPSE_TIME = 3
const CORE_COLLAPSE_SPIN = 2 * Math.PI // radians per second at the end of the core collapse
const GAME_OVER_DELAY = 1 // lets the last escaping atom fade out before Game Over
const TEARDOWN_DELAY = 100 // ms: margin for the GPU to display the next screen before the WebGL context is lost

// The background turns dark red while the player has only one life left
const BACKGROUND_COLORS = {
  DEFAULT: 0x000000,
  ONE_LIFE_LEFT: 0x660000
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
  constructor (level, callbacks) {
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
    this.atomSpeed = CONTACT_DISTANCE * level.atomSpeed

    // Starts on its target color: no fade if the level begins with a single life
    this.backgroundColor = this.backgroundTarget()
    this.backgroundFrom = this.backgroundColor
    this.backgroundTo = this.backgroundColor
    this.backgroundTime = BACKGROUND_TRANSITION_TIME

    this.atoms = []
    this.atomPool = []
    this.activePaddles = []
    this.draggedPaddles = new Map() // pointerId → inactive paddle
    this.paddlePool = []
  }

  async mount (container) {
    // Ready to start the moment the start delay ends
    soundManager.preloadTrack(this.level.soundTrack)

    await this.app.init({
      resizeTo: container,
      background: this.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
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
    this.app.renderer.on('resize', this.layout)
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
    this.paddleLayer = new Container()
    this.atomLayer = new Container()
    this.playfield.addChild(this.ring.view, this.paddleLayer, this.emitter.view, this.atomLayer)
    this.app.stage.addChild(this.playfield)
  }

  // Centres the playfield and scales it with the screen; game state is unaffected
  layout = () => {
    const { width, height } = this.app.screen
    this.playfield.position.set(width / 2, height / 2)
    this.playfield.scale.set(Math.min(width, height) / REFERENCE_SIZE)
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
      this.app.ticker.start()
      soundManager.resumeTrack()
    }
  }

  onPointerDown = (event) => {
    if (this.state !== STATE.PLAYING || this.paused) return

    const { x, y } = this.playfield.toLocal(event.global)
    if (Math.hypot(x, y) <= CAPTURE_TAP_RADIUS && this.captureAtCore()) return

    // Press: an inactive paddle appears at the pointer's angle
    this.releaseDraggedPaddle(event.pointerId)
    const paddle = this.paddlePool.pop() ?? this.createPaddle()
    paddle.start(Math.atan2(y, x))
    this.draggedPaddles.set(event.pointerId, paddle)
  }

  onPointerMove = (event) => {
    const paddle = this.draggedPaddles.get(event.pointerId)
    if (!paddle || this.paused) return

    const { x, y } = this.playfield.toLocal(event.global)
    paddle.setAngle(Math.atan2(y, x))
  }

  onPointerUp = (event) => {
    const paddle = this.draggedPaddles.get(event.pointerId)
    if (!paddle) return

    // Release: the paddle is set and its lifetime starts; a third one removes the oldest
    this.draggedPaddles.delete(event.pointerId)
    paddle.activate()
    this.activePaddles.push(paddle)
    while (this.activePaddles.length > MAX_ACTIVE_PADDLES) {
      this.releasePaddle(this.activePaddles.shift())
    }
  }

  // Game loop

  update = (ticker) => {
    const dt = ticker.deltaMS / 1000
    this.updateBackground(dt)

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
  }

  // Start delay: the ring is shown, but the timer, spawns, music and input wait
  updateStarting (dt) {
    this.stateTime += dt
    if (this.stateTime < START_DELAY) return

    this.state = STATE.PLAYING
    soundManager.playTrack(this.level.soundTrack)
    this.updatePlaying(this.stateTime - START_DELAY)
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

    const step = this.atomSpeed * dt
    for (let i = this.atoms.length - 1; i >= 0; i--) {
      const atom = this.atoms[i]
      if (atom.state === ATOM_STATE.ESCAPING) {
        this.updateEscapingAtom(atom, dt, step)
        continue
      }
      atom.move(step)
      if (atom.movingOutward && Math.abs(atom.distance) >= CONTACT_DISTANCE) this.checkContact(atom)
      atom.render(dt)
    }

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
    if (this.activePaddles.some((paddle) => paddle.covers(angle, ATOM_ANGULAR_RADIUS))) {
      this.addScore(bouncePoints(this.level.number, atom.charge))
      atom.bounce(CONTACT_DISTANCE)
      soundManager.playSfx('bounce')
    } else if (Math.abs(atom.distance) >= ESCAPE_DISTANCE) {
      atom.escape()
      this.lives = Math.max(0, this.lives - 1)
      this.emit('onLivesChange', this.lives)
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

  // Destroys the charged atom crossing the core, if any; returns whether one was captured
  captureAtCore () {
    let target = null
    for (const atom of this.atoms) {
      const capturable = atom.state === ATOM_STATE.MOVING &&
        atom.charge >= CAPTURE_MIN_CHARGE &&
        Math.abs(atom.distance) <= CORE_CROSSING_DISTANCE
      if (capturable && (!target || Math.abs(atom.distance) < Math.abs(target.distance))) target = atom
    }
    if (!target) return false

    this.addScore(capturePoints(this.level.number, target.charge))
    this.releaseAtom(target)
    soundManager.playSfx('capture')
    return true
  }

  // Lives reached 0: freeze, let escaping atoms fade out, then Game Over
  lose () {
    this.state = STATE.LOST
    this.stateTime = 0
    this.clearPaddles()
  }

  updateLost (dt) {
    this.stateTime += dt
    this.updateEscapingAtoms(dt)
    if (this.stateTime >= GAME_OVER_DELAY) {
      this.state = STATE.ENDED
      this.emit('onGameOver', { score: this.score })
    }
  }

  // Timer reached 0: no spawns, paddles or input; the core pulls every atom inside the ring in
  startCoreCollapse () {
    this.state = STATE.COLLAPSING
    this.stateTime = 0
    this.clearPaddles()
    for (const atom of this.atoms) {
      if (atom.state === ATOM_STATE.MOVING) atom.startCollapse()
    }
    soundManager.playSfx('vortex_creation')
  }

  updateCollapsing (dt) {
    this.stateTime += dt
    const progress = Math.min(1, this.stateTime / CORE_COLLAPSE_TIME)
    const spin = CORE_COLLAPSE_SPIN * progress * dt

    this.updateEscapingAtoms(dt)
    for (const atom of this.atoms) {
      if (atom.state !== ATOM_STATE.COLLAPSING) continue
      atom.updateCollapse(progress, spin)
      atom.render(dt)
    }

    if (progress === 1) this.win()
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

  updateEscapingAtoms (dt) {
    const step = this.atomSpeed * dt
    for (let i = this.atoms.length - 1; i >= 0; i--) {
      if (this.atoms[i].state === ATOM_STATE.ESCAPING) this.updateEscapingAtom(this.atoms[i], dt, step)
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
    this.app.renderer.background.color = this.backgroundColor
  }

  addScore (points) {
    this.score += points
    this.emit('onScoreChange', this.score)
  }

  // Entity pools

  spawnAtom () {
    let atom = this.atomPool.pop()
    if (!atom) {
      atom = new Atom()
      this.atomLayer.addChild(atom.view)
    }
    atom.spawn(Math.random() * 2 * Math.PI)
    this.atoms.push(atom)
    soundManager.playSfx('launch')
  }

  releaseAtom (atom) {
    this.atoms.splice(this.atoms.indexOf(atom), 1)
    atom.hide()
    this.atomPool.push(atom)
  }

  createPaddle () {
    const paddle = new Paddle(this.level.paddleArc, this.level.paddleDuration)
    this.paddleLayer.addChild(paddle.view)
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
