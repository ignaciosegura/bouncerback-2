// Zoom blur, its own pass: the blurred copy (docs/post-processing.md, "Zoom blur"). Run before
// the final pass, where zoomBlurMix.glsl mixes the copy over the image.
//
// Runs once for every pixel of the low-resolution blur texture. Each pixel averages SAMPLES
// points of the scene on the straight line from itself toward the center, up to uStrength of the
// way. A bright object therefore shows up in the pixels just outside it (farther from the
// center), which is a streak pointing away from the center. Its length grows with the distance
// from the center, so objects near the center barely streak.
//
// SAMPLES is defined by ZoomBlurEffect.js above this source (SAMPLES in zoomBlurSettings.js).

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uScene; // the scene texture
uniform vec2 uCenter; // where the streaks come from, in 0–1 coordinates
uniform float uStrength; // share of the way to the center that is sampled
uniform float uJitter; // 0–1: how much each pixel's samples are shifted at random

// A fixed pseudo-random value in 0–1 for each pixel ("interleaved gradient noise"). It depends
// only on the pixel's position, so it's the same every frame and doesn't sparkle.
float pixelNoise(vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 toCenter = uCenter - vUV;

  // With few samples, a small object shows as separate copies along its streak. Starting each
  // pixel's samples at a slightly different point blends those copies into fine noise.
  float offset = uJitter * pixelNoise(gl_FragCoord.xy);

  vec4 sum = vec4(0.0);
  for (int i = 0; i < SAMPLES; i++) {
    // t goes from 0 (this pixel) toward 1 (uStrength of the way to the center)
    float t = (float(i) + offset) / float(SAMPLES);
    sum += texture(uScene, vUV + toCenter * (uStrength * t));
  }
  finalColor = sum / float(SAMPLES);
}
