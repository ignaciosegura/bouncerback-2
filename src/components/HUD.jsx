import Overlay from './Overlay.jsx'
import TextBox from './TextBox.jsx'

function Stat ({ label, value }) {
  return (
    <div className="hud__stat">
      <TextBox size="hud">{label}</TextBox>
      <TextBox size="hud">{value}</TextBox>
    </div>
  )
}

// Heads-up display over the game canvas: taps pass through to the game
export default function HUD ({ score, timeTenths, hiScore, lives }) {
  return (
    <Overlay className="hud">
      <div className="hud__top">
        <Stat label="SCORE" value={score} />
        <Stat label="TIME" value={timeTenths} />
        <Stat label="HI-SCORE" value={hiScore} />
      </div>
      <div className="hud__lives" aria-label={`${lives} lives`}>
        {Array.from({ length: lives }, (_, i) => <span key={i} className="hud__life" />)}
      </div>
    </Overlay>
  )
}
