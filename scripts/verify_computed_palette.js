const { chromium } = require('playwright');

async function checkColors() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Test 1: Public Homepage
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
  const bodyText = await page.evaluate(() => window.getComputedStyle(document.body).color);

  console.log('Homepage Body Background:', bodyBg);
  console.log('Homepage Body Text Color:', bodyText);

  // Test 2: Login as fresh demo user to inspect first-visit dashboard
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo.fresh@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 8000 });
  await page.waitForTimeout(1000);

  const firstVisitHeroBg = await page.evaluate(() => {
    const el = document.querySelector('.first-visit-hero');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const firstVisitCardBg = await page.evaluate(() => {
    const el = document.querySelector('.first-visit-triad-ledger');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const firstVisitPreviewBg = await page.evaluate(() => {
    const el = document.querySelector('.first-visit-stage-preview');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const firstVisitAccentColBg = await page.evaluate(() => {
    const el = document.querySelector('.dossier-accent-col');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });

  console.log('First Visit Hero Background:', firstVisitHeroBg);
  console.log('First Visit Ledger Background:', firstVisitCardBg);
  console.log('First Visit Stage Preview Background:', firstVisitPreviewBg);
  console.log('First Visit Accent Col Background:', firstVisitAccentColBg);

  // Test 3: Login as established demo user to inspect main dashboard cards
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 8000 });
  await page.waitForTimeout(1500);

  const dossierCardBg = await page.evaluate(() => {
    const el = document.querySelector('.atelier-dossier-card');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const dossierCardBorder = await page.evaluate(() => {
    const el = document.querySelector('.atelier-dossier-card');
    return el ? window.getComputedStyle(el).borderColor : 'NOT_FOUND';
  });
  const storySectionBg = await page.evaluate(() => {
    const el = document.querySelector('.story-atelier-section');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const codexCardBg = await page.evaluate(() => {
    const el = document.querySelector('.curriculum-codex-card');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const codexActiveChapterBg = await page.evaluate(() => {
    const el = document.querySelector('.codex-active-chapter');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });
  const pathwaysPreviewBg = await page.evaluate(() => {
    const el = document.querySelector('.atelier-pathways-preview');
    return el ? window.getComputedStyle(el).backgroundColor : 'NOT_FOUND';
  });

  console.log('Dossier Card Background:', dossierCardBg);
  console.log('Dossier Card Border:', dossierCardBorder);
  console.log('Story Section Background:', storySectionBg);
  console.log('Curriculum Codex Card Background:', codexCardBg);
  console.log('Active Chapter Card Background:', codexActiveChapterBg);
  console.log('Pathways Preview Background:', pathwaysPreviewBg);

  await browser.close();
}

checkColors().catch(err => {
  console.error(err);
  process.exit(1);
});

