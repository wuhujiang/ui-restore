import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertUiDocument } from './validate.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const samplePath = join(__dirname, '../../samples/login.json')

const raw = JSON.parse(readFileSync(samplePath, 'utf8')) as unknown
assertUiDocument(raw)

console.log(`[ok] DSL sample valid: ${samplePath}`)
