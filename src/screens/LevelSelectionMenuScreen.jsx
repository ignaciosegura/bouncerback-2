import { useState } from 'react'
import Screen from '../components/Screen.jsx'
import Menu from '../components/Menu.jsx'
import Button from '../components/Button.jsx'
import { LEVEL_NAME_MAX_LENGTH } from '../game/levelLoader.js'
import { isLevelUnlocked } from '../game/levelProgress.js'

// Shown instead of a locked level's name: the same for every level, so neither the name nor its length shows
const LOCKED_LABEL = '-'.repeat(12)

// One row per tier, tier 0 first; within a row, levels by number
function rowsByTier (levels) {
  const rows = new Map()
  for (const level of [...levels].sort((a, b) => a.tier - b.tier || a.number - b.number)) {
    if (!rows.has(level.tier)) rows.set(level.tier, [])
    rows.get(level.tier).push(level)
  }
  return [...rows.values()]
}

export default function LevelSelectionMenuScreen ({ levels, levelProgress, onSelectLevel, onBack }) {
  // The level picked to play: its name stops blinking and stays steady through the screen-out
  const [selectedLevel, setSelectedLevel] = useState(null)

  return (
    <Screen
      variant="light"
      transparent
      className="level-select"
      data-konami-code
      style={{ '--level-label-chars': LEVEL_NAME_MAX_LENGTH }}
    >
      <Menu footer={<Button className="level-select__button" data-gamepad="back" onClick={onBack}>&lt;&lt;&lt; BACK</Button>}>
        {rowsByTier(levels).map((row) => (
          <div key={row[0].tier} className="level-select__row">
            {row.map((level) => {
              const unlocked = isLevelUnlocked(level, levelProgress)
              // Unlocked but not beaten yet: its name blinks (graphical-specs "Level Select")
              const pending = unlocked && !levelProgress.beatenLevels.includes(level.number)
              return (
                <Button
                  key={level.number}
                  className="level-select__button"
                  disabled={!unlocked}
                  blinking={pending && level.number !== selectedLevel}
                  onClick={() => {
                    setSelectedLevel(level.number)
                    onSelectLevel(level)
                  }}
                >
                  {unlocked ? level.name : LOCKED_LABEL}
                </Button>
              )
            })}
          </div>
        ))}
      </Menu>
    </Screen>
  )
}
