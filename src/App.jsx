import { useEffect, useState } from 'react'
import * as soundManager from './audio/soundManager.js'
import { levels } from './game/levelLoader.js'
import { getHiScore, beatHiScore } from './game/highScore.js'
import IntroScreen from './screens/IntroScreen.jsx'
import MainMenuScreen from './screens/MainMenuScreen.jsx'
import LevelSelectionMenuScreen from './screens/LevelSelectionMenuScreen.jsx'
import SettingsMenuScreen from './screens/SettingsMenuScreen.jsx'
import GameScreen from './screens/GameScreen.jsx'
import GameOverScreen from './screens/GameOverScreen.jsx'
import YouWinScreen from './screens/YouWinScreen.jsx'
import MenuBackground from './components/MenuBackground.jsx'

const SCREENS = {
  INTRO: 'intro',
  MAIN_MENU: 'mainMenu',
  LEVEL_SELECT: 'levelSelect',
  SETTINGS: 'settings',
  GAME: 'game',
  GAME_OVER: 'gameOver',
  YOU_WIN: 'youWin'
}

// Screens drawn over the menu background animation; it plays uninterrupted between them
const MENU_BACKGROUND_SCREENS = [SCREENS.INTRO, SCREENS.MAIN_MENU, SCREENS.LEVEL_SELECT, SCREENS.SETTINGS]

export default function App () {
  const [screen, setScreen] = useState(SCREENS.INTRO)
  const [level, setLevel] = useState(null)
  const [score, setScore] = useState(0)
  const [hiScore, setHiScore] = useState(getHiScore)
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume)
  const [sfxVolume, setSfxVolume] = useState(soundManager.getSfxVolume)

  // Menus play the menu track; Game Over and You Win! are silent. The game screen fades the music
  // out and the GameEngine starts the level's track when its start delay ends.
  // Nothing plays before the Intro tap unlocks audio.
  useEffect(() => {
    switch (screen) {
    case SCREENS.INTRO:
      return
    case SCREENS.GAME:
    case SCREENS.GAME_OVER:
    case SCREENS.YOU_WIN:
      soundManager.stopTrack()
      return
    default:
      soundManager.playTrack(soundManager.MENU_TRACK)
    }
  }, [screen])

  const goToMainMenu = () => setScreen(SCREENS.MAIN_MENU)

  const leaveIntro = () => {
    soundManager.unlock()
    goToMainMenu()
  }

  const changeMusicVolume = (value) => {
    soundManager.setMusicVolume(value)
    setMusicVolume(soundManager.getMusicVolume())
  }

  const changeSfxVolume = (value) => {
    soundManager.setSfxVolume(value)
    setSfxVolume(soundManager.getSfxVolume())
  }

  const startLevel = (selectedLevel) => {
    setLevel(selectedLevel)
    setScore(0)
    setScreen(SCREENS.GAME)
  }

  // Saves the high score to localStorage the instant it's beaten, live during gameplay
  const registerScore = (currentScore) => setHiScore(beatHiScore(currentScore))

  const endLevel = (nextScreen) => ({ score: finalScore }) => {
    setScore(finalScore)
    setScreen(nextScreen)
  }

  const renderScreen = () => {
    switch (screen) {
    case SCREENS.INTRO:
      return <IntroScreen onContinue={leaveIntro} />

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
          onMusicVolumeChange={changeMusicVolume}
          onSfxVolumeChange={changeSfxVolume}
          onBack={goToMainMenu}
        />
      )

    case SCREENS.GAME:
      return (
        <GameScreen
          level={level}
          hiScore={hiScore}
          onScoreChange={registerScore}
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

  // The background always sits at the same place in the tree, so switching between menu screens
  // keeps the same instance (and the animation) instead of remounting it
  return (
    <>
      {MENU_BACKGROUND_SCREENS.includes(screen) ? <MenuBackground /> : null}
      {renderScreen()}
    </>
  )
}
