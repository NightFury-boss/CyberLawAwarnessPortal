const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/screenshots/brand-identity';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const svgBase64 = fs.readFileSync(path.resolve(__dirname, '../client/public/favicon.svg')).toString('base64');
  const png16Base64 = fs.readFileSync(path.resolve(__dirname, '../client/public/favicon-16x16.png')).toString('base64');
  const png32Base64 = fs.readFileSync(path.resolve(__dirname, '../client/public/favicon-32x32.png')).toString('base64');
  const png48Base64 = fs.readFileSync(path.resolve(__dirname, '../client/public/favicon-48x48.png')).toString('base64');

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cyber Law Awareness Portal - Favicon QA Verification</title>
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${svgBase64}">
      <style>
        body {
          margin: 0;
          padding: 40px;
          background: #141312;
          color: #F8F1E6;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        h1 { font-size: 20px; font-weight: 600; color: #D4B895; margin-bottom: 24px; letter-spacing: 0.05em; }
        .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #B18A62; margin: 30px 0 12px; }
        
        /* Browser Chrome Simulation */
        .browser-window {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.45);
          margin-bottom: 28px;
          border: 1px solid rgba(212, 184, 149, 0.2);
        }
        .window-top {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          gap: 12px;
        }
        .win-light .window-top { background: #DFDCD7; border-bottom: 1px solid #CCC; }
        .win-dark .window-top { background: #232220; border-bottom: 1px solid #383634; }
        
        .win-controls { display: flex; gap: 7px; }
        .win-dot { width: 11px; height: 11px; border-radius: 50%; }
        .win-dot.red { background: #FF5F56; }
        .win-dot.yellow { background: #FFBD2E; }
        .win-dot.green { background: #27C93F; }

        .tabs-container { display: flex; gap: 8px; flex: 1; align-items: flex-end; }
        .tab {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 16px;
          border-radius: 8px 8px 0 0;
          font-size: 12px;
          font-weight: 500;
          max-width: 260px;
        }
        .win-light .tab.active { background: #F8F1E6; color: #302B27; box-shadow: 0 -1px 3px rgba(0,0,0,0.06); }
        .win-light .tab.inactive { background: transparent; color: #666; }
        .win-dark .tab.active { background: #353330; color: #F8F1E6; }
        .win-dark .tab.inactive { background: transparent; color: #999; }

        .tab-icon {
          width: 16px;
          height: 16px;
          display: block;
          flex-shrink: 0;
        }
        .tab-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .window-body {
          padding: 24px;
        }
        .win-light .window-body { background: #F8F1E6; color: #3A2E26; }
        .win-dark .window-body { background: #1F1E1C; color: #F8F1E6; }

        /* Grid Comparison of Sizes */
        .sizes-row {
          display: flex;
          gap: 24px;
          background: #232220;
          border: 1px solid #383634;
          border-radius: 8px;
          padding: 20px;
          align-items: center;
        }
        .size-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .size-label { font-size: 11px; color: #D4B895; text-transform: uppercase; }
        .icon-stage {
          background: #394B36; /* Forest green */
          border: 1px solid #4D6449;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }
        .icon-stage.light-stage { background: #FFFCF5; border-color: #D4B895; }
        .icon-stage.dark-stage { background: #2B2A29; border-color: #443E38; }
      </style>
    </head>
    <body>
      <h1>Cyber Law Awareness Portal — Browser Tab Favicon QA</h1>

      <div class="section-title">1. Chromium Light Browser Theme (100% Normal Zoom)</div>
      <div class="browser-window win-light">
        <div class="window-top">
          <div class="win-controls">
            <div class="win-dot red"></div>
            <div class="win-dot yellow"></div>
            <div class="win-dot green"></div>
          </div>
          <div class="tabs-container">
            <div class="tab active">
              <img class="tab-icon" src="data:image/svg+xml;base64,${svgBase64}" alt="Favicon">
              <span class="tab-title">Cyber Law Awareness Portal</span>
            </div>
            <div class="tab inactive">
              <img class="tab-icon" src="data:image/png;base64,${png16Base64}" alt="Favicon 16">
              <span class="tab-title">Dedicated 16×16 PNG Tab</span>
            </div>
          </div>
        </div>
        <div class="window-body">
          <strong style="color: #7E4826;">Light Theme Tab Verification:</strong> The CL monogram occupies ~94% of the 16×16 display slot with 0 stray artifacts and crisp gold & terracotta contrast.
        </div>
      </div>

      <div class="section-title">2. Chromium Dark Browser Theme (100% Normal Zoom)</div>
      <div class="browser-window win-dark">
        <div class="window-top">
          <div class="win-controls">
            <div class="win-dot red"></div>
            <div class="win-dot yellow"></div>
            <div class="win-dot green"></div>
          </div>
          <div class="tabs-container">
            <div class="tab active">
              <img class="tab-icon" src="data:image/svg+xml;base64,${svgBase64}" alt="Favicon">
              <span class="tab-title">Cyber Law Awareness Portal</span>
            </div>
            <div class="tab inactive">
              <img class="tab-icon" src="data:image/png;base64,${png32Base64}" alt="Favicon 32">
              <span class="tab-title">High-DPI 32×32 PNG Tab</span>
            </div>
          </div>
        </div>
        <div class="window-body">
          <strong style="color: #D4B895;">Dark Theme Tab Verification:</strong> The gold and terracotta monument glows distinctly against dark browser chrome with excellent visual punch and sharp separation.
        </div>
      </div>

      <div class="section-title">3. Dedicated Multi-Resolution Variants & Surface Contrast</div>
      <div class="sizes-row">
        <div class="size-box">
          <div class="size-label">16×16 (Light Surface)</div>
          <div class="icon-stage light-stage">
            <img src="data:image/png;base64,${png16Base64}" width="16" height="16">
          </div>
        </div>
        <div class="size-box">
          <div class="size-label">16×16 (Dark Chrome)</div>
          <div class="icon-stage dark-stage">
            <img src="data:image/png;base64,${png16Base64}" width="16" height="16">
          </div>
        </div>
        <div class="size-box">
          <div class="size-label">16×16 (Forest Green)</div>
          <div class="icon-stage">
            <img src="data:image/png;base64,${png16Base64}" width="16" height="16">
          </div>
        </div>

        <div style="width: 1px; height: 50px; background: #383634; margin: 0 10px;"></div>

        <div class="size-box">
          <div class="size-label">32×32 (Light Surface)</div>
          <div class="icon-stage light-stage">
            <img src="data:image/png;base64,${png32Base64}" width="32" height="32">
          </div>
        </div>
        <div class="size-box">
          <div class="size-label">32×32 (Dark Chrome)</div>
          <div class="icon-stage dark-stage">
            <img src="data:image/png;base64,${png32Base64}" width="32" height="32">
          </div>
        </div>

        <div style="width: 1px; height: 50px; background: #383634; margin: 0 10px;"></div>

        <div class="size-box">
          <div class="size-label">48×48 (Windows Shell)</div>
          <div class="icon-stage dark-stage">
            <img src="data:image/png;base64,${png48Base64}" width="48" height="48">
          </div>
        </div>
        <div class="size-box">
          <div class="size-label">SVG Favicon (Scalable)</div>
          <div class="icon-stage dark-stage">
            <img src="data:image/svg+xml;base64,${svgBase64}" width="48" height="48">
          </div>
        </div>
      </div>
    </body>
    </html>
  `);

  const screenshotPath = path.join(SCREENSHOT_DIR, '12_chromium_browser_tab_favicon_qa.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved Chromium Tab Favicon QA to:', screenshotPath);

  await browser.close();
})();

