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
    <head>
      <style>
        body { background: #2A2A2A; color: #EEE; font-family: sans-serif; padding: 20px; }
        .row { display: flex; gap: 20px; align-items: center; margin-bottom: 20px; }
        canvas { background: #FFF; border: 1px solid #555; image-rendering: pixelated; }
        canvas.dark-bg { background: #1E1E1E; }
      </style>
    </head>
    <body>
      <div id="container"></div>
      <script>
        const monoImg = new Image();
        monoImg.src = 'data:image/png;base64,${base64}';

        window.runTests = async () => {
          if (!monoImg.complete) {
            await new Promise(r => monoImg.onload = r);
          }

          // Test 1: Standard downscale 16x16 with 90% width (targetW=15, targetH=12)
          const genStandard = (size, targetW, targetH) => {
            const c = document.createElement('canvas');
            c.width = size; c.height = size;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const ox = (size - targetW) / 2;
            const oy = (size - targetH) / 2;
            ctx.drawImage(monoImg, ox, oy, targetW, targetH);
            return c;
          };

          // Test 2: Contrast & Alpha boosted dedicated variant for 16x16
          // Boosts thin edges, sharpens details, and solidifies low-alpha pixels
          const genDedicated16 = () => {
            // First render at 2x (32x32) with targetW=30, targetH=24
            const cTemp = document.createElement('canvas');
            cTemp.width = 30; cTemp.height = 24;
            const ctxTemp = cTemp.getContext('2d');
            ctxTemp.imageSmoothingEnabled = true;
            ctxTemp.imageSmoothingQuality = 'high';
            ctxTemp.drawImage(monoImg, 0, 0, 30, 24);

            // Now draw to 16x16 at targetW=15, targetH=12
            const c16 = document.createElement('canvas');
            c16.width = 16; c16.height = 16;
            const ctx16 = c16.getContext('2d');
            ctx16.imageSmoothingEnabled = true;
            ctx16.imageSmoothingQuality = 'high';
            ctx16.drawImage(cTemp, 0.5, 2, 15, 12);

            const imgData = ctx16.getImageData(0, 0, 16, 16);
            const data = imgData.data;

            // Optical adjustments for 16x16:
            // 1. Boost alpha of semi-transparent edge pixels so fine roof eaves and plinths remain visible
            // 2. Increase color saturation and contrast of midtones
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a > 25) {
                // Non-linear alpha boost: map 40..255 up towards solid
                data[i + 3] = Math.min(255, Math.round(Math.pow(a / 255, 0.65) * 255));
                
                // Slightly increase contrast between dark brown and gold
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum > 130) {
                  // Gold highlights: enhance warmth and brightness
                  data[i] = Math.min(255, Math.round(r * 1.08));
                  data[i + 1] = Math.min(255, Math.round(g * 1.06));
                  data[i + 2] = Math.min(255, Math.round(b * 1.02));
                } else if (lum < 80) {
                  // Dark shadow ribbons: keep crisp and deep
                  data[i] = Math.max(0, Math.round(r * 0.90));
                  data[i + 1] = Math.max(0, Math.round(g * 0.90));
                  data[i + 2] = Math.max(0, Math.round(b * 0.90));
                }
              }
            }
            ctx16.putImageData(imgData, 0, 0);
            return c16;
          };

          // Test 3: Dedicated variant for 32x32
          const genDedicated32 = () => {
            const c32 = document.createElement('canvas');
            c32.width = 32; c32.height = 32;
            const ctx32 = c32.getContext('2d');
            ctx32.imageSmoothingEnabled = true;
            ctx32.imageSmoothingQuality = 'high';
            // targetW=29, targetH=24 centered at (1.5, 4)
            ctx32.drawImage(monoImg, 1.5, 4, 29, 24);

            const imgData = ctx32.getImageData(0, 0, 32, 32);
            const data = imgData.data;

            // Optical contrast adjustment for 32x32
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a > 20) {
                data[i + 3] = Math.min(255, Math.round(Math.pow(a / 255, 0.75) * 255));
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum > 140) {
                  data[i] = Math.min(255, Math.round(r * 1.05));
                  data[i + 1] = Math.min(255, Math.round(g * 1.04));
                }
              }
            }
            ctx32.putImageData(imgData, 0, 0);
            return c32;
          };

          return {
            std16: genStandard(16, 15, 12).toDataURL(),
            ded16: genDedicated16().toDataURL(),
            std32: genStandard(32, 29, 24).toDataURL(),
            ded32: genDedicated32().toDataURL()
          };
        };
      </script>
    </body>
    </html>
  `);

  const res = await page.evaluate(() => window.runTests());
  fs.writeFileSync('scratch/std16.png', Buffer.from(res.std16.split(',')[1], 'base64'));
  fs.writeFileSync('scratch/ded16.png', Buffer.from(res.ded16.split(',')[1], 'base64'));
  fs.writeFileSync('scratch/std32.png', Buffer.from(res.std32.split(',')[1], 'base64'));
  fs.writeFileSync('scratch/ded32.png', Buffer.from(res.ded32.split(',')[1], 'base64'));
  console.log('Saved comparison PNGs to scratch/');
  await browser.close();
})();
