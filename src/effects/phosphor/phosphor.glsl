// Phosphor persistence, in the final pass: the trails over the image (docs/post-processing.md,
// "Phosphor persistence"). A chunk of postProcessing.frag.glsl: INPUT is the previous effect's
// function.
//
// The trails are the previous frame's history, faded by this frame's decay: what was on screen
// before, not what is now. The current frame comes only from INPUT, so it stays sharp and keeps
// the earlier effects (the zoom blur's mix). As a trail fades, its color drifts toward
// uPhosphorDriftColor.

uniform sampler2D uPhosphorHistory; // the previous frame's history (lower resolution, smoothly scaled up)
uniform float uPhosphorDecay; // as uDecay in phosphor.frag.glsl
uniform float uPhosphorCutoff; // as uCutoff in phosphor.frag.glsl
uniform float uPhosphorMix; // 0–1: the trails' brightness
uniform vec3 uPhosphorDriftColor; // the hue the trails drift to, at full brightness
uniform float uPhosphorDrift; // 0–1: how far toward it a trail gets when it's gone

vec3 phosphor(vec2 uv) {
  // Alpha is the trail's freshness: 1 when it was drawn, toward 0 as it fades
  vec4 trail = max(texture(uPhosphorHistory, uv) * uPhosphorDecay - uPhosphorCutoff, 0.0);
  float brightness = max(trail.r, max(trail.g, trail.b));
  vec3 drifted = mix(trail.rgb, uPhosphorDriftColor * brightness, (1.0 - trail.a) * uPhosphorDrift);
  // The brighter of the two: a trail never darkens what's on screen
  return max(INPUT(uv), drifted * uPhosphorMix);
}
