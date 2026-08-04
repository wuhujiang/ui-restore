/**
 * Extract JSON from model output (raw or fenced).
 * Local copy to avoid coupling autofix → vision.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('[@ui-restore/autofix] Empty model response')

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

  throw new Error('[@ui-restore/autofix] Could not parse JSON from model response')
}
