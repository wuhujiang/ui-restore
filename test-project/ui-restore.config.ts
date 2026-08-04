/**
 * Target Vue app config for ui-restore regression.
 * Vision provider/model are pluggable.
 */
const config = {
  framework: 'vue' as const,
  lang: 'ts' as const,
  style: 'scss' as const,
  components: 'src/components',
  pages: 'src/pages',
  sharedComponents: 'src/components/restored',
  vision: {
    provider: 'mock',
    model: 'gpt-4o',
  },
  autofix: {
    threshold: 0.98,
    maxRounds: 5,
  },
}

export default config
