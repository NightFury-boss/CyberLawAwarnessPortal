const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

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

        function cropCanvas(x, y, w, h) {
          const tmp = document.createElement('canvas');
          tmp.width = w;
          tmp.height = h;
          const tmpCtx = tmp.getContext('2d');
          tmpCtx.drawImage(document.getElementById('c'), x, y, w, h, 0, 0, w, h);
          return tmp;
        }

        // Alpha removal for light background (parchment/ivory)
        // Background color is roughly #F6ECE0 (r~246, g~236, b~224)
        function makeTransparentLight(canvas, sampleBgX = 5, sampleBgY = 5, threshold = 28) {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          // Estimate background color from corner
          const bgIdx = (sampleBgY * canvas.width + sampleBgX) * 4;
          const bgR = d[bgIdx], bgG = d[bgIdx+1], bgB = d[bgIdx+2];

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            // Euclidean color distance to background
            const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
            if (dist < threshold) {
              d[i+3] = 0; // fully transparent
            } else if (dist < threshold + 35) {
              // Smooth antialiased ramp
              const alphaRatio = (dist - threshold) / 35;
              d[i+3] = Math.min(255, Math.floor(alphaRatio * 255));
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
        }

        // Alpha removal for dark background (#3A2E26)
        function makeTransparentDark(canvas, bgR = 58, bgG = 46, bgB = 38, threshold = 22) {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
            if (dist < threshold) {
              d[i+3] = 0;
            } else if (dist < threshold + 30) {
              const alphaRatio = (dist - threshold) / 30;
              d[i+3] = Math.min(255, Math.floor(alphaRatio * 255));
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
        }

        function getCrops() {
          const results = {};

          // 1. Primary Stacked (full on natural background)
          const cStacked = cropCanvas(248, 20, 528, 362);
          results.primary_stacked_card = cStacked.toDataURL('image/png');

          // Primary Stacked (transparent background)
          const cStackedTrans = cropCanvas(248, 20, 528, 362);
          results.primary_stacked_transparent = makeTransparentLight(cStackedTrans, 5, 5, 25);

          // 2. Dark Pill Full
          const cDarkPill = cropCanvas(24, 420, 392, 108);
          results.dark_pill_card = cDarkPill.toDataURL('image/png');

          // Dark Horizontal Logo Content (Transparent background)
          // Bounds: x=74, y=428, w=308, h=88
          const cDarkHorizTrans = cropCanvas(72, 428, 310, 88);
          results.dark_horizontal_transparent = makeTransparentDark(cDarkHorizTrans, 58, 46, 38, 22);

          // 3. Light Pill Full
          const cLightPill = cropCanvas(436, 420, 316, 108);
          results.light_pill_card = cLightPill.toDataURL('image/png');

          // Light Horizontal Logo Content (Transparent background)
          // Bounds: x=462, y=438, w=268, h=70
          const cLightHorizTrans = cropCanvas(462, 438, 268, 70);
          results.light_horizontal_transparent = makeTransparentLight(cLightHorizTrans, 5, 5, 25);

          // 4. Dark Squircle App Icon
          const cDarkSquircle = cropCanvas(770, 422, 106, 106);
          results.dark_app_icon = cDarkSquircle.toDataURL('image/png');

          // 5. Light Squircle App Icon
          const cLightSquircle = cropCanvas(890, 422, 106, 106);
          results.light_app_icon = cLightSquircle.toDataURL('image/png');

          // 6. Monogram alone (Light) from stacked logo
          const cMonoStacked = cropCanvas(384, 20, 258, 214);
          results.monogram_stacked_card = cMonoStacked.toDataURL('image/png');

          const cMonoStackedTrans = cropCanvas(384, 20, 258, 214);
          results.monogram_transparent = makeTransparentLight(cMonoStackedTrans, 5, 5, 25);

          return results;
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const results = await page.evaluate(() => getCrops());

  for (const [key, dataUrl] of Object.entries(results)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(outDir, `${key}.png`), Buffer.from(base64Data, 'base64'));
    console.log(`Saved ${key}.png`);
  }

  await browser.close();
})();

