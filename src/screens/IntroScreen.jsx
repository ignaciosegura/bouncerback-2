import Screen from '../components/Screen.jsx'
import logoUrl from '../../assets/images/game_logo.svg'

export default function IntroScreen ({ onContinue }) {
  return (
    <Screen variant="light" transparent className="intro-screen" onClick={onContinue}>
      <img className="intro-screen__logo" src={logoUrl} alt="BOUNCERBACK" draggable="false" />
    </Screen>
  )
}
