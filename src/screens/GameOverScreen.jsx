import ResultScreen from './ResultScreen.jsx'

/** @import { ResultScreenProps } from './ResultScreen.jsx' */

/** @param {Omit<ResultScreenProps, 'title'>} props */

export default function GameOverScreen (props) {
  return <ResultScreen title="GAME OVER" {...props} />
}
