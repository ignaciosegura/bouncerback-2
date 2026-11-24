// Copies the version from package.json into the Android app's versionName (android/app/build.gradle).
// Usage: npm run version:android   (optional: node scripts/sync-android-version.js path/to/build.gradle)
// Only versionName changes. versionCode is left alone: Google Play needs it to go up on every upload, so it is set by hand.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const packageFile = resolve(root, 'package.json')
const gradleFile = resolve(process.argv[2] ?? resolve(root, 'android/app/build.gradle'))

const { version } = JSON.parse(readFileSync(packageFile, 'utf8'))
if (!version) throw new Error(`No "version" field in ${packageFile}`)

const gradle = readFileSync(gradleFile, 'utf8')
const pattern = /^(\s*versionName\s+)"[^"]*"/m
if (!pattern.test(gradle)) throw new Error(`No versionName line found in ${gradleFile}`)

const updated = gradle.replace(pattern, `$1"${version}"`)
if (updated === gradle) {
  console.log(`versionName already ${version}`)
} else {
  writeFileSync(gradleFile, updated)
  console.log(`versionName set to ${version} in ${gradleFile}`)
}
