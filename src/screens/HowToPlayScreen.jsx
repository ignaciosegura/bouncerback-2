import Screen from '../components/Screen.jsx'
import Button from '../components/Button.jsx'
import HowToPlayDiagram from '../components/HowToPlayDiagram.jsx'
// The instructions' single source is the doc: paragraphs separated by blank lines
import instructions from '../../docs/game-instructions.md?raw'

const PARAGRAPHS = instructions.trim().split(/\n\s*\n/)

export default function HowToPlayScreen ({ onBack }) {
  return (
    <Screen variant="light" transparent>
      <div className="how-to-play">
        <div className="how-to-play__text">
          {PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="how-to-play__side">
          <HowToPlayDiagram className="how-to-play__diagram" />
          <Button className="how-to-play__back" data-gamepad="back" onClick={onBack}>&lt;&lt;&lt; BACK</Button>
        </div>
      </div>
    </Screen>
  )
}
