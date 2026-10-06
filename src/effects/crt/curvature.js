// The curved glass's formula in JavaScript, for input: the scene point shown at screen point
// (x, y), in screen pixels. Its twin is crtWarp() in crt.glsl: change both together.
// Explained in docs/post-processing.md ("Curved glass").
export function warp (x, y, width, height, curvature) {
  // Centered coordinates: −1…1 across the screen on each axis
  const cx = (x / width) * 2 - 1
  const cy = (y / height) * 2 - 1
  // Squared distance from the center measured in real proportions (not stretched by the
  // screen's shape), 1 at the corners
  const aspect = width / height
  const r2 = ((cx * aspect) ** 2 + cy ** 2) / (aspect ** 2 + 1)
  // The point is pushed straight away from the center: angles from the center don't change
  const f = 1 + curvature * r2
  return { x: ((cx * f + 1) / 2) * width, y: ((cy * f + 1) / 2) * height }
}
