import { useEffect } from 'react'
import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import TextBox from '../components/TextBox.jsx'
import { MENU_TRACK, preloadTrack } from '../audio/soundManager.js'

// First screen: its button is the user interaction that unlocks audio before the Main Menu
export default function IntroScreen ({ onEnter }) {
  // Loading and decoding need no user interaction, so the menu track is ready when the Main Menu starts it
  useEffect(() => {
    preloadTrack(MENU_TRACK)
  }, [])

  return (
    <Screen variant="light" className="intro-screen">
      {/* Outside the Menu: it's wider than the button, which the menu would stretch to match */}
      <TextBox size="menu" className="intro-screen__note">Grab your best headphones first ;)</TextBox>
      <Menu>
        <Button onClick={onEnter}>ENTER BOUNCERBACK</Button>
      </Menu>
    </Screen>
  )
}
