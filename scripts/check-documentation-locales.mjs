// DOM checks only; documentation screenshots have their own explicit capture script.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { browser, root } from './telegram-ui/fixture.mjs'
const evidence = []
try {
  for (const width of [320, 390, 820, 1440]) {
    for (const language of ['ne', 'km']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: width === 390 ? 'dark' : 'light', reducedMotion: 'reduce' })
      await context.route('**/*', route => new URL(route.request().url()).origin === 'http://localhost:5173' ? route.continue() : route.abort())
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      await page.addInitScript(() => { if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'en') })
      await page.goto('http://localhost:5173/landing')
      await page.locator('.cv-landing-hero-image').waitFor()
      if (await page.locator('.cv-public-language').isVisible()) await page.locator('.cv-public-language').click()
      else {
        await page.locator('.cv-public-mobile-control').click()
        await page.locator('dialog[open]').getByRole('button', { name: /Choose language/ }).click()
      }
      await page.locator('dialog[open] input[type=search]').fill(language)
      await page.locator('dialog[open] .cv-language-list button').filter({ hasText: language === 'ne' ? 'नेपाली' : 'ខ្មែរ' }).click()
      await page.waitForFunction(lang => localStorage.getItem('lang') === lang, language)
      await page.reload()
      const hero = page.locator('.cv-landing-hero-image')
      await hero.waitFor()
      await hero.evaluate(img => img.decode())
      assert((await hero.getAttribute('src')).includes(`hero-${language}.avif`))
      assert.equal(await page.evaluate(() => localStorage.getItem('lang')), language)
      assert((await page.locator('html').getAttribute('lang')).startsWith(language))
      if (width === 820) await page.evaluate(() => { document.documentElement.style.fontSize = '25.5px' })
      const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
      assert(geometry.scrollWidth <= width + 1, JSON.stringify({ language, ...geometry }))
      await page.locator('.cv-public-login').click()
      await page.locator('dialog[open]').waitFor()
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => !document.querySelector('dialog[open]'))
      await page.goto('http://localhost:5173/brandkit')
      await page.locator('.cv-brandkit-hero img').waitFor()
      await page.locator('.cv-brandkit-hero img').evaluate(img => img.decode())
      assert.equal(errors.length, 0, errors.join('\n'))
      evidence.push({ language, width, theme: width === 390 ? 'dark' : 'light', enlargedText: width === 820, checks: ['language selection', 'persistence after reload', 'localized hero decode', 'HTML language', 'horizontal containment', 'authentication choices and Escape', 'brandkit image decode'], mode: 'browser emulation; public routes; external network blocked; no screenshots' })
      await context.close()
    }
  }
  fs.writeFileSync(root + '/docs/documentation-locale-checks.json', JSON.stringify(evidence, null, 2) + '\n')
  console.log(`Passed ${evidence.length} Nepali/Khmer browser locale checks.`)
} finally { await browser.close() }
