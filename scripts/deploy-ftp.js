// Uploads the production bundle (dist/) to the web server via FTP.
//
// Credentials are read from environment variables, normally loaded from the
// gitignored .env.ftp file (see .env.ftp.example):
//   FTP_HOST, FTP_PORT, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR
//
// Usage:
//   npm run deploy:ftp            upload dist/ to FTP_REMOTE_DIR
//                                 (empties the remote assets/ folder first
//                                 and never uploads .DS_Store files)
//   npm run deploy:ftp -- --test  only log in and list FTP_REMOTE_DIR

import { existsSync, readdirSync, rmSync } from 'node:fs'
import { basename, join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'basic-ftp'

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url))
const testOnly = process.argv.includes('--test')

const required = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD']
const missing = required.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(`Missing ${missing.join(', ')}. Create .env.ftp from .env.ftp.example.`)
  process.exit(1)
}

const remoteDir = process.env.FTP_REMOTE_DIR || '/'

if (!testOnly && !existsSync(DIST_DIR)) {
  console.error('dist/ not found. Run "npm run build" first.')
  process.exit(1)
}

// Deletes macOS Finder metadata files from dist/ so they are never uploaded.
function removeDsStoreFiles (dir) {
  const files = readdirSync(dir, { recursive: true })
    .filter((file) => basename(file) === '.DS_Store')
  for (const file of files) {
    rmSync(join(dir, file))
  }
  return files.length
}

if (!testOnly) {
  const removed = removeDsStoreFiles(DIST_DIR)
  if (removed > 0) {
    console.log(`Removed ${removed} .DS_Store file(s) from dist/`)
  }
}

const client = new Client()

try {
  await client.access({
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT) || 21,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    // Explicit FTPS (TLS) unless FTP_SECURE=false.
    secure: process.env.FTP_SECURE !== 'false',
    secureOptions: { rejectUnauthorized: false },
  })
  console.log(`Connected to ${process.env.FTP_HOST} as ${process.env.FTP_USER}`)

  if (testOnly) {
    const entries = await client.list(remoteDir)
    console.log(`Contents of ${remoteDir}:`)
    for (const entry of entries) {
      console.log(`  ${entry.isDirectory ? 'd' : '-'} ${entry.name}`)
    }
  } else {
    let uploaded = 0
    let lastName = ''
    client.trackProgress((info) => {
      if (info.type === 'upload' && info.name !== lastName) {
        lastName = info.name
        uploaded += 1
        console.log(`  ${info.name}`)
      }
    })
    // Build assets have hashed names, so old ones would otherwise pile up.
    const remoteAssetsDir = posix.join(remoteDir, 'assets')
    await client.ensureDir(remoteAssetsDir)
    await client.clearWorkingDir()
    console.log(`Emptied ${remoteAssetsDir}`)
    await client.remove(posix.join(remoteDir, '.DS_Store'), true)

    await client.cd(remoteDir)
    await client.uploadFromDir(DIST_DIR)
    client.trackProgress()
    console.log(`Uploaded ${uploaded} files from dist/ to ${remoteDir}`)
  }
} catch (error) {
  console.error(`FTP ${testOnly ? 'test' : 'upload'} failed: ${error.message}`)
  process.exitCode = 1
} finally {
  client.close()
}
