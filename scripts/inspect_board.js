const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');

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
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const analysis = await page.evaluate(() => {
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(0, 0, 1024, 682).data;

    function getPixel(x, y) {
      const idx = (y * 1024 + x) * 4;
      return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
    }

    // 1. Dark pill
    let darkPill = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
    for (let y = 350; y < 580; y++) {
      for (let x = 10; x < 450; x++) {
        const [r, g, b] = getPixel(x, y);
        if (r < 75 && g < 65 && b < 55) {
          if (x < darkPill.minX) darkPill.minX = x;
          if (x > darkPill.maxX) darkPill.maxX = x;
          if (y < darkPill.minY) darkPill.minY = y;
          if (y > darkPill.maxY) darkPill.maxY = y;
        }
      }
    }

    // 2. Dark squircle (Dark App Icon)
    let darkSquircle = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
    for (let y = 390; y < 560; y++) {
      for (let x = 750; x < 890; x++) {
        const [r, g, b] = getPixel(x, y);
        if (r < 75 && g < 65 && b < 55) {
          if (x < darkSquircle.minX) darkSquircle.minX = x;
          if (x > darkSquircle.maxX) darkSquircle.maxX = x;
          if (y < darkSquircle.minY) darkSquircle.minY = y;
          if (y > darkSquircle.maxY) darkSquircle.maxY = y;
        }
      }
    }

    // 3. Light squircle (Light App Icon)
    // It has a slightly lighter/distinct boundary or background around x=880..1010, y=410..540
    let lightSquircle = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
    for (let y = 390; y < 560; y++) {
      for (let x = 880; x < 1010; x++) {
        const [r, g, b] = getPixel(x, y);
        // Look for the white/ivory squircle background which is around #FBF6EE
        if (r > 240 && g > 235 && b > 220) {
          if (x < lightSquircle.minX) lightSquircle.minX = x;
          if (x > lightSquircle.maxX) lightSquircle.maxX = x;
          if (y < lightSquircle.minY) lightSquircle.minY = y;
          if (y > lightSquircle.maxY) lightSquircle.maxY = y;
        }
      }
    }

    // 4. Light pill in center-left (x=430..760, y=410..540)
    let lightPill = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
    for (let y = 390; y < 560; y++) {
      for (let x = 430; x < 760; x++) {
        const [r, g, b] = getPixel(x, y);
        if (r > 240 && g > 235 && b > 220) {
          if (x < lightPill.minX) lightPill.minX = x;
          if (x > lightPill.maxX) lightPill.maxX = x;
          if (y < lightPill.minY) lightPill.minY = y;
          if (y > lightPill.maxY) lightPill.maxY = y;
        }
      }
    }

    return {
      darkPill,
      darkSquircle,
      lightSquircle,
      lightPill
    };
  });

  console.log('Detected Boxes:', JSON.stringify(analysis, null, 2));
  await browser.close();
})();

