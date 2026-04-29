process.env.PLAYWRIGHT_BROWSERS_PATH = '/home/runner/.cache/ms-playwright';
const { chromium } = await import('playwright');

const token = process.argv[2];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 414, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

await page.goto('http://localhost:5000/', { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => { localStorage.setItem('ufc_auth_token', t); }, token);

await page.goto('http://localhost:5000/feed', { waitUntil: 'networkidle', timeout: 30000 });

try {
  await page.waitForSelector('[data-testid="workout-post-card"]', { timeout: 15000 });
} catch (e) {
  console.log("No workout-post-card found within 15s");
}
await page.waitForTimeout(2500);

const cards = await page.$$('[data-testid="workout-post-card"]');
console.log("Workout cards found:", cards.length);

const cardInfos = [];
for (const c of cards) {
  const info = await c.evaluate((el) => {
    const badge = el.querySelector('[data-testid="workout-type-badge"]');
    const cs = getComputedStyle(el);
    const badgeCs = badge ? getComputedStyle(badge) : null;
    return {
      bgColor: cs.backgroundColor,
      borderColor: cs.borderColor,
      badgeText: badge?.textContent?.trim() ?? null,
      badgeBg: badgeCs?.backgroundColor ?? null,
      badgeColor: badgeCs?.color ?? null,
    };
  });
  cardInfos.push(info);
}
console.log(JSON.stringify(cardInfos, null, 2));

const screenshotPath = '/home/runner/workspace/wpc-redesign-feed.png';
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log("Screenshot saved to:", screenshotPath);

console.log("\nConsole messages (" + consoleMsgs.length + "):");
for (const m of consoleMsgs.slice(0, 50)) console.log(" ", m);

const brokenImgs = await page.evaluate(() => {
  const imgs = Array.from(document.images);
  return imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => ({ src: i.src, alt: i.alt }));
});
console.log("Broken images:", JSON.stringify(brokenImgs));

const overflow = await page.evaluate(() => {
  const root = document.documentElement;
  return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
});
console.log("Document overflow:", JSON.stringify(overflow));

await browser.close();
