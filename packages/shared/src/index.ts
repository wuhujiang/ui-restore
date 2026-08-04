export { DSL_VERSION } from './dsl/types.js'
export type {
  Box,
  ComponentRef,
  ComponentRefFrom,
  DslVersion,
  NodeType,
  RestoreBundle,
  StyleProps,
  UiComponentDef,
  UiDocument,
  UiNode,
  UiPage,
  UiRestoreConfig,
} from './dsl/types.js'

export {
  restoreBundleSchema,
  uiComponentDefSchema,
  uiDocumentSchema,
  uiNodeSchema,
  uiPageSchema,
} from './dsl/schema.js'

export {
  assertUiDocument,
  parseRestoreBundle,
  parseUiDocument,
} from './dsl/validate.js'
export type { ParseResult } from './dsl/validate.js'
