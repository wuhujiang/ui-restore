import type { VisionProvider, VisionProviderOptions } from '../types.js'
import { MockVisionProvider } from './mock.js'
import { OpenAIVisionProvider } from './openai.js'

export function createVisionProvider(options: VisionProviderOptions): VisionProvider {
  const id = options.provider.trim().toLowerCase()

  switch (id) {
    case 'mock':
      return new MockVisionProvider()
    case 'openai':
      return new OpenAIVisionProvider(options)
    default:
      throw new Error(
        `[@ui-restore/vision] Unknown provider "${options.provider}". Supported: mock, openai`,
      )
  }
}

export { MockVisionProvider } from './mock.js'
export { OpenAIVisionProvider } from './openai.js'
