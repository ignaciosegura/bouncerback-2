import { useEffect, useRef } from 'react'
// The SVG player with expression support: the animation uses loopOut('cycle') on two layers
import lottie from 'lottie-web/build/player/esm/lottie_svg.min.js'
import animationData from '../../assets/motion/intro_animation.json'

// The content ends at frame 7485; the file's empty tail is cut to 5 s (300 frames at 60 fps)
const LOOP_END_FRAME = 7785

// Lottie animation behind the menu screens. Mounted once in App.jsx, outside the screens,
// so it keeps playing while the player moves between them. Lottie runs its own frame loop.
export default function MenuBackground () {
  const containerRef = useRef(null)

  useEffect(() => {
    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      animationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
    })
    animation.playSegments([0, LOOP_END_FRAME], true)

    return () => animation.destroy()
  }, [])

  return <div ref={containerRef} className="menu-background" aria-hidden="true" />
}
