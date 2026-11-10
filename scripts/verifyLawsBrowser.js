/**
 * Dedicated Browser Verification Script for Laws Page Redesign
 * Verifies Desktop (1440px), Laptop (1280px), Tablet (768px), Mobile (390px), and Narrow Mobile (375px)
 * using Playwright Chromium with 0px horizontal overflow assertions.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4174;
const SCREENSHOT_DIR = path.join(
  'C:',
  'Users',
  'Asus',
  '.gemini',
  'antigravity',
  'brain',
  '2a38735a-7985-4d0c-9744-999cb0b89167',
  'screenshots',
  'laws-redesign'
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Extract the 32 real LawSections from seed.js offline
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

async function runLawsVerification() {
  console.log('======================================================================');
  console.log('LAWS PAGE REDESIGN — BROWSER VERIFICATION & QUALITY ASSURANCE');
  console.log('======================================================================\n');

  const lawsData = extractLawSections();
  console.log(`[DATA] Extracted ${lawsData.length} statutory sections from seed.js`);

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[SERVER] Static SPA server listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Route interception for API
  await context.route('**/api/laws*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lawsData)
    });
  });

  const page = await context.newPage();

  const testReport = {
    viewports: [],
    features: [],
    screenshots: []
  };

  try {
    // -----------------------------------------------------------------------
    // PART 1: DESKTOP VIEWPORT (1440x900)
    // -----------------------------------------------------------------------
    console.log('\n[TEST 1] Desktop Viewport Verification (1440x900):');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/laws`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.law-section-card', { timeout: 5000 });

    // 1.1 Header Title
    const title = await page.textContent('.page-title');
    const titleOk = title && title.includes('Understand Your Digital Rights');
    console.log(`  [${titleOk ? 'PASS' : 'FAIL'}] Page Title: "${title?.trim()}"`);
    testReport.features.push({ name: 'Page Title: Understand Your Digital Rights', pass: titleOk });

    // 1.2 Statutory Framework Notice Board
    const frameworkBoard = await page.locator('.laws-framework-board');
    const boardExists = await frameworkBoard.count() > 0;
    const boardText = await frameworkBoard.textContent();
    const has43A = boardText.includes('IT Act § 43A') && boardText.includes('ACTIVE LAW');
    const hasBNS = boardText.includes('BNS, 2023') && boardText.includes('FROM 1 JULY 2024');
    const has66A = boardText.includes('IT Act § 66A') && boardText.includes('STRUCK DOWN');
    const frameworkOk = boardExists && has43A && hasBNS && has66A;
    console.log(`  [${frameworkOk ? 'PASS' : 'FAIL'}] Framework Notice Board: 43A=${has43A}, BNS=${hasBNS}, 66A=${has66A}`);
    testReport.features.push({ name: 'Statutory Framework Notice Board', pass: frameworkOk });

    // 1.3 Total sections rendered
    const cardCount = await page.locator('.law-section-card').count();
    const countOk = cardCount === 32;
    console.log(`  [${countOk ? 'PASS' : 'FAIL'}] Total Section Cards Rendered: ${cardCount} (expected 32)`);
    testReport.features.push({ name: 'Catalog count matches 32 provisions', pass: countOk });

    // 1.4 Category Tab Navigation
    const dpdpTab = page.locator('.laws-category-tab').filter({ hasText: 'DPDP Act, 2023' });
    await dpdpTab.click();
    await page.waitForTimeout(200);
    const dpdpCount = await page.locator('.law-section-card').count();
    const dpdpOk = dpdpCount > 0 && dpdpCount < 32;
    console.log(`  [${dpdpOk ? 'PASS' : 'FAIL'}] DPDP Category Tab Filter: ${dpdpCount} provisions shown`);
    testReport.features.push({ name: 'DPDP Category Filter Tab', pass: dpdpOk });

    // Reset to All
    await page.locator('.laws-category-tab').filter({ hasText: 'All Legislation' }).click();
    await page.waitForTimeout(200);

    // 1.5 Status Filter (Struck Down / Omitted)
    const omittedChip = page.locator('.laws-filter-chip').filter({ hasText: 'Struck Down' });
    await omittedChip.click();
    await page.waitForTimeout(200);
    const omittedCount = await page.locator('.law-section-card').count();
    const sec66aVisible = await page.locator('#section-card-Section-66A').count() > 0;
    const omittedOk = omittedCount >= 1 && sec66aVisible;
    console.log(`  [${omittedOk ? 'PASS' : 'FAIL'}] Status Filter (Struck Down): ${omittedCount} provision(s), Section 66A visible=${sec66aVisible}`);
    testReport.features.push({ name: 'Status Filter: Struck Down / Section 66A', pass: omittedOk });

    // Reset Status Filter
    await page.locator('.laws-filter-chip').filter({ hasText: 'All Statuses' }).click();
    await page.waitForTimeout(200);

    // 1.6 Plain English vs Legal Text Toggle
    const sec43aCard = page.locator('#section-card-Section-43A');
    const legalTextBtn = sec43aCard.locator('button').filter({ hasText: 'Official Legal Text' });
    await legalTextBtn.click();
    await page.waitForTimeout(200);
    const legalBlockVisible = await sec43aCard.locator('.section-body-legal').count() > 0;
    const plainBtn = sec43aCard.locator('button').filter({ hasText: 'Plain English' });
    await plainBtn.click();
    await page.waitForTimeout(200);
    const plainBlockVisible = await sec43aCard.locator('.section-body-plain').count() > 0;
    const toggleOk = legalBlockVisible && plainBlockVisible;
    console.log(`  [${toggleOk ? 'PASS' : 'FAIL'}] Plain English vs Legal Text Toggle: legal=${legalBlockVisible}, plain=${plainBlockVisible}`);
    testReport.features.push({ name: 'Plain English vs Legal Text Toggle', pass: toggleOk });

    // 1.7 Single Law Compass Toggle Control Verification
    const compassToggleButtons = await page.locator('.compass-single-toggle-btn').count();
    const initialToggleText = await page.textContent('.compass-single-toggle-btn');
    const isInitiallyExpanded = initialToggleText.includes('Hide Law Compass');
    const sectionVisibleBefore = await page.locator('#law-compass-section').count() > 0;

    // Click to collapse
    await page.locator('.compass-single-toggle-btn').click();
    await page.waitForTimeout(200);
    const collapsedToggleText = await page.textContent('.compass-single-toggle-btn');
    const isNowCollapsed = collapsedToggleText.includes('Show Law Compass');
    const sectionHiddenAfter = await page.locator('#law-compass-section').count() === 0;

    // Click to expand again
    await page.locator('.compass-single-toggle-btn').click();
    await page.waitForTimeout(200);
    const reExpandedToggleText = await page.textContent('.compass-single-toggle-btn');
    const isReExpanded = reExpandedToggleText.includes('Hide Law Compass');
    const sectionVisibleAgain = await page.locator('#law-compass-section').count() > 0;

    const singleToggleOk = compassToggleButtons === 1 && isInitiallyExpanded && sectionVisibleBefore && isNowCollapsed && sectionHiddenAfter && isReExpanded && sectionVisibleAgain;
    console.log(`  [${singleToggleOk ? 'PASS' : 'FAIL'}] Exactly One Law Compass Toggle: buttons=${compassToggleButtons}, expanded="${initialToggleText.trim()}", collapsed="${collapsedToggleText.trim()}"`);
    testReport.features.push({ name: 'Single Law Compass Toggle Control (Hide/Show)', pass: singleToggleOk });

    // 1.8 Minimalist Legislation Index Verification
    const indexTitle = await page.textContent('.legislation-index-title');
    const indexTitleOk = indexTitle && indexTitle.trim() === 'Legislation Index';
    const indexSearchExists = await page.locator('.legislation-index-search-input').count() > 0;
    
    // Test filtering within Legislation Index search input
    await page.locator('.legislation-index-search-input').fill('66C');
    await page.waitForTimeout(200);
    const filteredCount = await page.locator('.law-section-card').count();
    const sec66cVisible = await page.locator('#section-card-Section-66C').count() > 0;
    const indexSearchOk = filteredCount >= 1 && sec66cVisible;
    
    // Clear search
    await page.locator('.legislation-index-search-clear').click();
    await page.waitForTimeout(200);
    const restoredCount = await page.locator('.law-section-card').count();
    const indexRestoreOk = restoredCount === 32;

    const legislationIndexOk = indexTitleOk && indexSearchExists && indexSearchOk && indexRestoreOk;
    console.log(`  [${legislationIndexOk ? 'PASS' : 'FAIL'}] Minimalist Legislation Index: titleOk=${indexTitleOk}, searchFilter=${indexSearchOk}, restore=${indexRestoreOk}`);
    testReport.features.push({ name: 'Minimalist Legislation Index (TOC)', pass: legislationIndexOk });

    // 1.9 Law Compass Category Filtering & Navigation
    const totalSituationsInitial = await page.locator('.compass-situation-btn').count();
    const financialPill = page.locator('.compass-category-pill').filter({ hasText: 'Financial Fraud' });
    await financialPill.click();
    await page.waitForTimeout(150);
    const financialCount = await page.locator('.compass-situation-btn').count();

    const identityPill = page.locator('.compass-category-pill').filter({ hasText: 'Identity & AI' });
    await identityPill.click();
    await page.waitForTimeout(150);
    const identityCount = await page.locator('.compass-situation-btn').count();

    const allPill = page.locator('.compass-category-pill').filter({ hasText: 'All Scenarios' });
    await allPill.click();
    await page.waitForTimeout(150);
    const allResetCount = await page.locator('.compass-situation-btn').count();

    const categoryFilterOk = totalSituationsInitial === 11 && financialCount === 3 && identityCount === 3 && allResetCount === 11;
    console.log(`  [${categoryFilterOk ? 'PASS' : 'FAIL'}] Law Compass Category Filtering: initial=${totalSituationsInitial}, financial=${financialCount}, identity=${identityCount}, reset=${allResetCount}`);
    testReport.features.push({ name: 'Law Compass Category Filter Pills', pass: categoryFilterOk });

    // 1.10 Law Compass Step 1 -> Step 2
    const firstSituationBtn = page.locator('.compass-situation-btn').first();
    await firstSituationBtn.click();
    await page.waitForTimeout(300);
    const compassResultVisible = await page.locator('.compass-result-panel').count() > 0;
    const compassBadgeCount = await page.locator('.compass-provision-badge').count();
    const compassOk = compassResultVisible && compassBadgeCount > 0;
    console.log(`  [${compassOk ? 'PASS' : 'FAIL'}] Law Compass Navigation: Result visible=${compassResultVisible}, Provisions=${compassBadgeCount}`);
    testReport.features.push({ name: 'Law Compass 2-Step Flow', pass: compassOk });

    // Reset compass
    await page.locator('button').filter({ hasText: 'Choose Another Situation' }).click();
    await page.waitForTimeout(200);

    // 1.11 Continuous Scrolling Upward-Jump Prevention Check
    let scrollJumpDetected = false;
    let prevY = 0;
    for (let targetY = 500; targetY <= 3500; targetY += 500) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), targetY);
      await page.waitForTimeout(80);
      const curY = await page.evaluate(() => window.scrollY);
      if (curY < prevY || curY < targetY - 50) {
        scrollJumpDetected = true;
        break;
      }
      prevY = curY;
    }
    // Return to top for screenshots
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    console.log(`  [${!scrollJumpDetected ? 'PASS' : 'FAIL'}] Continuous Scrolling Upward Jump Prevention: ${!scrollJumpDetected}`);
    testReport.features.push({ name: 'Scroll Lifecycle: Zero Upward Jumps', pass: !scrollJumpDetected });

    // 1.12 Bookmarking & LocalStorage
    const bookmarkBtn = sec43aCard.locator('.section-bookmark-btn');
    await bookmarkBtn.click();
    await page.waitForTimeout(200);
    const isBookmarked = await page.evaluate(() => {
      const b = JSON.parse(localStorage.getItem('law_bookmarks') || '[]');
      return b.includes('Section 43A');
    });
    console.log(`  [${isBookmarked ? 'PASS' : 'FAIL'}] Bookmark Toggle & LocalStorage: ${isBookmarked}`);
    testReport.features.push({ name: 'Bookmarking Persistence', pass: isBookmarked });

    // 1.9 Study Note Save
    const addNoteBtn = sec43aCard.locator('button').filter({ hasText: '+ Add Study Note' });
    if (await addNoteBtn.count() > 0) {
      await addNoteBtn.click();
      await page.waitForTimeout(100);
      await sec43aCard.locator('.section-notes-textarea').fill('Important civil corporate liability note.');
      await sec43aCard.locator('button').filter({ hasText: 'Save Note' }).click();
      await page.waitForTimeout(200);
    }
    const noteSaved = await page.evaluate(() => {
      const notes = JSON.parse(localStorage.getItem('law_notes') || '{}');
      return notes['Section 43A'] === 'Important civil corporate liability note.';
    });
    console.log(`  [${noteSaved ? 'PASS' : 'FAIL'}] Private Study Note Persistence: ${noteSaved}`);
    testReport.features.push({ name: 'Study Note Persistence', pass: noteSaved });

    // 1.10 Quick Law Check Quiz
    const quizCard = page.locator('#section-card-Section-43A .section-quiz-container');
    const quizOption = quizCard.locator('.section-quiz-opt-btn').nth(1); // Option index 1 is correct
    await quizOption.click();
    await page.waitForTimeout(100);
    await quizCard.locator('.section-quiz-submit-btn').click();
    await page.waitForTimeout(200);
    const feedbackText = await quizCard.locator('.section-quiz-feedback').textContent();
    const quizOk = feedbackText && feedbackText.includes('Correct Understanding');
    console.log(`  [${quizOk ? 'PASS' : 'FAIL'}] Quick Law Check Quiz Validation: ${quizOk}`);
    testReport.features.push({ name: 'Quick Law Check Quiz Validation', pass: Boolean(quizOk) });

    // 1.11 Desktop Horizontal Overflow Check
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`  [${!desktopOverflow ? 'PASS' : 'FAIL'}] Desktop 1440px 0px Horizontal Overflow: ${!desktopOverflow}`);
    testReport.viewports.push({ name: 'Desktop 1440x900', overflowFree: !desktopOverflow });

    // Screenshot 1: Desktop 1440px
    const shot1 = path.join(SCREENSHOT_DIR, '01_laws_desktop_1440.png');
    await page.screenshot({ path: shot1, fullPage: true });
    testReport.screenshots.push({ name: 'Desktop 1440px Full Page', path: shot1 });

    // -----------------------------------------------------------------------
    // PART 2: LAPTOP VIEWPORT (1280x800)
    // -----------------------------------------------------------------------
    console.log('\n[TEST 2] Laptop Viewport Verification (1280x800):');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);
    const laptopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  [${!laptopOverflow ? 'PASS' : 'FAIL'}] Laptop 1280px 0px Horizontal Overflow: ${!laptopOverflow}`);
    testReport.viewports.push({ name: 'Laptop 1280x800', overflowFree: !laptopOverflow });

    const shot2 = path.join(SCREENSHOT_DIR, '02_laws_laptop_1280.png');
    await page.screenshot({ path: shot2 });
    testReport.screenshots.push({ name: 'Laptop 1280px Viewport', path: shot2 });

    // -----------------------------------------------------------------------
    // PART 3: TABLET VIEWPORT (768x1024)
    // -----------------------------------------------------------------------
    console.log('\n[TEST 3] Tablet Viewport Verification (768x1024):');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const mobileDrawerVisible = await page.locator('.laws-mobile-jump-drawer').count() > 0;
    console.log(`  [${!tabletOverflow ? 'PASS' : 'FAIL'}] Tablet 768px 0px Horizontal Overflow: ${!tabletOverflow}`);
    console.log(`  [${mobileDrawerVisible ? 'PASS' : 'FAIL'}] Tablet Mobile Jump Drawer Active: ${mobileDrawerVisible}`);
    testReport.viewports.push({ name: 'Tablet 768x1024', overflowFree: !tabletOverflow && mobileDrawerVisible });

    const shot3 = path.join(SCREENSHOT_DIR, '03_laws_tablet_768.png');
    await page.screenshot({ path: shot3 });
    testReport.screenshots.push({ name: 'Tablet 768px Viewport', path: shot3 });

    // -----------------------------------------------------------------------
    // PART 4: MOBILE VIEWPORT (390x844)
    // -----------------------------------------------------------------------
    console.log('\n[TEST 4] Mobile Viewport Verification (390x844):');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  [${!mobileOverflow ? 'PASS' : 'FAIL'}] Mobile 390px 0px Horizontal Overflow: ${!mobileOverflow}`);
    testReport.viewports.push({ name: 'Mobile 390x844', overflowFree: !mobileOverflow });

    // Verify Ctrl+K is hidden on mobile
    const shortcutHidden = await page.evaluate(() => {
      const el = document.querySelector('.portal-search-shortcut-hint');
      if (!el) return true;
      const style = window.getComputedStyle(el);
      return style.display === 'none';
    });
    console.log(`  [${shortcutHidden ? 'PASS' : 'FAIL'}] Mobile Ctrl+K Shortcut Hidden: ${shortcutHidden}`);
    testReport.features.push({ name: 'Mobile Ctrl+K Shortcut Hidden', pass: shortcutHidden });

    const shot4 = path.join(SCREENSHOT_DIR, '04_laws_mobile_390.png');
    await page.screenshot({ path: shot4, fullPage: true });
    testReport.screenshots.push({ name: 'Mobile 390px Full Page', path: shot4 });

    // -----------------------------------------------------------------------
    // PART 5: NARROW MOBILE (375x667)
    // -----------------------------------------------------------------------
    console.log('\n[TEST 5] Narrow Mobile Verification (375x667):');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const narrowOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  [${!narrowOverflow ? 'PASS' : 'FAIL'}] Narrow Mobile 375px 0px Horizontal Overflow: ${!narrowOverflow}`);
    testReport.viewports.push({ name: 'Narrow Mobile 375x667', overflowFree: !narrowOverflow });

    const shot5 = path.join(SCREENSHOT_DIR, '05_laws_narrow_mobile_375.png');
    await page.screenshot({ path: shot5 });
    testReport.screenshots.push({ name: 'Narrow Mobile 375px Viewport', path: shot5 });

    console.log('\n======================================================================');
    console.log('BROWSER VERIFICATION SUMMARY:');
    const allPassed = testReport.features.every(f => f.pass) && testReport.viewports.every(v => v.overflowFree);
    console.log(`Overall Result: ${allPassed ? 'ALL VERIFICATIONS PASSED' : 'SOME CHECKS FAILED'}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('======================================================================');

    return { success: allPassed, testReport };
  } finally {
    await browser.close();
    server.close();
  }
}

runLawsVerification().then(res => {
  if (!res.success) process.exit(1);
}).catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});

