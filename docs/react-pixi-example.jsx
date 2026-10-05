// @ts-check
// Example: a Pixi component for React
// src/components/PixiCanvas.jsx
import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'

/** @import { Ticker } from 'pixi.js' */

/**
 * @typedef {Object} PixiCanvasProps
 * @property {(app: Application) => void} [onGameReady] Called once the app is initialized and its canvas is on the page
 */

/** @param {PixiCanvasProps} props */
export default function PixiCanvas ({ onGameReady }) {
  const canvasContainerRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const appRef = useRef(/** @type {Application | null} */ (null))

  useEffect(() => {
    let isUnmounted = false

    const initPixi = async () => {
      // 1. Create the Pixi Application instance
      const app = new Application()

      // 2. Initialize it asynchronously (PixiJS v8 standard)
      await app.init({
        resizeTo: canvasContainerRef.current, // Auto-resizes to fit parent div container
        background: '#1a1a2e',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      // Unmounted while initializing (e.g. React StrictMode's double effect): the cleanup below
      // has already run and never saw this app, so it must be destroyed here
      if (isUnmounted || !canvasContainerRef.current) {
        app.destroy(true, { children: true, texture: true })
        return
      }

      // 3. Append the canvas to our React DOM container
      canvasContainerRef.current.appendChild(app.canvas)
      appRef.current = app

      // 4. Setup your game loop or main scene ticker here
      app.ticker.add(/** @param {Ticker} ticker */ (ticker) => {
        // Game loop logic updates go here or inside your modular scene classes
      })

      // Optional callback to pass the app instance back up to your screen controller
      if (onGameReady) {
        onGameReady(app)
      }
    }

    initPixi()

    // 5. Cleanup on unmount (critical for preventing mobile WebView memory leaks)
    // An app still initializing is destroyed by initPixi once init() resolves
    return () => {
      isUnmounted = true
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={canvasContainerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none' // Prevents default mobile browser panning/zooming gestures
      }}
    />
  )
}
