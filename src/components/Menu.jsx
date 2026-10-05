/** @import { ReactNode } from 'react' */

/**
 * @typedef {Object} MenuProps
 * @property {ReactNode} [footer]
 * @property {string} [className]
 * @property {ReactNode} children
 */

/**
 * Vertical stack of buttons, all stretched to the widest one.
 * An optional footer (e.g. BACK) is pinned to the bottom of the screen.
 * @param {MenuProps} props
 */
export default function Menu ({ footer, className = '', children }) {
  return (
    <nav className={`menu${footer ? ' menu--with-footer' : ''} ${className}`}>
      <div className="menu__items">{children}</div>
      {footer && <div className="menu__footer">{footer}</div>}
    </nav>
  )
}
