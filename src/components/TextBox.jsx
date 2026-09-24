// Single-line text. size: 'hud' (24px), 'menu' (32px) or 'title' (64px) at the 1080px reference height
export default function TextBox ({ size = 'menu', bordered = false, className = '', children }) {
  return (
    <div className={`text-box text-box--${size}${bordered ? ' text-box--bordered' : ''} ${className}`}>
      {children}
    </div>
  )
}
