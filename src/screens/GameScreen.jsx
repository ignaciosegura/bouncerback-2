import { useEffect, useEffectEvent, useRef } from 'react'
import Screen from '../components/Screen.jsx'
import GameEngine from '../game/GameEngine.js'

export default function GameScreen ({ level, onGameOver, onLevelWin }) {
  const canvasContainerRef = useRef(null)
  const handleGameOver = useEffectEvent((result) => onGameOver(result))
  const handleLevelWin = useEffectEvent((result) => onLevelWin(result))

  // PixiJS owns the canvas; React only hears about the end of the level
  useEffect(() => {
    const engine = new GameEngine(level, {
      onGameOver: (result) => handleGameOver(result),
      onLevelWin: (result) => handleLevelWin(result)
    })
    engine.mount(canvasContainerRef.current)
    return () => engine.destroy()
  }, [level])

  return (
    <Screen variant="dark" className="game-screen">
      <div ref={canvasContainerRef} className="game-screen__canvas" />
    </Screen>
  )
}
