import sharp from 'sharp'
import { parseDocument } from '@ui-restore/parser'
import type { UiDocument, UiNode } from '@ui-restore/shared'
import type { AutofixProvider, ReviseInput } from '../types.js'

function cloneDoc(doc: UiDocument): UiDocument {
  return JSON.parse(JSON.stringify(doc)) as UiDocument
}

async function averageColor(
  imagePath: string,
  box: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number,
): Promise<string | null> {
  const meta = await sharp(imagePath).metadata()
  const iw = meta.width ?? pageWidth
  const ih = meta.height ?? pageHeight
  const sx = iw / pageWidth
  const sy = ih / pageHeight
  const left = Math.max(0, Math.round(box.x * sx))
  const top = Math.max(0, Math.round(box.y * sy))
  const width = Math.max(1, Math.min(iw - left, Math.round(box.width * sx)))
  const height = Math.max(1, Math.min(ih - top, Math.round(box.height * sy)))
  if (width <= 0 || height <= 0) return null

  try {
    const { data } = await sharp(imagePath)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    let r = 0
    let g = 0
    let b = 0
    const n = (data.length / 4) | 0
    if (!n) return null
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    const toHex = (v: number) =>
      Math.round(v / n)
        .toString(16)
        .padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
  } catch {
    return null
  }
}

async function reviseNodeColors(
  node: UiNode,
  referencePath: string,
  pageWidth: number,
  pageHeight: number,
): Promise<void> {
  const color = await averageColor(referencePath, node.box, pageWidth, pageHeight)
  if (color) {
    node.style = { ...(node.style ?? {}), background: color }
  }
  if (node.children?.length) {
    for (const child of node.children) {
      await reviseNodeColors(child, referencePath, pageWidth, pageHeight)
    }
  }
}

/**
 * Offline reviser: samples reference colors into node backgrounds.
 * Deterministic and improves score when colors are the main mismatch.
 */
export class MockAutofixProvider implements AutofixProvider {
  readonly id = 'mock'

  async revise(input: ReviseInput): Promise<UiDocument> {
    const next = cloneDoc(input.document)
    for (const child of next.page.children) {
      await reviseNodeColors(
        child,
        input.referencePath,
        next.page.width,
        next.page.height,
      )
    }
    const parsed = parseDocument(next)
    if (!parsed.ok || !parsed.data) {
      throw new Error(`[@ui-restore/autofix] mock revise produced invalid DSL`)
    }
    return parsed.data
  }
}
