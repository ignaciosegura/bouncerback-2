// Tunable values shared by the whole post-processing pipeline (each effect has its own settings
// file in its folder). Explained in docs/post-processing.md ("Tuning").
export const POST_PROCESSING_SETTINGS = Object.freeze({
  // Cap on the device pixel ratio for the scene texture, the passes between effects and the
  // canvas. Phones go up to 3×; above 2× the extra sharpness isn't visible under the effects, but
  // the GPU cost grows with the square. Range: 1–3.
  MAX_RESOLUTION: 2
})
