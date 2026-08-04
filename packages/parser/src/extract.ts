import { createHash } from 'node:crypto'
import {
  DSL_VERSION,
  type RestoreBundle,
  type UiComponentDef,
  type UiDocument,
  type UiNode,
} from '@ui-restore/shared'

export interface ExtractSharedOptions {
  /** Minimum distinct pages a signature must appear on. Default 2. */
  minPages?: number
  /** Ignore text when comparing structure (more aggressive matching). Default true. */
  ignoreText?: boolean
}

interface Candidate {
  pageId: string
  path: number[]
  node: UiNode
  signature: string
}

function bucket(n: number): number {
  return Math.round(n / 8) * 8
}

function stableStyle(style: UiNode['style']): Record<string, string | number> {
  if (!style) return {}
  const out: Record<string, string | number> = {}
  for (const key of Object.keys(style).sort()) {
    const v = style[key]
    if (v !== undefined) out[key] = v
  }
  return out
}

function stableProps(props: UiNode['props']): Record<string, unknown> {
  if (!props) return {}
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props).sort()) {
    out[key] = props[key]
  }
  return out
}

/**
 * Structural signature: type + size buckets + style/props + children.
 * Ignores id and absolute x/y so the same block can match across pages.
 */
export function nodeSignature(node: UiNode, ignoreText = true): string {
  const children = (node.children ?? []).map((c) => nodeSignature(c, ignoreText))
  const payload = {
    type: node.type,
    size: `${bucket(node.box.width)}x${bucket(node.box.height)}`,
    style: stableStyle(node.style),
    props: stableProps(node.props),
    text: ignoreText ? null : (node.text ?? null),
    children,
  }
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 16)
}

function cloneNode(node: UiNode): UiNode {
  return {
    ...node,
    box: { ...node.box },
    style: node.style ? { ...node.style } : undefined,
    props: node.props ? { ...node.props } : undefined,
    componentRef: node.componentRef ? { ...node.componentRef } : node.componentRef,
    children: node.children?.map(cloneNode),
  }
}

function normalizeRoot(node: UiNode): UiNode {
  const root = cloneNode(node)
  const ox = root.box.x
  const oy = root.box.y
  const shift = (n: UiNode, isRoot: boolean) => {
    if (isRoot) {
      n.box = { ...n.box, x: 0, y: 0 }
    } else {
      n.box = { ...n.box, x: n.box.x - ox, y: n.box.y - oy }
    }
    n.children?.forEach((c) => shift(c, false))
  }
  shift(root, true)
  return root
}

function area(node: UiNode): number {
  return Math.max(0, node.box.width) * Math.max(0, node.box.height)
}

function isExtractable(node: UiNode): boolean {
  if (node.componentRef?.from === 'project' || node.componentRef?.from === 'shared') {
    return false
  }
  if (node.box.width < 40 || node.box.height < 24) return false
  if (node.extractCandidate) return true
  if (node.type === 'View' && (node.children?.length ?? 0) > 0) return true
  // Repeated composite blocks marked only by structure (multi-child non-leaf)
  if ((node.children?.length ?? 0) >= 2) return true
  return false
}

function collectCandidates(
  pageId: string,
  nodes: UiNode[],
  ignoreText: boolean,
  path: number[] = [],
  out: Candidate[] = [],
): Candidate[] {
  nodes.forEach((node, index) => {
    const nextPath = [...path, index]
    if (isExtractable(node)) {
      out.push({
        pageId,
        path: nextPath,
        node,
        signature: nodeSignature(node, ignoreText),
      })
    }
    if (node.children?.length) {
      collectCandidates(pageId, node.children, ignoreText, nextPath, out)
    }
  })
  return out
}

function getAtPath(roots: UiNode[], path: number[]): UiNode | null {
  let list = roots
  let node: UiNode | null = null
  for (let i = 0; i < path.length; i += 1) {
    node = list[path[i]] ?? null
    if (!node) return null
    list = node.children ?? []
  }
  return node
}

function setAtPath(roots: UiNode[], path: number[], next: UiNode): void {
  if (path.length === 1) {
    roots[path[0]] = next
    return
  }
  const parentPath = path.slice(0, -1)
  const parent = getAtPath(roots, parentPath)
  if (!parent?.children) return
  parent.children[path[path.length - 1]] = next
}

function pathPrefixOf(prefix: number[], full: number[]): boolean {
  if (prefix.length >= full.length) return false
  return prefix.every((v, i) => full[i] === v)
}

