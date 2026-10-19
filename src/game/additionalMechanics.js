// Additional game mechanics a level can add to the core one (see docs/game-rules.md). The names
// are exactly what level files list in `additionalGameMechanics`; the schema's enum must match
export const ADDITIONAL_MECHANICS = Object.freeze({
  ATOM_CAPTURE: 'atom capture',
  SUPERCHARGED_ATOM: 'supercharged atom',
  CHARGED_ATOM_HOLD: 'charged atom hold'
})
