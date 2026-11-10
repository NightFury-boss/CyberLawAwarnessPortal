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

        function extractCleanMonograms() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          
          // Tight monument bounds on original board:
          // x: 388 to 638 (w = 251)
          // y: 24 to 229 (h = 206)
          const tightW = 252;
          const tightH = 206;
          const originX = 387;
          const originY = 24;

          const tmp = document.createElement('canvas');
          tmp.width = tightW;
          tmp.height = tightH;
          const tCtx = tmp.getContext('2d');
          tCtx.drawImage(c, originX, originY, tightW, tightH, 0, 0, tightW, tightH);

          const imgData = tCtx.getImageData(0, 0, tightW, tightH);
          const d = imgData.data;

          // Apex relative to tight canvas: (514 - 387 = 127, 25 - 24 = 1)
          const apexX = 127;
          const apexY = 1;

          // Left eave: (413 - 387 = 26, 80 - 24 = 56)
          // Right eave: (606 - 387 = 219, 75 - 24 = 51)
          // Bottom left: (388 - 387 = 1, 228 - 24 = 204)
          // Bottom right: (638 - 387 = 251, 228 - 24 = 204)

          for (let y = 0; y < tightH; y++) {
            for (let x = 0; x < tightW; x++) {
              const idx = (y * tightW + x) * 4;
              const r = d[idx], g = d[idx+1], b = d[idx+2];

              // 1. HARD GEOMETRIC OUTER BOUNDARY (Zero tolerance for sky or margins)
              let outside = false;

              // Above roof left slope:
              if (x <= apexX) {
                const roofY = apexY + ((56 - apexY) / (26 - apexX)) * (x - apexX);
                if (y < roofY - 1.5) outside = true;
              } else {
                // Above roof right slope:
                const roofY = apexY + ((51 - apexY) / (219 - apexX)) * (x - apexX);
                if (y < roofY - 1.5) outside = true;
              }

              // Left of left edge:
              if (y < 56 && x < 26) outside = true;
              if (y >= 56) {
                // Slope from eave (26, 56) to plinth (1, 204)
                const leftBoundary = 26 + ((1 - 26) / (204 - 56)) * (y - 56);
                if (x < leftBoundary - 1) outside = true;
              }

              // Right of right edge:
              if (y < 51 && x > 219) outside = true;
              if (y >= 51) {
                // Slope from right eave (219, 51) to right plinth (251, 204)
                const rightBoundary = 219 + ((251 - 219) / (204 - 51)) * (y - 51);
                if (x > rightBoundary + 1) outside = true;
              }

              // Below baseline:
              if (y > 204) outside = true;

              if (outside) {
                d[idx+3] = 0;
                continue;
              }

              // 2. SOFT PARCHMENT BACKGROUND REMOVAL for inside edges
              // Check distance to parchment background (r~246, g~236, b~223)
              const bgR = 246, bgG = 236, bgB = 223;
              const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);

              if (dist < 18) {
                d[idx+3] = 0;
              } else if (dist < 32) {
                const alpha = (dist - 18) / 14;
                d[idx+3] = Math.round(alpha * 255);
              }
            }
          }

          tCtx.putImageData(imgData, 0, 0);
          const lightPng = tmp.toDataURL('image/png');

          // Create dark variant (Ivory & Gold for dark headers)
          const darkCanvas = document.createElement('canvas');
          darkCanvas.width = tightW;
          darkCanvas.height = tightH;
          const dCtx = darkCanvas.getContext('2d');
          dCtx.drawImage(tmp, 0, 0);

          const dImgData = dCtx.getImageData(0, 0, tightW, tightH);
          const dd = dImgData.data;

          for (let y = 0; y < tightH; y++) {
            for (let x = 0; x < tightW; x++) {
              const idx = (y * tightW + x) * 4;
              const a = dd[idx+3];
              if (a === 0) continue;

              const r = dd[idx], g = dd[idx+1], b = dd[idx+2];
              if (x < apexX + 1) {
                // Left C body: convert dark brown to radiant Warm Ivory (#FFFDF8 to #EDE0D0)
                const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                dd[idx] = Math.min(255, Math.round(222 + lum * 33));
                dd[idx+1] = Math.min(255, Math.round(204 + lum * 48));
                dd[idx+2] = Math.min(255, Math.round(180 + lum * 68));
              } else {
                // Right L body: brighten terracotta/gold to vibrant luminous Sand Gold (#FAD796 / #E5A84B)
                dd[idx] = Math.min(255, Math.round(r * 1.15 + 28));
                dd[idx+1] = Math.min(255, Math.round(g * 1.15 + 24));
                dd[idx+2] = Math.min(255, Math.round(b * 1.25 + 28));
              }
            }
          }
          dCtx.putImageData(dImgData, 0, 0);
          const darkPng = darkCanvas.toDataURL('image/png');

          return { lightPng, darkPng, w: tightW, h: tightH };
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);
  const result = await page.evaluate(() => extractCleanMonograms());

  fs.writeFileSync(path.join(outDir, 'clean_tight_monogram_light.png'), Buffer.from(result.lightPng.replace(/^data:image\/png;base64,/, ''), 'base64'));
  fs.writeFileSync(path.join(outDir, 'clean_tight_monogram_dark.png'), Buffer.from(result.darkPng.replace(/^data:image\/png;base64,/, ''), 'base64'));

  console.log(`Saved clean tight monograms (${result.w}x${result.h})`);
  await browser.close();
})();
