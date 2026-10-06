// Final pass (docs/crt-effect.md, "The final pass").
//
// Runs once for every pixel of the canvas and decides its final color. For now it shows the
// scene with the zoom blur mixed over it; the CRT layers (curvature, scanlines…) come later.
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

void main() {
  vec4 color = texture(uScene, vUV);

#ifdef BLUR
  // The same as drawing the blur on top of the scene at uBlurMix opacity
  color = mix(color, texture(uBlur, vUV), uBlurMix);
#endif

  // The scene was cleared with an opaque background, so the canvas is always fully opaque
  finalColor = vec4(color.rgb, 1.0);
}
