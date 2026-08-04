import { extractJson } from '../json.js'
import {
  V1_REPAIR_SYSTEM,
  V1_SYSTEM,
  buildV1RepairUserPrompt,
  buildV1UserPrompt,
} from '../prompts/v1.js'
import type {
  VisionAnalyzeInput,
  VisionProvider,
  VisionProviderOptions,
  VisionRepairInput,
} from '../types.js'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<Record<string, unknown>>
}

/**
 * OpenAI-compatible Chat Completions vision adapter.
 * Works with api.openai.com and compatible gateways via baseUrl.
 */
export class OpenAIVisionProvider implements VisionProvider {
  readonly id = 'openai'
  private readonly model: string
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(options: VisionProviderOptions) {
    this.model = options.model
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? ''
    this.baseUrl = (options.baseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    )
    if (!this.apiKey) {
      throw new Error(
        '[@ui-restore/vision] Missing API key. Set OPENAI_API_KEY or pass apiKey.',
      )
    }
  }

  async analyze(input: VisionAnalyzeInput): Promise<unknown> {
    const userText = buildV1UserPrompt({
      pageId: input.pageId,
      pageName: input.pageName,
      width: input.image.width,
      height: input.image.height,
    })

    const content = await this.chat([
      { role: 'system', content: V1_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: input.image.dataUrl } },
        ],
      },
    ])

    return extractJson(content)
  }

  async repair(input: VisionRepairInput): Promise<unknown> {
    const rawJson = JSON.stringify(input.raw, null, 2)
    const content = await this.chat([
      { role: 'system', content: V1_REPAIR_SYSTEM },
      {
        role: 'user',
        content: buildV1RepairUserPrompt({
          pageId: input.pageId,
          pageName: input.pageName,
          rawJson,
          issues: input.issues,
        }),
      },
    ])
    return extractJson(content)
  }

  private async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `[@ui-restore/vision] OpenAI request failed (${res.status}): ${body.slice(0, 500)}`,
      )
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('[@ui-restore/vision] Empty choices from OpenAI response')
    }
    return content
  }
}
