import type { UiDocument } from '@ui-restore/shared'

export interface DiffResult {
  /** 1 = identical, 0 = completely different */
  score: number
  width: number
  height: number
  /** Absolute path to heatmap PNG when written */
  diffPath?: string
}

export interface ScreenshotOptions {
  width: number
  height: number
  outPath: string
  /** Prefer URL when provided (e.g. Vite preview). */
  url?: string
  html?: string
}

export interface ReviseInput {
  document: UiDocument
  referencePath: string
  currentScreenshotPath: string
  score: number
  threshold: number
  round: number
  maxRounds: number
  diffSummary: string
}

export interface AutofixProvider {
  readonly id: string
  revise(input: ReviseInput): Promise<UiDocument>
}

export interface AutofixLoopOptions {
  document: UiDocument
  referencePath: string
  workDir: string
  threshold?: number
  maxRounds?: number
  provider: AutofixProvider
  /** Optional live page URL; otherwise DSL→HTML screenshot. */
  url?: string
  /** Called after each successful DSL revision (e.g. regenerate Vue). */
  onDocumentUpdated?: (doc: UiDocument, round: number) => Promise<void> | void
}

export interface AutofixLoopResult {
  document: UiDocument
  initialScore: number
  finalScore: number
  rounds: number
  reachedThreshold: boolean
  artifactsDir: string
}
