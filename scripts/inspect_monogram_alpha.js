const { chromium } = require('@playwright/test');
const fs = require('fs');

const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean/clean_tight_monogram_light.png';
const base64 = fs.readFileSync(lightMonoPath).toString('base64');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <script>
        window.analyze = async (b64) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await new Promise(r => img.onload = r);
          const c = document.getElementById('c');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, img.width, img.height).data;
          
          let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
          let lowAlphaCount = 0;
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const a = data[(y * img.width + x) * 4 + 3];
              if (a > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
              if (a > 10 && a < 150) {
                lowAlphaCount++;
              }
            }
          }
          return {
            w: img.width,
            h: img.height,
            bounds: { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 },
            lowAlphaCount
          };
        };
      </script>
    </body>
    </html>
  `);

  const info = await page.evaluate(b64 => window.analyze(b64), base64);
  console.log('Monogram info:', JSON.stringify(info, null, 2));
  await browser.close();
})();

