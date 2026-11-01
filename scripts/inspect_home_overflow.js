const { chromium } = require('playwright');

async function inspectHomeElements() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  const data = await page.evaluate(() => {
    const hero = document.querySelector('.portal-hero-section');
    if (!hero) return 'No hero found';

    const results = [];
    const elements = hero.querySelectorAll('*');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (rect.right > 390) {
        results.push({
          tag: el.tagName,
          class: el.className,
          rectRight: Math.round(rect.right),
          rectWidth: Math.round(rect.width),
          rectLeft: Math.round(rect.left),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          text: (el.innerText || '').slice(0, 40)
        });
      }
    }
    return results;
  });

  console.log('Overflowing hero elements at 390px:');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
}

inspectHomeElements().catch(console.error);

