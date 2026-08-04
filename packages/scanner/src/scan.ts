import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join, relative, resolve } from 'node:path'
import { parse as parseSfc } from '@vue/compiler-sfc'
import type { ComponentIndex, ComponentIndexEntry } from './types.js'

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function walkVueFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
      out.push(...walkVueFiles(full))
    } else if (st.isFile() && extname(name) === '.vue') {
      out.push(full)
    }
  }
  return out
}

function extractProps(scriptContent: string | null | undefined): string[] {
  if (!scriptContent) return []
  const props = new Set<string>()

  const arrayMatch = scriptContent.match(/defineProps\s*\(\s*\[([^\]]*)\]/s)
  if (arrayMatch?.[1]) {
    for (const part of arrayMatch[1].split(',')) {
      const m = part.match(/['"]([\w-]+)['"]/)
      if (m?.[1]) props.add(m[1])
    }
  }

  const objectMatch = scriptContent.match(/defineProps\s*\(\s*\{([\s\S]*?)\}\s*\)/)
  if (objectMatch?.[1]) {
    for (const m of objectMatch[1].matchAll(/^\s*([A-Za-z_]\w*)\s*:/gm)) {
      props.add(m[1])
    }
  }

  const typeMatch = scriptContent.match(/defineProps\s*<\s*\{([\s\S]*?)\}\s*>/)
  if (typeMatch?.[1]) {
    for (const m of typeMatch[1].matchAll(/^\s*([A-Za-z_]\w*)\s*[?:]/gm)) {
      props.add(m[1])
    }
  }

  const withDefaults = scriptContent.match(
    /defineProps\s*<\s*\{([\s\S]*?)\}\s*>\s*\(/,
  )
  if (withDefaults?.[1]) {
    for (const m of withDefaults[1].matchAll(/^\s*([A-Za-z_]\w*)\s*[?:]/gm)) {
      props.add(m[1])
    }
  }

  return [...props]
}

function resolveComponentName(filePath: string, source: string): string {
  const nameFromFile = basename(filePath, '.vue')
  if (nameFromFile !== 'index' && nameFromFile !== 'Index') {
    return nameFromFile
  }

  const defineOptions = source.match(/defineOptions\s*\(\s*\{[^}]*name\s*:\s*['"]([\w-]+)['"]/)
  if (defineOptions?.[1]) return defineOptions[1]

  const exportName = source.match(/name\s*:\s*['"]([\w-]+)['"]/)
  if (exportName?.[1]) return exportName[1]

  const parent = basename(resolve(filePath, '..'))
  return parent || nameFromFile
}

function scanFile(filePath: string, projectRoot: string): ComponentIndexEntry | null {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor, errors } = parseSfc(source, { filename: filePath })
  if (errors.length) {
    // Still index by filename; props may be incomplete.
  }

  const script =
    descriptor.scriptSetup?.content ?? descriptor.script?.content ?? ''
  const name = resolveComponentName(filePath, source)
  const rel = toPosix(relative(projectRoot, filePath))

  return {
    name,
    path: rel,
    export: 'default',
    props: extractProps(script),
  }
}

export interface ScanComponentsOptions {
  /** Project root used to compute relative paths. Default: parent of componentsDir heuristics. */
  projectRoot?: string
}

/**
 * Scan a components directory for Vue SFCs and build a ComponentIndex.
 */
export async function scanComponents(
  componentsDir: string,
  options: ScanComponentsOptions = {},
): Promise<ComponentIndex> {
  const absComponents = resolve(componentsDir)
  const projectRoot = resolve(options.projectRoot ?? resolve(absComponents, '..', '..'))
  const files = walkVueFiles(absComponents)
  const index: ComponentIndex = {}

  for (const file of files) {
    const entry = scanFile(file, projectRoot)
    if (!entry) continue
    // Later files with same name overwrite earlier — last wins.
    index[entry.name] = entry
  }

  return index
}

export const scannerPackage = '@ui-restore/scanner' as const
