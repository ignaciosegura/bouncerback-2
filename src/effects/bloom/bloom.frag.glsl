// Bloom, its own passes: one direction of a Gaussian blur (docs/post-processing.md, "Bloom").
// Run twice before the final pass, horizontally (scene to a low-resolution texture) and then
// vertically (that texture to a second one), which gives the same result as one 2D blur with far
// fewer reads. bloom.glsl adds the result over the image in the final pass.

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uInput; // the image to blur
uniform vec2 uStep; // distance between two taps, in 0–1 coordinates, along the blur's direction
uniform vec2 uCross; // half a pixel across that direction: each tap averages two points

const int TAPS = 4; // taps on each side of the center
const float SIGMA = 2.0; // in taps

void main() {
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int i = -TAPS; i <= TAPS; i++) {
    float weight = exp(-float(i * i) / (2.0 * SIGMA * SIGMA));
    vec2 at = vUV + uStep * float(i);
    // The first pass shrinks the scene to a fraction of its size; two points per tap keep thin
    // lines from slipping between the taps
    sum += weight * 0.5 * (texture(uInput, at + uCross).rgb + texture(uInput, at - uCross).rgb);
    total += weight;
  }
  finalColor = vec4(sum / total, 1.0);
}
