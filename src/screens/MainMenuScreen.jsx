import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import Logo from '../components/Logo.jsx'

export default function MainMenuScreen ({ onPlay, onSettings }) {
  return (
    <Screen variant="light" transparent className="main-menu-screen">
      {/* Drawn in the foreground color (currentColor fill), so it tints with the buttons in screen transitions */}
      <Logo className="main-menu__logo" />
      <Menu>
        <Button onClick={onPlay}>PLAY</Button>
        <Button onClick={onSettings}>SETTINGS</Button>
      </Menu>
    </Screen>
  )
}
