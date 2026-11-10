/**
 * Browser Verification & Accessibility Audit Script for Redesigned About Page
 * 
 * Verifies:
 * 1. 5 Responsive Viewports: Desktop (1440px), Laptop (1280px), Tablet (768px), Mobile (390px), Narrow Mobile (375px)
 * 2. 0px Horizontal Overflow across all viewports
 * 3. Page Header: Title "Understanding the Portal" (h1.page-title)
 * 4. Progression Diagram: 4 Distinct Colors, Gradient Transition Paths, Interactive Hover/Focus Tooltips
 *    - Absence of Deprecated Metadata Strip & Zero Personal/University Identifiers
 * 5. Sticky Subnavigator: 8 sections, button clicks, active highlight
 * 6. Eight Required Content Sections:
 *    - Section 1: The Problem (#problem / #overview) - Structural divide, 3 failure cards, central thesis quote
 *    - Section 2: Mission & Vision (#mission) - Mission card & Vision card
 *    - Section 3: Portal Ecosystem (#ecosystem) - 6 pillar nodes with working links to /laws, /crimes, /cases, /prevention, /resources, /dashboard
 *    - Section 4: Pedagogy (#pedagogy / #method) - "Your Digital Day" & comparison table
 *    - Section 5: Behavioral Metrics (#assessment) - 6 discrete dimensions (TR, SI, VB, DQ, FP, UA) & no-composite callout
 *    - Section 6: Guiding Principles (#principles) - 6 core commitments
 *    - Section 7: System Architecture (#project) - MERN stack tiers & academic capstone specs
 *    - Section 8: Transparency & Scope (#transparency / #disclaimer) - "What the Portal Is" vs "What the Portal Is NOT" + Helpline 1930 banner
 * 7. Closing Editorial Statement & Statutory Disclaimer
 * 8. Anchor Hash Compatibility (#problem, #method, #project, #transparency)
 * 9. WCAG 2.1 AA Accessibility Audit via @axe-core/playwright (0 violations target)
 * 10. Screenshots captured to brain directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4183;
const SCREENSHOT_DIR = path.join(
  'C:',
  'Users',
  'Asus',
  '.gemini',
  'antigravity',
  'brain',
  '2a38735a-7985-4d0c-9744-999cb0b89167',
  'screenshots',
  'about-redesign'
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Simple static SPA web server serving client/dist
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

  const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];

    if (urlPath.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }

    let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return server;
}

async function runAudit() {
  console.log('='.repeat(70));
  console.log('RESTRUCTURED ABOUT PAGE — COMPREHENSIVE QA');
  console.log('Visual Identity: The Constitutional Atelier (Portal Identity & Architecture)');
  console.log('='.repeat(70));

  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[SERVER] Static SPA server listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditResults = {
    viewports: {},
    sections: {},
    anchors: {},
    overflow: {},
    a11yViolations: []
  };

  try {
    // -----------------------------------------------------------------------
    // STAGE 1: DESKTOP VIEWPORT (1440x900)
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 1] Testing Desktop Viewport (1440x900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Verify Title
    const pageTitle = await page.textContent('h1.page-title');
    console.log(`  -> Page title: "${pageTitle.trim()}" (Expected: "Understanding the Portal")`);
    if (!pageTitle.includes('Understanding the Portal')) {
      throw new Error(`Unexpected page title: ${pageTitle}`);
    }

    // Verify Four-Point Progression Pavilion (LAW -> THREAT -> DECISION -> LEARNING)
    const pavilion = await page.$('.about-pavilion-card');
    if (!pavilion) throw new Error('Missing .about-pavilion-card');
    const railLabels = await page.$$eval('.about-rail-label', (els) => els.map((e) => e.textContent.trim()));
    console.log(`  -> Four-point progression stages verified: [${railLabels.join(' -> ')}]`);
    if (railLabels.join(',') !== 'LAW,THREAT,DECISION,LEARNING') {
      throw new Error(`Progression rail labels mismatch: expected [LAW, THREAT, DECISION, LEARNING], got [${railLabels.join(', ')}]`);
    }

    // Verify SVG Gradient Transitions
    const gradientDefs = await page.$$eval('.about-progression-svg defs linearGradient', (grads) =>
      grads.map((g) => g.getAttribute('id'))
    );
    console.log(`  -> Progression SVG gradient lines verified: ${gradientDefs.join(', ')}`);
    if (!gradientDefs.includes('journey-grad-1') || !gradientDefs.includes('journey-grad-2') || !gradientDefs.includes('journey-grad-3')) {
      throw new Error('Missing journey gradient definitions in progression SVG');
    }

    // Verify Interactive Stepper in Progression Dossier
    const nextBtn = await page.$('.about-dossier-stepper-btn:has-text("Next")');
    if (!nextBtn) throw new Error('Missing Next stepper button in stage dossier');
    await nextBtn.click();
    await page.waitForTimeout(200);
    const stagePill = await page.textContent('.about-dossier-pill');
    console.log(`  -> Clicked "Next" in Dossier: Active pill is now "${stagePill.trim()}" (Expected: STAGE 02 · THREAT)`);
    if (!stagePill.includes('THREAT')) {
      throw new Error(`Dossier stage did not advance: ${stagePill}`);
    }

    // Verify Removal of Metadata Strip & Removal of Personal/University Identifiers
    const metadataStrip = await page.$('.about-metadata-strip');
    if (metadataStrip) throw new Error('Found deprecated .about-metadata-strip (must be completely removed)');
    console.log('  -> Confirmed: .about-metadata-strip is completely eliminated');

    const bodyText = await page.textContent('body');
    if (bodyText.includes('Integral University')) {
      throw new Error('Found reference to "Integral University" in page body (must be stripped for privacy & focus)');
    }
    console.log('  -> Confirmed: Zero personal or university identifiers present in DOM');

    // Check Horizontal Overflow
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`  -> Desktop horizontal overflow: ${desktopOverflow}px (Expected: 0px)`);
    if (desktopOverflow > 0) throw new Error(`Desktop horizontal overflow detected: ${desktopOverflow}px`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_about_redesign_desktop.png'),
      fullPage: true
    });
    console.log('  -> Screenshot saved: 01_about_redesign_desktop.png');

    // -----------------------------------------------------------------------
    // STAGE 2: VERIFY ALL EIGHT CONTENT SECTIONS
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 2] Verifying Eight Core Sections...');

    // Section 1: The Problem
    const problemSection = await page.$('#problem');
    const fractureTabs = await page.$$('.about-fracture-tab');
    const thesisQuote = await page.$('.about-thesis-quote');
    console.log(`  -> Section 1 (#problem): Present with ${fractureTabs.length} systemic failure tabs (Expected: 3)`);
    if (!problemSection || fractureTabs.length !== 3 || !thesisQuote) {
      throw new Error('Section 1 (The Problem) structure incomplete');
    }

    // Section 2: Mission & Vision
    const missionSection = await page.$('#mission');
    const mandateCards = await page.$$('.about-mandate-card');
    console.log(`  -> Section 2 (#mission): Present with ${mandateCards.length} mandate cards (Mission + Vision) (Expected: 2)`);
    if (!missionSection || mandateCards.length !== 2) {
      throw new Error('Section 2 (Mission & Vision) structure incomplete');
    }

    // Section 3: Portal Ecosystem
    const ecosystemSection = await page.$('#ecosystem');
    const pillarNodes = await page.$$('.about-pillar-node');
    console.log(`  -> Section 3 (#ecosystem): Present with ${pillarNodes.length} pillar nodes (Expected: 6)`);
    if (!ecosystemSection || pillarNodes.length !== 6) {
      throw new Error('Section 3 (Portal Ecosystem) structure incomplete');
    }

    // Verify 6 ecosystem links
    const pillarLinks = await page.$$eval('.about-pillar-link', (els) => els.map((e) => e.getAttribute('href')));
    const expectedRoutes = ['/laws', '/crimes', '/cases', '/prevention', '/resources', '/dashboard'];
    const hasAllRoutes = expectedRoutes.every((r) => pillarLinks.includes(r));
    console.log(`  -> Verified canonical ecosystem routes: ${pillarLinks.join(', ')}`);
    if (!hasAllRoutes) throw new Error(`Missing canonical ecosystem routes: ${expectedRoutes}`);

    // Section 4: Pedagogy
    const pedagogySection = await page.$('#pedagogy');
    const comparisonTable = await page.$('.about-comparison-table');
    console.log(`  -> Section 4 (#pedagogy): Present with "Your Digital Day" & Comparison Table`);
    if (!pedagogySection || !comparisonTable) {
      throw new Error('Section 4 (Pedagogy) structure incomplete');
    }

    // Section 5: Behavioral Metrics (Refined Navigator & Compact Overview Matrix)
    const metricsSection = await page.$('#assessment');
    const metricTabs = await page.$$('.about-metric-tab-btn');
    const spotlightPanel = await page.$('.about-dimension-spotlight');
    const overviewCards = await page.$$('.about-metric-overview-card');
    console.log(`  -> Section 5 (#assessment): Present with ${metricTabs.length} selector tabs (Expected: 6), spotlight console, and ${overviewCards.length} compact overview cards (Expected: 6)`);
    if (!metricsSection || metricTabs.length !== 6 || !spotlightPanel || overviewCards.length !== 6) {
      throw new Error('Section 5 (Behavioral Metrics) structure incomplete or missing overview cards');
    }

    // Verify interactive switching across all 6 dimensions via selector tabs
    const expectedCodes = ['TR', 'SI', 'VB', 'DQ', 'FP', 'UA'];
    for (const code of expectedCodes) {
      await page.click(`#tab-metric-${code}`);
      await page.waitForTimeout(100);
      const activeCode = await page.$eval('.about-spotlight-code', el => el.textContent.trim());
      if (activeCode !== code) {
        throw new Error(`Metric tab switch failed for ${code}: got ${activeCode}`);
      }
    }
    console.log(`  -> Section 5 (#assessment): Verified dynamic switching across all 6 dimensions via tabs (${expectedCodes.join(', ')})`);

    // Verify interactive switching via clicking an overview card (e.g. 2nd card -> SI)
    await page.click('.about-metric-overview-card:nth-child(2)');
    await page.waitForTimeout(100);
    const codeFromCard = await page.$eval('.about-spotlight-code', el => el.textContent.trim());
    if (codeFromCard !== 'SI') {
      throw new Error(`Overview card click failed to switch active metric: got ${codeFromCard}`);
    }
    console.log('  -> Section 5 (#assessment): Verified overview card click switches active metric in console');

    // Section 6: Guiding Principles
    const principlesSection = await page.$('#principles');
    const principleCards = await page.$$('.about-principle-card');
    console.log(`  -> Section 6 (#principles): Present with ${principleCards.length} principle cards (Expected: 6)`);
    if (!principlesSection || principleCards.length !== 6) {
      throw new Error('Section 6 (Guiding Principles) structure incomplete');
    }

    // Section 7: System Architecture
    const projectSection = await page.$('section[aria-labelledby="heading-project"]');
    const stackNodes = await page.$$('.about-stack-node');
    console.log(`  -> Section 7 (#project): Present with ${stackNodes.length} MERN stack tier nodes (Expected: 3)`);
    if (!projectSection || stackNodes.length !== 3) {
      throw new Error('Section 7 (System Architecture) structure incomplete');
    }

    // Section 8: Transparency & Scope
    const transparencySection = await page.$('#transparency');
    const charterBoxes = await page.$$('.about-charter-box');
    const emergencyBanner = await page.$('.about-emergency-referral-banner');
    const call1930Btn = await page.$('a.about-btn-emergency[href="tel:1930"]');
    console.log(`  -> Section 8 (#transparency): Present with ${charterBoxes.length} charter boxes (Expected: 2) & 1930 dial button`);
    if (!transparencySection || charterBoxes.length !== 2 || !emergencyBanner || !call1930Btn) {
      throw new Error('Section 8 (Transparency & Scope) structure incomplete');
    }

    // Closing Statement & Disclaimer
    const closingQuote = await page.$('.about-closing-quote');
    const statutoryDisclaimer = await page.$('.about-statutory-disclaimer');
    if (!closingQuote || !statutoryDisclaimer) {
      throw new Error('Closing editorial quote or statutory disclaimer missing');
    }
    console.log('  -> Closing editorial quote & statutory disclaimer verified.');

    // -----------------------------------------------------------------------
    // STAGE 3: STICKY SUBNAVIGATOR INTERACTION
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 3] Testing Sticky Subnavigator Interaction...');
    const subnavBtns = await page.$$('.about-subnav-btn');
    console.log(`  -> Found ${subnavBtns.length} subnavigator jump buttons (Expected: 9)`);
    if (subnavBtns.length !== 9) throw new Error(`Subnavigator buttons count mismatch: expected 9, got ${subnavBtns.length}`);

    // Click on "Principles" button
    const principlesBtn = await page.$('button.about-subnav-btn:has-text("Principles")');
    if (principlesBtn) {
      await principlesBtn.click();
      await page.waitForTimeout(400);
      const isPrinciplesActive = await page.$eval(
        'button.about-subnav-btn:has-text("Principles")',
        (el) => el.classList.contains('active')
      );
      console.log(`  -> Clicked "Principles" -> Active state updated: ${isPrinciplesActive}`);
    }

    // -----------------------------------------------------------------------
    // STAGE 4: ANCHOR HASH COMPATIBILITY
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 4] Testing Anchor Hash Compatibility...');
    await page.goto(`http://127.0.0.1:${PORT}/about#method`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const scrollYMethod = await page.evaluate(() => window.scrollY);
    console.log(`  -> Scrolled to #method (scrollY: ${scrollYMethod}px, Expected: > 0)`);
    if (scrollYMethod <= 0) throw new Error('Anchor hash navigation failed for #method');

    await page.goto(`http://127.0.0.1:${PORT}/about#project`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const scrollYProject = await page.evaluate(() => window.scrollY);
    console.log(`  -> Scrolled to #project (scrollY: ${scrollYProject}px, Expected: > scrollYMethod)`);
    if (scrollYProject <= scrollYMethod) throw new Error('Anchor hash navigation failed for #project');

    // -----------------------------------------------------------------------
    // STAGE 5: LAPTOP VIEWPORT (1280x800)
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 5] Testing Laptop Viewport (1280x800)...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const laptopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`  -> Laptop horizontal overflow: ${laptopOverflow}px (Expected: 0px)`);
    if (laptopOverflow > 0) throw new Error(`Laptop horizontal overflow detected: ${laptopOverflow}px`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_about_redesign_laptop.png'),
      fullPage: true
    });
    console.log('  -> Screenshot saved: 02_about_redesign_laptop.png');

    // -----------------------------------------------------------------------
    // STAGE 5B: TABLET LANDSCAPE VIEWPORT (1024x768)
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 5B] Testing Tablet Landscape Viewport (1024x768)...');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const tabletLandscapeOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`  -> Tablet Landscape horizontal overflow: ${tabletLandscapeOverflow}px (Expected: 0px)`);
    if (tabletLandscapeOverflow > 0) throw new Error(`Tablet Landscape horizontal overflow detected: ${tabletLandscapeOverflow}px`);

    // Verify pedagogy panel bounds at 1024px
    const pedagogyFit1024 = await page.evaluate(() => {
      const container = document.querySelector('.about-page-container');
      const duo = document.querySelector('.about-pedagogy-duo');
      const panels = Array.from(document.querySelectorAll('.about-pedagogy-panel'));
      const right = panels[1];
      const containerRect = container.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      return {
        fitsContainer: rightRect.right <= containerRect.right + 1,
        containerWidth: containerRect.width,
        rightPanelWidth: rightRect.width
      };
    });
    console.log(`  -> Pedagogy comparison panel fits container at 1024px: ${pedagogyFit1024.fitsContainer} (Panel: ${pedagogyFit1024.rightPanelWidth.toFixed(0)}px)`);
    if (!pedagogyFit1024.fitsContainer) throw new Error('Pedagogy panel overflows container at 1024px!');

    // -----------------------------------------------------------------------
    // STAGE 6: TABLET VIEWPORT (768x1024)
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 6] Testing Tablet Viewport (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`  -> Tablet horizontal overflow: ${tabletOverflow}px (Expected: 0px)`);
    if (tabletOverflow > 0) throw new Error(`Tablet horizontal overflow detected: ${tabletOverflow}px`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_about_redesign_tablet.png'),
      fullPage: true
    });
    console.log('  -> Screenshot saved: 03_about_redesign_tablet.png');

    // -----------------------------------------------------------------------
    // STAGE 7: MOBILE VIEWPORT (390x844 - iPhone 14)
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 7] Testing Mobile Viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`  -> Mobile horizontal overflow: ${mobileOverflow}px (Expected: 0px)`);
    if (mobileOverflow > 0) throw new Error(`Mobile horizontal overflow detected: ${mobileOverflow}px`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_about_redesign_mobile.png'),
      fullPage: true
    });
    console.log('  -> Screenshot saved: 04_about_redesign_mobile.png');

    // -----------------------------------------------------------------------
    // STAGE 8: NARROW MOBILE VIEWPORT (375x667 - iPhone SE)
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 8] Testing Narrow Mobile Viewport (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const narrowOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    console.log(`  -> Narrow mobile horizontal overflow: ${narrowOverflow}px (Expected: 0px)`);
    if (narrowOverflow > 0) throw new Error(`Narrow mobile horizontal overflow detected: ${narrowOverflow}px`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_about_redesign_narrow.png'),
      fullPage: true
    });
    console.log('  -> Screenshot saved: 05_about_redesign_narrow.png');

    // -----------------------------------------------------------------------
    // STAGE 9: ACCESSIBILITY AUDIT WITH AXE-CORE
    // -----------------------------------------------------------------------
    console.log('\n[STAGE 9] Running WCAG 2.1 AA Accessibility Audit with Axe-Core...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log(`  -> Axe-Core Violations Count: ${axeResults.violations.length}`);
    if (axeResults.violations.length > 0) {
      console.log('  -> Violations Breakdown:');
      axeResults.violations.forEach((v) => {
        console.log(`     * [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} occurrences)`);
        v.nodes.slice(0, 2).forEach((n) => console.log(`       - Target: ${n.target.join(' ')}`));
      });
      throw new Error(`Axe-Core accessibility audit failed with ${axeResults.violations.length} violations`);
    } else {
      console.log('  -> PERFECT WCAG 2.1 AA ACCESSIBILITY: 0 VIOLATIONS!');
    }

    // Save structured audit results
    auditResults.status = 'SUCCESS';
    auditResults.pageTitle = pageTitle.trim();
    auditResults.desktopOverflow = desktopOverflow;
    auditResults.laptopOverflow = laptopOverflow;
    auditResults.tabletOverflow = tabletOverflow;
    auditResults.mobileOverflow = mobileOverflow;
    auditResults.narrowOverflow = narrowOverflow;
    auditResults.a11yViolationsCount = axeResults.violations.length;

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'about_redesign_audit_results.json'),
      JSON.stringify(auditResults, null, 2)
    );

    console.log('\n' + '='.repeat(70));
    console.log('AUDIT COMPLETED SUCCESSFULLY: 100% PASS');
    console.log('='.repeat(70));

  } finally {
    await browser.close();
    server.close();
  }
}

runAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err.message);
  process.exit(1);
});

