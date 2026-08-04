import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DSL_VERSION, type UiDocument } from '@ui-restore/shared'
import { MockAutofixProvider } from './revise/mock.js'
import { runAutofixLoop } from './loop.js'
import { documentToHtml } from './render-html.js'
import { takeScreenshot } from './screenshot.js'
import { compareImages } from './diff.js'

const dir = join(tmpdir(), `ui-restore-autofix-${Date.now()}`)
mkdirSync(dir, { recursive: true })

const good: UiDocument = {
  version: DSL_VERSION,
  page: {
    id: 'demo',
    name: 'Demo',
    width: 200,
    height: 200,
    background: '#FFFFFF',
    children: [
      {
        id: 'n_box',
        type: 'View',
        box: { x: 20, y: 20, width: 160, height: 160 },
        style: { background: '#1677FF', borderRadius: 8 },
        children: [],
      },
    ],
  },
}

const bad: UiDocument = {
  version: DSL_VERSION,
  page: {
    id: 'demo',
    name: 'Demo',
    width: 200,
    height: 200,
    background: '#FFFFFF',
    children: [
      {
        id: 'n_box',
        type: 'View',
        box: { x: 20, y: 20, width: 160, height: 160 },
        style: { background: '#FF0000', borderRadius: 8 },
        children: [],
      },
    ],
  },
}

const refPath = join(dir, 'reference.png')
await takeScreenshot({
  width: 200,
  height: 200,
  outPath: refPath,
  html: documentToHtml(good),
})

const badShot = join(dir, 'bad.png')
await takeScreenshot({
  width: 200,
  height: 200,
  outPath: badShot,
  html: documentToHtml(bad),
})

const before = await compareImages(refPath, badShot)
if (before.score >= 0.95) {
  console.error('expected low initial score for mismatched colors', before.score)
  process.exit(1)
}

const result = await runAutofixLoop({
  document: bad,
  referencePath: refPath,
  workDir: join(dir, 'work'),
  threshold: 0.9,
  maxRounds: 3,
  provider: new MockAutofixProvider(),
})

writeFileSync(join(dir, 'final.json'), JSON.stringify(result.document, null, 2))

if (result.finalScore <= result.initialScore) {
  console.error('expected score improvement', result)
  process.exit(1)
}
if (result.finalScore < 0.9) {
  console.error('expected to approach threshold', result)
  process.exit(1)
}

rmSync(dir, { recursive: true, force: true })
console.log(
  `[ok] autofix improved ${(result.initialScore * 100).toFixed(1)}% → ${(result.finalScore * 100).toFixed(1)}%`,
)
