import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Screen from '../components/Screen.jsx'
import HUD from '../components/HUD.jsx'
import PauseOverlay from './PauseOverlay.jsx'
import GameplayTips from './GameplayTips.jsx'
import GameEngine from '../game/GameEngine.js'

export default function GameScreen ({ level, hiScore, settings, onScoreChange, onGameOver, onLevelWin, onExitToMenu, backRef }) {
  const canvasContainerRef = useRef(null)
  const engineRef = useRef(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(level.lives)
  const [timeTenths, setTimeTenths] = useState(level.timerTenths)
  // null while playing; { backgroundColor } while paused
  const [pause, setPause] = useState(null)
  // The level's tip stays up until READY; levels without one start straight away
  const [tipShown, setTipShown] = useState(level.tip !== null)
  const handleScoreChange = useEffectEvent((value) => onScoreChange(value))
  const handleGameOver = useEffectEvent((result) => onGameOver(result))
  const handleLevelWin = useEffectEvent((result) => onLevelWin(result))
  // The engine starts with the current OLD TV switch; later changes (from the Pause overlay) go
  // to setOldTv(), so they don't restart the level
  const getOldTv = useEffectEvent(() => settings.oldTv)

  // PixiJS owns the canvas and the game loop; React only receives the engine's low-frequency updates
  useEffect(() => {
    const engine = new GameEngine(level, {
      onScoreChange: (value) => { setScore(value); handleScoreChange(value) },
      onLivesChange: setLives,
      onTimeChange: setTimeTenths,
      onPauseChange: ({ paused, backgroundColor }) => setPause(paused ? { backgroundColor } : null),
      onGameOver: (result) => handleGameOver(result),
      onLevelWin: (result) => handleLevelWin(result)
    }, { oldTv: getOldTv(), waitForBegin: level.tip !== null })
    engineRef.current = engine
    engine.mount(canvasContainerRef.current)
    return () => engine.destroy()
  }, [level])

  // The mobile back button pauses, or resumes when paused (the engine ignores a pause outside play)
  useEffect(() => {
    backRef.current = () => {
      const engine = engineRef.current
      if (engine.paused) engine.resume()
      else engine.pause()
    }
    return () => { backRef.current = null }
  }, [backRef])

  useEffect(() => {
    engineRef.current.setOldTv(settings.oldTv)
  }, [settings.oldTv])

  const exitToMenu = () => {
    engineRef.current.leave()
    onExitToMenu()
  }

  return (
    <Screen variant="dark" className="game-screen">
      <div ref={canvasContainerRef} className="game-screen__canvas" />
      <HUD score={score} timeTenths={timeTenths} hiScore={Math.max(hiScore, score)} lives={lives} />
      {tipShown && (
        <GameplayTips
          lines={level.tip}
          onReady={() => { setTipShown(false); engineRef.current.begin() }}
        />
      )}
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
