export { compareImages, formatScore } from './diff.js'
export { runAutofixLoop } from './loop.js'
export { documentToHtml } from './render-html.js'
export { takeScreenshot } from './screenshot.js'
export { createAutofixProvider, MockAutofixProvider, OpenAIAutofixProvider } from './revise/create.js'
export type {
  AutofixLoopOptions,
  AutofixLoopResult,
  AutofixProvider,
  DiffResult,
  ReviseInput,
  ScreenshotOptions,
} from './types.js'

export const autofixPackage = '@ui-restore/autofix' as const
