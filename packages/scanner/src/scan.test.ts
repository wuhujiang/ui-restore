import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { scanComponents } from './scan.js'

const dir = join(tmpdir(), `ui-restore-scan-${Date.now()}`)
mkdirSync(join(dir, 'src', 'components'), { recursive: true })

writeFileSync(
  join(dir, 'src', 'components', 'Button.vue'),
  `<script setup lang="ts">
defineProps<{ type?: string; size?: string; disabled?: boolean }>()
</script>
<template><button><slot /></button></template>
`,
  'utf8',
)

writeFileSync(
  join(dir, 'src', 'components', 'AppInput.vue'),
  `<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
})
</script>
<template><input /></template>
`,
  'utf8',
)

const index = await scanComponents(join(dir, 'src', 'components'), {
  projectRoot: dir,
})

if (!index.Button || !index.AppInput) {
  console.error(index)
  process.exit(1)
}
if (!index.Button.props.includes('type') || !index.AppInput.props.includes('placeholder')) {
  console.error('props missing', index)
  process.exit(1)
}

rmSync(dir, { recursive: true, force: true })
console.log('[ok] scanner extracts Button + AppInput')
