const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/extracted';

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

        function cropToDataUrl(x, y, w, h) {
          const tmp = document.createElement('canvas');
          tmp.width = w;
          tmp.height = h;
          const tmpCtx = tmp.getContext('2d');
          tmpCtx.drawImage(document.getElementById('c'), x, y, w, h, 0, 0, w, h);
          return tmp.toDataURL('image/png');
        }

        function findDarkPillBounds() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, 1024, 682).data;
          let minX = 1024, maxX = 0, minY = 682, maxY = 0;
          for (let y = 400; y < 550; y++) {
            for (let x = 10; x < 450; x++) {
              const idx = (y * 1024 + x) * 4;
              const r = data[idx], g = data[idx+1], b = data[idx+2];
              // Dark brown container is around #3A2E26 (r~58, g~46, b~38)
              if (r < 75 && g < 60 && b < 50) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
        }

        function findDarkSquircleBounds() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, 1024, 682).data;
          let minX = 1024, maxX = 0, minY = 682, maxY = 0;
          for (let y = 400; y < 550; y++) {
            for (let x = 750; x < 890; x++) {
              const idx = (y * 1024 + x) * 4;
              const r = data[idx], g = data[idx+1], b = data[idx+2];
              if (r < 75 && g < 60 && b < 50) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
        }

        function findStackedBounds() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, 1024, 682).data;
          // Find topmost pixel of the roof (apex)
          let topY = 682;
          for (let y = 0; y < 100; y++) {
            for (let x = 400; x < 624; x++) {
              const idx = (y * 1024 + x) * 4;
              const r = data[idx], g = data[idx+1], b = data[idx+2];
              // Background is parchment around r~235, g~225, b~205
              // Roof apex has r~190..230, g~150..180, b~90..120
              if (r - b > 50 && (r < 220 || g < 185)) {
                if (y < topY) topY = y;
              }
            }
          }
          return { topY };
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const darkPill = await page.evaluate(() => findDarkPillBounds());
  const darkSquircle = await page.evaluate(() => findDarkSquircleBounds());
  const stacked = await page.evaluate(() => findStackedBounds());

  console.log('Dark Pill exact bounds:', darkPill);
  console.log('Dark Squircle exact bounds:', darkSquircle);
  console.log('Stacked top Y:', stacked);

  await browser.close();
})();

