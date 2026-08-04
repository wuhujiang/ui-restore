import { parseDocument } from './index.js'

const raw = {
  version: '0.1',
  page: {
    id: 'login',
    name: 'Login',
    width: 375.6,
    height: 812.2,
    children: [
      {
        type: 'Text',
        text: 'Hi',
        box: { x: 10.2, y: 20.8, width: 100.1, height: 24.9 },
      },
    ],
  },
}

const result = parseDocument(raw)
if (!result.ok || !result.data) {
  console.error(result.error, result.issues)
  process.exit(1)
}

const child = result.data.page.children[0]
if (!child?.id || child.box.x !== 10 || child.box.width !== 100) {
  console.error('normalize failed', child)
  process.exit(1)
}

console.log('[ok] parser normalize + validate')
