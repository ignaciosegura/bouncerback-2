import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'

export default function MainMenuScreen ({ onPlay, onSettings }) {
  return (
    <Screen variant="light" transparent>
      <Menu>
        <Button onClick={onPlay}>PLAY</Button>
        <Button onClick={onSettings}>SETTINGS</Button>
      </Menu>
    </Screen>
  )
}
