const { chromium } = require('playwright');

async function auditComputedStyles() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('=== AUDITING RUNNING APP COMPUTED STYLES (BEFORE) ===\n');

  // 1. Audit Homepage
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const homeStyles = await page.evaluate(() => {
    function getColors(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.borderColor
      };
    }
    return {
      body: getColors('body'),
      main: getColors('main') || getColors('.home-container') || getColors('.portal-layout-main'),
      cards: getColors('.editorial-feature-card') || getColors('.portal-card') || getColors('.card'),
      navbar: getColors('header') || getColors('nav')
    };
  });
  console.log('--- HOMEPAGE COMPUTED STYLES ---');
  console.log('Body:', homeStyles.body);
  console.log('Main:', homeStyles.main);
  console.log('Cards:', homeStyles.cards);
  console.log('Navbar:', homeStyles.navbar);

  // 2. Audit Dashboard with logged in user
  // Log in as returning learner
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const dashStyles = await page.evaluate(() => {
    function getColors(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        selector,
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.borderColor
      };
    }
    return [
      getColors('body'),
      getColors('.atelier-dashboard-canvas'),
      getColors('.atelier-masthead-card'),
      getColors('.atelier-masthead-dossier'),
      getColors('.atelier-card'),
      getColors('.atelier-dossier-card'),
      getColors('.digital-moment-card'),
      getColors('.targeted-pathway-card'),
      getColors('.atelier-table-row'),
      getColors('.atelier-table-head')
    ].filter(Boolean);
  });

  console.log('\n--- ESTABLISHED DASHBOARD COMPUTED STYLES ---');
  dashStyles.forEach(s => {
    console.log(`${s.selector} -> bg: ${s.bg}, text: ${s.color}, border: ${s.border}`);
  });

  // 3. First visit learner
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'demo.fresh@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const firstVisitStyles = await page.evaluate(() => {
    function getColors(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        selector,
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.borderColor
      };
    }
    return [
      getColors('.first-visit-hero'),
      getColors('.first-visit-triad-ledger'),
      getColors('.first-visit-dossier-col'),
      getColors('.dossier-accent-col'),
      getColors('.first-visit-sequence-container'),
      getColors('.sequence-node-col'),
      getColors('.first-visit-primary-btn')
    ].filter(Boolean);
  });

  console.log('\n--- FIRST-VISIT DASHBOARD COMPUTED STYLES ---');
  firstVisitStyles.forEach(s => {
    console.log(`${s.selector} -> bg: ${s.bg}, text: ${s.color}, border: ${s.border}`);
  });

  await browser.close();
}

auditComputedStyles().catch(console.error);
