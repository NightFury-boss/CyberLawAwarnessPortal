const { chromium } = require('playwright');

async function inspectAuthenticatedPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 8000 });
  await page.waitForTimeout(1000);

  const pagesToTest = [
    { name: 'Dashboard', url: 'http://localhost:5173/dashboard' },
    { name: 'Modules', url: 'http://localhost:5173/modules' },
    { name: 'Quizzes', url: 'http://localhost:5173/quizzes' },
    { name: 'Assessment Results', url: 'http://localhost:5173/assessment/baseline' }
  ];

  for (const pt of pagesToTest) {
    console.log(`\n========================================`);
    console.log(`INSPECTING: ${pt.name} (${pt.url})`);
    console.log(`========================================`);
    await page.goto(pt.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const layoutData = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      const mainContent = document.querySelector('.main-content');
      const mcCS = mainContent ? window.getComputedStyle(mainContent) : null;
      const mcRect = mainContent ? mainContent.getBoundingClientRect() : null;

      const topbar = document.querySelector('.workspace-topbar');
      const tbRect = topbar ? topbar.getBoundingClientRect() : null;

      // Find any elements exceeding docWidth or having rect.left < 0
      const elements = Array.from(document.querySelectorAll('*'));
      const leftClipped = [];
      const rightOverflowing = [];

      for (const el of elements) {
        if (['SCRIPT', 'STYLE', 'LINK', 'META'].includes(el.tagName)) continue;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        if (rect.left < -0.5) {
          leftClipped.push({
            tag: el.tagName,
            class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
            rectLeft: Math.round(rect.left),
            rectRight: Math.round(rect.right),
            rectWidth: Math.round(rect.width),
            text: (el.innerText || '').slice(0, 30).replace(/\n/g, ' ')
          });
        }
        if (rect.right > docWidth + 0.5) {
          rightOverflowing.push({
            tag: el.tagName,
            class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
            rectLeft: Math.round(rect.left),
            rectRight: Math.round(rect.right),
            rectWidth: Math.round(rect.width),
            text: (el.innerText || '').slice(0, 30).replace(/\n/g, ' ')
          });
        }
      }

      return {
        docWidth,
        scrollWidth,
        mainContent: {
          className: mainContent?.className,
          marginLeft: mcCS?.marginLeft,
          padding: mcCS?.padding,
          rect: mcRect ? { left: mcRect.left, right: mcRect.right, width: mcRect.width } : null
        },
        topbar: tbRect ? { left: tbRect.left, right: tbRect.right, width: tbRect.width } : null,
        leftClippedCount: leftClipped.length,
        leftClipped: leftClipped.slice(0, 6),
        rightOverflowingCount: rightOverflowing.length,
        rightOverflowing: rightOverflowing.slice(0, 6)
      };
    });

    console.log(JSON.stringify(layoutData, null, 2));
  }

  await browser.close();
}

inspectAuthenticatedPages().catch(console.error);

