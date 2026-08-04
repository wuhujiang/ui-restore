import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'
import type { DiffResult } from './types.js'

/**
 * Pixel similarity score in [0, 1] using mean absolute RGB error.
 * Also writes a red heatmap overlay when outDiffPath is provided.
 */
export async function compareImages(
  referencePath: string,
  currentPath: string,
  outDiffPath?: string,
): Promise<DiffResult> {
  const refMeta = await sharp(referencePath).metadata()
  const width = refMeta.width ?? 0
  const height = refMeta.height ?? 0
  if (!width || !height) {
    throw new Error('[@ui-restore/autofix] Invalid reference image size')
  }

  const ref = await sharp(referencePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const cur = await sharp(currentPath)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const a = ref.data
  const b = cur.data
  const pixels = width * height
  let sum = 0
  const heat = Buffer.alloc(pixels * 4)

  for (let i = 0; i < pixels; i += 1) {
    const o = i * 4
    const dr = Math.abs(a[o] - b[o])
    const dg = Math.abs(a[o + 1] - b[o + 1])
    const db = Math.abs(a[o + 2] - b[o + 2])
    sum += dr + dg + db
    const mag = Math.min(255, Math.round((dr + dg + db) / 3))
    heat[o] = mag
    heat[o + 1] = 0
    heat[o + 2] = 0
    heat[o + 3] = 255
  }

  const score = 1 - sum / (pixels * 3 * 255)
  const result: DiffResult = {
    score: Math.max(0, Math.min(1, score)),
    width,
    height,
  }

  if (outDiffPath) {
    mkdirSync(dirname(outDiffPath), { recursive: true })
    await sharp(heat, { raw: { width, height, channels: 4 } }).png().toFile(outDiffPath)
    result.diffPath = outDiffPath
  }

  return result
}

export function formatScore(score: number): string {
  return `${(score * 100).toFixed(2)}%`
}
