// @ts-check
// src/screens/GameScreen.jsx
import { useState } from 'react'
import PixiCanvas from '../components/PixiCanvas.jsx'
import HUD from '../components/HUD.jsx'

/** @import { Application } from 'pixi.js' */
/** @import { GameResult } from '../game/types.js' */

/**
 * @typedef {Object} GameScreenProps
 * @property {number} hiScore
 * @property {(result: GameResult) => void} onGameOver
 */

/** @param {GameScreenProps} props */
export default function GameScreen ({ hiScore, onGameOver }) {
  // Low-frequency values only: the game reports them through callbacks, never per frame
  const [score, setScore] = useState(0)
  const [timeTenths, setTimeTenths] = useState(0)
  const [lives, setLives] = useState(3)

  /** @param {Application} pixiApp */
  const handleGameReady = (pixiApp) => {
    // You can now spawn your Pixi game elements, load textures,
    // or link game events to React state updates here.
    console.log('Pixi Engine Ready:', pixiApp)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* PixiJS renders the 60 FPS gameplay canvas underneath */}
      <PixiCanvas onGameReady={handleGameReady} />

      {/* React renders the UI overlay on top */}
      <HUD score={score} timeTenths={timeTenths} hiScore={hiScore} lives={lives} />
    </div>
  )
}
