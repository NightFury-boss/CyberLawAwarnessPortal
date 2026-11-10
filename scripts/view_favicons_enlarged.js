const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const std16 = fs.readFileSync('scratch/std16.png').toString('base64');
  const ded16 = fs.readFileSync('scratch/ded16.png').toString('base64');
  const std32 = fs.readFileSync('scratch/std32.png').toString('base64');
  const ded32 = fs.readFileSync('scratch/ded32.png').toString('base64');

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1C1B1A; color: #F0EDE8; padding: 30px; }
        h2 { font-size: 16px; margin-top: 24px; color: #D4B895; text-transform: uppercase; letter-spacing: 0.1em; }
        .grid { display: flex; gap: 30px; align-items: flex-start; }
        .card { background: #2A2826; border: 1px solid #443E38; border-radius: 8px; padding: 20px; }
        .card h3 { font-size: 14px; margin: 0 0 12px 0; color: #E8DCCF; }
        .tab-preview { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; }
        .tab-light { background: #E8E6E3; color: #202124; }
        .tab-dark { background: #2B2A29; color: #E8EAED; }
        .tab-forest { background: #394B36; color: #FFFCF5; }
        .pixel-view { margin-top: 15px; display: flex; gap: 10px; align-items: center; }
        .pixel-view img { image-rendering: pixelated; border: 1px solid #555; }
      </style>
    </head>
    <body>
      <h2>Favicon 16×16 Comparison (Normal Zoom & 8× Pixel Zoom)</h2>
      <div class="grid">
        <div class="card">
          <h3>Standard Downscaled 16×16</h3>
          <div class="tab-preview tab-light">
            <img src="data:image/png;base64,${std16}" width="16" height="16">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <br><br>
          <div class="tab-preview tab-dark">
            <img src="data:image/png;base64,${std16}" width="16" height="16">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <div class="pixel-view">
            <span>8× Zoom:</span>
            <img src="data:image/png;base64,${std16}" width="128" height="128" style="background:#FFF;">
            <img src="data:image/png;base64,${std16}" width="128" height="128" style="background:#202124;">
          </div>
        </div>

        <div class="card">
          <h3>Dedicated Optically Tuned 16×16 (Boosted Visual Weight)</h3>
          <div class="tab-preview tab-light">
            <img src="data:image/png;base64,${ded16}" width="16" height="16">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <br><br>
          <div class="tab-preview tab-dark">
            <img src="data:image/png;base64,${ded16}" width="16" height="16">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <div class="pixel-view">
            <span>8× Zoom:</span>
            <img src="data:image/png;base64,${ded16}" width="128" height="128" style="background:#FFF;">
            <img src="data:image/png;base64,${ded16}" width="128" height="128" style="background:#202124;">
          </div>
        </div>
      </div>

      <h2>Favicon 32×32 Comparison (Retina / High-DPI Tabs & Bookmarks)</h2>
      <div class="grid">
        <div class="card">
          <h3>Standard Downscaled 32×32</h3>
          <div class="tab-preview tab-light">
            <img src="data:image/png;base64,${std32}" width="32" height="32">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <br><br>
          <div class="tab-preview tab-dark">
            <img src="data:image/png;base64,${std32}" width="32" height="32">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <div class="pixel-view">
            <span>4× Zoom:</span>
            <img src="data:image/png;base64,${std32}" width="128" height="128" style="background:#FFF;">
            <img src="data:image/png;base64,${std32}" width="128" height="128" style="background:#202124;">
          </div>
        </div>

        <div class="card">
          <h3>Dedicated Optically Tuned 32×32</h3>
          <div class="tab-preview tab-light">
            <img src="data:image/png;base64,${ded32}" width="32" height="32">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <br><br>
          <div class="tab-preview tab-dark">
            <img src="data:image/png;base64,${ded32}" width="32" height="32">
            <span>Cyber Law Awareness Portal</span>
          </div>
          <div class="pixel-view">
            <span>4× Zoom:</span>
            <img src="data:image/png;base64,${ded32}" width="128" height="128" style="background:#FFF;">
            <img src="data:image/png;base64,${ded32}" width="128" height="128" style="background:#202124;">
          </div>
        </div>
      </div>
    </body>
    </html>
  `);

  await page.screenshot({ path: 'scratch/favicon_comparison_preview.png', fullPage: true });
  console.log('Saved scratch/favicon_comparison_preview.png');
  await browser.close();
})();

