// Zoom blur, in the final pass: the blurred copy mixed over the image (docs/post-processing.md,
// "Zoom blur"). A chunk of postProcessing.frag.glsl: INPUT is the previous effect's function.

uniform sampler2D uZoomBlurTexture; // the blurred copy (lower resolution, smoothly scaled up)
uniform float uZoomBlurMix; // 0–1: the blur's opacity over the image

vec3 zoomBlur(vec2 uv) {
  // The same as drawing the blur on top of the image at uZoomBlurMix opacity
  return mix(INPUT(uv), texture(uZoomBlurTexture, uv).rgb, uZoomBlurMix);
}
