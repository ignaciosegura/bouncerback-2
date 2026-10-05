/** @import { ReactNode } from 'react' */

/**
 * @typedef {Object} OverlayProps
 * @property {string} [className]
 * @property {ReactNode} children
 */

/**
 * Layer on top of the current screen content; only its children receive pointer events
 * @param {OverlayProps} props
 */
export default function Overlay ({ className = '', children }) {
  return (
    <div className={`overlay ${className}`}>
      {children}
    </div>
  )
}
