// Full-viewport screen wrapper: background variant (light/dark) and safe-area padding
export default function Screen ({ variant = 'dark', className = '', children, ...rest }) {
  return (
    <div className={`screen screen--${variant} ${className}`} {...rest}>
      {children}
    </div>
  )
}
