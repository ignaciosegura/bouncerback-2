import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import Logo from '../components/Logo.jsx'
import TextBox from '../components/TextBox.jsx'

export default function MainMenuScreen ({ onPlay, onSettings, onHowTo }) {
  return (
    <Screen variant="light" transparent className="main-menu-screen">
      {/* Drawn in the foreground color (currentColor fill), so it tints with the buttons in screen transitions */}
      <Logo className="main-menu__logo" />
      <Menu>
        <Button onClick={onPlay}>PLAY</Button>
        <Button onClick={onSettings}>SETTINGS</Button>
        <Button onClick={onHowTo}>HOW TO</Button>
      </Menu>
      {/* Mixed case on purpose (MAIN MENU mockup); pinned to the bottom, outside the centered logo + buttons group */}
      <div className="main-menu__credits">
        <TextBox size="hud">
          A game by <a href="https://niknak.es" target="_blank" rel="noopener noreferrer" draggable="false">NIK NAK STUDIO</a>
        </TextBox>
        <TextBox size="hud">
          Music and sfx by <a href="https://manfromspace.com" target="_blank" rel="noopener noreferrer" draggable="false">MAN FROM SPACE</a>
        </TextBox>
      </div>
    </Screen>
  )
}
