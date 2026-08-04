import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertUiDocument } from '@ui-restore/shared'
import { analyzeImage } from './analyze.js'
import { writeSolidPng } from './preprocess.js'

const dir = mkdtempSync(join(tmpdir(), 'ui-restore-vision-'))
const png = join(dir, 'login.png')

await writeSolidPng(png, 375, 812, [255, 255, 255, 255])

const result = await analyzeImage(png, {
  provider: 'mock',
  model: 'mock',
})

assertUiDocument(result.raw)
writeFileSync(join(dir, 'login.json'), JSON.stringify(result.raw, null, 2), 'utf8')

console.log(`[ok] vision mock pipeline → ${join(dir, 'login.json')}`)
