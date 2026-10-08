import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import Logo from '../components/Logo.jsx'
import TextBox from '../components/TextBox.jsx'

export default function MainMenuScreen ({ onPlay, onSettings, onHowTo, onLogoRect }) {
  return (
    <Screen variant="light" transparent className="main-menu-screen">
      {/* Only the logo's place: the menu scene draws it there, and plays the screen transitions on it */}
      <Logo className="main-menu__logo" onRect={onLogoRect} />
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
