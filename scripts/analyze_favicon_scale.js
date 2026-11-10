const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean/clean_tight_monogram_light.png';
const base64 = fs.readFileSync(lightMonoPath).toString('base64');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>body { background: #333; margin: 20px; }</style></head>
    <body>
      <canvas id="c16" width="16" height="16"></canvas>
      <canvas id="c32" width="32" height="32"></canvas>
      <canvas id="c48" width="48" height="48"></canvas>
    </body>
    </html>
  `);

  const results = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await new Promise((r) => { img.onload = r; });

    // 16x16: 90% of 16 is 14.4. If width is 15px, height is 15 * 206/252 = 12.26 (12px).
    // Center at x=0.5 (or 1), y=2.
    const c16 = document.getElementById('c16');
    const ctx16 = c16.getContext('2d');
    ctx16.imageSmoothingEnabled = true;
    ctx16.imageSmoothingQuality = 'high';
    ctx16.drawImage(img, 0.5, 2, 15, 12);

    // 32x32: 90% of 32 is 28.8. If width is 29px, height is 29 * 206/252 = 23.7 (24px).
    // Center at x=1.5, y=4.
    const c32 = document.getElementById('c32');
    const ctx32 = c32.getContext('2d');
    ctx32.imageSmoothingEnabled = true;
    ctx32.imageSmoothingQuality = 'high';
    ctx32.drawImage(img, 1.5, 4, 29, 24);

    return {
      d16: c16.toDataURL('image/png'),
      d32: c32.toDataURL('image/png')
    };
  }, base64);

  fs.writeFileSync('scratch/test_c16.png', Buffer.from(results.d16.split(',')[1], 'base64'));
  fs.writeFileSync('scratch/test_c32.png', Buffer.from(results.d32.split(',')[1], 'base64'));

  console.log('Saved test_c16.png and test_c32.png');
  await browser.close();
})();

