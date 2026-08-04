import { restoreBundleSchema, uiDocumentSchema } from './schema.js'
import type { RestoreBundle, UiDocument } from './types.js'

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; issues?: unknown }

export function parseUiDocument(input: unknown): ParseResult<UiDocument> {
  const result = uiDocumentSchema.safeParse(input)
  if (!result.success) {
    return {
      ok: false,
      error: result.error.message,
      issues: result.error.issues,
    }
  }
  return { ok: true, data: result.data }
}

export function parseRestoreBundle(input: unknown): ParseResult<RestoreBundle> {
  const result = restoreBundleSchema.safeParse(input)
  if (!result.success) {
    return {
      ok: false,
      error: result.error.message,
      issues: result.error.issues,
    }
  }
  return { ok: true, data: result.data }
}

export function assertUiDocument(input: unknown): UiDocument {
  const parsed = parseUiDocument(input)
  if (!parsed.ok) {
    throw new Error(`Invalid UiDocument: ${parsed.error}`)
  }
  return parsed.data
}
