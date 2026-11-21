// TIDEWATCH live-play probe: click PLAY, click the lighthouse-light
// difference on the left panel, screenshot, and report the FOUND counter
// by reading it back from the canvas pixels is unreliable — instead we
// screenshot and let a human read it. Also exercises a wrong click.
import { createRequire } from 'node:module';

const require = createRequire('/home/hatch/workspace/makefun/bth-playwright/package.json');
const { chromium } = require('playwright-core');

const CHROME = '/home/hatch/workspace/makefun/bth-playwright/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:8903/', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 800));
// PLAY button centre (640, 546).
await page.mouse.click(640, 546);
await new Promise((r) => setTimeout(r, 500));
// Correct click: lighthouse light, left panel (16+300, 84+168) = (316, 252).
await page.mouse.click(316, 252);
await new Promise((r) => setTimeout(r, 300));
// Wrong click: open sea, left panel (200, 600).
await page.mouse.click(200, 600);
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: '/tmp/tw-live-probe.png' });
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
console.log('probe screenshot saved');
