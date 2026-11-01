const { chromium } = require('playwright');

async function inspectModulesElements() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 8000 });

  await page.goto('http://localhost:5173/modules', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    function getBox(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        selector,
        rect: { left: rect.left, right: rect.right, width: rect.width },
        padding: cs.padding,
        margin: cs.margin,
        boxSizing: cs.boxSizing,
        width: cs.width,
        maxWidth: cs.maxWidth
      };
    }

    return {
      mainContent: getBox('.main-content'),
      main: getBox('main'),
      deskSpace: getBox('.desk-space'),
      pageHeader: getBox('.page-header-editorial'),
      pageTitle: getBox('.page-title'),
      pageEyebrow: getBox('.page-eyebrow'),
      pageSubtitle: getBox('.page-subtitle'),
      topbar: getBox('.workspace-topbar'),
      breadcrumb: getBox('.workspace-breadcrumb'),
      filters: getBox('.desk-space > div:nth-of-type(2)') // filter bar
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'screenshots/responsive-audit/test_modules_390.png' });
  await browser.close();
}

inspectModulesElements().catch(console.error);

