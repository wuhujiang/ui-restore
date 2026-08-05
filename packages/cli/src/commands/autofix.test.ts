import { resolveAutofixPageUrl } from './autofix-url.js'

const optionUrl = resolveAutofixPageUrl('http://localhost:5173/login', 'http://localhost:5173')
if (optionUrl !== 'http://localhost:5173/login') {
  throw new Error(`Expected explicit page URL, got ${optionUrl}`)
}

const configUrl = resolveAutofixPageUrl(undefined, 'http://localhost:4173/restored')
if (configUrl !== 'http://localhost:4173/restored') {
  throw new Error(`Expected config page URL, got ${configUrl}`)
}

if (resolveAutofixPageUrl(undefined, undefined) !== null) {
  throw new Error('Expected null without an actual page URL')
}

let rejectedInvalidUrl = false
try {
  resolveAutofixPageUrl('not a URL', undefined)
} catch {
  rejectedInvalidUrl = true
}
if (!rejectedInvalidUrl) {
  throw new Error('Expected invalid page URL to be rejected')
}

console.log('[ok] autofix requires a valid actual page URL')
