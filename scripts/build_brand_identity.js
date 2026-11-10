const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794332022775_31b4e6a6.jpg';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');

const brandDir = path.resolve(__dirname, '../client/public/brand');
const logoDir = path.resolve(__dirname, '../client/public/logo');
const publicDir = path.resolve(__dirname, '../client/public');

if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

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

        function resizeCanvas(srcCanvas, targetW, targetH) {
          const tmp = document.createElement('canvas');
          tmp.width = targetW;
          tmp.height = targetH;
          const tmpCtx = tmp.getContext('2d');
          tmpCtx.imageSmoothingEnabled = true;
          tmpCtx.imageSmoothingQuality = 'high';
          tmpCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);
          return tmp;
        }

        // Alpha removal for light background
        function makeTransparentLight(canvas, threshold = 22) {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          const bgR = 246, bgG = 236, bgB = 223;

          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            const dist = Math.sqrt((r - bgR)**2 + (g - bgG)**2 + (b - bgB)**2);
            if (dist < threshold) {
              d[i+3] = 0;
            } else if (dist < threshold + 30) {
              const alpha = (dist - threshold) / 30;
              d[i+3] = Math.round(alpha * 255);
              d[i] = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - alpha)) / alpha)));
              d[i+1] = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - alpha)) / alpha)));
              d[i+2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alpha)) / alpha)));
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return canvas;
        }

        // Alpha removal for dark background
        function makeTransparentDark(canvas) {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
          return canvas;
        }

        function generateAllAssets() {
          const assets = {};

          // 1. Primary Stacked Logo (Card)
          const cStacked = cropCanvas(248, 20, 528, 362);
          assets['cyberlaw-logo-primary.png'] = cStacked.toDataURL('image/png');

          // Primary Stacked Logo (Transparent)
          const cStackedTrans = cropCanvas(248, 20, 528, 362);
          makeTransparentLight(cStackedTrans, 20);
          assets['cyberlaw-logo-primary-transparent.png'] = cStackedTrans.toDataURL('image/png');

          // 2. Horizontal Logo Light (Card / Pill)
          const cLightPill = cropCanvas(436, 420, 316, 108);
          assets['cyberlaw-logo-horizontal.png'] = cLightPill.toDataURL('image/png');

          // Horizontal Logo Light (Transparent Content)
          const cLightHorizContent = cropCanvas(460, 436, 272, 72);
          makeTransparentLight(cLightHorizContent, 22);
          assets['cyberlaw-logo-horizontal-transparent.png'] = cLightHorizContent.toDataURL('image/png');

          // 3. Horizontal Logo Dark (Card / Pill)
          const cDarkPill = cropCanvas(24, 420, 392, 108);
          assets['cyberlaw-logo-horizontal-dark.png'] = cDarkPill.toDataURL('image/png');

          // Horizontal Logo Dark (Transparent Content)
          const cDarkHorizContent = cropCanvas(48, 428, 320, 88);
          makeTransparentDark(cDarkHorizContent);
          assets['cyberlaw-logo-horizontal-dark-transparent.png'] = cDarkHorizContent.toDataURL('image/png');

          // 4. Light App Icon (Squircle)
          const cLightSquircle = cropCanvas(890, 422, 106, 106);
          assets['cyberlaw-icon-light.png'] = cLightSquircle.toDataURL('image/png');

          // 5. Dark App Icon (Squircle)
          const cDarkSquircle = cropCanvas(770, 422, 106, 106);
          assets['cyberlaw-icon-dark.png'] = cDarkSquircle.toDataURL('image/png');

          // 6. Monogram Alone (Transparent)
          const cMono = cropCanvas(386, 23, 254, 208);
          makeTransparentLight(cMono, 20);
          assets['cyberlaw-monogram.png'] = cMono.toDataURL('image/png');

          // 7. Favicon sizes (256, 128, 64, 32, 16)
          // We use the dark squircle icon or crisp centered monogram
          const sizes = [256, 128, 64, 32, 16];
          for (const s of sizes) {
            const resized = resizeCanvas(cDarkSquircle, s, s);
            assets[\`favicon-\${s}.png\`] = resized.toDataURL('image/png');
          }

          return assets;
        }
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__loaded === true);

  const assets = await page.evaluate(() => generateAllAssets());

  // Function to create an SVG that embeds the exact high-res PNG
  const makeSvgFromPng = (pngBase64, width, height, title) => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="100%" height="100%" role="img" aria-label="${title}">
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${pngBase64}" />
</svg>
`.trim();

  // Save all brand assets in client/public/brand/
  for (const [filename, dataUrl] of Object.entries(assets)) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buf = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(brandDir, filename), buf);

    // If it's a key brand png, also write its scalable SVG wrapper
    if (filename === 'cyberlaw-logo-primary.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-primary.svg'), makeSvgFromPng(base64Data, 528, 362, 'Cyber Law Awareness Portal'));
    } else if (filename === 'cyberlaw-logo-primary-transparent.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-primary-transparent.svg'), makeSvgFromPng(base64Data, 528, 362, 'Cyber Law Awareness Portal'));
    } else if (filename === 'cyberlaw-logo-horizontal.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal.svg'), makeSvgFromPng(base64Data, 316, 108, 'Cyber Law Awareness Portal'));
    } else if (filename === 'cyberlaw-logo-horizontal-transparent.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal-transparent.svg'), makeSvgFromPng(base64Data, 272, 72, 'Cyber Law Awareness Portal'));
    } else if (filename === 'cyberlaw-logo-horizontal-dark.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal-dark.svg'), makeSvgFromPng(base64Data, 392, 108, 'Cyber Law Awareness Portal'));
    } else if (filename === 'cyberlaw-logo-horizontal-dark-transparent.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal-dark-transparent.svg'), makeSvgFromPng(base64Data, 320, 88, 'Cyber Law Awareness Portal'));
    } else if (filename === 'cyberlaw-icon-light.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-icon-light.svg'), makeSvgFromPng(base64Data, 106, 106, 'Cyber Law Icon'));
    } else if (filename === 'cyberlaw-icon-dark.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-icon-dark.svg'), makeSvgFromPng(base64Data, 106, 106, 'Cyber Law Icon'));
    } else if (filename === 'cyberlaw-monogram.png') {
      fs.writeFileSync(path.join(brandDir, 'cyberlaw-monogram.svg'), makeSvgFromPng(base64Data, 254, 208, 'Cyber Law Monogram'));
    }
  }

  // Also synchronize client/public/logo/ for full compatibility
  // 1. Horizontal dark logo
  const darkPillBase64 = assets['cyberlaw-logo-horizontal-dark.png'].replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-dark.svg'), makeSvgFromPng(darkPillBase64, 392, 108, 'Cyber Law Awareness Portal'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-dark.png'), Buffer.from(darkPillBase64, 'base64'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-footer.svg'), makeSvgFromPng(darkPillBase64, 392, 108, 'Cyber Law Awareness Portal - Learn, Recognize, Stay Safe'));

  // 2. Horizontal light logo
  const lightPillBase64 = assets['cyberlaw-logo-horizontal.png'].replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-horizontal.svg'), makeSvgFromPng(lightPillBase64, 316, 108, 'Cyber Law Awareness Portal'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-horizontal.png'), Buffer.from(lightPillBase64, 'base64'));
  fs.writeFileSync(path.join(logoDir, 'logo-horizontal.svg'), makeSvgFromPng(lightPillBase64, 316, 108, 'Cyber Law Awareness Portal'));

  // 3. Stacked primary logo
  const stackedBase64 = assets['cyberlaw-logo-primary.png'].replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(logoDir, 'logo-stacked.svg'), makeSvgFromPng(stackedBase64, 528, 362, 'Cyber Law Awareness Portal'));
  fs.writeFileSync(path.join(logoDir, 'logo-stacked.png'), Buffer.from(stackedBase64, 'base64'));

  // 4. Icons and Monograms
  const darkIconBase64 = assets['cyberlaw-icon-dark.png'].replace(/^data:image\/png;base64,/, '');
  const lightIconBase64 = assets['cyberlaw-icon-light.png'].replace(/^data:image\/png;base64,/, '');
  const monoBase64 = assets['cyberlaw-monogram.png'].replace(/^data:image\/png;base64,/, '');

  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon.svg'), makeSvgFromPng(monoBase64, 254, 208, 'Cyber Law'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon-dark.svg'), makeSvgFromPng(darkIconBase64, 106, 106, 'Cyber Law'));
  fs.writeFileSync(path.join(logoDir, 'icon-dark.svg'), makeSvgFromPng(darkIconBase64, 106, 106, 'Cyber Law'));
  fs.writeFileSync(path.join(logoDir, 'icon-light.svg'), makeSvgFromPng(lightIconBase64, 106, 106, 'Cyber Law'));
  fs.writeFileSync(path.join(logoDir, 'cl-mark.svg'), makeSvgFromPng(monoBase64, 254, 208, 'Cyber Law Monogram'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-favicon.svg'), makeSvgFromPng(darkIconBase64, 106, 106, 'Cyber Law Favicon'));

  // 5. Root public favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), makeSvgFromPng(darkIconBase64, 106, 106, 'Cyber Law Favicon'));

  console.log('Successfully generated all authentic brand assets in /brand and /logo!');
  await browser.close();
})();

