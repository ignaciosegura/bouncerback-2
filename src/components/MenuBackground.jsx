import { useEffect, useRef } from 'react'
import MenuScene from '../menu/MenuScene.js'
import { MENU_TRACK, isTrackPlaying, onTrackStart } from '../audio/soundManager.js'

// Animation behind the menu screens, drawn by PixiJS (src/menu/MenuScene.js). Mounted once in
// App.jsx, outside the screens, so it keeps playing while the player moves between them.
// It was made together with the menu track: it holds on frame 0 until the track actually starts playing.
export default function MenuBackground () {
  const containerRef = useRef(null)

  useEffect(() => {
    const scene = new MenuScene()
    scene.mount(containerRef.current)

    let stopWaiting = null
    const start = () => {
      stopWaiting?.()
      scene.play()
    }
    if (isTrackPlaying(MENU_TRACK)) start()
    else stopWaiting = onTrackStart(MENU_TRACK, start)

    return () => {
      stopWaiting?.()
      scene.destroy()
    }
  }, [])

  return <div ref={containerRef} className="menu-background" aria-hidden="true" />
}
