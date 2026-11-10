/**
 * Reproduction Script for the Automatic Upward-Scrolling Bug
 * Simulates a real user scrolling down the Laws page and tracks window.scrollY
 * to detect unexpected upward jumps.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4176;

function extractLawSections() {
  const seedFilePath = path.join(__dirname, '../server/config/seed.js');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');

  const startMarker = 'const lawSectionsData = [';
  const startIndex = seedContent.indexOf(startMarker);
  if (startIndex === -1) throw new Error('lawSectionsData not found in seed.js');

  const arrayStart = startIndex + 'const lawSectionsData = '.length;
  let bracketDepth = 0;
  let endIndex = -1;
  for (let i = arrayStart; i < seedContent.length; i++) {
    if (seedContent[i] === '[') bracketDepth++;
    else if (seedContent[i] === ']') {
      bracketDepth--;
      if (bracketDepth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  const arrayCode = seedContent.substring(arrayStart, endIndex);
  const mockId = '660000000000000000000001';
  const mockSource = { _id: mockId, title: 'Official Gazette / India Code', authority: 'Government of India', url: 'https://www.indiacode.nic.in' };

  const sandbox = {
    sourceIndiaCode: mockSource,
    sourceShreyaSinghal: mockSource,
    sourceDPDP: mockSource,
    sourceBNS: mockSource,
    sourcePuttaswamy: mockSource,
    sourceITRules: mockSource,
    sourceCERTIn: mockSource,
    sourceBSA: mockSource,
    sourceRBI: mockSource,
    sourceArjunPanditrao: mockSource,
    sourceI4C: mockSource,
    sourceBNSS: mockSource,
    sourceCopyright: mockSource
  };

  const script = new vm.Script('lawSectionsData = ' + arrayCode);
  const context = vm.createContext(sandbox);
  script.runInContext(context);

  return sandbox.lawSectionsData.map((s, idx) => ({
    ...s,
    _id: `law_sec_${idx + 1}`,
    officialSourceId: mockSource
  }));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function createStaticServer() {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  });
}

async function runScrollRepro() {
  console.log('======================================================================');
  console.log('REPRODUCING AUTOMATIC UPWARD SCROLLING BUG');
  console.log('======================================================================\n');

  const lawsData = extractLawSections();
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.route('**/api/laws*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lawsData)
    });
  });

  const page = await context.newPage();

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/laws`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.law-section-card', { timeout: 5000 });

    console.log('[STEP 1] Page loaded. Initial scrollY:', await page.evaluate(() => window.scrollY));

    // Listen to scroll events in the page and record unexpected jumps
    await page.evaluate(() => {
      window.__scrollLog = [];
      let lastY = 0;
      window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        window.__scrollLog.push({
          y: currentY,
          time: performance.now(),
          delta: currentY - lastY
        });
        lastY = currentY;
      });
    });

    console.log('\n[STEP 2] Simulating natural downward scrolling step by step...');
    let previousY = 0;
    const jumpsDetected = [];

    // Scroll down incrementally in steps of 300px
    for (let targetY = 300; targetY <= 4000; targetY += 300) {
      console.log(`\n  -> User scrolls downwards towards ${targetY}px...`);
      await page.evaluate((y) => {
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, targetY);

      // Wait a moment for observer/scroll to settle
      await page.waitForTimeout(400);

      // Check current scroll position
      const actualY = await page.evaluate(() => window.scrollY);
      const activeSec = await page.evaluate(() => {
        const activeLink = document.querySelector('.laws-sidebar-sec-link.sec-active');
        return activeLink ? activeLink.textContent : 'none';
      });

      console.log(`     Target: ${targetY}px | Actual Y: ${Math.round(actualY)}px | Active Section: ${activeSec}`);

      // Check if actualY decreased significantly from previous scroll target
      if (actualY < targetY - 100 && actualY < previousY) {
        console.log(`     ⚠️ UNEXPECTED UPWARD JUMP DETECTED! Target was ${targetY}px, but Y jumped back up to ${Math.round(actualY)}px!`);
        jumpsDetected.push({
          target: targetY,
          previousY,
          actualY,
          activeSec
        });
      }

      previousY = actualY;
    }

    console.log('\n======================================================================');
    console.log(`REPRODUCTION RESULT: ${jumpsDetected.length} upward jump(s) detected.`);
    if (jumpsDetected.length > 0) {
      console.log('Jumps:', JSON.stringify(jumpsDetected, null, 2));
    }
    console.log('======================================================================');

    return { bugReproduced: jumpsDetected.length > 0, jumpsDetected };
  } finally {
    await browser.close();
    server.close();
  }
}

runScrollRepro().then((res) => {
  process.exit(0);
}).catch((err) => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});