function toPascal(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, ' ').trim()
  if (!cleaned) return 'SharedBlock'
  return cleaned
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

function pickName(node: UiNode, used: Set<string>, signature: string): string {
  const raw = node.name ? toPascal(node.name) : `Shared${node.type}`
  let base = /^[A-Z]/.test(raw) ? raw : toPascal(raw)
  if (!base) base = `Shared${node.type}`
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  const suffix = signature.slice(0, 4)
  let candidate = `${base}${suffix}`
  let i = 2
  while (used.has(candidate)) {
    candidate = `${base}${suffix}${i}`
    i += 1
  }
  used.add(candidate)
  return candidate
}

/**
 * Extract repeated subtrees across pages into sharedComponents (DSL layer).
 * Prefer project-bound nodes (skipped). Requires appearance on >= minPages.
 */
export function extractSharedComponents(
  docs: UiDocument[],
  options: ExtractSharedOptions = {},
): RestoreBundle {
  const minPages = options.minPages ?? 2
  const ignoreText = options.ignoreText ?? true

  if (docs.length < minPages) {
    return {
      version: DSL_VERSION,
      pages: docs.map((d) => ({
        ...d,
        page: { ...d.page, children: d.page.children.map(cloneNode) },
      })),
      sharedComponents: [],
    }
  }

  const pages = docs.map((d) => ({
    ...d,
    page: {
      ...d.page,
      children: d.page.children.map(cloneNode),
    },
  }))

  const candidates = pages.flatMap((doc) =>
    collectCandidates(doc.page.id, doc.page.children, ignoreText),
  )

  const groups = new Map<string, Candidate[]>()
  for (const c of candidates) {
    const list = groups.get(c.signature) ?? []
    list.push(c)
    groups.set(c.signature, list)
  }

  const eligible = [...groups.entries()]
    .map(([signature, list]) => {
      const pageIds = [...new Set(list.map((c) => c.pageId))]
      return { signature, list, pageIds }
    })
    .filter((g) => g.pageIds.length >= minPages)
    .sort((a, b) => area(b.list[0].node) - area(a.list[0].node))

  const sharedComponents: UiComponentDef[] = []
  const usedNames = new Set<string>()
  const replaced: Array<{ pageId: string; path: number[] }> = []

  for (const group of eligible) {
    const overlaps = group.list.some((c) =>
      replaced.some(
        (r) =>
          r.pageId === c.pageId &&
          (pathPrefixOf(r.path, c.path) ||
            pathPrefixOf(c.path, r.path) ||
            (r.path.length === c.path.length && r.path.every((v, i) => v === c.path[i]))),
      ),
    )
    if (overlaps) continue

    // Must still cover >= minPages after filtering already-touched pages
    const fresh = group.list.filter(
      (c) =>
        !replaced.some(
          (r) =>
            r.pageId === c.pageId &&
            (pathPrefixOf(r.path, c.path) ||
              pathPrefixOf(c.path, r.path) ||
              (r.path.length === c.path.length && r.path.every((v, i) => v === c.path[i]))),
        ),
    )
    const freshPages = [...new Set(fresh.map((c) => c.pageId))]
    if (freshPages.length < minPages) continue

    const prototype = fresh[0].node
    const name = pickName(prototype, usedNames, group.signature)
    const root = normalizeRoot(prototype)

    sharedComponents.push({
      name,
      sourcePageIds: freshPages,
      root,
    })

    for (const c of fresh) {
      const page = pages.find((p) => p.page.id === c.pageId)
      if (!page) continue
      const replacement: UiNode = {
        id: c.node.id,
        type: 'Component',
        name,
        box: { ...c.node.box },
        style: c.node.style ? { ...c.node.style } : undefined,
        props: c.node.props ? { ...c.node.props } : undefined,
        children: [],
        componentRef: { name, from: 'shared' },
      }
      setAtPath(page.page.children, c.path, replacement)
      replaced.push({ pageId: c.pageId, path: c.path })
    }
  }

  return {
    version: DSL_VERSION,
    pages,
    sharedComponents,
  }
}

export function formatExtractReport(bundle: RestoreBundle): string {
  if (!bundle.sharedComponents.length) {
    return '未抽离公共组件（跨页重复不足或均已匹配项目组件）。'
  }
  return bundle.sharedComponents
    .map(
      (c) =>
        `- ${c.name} ← pages [${c.sourcePageIds.join(', ')}] root=${c.root.type} ${c.root.box.width}x${c.root.box.height}`,
    )
    .join('\n')
}
