// Bloom, in the final pass: the blurred copy added over the image (docs/post-processing.md,
// "Bloom"). A chunk of postProcessing.frag.glsl: INPUT is the previous effect's function.

uniform sampler2D uBloomTexture; // the blurred copy (lower resolution, smoothly scaled up)
uniform float uBloomIntensity; // how much of the glow is added

vec3 bloom(vec2 uv) {
  // Light adds up: the glow goes over the image, it doesn't replace it
  return INPUT(uv) + texture(uBloomTexture, uv).rgb * uBloomIntensity;
}
