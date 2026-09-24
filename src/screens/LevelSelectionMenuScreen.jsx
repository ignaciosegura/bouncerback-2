import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'

export default function LevelSelectionMenuScreen ({ levels, onSelectLevel, onBack }) {
  return (
    <Screen variant="light">
      <Menu footer={<Button onClick={onBack}>&lt;&lt;&lt; BACK</Button>}>
        {levels.map((level) => (
          <Button key={level.number} onClick={() => onSelectLevel(level)}>
            {level.name}
          </Button>
        ))}
      </Menu>
    </Screen>
  )
}
