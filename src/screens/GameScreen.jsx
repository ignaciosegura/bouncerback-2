import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Screen from '../components/Screen.jsx'
import HUD from '../components/HUD.jsx'
import PauseOverlay from './PauseOverlay.jsx'
import GameEngine from '../game/GameEngine.js'

export default function GameScreen ({ level, hiScore, settings, onScoreChange, onGameOver, onLevelWin, onExitToMenu }) {
  const canvasContainerRef = useRef(null)
  const engineRef = useRef(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(level.lives)
  const [timeTenths, setTimeTenths] = useState(level.timerTenths)
  // null while playing; { backgroundColor } while paused
  const [pause, setPause] = useState(null)
  const handleScoreChange = useEffectEvent((value) => onScoreChange(value))
  const handleGameOver = useEffectEvent((result) => onGameOver(result))
  const handleLevelWin = useEffectEvent((result) => onLevelWin(result))

  // PixiJS owns the canvas and the game loop; React only receives the engine's low-frequency updates
  useEffect(() => {
    const engine = new GameEngine(level, {
      onScoreChange: (value) => { setScore(value); handleScoreChange(value) },
      onLivesChange: setLives,
      onTimeChange: setTimeTenths,
      onPauseChange: ({ paused, backgroundColor }) => setPause(paused ? { backgroundColor } : null),
      onGameOver: (result) => handleGameOver(result),
      onLevelWin: (result) => handleLevelWin(result)
    })
    engineRef.current = engine
    engine.mount(canvasContainerRef.current)
    return () => engine.destroy()
  }, [level])

  const exitToMenu = () => {
    engineRef.current.leave()
    onExitToMenu()
  }

  return (
    <Screen variant="dark" className="game-screen">
      <div ref={canvasContainerRef} className="game-screen__canvas" />
      <HUD score={score} timeTenths={timeTenths} hiScore={Math.max(hiScore, score)} lives={lives} />
      {pause && (
        <PauseOverlay
          settings={settings}
          backgroundColor={pause.backgroundColor}
          onExitToMenu={exitToMenu}
          onResume={() => engineRef.current.resume()}
        />
      )}
    </Screen>
  )
}
