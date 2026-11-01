const { chromium } = require('playwright');

async function debugHeroStyles() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    function getDetails(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        selector,
        rect: { left: rect.left, right: rect.right, width: rect.width },
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        width: cs.width,
        minWidth: cs.minWidth,
        maxWidth: cs.maxWidth,
        padding: cs.padding,
        margin: cs.margin,
        boxSizing: cs.boxSizing,
        display: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        flexDirection: cs.flexDirection
      };
    }

    return {
      body: getDetails('body'),
      container: getDetails('.portal-hero-container'),
      content: getDetails('.portal-hero-content'),
      flowCard: getDetails('.hero-flow-card'),
      frameworkLine: getDetails('.portal-hero-framework-line'),
      emergency: getDetails('.portal-hero-emergency')
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

debugHeroStyles().catch(console.error);

