import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };
// Test-only HTTP preview exposes the page and public assets, never private files.
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
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const cards = page.locator('#skills .sk-card');
  const expected = [
    ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'SQL', 'HTML/CSS'],
    ['React', 'Next.js', 'FastAPI', 'REST APIs', 'Tailwind CSS'],
    ['PostgreSQL', 'Supabase', 'Relational Database Design', 'Row-Level Security'],
    ['Threat Detection', 'Risk Assessment', 'Role-Based Access Control', 'API Security', 'Threat Modeling / STRIDE'],
    ['Docker', 'GitHub Actions / CI/CD', 'Playwright', 'pytest / Vitest', 'Vercel', 'VS Code', 'npm'],
    ['OpenAI API', 'scikit-learn', 'Anomaly Detection', 'Model Evaluation', 'Vision-Based Analysis'],
    ['ChatGPT', 'Codex', 'Claude'],
  ];
  assert.deepEqual(await cards.evaluateAll((elements) => elements.map((card) => [...card.querySelectorAll('.tag')].map((tag) => tag.textContent))), expected);
  const jumps = page.locator('.flow-menu button');
  assert.equal(await jumps.count(), 7);
  await cards.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => document.querySelector('.flow-counter').textContent === '3 / 7');
  assert.equal(await cards.nth(2).getAttribute('aria-current'), 'true');
  assert.equal(await jumps.nth(2).getAttribute('aria-current'), 'true');
  assert.equal(await cards.nth(6).getAttribute('tabindex'), '-1');
  assert.equal(await cards.nth(6).getAttribute('aria-hidden'), 'true');
  assert.ok(await cards.nth(1).evaluate((card) => getComputedStyle(card).transform.startsWith('matrix3d')));
  await page.screenshot({ path: '/tmp/mila-skills-coverflow-desktop.png' });
  await page.getByRole('button', { name: 'Next skill category', exact: true }).click();
  await page.waitForTimeout(1800);
  assert.equal(await cards.nth(3).getAttribute('aria-current'), 'true');
  await cards.nth(3).dispatchEvent('click');
  await page.waitForTimeout(100);
  const popScale = await cards.nth(3).evaluate((card) => Number(card.style.transform.match(/scale\(([^)]+)\)/)[1]));
  assert.ok(popScale > 1 && popScale <= 1.041);
  await page.waitForTimeout(900);
  const selectedBox = await cards.nth(3).boundingBox();
  await page.mouse.move(selectedBox.x + selectedBox.width * .7, selectedBox.y + selectedBox.height * .25);
  await page.waitForTimeout(300);
  assert.ok(Math.abs(await cards.nth(3).evaluate((card) => parseFloat(card.style.getPropertyValue('--shine-x')))) > 1);
  assert.ok(await cards.nth(3).evaluate((card) => Math.abs(Number(card.style.transform.match(/rotateX\(([-.\d]+)deg\)/)[1])) > .5));
  // A visible side card is pointer-selectable without moving focus off controls.
  await cards.nth(2).dispatchEvent('click');
  await page.waitForTimeout(1800);
  assert.equal(await cards.nth(2).getAttribute('aria-current'), 'true');
  await jumps.nth(6).click();
  await page.waitForTimeout(1800);
  assert.equal(await cards.nth(6).getAttribute('aria-current'), 'true');
  await jumps.nth(0).click();
  await page.waitForTimeout(1800);
  const bounds = await page.locator('.flow-viewport').boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y, { steps: 4 });
  await page.waitForTimeout(100);
  const dragTransform = await cards.nth(0).evaluate((card) => card.style.transform);
  assert.notEqual(await cards.nth(0).getAttribute('aria-current'), 'true');
  await page.mouse.move(x - 125, y, { steps: 4 });
  await page.waitForTimeout(150);
  assert.notEqual(await cards.nth(0).evaluate((card) => card.style.transform), dragTransform);
  await page.mouse.up();
  await page.waitForTimeout(1800);
  assert.equal(await cards.nth(2).getAttribute('aria-current'), 'true');
  // Short fast flick carries beyond the one-card drag distance.
  await page.mouse.move(x + 35, y);
  await page.mouse.down();
  await page.mouse.move(x - 45, y, { steps: 2 });
  await page.mouse.up();
  await page.waitForTimeout(1800);
  const flickIndex = await cards.evaluateAll((elements) => elements.findIndex((card) => card.getAttribute('aria-current') === 'true'));
  assert.ok(flickIndex >= 4, `Flick only reached ${flickIndex}`);
  await jumps.nth(2).click();
  await page.waitForTimeout(1800);
  await page.locator('.flow-viewport').dispatchEvent('wheel', { deltaX: 90, deltaY: 0, deltaMode: 0, cancelable: true });
  await page.waitForTimeout(1800);
  assert.equal(await cards.nth(3).getAttribute('aria-current'), 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.locator('#skills').scrollIntoViewIfNeeded();
  const size = await page.locator('.flow-viewport').evaluate((viewport) => ({ width: viewport.clientWidth, card: viewport.querySelector('.sk-card').offsetWidth, overflow: document.documentElement.scrollWidth > innerWidth }));
  assert.ok(Math.abs(size.card / size.width - .8) < .02);
  assert.equal(size.overflow, false);
  const viewport = page.locator('.flow-viewport');
  assert.equal(await page.locator('.flow-menu').evaluate((menu) => getComputedStyle(menu).flexDirection), 'row');
  assert.equal(await viewport.evaluate((element) => getComputedStyle(element).touchAction), 'pan-y');
  await jumps.nth(2).click();
  await page.waitForTimeout(1800);
  await viewport.dispatchEvent('pointerdown', { pointerId: 9, pointerType: 'touch', isPrimary: true, button: 0, clientX: 260, clientY: 400 });
  await page.waitForTimeout(40);
  await viewport.dispatchEvent('pointermove', { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: 180, clientY: 405 });
  await page.waitForTimeout(150);
  await viewport.dispatchEvent('pointerup', { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: 180, clientY: 405 });
  await page.waitForTimeout(1800);
  assert.equal(await cards.nth(3).getAttribute('aria-current'), 'true');
  await page.screenshot({ path: '/tmp/mila-skills-coverflow-mobile.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Next skill category', exact: true }).click();
  assert.equal(await cards.nth(4).getAttribute('aria-current'), 'true');
  const before = await cards.nth(4).evaluate((card) => card.style.transform);
  await page.waitForTimeout(200);
  assert.equal(await cards.nth(4).evaluate((card) => card.style.transform), before);
  assert.equal(await cards.nth(4).evaluate((card) => getComputedStyle(card, '::before').display), 'none');
  await page.setViewportSize({ width: 320, height: 740 });
  await page.waitForTimeout(150);
  for (let i = 0; i < 7; i++) {
    await jumps.nth(i).click();
    await page.waitForTimeout(150);
    assert.ok(await cards.nth(i).evaluate((card) => {
      const items = card.querySelector('.tags');
      return items.offsetTop + items.offsetHeight <= card.clientHeight - 12;
    }), `Card ${i + 1} content is clipped at 320px`);
  }
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
  await touchPage.locator('.flow-viewport').scrollIntoViewIfNeeded();
  await touchPage.waitForTimeout(700);
  const touchBox = await touchPage.locator('.flow-viewport').boundingBox();
  const client = await touchContext.newCDPSession(touchPage);
  const touchX = touchBox.x + touchBox.width / 2;
  const touchY = Math.min(650, touchBox.y + touchBox.height / 2);
  const scrollBefore = await touchPage.evaluate(() => scrollY);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchX, y: touchY }] });
  for (let i = 1; i <= 6; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchX + 1, y: touchY - i * 20 }] });
    await touchPage.waitForTimeout(25);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touchPage.waitForTimeout(350);
  assert.ok(await touchPage.evaluate(() => scrollY) > scrollBefore + 20, 'Vertical touch gesture should scroll the page');
  assert.equal(await touchPage.locator('.skills-coverflow').getAttribute('data-dragging'), null);
  await touchContext.close();
  assert.deepEqual(errors, []);
  console.log('Verified content, CSS 3D, keyboard, category jumps, live mouse scrub, flick momentum, wheel, touch swipe, mobile chips, reduced motion, and no page errors.');
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
