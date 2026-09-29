// Full-viewport screen wrapper: background variant (light/dark) and safe-area padding.
// `transparent` keeps the variant's colors but lets the menu background animation show through.
export default function Screen ({ variant = 'dark', transparent = false, className = '', children, ...rest }) {
  const transparentClass = transparent ? 'screen--transparent' : ''
  return (
    <div className={`screen screen--${variant} ${transparentClass} ${className}`} {...rest}>
      {children}
    </div>
  )
}
