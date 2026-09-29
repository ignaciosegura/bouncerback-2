import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'

export default function MainMenuScreen ({ onPlay, onSettings }) {
  return (
    <Screen variant="light" transparent className="main-menu-screen">
      {/* Drawn in the foreground color (a CSS mask), so it tints with the buttons in screen transitions */}
      <div className="main-menu__logo" role="img" aria-label="BOUNCERBACK" />
      <Menu>
        <Button onClick={onPlay}>PLAY</Button>
        <Button onClick={onSettings}>SETTINGS</Button>
      </Menu>
    </Screen>
  )
}
