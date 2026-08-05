export function resolveAutofixPageUrl(
  optionUrl: string | undefined,
  configUrl: string | undefined,
): string | null {
  const url = optionUrl ?? configUrl
  if (!url) return null

  try {
    return new URL(url).href
  } catch {
    throw new Error(`AutoFix 页面 URL 无效: ${url}`)
  }
}
