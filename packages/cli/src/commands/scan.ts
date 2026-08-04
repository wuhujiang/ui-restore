import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { scanComponents } from '@ui-restore/scanner'
import { loadProjectConfig, resolveConfigPath } from '../config.js'

export interface ScanOptions {
  cwd?: string
}

export async function runScan(options: ScanOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const configPath = resolveConfigPath(cwd)
  const config = await loadProjectConfig(cwd)

  if (!configPath) {
    console.warn('未找到 ui-restore.config.ts，使用默认 components 路径')
  }

  const componentsDir = resolve(cwd, config.components)
  const index = await scanComponents(componentsDir, { projectRoot: cwd })
  const outDir = resolve(cwd, '.ui-restore')
  mkdirSync(outDir, { recursive: true })
  const outFile = resolve(outDir, 'component-index.json')
  writeFileSync(outFile, `${JSON.stringify(index, null, 2)}\n`, 'utf8')

  const names = Object.keys(index).sort()
  console.log(`扫描目录: ${componentsDir}`)
  console.log(`组件数: ${names.length}`)
  for (const name of names) {
    const entry = index[name]
    console.log(`- ${name} (${entry.path}) props=[${entry.props.join(', ')}]`)
  }
  console.log(`已写入: ${outFile}`)
}
