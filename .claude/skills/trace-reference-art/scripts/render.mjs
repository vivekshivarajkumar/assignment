// Screenshot a game page at the reference's exact pixel size, so the two can be
// compared pixel for pixel.
//   node render.mjs --ref ref.png --status-bar 77 --url 'http://127.0.0.1:5173/?ch=1&p=7' --out mine.png
// Options: --wait ms before the shot (default 900; the page fades in over
// 0.45 s, and a tap hint appears on some pages later), --hide CSS selector to
// hide (default .home, the game's own button), --dpr (default 3).
// The canvas fills the viewport, so the shot is the page from the status bar
// down: compare it with the reference cropped the same way (measure.py does).
import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { createRequire } from 'module'

const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => {
  const [k, ...v] = s.trim().split(' ')
  return [k, v.join(' ')]
}))
const png = readFileSync(args.ref)
const W = png.readUInt32BE(16)
const H = png.readUInt32BE(20)
const dpr = Number(args.dpr || 3)
const bar = Number(args['status-bar'] || 0)

let playwright
try {
  playwright = await import('playwright')
} catch {
  const require = createRequire(import.meta.url)
  playwright = require(execSync('npm root -g').toString().trim() + '/playwright')
}
const browser = await playwright.chromium.launch()
const page = await browser.newPage({
  viewport: { width: Math.round(W / dpr), height: Math.round((H - bar) / dpr) },
  deviceScaleFactor: dpr,
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(args.url, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: `${args.hide || '.home'} { display: none !important }` })
await page.waitForTimeout(Number(args.wait || 900))
await page.screenshot({ path: args.out })
await browser.close()
console.log(`${args.out}: ${Math.round(W / dpr)} x ${Math.round((H - bar) / dpr)} css px at ${dpr}x` + (errors.length ? ` | page errors: ${errors.join('; ')}` : ''))
