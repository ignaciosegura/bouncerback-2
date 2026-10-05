import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'

/** @import { LoadedLevel } from '../game/types.js' */

/**
 * @typedef {Object} LevelSelectionMenuScreenProps
 * @property {LoadedLevel[]} levels
 * @property {(level: LoadedLevel) => void} onSelectLevel
 * @property {() => void} onBack
 */

/** @param {LevelSelectionMenuScreenProps} props */

export default function LevelSelectionMenuScreen ({ levels, onSelectLevel, onBack }) {
  return (
    <Screen variant="light" transparent>
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
