import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import Logo from '../components/Logo.jsx'
import GamepadIndicator from '../components/GamepadIndicator.jsx'
import { isDesktop } from '../desktop.js'

export default function MainMenuScreen ({ onPlay, onSettings, onHowTo, onCredits, onExit, onLogoRect }) {
  return (
    <Screen variant="light" transparent className={`main-menu-screen${isDesktop ? ' main-menu-screen--desktop' : ''}`}>
      {/* Only the logo's place: the menu scene draws it there, and plays the screen transitions on it */}
      <Logo className="main-menu__logo" onRect={onLogoRect} />
      <Menu>
        <Button onClick={onPlay}>PLAY</Button>
        <Button onClick={onSettings}>SETTINGS</Button>
        <Button onClick={onHowTo}>HOW TO</Button>
        <Button onClick={onCredits}>CREDITS</Button>
        {/* Desktop builds only (MAIN MENU - desktop mockup): desktop games need a way to quit */}
        {isDesktop && <Button onClick={onExit}>EXIT GAME</Button>}
        {/* Out of the buttons' flow: beside SETTINGS and HOW TO */}
        <GamepadIndicator />
      </Menu>
    </Screen>
  )
}
