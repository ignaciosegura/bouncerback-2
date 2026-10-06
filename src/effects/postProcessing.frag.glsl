// The final pass (docs/post-processing.md, "The final pass").
//
// Runs once for every pixel of the canvas. Every effect is a GLSL function, vec3 <name>(vec2 uv),
// that returns its image's color at uv, reading the previous effect's image through INPUT(uv)
// (as many times as it needs, and at any point). PostProcessing.js writes the effects' functions
// where the EFFECTS line is, in chain order, defining INPUT before each one as the previous
// function's name, and LAST as the last one's. The whole chain then runs in this one pass, with no
// textures in between.

in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uScene; // the scene, as drawn

// The start of the chain: the scene itself
vec3 scene(vec2 uv) {
  return texture(uScene, uv).rgb;
}

// EFFECTS

void main() {
  // The scene was cleared with an opaque background, so the canvas is always fully opaque
  finalColor = vec4(LAST(vUV), 1.0);
}
