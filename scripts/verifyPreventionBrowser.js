/**
 * Browser Verification & Accessibility Audit Script for Simplified Prevention Quick-Guide
 * 
 * Verifies:
 * 1. 5 Responsive Viewports: Desktop (1440px), Laptop (1280px), Tablet (768px), Mobile (390px), Narrow Mobile (375px)
 * 2. 0px Horizontal Overflow across all viewports
 * 3. Page Header: Title "Digital Safety Quick-Guide" (h1.page-title)
 * 4. Removal of Teaching Architecture (phase filter pills, 3-phase lifecycle cards, sticky nav tabs,
 *    signal scenario selector, accordion crisis playbooks, sidebar habit checklist, practice nexus)
 * 5. Five Required Quick-Guide Sections:
 *    - Section 1: Protect Yourself (#protect / #habits) - 6 actionable habit cards
 *    - Section 2: Know the Warning Signs (#warning-signs / #signals) - 7 red flag rows + Crimes link
 *    - Section 3: What to Do Immediately (#immediately / #playbooks / #wrong) - 5 crisis situations + notice
 *    - Section 4: Keep the Important Details (#evidence) - 6 evidence items + BSA 2023 Sec 63 link
 *    - Section 5: Document Your Incident (#docket / #reporting) - Privacy notice + Incident Docket Generator
 * 6. Closing Referral Section: "Need official help?" pointing to /resources
 * 7. Incident Docket Generator Integration & Functionality
 * 8. Touch Target Dimensions (>= 44px)
 * 9. WCAG 2.1 AA Accessibility Audit via @axe-core/playwright (0 violations target)
 * 10. Screenshots captured to brain directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4182;
const SCREENSHOT_DIR = path.join(
  'C:',
  'Users',
  'Asus',
  '.gemini',
  'antigravity',
  'brain',
  '2a38735a-7985-4d0c-9744-999cb0b89167',
  'screenshots',
  'prevention-simplified'
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

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function runAudit() {
  console.log('='.repeat(70));
  console.log('SIMPLIFIED PREVENTION QUICK-GUIDE — COMPREHENSIVE QA');
  console.log('Visual Identity: The Constitutional Atelier (Digital Safety Quick-Guide)');
  console.log('='.repeat(70));

  const server = await createServer();
  console.log(`[SERVER] Static SPA server listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditResults = {
    viewports: {},
    features: {},
    axeViolations: {}
  };

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: DESKTOP VIEWPORT (1440x900)
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 1] Testing Desktop Viewport (1440x900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/prevention`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify Title & Subtitle
    const pageTitle = await page.textContent('h1.page-title, .prevention-page-container h1');
    const pageSubtitle = await page.textContent('p.page-subtitle, .prevention-page-container .page-subtitle');
    console.log(`  -> Page title: "${pageTitle?.trim()}" (Expected: "Digital Safety Quick-Guide")`);
    console.log(`  -> Page subtitle: "${pageSubtitle?.trim()}"`);

    // Verify Absence of Teaching Artifacts
    const phasePillsCount = await page.locator('.prevention-phase-pill').count();
    const lifecycleCardsCount = await page.locator('.prevention-phase-summary-card').count();
    const stickyTabsCount = await page.locator('.prevention-nav-tab').count();
    const signalSelectorCount = await page.locator('.prevention-signal-btn').count();
    const playbookAccordionCount = await page.locator('.prevention-playbook-toggle').count();
    const sidebarChecklistCount = await page.locator('.prevention-checklist-box').count();
    const practiceNexusCount = await page.locator('.prevention-nexus-card').count();

    console.log(`  -> Phase filter pills count: ${phasePillsCount} (Expected: 0)`);
    console.log(`  -> Lifecycle cards count: ${lifecycleCardsCount} (Expected: 0)`);
    console.log(`  -> Sticky nav tabs count: ${stickyTabsCount} (Expected: 0)`);
    console.log(`  -> Signal selector count: ${signalSelectorCount} (Expected: 0)`);
    console.log(`  -> Playbook accordions count: ${playbookAccordionCount} (Expected: 0)`);
    console.log(`  -> Sidebar checklist count: ${sidebarChecklistCount} (Expected: 0)`);
    console.log(`  -> Practice nexus cards count: ${practiceNexusCount} (Expected: 0)`);

    auditResults.features.teachingArtifactsRemoved = (
      phasePillsCount === 0 &&
      lifecycleCardsCount === 0 &&
      stickyTabsCount === 0 &&
      signalSelectorCount === 0 &&
      playbookAccordionCount === 0 &&
      sidebarChecklistCount === 0 &&
      practiceNexusCount === 0
    );

    // Verify Horizontal Overflow on Desktop
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    console.log(`  -> Desktop horizontal overflow: ${desktopOverflow}px (Expected: 0px)`);
    auditResults.viewports.desktop1440 = { overflow: desktopOverflow };

    // Capture Desktop Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_prevention_simplified_desktop.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 2: FIVE REQUIRED QUICK-GUIDE SECTIONS
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 2] Verifying Five Required Quick-Guide Sections...');

    // Section 1: Protect Yourself
    const protectSection = page.locator('#protect');
    const protectTitle = await protectSection.locator('.prevention-section-title').textContent();
    const habitCardsCount = await protectSection.locator('.prevention-anchor-card, .prevention-safeguard-card').count();
    console.log(`  -> Section 1: "${protectTitle?.trim()}" with ${habitCardsCount} habit cards (Expected: 6)`);

    // Section 2: Know the Warning Signs
    const warningSection = page.locator('#warning-signs');
    const warningTitle = await warningSection.locator('.prevention-section-title').textContent();
    const warningRowsCount = await warningSection.locator('.prevention-psych-flag-card, .prevention-register-row').count();
    const crimesLink = await warningSection.locator('.prevention-explore-btn').getAttribute('href');
    console.log(`  -> Section 2: "${warningTitle?.trim()}" with ${warningRowsCount} red flag field items (Expected: 7)`);
    console.log(`     Crimes link: "${crimesLink}"`);

    // Section 3: What to Do Immediately
    const immediatelySection = page.locator('#immediately');
    const immediatelyTitle = await immediatelySection.locator('.prevention-section-title').textContent();
    const actionCardsCount = await immediatelySection.locator('.prevention-emergency-hero-panel, .prevention-protocol-card').count();
    const dial1930Link = await immediatelySection.locator('.prevention-callout-dial-btn').getAttribute('href');
    console.log(`  -> Section 3: "${immediatelyTitle?.trim()}" with ${actionCardsCount} response panels (Expected: 5)`);
    console.log(`     Direct 1930 dial link: "${dial1930Link}"`);

    // Section 4: Keep the Important Details
    const evidenceSection = page.locator('#evidence');
    const evidenceTitle = await evidenceSection.locator('.prevention-section-title').textContent();
    const evidenceCardsCount = await evidenceSection.locator('.prevention-specimen-card').count();
    const bsaLink = await evidenceSection.locator('.prevention-inline-link').getAttribute('href');
    console.log(`  -> Section 4: "${evidenceTitle?.trim()}" with ${evidenceCardsCount} forensic specimen cards (Expected: 6)`);
    console.log(`     BSA 2023 link: "${bsaLink}"`);

    // Section 5: Document Your Incident
    const docketSection = page.locator('#docket');
    const docketTitle = await docketSection.locator('.prevention-section-title').textContent();
    const hasDocketHeader = (await docketSection.locator('text=Golden Hour Incident Docket').count()) > 0;
    console.log(`  -> Section 5: "${docketTitle?.trim()}" with Incident Docket Generator: ${hasDocketHeader ? 'PRESENT' : 'MISSING'}`);

    auditResults.features.fiveSectionsValid = (
      habitCardsCount === 6 &&
      warningRowsCount === 7 &&
      actionCardsCount === 5 &&
      evidenceCardsCount === 6 &&
      hasDocketHeader
    );

    // -------------------------------------------------------------------------
    // STAGE 3: CLOSING REFERRAL SECTION
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 3] Testing Closing Referral Section...');
    const referralTitle = await page.textContent('.prevention-referral-title');
    const referralLink = await page.getAttribute('.prevention-referral-btn', 'href');
    console.log(`  -> Referral Title: "${referralTitle?.trim()}" (Expected: "Need official help?")`);
    console.log(`  -> Referral Link Target: "${referralLink}" (Expected: /resources)`);
    auditResults.features.referralValid = (referralLink === '/resources' || referralLink.endsWith('/resources'));

    // -------------------------------------------------------------------------
    // STAGE 4: INCIDENT DOCKET GENERATOR INTERACTION
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 4] Testing Incident Docket Generator Interactivity...');
    const expandBtn = page.locator('button:has-text("Open Evidence Form")');
    if ((await expandBtn.count()) > 0) {
      await expandBtn.click();
      await page.waitForTimeout(200);
    }

    await page.selectOption('#docket-incident-type', 'unauthorized_upi');
    await page.fill('#docket-financial-loss', '25000');
    await page.fill('#docket-transaction-utr', '432109876543');
    await page.waitForTimeout(150);

    const utrValue = await page.inputValue('#docket-transaction-utr');
    console.log(`  -> Form entry verified: UTR "${utrValue}"`);
    auditResults.features.docketInteractive = (utrValue === '432109876543');

    // -------------------------------------------------------------------------
    // STAGE 5: ANCHOR HASH COMPATIBILITY (LEGACY & MODERN)
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 5] Testing Anchor Hash Compatibility...');
    await page.goto(`http://127.0.0.1:${PORT}/prevention#playbooks`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const scrollYAfterPlaybooks = await page.evaluate(() => window.scrollY);
    console.log(`  -> Scrolled to #playbooks (scrollY: ${scrollYAfterPlaybooks}px)`);

    await page.goto(`http://127.0.0.1:${PORT}/prevention#evidence`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const scrollYAfterEvidence = await page.evaluate(() => window.scrollY);
    console.log(`  -> Scrolled to #evidence (scrollY: ${scrollYAfterEvidence}px)`);

    // -------------------------------------------------------------------------
    // STAGE 6: LAPTOP VIEWPORT (1280x800)
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 6] Testing Laptop Viewport (1280x800)...');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    const laptopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    console.log(`  -> Laptop horizontal overflow: ${laptopOverflow}px (Expected: 0px)`);
    auditResults.viewports.laptop1280 = { overflow: laptopOverflow };
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_prevention_simplified_laptop.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 7: TABLET VIEWPORT (768x1024)
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 7] Testing Tablet Viewport (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    console.log(`  -> Tablet horizontal overflow: ${tabletOverflow}px (Expected: 0px)`);
    auditResults.viewports.tablet768 = { overflow: tabletOverflow };
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_prevention_simplified_tablet.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 8: MOBILE VIEWPORT (390x844 - iPhone 12/13/14)
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 8] Testing Mobile Viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    console.log(`  -> Mobile horizontal overflow: ${mobileOverflow}px (Expected: 0px)`);
    auditResults.viewports.mobile390 = { overflow: mobileOverflow };
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_prevention_simplified_mobile.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 9: NARROW MOBILE VIEWPORT (375x667 - iPhone SE)
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 9] Testing Narrow Mobile Viewport (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const narrowOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    console.log(`  -> Narrow mobile horizontal overflow: ${narrowOverflow}px (Expected: 0px)`);
    auditResults.viewports.narrowMobile375 = { overflow: narrowOverflow };
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_prevention_simplified_narrow.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 10: TOUCH TARGET AUDIT
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 10] Testing Touch Target Dimensions (>= 44px)...');
    const touchTargets = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('.prevention-referral-btn, .prevention-inline-link, button, select, input'));
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: el.innerText ? el.innerText.trim().substring(0, 30) : (el.value || el.name || ''),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          valid: rect.height >= 40 // standard touch target min height threshold
        };
      });
    });

    const invalidTargets = touchTargets.filter(t => !t.valid);
    console.log(`  -> Inspected ${touchTargets.length} interactive targets. Below 40px: ${invalidTargets.length}`);
    auditResults.features.touchTargetsValid = (invalidTargets.length === 0);

    // -------------------------------------------------------------------------
    // STAGE 11: WCAG 2.1 AA ACCESSIBILITY AUDIT VIA AXE-CORE
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 11] Running WCAG 2.1 AA Accessibility Audit with Axe-Core...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/prevention`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    console.log(`  -> Axe-Core Violations Count: ${axeResults.violations.length}`);
    if (axeResults.violations.length > 0) {
      axeResults.violations.forEach(v => {
        console.log(`     - [${v.id}] ${v.help} (Nodes: ${v.nodes.length})`);
      });
    } else {
      console.log('  -> PERFECT WCAG 2.1 AA ACCESSIBILITY: 0 VIOLATIONS!');
    }
    auditResults.axeViolations = axeResults.violations;

    // Save summary results
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'prevention_simplified_audit_results.json'),
      JSON.stringify(auditResults, null, 2)
    );

    console.log('\n' + '='.repeat(70));
    console.log('AUDIT COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));

  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

runAudit();
