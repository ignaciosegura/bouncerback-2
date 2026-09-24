// Layer on top of the current screen content; only its children receive pointer events
export default function Overlay ({ className = '', children }) {
  return (
    <div className={`overlay ${className}`}>
      {children}
    </div>
  )
}
