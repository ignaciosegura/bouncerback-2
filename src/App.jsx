import { useEffect, useRef, useState } from 'react'
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
const MENU_BACKGROUND_SCREENS = [SCREENS.MAIN_MENU, SCREENS.LEVEL_SELECT, SCREENS.SETTINGS]

export default function App () {
  const [screen, setScreen] = useState(SCREENS.INTRO)
  // Screen changes play the old-TV transition on the screen's elements (CSS keyframes in index.css):
  // the current screen stays up during the screen-out, then `nextScreen` replaces it and its
  // elements play the screen-in. The Intro starts with a screen-in on launch.
  const [nextScreen, setNextScreen] = useState(null)
  const [transition, setTransition] = useState('in')
  const previousScreenRef = useRef(null)
  const [level, setLevel] = useState(null)
  const [score, setScore] = useState(0)
  const [hiScore, setHiScore] = useState(getHiScore)
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume)
  const [sfxVolume, setSfxVolume] = useState(soundManager.getSfxVolume)

  // Menus play the menu track; Game Over and You Win! are silent. The game screen fades the music
  // out and the GameEngine starts the level's track when its start delay ends.
  // The music follows the screen actually shown, so it changes when the new screen appears, not on
  // the tap. Nothing plays before the Intro's button unlocks audio. Coming from the Intro, the menu
  // track starts with no fade-in, together with the menu background animation; coming back from
  // Game Over / You Win! it fades in.
  useEffect(() => {
    const previousScreen = previousScreenRef.current
    previousScreenRef.current = screen
    switch (screen) {
    case SCREENS.INTRO:
      return
    case SCREENS.GAME:
    case SCREENS.GAME_OVER:
    case SCREENS.YOU_WIN:
      soundManager.stopTrack()
      return
    default:
      soundManager.playTrack(soundManager.MENU_TRACK, { fadeIn: previousScreen !== SCREENS.INTRO })
    }
  }, [screen])

  // Ignored while a transition runs, so a second tap can't navigate twice
  const navigate = (next) => {
    if (transition) return
    setNextScreen(next)
    setTransition('out')
  }

  // The screen's and its elements' animations end here. The tint (on the screen itself, once)
  // marks the end of the screen-out; every element ends its screen-in at the same time.
  const handleTransitionEnd = (event) => {
    if (event.animationName === 'screen-tint') {
      setScreen(nextScreen)
      setTransition('in')
    } else if (event.animationName === 'screen-in') {
      setTransition(null)
    }
  }

  const goToMainMenu = () => navigate(SCREENS.MAIN_MENU)

  // The unlock must happen inside the button's click; the menu track starts when the Main Menu appears
  const enter = () => {
    soundManager.unlock()
    navigate(SCREENS.MAIN_MENU)
  }

  const changeMusicVolume = (value) => {
    soundManager.setMusicVolume(value)
    setMusicVolume(soundManager.getMusicVolume())
  }

  const changeSfxVolume = (value) => {
    soundManager.setSfxVolume(value)
    setSfxVolume(soundManager.getSfxVolume())
  }

  // `score` isn't reset: only the result screens show it and endLevel always sets it first.
  // Resetting it here would show 0 on Game Over / You Win! while it fades out after Try Again.
  const startLevel = (selectedLevel) => {
    setLevel(selectedLevel)
    navigate(SCREENS.GAME)
  }

  // Saves the high score to localStorage the instant it's beaten, live during gameplay
  const registerScore = (currentScore) => setHiScore(beatHiScore(currentScore))

  const endLevel = (resultScreen) => ({ score: finalScore }) => {
    setScore(finalScore)
    navigate(resultScreen)
  }

  const renderScreen = () => {
    switch (screen) {
    case SCREENS.INTRO:
      return <IntroScreen onEnter={enter} />

    case SCREENS.MAIN_MENU:
      return (
        <MainMenuScreen
          onPlay={() => navigate(SCREENS.LEVEL_SELECT)}
          onSettings={() => navigate(SCREENS.SETTINGS)}
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
  // keeps the same instance (and the animation) instead of remounting it. The transition wrapper
  // never animates itself: only the screen's elements do.
  const transitionClass = transition ? `screen-transition--${transition}` : ''
  return (
    <div className={`screen-transition ${transitionClass}`} onAnimationEnd={handleTransitionEnd}>
      {MENU_BACKGROUND_SCREENS.includes(screen) ? <MenuBackground /> : null}
      {renderScreen()}
    </div>
  )
}
