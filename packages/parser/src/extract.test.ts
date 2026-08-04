import { extractSharedComponents } from './extract.js'
import { DSL_VERSION, type UiDocument } from '@ui-restore/shared'

function makeCard(pageId: string, y: number): UiDocument['page']['children'][number] {
  return {
    id: `n_card_${pageId}`,
    type: 'View',
    name: 'UserCard',
    extractCandidate: true,
    box: { x: 16, y, width: 343, height: 88 },
    style: { background: '#FAFAFA', borderRadius: 12 },
    children: [
      {
        id: `n_avatar_${pageId}`,
        type: 'Avatar',
        box: { x: 28, y: y + 16, width: 56, height: 56 },
        style: { borderRadius: 28, background: '#DDD' },
        children: [],
      },
      {
        id: `n_name_${pageId}`,
        type: 'Text',
        text: 'User',
        box: { x: 100, y: y + 28, width: 200, height: 24 },
        style: { fontSize: 16, color: '#111' },
        children: [],
      },
    ],
  }
}

const home: UiDocument = {
  version: DSL_VERSION,
  page: {
    id: 'home',
    name: 'Home',
    width: 375,
    height: 812,
    children: [
      makeCard('home', 120),
      {
        id: 'n_home_only',
        type: 'Text',
        text: 'Home only',
        box: { x: 16, y: 240, width: 200, height: 24 },
        children: [],
      },
    ],
  },
}

const profile: UiDocument = {
  version: DSL_VERSION,
  page: {
    id: 'profile',
    name: 'Profile',
    width: 375,
    height: 812,
    children: [
      makeCard('profile', 160),
      {
        id: 'n_profile_only',
        type: 'Text',
        text: 'Profile only',
        box: { x: 16, y: 280, width: 200, height: 24 },
        children: [],
      },
    ],
  },
}

const bundle = extractSharedComponents([home, profile])

if (bundle.sharedComponents.length !== 1) {
  console.error('expected 1 shared component', bundle.sharedComponents)
  process.exit(1)
}

const shared = bundle.sharedComponents[0]
if (shared.name !== 'UserCard') {
  console.error('expected UserCard name', shared.name)
  process.exit(1)
}
if (shared.root.box.x !== 0 || shared.root.box.y !== 0) {
  console.error('root should be normalized to 0,0', shared.root.box)
  process.exit(1)
}

for (const page of bundle.pages) {
  const card = page.page.children.find((c) => c.componentRef?.from === 'shared')
  if (!card || card.componentRef?.name !== 'UserCard') {
    console.error('page missing shared ref', page.page.id, page.page.children)
    process.exit(1)
  }
  if (!page.page.children.some((c) => c.type === 'Text')) {
    console.error('page-unique node lost', page.page.id)
    process.exit(1)
  }
}

const single = extractSharedComponents([home])
if (single.sharedComponents.length !== 0) {
  console.error('single page should not extract')
  process.exit(1)
}

console.log('[ok] extractSharedComponents pulls UserCard across pages')
