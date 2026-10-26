import { useEffect, useState } from 'react'
import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import TextBox from '../components/TextBox.jsx'
import { MENU_TRACK, preloadTrack } from '../audio/soundManager.js'
import { isDesktop } from '../desktop.js'

// First screen: its button is the user interaction that unlocks audio before the Main Menu
export default function IntroScreen ({ onEnter }) {
  // The button blinks until it's pressed, then stays steady through the screen-out
  const [entered, setEntered] = useState(false)

  // Loading and decoding need no user interaction, so the menu track is ready when the Main Menu starts it
  useEffect(() => {
    preloadTrack(MENU_TRACK)
  }, [])

  return (
    <Screen variant="light" className="intro-screen">
      {/* Outside the Menu: it's wider than the button, which the menu would stretch to match */}
      <TextBox size="menu" className="intro-screen__note">Grab your best headphones first ;)</TextBox>
      <Menu>
        {/* Web and native apps: not selectable with the game controller, as browsers don't unlock
            audio on controller input. Desktop (no such rule): selectable, and the press that
            connects the controller enters, so the Steam Deck needs no second press */}
        <Button
          data-gamepad={isDesktop ? 'connect-press' : 'ignore'}
          blinking={!entered}
          onClick={() => {
            setEntered(true)
            onEnter()
          }}
        >
          ENTER BOUNCERBACK
        </Button>
      </Menu>
    </Screen>
  )
}
