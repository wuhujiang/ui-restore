import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import sharp from 'sharp'
import type { PreprocessedImage } from './types.js'

const MIME_BY_EXT: Record<string, PreprocessedImage['mimeType']> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export interface PreprocessOptions {
  /** Longest edge limit; keeps aspect ratio. */
  maxEdge?: number
}

/**
 * Normalize design images for Vision APIs: read metadata, optionally downscale, emit data URL.
 */
export async function preprocessImage(
  imagePath: string,
  options: PreprocessOptions = {},
): Promise<PreprocessedImage> {
  const maxEdge = options.maxEdge ?? 2048
  const ext = extname(imagePath).toLowerCase()
  const preferredMime = MIME_BY_EXT[ext] ?? 'image/png'

  const input = sharp(imagePath, { failOn: 'none' })
  const meta = await input.metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (!width || !height) {
    throw new Error(`[@ui-restore/vision] Cannot read image size: ${imagePath}`)
  }

  let pipeline = sharp(imagePath, { failOn: 'none' })
  const longEdge = Math.max(width, height)
  if (longEdge > maxEdge) {
    pipeline = pipeline.resize({
      width: width >= height ? maxEdge : undefined,
      height: height > width ? maxEdge : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Prefer PNG for lossless UI screenshots; JPEG for photos if source is jpeg.
  const useJpeg = preferredMime === 'image/jpeg'
  const buffer = useJpeg
    ? await pipeline.jpeg({ quality: 85 }).toBuffer()
    : await pipeline.png().toBuffer()

  const outMeta = await sharp(buffer).metadata()
  const mimeType: PreprocessedImage['mimeType'] = useJpeg ? 'image/jpeg' : 'image/png'
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`

  return {
    path: imagePath,
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
    mimeType,
    dataUrl,
    byteLength: buffer.byteLength,
  }
}

/** Tiny helper for tests without shipping binary fixtures. */
export async function writeSolidPng(
  outPath: string,
  width: number,
  height: number,
  rgba: [number, number, number, number] = [255, 255, 255, 255],
): Promise<void> {
  const channels = 4
  const data = Buffer.alloc(width * height * channels)
  for (let i = 0; i < width * height; i += 1) {
    const o = i * channels
    data[o] = rgba[0]
    data[o + 1] = rgba[1]
    data[o + 2] = rgba[2]
    data[o + 3] = rgba[3]
  }
  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath)
}

export function readRawBytes(imagePath: string): Buffer {
  return readFileSync(imagePath)
}
