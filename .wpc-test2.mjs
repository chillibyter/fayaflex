process.env.PLAYWRIGHT_BROWSERS_PATH = '/home/runner/.cache/ms-playwright';

const random6 = Math.random().toString(36).slice(2, 8);
const username = `wpct${random6}`;
const email = `wpct${random6}@x.com`;

const reg = await fetch('http://localhost:5000/api/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password: 'TestPass123!', displayName: 'WPC' }),
});
const regJson = await reg.json();
const token = regJson.token;
const userId = regJson.id;
console.log("User:", username, "id:", userId);

const posts = [
  "Completed a running workout\n5.2 km · 28 min · 412 cal · 158 bpm avg · 5:23 min/km · 124 m elevation\n\nGreat morning run!",
  "Completed a cycling workout\n42.6 km · 1h 32m · 864 cal · 27.8 km/h · 380 m elevation",
  "Completed a strength training workout\n58 min · 412 cal · 124 bpm avg\n\nNew bench PR!",
];
for (const content of posts) {
  await fetch('http://localhost:5000/api/feed/posts', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
}

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true, executablePath: '/nix/store/5afrhwm7zqn1vb7p5z1mc2rkh2grsfgz-ungoogled-chromium-138.0.7204.100/bin/chromium' });
const context = await browser.newContext({ viewport: { width: 414, height: 900 }, deviceScaleFactor: 2 });

await context.addInitScript(({ t, uid }) => {
  try {
    localStorage.setItem('ufc_auth_token', t);
    localStorage.setItem(`fayaflex_skip_team_${uid}`, 'true');
    localStorage.setItem(`fayaflex_onboarding_seen_${uid}`, 'true');
  } catch(e) {}
}, { t: token, uid: userId });

const page = await context.newPage();
const consoleMsgs = [];
page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', (req) => consoleMsgs.push(`[reqfailed] ${req.url()} - ${req.failure()?.errorText}`));

await page.goto('http://localhost:5000/feed', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

console.log("URL:", page.url());
console.log("\n=== ALL console messages ===");
for (const m of consoleMsgs) console.log("  ", m);

const cards = await page.$$('[data-testid="workout-post-card"]');
console.log("\nWorkout cards rendered:", cards.length);

await page.screenshot({ path: '/home/runner/workspace/wpc-redesign-feed.png', fullPage: true });
await browser.close();
