const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4185;

function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  return http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
}

async function run() {
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const viewports = [1440, 1280, 1024, 992, 850, 768, 390, 375];

  console.log('='.repeat(70));
  console.log('VERIFYING PEDAGOGY OVERFLOW & RESPONSIVENESS');
  console.log('='.repeat(70));

  let anyFailure = false;

  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const metrics = await page.evaluate(() => {
      const docScrollWidth = document.documentElement.scrollWidth;
      const winInnerWidth = window.innerWidth;
      const pageHorizontalOverflow = docScrollWidth - winInnerWidth;

      const container = document.querySelector('.about-page-container');
      const duo = document.querySelector('.about-pedagogy-duo');
      const panels = Array.from(document.querySelectorAll('.about-pedagogy-panel'));
      const table = document.querySelector('.about-comparison-table');

      const containerRect = container.getBoundingClientRect();
      const duoRect = duo.getBoundingClientRect();
      const leftRect = panels[0].getBoundingClientRect();
      const rightRect = panels[1].getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();

      const leftOverflowsDuo = leftRect.right > duoRect.right + 0.5;
      const rightOverflowsDuo = rightRect.right > duoRect.right + 0.5;
      const duoOverflowsContainer = duoRect.right > containerRect.right + 0.5;
      const duoOverflowsViewport = duoRect.right > winInnerWidth + 0.5;
      const tableOverflowsPanel = tableRect.right > rightRect.right + 0.5;

      return {
        viewportWidth: winInnerWidth,
        docScrollWidth,
        pageHorizontalOverflow,
        containerWidth: containerRect.width,
        duoWidth: duoRect.width,
        leftWidth: leftRect.width,
        rightWidth: rightRect.width,
        tableWidth: tableRect.width,
        leftOverflowsDuo,
        rightOverflowsDuo,
        duoOverflowsContainer,
        duoOverflowsViewport,
        tableOverflowsPanel
      };
    });

    const isOk =
      metrics.pageHorizontalOverflow === 0 &&
      !metrics.leftOverflowsDuo &&
      !metrics.rightOverflowsDuo &&
      !metrics.duoOverflowsContainer &&
      !metrics.duoOverflowsViewport &&
      !metrics.tableOverflowsPanel;

    if (!isOk) anyFailure = true;

    console.log(
      `Viewport ${w}px -> PageOverflow: ${metrics.pageHorizontalOverflow}px | Container: ${metrics.containerWidth.toFixed(0)}px | Left: ${metrics.leftWidth.toFixed(0)}px | Right: ${metrics.rightWidth.toFixed(0)}px | Table: ${metrics.tableWidth.toFixed(0)}px | Pass: ${isOk ? 'YES' : 'FAIL'}`
    );
    if (!isOk) {
      console.log('   Details:', {
        leftOverflowsDuo: metrics.leftOverflowsDuo,
        rightOverflowsDuo: metrics.rightOverflowsDuo,
        duoOverflowsContainer: metrics.duoOverflowsContainer,
        duoOverflowsViewport: metrics.duoOverflowsViewport,
        tableOverflowsPanel: metrics.tableOverflowsPanel
      });
    }
  }

  await browser.close();
  server.close();

  if (anyFailure) {
    throw new Error('Verification failed on one or more viewports!');
  } else {
    console.log('\nALL VIEWPORTS PASSED WITH 0px OVERFLOW AND NO CLIPPING!');
  }
}

run().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
