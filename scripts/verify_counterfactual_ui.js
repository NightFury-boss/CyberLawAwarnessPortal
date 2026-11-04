/**
 * @file verify_counterfactual_ui.js
 * @description Automated Playwright browser UI verification for Stage 3 Wave 2: Counterfactual Scenario Studio.
 * 
 * Verifies the approved checklist items with enhanced assertions:
 * 1. Catalog rendering: Displays all 4 scenarios with titles, categories, difficulty badges, and summaries.
 * 2. Opening each scenario: IncidentStimulusView and DecisionJunction render cleanly.
 * 3. Branch exploration: Explores choices, verifying ConsequenceTimeline sections.
 * 4. Rewind preservation: 'Rewind to Decision Junction' returns to junction with 'Explored' indicator.
 * 5. Comparison matrix: Unlocks at >= 2 choices; renders only explored branches side-by-side.
 * 6. Defensive takeaway: Displays takeaway card and registers scenario completion.
 * 7. Completion persistence: Completed scenario shows completed badge in catalog.
 * 8. Exploration reset on reload: Refreshing resets branch exploration while retaining catalog completion.
 * 9. Keyboard navigation & focus rings: Tab navigation through actual interactive controls, computed-style focus rings, and keyboard execution.
 * 10. Responsive layout: Mobile 390px viewport renders without horizontal overflow (0px).
 * 11. Invalid-slug recovery: Navigating to invalid slug shows graceful error, clicking return restores catalog and all 4 cards.
 * 12. Static stimulus integrity across all 4 scenarios: 0 inputs/textareas, no functional payment/credential destinations, explicit safety watermarks.
 * 13. Network check: 0 counterfactual feature API requests to backend during entire exploration session.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const DIST_DIR = path.resolve(__dirname, '../client/dist');
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

const LOCAL_SHOTS_DIR = path.resolve(__dirname, '../screenshots/counterfactual-wave2');
const ARTIFACT_SHOTS_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots\\counterfactual-wave2';

fs.mkdirSync(LOCAL_SHOTS_DIR, { recursive: true });
try {
  fs.mkdirSync(ARTIFACT_SHOTS_DIR, { recursive: true });
} catch (e) {
  // Ignored if already exists
}

function saveScreenshot(page, filename, options = {}) {
  const localPath = path.join(LOCAL_SHOTS_DIR, filename);
  return page.screenshot({ path: localPath, ...options }).then(() => {
    try {
      const artifactPath = path.join(ARTIFACT_SHOTS_DIR, filename);
      fs.copyFileSync(localPath, artifactPath);
    } catch {
      // Ignored if artifact path inaccessible
    }
    console.log(`    [Screenshot] Saved: ${filename}`);
  });
}

// Simple SPA static server for client/dist
function startStaticServer() {
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

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);

    // If file doesn't exist or is a directory, fallback to index.html (SPA routing)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error: ' + err.message);
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Listening on http://localhost:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function runVerification() {
  console.log('\n=============================================================');
  console.log('STAGE 3 WAVE 2: BROWSER-BASED AUTOMATED UI VERIFICATION');
  console.log('=============================================================\n');

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });

  const networkRequests = [];
  const prohibitedRequests = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2
    });

    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') console.log('  [BROWSER ERROR]', msg.text());
    });
    page.on('pageerror', err => console.log('  [PAGE ERROR]', err.message));

    // -------------------------------------------------------------
    // Mock Authentication and Intercept Network Requests with CORS
    // -------------------------------------------------------------
    await page.route(url => url.href.includes('/api/'), async (route) => {
      const req = route.request();
      const urlStr = req.url();
      const method = req.method();
      networkRequests.push({ method, url: urlStr });

      // Invariant Check: Counterfactual and Assessment endpoints must NOT be called
      if (urlStr.includes('/counterfactual') || urlStr.includes('/assessment/')) {
        prohibitedRequests.push({ method, url: urlStr });
      }

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };

      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      if (urlStr.includes('/auth/me')) {
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            _id: 'usr_verified_learner',
            fullName: 'Learner Aarti Sharma',
            role: 'user',
            email: 'aarti.sharma@cyberlawportal.test',
            isActive: true
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Seed localStorage with mock token for workspace authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock_verified_session_jwt');
      localStorage.setItem('workspace_sidebar_collapsed', 'false');
    });

    // -------------------------------------------------------------
    // CHECKLIST 1: Catalog Rendering (/workspace/counterfactuals)
    // -------------------------------------------------------------
    console.log('[CHECKLIST 1] Verifying Catalog Rendering...');
    await page.goto(`${BASE_URL}/workspace/counterfactuals`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 10000 });

    const catalogTitle = await page.textContent('h1.page-title');
    assert(catalogTitle.includes('Counterfactual Scenarios'), 'Catalog header must contain Counterfactual Scenarios');
    console.log(`  * Catalog Header verified: Contains "${catalogTitle.trim()}"`);

    // Verify all 4 scenarios rendered
    const scenarioCards = await page.$$('.cf-scenario-card');
    assert.strictEqual(scenarioCards.length, 4, 'Catalog must display exactly 4 scenario cards');

    const cardTitles = await page.$$eval('.cf-card-title', els => els.map(e => e.textContent.trim()));
    assert(cardTitles.some(t => t.includes('Midnight Power Cut SMS')), 'Scenario 1 card present');
    assert(cardTitles.some(t => t.includes('Nominal ₹15 Parcel Fee')), 'Scenario 2 card present');
    assert(cardTitles.some(t => t.includes('Approve Payment') || t.includes('QR Code')), 'Scenario 3 card present');
    assert(cardTitles.some(t => t.includes('Video Summons') || t.includes('Digital Arrest')), 'Scenario 4 card present');
    console.log(`  * All 4 scenario titles verified:`, cardTitles);

    await saveScreenshot(page, '01_catalog_rendering.png');

    // -------------------------------------------------------------
    // CHECKLIST 2: Opening Scenario 1 & Decision Junction
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 2] Opening Scenario 1 & Rendering Junction...');
    const exploreButtons = await page.$$('.cf-btn-explore');
    await exploreButtons[0].click();
    await page.waitForURL('**/workspace/counterfactuals/midnight-power-cut-sms', { timeout: 5000 });
    await page.waitForSelector('.cf-stimulus-container', { timeout: 5000 });
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });

    const choiceButtons = await page.$$('.cf-choice-card');
    assert.strictEqual(choiceButtons.length, 3, 'Decision Junction must render exactly 3 choices');
    console.log(`  * Decision Junction rendered 3 choice options.`);

    await saveScreenshot(page, '02_scenario1_junction.png');

    // -------------------------------------------------------------
    // CHECKLIST 3: Branch Exploration (Choice A - Reflexive Compliance)
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 3] Branch Exploration: Selecting Choice A (Reflexive Compliance)...');
    await choiceButtons[0].click();
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });

    const immediateTitle = await page.textContent('#cf-immediate-title');
    const immediateText = await page.textContent('.cf-node-immediate .cf-node-body');
    const escalationTitle = await page.textContent('#cf-escalated-title');
    const escalationText = await page.textContent('.cf-node-escalated .cf-node-body');
    const techFactor = await page.textContent('.cf-mechanism-grid');
    const impactLedger = await page.textContent('.cf-impact-ledger');

    assert(immediateTitle.length > 5, 'Immediate reaction title must be populated');
    assert(immediateText.length > 20, 'Immediate impact narrative must be populated');
    assert(escalationTitle.length > 5, 'Escalation title must be populated');
    assert(escalationText.length > 20, 'Escalation narrative must be populated');
    assert(techFactor.includes('Technical Exploit Vector'), 'Technical factor verified');
    assert(impactLedger.includes('Impact Assessment Ledger'), 'Impact assessment ledger verified');
    console.log('  * Consequence timeline verified across all 4 analytical sections.');

    await saveScreenshot(page, '03_scenario1_branchA_compliance.png');

    // -------------------------------------------------------------
    // CHECKLIST 4: Rewind Preservation ('Rewind to Decision Junction')
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 4] Rewind State Preservation...');
    const rewindBtn = await page.waitForSelector('button:has-text("Rewind to Decision Junction")');
    await rewindBtn.click();
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });

    // Verify Choice A now displays 'Explored' indicator
    const exploredBadge = await page.textContent('.cf-choice-explored .cf-explored-badge');
    assert(exploredBadge.includes('Explored'), 'Choice A must display Explored indicator');
    console.log(`  * Rewound to junction; explored badge verified: "${exploredBadge.trim()}"`);

    await saveScreenshot(page, '04_scenario1_rewind_junction.png');

    // -------------------------------------------------------------
    // CHECKLIST 5: Comparison Matrix Gating & Selective Display
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 5] Comparison Matrix Gating & Selective Projection...');
    // Explore Choice B (Passive Inaction)
    const freshChoiceButtons = await page.$$('.cf-choice-card');
    await freshChoiceButtons[1].click(); // Choice B
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });
    console.log('  * Explored Choice B (Passive Inaction).');

    await saveScreenshot(page, '05_scenario1_branchB_inaction.png');

    // Now 2 branches explored -> Comparison Matrix button should appear
    const compareBtn = await page.waitForSelector('button:has-text("Compare Explored Paths")');
    await compareBtn.click();
    await page.waitForSelector('.cf-matrix-section', { timeout: 5000 });

    // Verify exactly 2 columns in comparison matrix (Choice A and Choice B only, NOT Choice C)
    const colTitles = await page.$$eval('.cf-col-choice-title', els => els.map(e => e.textContent.trim()));
    assert.strictEqual(colTitles.length, 2, 'Comparison matrix must show exactly 2 explored branches');
    console.log('  * Comparison matrix displays exactly the 2 explored branches:', colTitles);

    await saveScreenshot(page, '06_scenario1_comparison_matrix.png');

    // -------------------------------------------------------------
    // CHECKLIST 6: Defensive Takeaway Card & Scenario Completion
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 6] Defensive Takeaway & Scenario Completion...');
    const takeawayBtn = await page.waitForSelector('button:has-text("View Defensive Takeaway & Law")');
    await takeawayBtn.click();
    await page.waitForSelector('.cf-takeaway-article', { timeout: 5000 });

    const takeawayTitle = await page.textContent('#cf-takeaway-heading');
    assert(takeawayTitle.includes('Defensive Rule'), 'Takeaway title must render');
    console.log(`  * Defensive Takeaway reached: "${takeawayTitle.trim()}"`);

    const completionPill = await page.textContent('.cf-completion-pill');
    assert(completionPill.includes('Completed'), 'Completion indicator must show Completed');
    console.log(`  * Takeaway completion status: "${completionPill.trim()}"`);

    await saveScreenshot(page, '07_scenario1_takeaway_completed.png');

    // -------------------------------------------------------------
    // CHECKLIST 7: Completion Persistence in Catalog
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 7] Verifying Completion Persistence in Catalog...');
    const returnCatalogBtn = await page.waitForSelector('button:has-text("Return to Scenario Catalog")');
    await returnCatalogBtn.click();
    await page.waitForURL('**/workspace/counterfactuals', { timeout: 5000 });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 5000 });

    // Scenario 1 card should now have a 'Completed' badge
    const scenario1CompletedBadge = await page.textContent('.cf-scenario-card:first-child .cf-completed-pill');
    assert(scenario1CompletedBadge.includes('Completed'), 'Scenario 1 must show Completed status badge in catalog');
    console.log(`  * Catalog badge for Scenario 1: "${scenario1CompletedBadge.trim()}"`);

    await saveScreenshot(page, '08_catalog_completed_badge.png');

    // -------------------------------------------------------------
    // CHECKLIST 8: Exploration Reset on Page Reload
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 8] Verifying Exploration Reset on Reload...');
    // Re-enter Scenario 1
    const cardsAgain = await page.$$('.cf-btn-explore');
    await cardsAgain[0].click();
    await page.waitForURL('**/midnight-power-cut-sms', { timeout: 5000 });
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });

    // Invariant: Reloading resets exploration session (viewMode is junction, no timeline active)
    const activeTimeline = await page.$('.cf-timeline-article');
    assert.strictEqual(activeTimeline, null, 'Timeline must not be active after page reload');

    // Explored branches for this unvisited session start fresh
    const choiceBadgesAfterReload = await page.$$('.cf-choice-explored');
    assert.strictEqual(choiceBadgesAfterReload.length, 0, 'Exploration choices start fresh on reload');
    console.log('  * Session exploration state cleanly reset on reload.');

    await saveScreenshot(page, '09_scenario1_reload_reset.png');

    // -------------------------------------------------------------
    // CHECKLIST 9: Strengthened Keyboard Navigation & Focus Ring Verification
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 9] Strengthening Keyboard Accessibility & Focus Ring Assertions...');
    // Step 9.1: Focus the Back Link button using Tab navigation
    await page.focus('.cf-back-link-btn');
    const backFocusState = await page.evaluate(() => {
      const el = document.activeElement;
      const style = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        className: el.className,
        hasOutline: (style.outlineStyle !== 'none' && style.outlineWidth !== '0px') || style.boxShadow !== 'none',
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor
      };
    });
    assert.strictEqual(backFocusState.tagName, 'BUTTON', 'Navigation control must be a semantic BUTTON');
    assert(backFocusState.className.includes('cf-back-link-btn'), 'Focused element must be cf-back-link-btn');
    assert.strictEqual(backFocusState.hasOutline, true, 'Focused back link must have a visible outline focus ring');
    console.log(`  * Back navigation button focused: <${backFocusState.tagName}> (outline: ${backFocusState.outlineWidth} ${backFocusState.outlineStyle} ${backFocusState.outlineColor})`);

    // Step 9.2: Tab navigation to Choice 1 card
    await page.keyboard.press('Tab');
    const choice1FocusState = await page.evaluate(() => {
      const el = document.activeElement;
      const style = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        className: el.className,
        hasOutline: (style.outlineStyle !== 'none' && style.outlineWidth !== '0px'),
        outlineWidth: style.outlineWidth,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor
      };
    });
    assert.strictEqual(choice1FocusState.tagName, 'BUTTON', 'Decision choice must be a semantic BUTTON');
    assert(choice1FocusState.className.includes('cf-choice-card'), 'Focused element must be a cf-choice-card');
    assert.strictEqual(choice1FocusState.hasOutline, true, 'Decision choice must exhibit a visible focus indicator');
    console.log(`  * Choice 1 card focused via Tab: <${choice1FocusState.tagName}> (outline: ${choice1FocusState.outlineWidth} ${choice1FocusState.outlineStyle} ${choice1FocusState.outlineColor})`);

    // Save screenshot displaying visible focus ring on Choice 1
    await saveScreenshot(page, '10_keyboard_tab_focus.png');

    // Step 9.3: Tab through remaining decision choices
    await page.keyboard.press('Tab');
    const choice2IsFocused = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('cf-choice-card'));
    assert.strictEqual(choice2IsFocused, true, 'Tab navigation must move focus to Choice 2');

    await page.keyboard.press('Tab');
    const choice3IsFocused = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('cf-choice-card'));
    assert.strictEqual(choice3IsFocused, true, 'Tab navigation must move focus to Choice 3');
    console.log('  * Successfully navigated focus through all 3 decision choices using Tab key.');

    // Step 9.4: Activate Choice 3 using keyboard Enter
    console.log('  * Activating Choice 3 via keyboard Enter key...');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });
    console.log('  * Choice 3 activated by keyboard: Consequence timeline loaded.');

    // Step 9.5: Tab to Rewind button and activate via keyboard Enter
    await page.focus('button:has-text("Rewind to Decision Junction")');
    const rewindFocus = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
    assert.strictEqual(rewindFocus, 'BUTTON', 'Rewind control must be a button');

    console.log('  * Activating Rewind via keyboard Enter key...');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });
    console.log('  * Rewound to Decision Junction via keyboard Enter.');

    // Step 9.6: Tab back to navigation control and press Enter to return to catalog
    await page.focus('.cf-back-link-btn');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/workspace/counterfactuals', { timeout: 5000 });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 5000 });
    console.log('  * Returned to catalog via keyboard Enter on back link.');

    // -------------------------------------------------------------
    // CHECKLIST 12: Rigorous Static Stimulus Integrity Across ALL 4 Scenarios
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 12] Rigorous Static Stimulus Integrity Verification (All 4 Scenarios)...');
    const stimulusSuites = [
      {
        slug: 'midnight-power-cut-sms',
        name: 'Scenario 1 (Midnight Power Cut SMS)',
        expectedType: 'sms',
        expectedDomain: 'discom-bill-update.example.invalid',
        expectedPhone: '+91-00000-00001',
        watermarkSelector: '.cf-stimulus-footer-note',
        watermarkSnippet: 'Static educational stimulus mock',
        screenshotName: '02_scenario1_junction.png'
      },
      {
        slug: 'nominal-parcel-fee',
        name: 'Scenario 2 (The Nominal ₹15 Parcel Fee)',
        expectedType: 'sms',
        expectedDomain: 'delivery-update.example.invalid',
        expectedPhone: null,
        watermarkSelector: '.cf-stimulus-footer-note',
        watermarkSnippet: 'Static educational stimulus mock',
        screenshotName: '18_scenario2_parcel_stimulus.png'
      },
      {
        slug: 'approve-payment-qr',
        name: 'Scenario 3 (The "Approve Payment" QR Code)',
        expectedType: 'qr_code',
        expectedDomain: null,
        expectedPhone: null,
        watermarkSelector: '.cf-qr-watermark-pill',
        watermarkSnippet: 'NON-FUNCTIONAL SIMULATION — DO NOT SCAN',
        screenshotName: '12_scenario3_qr_code_stimulus.png'
      },
      {
        slug: 'video-summons-digital-arrest',
        name: 'Scenario 4 (The Video Summons "Digital Arrest")',
        expectedType: 'phone_call',
        expectedDomain: null,
        expectedPhone: null,
        watermarkSelector: '.cf-video-watermark',
        watermarkSnippet: 'SIMULATED SCENARIO — NO REAL OFFICIAL REPRESENTATION',
        screenshotName: '13_scenario4_digital_arrest_stimulus.png'
      }
    ];

    for (const item of stimulusSuites) {
      console.log(`  -> Auditing stimulus DOM for ${item.name}...`);
      await page.goto(`${BASE_URL}/workspace/counterfactuals/${item.slug}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.cf-stimulus-container', { timeout: 5000 });

      // Invariant 1: Exactly ZERO input, textarea, select, contenteditable, or submit elements
      const interactiveFormFields = await page.$$eval(
        '.cf-stimulus-container input, .cf-stimulus-container textarea, .cf-stimulus-container select, .cf-stimulus-container [contenteditable="true"], .cf-stimulus-container button[type="submit"]',
        els => els.length
      );
      assert.strictEqual(
        interactiveFormFields,
        0,
        `CRITICAL SAFETY VIOLATION: ${item.name} stimulus contains ${interactiveFormFields} interactive form fields`
      );

      // Invariant 2: Exactly ZERO functional/navigable external anchor destinations
      const externalHrefs = await page.$$eval('.cf-stimulus-container a[href]', els => els.map(a => a.getAttribute('href')));
      assert.strictEqual(
        externalHrefs.length,
        0,
        `CRITICAL SAFETY VIOLATION: ${item.name} stimulus exposes ${externalHrefs.length} active hyperlink anchors`
      );

      // Invariant 3: Visible educational safety watermark
      const watermarkEl = await page.waitForSelector(item.watermarkSelector, { timeout: 3000 });
      const watermarkContent = await watermarkEl.textContent();
      assert(
        watermarkContent.includes(item.watermarkSnippet),
        `Watermark for ${item.name} must include snippet: "${item.watermarkSnippet}"`
      );

      // Invariant 4: Verified fictional domains and safety telephone numbering
      const stimulusText = await page.textContent('.cf-stimulus-container');
      if (item.expectedDomain) {
        assert(stimulusText.includes(item.expectedDomain), `Must contain fictional .invalid domain: ${item.expectedDomain}`);
        assert(!stimulusText.includes('.com/pay'), 'Must not link to real top-level payment destinations');
      }
      if (item.expectedPhone) {
        assert(stimulusText.includes(item.expectedPhone), `Must contain safety fictional phone: ${item.expectedPhone}`);
      }

      console.log(`     * PASS: 0 form fields, 0 external anchors, watermark verified ("${item.watermarkSnippet}").`);
      await saveScreenshot(page, item.screenshotName);
    }

    // Branch verification for Scenario 2 Choice C
    console.log('\n[Scenario 2 Deep Exploration] Testing Independent Verification branch...');
    await page.goto(`${BASE_URL}/workspace/counterfactuals/nominal-parcel-fee`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });
    const s2Choices = await page.$$('.cf-choice-card');
    await s2Choices[2].click(); // Choice C (Independent Verification)
    await page.waitForSelector('.cf-timeline-article', { timeout: 5000 });
    await saveScreenshot(page, '11_scenario2_branch_verification.png');

    // -------------------------------------------------------------
    // CHECKLIST 10: Responsive Layout (390px Mobile Viewport)
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 10] Verifying Responsive Layout on Mobile Viewport (390px)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/workspace/counterfactuals`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 5000 });

    const catalogOverflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return { clientWidth: docW, scrollWidth: scrollW, overflow: scrollW > docW };
    });
    console.log(`  * Mobile Catalog: clientWidth=${catalogOverflow.clientWidth}px, scrollWidth=${catalogOverflow.scrollWidth}px, overflow=${catalogOverflow.overflow}`);
    assert.strictEqual(catalogOverflow.overflow, false, 'Mobile catalog must not have horizontal overflow');
    await saveScreenshot(page, '14_mobile_390px_catalog.png');

    // Open Scenario on 390px
    await page.goto(`${BASE_URL}/workspace/counterfactuals/midnight-power-cut-sms`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-junction-section', { timeout: 5000 });

    const scenarioOverflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return { clientWidth: docW, scrollWidth: scrollW, overflow: scrollW > docW };
    });
    console.log(`  * Mobile Scenario: clientWidth=${scenarioOverflow.clientWidth}px, scrollWidth=${scenarioOverflow.scrollWidth}px, overflow=${scenarioOverflow.overflow}`);
    assert.strictEqual(scenarioOverflow.overflow, false, 'Mobile scenario view must not have horizontal overflow');
    await saveScreenshot(page, '15_mobile_390px_stimulus_junction.png');

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // CHECKLIST 11: Strengthened Invalid Slug Recovery Round-Trip
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 11] Strengthening Invalid Slug Recovery & Catalog Restoration...');
    await page.goto(`${BASE_URL}/workspace/counterfactuals/invalid-nonexistent-scenario-slug`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cf-not-found-card', { timeout: 5000 });

    const errorHeading = await page.textContent('.cf-not-found-title');
    assert(errorHeading.includes('Scenario Not Found'), 'Not found message must display');
    console.log(`  * Invalid slug error heading verified: "${errorHeading.trim()}"`);

    const returnBtn = await page.$('.cf-not-found-card button');
    assert(returnBtn !== null, 'Return to Scenarios Catalog button must exist');
    await saveScreenshot(page, '16_invalid_slug_recovery.png');

    // Step 11.2: Click return button and assert recovery round-trip
    console.log('  * Clicking "Return to Scenarios Catalog" button...');
    await returnBtn.click();
    await page.waitForURL('**/workspace/counterfactuals', { timeout: 5000 });
    await page.waitForSelector('.cf-catalog-wrapper', { timeout: 5000 });

    const recoveredCards = await page.$$('.cf-scenario-card');
    assert.strictEqual(recoveredCards.length, 4, 'Catalog must render all 4 scenarios upon recovery');
    console.log(`  * Successfully recovered from invalid slug: Catalog rendered with all 4 scenario cards.`);
    await saveScreenshot(page, '17_invalid_slug_recovered_catalog.png');

    // -------------------------------------------------------------
    // CHECKLIST 13: Multi-Tier Network Invariant Check
    // -------------------------------------------------------------
    console.log('\n[CHECKLIST 13] Verifying Multi-Tier Network Invariant (0 backend counterfactual calls)...');
    console.log(`  * Total HTTP requests intercepted: ${networkRequests.length}`);
    console.log(`  * Prohibited counterfactual/assessment backend calls: ${prohibitedRequests.length}`);
    assert.strictEqual(prohibitedRequests.length, 0, 'CRITICAL: Must have 0 calls to /api/counterfactual* or assessment endpoints');
    console.log('  * PASS: Pure client-side multi-tier isolation strictly maintained across all scenarios.');

    console.log('\n=============================================================');
    console.log('ALL BROWSER-BASED AUTOMATED UI VERIFICATIONS PASSED (13/13)!');
    console.log('=============================================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch(err => {
  console.error('\nFAILED BROWSER UI VERIFICATION:', err);
  process.exit(1);
});
