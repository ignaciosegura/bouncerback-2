// Copies an unpacked desktop build to the Steam Deck over SSH (see "Copying builds to the Steam Deck over SSH" in docs/desktop-build.md).
//
// Usage: node scripts/deploy-deck.js <win|linux>
// The npm scripts desktop:deck:win and desktop:deck:linux build first, then run this.
//
// Environment (optional):
//   DECK_HOST  ssh destination, default deck@steamdeck.local
//   DECK_DIR   parent folder on the Deck, default Games (relative to the deck user's home)

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const TARGETS = {
  win: { source: 'release/win-unpacked', folder: 'Bouncerback-win' },
  linux: { source: 'release/linux-unpacked', folder: 'Bouncerback-linux' },
}

const target = TARGETS[process.argv[2]]
if (!target) {
  console.error('Usage: node scripts/deploy-deck.js <win|linux>')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, target.source)
if (!existsSync(source)) {
  console.error(`${target.source} not found: build it first (npm run desktop:build:${process.argv[2]}).`)
  process.exit(1)
}

const host = process.env.DECK_HOST || 'deck@steamdeck.local'
const remoteDir = `${process.env.DECK_DIR || 'Games'}/${target.folder}`

function run (cmd, args) {
  console.log(`> ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`${cmd} failed (exit code ${result.status ?? result.signal}).`)
    process.exit(1)
  }
}

// Fail fast when the Deck can't be reached (asleep, SSH off, name not found) instead of hanging.
const SSH_OPTIONS = ['-o', 'ConnectTimeout=10']

// The Mac's rsync (openrsync) has no --mkpath, so create the folder first.
run('ssh', [...SSH_OPTIONS, host, `mkdir -p '${remoteDir}'`])
// --delete keeps the Deck's folder identical to the build (it only touches that folder).
run('rsync', ['-a', '--delete', '--progress', '-e', `ssh ${SSH_OPTIONS.join(' ')}`, `${source}/`, `${host}:${remoteDir}/`])

console.log(`Copied to ${host}:~/${remoteDir}/`)
