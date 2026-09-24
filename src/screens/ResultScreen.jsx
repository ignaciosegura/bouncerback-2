import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import TextBox from '../components/TextBox.jsx'

// Shared layout of the Game Over and You Win! screens
export default function ResultScreen ({ title, score, hiScore, onTryAgain, onMainMenu }) {
  return (
    <Screen variant="dark" className="result-screen">
      <TextBox size="title">{title}</TextBox>
      <dl className="result-screen__scores">
        <dt>SCORE</dt>
        <dd>{score}</dd>
        <dt>HI-SCORE</dt>
        <dd>{hiScore}</dd>
      </dl>
      <Menu>
        <Button onClick={onTryAgain}>TRY AGAIN</Button>
        <Button onClick={onMainMenu}>MAIN MENU</Button>
      </Menu>
    </Screen>
  )
}
