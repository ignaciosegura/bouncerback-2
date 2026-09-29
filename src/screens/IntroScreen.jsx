import { useEffect } from 'react'
import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import { MENU_TRACK, preloadTrack } from '../audio/soundManager.js'

// First screen: its button is the user interaction that unlocks audio before the Main Menu
export default function IntroScreen ({ onEnter }) {
  // Loading and decoding need no user interaction, so the menu track is ready when the button starts it
  useEffect(() => {
    preloadTrack(MENU_TRACK)
  }, [])

  return (
    <Screen variant="light">
      <Menu>
        <Button onClick={onEnter}>ENTER BOUNCERBACK</Button>
      </Menu>
    </Screen>
  )
}
