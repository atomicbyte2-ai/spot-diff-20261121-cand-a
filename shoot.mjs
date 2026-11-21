// TIDEWATCH screenshots: chrome-headless-shell + playwright-core,
// ?shot= states, 1280x800 PNG -> JPEG q82 via PIL (each <= 256 KiB).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire('/home/hatch/workspace/makefun/bth-playwright/package.json');
const { chromium } = require('playwright-core');

const CHROME = '/home/hatch/workspace/makefun/bth-playwright/chrome-headless-shell-linux64/chrome-headless-shell';
const BASE = process.env.GAME_URL || 'http://localhost:8903/';
const OUT = '/home/hatch/workspace/makefun/spot-diff-20261121-cand-a/screenshots';
const SHOTS = [
  ['1-title.jpg', '?shot=1&seed=1'],
  ['2-play.jpg', '?shot=2&seed=1'],
  ['3-action.jpg', '?shot=3&seed=1'],
  ['4-end.jpg', '?shot=4&seed=1'],
];

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

for (const [name, query] of SHOTS) {
  const png = `/tmp/tw-${name.replace('.jpg', '.png')}`;
  await page.goto(BASE + query, { waitUntil: 'load' });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { ready = await page.evaluate(() => !!window.__shotReady); } catch { ready = false; }
    if (ready) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(name, 'shotReady:', ready);
  await page.screenshot({ path: png });
  execFileSync('python3', ['-c',
    `from PIL import Image; im=Image.open(${JSON.stringify(png)}).convert('RGB'); im.save(${JSON.stringify(OUT + '/' + name)}, quality=82)`]);
  console.log(name, 'saved');
}
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
