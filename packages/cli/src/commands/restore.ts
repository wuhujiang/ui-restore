import { mkdirSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import {
  generateSharedComponents,
  generateVuePage,
  mergeComponentIndex,
} from '@ui-restore/generator'
import {
  extractSharedComponents,
  formatExtractReport,
  formatIssues,
  parseDocument,
} from '@ui-restore/parser'
import { matchDocumentToIndex, scanComponents } from '@ui-restore/scanner'
import { DSL_VERSION, type UiDocument } from '@ui-restore/shared'
import { analyzeImage, repairRawJson } from '@ui-restore/vision'
import { loadProjectConfig, resolveConfigPath } from '../config.js'

export interface RestoreOptions {
  cwd?: string
  /** Directory used to resolve image path arguments (usually process.cwd()). */
  imageCwd?: string
  provider?: string
  model?: string
  outDir?: string
  /** Skip Vue generation (DSL only). */
  dslOnly?: boolean
  /** Disable cross-page shared component extraction. */
  noExtract?: boolean
}

export async function runRestore(
  images: string[],
  options: RestoreOptions = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const imageCwd = options.imageCwd ?? process.cwd()

  if (!images.length) {
    console.error('请至少提供一张图片，例如: ui-restore restore login.png')
    process.exitCode = 1
    return
  }

  const configPath = resolveConfigPath(cwd)
  const config = await loadProjectConfig(cwd)
  if (!configPath) {
    console.warn('未找到 ui-restore.config.ts，使用默认配置（可用环境变量覆盖 vision）')
  } else {
    console.log(`使用配置: ${configPath}`)
  }

  let provider =
    options.provider ??
    process.env.UI_RESTORE_VISION_PROVIDER ??
    config.vision?.provider ??
    'mock'
  const model =
    options.model ??
    process.env.UI_RESTORE_VISION_MODEL ??
    config.vision?.model ??
    'gpt-4o'

  if (
    provider === 'openai' &&
    !process.env.OPENAI_API_KEY &&
    !options.provider
  ) {
    console.warn('未检测到 OPENAI_API_KEY，自动回退到 mock（可用 --provider openai 强制真实调用）')
    provider = 'mock'
  }

  const dslOutDir = resolve(cwd, options.outDir ?? '.ui-restore/dsl')
  mkdirSync(dslOutDir, { recursive: true })
  mkdirSync(resolve(cwd, '.ui-restore'), { recursive: true })

  const componentsDir = resolve(cwd, config.components)
  const projectIndex = await scanComponents(componentsDir, { projectRoot: cwd })
  writeFileSync(
    resolve(cwd, '.ui-restore/component-index.json'),
    `${JSON.stringify(projectIndex, null, 2)}\n`,
    'utf8',
  )

  console.log(`DSL version: ${DSL_VERSION}`)
  console.log(`Vision provider: ${provider}`)
  console.log(`Vision model: ${model}`)
  console.log(`组件目录: ${componentsDir}（${Object.keys(projectIndex).length} 个）`)
  console.log(`DSL 输出: ${dslOutDir}`)
  console.log(`输入图片数: ${images.length}`)

  const docs: UiDocument[] = []
  let failed = 0

  for (const image of images) {
    const full = resolve(imageCwd, image)
    const name = basename(full)
    console.log(`解析图片中... ${name}`)

    try {
      const analyzed = await analyzeImage(full, { provider, model })
      let parsed = parseDocument(analyzed.raw)

      if (!parsed.ok && provider !== 'mock') {
        console.warn(`Schema 校验失败，尝试修复一次: ${name}`)
        const repaired = await repairRawJson({
          provider,
          model,
          raw: analyzed.raw,
          issues: formatIssues(parsed.issues),
          pageId: analyzed.pageId,
          pageName: analyzed.pageName,
        })
        parsed = parseDocument(repaired)
      }

      if (!parsed.ok || !parsed.data) {
        console.error(`DSL 校验失败: ${name}`)
        console.error(formatIssues(parsed.issues))
        failed += 1
        process.exitCode = 1
        continue
      }

      // Project reuse first — extraction must not recreate project components.
      docs.push(matchDocumentToIndex(parsed.data, projectIndex))
    } catch (error) {
      failed += 1
      process.exitCode = 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(`失败: ${name}`)
      console.error(message)
    }
  }

  if (!docs.length) {
    console.error('没有成功解析的页面，已中止。')
    return
  }

  const shouldExtract = !options.noExtract && docs.length >= 2
  const bundle = shouldExtract
    ? extractSharedComponents(docs)
    : {
        version: DSL_VERSION,
        pages: docs,
        sharedComponents: [],
      }

  if (shouldExtract) {
    console.log('公共组件抽离:')
    console.log(formatExtractReport(bundle))
  }

  writeFileSync(
    resolve(cwd, '.ui-restore/bundle.json'),
    `${JSON.stringify(bundle, null, 2)}\n`,
    'utf8',
  )

  for (const page of bundle.pages) {
    const outFile = resolve(dslOutDir, `${page.page.id}.json`)
    writeFileSync(outFile, `${JSON.stringify(page, null, 2)}\n`, 'utf8')
    console.log(`已写入 DSL: ${outFile}`)
  }

  if (options.dslOnly) {
    if (failed === 0) console.log('Vision → JSON（含抽离）完成。')
    else console.error(`完成，但有 ${failed} 张失败。`)
    return
  }

  let index = projectIndex
  if (bundle.sharedComponents.length) {
    const sharedIndex = await generateSharedComponents(bundle.sharedComponents, {
      projectRoot: cwd,
      sharedDir: config.sharedComponents,
      lang: config.lang,
      style: config.style,
      index: projectIndex,
    })
    index = mergeComponentIndex(projectIndex, sharedIndex)
    for (const name of Object.keys(sharedIndex)) {
      console.log(`已写入 Shared: ${resolve(cwd, sharedIndex[name].path)}`)
    }
  }

  for (const page of bundle.pages) {
    const generated = await generateVuePage(page, {
      projectRoot: cwd,
      pagesDir: config.pages,
      lang: config.lang,
      style: config.style,
      index,
      skipMatch: true,
    })
    console.log(`已写入 Vue: ${generated.filePath}`)
  }

  if (failed === 0) {
    console.log('Vision → JSON → 抽离 → Vue 完成。')
  } else {
    console.error(`完成，但有 ${failed} 张失败。`)
  }
}
