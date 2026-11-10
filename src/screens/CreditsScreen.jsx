import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'

const NIK_NAK_URL = 'https://www.niknak.es'
const MAN_FROM_SPACE_URL = 'https://www.manfromspace.com'
// TODO: the exact link to the licenses file on GitHub is still to be provided
const LICENSES_URL = 'https://github.com/'

// Buttons rather than links, so the game controller can select them. They open in a new tab; the
// desktop build hands them to the system browser
const openLink = (url) => () => window.open(url, '_blank', 'noopener,noreferrer')

// Mixed case on purpose (CREDITS mockup); the line breaks are the mockup's
export default function CreditsScreen ({ onBack }) {
  return (
    <Screen variant="light" transparent>
      <div className="credits__text">
        <p>BOUNCERBACK is a game designed and developed by Nik Nak Studio in 2026.</p>
        <p>Gameplay design and development:<br />Ignacio Segura</p>
        <p>Music and SFX:<br />Man from Space</p>
      </div>
      <Menu className="credits__menu">
        <Button onClick={openLink(NIK_NAK_URL)}>NIK NAK STUDIO</Button>
        <Button onClick={openLink(MAN_FROM_SPACE_URL)}>MAN FROM SPACE</Button>
        <Button onClick={openLink(LICENSES_URL)}>LICENSES</Button>
        <Button data-gamepad="back" onClick={onBack}>&lt;&lt;&lt; BACK</Button>
      </Menu>
    </Screen>
  )
}
