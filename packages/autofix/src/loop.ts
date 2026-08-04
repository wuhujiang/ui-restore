import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { compareImages, formatScore } from './diff.js'
import { documentToHtml } from './render-html.js'
import { takeScreenshot } from './screenshot.js'
import type { AutofixLoopOptions, AutofixLoopResult } from './types.js'

/**
 * AutoFix loop: screenshot → diff → revise DSL → (optional regenerate) → repeat.
 * Prefers DSL revision over rewriting Vue source.
 */
export async function runAutofixLoop(
  options: AutofixLoopOptions,
): Promise<AutofixLoopResult> {
  const threshold = options.threshold ?? 0.98
  const maxRounds = options.maxRounds ?? 5
  const artifactsDir = options.workDir
  mkdirSync(artifactsDir, { recursive: true })

  let document = options.document
  let initialScore = 0
  let finalScore = 0
  let rounds = 0
  let reachedThreshold = false

  for (let round = 0; round <= maxRounds; round += 1) {
    const roundDir = join(artifactsDir, `round-${round}`)
    mkdirSync(roundDir, { recursive: true })
    const shotPath = join(roundDir, 'current.png')
    const diffPath = join(roundDir, 'diff.png')

    const html = documentToHtml(document)
    writeFileSync(join(roundDir, 'preview.html'), html, 'utf8')
    writeFileSync(join(roundDir, 'document.json'), `${JSON.stringify(document, null, 2)}\n`, 'utf8')

    await takeScreenshot({
      width: document.page.width,
      height: document.page.height,
      outPath: shotPath,
      url: options.url,
      html: options.url ? undefined : html,
    })

    const diff = await compareImages(options.referencePath, shotPath, diffPath)
    if (round === 0) initialScore = diff.score
    finalScore = diff.score
    rounds = round

    const summary = [
      `score=${formatScore(diff.score)}`,
      `size=${diff.width}x${diff.height}`,
      `diff=${diff.diffPath ?? '(none)'}`,
    ].join(', ')
    writeFileSync(join(roundDir, 'summary.txt'), `${summary}\n`, 'utf8')

    if (diff.score >= threshold) {
      reachedThreshold = true
      break
    }

    if (round === maxRounds) break

    document = await options.provider.revise({
      document,
      referencePath: options.referencePath,
      currentScreenshotPath: shotPath,
      score: diff.score,
      threshold,
      round: round + 1,
      maxRounds,
      diffSummary: summary,
    })

    if (options.onDocumentUpdated) {
      await options.onDocumentUpdated(document, round + 1)
    }
  }

  writeFileSync(
    join(artifactsDir, 'result.json'),
    `${JSON.stringify(
      {
        initialScore,
        finalScore,
        rounds,
        reachedThreshold,
        threshold,
        maxRounds,
        provider: options.provider.id,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return {
    document,
    initialScore,
    finalScore,
    rounds,
    reachedThreshold,
    artifactsDir,
  }
}
