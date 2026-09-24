import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import TextBox from '../components/TextBox.jsx'

// Placeholder until the PixiJS GameEngine and HUD are wired in: lets navigation be tested end to end
export default function GameScreen ({ level, onGameOver, onLevelWin }) {
  return (
    <Screen variant="dark" className="game-screen">
      <TextBox size="hud">{level.name}</TextBox>
      <Menu>
        <Button onClick={() => onLevelWin({ score: 7280 })}>WIN</Button>
        <Button onClick={() => onGameOver({ score: 240 })}>LOSE</Button>
      </Menu>
    </Screen>
  )
}
