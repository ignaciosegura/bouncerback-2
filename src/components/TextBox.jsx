/** @import { ReactNode } from 'react' */

/**
 * @typedef {Object} TextBoxProps
 * @property {'hud' | 'menu' | 'title'} [size]
 * @property {boolean} [bordered]
 * @property {string} [className]
 * @property {ReactNode} children
 */

/**
 * Single-line text. size: 'hud' (24px), 'menu' (32px) or 'title' (64px) at the 1080px reference height
 * @param {TextBoxProps} props
 */
export default function TextBox ({ size = 'menu', bordered = false, className = '', children }) {
  return (
    <div className={`text-box text-box--${size}${bordered ? ' text-box--bordered' : ''} ${className}`}>
      {children}
    </div>
  )
}
