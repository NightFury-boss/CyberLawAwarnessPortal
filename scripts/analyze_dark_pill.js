const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops/dark_pill_card.png';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');

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
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          window.__loaded = true;
        };

        function analyzeDarkPill() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, c.width, c.height).data;
          
          let maxBgLum = 0;
          let minFgLum = 255;
          let hist = new Array(256).fill(0);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2];
            // Luminosity formula
            const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            hist[lum]++;
          }

          return { hist, w: c.width, h: c.height };
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const res = await page.evaluate(() => analyzeDarkPill());
  console.log('Total pixels:', res.w * res.h);
  // print non-zero buckets
  const nonZero = res.hist.map((count, lum) => ({ lum, count })).filter(x => x.count > 0);
  console.log('Luminance histogram summary:');
  console.log('Low end (background):', nonZero.filter(x => x.lum < 80).slice(0, 10), '...', nonZero.filter(x => x.lum < 80).slice(-5));
  console.log('Gap / Mid:', nonZero.filter(x => x.lum >= 70 && x.lum <= 110));
  console.log('High end (foreground):', nonZero.filter(x => x.lum > 110).slice(0, 5), '...', nonZero.filter(x => x.lum > 110).slice(-5));

  await browser.close();
})();

