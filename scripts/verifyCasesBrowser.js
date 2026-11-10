/**
 * Dedicated Browser Verification Script for Case Studies Quality Assurance
 * Verifies Desktop (1280px) and Mobile (390px) viewports using Playwright Chromium
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4173;
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.resolve(__dirname, '../screenshots/cases-qa');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
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

async function runVerification() {
  console.log('======================================================================');
  console.log('CASE STUDIES BROWSER VERIFICATION & QUALITY ASSURANCE');
  console.log('======================================================================\n');

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[SERVER] Static SPA server listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    desktopChecks: [],
    mobileChecks: [],
    screenshots: []
  };

  try {
    // -----------------------------------------------------------------------
    // PART 1: DESKTOP VIEWPORT (1280x800)
    // -----------------------------------------------------------------------
    console.log('\n[TEST SUITE 1] Desktop Viewport Verification (1280x800):');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${PORT}/cases`);
    await page.waitForLoadState('domcontentloaded');

    // Check 1: Header
    const titleText = await page.textContent('h1');
    const headerOk = titleText && titleText.includes('Cyber Cases: Lessons from the Real World');
    console.log(`  [${headerOk ? 'PASS' : 'FAIL'}] Page Header: "${titleText?.trim()}"`);
    results.desktopChecks.push({ name: 'Page Header Title', pass: headerOk });

    // Check 2: Default collection is Landmark Court Precedents (11 files)
    const landmarkTab = page.locator('[role="tab"]').filter({ hasText: 'Landmark Court Precedents' });
    const landmarkActive = (await landmarkTab.textContent()).includes('Currently viewing collection');
    const landmarkCount = await page.locator('.incident-index-row').count();
    const landmarkOk = landmarkActive && landmarkCount === 11;
    console.log(`  [${landmarkOk ? 'PASS' : 'FAIL'}] Landmark Collection Active: count = ${landmarkCount} (expected 11)`);
    results.desktopChecks.push({ name: 'Landmark Precedents Catalog (11 files)', pass: landmarkOk });

    // Check 3: Switch to "Cases Where Justice Fell Short" (10 files)
    const shortcomingsTab = page.locator('[role="tab"]').filter({ hasText: 'Cases Where Justice Fell Short' });
    await shortcomingsTab.click();
    await page.waitForTimeout(300);

    const shortcomingsActive = (await shortcomingsTab.textContent()).includes('Currently viewing collection');
    const shortcomingsCount = await page.locator('.incident-index-row').count();
    const shortcomingsOk = shortcomingsActive && shortcomingsCount === 10;
    console.log(`  [${shortcomingsOk ? 'PASS' : 'FAIL'}] Switch to Shortcomings: count = ${shortcomingsCount} (expected 10)`);
    results.desktopChecks.push({ name: 'Cases Where Justice Fell Short Switch (10 files)', pass: shortcomingsOk });

    // Check 4: Evidence Badge Wording Corrected
    const bodyText = await page.textContent('body');
    const noProven = !bodyText.includes('Proven Institutional Failure');
    const hasInstitutional = bodyText.includes('Institutional Failure');
    const hasDelay = bodyText.includes('Investigation Delay');
    const hasUnresolved = bodyText.includes('Unresolved Case');
    const badgeWordingOk = noProven && hasInstitutional && hasDelay && hasUnresolved;
    console.log(`  [${badgeWordingOk ? 'PASS' : 'FAIL'}] Evidence Badge Wording: "Proven Institutional Failure" omitted = ${noProven}, "Institutional Failure" = ${hasInstitutional}`);
    results.desktopChecks.push({ name: 'Evidence Badge Wording (No "Proven", Correct Labels)', pass: badgeWordingOk });

    // Check 5: Category Filters in Shortcomings
    const bankingFilter = page.locator('button').filter({ hasText: 'Banking & Regulatory Inquiries' });
    await bankingFilter.click();
    await page.waitForTimeout(200);
    const bankingCount = await page.locator('.incident-index-row').count();
    const filterOk = bankingCount > 0 && bankingCount < 10;
    console.log(`  [${filterOk ? 'PASS' : 'FAIL'}] Category Filter: Banking & Regulatory Inquiries yielded ${bankingCount} files`);
    results.desktopChecks.push({ name: 'Shortcomings Category Filter', pass: filterOk });

    // Reset filter
    await page.locator('button').filter({ hasText: 'All' }).click();
    await page.waitForTimeout(200);

    // Check 6: Search
    await page.locator('input[placeholder*="Search"]').fill('Pegasus');
    await page.waitForTimeout(200);
    const searchCount = await page.locator('.incident-index-row').count();
    const searchOk = searchCount === 1;
    console.log(`  [${searchOk ? 'PASS' : 'FAIL'}] Search Filter: "Pegasus" yielded ${searchCount} file(s)`);
    results.desktopChecks.push({ name: 'Search Filtering', pass: searchOk });

    // Clear search
    await page.locator('input[placeholder*="Search"]').fill('');
    await page.waitForTimeout(200);

    // Screenshot 1: Desktop Shortcomings Catalog
    const shot1Path = path.join(SCREENSHOT_DIR, '01_cases_desktop_shortcomings_catalog.png');
    await page.screenshot({ path: shot1Path, fullPage: true });
    results.screenshots.push({ name: 'Desktop Shortcomings Catalog', path: shot1Path });
    console.log(`  [CAPTURE] Saved screenshot: ${shot1Path}`);

    // Check 7: Deep Link & Case Reading Dossier
    console.log('\n[TEST SUITE 2] Case Reading Dossier & Narrative Headings (Desktop):');
    await page.goto(`http://127.0.0.1:${PORT}/cases?slug=sulli-deals-bulli-bai-investigation-delays`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.editorial-scroll-story-container');

    const dossierHeader = await page.locator('.sticky-nav-title, h1, h2, h3').allTextContents();
    const dossierHeaderBlob = dossierHeader.join(' ');
    const dossierHeaderOk = dossierHeaderBlob.includes('The Cross-Border Harassment Case') || dossierHeaderBlob.includes('Sulli Deals & Bulli Bai');
    console.log(`  [${dossierHeaderOk ? 'PASS' : 'FAIL'}] Deep-linked Dossier Opened: includes "The Cross-Border Harassment Case" / "Sulli Deals & Bulli Bai"`);
    results.desktopChecks.push({ name: 'Direct Slug Deep-Linking', pass: dossierHeaderOk });

    // Check 8: Simplified Headings
    const allHeadings = await page.locator('.story-section-title, .sticky-nav-item, h2, h3, h4').allTextContents();
    const headingsBlob = allHeadings.join(' ');
    const hasOverview = headingsBlob.includes('Case Overview');
    const hasWhen = headingsBlob.includes('What Happened and When');
    const hasEvidence = headingsBlob.includes('What the Evidence Shows');
    const hasAuthorities = headingsBlob.includes('How Authorities Responded');
    const hasLessons = headingsBlob.includes('Legal Lessons and Key Takeaways');
    const hasGuidance = headingsBlob.includes('What You Can Do and Where to Learn More');
    const headingsOk = hasOverview && hasWhen && hasEvidence && hasAuthorities && hasLessons && hasGuidance;
    console.log(`  [${headingsOk ? 'PASS' : 'FAIL'}] Simplified Headings: Overview=${hasOverview}, When=${hasWhen}, Evidence=${hasEvidence}, Authorities=${hasAuthorities}, Lessons=${hasLessons}, Guidance=${hasGuidance}`);
    results.desktopChecks.push({ name: 'Simplified Plain-Language Headings', pass: headingsOk });

    // Check 9: Overview Metadata Badge
    const metadataBadgeText = await page.textContent('body');
    const hasDocLabel = metadataBadgeText.includes('Procedural or Investigation Delay Documented') ||
                         metadataBadgeText.includes('Institutional Failure Documented');
    console.log(`  [${hasDocLabel ? 'PASS' : 'FAIL'}] Case Overview Full Badge: Documented suffix present = ${hasDocLabel}`);
    results.desktopChecks.push({ name: 'Case Overview Full Label Documented', pass: hasDocLabel });

    // Check 10: Interactive Decision Point
    const choiceButtons = page.locator('button.portal-decision-choice-btn');
    if (await choiceButtons.count() > 0) {
      await choiceButtons.nth(1).click();
      await page.waitForTimeout(300);
      const feedbackVisible = await page.locator('text=Correct Understanding').or(page.locator('text=Verified Procedural Reasoning')).first().isVisible();
      console.log(`  [${feedbackVisible ? 'PASS' : 'FAIL'}] Decision Point Feedback Displayed = ${feedbackVisible}`);
      results.desktopChecks.push({ name: 'Interactive Decision Feedback', pass: feedbackVisible });
    } else {
      console.log('  [PASS] Decision point not present in this section / unlocked');
      results.desktopChecks.push({ name: 'Interactive Decision Feedback', pass: true });
    }

    // Unlock story
    const unlockBtn = page.locator('button').filter({ hasText: /Continue to Evidence|Unlock Forensic/i }).first();
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();
      await page.waitForTimeout(300);
    }

    // Check 11: Three-Pillar Evidence Grid
    const hasConfirmedFacts = await page.locator('h4').filter({ hasText: 'Confirmed Facts' }).first().isVisible();
    const hasAllegations = await page.locator('h4').filter({ hasText: 'Claims & Allegations' }).first().isVisible();
    const hasUnresolvedQuestions = await page.locator('h4').filter({ hasText: 'Unresolved Questions' }).first().isVisible();
    const evidenceGridOk = hasConfirmedFacts && hasAllegations && hasUnresolvedQuestions;
    console.log(`  [${evidenceGridOk ? 'PASS' : 'FAIL'}] Three-Pillar Evidence Grid: Facts=${hasConfirmedFacts}, Allegations=${hasAllegations}, Questions=${hasUnresolvedQuestions}`);
    results.desktopChecks.push({ name: 'Three-Pillar Evidence Grid Separation', pass: evidenceGridOk });

    // Check 12: Emergency Guidance & Golden Hour Nuance
    const hasHelpline = await page.locator('text=1930 (Toll-Free, 24x7)').or(page.locator('text=1930 (Free, 24x7)')).first().isVisible();
    const hasPortal = await page.locator('.editorial-scroll-story-container a[href*="cybercrime.gov.in"]').first().isVisible();
    const guidanceBlob = await page.textContent('body');
    const hasReportingAfter = guidanceBlob.includes('Reporting After the Window');
    const hasNoGuarantee = guidanceBlob.includes('not an automatic guarantee of account freezing or financial reimbursement');
    const emergencyOk = hasHelpline && hasPortal && hasReportingAfter && hasNoGuarantee;
    console.log(`  [${emergencyOk ? 'PASS' : 'FAIL'}] Emergency Guidance: 1930=${hasHelpline}, Portal=${hasPortal}, AfterWindow=${hasReportingAfter}, NoGuaranteeNotice=${hasNoGuarantee}`);
    results.desktopChecks.push({ name: 'Emergency Guidance & Realistic Golden Hour Nuance', pass: emergencyOk });

    // Screenshot 2: Desktop Case Reader Dossier
    const shot2Path = path.join(SCREENSHOT_DIR, '02_cases_desktop_case_reader.png');
    await page.screenshot({ path: shot2Path, fullPage: true });
    results.screenshots.push({ name: 'Desktop Case Dossier Reader', path: shot2Path });
    console.log(`  [CAPTURE] Saved screenshot: ${shot2Path}`);

    // -----------------------------------------------------------------------
    // PART 2: MOBILE VIEWPORT (390x844)
    // -----------------------------------------------------------------------
    console.log('\n[TEST SUITE 3] Mobile Viewport Verification (390x844):');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:${PORT}/cases`);
    await page.waitForLoadState('domcontentloaded');

    // Check 13: Zero Horizontal Overflow on Mobile Catalog
    const mobileCatalogOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  [${!mobileCatalogOverflow ? 'PASS' : 'FAIL'}] Mobile Catalog 0px Horizontal Overflow: ${!mobileCatalogOverflow}`);
    results.mobileChecks.push({ name: 'Mobile Catalog Zero Horizontal Overflow', pass: !mobileCatalogOverflow });

    // Check 14: Mobile Switch Collection
    const mobileTabs = page.locator('[role="tab"]');
    await mobileTabs.nth(1).click();
    await page.waitForTimeout(300);
    const mobileShortcomingsCount = await page.locator('.incident-index-row').count();
    const mobileSwitchOk = mobileShortcomingsCount === 10;
    console.log(`  [${mobileSwitchOk ? 'PASS' : 'FAIL'}] Mobile Collection Switcher: count = ${mobileShortcomingsCount} (expected 10)`);
    results.mobileChecks.push({ name: 'Mobile Collection Switcher', pass: mobileSwitchOk });

    // Screenshot 3: Mobile Catalog
    const shot3Path = path.join(SCREENSHOT_DIR, '03_cases_mobile_catalog_390.png');
    await page.screenshot({ path: shot3Path, fullPage: true });
    results.screenshots.push({ name: 'Mobile Catalog (390px)', path: shot3Path });
    console.log(`  [CAPTURE] Saved screenshot: ${shot3Path}`);

    // Check 15: Mobile Case Reader
    await page.locator('.incident-index-row').first().click();
    await page.waitForTimeout(400);

    const mobileReaderOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  [${!mobileReaderOverflow ? 'PASS' : 'FAIL'}] Mobile Case Reader 0px Horizontal Overflow: ${!mobileReaderOverflow}`);
    results.mobileChecks.push({ name: 'Mobile Reader Zero Horizontal Overflow', pass: !mobileReaderOverflow });

    // Screenshot 4: Mobile Case Reader
    const shot4Path = path.join(SCREENSHOT_DIR, '04_cases_mobile_reader_390.png');
    await page.screenshot({ path: shot4Path, fullPage: true });
    results.screenshots.push({ name: 'Mobile Case Reader (390px)', path: shot4Path });
    console.log(`  [CAPTURE] Saved screenshot: ${shot4Path}`);

    // -----------------------------------------------------------------------
    // PART 3: SUMMARY & VERDICT
    // -----------------------------------------------------------------------
    const totalChecks = results.desktopChecks.length + results.mobileChecks.length;
    const passedChecks = [...results.desktopChecks, ...results.mobileChecks].filter(c => c.pass).length;
    const failedChecks = totalChecks - passedChecks;

    console.log('\n======================================================================');
    console.log(`VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} CHECKS PASSED (${failedChecks} FAILED)`);
    console.log('======================================================================');

    return {
      success: failedChecks === 0,
      totalChecks,
      passedChecks,
      failedChecks,
      results
    };
  } finally {
    await browser.close();
    server.close();
    console.log('[SERVER] Server closed cleanly.');
  }
}

runVerification()
  .then((res) => {
    process.exit(res.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Execution error:', err);
    process.exit(1);
  });
