import { Command } from 'commander'
import { DSL_VERSION } from '@ui-restore/shared'
import { runAutofixCommand } from './commands/autofix.js'
import { runInit } from './commands/init.js'
import { runRestore } from './commands/restore.js'
import { runScan } from './commands/scan.js'

const program = new Command()

program
  .name('ui-restore')
  .description('Restore UI into your existing Vue project. Not generate another demo.')
  .version('0.1.0')

program
  .command('init')
  .description('Generate ui-restore.config.ts in the target project')
  .option('-f, --force', 'Overwrite existing config', false)
  .option('--lang <lang>', 'ts | js', 'ts')
  .option('--cwd <dir>', 'Target project directory', process.cwd())
  .action(async (opts: { force?: boolean; lang?: string; cwd?: string }) => {
    const lang = opts.lang === 'js' ? 'js' : 'ts'
    await runInit({ force: Boolean(opts.force), lang, cwd: opts.cwd })
  })

program
  .command('scan')
  .description('Scan project components and write .ui-restore/component-index.json')
  .option('--cwd <dir>', 'Target project directory', process.cwd())
  .action(async (opts: { cwd?: string }) => {
    await runScan({ cwd: opts.cwd })
  })

program
  .command('restore')
  .description('Restore page(s) from design image(s) → DSL → Vue SFC')
  .argument('<images...>', 'One or more image paths (e.g. login.png)')
  .option('--provider <provider>', 'Vision provider: mock | openai')
  .option('--model <model>', 'Vision model id (provider-specific)')
  .option('--out-dir <dir>', 'DSL output directory', '.ui-restore/dsl')
  .option('--cwd <dir>', 'Target Vue project directory', process.cwd())
  .option('--dsl-only', 'Only write DSL JSON, skip Vue generation', false)
  .option('--no-extract', 'Disable cross-page shared component extraction')
  .action(
    async (
      images: string[],
      opts: {
        provider?: string
        model?: string
        outDir?: string
        cwd?: string
        dslOnly?: boolean
        extract?: boolean
      },
    ) => {
      await runRestore(images, {
        provider: opts.provider,
        model: opts.model,
        outDir: opts.outDir,
        cwd: opts.cwd,
        imageCwd: process.cwd(),
        dslOnly: Boolean(opts.dslOnly),
        noExtract: opts.extract === false,
      })
    },
  )

program
  .command('autofix')
  .description('Screenshot-diff autofix loop for a restored page (revises DSL then regenerates Vue)')
  .argument('<pageId>', 'Page id (e.g. home / login)')
  .requiredOption('--reference <path>', 'Reference design image')
  .option('--cwd <dir>', 'Target Vue project directory', process.cwd())
  .option('--provider <provider>', 'Autofix provider: mock | openai')
  .option('--model <model>', 'Model id for openai provider')
  .option('--threshold <n>', 'Similarity threshold 0-1', (v) => Number(v))
  .option('--max-rounds <n>', 'Max revise rounds', (v) => Number(v))
  .option('--url <url>', 'Optional live page URL instead of DSL HTML preview')
  .action(
    async (
      pageId: string,
      opts: {
        reference: string
        cwd?: string
        provider?: string
        model?: string
        threshold?: number
        maxRounds?: number
        url?: string
      },
    ) => {
      await runAutofixCommand(pageId, {
        reference: opts.reference,
        cwd: opts.cwd,
        referenceCwd: process.cwd(),
        provider: opts.provider,
        model: opts.model,
        threshold: opts.threshold,
        maxRounds: opts.maxRounds,
        url: opts.url,
      })
    },
  )

program
  .command('dsl-version')
  .description('Print the frozen UI JSON DSL version')
  .action(() => {
    console.log(DSL_VERSION)
  })

await program.parseAsync(process.argv)
