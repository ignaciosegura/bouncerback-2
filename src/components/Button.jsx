/** @import { ComponentProps } from 'react' */

/** @param {ComponentProps<'button'>} props */
export default function Button ({ className = '', children, ...rest }) {
  return (
    <button type="button" className={`button ${className}`} {...rest}>
      {children}
    </button>
  )
}
