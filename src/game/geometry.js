// PixiJS builds circles as polygons sized for their drawn radius, not their on-screen size, so they
// show flat sides when zoomed (the last life zoom goes up to 10×). These have enough points to stay round.
export const CIRCLE_SEGMENTS = 128

// Flat [x0, y0, x1, y1, …] list for Graphics.poly()
export function circlePoints (radius, segments = CIRCLE_SEGMENTS) {
  const points = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  return points
}
