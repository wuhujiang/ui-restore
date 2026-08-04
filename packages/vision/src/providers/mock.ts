import type { UiDocument } from '@ui-restore/shared'
import { DSL_VERSION } from '@ui-restore/shared'
import type {
  VisionAnalyzeInput,
  VisionProvider,
  VisionRepairInput,
} from '../types.js'

/**
 * Offline provider for pipeline tests and demos without API keys.
 * Includes a repeated AppHeader so multi-image restore can exercise shared extraction.
 */
export class MockVisionProvider implements VisionProvider {
  readonly id = 'mock'

  async analyze(input: VisionAnalyzeInput): Promise<UiDocument> {
    const { image, pageId, pageName } = input
    const pad = 24
    const titleH = 32
    const inputH = 48
    const btnH = 48
    const headerH = 56

    return {
      version: DSL_VERSION,
      page: {
        id: pageId,
        name: pageName,
        width: image.width,
        height: image.height,
        background: '#FFFFFF',
        children: [
          {
            id: `n_header_${pageId}`,
            type: 'View',
            name: 'AppHeader',
            extractCandidate: true,
            box: { x: 0, y: 0, width: image.width, height: headerH },
            style: { background: '#FFFFFF' },
            children: [
              {
                id: `n_brand_${pageId}`,
                type: 'Text',
                text: 'App',
                box: { x: 16, y: 16, width: 80, height: 24 },
                style: { fontSize: 18, fontWeight: 600, color: '#111111' },
                children: [],
              },
              {
                id: `n_menu_${pageId}`,
                type: 'Icon',
                box: { x: image.width - 40, y: 16, width: 24, height: 24 },
                style: { background: '#EEEEEE', borderRadius: 4 },
                children: [],
              },
            ],
          },
          {
            id: `n_title_${pageId}`,
            type: 'Text',
            text: pageName,
            box: {
              x: pad,
              y: Math.round(image.height * 0.25),
              width: image.width - pad * 2,
              height: titleH,
            },
            style: { fontSize: 24, fontWeight: 600, color: '#111111' },
            children: [],
          },
          {
            id: `n_input_${pageId}`,
            type: 'Input',
            box: {
              x: pad,
              y: Math.round(image.height * 0.35),
              width: image.width - pad * 2,
              height: inputH,
            },
            props: { placeholder: '输入' },
            style: { background: '#F5F5F5', borderRadius: 8 },
            children: [],
          },
          {
            id: `n_submit_${pageId}`,
            type: 'Button',
            text: '确定',
            box: {
              x: pad,
              y: Math.round(image.height * 0.5),
              width: image.width - pad * 2,
              height: btnH,
            },
            style: {
              background: '#1677FF',
              color: '#FFFFFF',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
            },
            extractCandidate: true,
            children: [],
          },
        ],
      },
      components: [],
    }
  }

  async repair(input: VisionRepairInput): Promise<unknown> {
    if (input.raw && typeof input.raw === 'object') {
      return {
        ...(input.raw as object),
        version: DSL_VERSION,
      }
    }
    throw new Error('[@ui-restore/vision] mock repair requires object raw JSON')
  }
}
