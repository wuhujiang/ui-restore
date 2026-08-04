import { z } from 'zod'
import { DSL_VERSION } from './types.js'

const boxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
})

const componentRefSchema = z.object({
  name: z.string().min(1),
  from: z.enum(['project', 'shared']),
})

const nodeTypeSchema = z.enum([
  'Text',
  'Image',
  'Button',
  'Input',
  'View',
  'List',
  'Avatar',
  'Icon',
  'Component',
])

export const uiNodeSchema: z.ZodType<import('./types.js').UiNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: nodeTypeSchema,
    name: z.string().optional(),
    box: boxSchema,
    text: z.string().nullable().optional(),
    style: z.record(z.union([z.string(), z.number(), z.undefined()])).optional(),
    props: z.record(z.unknown()).optional(),
    children: z.array(uiNodeSchema).optional(),
    componentRef: componentRefSchema.nullable().optional(),
    extractCandidate: z.boolean().optional(),
  }),
)

export const uiComponentDefSchema = z.object({
  name: z.string().min(1),
  sourcePageIds: z.array(z.string()),
  root: uiNodeSchema,
})

export const uiPageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  background: z.string().optional(),
  children: z.array(uiNodeSchema),
})

export const uiDocumentSchema = z.object({
  version: z.literal(DSL_VERSION),
  page: uiPageSchema,
  components: z.array(uiComponentDefSchema).optional(),
})

export const restoreBundleSchema = z.object({
  version: z.literal(DSL_VERSION),
  pages: z.array(uiDocumentSchema),
  sharedComponents: z.array(uiComponentDefSchema),
})
