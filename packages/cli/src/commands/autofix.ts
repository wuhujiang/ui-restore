import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createAutofixProvider,
  formatScore,
  runAutofixLoop,
} from '@ui-restore/autofix'
import { generateVuePage } from '@ui-restore/generator'
import { parseDocument } from '@ui-restore/parser'
import { scanComponents } from '@ui-restore/scanner'
import type { UiDocument } from '@ui-restore/shared'
import { loadProjectConfig, resolveConfigPath } from '../config.js'
import { resolveAutofixPageUrl } from './autofix-url.js'

export interface AutofixCommandOptions {
  cwd?: string
  reference: string
  threshold?: number
  maxRounds?: number
  provider?: string
  model?: string
  url?: string
  /** Resolve reference path against this directory (usually process.cwd()). */
  referenceCwd?: string
}

export async function runAutofixCommand(
  pageId: string,
  options: AutofixCommandOptions,
): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const referenceCwd = options.referenceCwd ?? process.cwd()
  const configPath = resolveConfigPath(cwd)
  const config = await loadProjectConfig(cwd)
  let pageUrl: string | null
  try {
    pageUrl = resolveAutofixPageUrl(options.url, config.entry?.devServer)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }

  if (!configPath) {
    console.warn('未找到 ui-restore.config.ts，使用默认配置')
  } else {
    console.log(`使用配置: ${configPath}`)
  }

  if (!pageUrl) {
    console.error('AutoFix 需要已运行的目标页面 URL。请传入 --url <页面 URL>，或在 ui-restore.config.ts 的 entry.devServer 中配置。')
    process.exitCode = 1
    return
  }

  const dslPath = resolve(cwd, '.ui-restore/dsl', `${pageId}.json`)
  if (!existsSync(dslPath)) {
    console.error(`找不到 DSL: ${dslPath}`)
    console.error('请先运行: ui-restore restore <image>')
    process.exitCode = 1
    return
  }

  const referencePath = resolve(referenceCwd, options.reference)
  if (!existsSync(referencePath)) {
    console.error(`找不到参考图: ${referencePath}`)
    process.exitCode = 1
    return
  }

  const raw = JSON.parse(readFileSync(dslPath, 'utf8')) as unknown
  const parsed = parseDocument(raw)
  if (!parsed.ok || !parsed.data) {
    console.error('DSL 无效，无法 AutoFix')
    process.exitCode = 1
    return
  }

  let providerName =
    options.provider ??
    process.env.UI_RESTORE_AUTOFIX_PROVIDER ??
    process.env.UI_RESTORE_VISION_PROVIDER ??
    'mock'
  const model =
    options.model ??
    process.env.UI_RESTORE_AUTOFIX_MODEL ??
    process.env.UI_RESTORE_VISION_MODEL ??
    config.vision?.model ??
    'gpt-4o'

  if (
    providerName === 'openai' &&
    !process.env.OPENAI_API_KEY &&
    !options.provider
  ) {
    console.warn('未检测到 OPENAI_API_KEY，AutoFix 回退到 mock')
    providerName = 'mock'
  }

  const threshold = options.threshold ?? config.autofix?.threshold ?? 0.98
  const maxRounds = options.maxRounds ?? config.autofix?.maxRounds ?? 5
  const workDir = resolve(cwd, '.ui-restore/autofix', pageId)
  mkdirSync(workDir, { recursive: true })

  const projectIndex = await scanComponents(resolve(cwd, config.components), {
    projectRoot: cwd,
  })

  console.log(`页面: ${pageId}`)
  console.log(`参考图: ${referencePath}`)
  console.log(`Provider: ${providerName}`)
  console.log(`页面 URL: ${pageUrl}`)
  console.log(`阈值: ${formatScore(threshold)} / maxRounds=${maxRounds}`)
  console.log(`产物目录: ${workDir}`)

  const provider = createAutofixProvider({ provider: providerName, model })

  const result = await runAutofixLoop({
    document: parsed.data,
    referencePath,
    workDir,
    threshold,
    maxRounds,
    provider,
    url: pageUrl,
    onDocumentUpdated: async (doc: UiDocument) => {
      writeFileSync(dslPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
      await generateVuePage(doc, {
        projectRoot: cwd,
        pagesDir: config.pages,
        lang: config.lang,
        style: config.style,
        index: projectIndex,
        skipMatch: true,
      })
    },
  })

  // Persist final DSL + Vue even if already updated in loop
  writeFileSync(dslPath, `${JSON.stringify(result.document, null, 2)}\n`, 'utf8')
  const generated = await generateVuePage(result.document, {
    projectRoot: cwd,
    pagesDir: config.pages,
    lang: config.lang,
    style: config.style,
    index: projectIndex,
    skipMatch: true,
  })

  console.log(
    `相似度: ${formatScore(result.initialScore)} → ${formatScore(result.finalScore)}（${result.rounds} rounds）`,
  )
  console.log(`DSL: ${dslPath}`)
  console.log(`Vue: ${generated.filePath}`)
  if (result.reachedThreshold) {
    console.log('已达到阈值阈值。')
  } else {
    console.log('未达阈值，可提高 maxRounds 或换用更强的 provider。')
  }
}
