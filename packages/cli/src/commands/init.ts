import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defaultConfig, renderConfigTs, resolveConfigPath } from '../config.js'

export interface InitOptions {
  force?: boolean
  lang?: 'ts' | 'js'
  cwd?: string
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const existing = resolveConfigPath(cwd)
  const outPath = resolve(cwd, 'ui-restore.config.ts')

  if (existing && !options.force) {
    console.log(`配置已存在: ${existing}`)
    console.log('如需覆盖，请使用: ui-restore init --force')
    return
  }

  const config = defaultConfig()
  if (options.lang) {
    config.lang = options.lang
  }

  writeFileSync(outPath, renderConfigTs(config), 'utf8')
  console.log(`已生成: ${outPath}`)
  console.log('框架: Vue 3')
  console.log(`语言: ${config.lang}`)
  console.log(`组件目录: ${config.components}`)
  console.log(`页面目录: ${config.pages}`)
}
