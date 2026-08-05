import { strict as assert } from 'node:assert'
import { defaultConfig, renderConfigTs } from './config.js'

const config = defaultConfig()

assert.equal(config.style, 'css')
assert.match(renderConfigTs(config), /style: 'css'/)

console.log('[ok] CLI defaults generated styles to CSS')
