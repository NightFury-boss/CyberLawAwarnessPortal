const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');
const outDir = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/extracted';
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

        function cropToDataUrl(x, y, w, h) {
          const tmp = document.createElement('canvas');
          tmp.width = w;
          tmp.height = h;
          const tmpCtx = tmp.getContext('2d');
          tmpCtx.drawImage(document.getElementById('c'), x, y, w, h, 0, 0, w, h);
          return tmp.toDataURL('image/png');
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  // Let's define the crops
  // 1. Primary stacked logo: around x=200..824, y=20..380
  // 2. Primary monogram alone: around x=375..650, y=24..240
  // 3. Dark horizontal logo container: x=24, y=420, w=390, h=108
  // 4. Light horizontal logo container: x=436, y=420, w=316, h=108
  // 5. Dark squircle app icon: x=770, y=420, w=108, h=108
  // 6. Light squircle app icon: x=892, y=420, w=108, h=108
  // 7. Favicon 256: around x=740..795, y=575..630
  const crops = [
    { name: 'primary_stacked_full', x: 230, y: 22, w: 564, h: 366 },
    { name: 'primary_monogram', x: 380, y: 24, w: 264, h: 216 },
    { name: 'primary_wordmark', x: 250, y: 240, w: 524, h: 148 },
    { name: 'dark_pill_full', x: 25, y: 420, w: 390, h: 108 },
    { name: 'light_pill_full', x: 436, y: 420, w: 316, h: 108 },
    { name: 'dark_squircle', x: 770, y: 420, w: 108, h: 108 },
    { name: 'light_squircle', x: 892, y: 420, w: 108, h: 108 },
    { name: 'favicons_row', x: 730, y: 550, w: 280, h: 90 },
    { name: 'favicon_256', x: 742, y: 576, w: 56, h: 56 }
  ];

  for (const crop of crops) {
    const dataUrl = await page.evaluate(({x, y, w, h}) => cropToDataUrl(x, y, w, h), crop);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(outDir, `${crop.name}.png`), Buffer.from(base64Data, 'base64'));
    console.log(`Saved ${crop.name}.png`);
  }

  await browser.close();
})();

