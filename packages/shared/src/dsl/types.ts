/** DSL version frozen for Phase 1. Bump only with migration notes. */
export const DSL_VERSION = '0.1' as const

export type DslVersion = typeof DSL_VERSION

export type NodeType =
  | 'Text'
  | 'Image'
  | 'Button'
  | 'Input'
  | 'View'
  | 'List'
  | 'Avatar'
  | 'Icon'
  | 'Component'

export type ComponentRefFrom = 'project' | 'shared'

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface StyleProps {
  fontSize?: number
  fontWeight?: number | string
  color?: string
  background?: string
  borderRadius?: number
  opacity?: number
  [key: string]: string | number | undefined
}

export interface ComponentRef {
  name: string
  from: ComponentRefFrom
}

export interface UiNode {
  id: string
  type: NodeType
  name?: string
  box: Box
  text?: string | null
  style?: StyleProps
  props?: Record<string, unknown>
  children?: UiNode[]
  componentRef?: ComponentRef | null
  extractCandidate?: boolean
}

export interface UiPage {
  id: string
  name: string
  width: number
  height: number
  background?: string
  children: UiNode[]
}

export interface UiComponentDef {
  name: string
  sourcePageIds: string[]
  root: UiNode
}

/** Single-page document produced by Vision. */
export interface UiDocument {
  version: DslVersion
  page: UiPage
  components?: UiComponentDef[]
}

/** Multi-page bundle after shared-component extraction. */
export interface RestoreBundle {
  version: DslVersion
  pages: UiDocument[]
  sharedComponents: UiComponentDef[]
}

export interface UiRestoreConfig {
  framework: 'vue'
  lang: 'ts' | 'js'
  style: 'scss' | 'css' | 'module-scss'
  components: string
  pages: string
  sharedComponents: string
  entry?: {
    devServer?: string
  }
  /**
   * Vision provider is pluggable — not locked to a vendor.
   * Prefer env: UI_RESTORE_VISION_PROVIDER / UI_RESTORE_VISION_MODEL.
   */
  vision?: {
    provider: string
    model: string
  }
  autofix?: {
    threshold: number
    maxRounds: number
  }
}
