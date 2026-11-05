// Renders design/og-image/og.html to public/og-image.png (1200x630).
// Edit og.html, then from the repo root run:
//   node design/og-image/render.cjs
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium)
// and network access for the Google Fonts used in og.html.
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const html = path.join(__dirname, 'og.html');
  const out = path.join(__dirname, '..', '..', 'public', 'og-image.png');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto('file://' + html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log('wrote', out);
})();
