import { useState } from 'react'
import IntroScreen from './screens/IntroScreen.jsx'
import MainMenuScreen from './screens/MainMenuScreen.jsx'
import LevelSelectionMenuScreen from './screens/LevelSelectionMenuScreen.jsx'
import SettingsMenuScreen from './screens/SettingsMenuScreen.jsx'
import GameScreen from './screens/GameScreen.jsx'
import GameOverScreen from './screens/GameOverScreen.jsx'
import YouWinScreen from './screens/YouWinScreen.jsx'

const SCREENS = {
  INTRO: 'intro',
  MAIN_MENU: 'mainMenu',
  LEVEL_SELECT: 'levelSelect',
  SETTINGS: 'settings',
  GAME: 'game',
  GAME_OVER: 'gameOver',
  YOU_WIN: 'youWin'
}

// levelN.json → { number: N, ...levelData }, ordered by N
const levelModules = import.meta.glob('./levels/level*.json', { eager: true, import: 'default' })
const levels = Object.entries(levelModules)
  .map(([path, data]) => ({ number: Number(path.match(/level(\d+)\.json$/)[1]), ...data }))
  .sort((a, b) => a.number - b.number)

export default function App () {
  const [screen, setScreen] = useState(SCREENS.INTRO)
  const [level, setLevel] = useState(null)
  const [score, setScore] = useState(0)
  const [hiScore, setHiScore] = useState(0)
  const [musicVolume, setMusicVolume] = useState(10)
  const [sfxVolume, setSfxVolume] = useState(10)

  const goToMainMenu = () => setScreen(SCREENS.MAIN_MENU)

  const startLevel = (selectedLevel) => {
    setLevel(selectedLevel)
    setScore(0)
    setScreen(SCREENS.GAME)
  }

  const endLevel = (nextScreen) => ({ score: finalScore }) => {
    setScore(finalScore)
    setHiScore((current) => Math.max(current, finalScore))
    setScreen(nextScreen)
  }

  switch (screen) {
  case SCREENS.INTRO:
    return <IntroScreen onContinue={goToMainMenu} />

  case SCREENS.MAIN_MENU:
    return (
      <MainMenuScreen
        onPlay={() => setScreen(SCREENS.LEVEL_SELECT)}
        onSettings={() => setScreen(SCREENS.SETTINGS)}
      />
    )

  case SCREENS.LEVEL_SELECT:
    return (
      <LevelSelectionMenuScreen
        levels={levels}
        onSelectLevel={startLevel}
        onBack={goToMainMenu}
      />
    )

  case SCREENS.SETTINGS:
    return (
      <SettingsMenuScreen
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        onMusicVolumeChange={setMusicVolume}
        onSfxVolumeChange={setSfxVolume}
        onBack={goToMainMenu}
      />
    )

  case SCREENS.GAME:
    return (
      <GameScreen
        level={level}
        onGameOver={endLevel(SCREENS.GAME_OVER)}
        onLevelWin={endLevel(SCREENS.YOU_WIN)}
      />
    )

  case SCREENS.GAME_OVER:
  case SCREENS.YOU_WIN: {
    const ResultScreen = screen === SCREENS.GAME_OVER ? GameOverScreen : YouWinScreen
    return (
      <ResultScreen
        score={score}
        hiScore={hiScore}
        onTryAgain={() => startLevel(level)}
        onMainMenu={goToMainMenu}
      />
    )
  }

  default:
    return null
  }
}
