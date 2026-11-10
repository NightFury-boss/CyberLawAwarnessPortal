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

        function inspectStackedAndFavicons() {
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          const data = ctx.getImageData(0, 0, 1024, 682).data;

          function getPixel(x, y) {
            const idx = (y * 1024 + x) * 4;
            return [data[idx], data[idx+1], data[idx+2]];
          }

          // Monogram in stacked logo
          let monoMinX = 1024, monoMaxX = 0, monoMinY = 682, monoMaxY = 0;
          for (let y = 20; y < 240; y++) {
            for (let x = 370; x < 650; x++) {
              const [r, g, b] = getPixel(x, y);
              // Monument has distinctive dark brown or gold/terracotta: (r < 210 or r - b > 40)
              if (r < 210 || (r - b > 40 && (r < 235 || g < 215))) {
                if (x < monoMinX) monoMinX = x;
                if (x > monoMaxX) monoMaxX = x;
                if (y < monoMinY) monoMinY = y;
                if (y > monoMaxY) monoMaxY = y;
              }
            }
          }

          // CYBER LAW in stacked logo
          let cyberLawMinX = 1024, cyberLawMaxX = 0, cyberLawMinY = 682, cyberLawMaxY = 0;
          for (let y = 240; y < 300; y++) {
            for (let x = 200; x < 820; x++) {
              const [r, g, b] = getPixel(x, y);
              if (r < 200) {
                if (x < cyberLawMinX) cyberLawMinX = x;
                if (x > cyberLawMaxX) cyberLawMaxX = x;
                if (y < cyberLawMinY) cyberLawMinY = y;
                if (y > cyberLawMaxY) cyberLawMaxY = y;
              }
            }
          }

          // AWARENESS PORTAL in stacked logo
          let apMinX = 1024, apMaxX = 0, apMinY = 682, apMaxY = 0;
          for (let y = 300; y < 335; y++) {
            for (let x = 250; x < 770; x++) {
              const [r, g, b] = getPixel(x, y);
              if (r < 200) {
                if (x < apMinX) apMinX = x;
                if (x > apMaxX) apMaxX = x;
                if (y < apMinY) apMinY = y;
                if (y > apMaxY) apMaxY = y;
              }
            }
          }

          // Tagline row
          let tagMinX = 1024, tagMaxX = 0, tagMinY = 682, tagMaxY = 0;
          for (let y = 335; y < 380; y++) {
            for (let x = 230; x < 790; x++) {
              const [r, g, b] = getPixel(x, y);
              if (r < 200) {
                if (x < tagMinX) tagMinX = x;
                if (x > tagMaxX) tagMaxX = x;
                if (y < tagMinY) tagMinY = y;
                if (y > tagMaxY) tagMaxY = y;
              }
            }
          }

          // Favicons at bottom right (y > 550)
          // Look for 256, 128, 64, 32, 16 marks
          let favicons = [];
          const testXRanges = [
            { label: '256', startX: 740, endX: 790 },
            { label: '128', startX: 805, endX: 845 },
            { label: '64', startX: 855, endX: 888 },
            { label: '32', startX: 900, endX: 928 },
            { label: '16', startX: 945, endX: 968 }
          ];

          for (const range of testXRanges) {
            let fMinX = 1024, fMaxX = 0, fMinY = 682, fMaxY = 0;
            for (let y = 570; y < 635; y++) {
              for (let x = range.startX; x <= range.endX; x++) {
                const [r, g, b] = getPixel(x, y);
                if (r < 210 || (r - b > 40 && r < 235)) {
                  if (x < fMinX) fMinX = x;
                  if (x > fMaxX) fMaxX = x;
                  if (y < fMinY) fMinY = y;
                  if (y > fMaxY) fMaxY = y;
                }
              }
            }
            favicons.push({ label: range.label, fMinX, fMaxX, fMinY, fMaxY, w: fMaxX - fMinX + 1, h: fMaxY - fMinY + 1 });
          }

          return {
            monogram: { monoMinX, monoMaxX, monoMinY, monoMaxY, w: monoMaxX - monoMinX + 1, h: monoMaxY - monoMinY + 1 },
            cyberLaw: { cyberLawMinX, cyberLawMaxX, cyberLawMinY, cyberLawMaxY, w: cyberLawMaxX - cyberLawMinX + 1, h: cyberLawMaxY - cyberLawMinY + 1 },
            awarenessPortal: { apMinX, apMaxX, apMinY, apMaxY, w: apMaxX - apMinX + 1, h: apMaxY - apMinY + 1 },
            tagline: { tagMinX, tagMaxX, tagMinY, tagMaxY, w: tagMaxX - tagMinX + 1, h: tagMaxY - tagMinY + 1 },
            favicons
          };
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const res = await page.evaluate(() => inspectStackedAndFavicons());
  console.log('Stacked and favicons inspection:', JSON.stringify(res, null, 2));

  await browser.close();
})();

