import type { StyleProps, UiNode } from '@ui-restore/shared'
import type { ComponentIndex } from '@ui-restore/scanner'

function cssValue(key: string, value: string | number): string {
  if (typeof value === 'number') {
    if (key === 'opacity' || key === 'fontWeight') return String(value)
    return `${value}px`
  }
  return value
}

export function styleObjectToCss(style: StyleProps | undefined): string {
  if (!style) return ''
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => {
      const cssKey = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      return `${cssKey}: ${cssValue(k, v as string | number)};`
    })
    .join(' ')
}

export function boxStyle(node: UiNode): string {
  const { x, y, width, height } = node.box
  const extra = styleObjectToCss(node.style)
  return `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;${extra ? ` ${extra}` : ''}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function propsToAttrs(props: Record<string, unknown> | undefined, allowed?: string[]): string {
  if (!props) return ''
  const entries = Object.entries(props).filter(([key]) => !allowed || allowed.includes(key))
  return entries
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? ` ${key}` : ''
      }
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return ` :${key}="${value}"`
      return ` ${key}="${escapeHtml(String(value))}"`
    })
    .join('')
}

function nativeTag(type: string): string {
  switch (type) {
    case 'Text':
      return 'span'
    case 'Image':
      return 'img'
    case 'Button':
      return 'button'
    case 'Input':
      return 'input'
    case 'List':
      return 'ul'
    case 'Avatar':
      return 'img'
    case 'Icon':
      return 'span'
    case 'Component':
      return 'div'
    case 'View':
    default:
      return 'div'
  }
}

export interface RenderContext {
  index: ComponentIndex
  indent: string
}

export function renderNode(node: UiNode, ctx: RenderContext): string {
  const style = boxStyle(node)
  const children = node.children ?? []
  const childXml = children.map((c) => renderNode(c, { ...ctx, indent: ctx.indent + '  ' })).join('\n')

  const ref = node.componentRef
  if (ref && (ref.from === 'project' || ref.from === 'shared') && ctx.index[ref.name]) {
    const entry = ctx.index[ref.name]
    const attrs = propsToAttrs(node.props, entry.props)
    const text = node.text ? escapeHtml(node.text) : ''
    if (children.length) {
      return `${ctx.indent}<${ref.name} class="ur-node" style="${style}"${attrs}>\n${childXml}\n${ctx.indent}</${ref.name}>`
    }
    if (text) {
      return `${ctx.indent}<${ref.name} class="ur-node" style="${style}"${attrs}>${text}</${ref.name}>`
    }
    return `${ctx.indent}<${ref.name} class="ur-node" style="${style}"${attrs} />`
  }

  const tag = nativeTag(node.type)
  const attrs = propsToAttrs(node.props)

  if (tag === 'img') {
    const src =
      typeof node.props?.src === 'string' ? escapeHtml(node.props.src) : ''
    const alt =
      typeof node.text === 'string' ? escapeHtml(node.text) : node.id
    return `${ctx.indent}<img class="ur-node" style="${style}" src="${src}" alt="${alt}" />`
  }

  if (tag === 'input') {
    const placeholder =
      typeof node.props?.placeholder === 'string'
        ? escapeHtml(node.props.placeholder)
        : ''
    return `${ctx.indent}<input class="ur-node" style="${style}"${attrs}${placeholder ? ` placeholder="${placeholder}"` : ''} />`
  }

  const text = typeof node.text === 'string' ? escapeHtml(node.text) : ''
  if (children.length) {
    return `${ctx.indent}<${tag} class="ur-node" style="${style}"${attrs}>\n${childXml}\n${ctx.indent}  ${text}\n${ctx.indent}</${tag}>`
  }
  if (tag === 'button' || tag === 'span' || tag === 'div') {
    return `${ctx.indent}<${tag} class="ur-node" style="${style}"${attrs}>${text}</${tag}>`
  }
  return `${ctx.indent}<${tag} class="ur-node" style="${style}"${attrs}>${text}</${tag}>`
}

export function collectComponentImports(
  nodes: UiNode[],
  index: ComponentIndex,
  from: 'project' | 'shared' | 'any' = 'any',
): string[] {
  const names = new Set<string>()
  const walk = (list: UiNode[]) => {
    for (const n of list) {
      const ref = n.componentRef
      if (ref && index[ref.name]) {
        if (from === 'any' || ref.from === from) {
          names.add(ref.name)
        }
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return [...names].sort()
}

/** @deprecated Use collectComponentImports */
export function collectProjectImports(nodes: UiNode[], index: ComponentIndex): string[] {
  return collectComponentImports(nodes, index, 'project')
}
