import { DSL_VERSION, type UiDocument, type UiNode } from '@ui-restore/shared'

function roundInt(n: unknown, fallback = 0): number {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.round(v)
}

function asRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
}

function normalizeNode(raw: unknown, indexPath: string): UiNode {
  const node = asRecord(raw)
  const boxRaw = asRecord(node.box)
  const id =
    typeof node.id === 'string' && node.id.trim()
      ? node.id.trim()
      : `n_${indexPath.replace(/\./g, '_')}`

  const childrenRaw = Array.isArray(node.children) ? node.children : []
  const children = childrenRaw.map((child, i) => normalizeNode(child, `${indexPath}.${i}`))

  const type = typeof node.type === 'string' ? node.type : 'View'

  return {
    id,
    type: type as UiNode['type'],
    name: typeof node.name === 'string' ? node.name : undefined,
    box: {
      x: roundInt(boxRaw.x),
      y: roundInt(boxRaw.y),
      width: Math.max(0, roundInt(boxRaw.width)),
      height: Math.max(0, roundInt(boxRaw.height)),
    },
    text: node.text === undefined ? undefined : (node.text as string | null),
    style:
      node.style && typeof node.style === 'object'
        ? (node.style as UiNode['style'])
        : undefined,
    props:
      node.props && typeof node.props === 'object'
        ? (node.props as Record<string, unknown>)
        : undefined,
    children,
    componentRef:
      node.componentRef === null
        ? null
        : node.componentRef && typeof node.componentRef === 'object'
          ? (node.componentRef as UiNode['componentRef'])
          : undefined,
    extractCandidate:
      typeof node.extractCandidate === 'boolean' ? node.extractCandidate : undefined,
  }
}

/**
 * Best-effort normalize before schema validation:
 * - force version
 * - ensure page/children shapes
 * - round box numbers
 * - fill missing ids
 */
export function normalizeUiDocument(input: unknown): unknown {
  const root = asRecord(input)
  const page = asRecord(root.page)
  const childrenRaw = Array.isArray(page.children) ? page.children : []

  const doc: UiDocument = {
    version: DSL_VERSION,
    page: {
      id: typeof page.id === 'string' && page.id ? page.id : 'page',
      name: typeof page.name === 'string' && page.name ? page.name : 'Page',
      width: Math.max(1, roundInt(page.width, 375)),
      height: Math.max(1, roundInt(page.height, 812)),
      background: typeof page.background === 'string' ? page.background : undefined,
      children: childrenRaw.map((child, i) => normalizeNode(child, String(i))),
    },
    components: Array.isArray(root.components)
      ? (root.components as UiDocument['components'])
      : [],
  }

  return doc
}
