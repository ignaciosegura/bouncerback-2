import ResultScreen from './ResultScreen.jsx'

/** @import { ResultScreenProps } from './ResultScreen.jsx' */

/** @param {Omit<ResultScreenProps, 'title'>} props */

export default function YouWinScreen (props) {
  return <ResultScreen title="YOU WIN!" {...props} />
}
