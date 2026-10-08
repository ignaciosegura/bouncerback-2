import { useEffect, useRef } from 'react'
import MenuScene from '../menu/MenuScene.js'
import { MENU_TRACK, isTrackPlaying, onTrackStart } from '../audio/soundManager.js'

// The menu scene behind the menu screens (src/menu/MenuScene.js): the background animation and the
// Main Menu logo, drawn by PixiJS. Mounted once in App.jsx, outside the screens, so it keeps
// playing while the player moves between them.
// The animation was made together with the menu track: it holds on frame 0 until the track actually
// starts playing.
// `logo`: the logo's state in the screen transitions ('hidden', 'in', 'shown' or 'out');
// `logoRect`: its box in the Main Menu's layout. Both change only on screen changes and resizes.
export default function MenuBackground ({ logo, logoRect }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    const scene = new MenuScene()
    sceneRef.current = scene
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

  useEffect(() => {
    sceneRef.current.setLogo(logo)
  }, [logo])

  useEffect(() => {
    if (logoRect) sceneRef.current.setLogoRect(logoRect)
  }, [logoRect])

  return <div ref={containerRef} className="menu-background" aria-hidden="true" />
}
