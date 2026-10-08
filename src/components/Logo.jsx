import { useEffect, useEffectEvent, useRef } from 'react'

// The Main Menu logo's place in the layout. The logo itself is drawn by PixiJS in the menu scene
// (src/menu/MenuLogo.js), behind the HTML layer: this empty box holds its size and position, which
// the scene follows through onRect({ x, y, width, height }), and names it for screen readers.
export default function Logo ({ onRect, ...props }) {
  const boxRef = useRef(null)
  const reportRect = useEffectEvent((rect) => onRect?.(rect))

  useEffect(() => {
    const box = boxRef.current
    let active = true
    // Relative to the transition root, which the menu scene's canvas also fills, and without the
    // screen-out's shake (a translation the scene plays itself), in case it's measured mid-shake
    const measure = () => {
      if (!active) return
      const root = box.closest('.screen-transition').getBoundingClientRect()
      const { left, top, width, height } = box.getBoundingClientRect()
      const shake = new DOMMatrix(getComputedStyle(box).transform)
      reportRect({ x: left - root.left - shake.e, y: top - root.top - shake.f, width, height })
    }

    measure()
    // The buttons below it are text: the layout can shift once the font has loaded
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => {
      active = false
      window.removeEventListener('resize', measure)
    }
  }, [])

  return <div ref={boxRef} role="img" aria-label="BOUNCERBACK" {...props} />
}
