import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { createJiti } from 'jiti'
import type { UiRestoreConfig } from '@ui-restore/shared'

const CONFIG_CANDIDATES = [
  'ui-restore.config.ts',
  'ui-restore.config.mts',
  'ui-restore.config.js',
  'ui-restore.config.mjs',
] as const

export function resolveConfigPath(cwd = process.cwd()): string | null {
  for (const name of CONFIG_CANDIDATES) {
    const full = resolve(cwd, name)
    if (existsSync(full)) return full
  }
  return null
}

export function defaultConfig(): UiRestoreConfig {
  const provider = process.env.UI_RESTORE_VISION_PROVIDER ?? 'openai'
  const model = process.env.UI_RESTORE_VISION_MODEL ?? 'gpt-4o'

  return {
    framework: 'vue',
    lang: 'ts',
    style: 'css',
    components: 'src/components',
    pages: 'src/pages',
    sharedComponents: 'src/components/restored',
    vision: {
      // Pluggable — not locked to a vendor. Override via env or edit this file.
      provider,
      model,
    },
    autofix: {
      threshold: 0.98,
      maxRounds: 5,
    },
  }
}

export function renderConfigTs(config: UiRestoreConfig): string {
  const lang = config.lang
  const style = config.style
  const provider = config.vision?.provider ?? 'openai'
  const model = config.vision?.model ?? 'gpt-4o'
  const threshold = config.autofix?.threshold ?? 0.98
  const maxRounds = config.autofix?.maxRounds ?? 5

  return `import type { UiRestoreConfig } from '@ui-restore/shared'

/**
 * ui-restore project config.
 * Vision provider/model are pluggable - override with:
 *   UI_RESTORE_VISION_PROVIDER / UI_RESTORE_VISION_MODEL
 * Offline pipeline test: provider: 'mock'
 */
const config: UiRestoreConfig = {
  framework: 'vue',
  lang: '${lang}',
  style: '${style}',
  components: '${config.components}',
  pages: '${config.pages}',
  sharedComponents: '${config.sharedComponents}',
  vision: {
    provider: '${provider}',
    model: '${model}',
  },
  autofix: {
    threshold: ${threshold},
    maxRounds: ${maxRounds},
  },
}

export default config
`
}

function pickConfig(mod: unknown): UiRestoreConfig {
  if (!mod || typeof mod !== 'object') return defaultConfig()
  const record = mod as { default?: unknown }
  const value = 'default' in record ? record.default : mod
  if (!value || typeof value !== 'object') return defaultConfig()
  return { ...defaultConfig(), ...(value as UiRestoreConfig) }
}

export async function loadProjectConfig(cwd = process.cwd()): Promise<UiRestoreConfig> {
  const path = resolveConfigPath(cwd)
  if (!path) return defaultConfig()

  if (path.endsWith('.ts') || path.endsWith('.mts')) {
    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
    })
    const mod = await jiti.import(path)
    return pickConfig(mod)
  }

  const mod = await import(pathToFileURL(path).href)
  return pickConfig(mod)
}
