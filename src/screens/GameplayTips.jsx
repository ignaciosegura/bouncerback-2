import Overlay from '../components/Overlay.jsx'
import Button from '../components/Button.jsx'

// Over the Game Screen before the level starts (GAMEPLAY TIPS mockup): the level's tip and READY.
// Not a screen change, but READY fades the tip out like a screen-out (same keyframes, see
// index.css) and then starts the level. The Game Screen holds `leaving`, for the desktop Escape key.
export default function GameplayTips ({ lines, leaving, onLeave, onReady }) {
  // The tint animation's name is also App's screen-change signal: keep it from reaching it
  const handleAnimationEnd = (event) => {
    event.stopPropagation()
    if (event.animationName === 'screen-out') onReady()
  }

  return (
    <Overlay className={`gameplay-tips${leaving ? ' gameplay-tips--out' : ''}`}>
      <div className="gameplay-tips__content" onAnimationEnd={handleAnimationEnd}>
        <div className="gameplay-tips__text">
          {lines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
        <Button disabled={leaving} onClick={onLeave}>READY</Button>
      </div>
    </Overlay>
  )
}
