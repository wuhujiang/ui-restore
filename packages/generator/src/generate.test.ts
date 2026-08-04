import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DSL_VERSION, type UiComponentDef, type UiDocument } from '@ui-restore/shared'
import { scanComponents } from '@ui-restore/scanner'
import { generateSharedComponents, generateVuePage, mergeComponentIndex } from './generate.js'

const root = join(tmpdir(), `ui-restore-gen-${Date.now()}`)
mkdirSync(join(root, 'src', 'components'), { recursive: true })
mkdirSync(join(root, 'src', 'pages'), { recursive: true })

writeFileSync(
  join(root, 'src', 'components', 'Button.vue'),
  `<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
</script>
<template><button><slot /></button></template>
`,
  'utf8',
)

const doc: UiDocument = {
  version: DSL_VERSION,
  page: {
    id: 'login',
    name: 'Login',
    width: 375,
    height: 812,
    background: '#FFFFFF',
    children: [
      {
        id: 'n_title',
        type: 'Text',
        text: '欢迎登录',
        box: { x: 24, y: 120, width: 327, height: 32 },
        style: { fontSize: 24, color: '#111' },
        children: [],
      },
      {
        id: 'n_btn',
        type: 'Button',
        text: '登录',
        box: { x: 24, y: 400, width: 327, height: 48 },
        style: { background: '#1677FF', color: '#fff', borderRadius: 8 },
        children: [],
      },
    ],
  },
  components: [],
}

const index = await scanComponents(join(root, 'src', 'components'), {
  projectRoot: root,
})

const result = await generateVuePage(doc, {
  projectRoot: root,
  pagesDir: 'src/pages',
  lang: 'ts',
  style: 'scss',
  index,
})

const code = readFileSync(result.filePath, 'utf8')
if (!code.includes('import Button from') || !code.includes('<Button')) {
  console.error(code)
  process.exit(1)
}

const sharedDef: UiComponentDef = {
  name: 'AppHeader',
  sourcePageIds: ['home', 'profile'],
  root: {
    id: 'n_header',
    type: 'View',
    box: { x: 0, y: 0, width: 375, height: 56 },
    style: { background: '#fff' },
    children: [
      {
        id: 'n_brand',
        type: 'Text',
        text: 'App',
        box: { x: 16, y: 16, width: 80, height: 24 },
        children: [],
      },
    ],
  },
}

const sharedIndex = await generateSharedComponents([sharedDef], {
  projectRoot: root,
  sharedDir: 'src/components/restored',
  lang: 'ts',
  style: 'scss',
  index,
})

const sharedCode = readFileSync(join(root, 'src/components/restored/AppHeader.vue'), 'utf8')
if (!sharedCode.includes('shared-root') || !sharedCode.includes('App')) {
  console.error(sharedCode)
  process.exit(1)
}

const pageWithShared: UiDocument = {
  version: DSL_VERSION,
  page: {
    id: 'home',
    name: 'Home',
    width: 375,
    height: 812,
    children: [
      {
        id: 'n_h',
        type: 'Component',
        box: { x: 0, y: 0, width: 375, height: 56 },
        componentRef: { name: 'AppHeader', from: 'shared' },
        children: [],
      },
    ],
  },
}

const merged = mergeComponentIndex(index, sharedIndex)
const home = await generateVuePage(pageWithShared, {
  projectRoot: root,
  pagesDir: 'src/pages',
  lang: 'ts',
  style: 'scss',
  index: merged,
  skipMatch: true,
})
const homeCode = readFileSync(home.filePath, 'utf8')
if (!homeCode.includes('import AppHeader from') || !homeCode.includes('<AppHeader')) {
  console.error(homeCode)
  process.exit(1)
}

rmSync(root, { recursive: true, force: true })
console.log('[ok] generator emits Vue SFC with Button + shared AppHeader')
