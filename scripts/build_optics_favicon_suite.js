const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean/clean_tight_monogram_light.png';
const lightMonoBase64 = fs.readFileSync(lightMonoPath).toString('base64');

const brandDir = path.resolve(__dirname, '../client/public/brand');
const logoDir = path.resolve(__dirname, '../client/public/logo');
const publicDir = path.resolve(__dirname, '../client/public');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <script>
        const monoImg = new Image();
        monoImg.src = 'data:image/png;base64,${lightMonoBase64}';

        window.init = async () => {
          if (!monoImg.complete) {
            await new Promise(r => monoImg.onload = r);
          }
          return { w: monoImg.width, h: monoImg.height };
        };

        // 1. Generate Optically Enhanced High-Res Monogram for SVG Favicon
        window.generateOpticsMaster = () => {
          const c = document.createElement('canvas');
          c.width = monoImg.width;
          c.height = monoImg.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(monoImg, 0, 0);

          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;

          for (let i = 0; i < d.length; i += 4) {
            const a = d[i + 3];
            if (a > 15) {
              // Gentle alpha boost on thin edge details (eaves, apex, plinths)
              d[i + 3] = Math.min(255, Math.round(Math.pow(a / 255, 0.82) * 255));
              const r = d[i], g = d[i + 1], b = d[i + 2];
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              if (lum > 130) {
                // Gold highlights
                d[i] = Math.min(255, Math.round(r * 1.06));
                d[i + 1] = Math.min(255, Math.round(g * 1.05));
                d[i + 2] = Math.min(255, Math.round(b * 1.02));
              } else if (lum < 70) {
                // Deep charcoal brown
                d[i] = Math.max(0, Math.round(r * 0.92));
                d[i + 1] = Math.max(0, Math.round(g * 0.92));
                d[i + 2] = Math.max(0, Math.round(b * 0.92));
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          return c.toDataURL('image/png');
        };

        // 2. Generate Dedicated Small-Size Favicon PNGs
        window.generateFaviconPng = (size) => {
          const c = document.getElementById('c');
          c.width = size;
          c.height = size;
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, size, size);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (size === 16) {
            // Dedicated 16x16 variant:
            // Artwork occupies 15x12 (93.75% width, 75% height) centered with 0.5px left/right, 2px top/bottom safety margins
            const cTemp = document.createElement('canvas');
            cTemp.width = 30; cTemp.height = 24;
            const ctxTemp = cTemp.getContext('2d');
            ctxTemp.imageSmoothingEnabled = true;
            ctxTemp.imageSmoothingQuality = 'high';
            ctxTemp.drawImage(monoImg, 0, 0, 30, 24);

            ctx.drawImage(cTemp, 0.5, 2, 15, 12);
            const imgData = ctx.getImageData(0, 0, 16, 16);
            const data = imgData.data;

            // Optical adjustments for 16x16:
            // Boost alpha of thin edge details so fine roof eaves, apex, and plinths remain distinct
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a > 20) {
                data[i + 3] = Math.min(255, Math.round(Math.pow(a / 255, 0.65) * 255));
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum > 130) {
                  // Gold highlights
                  data[i] = Math.min(255, Math.round(r * 1.08));
                  data[i + 1] = Math.min(255, Math.round(g * 1.06));
                  data[i + 2] = Math.min(255, Math.round(b * 1.02));
                } else if (lum < 85) {
                  // Deep shadow ribbons
                  data[i] = Math.max(0, Math.round(r * 0.90));
                  data[i + 1] = Math.max(0, Math.round(g * 0.90));
                  data[i + 2] = Math.max(0, Math.round(b * 0.90));
                }
              }
            }
            ctx.putImageData(imgData, 0, 0);
            return c.toDataURL('image/png');
          }

          if (size === 32) {
            // Dedicated 32x32 variant:
            // Artwork occupies 29x24 (90.6% width, 75% height) centered at (1.5, 4)
            ctx.drawImage(monoImg, 1.5, 4, 29, 24);
            const imgData = ctx.getImageData(0, 0, 32, 32);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a > 20) {
                data[i + 3] = Math.min(255, Math.round(Math.pow(a / 255, 0.72) * 255));
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum > 135) {
                  data[i] = Math.min(255, Math.round(r * 1.05));
                  data[i + 1] = Math.min(255, Math.round(g * 1.04));
                }
              }
            }
            ctx.putImageData(imgData, 0, 0);
            return c.toDataURL('image/png');
          }

          if (size === 48) {
            // 48x48: Artwork occupies 44x36 (91.7% width) centered at (2, 6)
            ctx.drawImage(monoImg, 2, 6, 44, 36);
            return c.toDataURL('image/png');
          }

          if (size === 64) {
            // 64x64: Artwork occupies 58x47 (90.6% width) centered at (3, 8.5)
            ctx.drawImage(monoImg, 3, 8.5, 58, 47);
            return c.toDataURL('image/png');
          }

          // Large sizes (128, 180, 192, 512):
          const targetW = Math.round(size * 0.91);
          const targetH = Math.round(targetW * (205 / 252));
          const offsetX = Math.round((size - targetW) / 2);
          const offsetY = Math.round((size - targetH) / 2);

          ctx.drawImage(monoImg, offsetX, offsetY, targetW, targetH);
          return c.toDataURL('image/png');
        };
      </script>
    </body>
    </html>
  `);

  await page.evaluate(() => window.init());

  // 1. Get Optics Master Base64
  const opticsMasterDataUrl = await page.evaluate(() => window.generateOpticsMaster());
  const opticsMasterBase64 = opticsMasterDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('scratch/clean_tight_monogram_optics.png', Buffer.from(opticsMasterBase64, 'base64'));

  // 2. Build Scalable Favicon SVG
  // Monogram is 252x205.
  // ViewBox: -8 -7 268 219 (94% width, 93.6% height, 8px/7px safety margins)
  const createFaviconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-8 -7 268 219" width="100%" height="100%" role="img" aria-label="Cyber Law Portal">
  <image x="0" y="0" width="252" height="205" xlink:href="data:image/png;base64,${opticsMasterBase64}" />
</svg>
`.trim();

  const faviconSvgContent = createFaviconSvg();
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvgContent);
  fs.writeFileSync(path.join(brandDir, 'favicon.svg'), faviconSvgContent);
  fs.writeFileSync(path.join(logoDir, 'cyber-law-favicon.svg'), faviconSvgContent);

  console.log('Saved maximized favicon.svg');

  // 3. Generate Dedicated Favicon PNGs
  const faviconSizes = [16, 32, 48, 64, 128, 180, 192, 512];
  const faviconBuffers = {};

  for (const s of faviconSizes) {
    const dataUrl = await page.evaluate((size) => window.generateFaviconPng(size), s);
    const buf = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    faviconBuffers[s] = buf;

    if (s === 16) {
      fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-16x16.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-16.png'), buf);
    } else if (s === 32) {
      fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-32x32.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-32.png'), buf);
    } else if (s === 48) {
      fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-48x48.png'), buf);
    } else if (s === 64) {
      fs.writeFileSync(path.join(brandDir, 'favicon-64.png'), buf);
    } else if (s === 128) {
      fs.writeFileSync(path.join(brandDir, 'favicon-128.png'), buf);
    } else if (s === 180) {
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'apple-touch-icon.png'), buf);
    } else if (s === 192) {
      fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buf);
      fs.writeFileSync(path.join(publicDir, 'favicon-192x192.png'), buf);
    } else if (s === 512) {
      fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buf);
      fs.writeFileSync(path.join(publicDir, 'favicon-512x512.png'), buf);
    }
  }

  // 4. Create Multi-Resolution Binary favicon.ico Embedding Dedicated 16, 32, and 48 PNGs
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // image count

  const entries = [];
  const imageBuffers = [];

  for (const s of icoSizes) {
    const pngBuf = faviconBuffers[s];
    imageBuffers.push(pngBuf);

    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(pngBuf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset

    entries.push(entry);
    offset += pngBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(brandDir, 'favicon.ico'), icoBuffer);

  console.log('Successfully generated dedicated optically tuned favicons and binary ICO!');
  await browser.close();
})();

