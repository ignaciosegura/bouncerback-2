// Prints the level difficulty table (Markdown) from src/levels/*.json.
// Usage: npm run level:table
// How every column is calculated: docs/level-difficulty-table.md
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAX_CHARGE, SUPERCHARGED_CHARGE, SUPERCHARGED_SPEED_FACTOR } from '../src/game/entities/Atom.js'
import { bouncePoints, containmentPoints, timeBonus, livesBonus } from '../src/game/scoring.js'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const levelsDir = join(root, 'src/levels')
const DEFAULT_PADDLE_COUNT = 2

const compact = (points) => {
  if (points >= 1e6) return `~${(points / 1e6).toFixed(2).replace(/\.?0+$/, '')} M`
  if (points >= 1e4) return `~${Math.round(points / 1e3)} K`
  return `~${(points / 1e3).toFixed(1)} K`
}
const trim = (n, digits = 1) => String(Number(n.toFixed(digits)))

// Number of the level = the N in levelN.json (it is also the score multiplier)
const files = readdirSync(levelsDir)
  .filter((file) => /^level\d+\.json$/.test(file))
  .sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10))

function analyse (file) {
  const level = Number(file.match(/\d+/)[0])
  const data = JSON.parse(readFileSync(join(levelsDir, file), 'utf8'))
  const { bpm, signature } = data.timeSignature
  const mechanics = data.additionalGameMechanics
  const capture = mechanics.includes('atom capture')
  const supercharged = mechanics.includes('supercharged atom')

  const secondsPerBeat = 60 / bpm
  const durationSeconds = data.duration * signature * secondsPerBeat
  const travel = data.atoms.travelTime * secondsPerBeat // core to ring, seconds
  const interval = data.atoms.barsInterval * signature * secondsPerBeat
  const atomCount = Math.floor(data.duration / data.atoms.barsInterval)
  const paddleCount = data.paddles.count ?? DEFAULT_PADDLE_COUNT

  // Score ceiling: each atom spawns mid-interval and is bounced every time it comes back to the
  // ring, then stays contained to the end; no captures, no hold, no lives lost.
  const bounceScore = (travelTime, spawn, fixedCharge) => {
    const remaining = durationSeconds - spawn
    const bounces = remaining >= travelTime ? Math.floor((remaining - travelTime) / (2 * travelTime)) + 1 : 0
    let charge = fixedCharge ?? 1
    let points = 0
    for (let i = 0; i < bounces; i++) {
      points += bouncePoints(level, charge)
      if (fixedCharge === undefined && capture && charge < MAX_CHARGE) charge++
    }
    return { points, contained: containmentPoints(level, charge) }
  }

  let score = 0
  for (let i = 0; i < atomCount; i++) {
    const { points, contained } = bounceScore(travel, i * interval + interval / 2)
    score += points + contained
  }
  if (supercharged) {
    // Appears at half the timer, at double speed, with a fixed charge
    const { points, contained } = bounceScore(travel / SUPERCHARGED_SPEED_FACTOR, durationSeconds / 2, SUPERCHARGED_CHARGE)
    score += points + contained
  }
  score += timeBonus(level, Math.round(durationSeconds * 10)) + livesBonus(level, data.lives)

  // Bounces per second needed at the end of the level if no atom is ever captured: every live
  // atom comes back to the ring once per round trip (2 * travel). The supercharged atom's round
  // trip is shorter by its speed factor.
  const demand = atomCount / (2 * travel) + (supercharged ? SUPERCHARGED_SPEED_FACTOR / (2 * travel) : 0)

  const mechanicsText = mechanics.length === 0
    ? 'core only'
    : mechanics.map((m) => ({ 'atom capture': 'capture', 'charged atom hold': 'hold', 'supercharged atom': 'super' })[m]).join(' + ')
  const signatureText = signature === 4 ? '' : ` (${signature}/4)`

  return [
    level,
    data.name,
    data.tier,
    `${Math.round(durationSeconds)} s`,
    `${bpm}${signatureText}`,
    mechanicsText,
    `${trim(travel)} s`,
    `${trim(interval)} s`,
    trim(60 / interval, 0),
    data.lives,
    `${paddleCount} × ${data.paddles.duration} s`,
    compact(score),
    trim(demand)
  ]
}

const header = ['#', 'Name', 'Tier', 'Duration', 'BPM', 'Mechanics', 'Atom travel', 'Spawn interval', 'Atoms/min', 'Lives', 'Paddles (count × life)', 'Max score (approx.)', 'Paddle demand*']
const rows = files.map(analyse)

console.log(`| ${header.join(' | ')} |`)
console.log(`|${header.map(() => '---').join('|')}|`)
for (const row of rows) console.log(`| ${row.join(' | ')} |`)
console.log('\n*Paddle demand: bounces per second needed at the end of the level if no atom is ever captured.')
