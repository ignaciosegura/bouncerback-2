// Phosphor persistence, its own pass: the next history (docs/post-processing.md, "Phosphor
// persistence"). Run before the final pass, where phosphor.glsl shows the trails over the image.
//
// Runs once for every pixel of the history texture. The history fades (multiplied by uDecay,
// minus uCutoff so faint values reach black), and the scene goes in at its own brightness. Taking
// the brighter of the two, rather than adding them, keeps a still shape at its own brightness:
// only what has moved away is left fading behind it.
//
// Alpha holds the pixel's freshness, for the color drift: 1 where the scene is drawn now, fading
// like the brightness once only a trail is left.

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uScene; // the scene texture
uniform sampler2D uHistory; // the history, as of the previous frame
uniform float uDecay; // share of the history's brightness kept this frame (1 while paused)
uniform float uCutoff; // brightness taken off this frame (0 while paused)

float brightest(vec3 color) {
  return max(color.r, max(color.g, color.b));
}

void main() {
  vec4 history = texture(uHistory, vUV);
  vec3 scene = texture(uScene, vUV).rgb;
  vec4 faded = max(history * uDecay - uCutoff, 0.0);
  // What's drawn here now is fresh, unless an older trail is still brighter
  float freshness = brightest(scene) >= brightest(faded.rgb) ? 1.0 : faded.a;
  finalColor = vec4(max(scene, faded.rgb), freshness);
}
