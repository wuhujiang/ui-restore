import type { UiDocument, UiNode } from '@ui-restore/shared'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function styleOf(node: UiNode): string {
  const parts = [
    `position:absolute`,
    `left:${node.box.x}px`,
    `top:${node.box.y}px`,
    `width:${node.box.width}px`,
    `height:${node.box.height}px`,
    `box-sizing:border-box`,
    `overflow:hidden`,
  ]
  const s = node.style ?? {}
  if (s.background) parts.push(`background:${s.background}`)
  if (s.color) parts.push(`color:${s.color}`)
  if (s.fontSize) parts.push(`font-size:${s.fontSize}px`)
  if (s.fontWeight) parts.push(`font-weight:${s.fontWeight}`)
  if (s.borderRadius) parts.push(`border-radius:${s.borderRadius}px`)
  if (s.opacity !== undefined) parts.push(`opacity:${s.opacity}`)
  return parts.join(';')
}

function renderNode(node: UiNode): string {
  const children = (node.children ?? []).map(renderNode).join('')
  const text =
    typeof node.text === 'string' && node.text
      ? `<span>${escapeHtml(node.text)}</span>`
      : ''
  return `<div data-id="${escapeHtml(node.id)}" style="${styleOf(node)}">${text}${children}</div>`
}

/** Deterministic HTML preview of a UiDocument for Playwright screenshots. */
export function documentToHtml(doc: UiDocument): string {
  const { page } = doc
  const bg = page.background ?? '#FFFFFF'
  const body = page.children.map(renderNode).join('')
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: ${bg}; }
  body { width: ${page.width}px; height: ${page.height}px; font-family: sans-serif; }
</style>
</head>
<body>
<div id="page" style="position:relative;width:${page.width}px;height:${page.height}px;background:${bg};overflow:hidden;">
${body}
</div>
</body>
</html>`
}
