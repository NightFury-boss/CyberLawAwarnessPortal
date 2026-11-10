const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean/clean_tight_monogram_light.png';
const darkMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_clean/clean_tight_monogram_dark.png';

const lightMonoBase64 = fs.readFileSync(lightMonoPath).toString('base64');
const darkMonoBase64 = fs.readFileSync(darkMonoPath).toString('base64');

const brandDir = path.resolve(__dirname, '../client/public/brand');
const logoDir = path.resolve(__dirname, '../client/public/logo');
const publicDir = path.resolve(__dirname, '../client/public');

if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Horizontal Light Logo (300x64, 0 padding, no micro-tagline in navigation)
  const createHorizontalLightSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 64" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="2" y="3" width="71" height="58" xlink:href="data:image/png;base64,${lightMonoBase64}" />
  <line x1="84" y1="12" x2="84" y2="52" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.5" />
  <text x="96" y="34" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="24.5" letter-spacing="0.04em">
    <tspan fill="#22160E">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="98" y="51" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9.6" fill="#2E2219" letter-spacing="0.28em">
    AWARENESS PORTAL
  </text>
</svg>
`.trim();

  // 2. Horizontal Dark Logo (300x64, for dark headers and sidebars)
  const createHorizontalDarkSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 64" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="2" y="3" width="71" height="58" xlink:href="data:image/png;base64,${darkMonoBase64}" />
  <line x1="84" y1="12" x2="84" y2="52" stroke="rgba(212, 184, 149, 0.5)" stroke-width="1.5" />
  <text x="96" y="34" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="24.5" letter-spacing="0.04em">
    <tspan fill="#F8F1E6">CYBER </tspan><tspan fill="#E5C088">LAW</tspan>
  </text>
  <text x="98" y="51" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9.6" fill="#EBD7C1" letter-spacing="0.28em">
    AWARENESS PORTAL
  </text>
</svg>
`.trim();

  // 3. Footer Logo (370x82, with built-in diamond tagline)
  const createFooterSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 370 82" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal - Learn, Recognize, Stay Safe" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="4" y="5" width="86" height="70" xlink:href="data:image/png;base64,${lightMonoBase64}" />
  <line x1="102" y1="10" x2="102" y2="72" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.5" />
  <text x="118" y="34" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="27" letter-spacing="0.04em">
    <tspan fill="#22160E">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="120" y="52" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9.8" fill="#2E2219" letter-spacing="0.32em">
    AWARENESS PORTAL
  </text>
  <g transform="translate(120, 68)">
    <polygon points="0,0 3,-3 6,0 3,3" fill="#7E4826" />
    <text x="14" y="2" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9.2" fill="#2E2219" letter-spacing="0.22em">
      LEARN  •  RECOGNIZE  •  STAY SAFE
    </text>
  </g>
</svg>
`.trim();

  // 4. Primary Stacked Logo (480x380)
  const createPrimaryStackedSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 480 380" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="115" y="16" width="250" height="205" xlink:href="data:image/png;base64,${lightMonoBase64}" />
  <text x="240" y="265" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-weight="800" font-size="46" letter-spacing="0.05em">
    <tspan fill="#22160E">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="240" y="300" text-anchor="middle" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="14.5" fill="#2E2219" letter-spacing="0.40em">
    AWARENESS PORTAL
  </text>
  <polygon points="240,320 245,326 240,332 235,326" fill="#7E4826" />
  <line x1="40" y1="344" x2="115" y2="344" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.2" />
  <circle cx="115" cy="344" r="1.5" fill="#7E4826" />
  <text x="240" y="348" text-anchor="middle" font-family="'Montserrat', Arial, sans-serif" font-weight="600" font-size="11.5" fill="#2E2219" letter-spacing="0.25em">
    LEARN  •  RECOGNIZE  •  STAY SAFE
  </text>
  <circle cx="365" cy="344" r="1.5" fill="#7E4826" />
  <line x1="365" y1="344" x2="440" y2="344" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.2" />
</svg>
`.trim();

  // 5. Scalable Favicon SVG (Monogram filling 90% of square 256x256 canvas with transparent background)
  // Monogram aspect ratio is 252x206. Width=232, Height=190.
  // Centered at (12, 33) in 256x256
  const createFaviconSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="Cyber Law Portal">
  <image x="12" y="33" width="232" height="190" xlink:href="data:image/png;base64,${lightMonoBase64}" />
