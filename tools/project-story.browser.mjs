import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (path !== resolve(root, 'index.html') && !path.startsWith(resolve(root, 'assets') + '/')) {
    response.writeHead(404).end(); return;
  }
  try { response.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream'); response.end(await readFile(path)); }
  catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.story-enhanced'));
  assert.deepEqual(await page.locator('.story-step h3').allTextContents(), ['Mochi', 'Kizashi', 'Malu', 'Veterinary Clinical Data Analysis']);
  assert.equal(await page.locator('[data-project="kizashi"] a').getAttribute('href'), 'https://kizashi-flax.vercel.app/prepare');
  assert.equal(await page.locator('.story-sparkles i').count(), 6);
  const stops = [.05, .1 + .8 / 3, .1 + .8 * 2 / 3, .95];
  const visit = async (i) => {
    await page.evaluate((fraction) => {
      const track = document.querySelector('.project-story');
      const stage = track.querySelector('.story-stage');
      const top = track.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: top + (track.offsetHeight - stage.offsetHeight) * fraction, behavior: 'instant' });
    }, stops[i]);
    await page.waitForFunction((index) => document.querySelector('.project-story').dataset.storyStep === String(index), i);
    assert.equal(await page.locator('.story-count').textContent(), `0${i + 1} / 04`);
    assert.equal(await page.locator('.story-panel:not([hidden])').getAttribute('data-panel'), String(i));
    assert.equal(await page.locator('.story-sparkles i').first().evaluate((element) => getComputedStyle(element).animationName), 'projectSparkleOrbit');
  };
  for (const i of [0, 1, 2, 3, 2, 1, 0]) await visit(i);
  await page.getByRole('button', { name: 'Show Kizashi', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.project-story').dataset.storyStep === '1');
  assert.ok((await page.locator('[data-panel="1"] .story-description').textContent()).includes('experimental AI Research Lab'));
  const before = await page.locator('.story-sparkles i').first().evaluate((element) => getComputedStyle(element).transform);
  await page.waitForTimeout(500);
  assert.notEqual(await page.locator('.story-sparkles i').first().evaluate((element) => getComputedStyle(element).transform), before);
  await page.screenshot({ path: '/tmp/mila-kizashi-project-desktop.png' });
  for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 667 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(250);
    await visit(1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.ok(await page.locator('.story-card').evaluate((card) => card.clientHeight > 120));
    assert.ok(await page.evaluate(() => document.querySelector('.story-card').getBoundingClientRect().top < document.querySelector('.story-steps').getBoundingClientRect().top));
    if (viewport.height === 844) await page.screenshot({ path: '/tmp/mila-kizashi-project-mobile.png' });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit(3);
  assert.equal(await page.locator('.story-step').first().evaluate((element) => element.style.transform), 'none');
  assert.deepEqual(errors, []);
  console.log('Verified four-project order, live link, forward/reverse scrolling, progress controls, moving sparkles, desktop/mobile sizing, and reduced motion.');
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
