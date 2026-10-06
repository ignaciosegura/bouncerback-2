// Full-screen vertex shader, shared by every pass (docs/post-processing.md, "Full-screen quads").
//
// Each pass draws one rectangle (two triangles, four corners) that covers its whole target. A
// vertex shader runs once per corner: it says where the corner goes on the target and hands the
// fragment shader the corner's texture coordinates, which the GPU then interpolates for every
// pixel in between.

// Per-corner inputs, from the quad's geometry. Both go from (0, 0) at the top left to (1, 1) at
// the bottom right; the mesh is scaled to the screen's size, so aPosition becomes screen pixels
// (FullscreenPass.js).
in vec2 aPosition;
in vec2 aUV;

// Interpolated for the fragment shader: (0, 0) top left of the screen, (1, 1) bottom right
out vec2 vUV;

// Set by PixiJS for every draw: the projection maps the target's pixels to the GPU's −1…1 clip
// space (flipping y for render textures, so they come out the right way up), and the two
// transforms place the mesh (here, only its scale to the screen's size).
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
