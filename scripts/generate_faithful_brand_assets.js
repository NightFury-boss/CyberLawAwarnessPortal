const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const lightMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops/monogram_light_trans.png';
const darkMonoPath = 'C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/scratch/brand_crops/monogram_dark_hires_trans.png';

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

  // A. Horizontal Light Logo (320x68, transparent background)
  const createHorizontalLightSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 68" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="4" y="4" width="73" height="60" xlink:href="data:image/png;base64,${lightMonoBase64}" />
  <line x1="88" y1="12" x2="88" y2="56" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.5" />
  <text x="100" y="36" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="24" letter-spacing="0.04em">
    <tspan fill="#22160E">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="102" y="53" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9" fill="#2E2219" letter-spacing="0.28em">
    AWARENESS PORTAL
  </text>
</svg>
`.trim();

  // B. Horizontal Dark Logo (320x68, transparent background for dark headers/sidebars)
  const createHorizontalDarkSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 320 68" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="4" y="4" width="73" height="60" xlink:href="data:image/png;base64,${darkMonoBase64}" />
  <line x1="88" y1="12" x2="88" y2="56" stroke="rgba(212, 184, 149, 0.5)" stroke-width="1.5" />
  <text x="100" y="36" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="24" letter-spacing="0.04em">
    <tspan fill="#F8F1E6">CYBER </tspan><tspan fill="#E5C088">LAW</tspan>
  </text>
  <text x="102" y="53" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9" fill="#EBD7C1" letter-spacing="0.28em">
    AWARENESS PORTAL
  </text>
</svg>
`.trim();

  // C. Footer Logo (370x82, transparent background with built-in tagline)
  const createFooterSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 370 82" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal - Learn, Recognize, Stay Safe" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <image x="4" y="5" width="88" height="72" xlink:href="data:image/png;base64,${lightMonoBase64}" />
  <line x1="104" y1="10" x2="104" y2="72" stroke="rgba(139, 94, 60, 0.4)" stroke-width="1.5" />
  <text x="120" y="34" font-family="'Playfair Display', Georgia, serif" font-weight="700" font-size="27" letter-spacing="0.04em">
    <tspan fill="#22160E">CYBER </tspan><tspan fill="#7E4826">LAW</tspan>
  </text>
  <text x="122" y="52" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9.8" fill="#2E2219" letter-spacing="0.32em">
    AWARENESS PORTAL
  </text>
  <g transform="translate(122, 68)">
    <polygon points="0,0 3,-3 6,0 3,3" fill="#7E4826" />
    <text x="14" y="2" font-family="'Montserrat', Arial, sans-serif" font-weight="700" font-size="9.2" fill="#2E2219" letter-spacing="0.22em">
      LEARN  •  RECOGNIZE  •  STAY SAFE
    </text>
  </g>
</svg>
`.trim();

  // D. Primary Stacked Logo (480x380, transparent background)
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

  // E. Squircle App Icons & Favicons (256x256)
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

  // F. Monogram standalone (viewBox 0 0 254 208)
  const createMonogramSvg = (mode = 'light') => `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 254 208" width="100%" height="100%" role="img" aria-label="Cyber Law Monogram">
  <image width="254" height="208" xlink:href="data:image/png;base64,${mode === 'dark' ? darkMonoBase64 : lightMonoBase64}" />
