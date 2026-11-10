const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const srcPath = path.resolve('C:/Users/Asus/.gemini/antigravity/brain/2a38735a-7985-4d0c-9744-999cb0b89167/.user_uploaded/media_1794328050340_7b6ab5dc.jpg');
  const fileUrl = 'file:///' + srcPath.replace(/\\/g, '/');

  await page.goto(fileUrl);
  await page.waitForSelector('img');

  const outDir = path.resolve('client/public/logo');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Process and save exact assets with perfect rounded clipping where appropriate:
  const assets = await page.evaluate(() => {
    const img = document.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 1. Exact Dark Card (with transparent corners outside the pill)
    // Dark card bounds: x: 26, y: 421, w: 388, h: 106
    canvas.width = 388;
    canvas.height = 106;
    ctx.clearRect(0, 0, 388, 106);
    // Draw rounded rect path
    const r = 18;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(388 - r, 0);
    ctx.quadraticCurveTo(388, 0, 388, r);
    ctx.lineTo(388, 106 - r);
    ctx.quadraticCurveTo(388, 106, 388 - r, 106);
    ctx.lineTo(r, 106);
    ctx.quadraticCurveTo(0, 106, 0, 106 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 26, 421, 388, 106, 0, 0, 388, 106);
    const darkCardData = canvas.toDataURL('image/png');

    // 2. Exact Light Card
    canvas.width = 314;
    canvas.height = 106;
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 314, 106);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(314 - r, 0);
    ctx.quadraticCurveTo(314, 0, 314, r);
    ctx.lineTo(314, 106 - r);
    ctx.quadraticCurveTo(314, 106, 314 - r, 106);
    ctx.lineTo(r, 106);
    ctx.quadraticCurveTo(0, 106, 0, 106 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 438, 421, 314, 106, 0, 0, 314, 106);
    const lightCardData = canvas.toDataURL('image/png');

    // 3. Exact Dark Squircle Icon
    // bounds: x: 772, y: 424, w: 102, h: 100
    canvas.width = 102;
    canvas.height = 100;
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 102, 100);
    const sqR = 22;
    ctx.beginPath();
    ctx.moveTo(sqR, 0);
    ctx.lineTo(102 - sqR, 0);
    ctx.quadraticCurveTo(102, 0, 102, sqR);
    ctx.lineTo(102, 100 - sqR);
    ctx.quadraticCurveTo(102, 100, 102 - sqR, 100);
    ctx.lineTo(sqR, 100);
    ctx.quadraticCurveTo(0, 100, 0, 100 - sqR);
    ctx.lineTo(0, sqR);
    ctx.quadraticCurveTo(0, 0, sqR, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 772, 424, 102, 100, 0, 0, 102, 100);
    const darkSquircleData = canvas.toDataURL('image/png');

    // 4. Exact Light Squircle Icon
    canvas.width = 102;
    canvas.height = 100;
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 102, 100);
    ctx.beginPath();
    ctx.moveTo(sqR, 0);
    ctx.lineTo(102 - sqR, 0);
    ctx.quadraticCurveTo(102, 0, 102, sqR);
    ctx.lineTo(102, 100 - sqR);
    ctx.quadraticCurveTo(102, 100, 102 - sqR, 100);
    ctx.lineTo(sqR, 100);
    ctx.quadraticCurveTo(0, 100, 0, 100 - sqR);
    ctx.lineTo(0, sqR);
    ctx.quadraticCurveTo(0, 0, sqR, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 892, 424, 102, 100, 0, 0, 102, 100);
    const lightSquircleData = canvas.toDataURL('image/png');

    // 5. Exact Stacked Central Logo
    canvas.width = 504;
    canvas.height = 325;
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 504, 325);
    ctx.drawImage(img, 260, 35, 504, 325, 0, 0, 504, 325);
    const stackedData = canvas.toDataURL('image/png');

    // 6. Exact Monument Monogram
    canvas.width = 304;
    canvas.height = 215;
    ctx.restore();
    ctx.save();
    ctx.clearRect(0, 0, 304, 215);
    ctx.drawImage(img, 360, 25, 304, 215, 0, 0, 304, 215);
    const monumentData = canvas.toDataURL('image/png');

    return {
      darkCardData,
      lightCardData,
      darkSquircleData,
      lightSquircleData,
      stackedData,
      monumentData
    };
  });

  const save = (dataUrl, filePath) => {
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, b64, 'base64');
    console.log('Saved exact PNG:', filePath);
  };

  // Save the exact PNGs
  save(assets.lightCardData, path.join(outDir, 'cyber-law-logo-horizontal.png'));
  save(assets.lightCardData, path.join(outDir, 'logo-horizontal.png'));
  save(assets.darkCardData, path.join(outDir, 'cyber-law-logo-dark.png'));
  save(assets.darkCardData, path.join(outDir, 'logo-dark.png'));
  save(assets.darkSquircleData, path.join(outDir, 'icon-dark.png'));
  save(assets.darkSquircleData, path.join(outDir, 'cyber-law-favicon.png'));
  save(assets.lightSquircleData, path.join(outDir, 'icon-light.png'));
  save(assets.stackedData, path.join(outDir, 'logo-stacked.png'));
  save(assets.monumentData, path.join(outDir, 'cyber-law-logo-icon.png'));
  save(assets.monumentData, path.join(outDir, 'cl-mark.png'));

  // Also create SVG wrappers that embed the exact PNG data URI losslessly!
  // This guarantees that any SVG-expecting tool or <img> tag gets the EXACT pixel-perfect image without any modification!
  const createSvgWrapper = (pngDataUrl, w, h) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" role="img" aria-label="Cyber Law Awareness Portal">
  <image href="${pngDataUrl}" width="${w}" height="${h}" />
</svg>
  `.trim();

  fs.writeFileSync(path.join(outDir, 'cyber-law-logo-horizontal.svg'), createSvgWrapper(assets.lightCardData, 314, 106));
  fs.writeFileSync(path.join(outDir, 'logo-horizontal.svg'), createSvgWrapper(assets.lightCardData, 314, 106));
  fs.writeFileSync(path.join(outDir, 'cyber-law-logo-dark.svg'), createSvgWrapper(assets.darkCardData, 388, 106));
  fs.writeFileSync(path.join(outDir, 'logo-dark.svg'), createSvgWrapper(assets.darkCardData, 388, 106));
  fs.writeFileSync(path.join(outDir, 'icon-dark.svg'), createSvgWrapper(assets.darkSquircleData, 102, 100));
  fs.writeFileSync(path.join(outDir, 'cyber-law-favicon.svg'), createSvgWrapper(assets.darkSquircleData, 102, 100));
  fs.writeFileSync(path.join(outDir, 'icon-light.svg'), createSvgWrapper(assets.lightSquircleData, 102, 100));
  fs.writeFileSync(path.join(outDir, 'logo-stacked.svg'), createSvgWrapper(assets.stackedData, 504, 325));
  fs.writeFileSync(path.join(outDir, 'cyber-law-logo-icon.svg'), createSvgWrapper(assets.monumentData, 304, 215));
  fs.writeFileSync(path.join(outDir, 'cl-mark.svg'), createSvgWrapper(assets.monumentData, 304, 215));

  // Also update client/public/favicon.svg
  fs.writeFileSync(path.resolve('client/public/favicon.svg'), createSvgWrapper(assets.darkSquircleData, 102, 100));

  console.log('Saved all exact assets and SVG wrappers.');

  await browser.close();
})();

