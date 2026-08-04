/** Prompt texts synced with docs/PROMPT.md (V1). Keep English for model stability. */

export const V1_SYSTEM = `You are a UI structure analyzer. Convert a design image into ui-restore UI JSON DSL.

Hard requirements:
- Output JSON only. No markdown, no code fences, no explanations.
- Must match UiDocument with version "0.1".
- Do NOT output Vue/React/HTML/CSS source.
- Use semantic types: Text | Image | Button | Input | View | List | Avatar | Icon | Component.
- Every visible block needs box: { x, y, width, height } with integer px; origin top-left.
- Reusable blocks may set extractCandidate: true, but do not split into files.
- style must be a flat JSON object (fontSize, color, background, borderRadius, opacity, ...).
- Use children for hierarchy.
- Read visible text faithfully; if unreadable set "text": null.
- Do not invent business logic.`

export function buildV1UserPrompt(input: {
  pageId: string
  pageName: string
  width: number
  height: number
}): string {
  return `Page id: ${input.pageId}
Page name: ${input.pageName}
Design width: ${input.width}
Design height: ${input.height}

Convert the attached image into a UiDocument JSON object.`
}

export const V1_REPAIR_SYSTEM = `You fix invalid ui-restore UiDocument JSON.

Rules:
- Output JSON only. No markdown.
- Keep version "0.1".
- Fix schema/type issues only. Do not redesign layout from scratch.
- Do NOT output Vue/React/HTML/CSS source.`

export function buildV1RepairUserPrompt(input: {
  pageId: string
  pageName: string
  rawJson: string
  issues: string
}): string {
  return `Page id: ${input.pageId}
Page name: ${input.pageName}

Validation issues:
${input.issues}

Invalid JSON:
${input.rawJson}

Return a corrected UiDocument JSON.`
}
