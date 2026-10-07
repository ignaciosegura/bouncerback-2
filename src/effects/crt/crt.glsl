// CRT effect, in the final pass (docs/post-processing.md, "CRT"). A chunk of
// postProcessing.frag.glsl: INPUT is the previous effect's function.
//
// For each screen point, it bends the coordinates like a CRT's curved glass, reads the image there
// (red and blue slightly apart), then darkens it with scanlines, a phosphor mask and a vignette,
// and makes up for that with a brightness gain. Outside the glass it's black.
//
// Its uniforms and helper functions start with crt / uCrt, so they can't clash with another
// effect's in the same shader.

uniform float uCrtAspect; // screen width / height
uniform float uCrtCurvature;
uniform float uCrtZoom;
uniform float uCrtCornerRadius; // share of the screen height
uniform float uCrtEdgeSoftness; // share of the screen height
uniform float uCrtAberration;
uniform float uCrtScanlineCount;
uniform float uCrtScanlineIntensity; // already faded out by CrtEffect.js on small screens
uniform float uCrtMaskPitch; // device pixels
uniform float uCrtMaskIntensity;
uniform float uCrtVignette;
uniform float uCrtBrightness;

// Squared distance from the center for a centered point (−1…1 on each axis), measured in real
// proportions (not stretched by the screen's shape): 0 at the center, 1 at the corners
float crtRadius2(vec2 c) {
  vec2 q = c * vec2(uCrtAspect, 1.0);
  return dot(q, q) / (uCrtAspect * uCrtAspect + 1.0);
}

// Curved glass: the image point shown at centered point c, pushed straight away from the center,
// more the farther out it is, and magnified by the zoom. Its twin is warp() in curvature.js:
// change both together.
vec2 crtWarp(vec2 c) {
  return c * (1.0 + uCrtCurvature * crtRadius2(c)) / uCrtZoom;
}

// 1 inside the glass, 0 outside, with a soft edge. p is a centered point after warping. The glass
// is a rectangle with rounded corners, measured in units of half the screen height.
float crtGlass(vec2 p) {
  vec2 halfSize = vec2(uCrtAspect, 1.0);
  float radius = uCrtCornerRadius * 2.0;
  // Signed distance to the rounded rectangle's outline: negative inside, positive outside
  vec2 d = abs(p * halfSize) - (halfSize - radius);
  float outline = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
  return 1.0 - smoothstep(-uCrtEdgeSoftness * 2.0, 0.0, outline);
}

// Centered (−1…1) back to texture coordinates (0–1)
vec2 crtToUV(vec2 c) {
  return c * 0.5 + 0.5;
}

vec3 crt(vec2 uv) {
  // 1. Curvature: where in the image this point looks
  vec2 c = uv * 2.0 - 1.0;
  float r2 = crtRadius2(c);
  vec2 p = crtWarp(c);

  // 2. Outside the glass: black, and nothing else to compute
  float inside = crtGlass(p);
  if (inside <= 0.0) return vec3(0.0);

  // 3. Chromatic aberration: red read a little farther out, blue a little closer in, green in
  // place. The gap grows with the distance from the center, like a lens.
  float spread = uCrtAberration * crtRadius2(p);
  vec3 color = vec3(
    INPUT(crtToUV(p * (1.0 + spread))).r,
    INPUT(crtToUV(p)).g,
    INPUT(crtToUV(p * (1.0 - spread))).b
  );

  // 4. Scanlines, counted on the bent image so they curve with the glass. lines goes up by 1 per
  // scanline; sin² is 0 between two lines and 1 in the middle of one: a smooth profile, no hard
  // edges to shimmer. (Squared by hand: pow() is undefined for negative numbers in GLSL.)
  float lines = crtToUV(p).y * uCrtScanlineCount;
  float wave = sin(3.14159265 * lines);
  float profile = wave * wave;
  color *= mix(1.0 - uCrtScanlineIntensity, 1.0, profile);

  // 5. Phosphor mask: which of the red, green or blue stripes this device pixel is on. The other
  // two channels are dimmed.
  float stripe = floor(mod(gl_FragCoord.x, uCrtMaskPitch) * 3.0 / uCrtMaskPitch);
  vec3 phosphor = vec3(stripe == 0.0, stripe == 1.0, stripe == 2.0);
  color *= mix(vec3(1.0), phosphor, uCrtMaskIntensity);

  // 6. Vignette (darker toward the corners of the screen) and the brightness gain
  color *= 1.0 - uCrtVignette * r2;
  color *= uCrtBrightness;

  // Fades the glass's edge to black
  return color * inside;
}
