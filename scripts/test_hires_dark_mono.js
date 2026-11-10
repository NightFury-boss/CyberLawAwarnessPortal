const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops/monogram_light_trans.png';
const lightMonoBase64 = fs.readFileSync(lightMonoPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
    </head>
    <body>
      <canvas id="c"></canvas>
      <script>
        const img = new Image();
        img.src = 'data:image/png;base64,${lightMonoBase64}';
        img.onload = () => {
          document.fonts.ready.then(() => {
            window.__ready = true;
          });
        };

        // Create dark variant of monument (Ivory & Gold for dark backgrounds)
        function createDarkMonumentCanvas() {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;

          for (let y = 0; y < c.height; y++) {
            for (let x = 0; x < c.width; x++) {
              const i = (y * c.width + x) * 4;
              const a = d[i+3];
              if (a === 0) continue;

              const r = d[i], g = d[i+1], b = d[i+2];
              // On left side of monument (x < c.width * 0.50), original is dark brown
              // In dark monument, left side is warm ivory / pearl (#F8F1E6 / #EDE0D0)
              if (x < c.width * 0.505) {
                // Invert dark brown tones to ivory/cream
                const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
                // Brighten towards Ivory (#FFF9F2 to #D8C2AA)
                const targetR = 216 + lum * 39;
                const targetG = 194 + lum * 55;
                const targetB = 170 + lum * 72;
                d[i] = Math.round(targetR);
                d[i+1] = Math.round(targetG);
                d[i+2] = Math.round(targetB);
              } else {
                // Right side is terracotta/gold
                // In dark monument, right side is bright radiant Sand Gold (#FAD796 / #E5A84B)
                const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
                const targetR = Math.min(255, Math.round(r * 1.15 + 30));
                const targetG = Math.min(255, Math.round(g * 1.15 + 25));
                const targetB = Math.min(255, Math.round(b * 1.25 + 30));
                d[i] = targetR;
                d[i+1] = targetG;
                d[i+2] = targetB;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return c;
        }

        window.renderTest = () => {
          const darkMono = createDarkMonumentCanvas();
          return darkMono.toDataURL('image/png');
        };
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__ready === true);
  const darkMonoDataUrl = await page.evaluate(() => window.renderTest());
  fs.writeFileSync(path.join(outDir, 'monogram_dark_hires_trans.png'), Buffer.from(darkMonoDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
  console.log('Saved monogram_dark_hires_trans.png');

  await browser.close();
})();

