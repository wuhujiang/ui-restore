import { MockAutofixProvider } from './mock.js'
import { OpenAIAutofixProvider } from './openai.js'
import type { AutofixProvider } from '../types.js'

export function createAutofixProvider(options: {
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
}): AutofixProvider {
  const id = options.provider.trim().toLowerCase()
  switch (id) {
    case 'mock':
      return new MockAutofixProvider()
    case 'openai':
      return new OpenAIAutofixProvider(options)
    default:
      throw new Error(
        `[@ui-restore/autofix] Unknown provider "${options.provider}". Supported: mock, openai`,
      )
  }
}

export { MockAutofixProvider } from './mock.js'
export { OpenAIAutofixProvider } from './openai.js'
