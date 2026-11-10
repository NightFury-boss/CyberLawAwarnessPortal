const { chromium } = require('@playwright/test');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4173;
const SCREENSHOT_DIR = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/screenshots/brand-identity';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Server listening on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  const browser = await chromium.launch();
  
  const viewports = [
    { name: '13_desktop_1440_refined_closing_cta', width: 1440, height: 900 },
    { name: '14_tablet_768_refined_closing_cta', width: 768, height: 1024 },
    { name: '15_mobile_390_refined_closing_cta', width: 390, height: 844 },
    { name: '16_mobile_375_refined_closing_cta', width: 375, height: 667 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`http://127.0.0.1:${PORT}/`);

    // Mock auth and APIs so page is clean
    await page.evaluate(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    const ctaCard = page.locator('.closing-cta-card');
    await ctaCard.waitFor({ state: 'visible' });
    await ctaCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);

    const outPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`);
    await ctaCard.screenshot({ path: outPath });
    console.log(`Captured ${vp.name} to: ${outPath}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('All Closing CTA viewport screenshots captured successfully.');
})();
