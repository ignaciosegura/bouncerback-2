// Validates level files against docs/level-file-schema.json.
// Usage: npm run validate:levels [-- file.json ...]   (no arguments: every src/levels/*.json)
import { readFileSync, readdirSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const levelsDir = join(root, 'src/levels')

const schema = JSON.parse(readFileSync(join(root, 'docs/level-file-schema.json'), 'utf8'))
const validate = new Ajv({ allErrors: true }).compile(schema)

const args = process.argv.slice(2)
const files = args.length > 0
  ? args.map((file) => resolve(file))
  : readdirSync(levelsDir).filter((file) => file.endsWith('.json')).sort().map((file) => join(levelsDir, file))

let failures = 0
for (const file of files) {
  const name = basename(file)
  let level
  try {
    level = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`)
    failures++
    continue
  }
  if (validate(level)) {
    console.log(`OK   ${name}`)
  } else {
    console.error(`FAIL ${name}`)
    for (const error of validate.errors) {
      const extra = error.params.additionalProperty ? ` (${error.params.additionalProperty})` : ''
      console.error(`       ${error.dataPath || '/'} ${error.message}${extra}`)
    }
    failures++
  }
}

console.log(failures === 0 ? `\nAll ${files.length} level file(s) valid.` : `\n${failures} of ${files.length} level file(s) invalid.`)
process.exit(failures === 0 ? 0 : 1)
