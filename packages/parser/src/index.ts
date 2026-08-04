import { parseUiDocument, type ParseResult, type UiDocument } from '@ui-restore/shared'
import { normalizeUiDocument } from './normalize.js'
export {
  extractSharedComponents,
  formatExtractReport,
  nodeSignature,
} from './extract.js'
export type { ExtractSharedOptions } from './extract.js'

export interface DiagnoseIssue {
  path: string
  message: string
}

export interface ParseDocumentResult {
  ok: boolean
  data?: UiDocument
  error?: string
  issues: DiagnoseIssue[]
  normalized: unknown
}

function issuesFromZod(issues: unknown): DiagnoseIssue[] {
  if (!Array.isArray(issues)) return []
  return issues.map((item) => {
    const issue = item as { path?: Array<string | number>; message?: string }
    return {
      path: (issue.path ?? []).join('.') || '(root)',
      message: issue.message ?? 'invalid',
    }
  })
}

export function formatIssues(issues: DiagnoseIssue[]): string {
  if (!issues.length) return '(no issue details)'
  return issues.map((i) => `- ${i.path}: ${i.message}`).join('\n')
}

/**
 * Normalize → validate. Returns structured diagnostics on failure.
 */
export function parseDocument(input: unknown): ParseDocumentResult {
  const normalized = normalizeUiDocument(input)
  const parsed: ParseResult<UiDocument> = parseUiDocument(normalized)

  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      issues: issuesFromZod(parsed.issues),
      normalized,
    }
  }

  return {
    ok: true,
    data: parsed.data,
    issues: [],
    normalized,
  }
}

/** @deprecated Prefer parseDocument */
export function validateDocument(input: unknown): ParseResult<UiDocument> {
  return parseUiDocument(normalizeUiDocument(input))
}

export const parserPackage = '@ui-restore/parser' as const
