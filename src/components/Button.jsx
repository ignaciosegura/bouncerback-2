// `blinking` blinks the text only (graphical-specs "Blinking buttons"), on its menu's shared clock
export default function Button ({ className = '', blinking = false, children, ...rest }) {
  let spanClassName = 'button__label'
  if (blinking) spanClassName += ' button__label--blinking'
  return (
    <button type="button" className={`button ${className}`} {...rest}>
      <span className={spanClassName}>{children}</span>
    </button>
  )
}
