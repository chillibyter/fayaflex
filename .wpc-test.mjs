process.env.PLAYWRIGHT_BROWSERS_PATH = '/home/runner/.cache/ms-playwright';

const random6 = Math.random().toString(36).slice(2, 8);
const username = `wpct${random6}`;
const email = `wpct${random6}@x.com`;

const reg = await fetch('http://localhost:5000/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password: 'TestPass123!', displayName: 'WPC' }),
});
console.log("Register status:", reg.status);
const regJson = await reg.json();
const token = regJson.token;
console.log("User:", username);

const posts = [
  "Completed a running workout\n5.2 km · 28 min · 412 cal · 158 bpm avg · 5:23 min/km · 124 m elevation\n\nGreat morning run!",
  "Completed a cycling workout\n42.6 km · 1h 32m · 864 cal · 27.8 km/h · 380 m elevation",
  "Completed a strength training workout\n58 min · 412 cal · 124 bpm avg\n\nNew bench PR!",
];
for (const content of posts) {
  const r = await fetch('http://localhost:5000/api/feed/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  console.log("Post:", r.status);
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true, executablePath: '/nix/store/5afrhwm7zqn1vb7p5z1mc2rkh2grsfgz-ungoogled-chromium-138.0.7204.100/bin/chromium' });
const context = await browser.newContext({ viewport: { width: 414, height: 900 }, deviceScaleFactor: 2 });

await context.addInitScript((t) => {
  try {
    localStorage.setItem('ufc_auth_token', t);
    // Also mark "skip team" so we go straight to feed even without teams
    // We'll add the user-scoped key after we know user.id, but also try the loose form.
  } catch(e) {}
}, token);

const page = await context.newPage();
const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

// First navigate to root, wait for auth to settle, then add skip-team key, then go to /feed
await page.goto('http://localhost:5000/', { waitUntil: 'networkidle', timeout: 30000 });

const ls = await page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    out[k] = localStorage.getItem(k);
  }
  return out;
});
console.log("LocalStorage after first goto:", JSON.stringify(ls).slice(0, 300));

// Test API directly from the browser context with the token
const apiTest = await page.evaluate(async (t) => {
  const r = await fetch('/api/auth/user', { headers: { 'Authorization': `Bearer ${t}` }, credentials: 'include' });
  return { status: r.status, body: (await r.text()).slice(0, 200) };
}, token);
console.log("Browser /api/auth/user with Bearer:", JSON.stringify(apiTest));

const apiTest2 = await page.evaluate(async () => {
  const r = await fetch('/api/auth/user', { credentials: 'include' });
  return { status: r.status, body: (await r.text()).slice(0, 200) };
});
console.log("Browser /api/auth/user no Bearer:", JSON.stringify(apiTest2));

// Add skip team key
const userId = regJson.id;
await page.evaluate((uid) => {
  localStorage.setItem(`fayaflex_skip_team_${uid}`, 'true');
  localStorage.setItem(`fayaflex_onboarding_seen_${uid}`, 'true');
}, userId);

// Navigate to /feed
await page.goto('http://localhost:5000/feed', { waitUntil: 'networkidle', timeout: 30000 });
console.log("URL after /feed goto:", page.url());

try {
  await page.waitForSelector('[data-testid="workout-post-card"]', { timeout: 15000 });
} catch (e) {
  console.log("workout-post-card not found in 15s");
}
await page.waitForTimeout(2500);

const cards = await page.$$('[data-testid="workout-post-card"]');
console.log("Workout cards rendered:", cards.length);

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
    };
  });
  cardInfos.push(info);
}
console.log(JSON.stringify(cardInfos, null, 2));

const screenshotPath = '/home/runner/workspace/wpc-redesign-feed.png';
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log("Screenshot:", screenshotPath);

const brokenImgs = await page.evaluate(() => Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
console.log("Broken images:", JSON.stringify(brokenImgs));

const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
console.log("Doc overflow:", JSON.stringify(overflow));

const errors = consoleMsgs.filter(m => m.startsWith('[error]') || m.startsWith('[pageerror]'));
console.log(`Console msgs: ${consoleMsgs.length}, errors: ${errors.length}`);
for (const m of errors.slice(0, 20)) console.log(" ", m);

await browser.close();
