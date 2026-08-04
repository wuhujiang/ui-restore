/**
 * Extract a JSON value from model output (raw JSON or fenced ```json blocks).
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('[@ui-restore/vision] Empty model response')
  }

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    // continue
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence?.[1]) {
    return JSON.parse(fence[1].trim()) as unknown
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1)) as unknown
  }

  throw new Error('[@ui-restore/vision] Could not parse JSON from model response')
}
