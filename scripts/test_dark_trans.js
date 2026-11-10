const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops/dark_pill_card.png';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <script>
        const img = new Image();
        img.src = 'data:image/png;base64,${imgBase64}';
        img.onload = () => {
          const c = document.getElementById('c');
          // Only crop the actual content inside the pill: x: 50, y: 10, w: 310, h: 88
          c.width = 320;
          c.height = 88;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 48, 10, 320, 88, 0, 0, 320, 88);

          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;

          const bgR = 56, bgG = 45, bgB = 37;

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum <= 52) {
              d[i+3] = 0;
            } else if (lum >= 92) {
              d[i+3] = 255;
            } else {
              const alpha = (lum - 52) / (92 - 52);
              d[i+3] = Math.round(alpha * 255);
              // Color recovery / un-premultiply
              d[i] = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - alpha)) / alpha)));
              d[i+1] = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - alpha)) / alpha)));
              d[i+2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha)) / alpha)));
            }
          }

          ctx.putImageData(imgData, 0, 0);
          window.__result = c.toDataURL('image/png');
        };
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__result !== undefined);
  const dataUrl = await page.evaluate(() => window.__result);
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(outDir, 'dark_horizontal_crisp_trans.png'), Buffer.from(base64Data, 'base64'));
  console.log('Saved dark_horizontal_crisp_trans.png');

  await browser.close();
})();

