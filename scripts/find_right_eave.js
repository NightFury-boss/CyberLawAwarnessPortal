const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c" width="1024" height="682"></canvas>
      <script>
        const img = new Image();
        img.src = 'data:image/jpeg;base64,${imgBase64}';
        img.onload = () => {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          window.__loaded = true;
        };

        function inspectRightEave() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, 1024, 682).data;
          let points = [];
          for (let y = 50; y < 90; y++) {
            for (let x = 590; x < 635; x++) {
              const idx = (y * 1024 + x) * 4;
              const r = data[idx], g = data[idx+1], b = data[idx+2];
              if (r - b > 40 && (r < 225 || g < 195)) {
                points.push({ x, y, r, g, b });
              }
            }
          }
          let maxX = 0, pMax = null;
          for (const p of points) {
            if (p.x > maxX) { maxX = p.x; pMax = p; }
          }
          return pMax;
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);
  const re = await page.evaluate(() => inspectRightEave());
  console.log('Right eave:', re);
  await browser.close();
})();

