// Real browser E2E smoke test — Puppeteer driving the actual installed
// Chrome against the actual running server. Not part of `npm test` (which
// stays fast/dependency-light); run manually via `node test/e2e-smoke.mjs`
// while the server is up. Exercises the exact override guardrail flow a
// human admin would click through in ai-governance-console.html.
import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:4000';

function log(step, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${step}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
}

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

try {
  // 1. Landing page loads and shows the sign-in form.
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
  const title = await page.title();
  log('index.html loads', title === 'Platform Home', title);

  // 2. Sign in as the seeded Admin (Priya Nair).
  await page.evaluate(() => {
    document.querySelector('[data-email="priya.nair@vondigitalis.example"]').click();
  });
  await page.waitForSelector('#apps-list a', { timeout: 5000 });
  const appCount = await page.$$eval('#apps-list a', (as) => as.length);
  // Priya Nair is seeded with ONLY the 'admin' role assignment (not
  // operations/keeper too) — RBAC correctly scopes her to just the
  // AI Governance Console, not all three staff apps.
  log('admin (admin-only role) sees exactly the AI Governance Console', appCount === 1, `found ${appCount}`);

  // 3. Navigate to the AI Governance Console.
  await page.evaluate(() => { document.querySelector('a[href="ai-governance-console.html"]').click(); });
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#model-list .row', { timeout: 5000 });
  const modelRowCount = await page.$$eval('#model-list .row', (rs) => rs.length);
  log('model registry renders real rows from the API', modelRowCount >= 4, `found ${modelRowCount} rows`);

  // 4. Open the blocked Piranha-Count v3.2 candidate.
  const opened = await page.evaluate(() => {
    const row = [...document.querySelectorAll('#model-list .row')].find((r) => r.textContent.includes('Piranha-Count'));
    if (!row) return false;
    row.click();
    return true;
  });
  log('clicked into the Piranha-Count model row', opened);
  await page.waitForSelector('#model-categories .kpi-label', { timeout: 5000 });
  const categoryText = await page.$eval('#model-categories', (el) => el.textContent);
  log('test-result category breakdown renders (Turbid / low visibility)', categoryText.includes('Turbid'));

  const overrideVisible = await page.$eval('#override-btn', (el) => el.style.display !== 'none');
  log('override button is visible for a blocked model', overrideVisible);

  // 5. Try the override WITHOUT a justification — should be rejected client-side.
  await page.click('#override-btn');
  await page.waitForSelector('#override-modal.open', { timeout: 3000 });
  await page.click('#override-confirm');
  await new Promise((r) => setTimeout(r, 300));
  const errorShown = await page.$eval('#override-error', (el) => el.style.display !== 'none');
  log('override without justification is rejected in the UI', errorShown);

  // 6. Provide a justification and confirm — real API call, real DB write.
  await page.type('#override-justification', 'Verified via E2E smoke test — turbid-water variance accepted.');
  await page.click('#override-confirm');
  await page.waitForFunction(
    () => !document.getElementById('override-modal').classList.contains('open'),
    { timeout: 5000 }
  );
  await new Promise((r) => setTimeout(r, 400));
  const promoteHidden = await page.$eval('#promote-btn', (el) => el.style.display === 'none');
  const statusBadge = await page.$eval('#model-latest-run', (el) => el.textContent);
  log('after override, the model reflects an updated state in the UI', promoteHidden, statusBadge.slice(0, 80));

  // 7. Reload the page fresh (resets client-side state back to the registry
  // view) and re-navigate into the same model, to confirm the override
  // PERSISTED server-side — not just a client-side illusion from step 6.
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#model-list .row', { timeout: 5000 });
  await page.evaluate(() => {
    const row = [...document.querySelectorAll('#model-list .row')].find((r) => r.textContent.includes('Piranha-Count'));
    row.click();
  });
  await page.waitForSelector('#override-region', { timeout: 5000 });
  const overrideLogVisible = await page.$eval('#override-region', (el) => el.style.display !== 'none');
  const overrideLogText = await page.$eval('#model-overrides', (el) => el.textContent);
  log('override is persisted server-side and visible after reload', overrideLogVisible && overrideLogText.includes('E2E smoke test'));

} catch (err) {
  console.error('E2E SCRIPT ERROR:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
