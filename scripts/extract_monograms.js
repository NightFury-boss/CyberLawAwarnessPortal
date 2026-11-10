const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops';

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

        // Extract light monument from stacked logo with background removal
        // Monogram bounds: x: 387..638, y: 24..229
        function extractLightMonogram() {
          const srcCanvas = document.getElementById('c');
          const tmp = document.createElement('canvas');
          tmp.width = 254;
          tmp.height = 208;
          const ctx = tmp.getContext('2d');
          ctx.drawImage(srcCanvas, 386, 23, 254, 208, 0, 0, 254, 208);

          const imgData = ctx.getImageData(0, 0, tmp.width, tmp.height);
          const d = imgData.data;

          // Estimate background from corners
          // Background on parchment is ~ r=246, g=236, b=223
          for (let y = 0; y < tmp.height; y++) {
            for (let x = 0; x < tmp.width; x++) {
              const idx = (y * tmp.width + x) * 4;
              const r = d[idx], g = d[idx+1], b = d[idx+2];
              
              // Outside monument check
              // The monument is dark brown on left, bright terracotta/gold on right
              // Let's check distance to parchment background
              const bgR = 246, bgG = 236, bgB = 223;
              const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
              
              if (dist < 20) {
                d[idx+3] = 0;
              } else if (dist < 38) {
                const alpha = (dist - 20) / 18;
                d[idx+3] = Math.round(alpha * 255);
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return tmp.toDataURL('image/png');
        }

        // Extract dark monument from dark squircle
        // Dark squircle bounds: x: 772..874, y: 427..524
        // Inside squircle, monument is around x: 785..862, y: 440..510
        function extractDarkMonogram() {
          const srcCanvas = document.getElementById('c');
          const tmp = document.createElement('canvas');
          tmp.width = 82;
          tmp.height = 72;
          const ctx = tmp.getContext('2d');
          ctx.drawImage(srcCanvas, 783, 439, 82, 72, 0, 0, 82, 72);

          const imgData = ctx.getImageData(0, 0, tmp.width, tmp.height);
          const d = imgData.data;
          const bgR = 58, bgG = 46, bgB = 38;

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum <= 54) {
              d[i+3] = 0;
            } else if (lum >= 90) {
              d[i+3] = 255;
            } else {
              const alpha = (lum - 54) / (90 - 54);
              d[i+3] = Math.round(alpha * 255);
              d[i] = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - alpha)) / alpha)));
              d[i+1] = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - alpha)) / alpha)));
              d[i+2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha)) / alpha)));
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return tmp.toDataURL('image/png');
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const lightMonoDataUrl = await page.evaluate(() => extractLightMonogram());
  const darkMonoDataUrl = await page.evaluate(() => extractDarkMonogram());

  fs.writeFileSync(path.join(outDir, 'monogram_light_trans.png'), Buffer.from(lightMonoDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
  fs.writeFileSync(path.join(outDir, 'monogram_dark_trans.png'), Buffer.from(darkMonoDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));

  console.log('Saved isolated monograms');
  await browser.close();
})();

