import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import logoUrl from '../../assets/images/game_logo.svg'

export default function MainMenuScreen ({ onPlay, onSettings }) {
  return (
    <Screen variant="light" transparent className="main-menu-screen">
      <img className="main-menu__logo" src={logoUrl} alt="BOUNCERBACK" draggable="false" />
      <Menu>
        <Button onClick={onPlay}>PLAY</Button>
        <Button onClick={onSettings}>SETTINGS</Button>
      </Menu>
    </Screen>
  )
}
