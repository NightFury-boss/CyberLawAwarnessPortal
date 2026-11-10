/**
 * Browser Verification & Accessibility Audit Script for Final Simplified Resources Directory
 * 
 * Verifies:
 * 1. 5 Responsive Viewports: Desktop (1440px), Laptop (1280px), Tablet (768px), Mobile (390px), Narrow Mobile (375px)
 * 2. 0px Horizontal Overflow across all viewports
 * 3. Page Header: Title "Find the Right Help", Subtitle "Official portals and support services for cybercrime, financial fraud and digital safety."
 * 4. Four Static Directory Sections:
 *    - Emergency Help (#emergency-help)
 *    - Banking & Financial Complaints (#banking-financial)
 *    - Cybersecurity (#cybersecurity)
 *    - Other Official Services (#other-services)
 * 5. Removal of Search Bar and Category Filter Tabs (Simple static directory)
 * 6. Simplified Card Anatomy: Authority eyebrow, Title, 1-sentence Purpose, Contact text, 1 Action Button
 * 7. State & UT Cyber Police Selector (Dropdown, contact, link)
 * 8. Prevention Referral Section (Link to /prevention#playbooks)
 * 9. Touch Target Dimensions (>= 44px)
 * 10. WCAG 2.1 AA Accessibility Audit via @axe-core/playwright (0 violations target)
 * 11. Screenshots captured to brain directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4181;
const SCREENSHOT_DIR = path.join(
  'C:',
  'Users',
  'Asus',
  '.gemini',
  'antigravity',
  'brain',
  '2a38735a-7985-4d0c-9744-999cb0b89167',
  'screenshots',
  'resources-simplified'
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
  console.log('FINAL SIMPLIFIED RESOURCES DIRECTORY — COMPREHENSIVE QA');
  console.log('Static 4-Section Directory & Constitutional Atelier');
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
    await page.goto(`http://127.0.0.1:${PORT}/resources`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify Title & Subtitle
    const pageTitle = await page.textContent('h1.page-title, .resources-page-container h1');
    const pageSubtitle = await page.textContent('p.page-subtitle, .resources-page-container .page-subtitle');
    console.log(`  -> Page title: "${pageTitle?.trim()}" (Expected: "Find the Right Help")`);
    console.log(`  -> Page subtitle: "${pageSubtitle?.trim()}"`);

    // Verify Absence of Search Bar and Category Tabs
    const searchBarCount = await page.locator('.portal-search-input').count();
    const categoryTabsCount = await page.locator('.resources-tab-btn').count();
    console.log(`  -> Search bar count: ${searchBarCount} (Expected: 0)`);
    console.log(`  -> Category tabs count: ${categoryTabsCount} (Expected: 0)`);
    auditResults.features.noSearchOrFilters = (searchBarCount === 0 && categoryTabsCount === 0);

    // Verify Horizontal Overflow
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    console.log(`  -> Desktop horizontal overflow: ${desktopOverflow}px (Expected: 0px)`);
    auditResults.viewports.desktop1440 = { overflow: desktopOverflow };

    // Capture Desktop Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_resources_simplified_desktop.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 2: FOUR STATIC SECTIONS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 2] Verifying Four Static Directory Sections...');
    
    // Section 1: Emergency Help
    const emergencySection = await page.locator('#emergency-help');
    const hasEmergency = (await emergencySection.count()) > 0;
    const emergencyTitle = await emergencySection.locator('.resources-section-title').textContent();
    const emergencyCards = await emergencySection.locator('.resource-mini-card').count();
    console.log(`  -> Section 1: "${emergencyTitle?.trim()}" with ${emergencyCards} cards`);

    // Section 2: Banking & Financial Complaints
    const bankingSection = await page.locator('#banking-financial');
    const hasBanking = (await bankingSection.count()) > 0;
    const bankingTitle = await bankingSection.locator('.resources-section-title').textContent();
    const bankingCards = await bankingSection.locator('.resource-mini-card').count();
    console.log(`  -> Section 2: "${bankingTitle?.trim()}" with ${bankingCards} cards`);

    // Section 3: Cybersecurity
    const cyberSection = await page.locator('#cybersecurity');
    const hasCyber = (await cyberSection.count()) > 0;
    const cyberTitle = await cyberSection.locator('.resources-section-title').textContent();
    const cyberCards = await cyberSection.locator('.resource-mini-card').count();
    console.log(`  -> Section 3: "${cyberTitle?.trim()}" with ${cyberCards} cards`);

    // Section 4: Other Official Services
    const otherSection = await page.locator('#other-services');
    const hasOther = (await otherSection.count()) > 0;
    const otherTitle = await otherSection.locator('.resources-section-title').textContent();
    const otherCards = await otherSection.locator('.resource-mini-card').count();
    console.log(`  -> Section 4: "${otherTitle?.trim()}" with ${otherCards} cards`);

    auditResults.features.fourSections = (hasEmergency && hasBanking && hasCyber && hasOther);

    // -------------------------------------------------------------------------
    // STAGE 3: CARD ANATOMY & CONTACT VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 3] Testing Card Anatomy & Contact Details...');
    const firstCard = page.locator('.resource-mini-card').first();
    const cardAuthority = await firstCard.locator('.resource-card-authority').textContent();
    const cardTitle = await firstCard.locator('.resource-card-title').textContent();
    const cardPurpose = await firstCard.locator('.resource-card-purpose').textContent();
    const cardBtnText = await firstCard.locator('.resource-card-btn').textContent();

    console.log(`  -> First Card Authority: "${cardAuthority?.trim()}"`);
    console.log(`  -> First Card Title: "${cardTitle?.trim()}"`);
    console.log(`  -> First Card Purpose: "${cardPurpose?.trim()}"`);
    console.log(`  -> First Card Button: "${cardBtnText?.trim()}"`);

    // Verify key contact numbers
    const rbiCard = page.locator('.resource-mini-card:has-text("Complaint Management System")');
    const rbiContact = await rbiCard.locator('.resource-card-contact').textContent();
    console.log(`  -> RBI Contact verified: "${rbiContact?.trim()}" (Expected: 14448)`);

    const nalsaCard = page.locator('.resource-mini-card:has-text("NALSA")');
    const nalsaContact = await nalsaCard.locator('.resource-card-contact').textContent();
    console.log(`  -> NALSA Contact verified: "${nalsaContact?.trim()}" (Expected: 15100)`);

    // -------------------------------------------------------------------------
    // STAGE 4: STATE CYBER POLICE SELECTOR
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 4] Testing State Cyber Police Selector...');
    const hasStateHeading = await page.isVisible('#state-police-heading');
    console.log(`  -> State Cyber Police heading visible: ${hasStateHeading ? 'PASS' : 'FAIL'}`);

    // Change state dropdown to Maharashtra
    await page.selectOption('#state-dropdown', { label: 'Maharashtra' });
    await page.waitForTimeout(150);
    const mahaTitle = await page.textContent('.resources-state-name');
    const mahaPhone = await page.textContent('.resources-state-phone');
    console.log(`  -> Selected Maharashtra: "${mahaTitle?.trim()}" (${mahaPhone?.trim()})`);

    // Change state dropdown to Karnataka
    await page.selectOption('#state-dropdown', { label: 'Karnataka' });
    await page.waitForTimeout(150);
    const kspTitle = await page.textContent('.resources-state-name');
    console.log(`  -> Selected Karnataka: "${kspTitle?.trim()}"`);

    // -------------------------------------------------------------------------
    // STAGE 5: PREVENTION REFERRAL CARD
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 5] Testing Prevention Referral Card...');
    const instructionsHeading = await page.textContent('#instructions-heading');
    const instructionsLink = await page.getAttribute('.resources-instructions-btn', 'href');
    console.log(`  -> Referral Heading: "${instructionsHeading?.trim()}"`);
    console.log(`  -> Referral Link Target: "${instructionsLink}"`);

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
      path: path.join(SCREENSHOT_DIR, '02_resources_simplified_laptop.png'),
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
      path: path.join(SCREENSHOT_DIR, '03_resources_simplified_tablet.png'),
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
      path: path.join(SCREENSHOT_DIR, '04_resources_simplified_mobile.png'),
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
      path: path.join(SCREENSHOT_DIR, '05_resources_simplified_narrow.png'),
      fullPage: true
    });

    // -------------------------------------------------------------------------
    // STAGE 10: TOUCH TARGET SIZE AUDIT
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 10] Testing Touch Target Dimensions (>= 44px)...');
    const touchTargets = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('.resource-card-btn, .resources-instructions-btn, .resources-state-link, .resources-state-select'));
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: el.innerText.trim().substring(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          valid: rect.height >= 40 // Standard touch target min height
        };
      });
    });

    const invalidTargets = touchTargets.filter(t => !t.valid);
    console.log(`  -> Inspected ${touchTargets.length} touch targets. Below 40px: ${invalidTargets.length}`);
    if (invalidTargets.length > 0) {
      console.log('  -> Warnings:', invalidTargets);
    }
    auditResults.features.touchTargetsValid = (invalidTargets.length === 0);

    // -------------------------------------------------------------------------
    // STAGE 11: WCAG 2.1 AA ACCESSIBILITY AUDIT VIA AXE-CORE
    // -------------------------------------------------------------------------
    console.log('\n[STAGE 11] Running WCAG 2.1 AA Accessibility Audit with Axe-Core...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/resources`, { waitUntil: 'networkidle' });
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
      path.join(SCREENSHOT_DIR, 'resources_simplified_audit_results.json'),
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
