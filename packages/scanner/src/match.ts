import type { UiDocument, UiNode } from '@ui-restore/shared'
import { DEFAULT_COMPONENT_ALIASES, type ComponentIndex } from './types.js'

function cloneNode(node: UiNode): UiNode {
  return {
    ...node,
    children: node.children?.map(cloneNode),
    props: node.props ? { ...node.props } : undefined,
    style: node.style ? { ...node.style } : undefined,
    componentRef: node.componentRef ? { ...node.componentRef } : node.componentRef,
  }
}

function matchOne(node: UiNode, index: ComponentIndex): UiNode {
  const next = cloneNode(node)

  if (next.componentRef?.from === 'project' || next.componentRef?.from === 'shared') {
    // already bound
  } else {
    const candidates: string[] = []
    if (next.name) candidates.push(next.name)
    candidates.push(next.type)
    const aliases = DEFAULT_COMPONENT_ALIASES[next.type] ?? []
    candidates.push(...aliases)

    for (const name of candidates) {
      if (index[name]) {
        next.componentRef = { name, from: 'project' }
        break
      }
    }
  }

  next.children = next.children?.map((child) => matchOne(child, index))
  return next
}

/**
 * Bind DSL nodes to project components when names match the index.
 * Does not invent components outside the index.
 */
export function matchDocumentToIndex(doc: UiDocument, index: ComponentIndex): UiDocument {
  return {
    ...doc,
    page: {
      ...doc.page,
      children: doc.page.children.map((child) => matchOne(child, index)),
    },
  }
}
