export interface PreprocessedImage {
  path: string
  width: number
  height: number
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
  /** data URL suitable for vision APIs */
  dataUrl: string
  /** bytes after preprocess */
  byteLength: number
}

export interface VisionAnalyzeInput {
  image: PreprocessedImage
  pageId: string
  pageName: string
}

export interface VisionRepairInput {
  raw: unknown
  issues: string
  pageId: string
  pageName: string
}

export interface VisionProvider {
  readonly id: string
  analyze(input: VisionAnalyzeInput): Promise<unknown>
  repair?(input: VisionRepairInput): Promise<unknown>
}

export interface VisionProviderOptions {
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
}

export interface AnalyzeImageOptions extends VisionProviderOptions {
  pageId?: string
  pageName?: string
  /** Max long-edge px for upload (default 2048) */
  maxEdge?: number
}
