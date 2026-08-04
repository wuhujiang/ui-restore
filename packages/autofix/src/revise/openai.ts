import { readFileSync } from 'node:fs'
import { parseDocument } from '@ui-restore/parser'
import type { UiDocument } from '@ui-restore/shared'
import { extractJson } from './json.js'
import { A1_SYSTEM, buildA1UserPrompt } from '../prompts/a1.js'
import type { AutofixProvider, ReviseInput } from '../types.js'

function toDataUrl(filePath: string): string {
  const buf = readFileSync(filePath)
  const lower = filePath.toLowerCase()
  const mime = lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${buf.toString('base64')}`
}

/**
 * OpenAI-compatible Chat Completions reviser (vision + JSON).
 */
export class OpenAIAutofixProvider implements AutofixProvider {
  readonly id = 'openai'
  private readonly model: string
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(options: { model: string; apiKey?: string; baseUrl?: string }) {
    this.model = options.model
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? ''
    this.baseUrl = (
      options.baseUrl ??
      process.env.OPENAI_BASE_URL ??
      'https://api.openai.com/v1'
    ).replace(/\/$/, '')
    if (!this.apiKey) {
      throw new Error('[@ui-restore/autofix] Missing OPENAI_API_KEY for openai provider')
    }
  }

  async revise(input: ReviseInput): Promise<UiDocument> {
    const userText = buildA1UserPrompt({
      score: input.score,
      threshold: input.threshold,
      round: input.round,
      maxRounds: input.maxRounds,
      diffSummary: input.diffSummary,
      documentJson: JSON.stringify(input.document, null, 2),
    })

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
        messages: [
          { role: 'system', content: A1_SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: toDataUrl(input.referencePath) } },
              {
                type: 'image_url',
                image_url: { url: toDataUrl(input.currentScreenshotPath) },
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `[@ui-restore/autofix] OpenAI revise failed (${res.status}): ${body.slice(0, 500)}`,
      )
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('[@ui-restore/autofix] Empty revise response')
    }

    const raw = extractJson(content)
    const parsed = parseDocument(raw)
    if (!parsed.ok || !parsed.data) {
      throw new Error(
        `[@ui-restore/autofix] Revised DSL invalid: ${parsed.error ?? 'unknown'}`,
      )
    }
    return parsed.data
  }
}