</svg>
`.trim();

  // 6. Monogram Standalone (viewBox 0 0 252 206)
  const createMonogramSvg = (mode = 'light') => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 252 206" width="100%" height="100%" role="img" aria-label="Cyber Law Monogram">
  <image width="252" height="206" xlink:href="data:image/png;base64,${mode === 'dark' ? darkMonoBase64 : lightMonoBase64}" />
</svg>
`.trim();

  // 7. App Icons (Squircle with 186x152 monument)
  const createAppIconSvg = (mode = 'dark') => {
    const isDark = mode === 'dark';
    const bg = isDark ? '#3A2E26' : '#F8F1E6';
    const border = isDark ? 'rgba(212, 184, 149, 0.25)' : 'rgba(139, 94, 60, 0.25)';
    const mono = isDark ? darkMonoBase64 : lightMonoBase64;

    return `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="Cyber Law App Icon" shape-rendering="geometricPrecision">
  <rect x="8" y="8" width="240" height="240" rx="54" ry="54" fill="${bg}" stroke="${border}" stroke-width="2" />
  <image x="35" y="44" width="186" height="152" xlink:href="data:image/png;base64,${mono}" />
</svg>
    `.trim();
  };

  // Write SVGs to brandDir
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal.svg'), createHorizontalLightSvg());
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal-dark.svg'), createHorizontalDarkSvg());
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-primary.svg'), createPrimaryStackedSvg());
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-monogram.svg'), createMonogramSvg('light'));
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-monogram-dark.svg'), createMonogramSvg('dark'));
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-icon-dark.svg'), createAppIconSvg('dark'));
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-icon-light.svg'), createAppIconSvg('light'));
  fs.writeFileSync(path.join(brandDir, 'favicon.svg'), createFaviconSvg());

  // Write SVGs to logoDir & publicDir
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-horizontal.svg'), createHorizontalLightSvg());
  fs.writeFileSync(path.join(logoDir, 'logo-horizontal.svg'), createHorizontalLightSvg());
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-dark.svg'), createHorizontalDarkSvg());
  fs.writeFileSync(path.join(logoDir, 'logo-dark.svg'), createHorizontalDarkSvg());
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-footer.svg'), createFooterSvg());
  fs.writeFileSync(path.join(logoDir, 'logo-stacked.svg'), createPrimaryStackedSvg());
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon.svg'), createMonogramSvg('light'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon-dark.svg'), createMonogramSvg('dark'));
  fs.writeFileSync(path.join(logoDir, 'cl-mark.svg'), createMonogramSvg('light'));
  fs.writeFileSync(path.join(logoDir, 'icon-dark.svg'), createAppIconSvg('dark'));
  fs.writeFileSync(path.join(logoDir, 'icon-light.svg'), createAppIconSvg('light'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-favicon.svg'), createFaviconSvg());

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createFaviconSvg());

  console.log('Saved all SVG assets');

  // Rasterize Favicon and Logo PNGs using Chromium Canvas
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background: transparent;">
      <canvas id="c"></canvas>
      <script>
        document.fonts.ready.then(() => {
          window.__fontsReady = true;
        });

        const monoImg = new Image();
        monoImg.src = 'data:image/png;base64,${lightMonoBase64}';

        window.generateFaviconPng = async (size) => {
          const c = document.getElementById('c');
          c.width = size;
          c.height = size;
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, size, size);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Monogram occupies ~90% of the canvas width
          const targetW = Math.round(size * 0.90);
          const targetH = Math.round(targetW * (206 / 252));
          const offsetX = Math.round((size - targetW) / 2);
          const offsetY = Math.round((size - targetH) / 2);

          ctx.drawImage(monoImg, offsetX, offsetY, targetW, targetH);
          return c.toDataURL('image/png');
        };

        window.renderSvgToPng = async (svgString, width, height, dpr = 2) => {
          const c = document.getElementById('c');
          c.width = width * dpr;
          c.height = height * dpr;
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.scale(dpr, dpr);

          const img = new Image();
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, width, height);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });

          return c.toDataURL('image/png');
        };
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__fontsReady === true);

  // Generate Favicon sizes
  const faviconSizes = [16, 32, 48, 180, 192, 512];
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
      fs.writeFileSync(path.join(brandDir, 'favicon-64.png'), buf);
    } else if (s === 180) {
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'apple-touch-icon.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-128.png'), buf);
    } else if (s === 192) {
      fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buf);
      fs.writeFileSync(path.join(publicDir, 'favicon-192x192.png'), buf);
      fs.writeFileSync(path.join(brandDir, 'favicon-256.png'), buf);
    } else if (s === 512) {
      fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buf);
      fs.writeFileSync(path.join(publicDir, 'favicon-512x512.png'), buf);
    }
  }

  // Create Multi-Resolution favicon.ico containing 16x16, 32x32, 48x48
  // ICO format: 6 byte header + 16 bytes per entry + raw png data
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

  // Generate Logo PNGs
  const pngJobs = [
    { name: 'cyberlaw-logo-horizontal.png', dir: brandDir, svg: createHorizontalLightSvg(), w: 300, h: 64 },
    { name: 'cyber-law-logo-horizontal.png', dir: logoDir, svg: createHorizontalLightSvg(), w: 300, h: 64 },
    { name: 'cyberlaw-logo-horizontal-dark.png', dir: brandDir, svg: createHorizontalDarkSvg(), w: 300, h: 64 },
    { name: 'cyber-law-logo-dark.png', dir: logoDir, svg: createHorizontalDarkSvg(), w: 300, h: 64 },
    { name: 'cyberlaw-logo-primary.png', dir: brandDir, svg: createPrimaryStackedSvg(), w: 480, h: 380 },
    { name: 'logo-stacked.png', dir: logoDir, svg: createPrimaryStackedSvg(), w: 480, h: 380 }
  ];

  for (const job of pngJobs) {
    const dataUrl = await page.evaluate(({ svg, w, h }) => window.renderSvgToPng(svg, w, h), job);
    const buf = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    fs.writeFileSync(path.join(job.dir, job.name), buf);
  }

  console.log('Successfully built all final brand assets and multi-res favicons!');
  await browser.close();
})();

