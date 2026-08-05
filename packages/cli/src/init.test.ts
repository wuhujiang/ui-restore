import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const target = mkdtempSync(join(tmpdir(), 'ui-restore-init-'))
const cli = resolve(import.meta.dirname, 'index.ts')

try {
  const result = spawnSync(process.execPath, ['--import', 'tsx/esm', cli, 'init', '--cwd', target], {
    cwd: import.meta.dirname,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    console.error(result.stderr)
    process.exit(1)
  }
  if (!existsSync(join(target, 'ui-restore.config.ts'))) {
    console.error(result.stdout)
    process.exit(1)
  }
} finally {
  rmSync(target, { recursive: true, force: true })
}

console.log('[ok] init writes config to --cwd')
