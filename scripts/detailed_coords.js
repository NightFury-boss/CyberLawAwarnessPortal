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

        function inspectDetails() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, 1024, 682).data;

          function getPixel(x, y) {
            const idx = (y * 1024 + x) * 4;
            return [data[idx], data[idx+1], data[idx+2]];
          }

          // 1. Stacked logo: find bottom of tagline "LEARN • RECOGNIZE • STAY SAFE"
          // and find left and right bounds of the divider line or CYBER LAW
          let stackedBottomY = 0;
          for (let y = 350; y < 410; y++) {
            for (let x = 200; x < 800; x++) {
              const [r, g, b] = getPixel(x, y);
              // Tagline text or line has dark/terracotta tone compared to parchment (r>230, g>220, b>200)
              if (r < 180 || (r - b > 60 && r < 210)) {
                if (y > stackedBottomY) stackedBottomY = y;
              }
            }
          }

          let stackedMinX = 1024, stackedMaxX = 0;
          for (let y = 20; y <= stackedBottomY + 2; y++) {
            for (let x = 150; x < 880; x++) {
              const [r, g, b] = getPixel(x, y);
              if (r < 180 || (r - b > 50 && r < 215)) {
                if (x < stackedMinX) stackedMinX = x;
                if (x > stackedMaxX) stackedMaxX = x;
              }
            }
          }

          // 2. Light pill container (surrounding the horizontal light logo)
          // Find boundary where light ivory card starts (around x=430..760, y=415..535)
          let lightPill = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
          for (let y = 415; y < 535; y++) {
            for (let x = 430; x < 760; x++) {
              const [r, g, b] = getPixel(x, y);
              // The pill is lighter than surrounding parchment (r > 248, g > 245, b > 238)
              if (r > 248 && g > 243 && b > 233) {
                if (x < lightPill.minX) lightPill.minX = x;
                if (x > lightPill.maxX) lightPill.maxX = x;
                if (y < lightPill.minY) lightPill.minY = y;
                if (y > lightPill.maxY) lightPill.maxY = y;
              }
            }
          }

          // 3. Inside light pill: find bounds of horizontal logo content (monogram + vertical bar + CYBER LAW + AWARENESS PORTAL)
          let lightLogoContent = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
          for (let y = 430; y < 520; y++) {
            for (let x = 450; x < 740; x++) {
              const [r, g, b] = getPixel(x, y);
              // Logo content is dark/terracotta/gold (r < 230)
              if (r < 230 && (r < 200 || r - b > 40)) {
                if (x < lightLogoContent.minX) lightLogoContent.minX = x;
                if (x > lightLogoContent.maxX) lightLogoContent.maxX = x;
                if (y < lightLogoContent.minY) lightLogoContent.minY = y;
                if (y > lightLogoContent.maxY) lightLogoContent.maxY = y;
              }
            }
          }

          // 4. Inside dark pill: find bounds of horizontal dark logo content
          let darkLogoContent = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
          for (let y = 430; y < 520; y++) {
            for (let x = 40; x < 400; x++) {
              const [r, g, b] = getPixel(x, y);
              // Logo content is light/gold on dark brown background (background r~58, g~46, b~38)
              if (r > 90 || g > 80 || b > 70) {
                if (x < darkLogoContent.minX) darkLogoContent.minX = x;
                if (x > darkLogoContent.maxX) darkLogoContent.maxX = x;
                if (y < darkLogoContent.minY) darkLogoContent.minY = y;
                if (y > darkLogoContent.maxY) darkLogoContent.maxY = y;
              }
            }
          }

          // 5. Light squircle container
          let lightSquircle = { minX: 1024, maxX: 0, minY: 682, maxY: 0 };
          for (let y = 420; y < 530; y++) {
            for (let x = 880; x < 1000; x++) {
              const [r, g, b] = getPixel(x, y);
              if (r > 248 && g > 243 && b > 233) {
                if (x < lightSquircle.minX) lightSquircle.minX = x;
                if (x > lightSquircle.maxX) lightSquircle.maxX = x;
                if (y < lightSquircle.minY) lightSquircle.minY = y;
                if (y > lightSquircle.maxY) lightSquircle.maxY = y;
              }
            }
          }

          return {
            stacked: { topY: 24, bottomY: stackedBottomY, minX: stackedMinX, maxX: stackedMaxX },
            lightPill,
            lightLogoContent,
            darkLogoContent,
            lightSquircle
          };
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const res = await page.evaluate(() => inspectDetails());
  console.log('Detailed coordinates:', JSON.stringify(res, null, 2));

  await browser.close();
})();