</svg>
`.trim();

  // Write SVGs to brandDir
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal.svg'), createHorizontalLightSvg());
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-horizontal-dark.svg'), createHorizontalDarkSvg());
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-logo-primary.svg'), createPrimaryStackedSvg());
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-icon-dark.svg'), createAppIconSvg('dark'));
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-icon-light.svg'), createAppIconSvg('light'));
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-monogram.svg'), createMonogramSvg('light'));
  fs.writeFileSync(path.join(brandDir, 'cyberlaw-monogram-dark.svg'), createMonogramSvg('dark'));

  // Write synchronized files to logoDir
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-horizontal.svg'), createHorizontalLightSvg());
  fs.writeFileSync(path.join(logoDir, 'logo-horizontal.svg'), createHorizontalLightSvg());
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-dark.svg'), createHorizontalDarkSvg());
  fs.writeFileSync(path.join(logoDir, 'logo-dark.svg'), createHorizontalDarkSvg());
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-footer.svg'), createFooterSvg());
  fs.writeFileSync(path.join(logoDir, 'logo-stacked.svg'), createPrimaryStackedSvg());
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon.svg'), createMonogramSvg('light'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-logo-icon-dark.svg'), createMonogramSvg('dark'));
  fs.writeFileSync(path.join(logoDir, 'icon-dark.svg'), createAppIconSvg('dark'));
  fs.writeFileSync(path.join(logoDir, 'icon-light.svg'), createAppIconSvg('light'));
  fs.writeFileSync(path.join(logoDir, 'cl-mark.svg'), createMonogramSvg('light'));
  fs.writeFileSync(path.join(logoDir, 'cyber-law-favicon.svg'), createAppIconSvg('dark'));

  // Root public favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createAppIconSvg('dark'));

  console.log('Saved all authentic SVGs');

  // Also rasterize PNGs from these exact SVGs at high DPI using Chromium
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background: transparent;">
      <div id="container"></div>
      <script>
        document.fonts.ready.then(() => {
          window.__fontsReady = true;
        });

        window.renderSvgToPng = async (svgString, width, height, dpr = 2) => {
          const container = document.getElementById('container');
          container.innerHTML = svgString;
          const svgEl = container.firstElementChild;
          svgEl.setAttribute('width', width);
          svgEl.setAttribute('height', height);

          const canvas = document.createElement('canvas');
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          const ctx = canvas.getContext('2d');
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

          return canvas.toDataURL('image/png');
        };
      </script>
    </body>
    </html>
  `);

  await page.waitForFunction(() => window.__fontsReady === true);

  const pngJobs = [
    { name: 'cyberlaw-logo-horizontal.png', dir: brandDir, svg: createHorizontalLightSvg(), w: 320, h: 68 },
    { name: 'cyber-law-logo-horizontal.png', dir: logoDir, svg: createHorizontalLightSvg(), w: 320, h: 68 },
    { name: 'cyberlaw-logo-horizontal-dark.png', dir: brandDir, svg: createHorizontalDarkSvg(), w: 320, h: 68 },
    { name: 'cyber-law-logo-dark.png', dir: logoDir, svg: createHorizontalDarkSvg(), w: 320, h: 68 },
    { name: 'cyberlaw-logo-primary.png', dir: brandDir, svg: createPrimaryStackedSvg(), w: 480, h: 380 },
    { name: 'logo-stacked.png', dir: logoDir, svg: createPrimaryStackedSvg(), w: 480, h: 380 },
    { name: 'cyberlaw-icon-dark.png', dir: brandDir, svg: createAppIconSvg('dark'), w: 256, h: 256 },
    { name: 'cyberlaw-icon-light.png', dir: brandDir, svg: createAppIconSvg('light'), w: 256, h: 256 },
    { name: 'icon-dark.png', dir: logoDir, svg: createAppIconSvg('dark'), w: 256, h: 256 },
    { name: 'icon-light.png', dir: logoDir, svg: createAppIconSvg('light'), w: 256, h: 256 },
    { name: 'cyberlaw-monogram.png', dir: brandDir, svg: createMonogramSvg('light'), w: 254, h: 208 },
    // Favicons
    { name: 'favicon-256.png', dir: brandDir, svg: createAppIconSvg('dark'), w: 256, h: 256 },
    { name: 'favicon-128.png', dir: brandDir, svg: createAppIconSvg('dark'), w: 128, h: 128 },
    { name: 'favicon-64.png', dir: brandDir, svg: createAppIconSvg('dark'), w: 64, h: 64 },
    { name: 'favicon-32.png', dir: brandDir, svg: createAppIconSvg('dark'), w: 32, h: 32 },
    { name: 'favicon-16.png', dir: brandDir, svg: createAppIconSvg('dark'), w: 16, h: 16 }
  ];

  for (const job of pngJobs) {
    const dataUrl = await page.evaluate(({ svg, w, h }) => window.renderSvgToPng(svg, w, h), job);
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(job.dir, job.name), Buffer.from(base64Data, 'base64'));
  }

  console.log('Saved all rasterized high-DPI PNGs');
  await browser.close();
})();
