const { chromium } = require('playwright');

async function inspectFullDashboard() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // Login as returning
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 8000 });
  await page.waitForTimeout(1000);

  const overflowList = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const elements = Array.from(document.querySelectorAll('*'));
    const bad = [];
    for (const el of elements) {
      if (['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)) continue;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (rect.right > docWidth + 1) {
        bad.push({
          tag: el.tagName,
          className: el.className?.toString().slice(0, 50),
          rectRight: Math.round(rect.right),
          rectWidth: Math.round(rect.width),
          textSnippet: (el.innerText || '').slice(0, 35).replace(/\n/g, ' ')
        });
      }
    }
    return bad;
  });

  console.log(`Overflow elements at 375px: ${overflowList.length}`);
  console.log(JSON.stringify(overflowList.slice(0, 20), null, 2));

  await browser.close();
}

inspectFullDashboard().catch(console.error);

