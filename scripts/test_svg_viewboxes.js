const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean/clean_tight_monogram_light.png';
  const base64 = fs.readFileSync(lightMonoPath).toString('base64');

  // SVG 1: Old version with 256x256 and 33px top/bottom padding
  const svgOld = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="100%" height="100%">
  <image x="12" y="33" width="232" height="190" xlink:href="data:image/png;base64,${base64}" />
</svg>`.trim();

  // SVG 2: Maximized non-square viewBox="-8 -7 268 219" (Monogram fills 94% of width and 94% of height)
  const svgMaxTight = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-8 -7 268 219" width="100%" height="100%">
  <image x="0" y="0" width="252" height="205" xlink:href="data:image/png;base64,${base64}" />
</svg>`.trim();

  // SVG 3: Maximized square viewBox="0 0 256 256" with monogram scaled to 244x198 centered at (6, 29) (Fills 95% of width)
  const svgMaxSquare = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="100%" height="100%">
  <image x="6" y="29" width="244" height="198" xlink:href="data:image/png;base64,${base64}" />
</svg>`.trim();

  fs.writeFileSync('scratch/svg_old.svg', svgOld);
  fs.writeFileSync('scratch/svg_tight.svg', svgMaxTight);
  fs.writeFileSync('scratch/svg_square.svg', svgMaxSquare);

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { background: #222; color: #FFF; font-family: sans-serif; padding: 20px; }
        .tab-bar { display: flex; gap: 10px; background: #2B2A29; padding: 10px; border-radius: 8px; }
        .tab { display: flex; align-items: center; gap: 8px; background: #383634; padding: 6px 14px; border-radius: 6px; font-size: 12px; }
        .tab.active { background: #45423E; }
        .tab img { width: 16px; height: 16px; }
      </style>
    </head>
    <body>
      <h3>Simulated Chrome Tab Bar (16×16 Favicon Slot)</h3>
      <div class="tab-bar">
        <div class="tab">
          <img src="data:image/svg+xml;utf8,${encodeURIComponent(svgOld)}">
          <span>Old Favicon (Small in tab)</span>
        </div>
        <div class="tab active">
          <img src="data:image/svg+xml;utf8,${encodeURIComponent(svgMaxTight)}">
          <span>Max Tight (~94% Artwork)</span>
        </div>
        <div class="tab">
          <img src="data:image/svg+xml;utf8,${encodeURIComponent(svgMaxSquare)}">
          <span>Max Square (95% Width)</span>
        </div>
      </div>
    </body>
    </html>
  `);

  await page.screenshot({ path: 'scratch/tab_svg_comparison.png', clip: { x: 0, y: 0, width: 800, height: 200 } });
  console.log('Saved scratch/tab_svg_comparison.png');
  await browser.close();
})();

