// Final pass (docs/crt-effect.md, "The final pass").
//
// Runs once for every pixel of the canvas and decides its final color: it bends the coordinates
// like a CRT's curved glass, reads the scene there (red and blue slightly apart), mixes in the
// zoom blur, then darkens it with scanlines, a phosphor mask and a vignette, and makes up for
// that with a brightness gain. Outside the glass it's black.
//
// BLUR is defined by CrtEffect.js above this source when BLUR_ENABLED is on. Without it, the blur
// texture and the mix don't exist in the shader at all.

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uScene; // the scene texture

#ifdef BLUR
uniform sampler2D uBlur; // the zoom blur texture (lower resolution, smoothly scaled up)
uniform float uBlurMix; // 0–1: the blur's opacity over the scene
#endif

uniform float uAspect; // screen width / height
uniform float uCurvature;
uniform float uCornerRadius; // share of the screen height
uniform float uEdgeSoftness; // share of the screen height
uniform float uAberration;
uniform float uScanlineCount;
uniform float uScanlineIntensity; // already faded out by CrtEffect.js on small screens
uniform float uMaskPitch; // device pixels
uniform float uMaskIntensity;
uniform float uVignette;
uniform float uBrightness;

// Squared distance from the center for a centered point (−1…1 on each axis), measured in real
// proportions (not stretched by the screen's shape): 0 at the center, 1 at the corners
float radius2(vec2 c) {
  vec2 q = c * vec2(uAspect, 1.0);
  return dot(q, q) / (uAspect * uAspect + 1.0);
}

// Curved glass: the scene point shown at centered point c, pushed straight away from the center,
// more the farther out it is. Its twin is warp() in curvature.js: change both together.
vec2 warp(vec2 c) {
  return c * (1.0 + uCurvature * radius2(c));
}

// 1 inside the glass, 0 outside, with a soft edge. p is a centered point after warping. The glass
// is a rectangle with rounded corners, measured in units of half the screen height.
float glass(vec2 p) {
  vec2 halfSize = vec2(uAspect, 1.0);
  float radius = uCornerRadius * 2.0;
  // Signed distance to the rounded rectangle's outline: negative inside, positive outside
  vec2 d = abs(p * halfSize) - (halfSize - radius);
  float outline = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
  return 1.0 - smoothstep(-uEdgeSoftness * 2.0, 0.0, outline);
}

// Centered (−1…1) back to texture coordinates (0–1)
vec2 toUV(vec2 c) {
  return c * 0.5 + 0.5;
}

void main() {
  // 1. Curvature: where in the scene this pixel looks
  vec2 c = vUV * 2.0 - 1.0;
  float r2 = radius2(c);
  vec2 p = warp(c);

  // 2. Outside the glass: black, and nothing else to compute
  float inside = glass(p);
  if (inside <= 0.0) {
    finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // 3. Chromatic aberration: red read a little farther out, blue a little closer in, green in
  // place. The gap grows with the distance from the center, like a lens.
  float spread = uAberration * radius2(p);
  vec3 color = vec3(
    texture(uScene, toUV(p * (1.0 + spread))).r,
    texture(uScene, toUV(p)).g,
    texture(uScene, toUV(p * (1.0 - spread))).b
  );

#ifdef BLUR
  // 4. Zoom blur, read at the same bent point so its streaks curve with the glass. The same as
  // drawing it on top at uBlurMix opacity.
  color = mix(color, texture(uBlur, toUV(p)).rgb, uBlurMix);
#endif

  // 5. Scanlines, counted on the bent image so they curve with the glass. lines goes up by 1 per
  // scanline; sin² is 0 between two lines and 1 in the middle of one: a smooth profile, no hard
  // edges to shimmer. (Squared by hand: pow() is undefined for negative numbers in GLSL.)
  float lines = toUV(p).y * uScanlineCount;
  float wave = sin(3.14159265 * lines);
  float profile = wave * wave;
  color *= mix(1.0 - uScanlineIntensity, 1.0, profile);

  // 6. Phosphor mask: which of the red, green or blue stripes this device pixel is on. The other
  // two channels are dimmed.
  float stripe = floor(mod(gl_FragCoord.x, uMaskPitch) * 3.0 / uMaskPitch);
  vec3 phosphor = vec3(stripe == 0.0, stripe == 1.0, stripe == 2.0);
  color *= mix(vec3(1.0), phosphor, uMaskIntensity);

  // 7. Vignette (darker toward the corners of the screen) and the brightness gain
  color *= 1.0 - uVignette * r2;
  color *= uBrightness;

  finalColor = vec4(color * inside, 1.0);
}
