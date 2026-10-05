import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Screen from '../components/Screen.jsx'
import HUD from '../components/HUD.jsx'
import GameEngine from '../game/GameEngine.js'

/** @import { GameCallbacks, LoadedLevel } from '../game/types.js' */

/**
 * @typedef {Object} GameScreenProps
 * @property {LoadedLevel} level
 * @property {number} hiScore
 * @property {GameCallbacks['onScoreChange']} onScoreChange
 * @property {GameCallbacks['onGameOver']} onGameOver
 * @property {GameCallbacks['onLevelWin']} onLevelWin
 */

/** @param {GameScreenProps} props */

export default function GameScreen ({ level, hiScore, onScoreChange, onGameOver, onLevelWin }) {
  const canvasContainerRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(level.lives)
  const [timeTenths, setTimeTenths] = useState(level.timerTenths)
  const handleScoreChange = useEffectEvent((value) => onScoreChange(value))
  const handleGameOver = useEffectEvent((result) => onGameOver(result))
  const handleLevelWin = useEffectEvent((result) => onLevelWin(result))

  // PixiJS owns the canvas and the game loop; React only receives the engine's low-frequency updates
  useEffect(() => {
    const engine = new GameEngine(level, {
      onScoreChange: (value) => { setScore(value); handleScoreChange(value) },
      onLivesChange: setLives,
      onTimeChange: setTimeTenths,
      onGameOver: (result) => handleGameOver(result),
      onLevelWin: (result) => handleLevelWin(result)
    })
    engine.mount(canvasContainerRef.current)
    return () => engine.destroy()
  }, [level])

  return (
    <Screen variant="dark" className="game-screen">
      <div ref={canvasContainerRef} className="game-screen__canvas" />
      <HUD score={score} timeTenths={timeTenths} hiScore={Math.max(hiScore, score)} lives={lives} />
    </Screen>
  )
}
