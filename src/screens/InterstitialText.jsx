import Overlay from '../components/Overlay.jsx'

// The text over an end-of-level interstitial's picture: plain HTML over the canvas, so the CRT
// doesn't reach it. Taps pass through to the game, which continues on them.
export default function InterstitialText ({ lines }) {
  return (
    <Overlay className="interstitial-text">
      {lines.map((line, i) => <div key={i}>{line || ' '}</div>)}
    </Overlay>
  )
}
