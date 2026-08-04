/** AutoFix A1 prompts — synced with docs/PROMPT.md */

export const A1_SYSTEM = `You are a UI restoration corrector for ui-restore.
Revise the UiDocument JSON DSL so the rendered page better matches the reference design.

Hard rules:
- Output JSON only (a full UiDocument with version "0.1").
- Do NOT output Vue/HTML/CSS source files.
- Prefer small edits to box, style, text, and hierarchy.
- Keep node id values stable whenever possible.
- Do not invent business logic.`

export function buildA1UserPrompt(input: {
  score: number
  threshold: number
  round: number
  maxRounds: number
  diffSummary: string
  documentJson: string
}): string {
  return `Round: ${input.round}/${input.maxRounds}
Current similarity score: ${(input.score * 100).toFixed(2)}%
Target threshold: ${(input.threshold * 100).toFixed(2)}%

Diff summary:
${input.diffSummary}

Current UiDocument JSON:
${input.documentJson}

Return a revised UiDocument JSON that should improve visual similarity.
Two images are attached: reference (first) then current screenshot (second).`
}
