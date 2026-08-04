import { basename, parse as parsePath } from 'node:path'
import { preprocessImage } from './preprocess.js'
import { createVisionProvider } from './providers/create.js'
import type { AnalyzeImageOptions, PreprocessedImage } from './types.js'

export interface AnalyzeImageResult {
  raw: unknown
  image: PreprocessedImage
  pageId: string
  pageName: string
  provider: string
}

function toPageId(imagePath: string, explicit?: string): string {
  if (explicit) return explicit
  const base = parsePath(basename(imagePath)).name
  return base.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase() || 'page'
}

function toPageName(pageId: string, explicit?: string): string {
  if (explicit) return explicit
  return pageId
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || 'Page'
}

/**
 * Image → raw model JSON (not yet schema-validated).
 */
export async function analyzeImage(
  imagePath: string,
  options: AnalyzeImageOptions,
): Promise<AnalyzeImageResult> {
  const image = await preprocessImage(imagePath, { maxEdge: options.maxEdge })
  const pageId = toPageId(imagePath, options.pageId)
  const pageName = toPageName(pageId, options.pageName)
  const provider = createVisionProvider(options)

  const raw = await provider.analyze({ image, pageId, pageName })

  return {
    raw,
    image,
    pageId,
    pageName,
    provider: provider.id,
  }
}

export async function repairRawJson(
  options: AnalyzeImageOptions & {
    raw: unknown
    issues: string
    pageId: string
    pageName: string
  },
): Promise<unknown> {
  const provider = createVisionProvider(options)
  if (!provider.repair) {
    throw new Error(`[@ui-restore/vision] Provider "${provider.id}" does not support repair`)
  }
  return provider.repair({
    raw: options.raw,
    issues: options.issues,
    pageId: options.pageId,
    pageName: options.pageName,
  })
}
