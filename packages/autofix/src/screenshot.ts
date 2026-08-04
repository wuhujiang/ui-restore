import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { chromium } from 'playwright'
import type { ScreenshotOptions } from './types.js'

/**
 * Capture a screenshot via Playwright from URL or inline HTML.
 */
export async function takeScreenshot(options: ScreenshotOptions): Promise<string> {
  if (!options.url && !options.html) {
    throw new Error('[@ui-restore/autofix] screenshot requires url or html')
  }

  mkdirSync(dirname(options.outPath), { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
    })
    if (options.url) {
      await page.goto(options.url, { waitUntil: 'networkidle' })
    } else if (options.html) {
      await page.setContent(options.html, { waitUntil: 'load' })
    }
    await page.screenshot({
      path: options.outPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: options.width,
        height: options.height,
      },
    })
  } finally {
    await browser.close()
  }
  return options.outPath
}
