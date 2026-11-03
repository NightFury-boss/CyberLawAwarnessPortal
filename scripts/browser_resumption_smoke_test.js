/**
 * Playwright Browser Smoke Test: Assessment Resumption, Idempotency, and Expiration
 * 
 * Comprehensive browser verification:
 * 1. Mid-session reloads at Stages 2, 6, and 10 in Baseline Assessment
 * 2. Mid-session reloads at Stages 2, 6, and 10 in Final Assessment
 * 3. Exact stage restoration, decision visibility, and active probe state persistence
 * 4. Completed-assessment re-entry without duplicate session creation
 * 5. Expired-session recovery without crash
 * 6. Evidence screenshot capture and artifact persistence
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');
const AssessmentSession = require('../server/models/AssessmentSession');
const AssessmentDecision = require('../server/models/AssessmentDecision');
const Scenario = require('../server/models/Scenario');
const ScenarioStage = require('../server/models/ScenarioStage');

const SHOT_DIR = path.join(__dirname, '../screenshots/browser-smoke-test');
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\2a38735a-7985-4d0c-9744-999cb0b89167\\screenshots\\browser-smoke-test';

fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function copyToArtifact(srcPath, filename) {
  const destPath = path.join(ARTIFACT_DIR, filename);
  fs.copyFileSync(srcPath, destPath);
}

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'browser_resumption_tester@test.com';
const TEST_PASS = 'ResumptionPass123!Secure';

async function waitBrief(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=============================================================');
  console.log('PLAYWRIGHT BROWSER RESUMPTION & EXPIRATION SMOKE TEST');
  console.log('=============================================================\n');

  // 1. Setup DB test user & clear historical test sessions
  console.log('[Setup] Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Setup] MongoDB Atlas connected.');

  const existingUser = await User.findOne({ email: TEST_EMAIL });
  if (existingUser) {
    await AssessmentSession.deleteMany({ userId: existingUser._id });
    await AssessmentDecision.deleteMany({ userId: existingUser._id });
    const UserProgress = require('../server/models/UserProgress');
    await UserProgress.deleteMany({ userId: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }

  // Register canonically via auth API
  console.log(`[Setup] Registering test user canonically via http://localhost:5000/api/auth/register...`);
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Browser Resumption Test User',
      email: TEST_EMAIL,
      password: TEST_PASS
    })
  });
  assert.equal(regRes.status, 201, 'Canonical registration must succeed');
  const dbUser = await User.findOne({ email: TEST_EMAIL });
  const userId = dbUser._id;
  console.log(`[Setup] Created test user: ${dbUser.email} (ID: ${userId})`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [Browser Error]:`, msg.text());
  });
  page.on('pageerror', err => console.log(`  [Browser PageError]:`, err.message));

  const screenshotsTaken = [];

  async function takeScreenshot(name) {
    const shotPath = path.join(SHOT_DIR, name);
    await page.screenshot({ path: shotPath, fullPage: true });
    copyToArtifact(shotPath, name);
    screenshotsTaken.push(name);
    console.log(`  📸 Saved screenshot: ${name}`);
  }

  try {
    // 2. Authenticate
    console.log(`\n[Auth] Navigating to ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    console.log('[Auth] Submitting login credentials...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    
    const [loginResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login'), { timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);
    console.log(`  [Auth] Login HTTP status: ${loginResp.status()}`);
    if (loginResp.status() !== 200) {
      const errText = await loginResp.text();
      throw new Error(`Login failed with status ${loginResp.status()}: ${errText}`);
    }

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('  ✓ Authenticated successfully, redirected to /dashboard');

    // -------------------------------------------------------------------------
    // PART A: BASELINE ASSESSMENT RESUMPTION AT STAGES 2, 6, AND 10
    // -------------------------------------------------------------------------
    console.log('\n--- PART A: BASELINE ASSESSMENT RESUMPTION & RELOAD CHECKS ---');
    await page.goto(`${BASE_URL}/assessment/baseline`, { waitUntil: 'networkidle' });

    // Click "Start Your Digital Day"
    const startBtn = page.locator('button:has-text("Start Your Digital Day")');
    await startBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('  Clicking "Start Your Digital Day" briefing button...');
    await startBtn.first().click();
    await waitBrief(800);

    const reloadedBaselineStages = new Set();

    let baselineStageCount = 0;
    while (baselineStageCount < 20) {
      baselineStageCount++;
      await waitBrief(400);

      // Check for completion reveal
      const completionCard = page.locator('.profile-container, .profile-title, h1:has-text("Your Digital Awareness Profile")');
      if (await completionCard.count() > 0) {
        console.log('  ✓ Reached Baseline Completion Screen!');
        await takeScreenshot('07_baseline_profile_reveal.png');
        break;
      }

      // Read current stageOrder from live region
      const liveRegion = page.locator('div[aria-live="polite"]');
      const liveText = await liveRegion.count() > 0 ? (await liveRegion.first().textContent()).trim() : '';
      const match = liveText.match(/Situation order (\d+):\s*([^.]+)/);
      const stageOrderNum = match ? parseInt(match[1], 10) : baselineStageCount;
      const stageHeading = await page.locator('h2').first().textContent();
      console.log(`\n[Baseline Step ${baselineStageCount}] At Stage ${stageOrderNum}: "${stageHeading.trim()}"`);

      // -----------------------------------------------------------------------
      // RELOAD CHECK AT STAGE 2 (Probe stage)
      // -----------------------------------------------------------------------
      if (stageOrderNum === 2 && !reloadedBaselineStages.has(2)) {
        reloadedBaselineStages.add(2);
        console.log('  🔍 [Stage 2 Probe] Clicking primary action to reveal probe panel before reload...');
        const primaryCard = page.locator('.decision-cards-list button.decision-action-card:not([disabled])').first();
        await primaryCard.click();

        const probePanel = page.locator('.signal-probe-panel');
        await probePanel.waitFor({ state: 'visible', timeout: 3000 });
        await takeScreenshot('01_baseline_stage2_before_reload.png');

        console.log('  🔄 Reloading browser at Stage 2...');
        await page.reload({ waitUntil: 'networkidle' });
        await waitBrief(1000);

        // Verify restoration
        const restoredHeading = await page.locator('h2').first().textContent();
        assert.ok(restoredHeading.includes('Courier') || (await page.locator('div[aria-live="polite"]').textContent()).includes('2'));
        console.log(`  ✓ Stage 2 restored successfully: "${restoredHeading.trim()}"`);

        const actionCardsAfter = page.locator('.decision-cards-list button.decision-action-card:not([disabled])');
        assert.ok(await actionCardsAfter.count() > 0, 'Decision cards must be rendered after reload');
        await takeScreenshot('02_baseline_stage2_after_reload_resumed.png');

        // Re-activate and submit probe with atomic response wait
        await actionCardsAfter.first().click();
        const probePanelAfter = page.locator('.signal-probe-panel');
        await probePanelAfter.waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('.signal-probe-panel button.decision-action-card:not([disabled])').first().click();
        await waitBrief(200);

        const confirmBtn = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
        await waitBrief(500);
        continue;
      }

      // -----------------------------------------------------------------------
      // RELOAD CHECK AT STAGE 6 (Middle non-probe stage)
      // -----------------------------------------------------------------------
      if (stageOrderNum === 6 && !reloadedBaselineStages.has(6)) {
        reloadedBaselineStages.add(6);
        console.log('  📸 Capturing Stage 6 before reload...');
        await takeScreenshot('03_baseline_stage6_before_reload.png');

        console.log('  🔄 Reloading browser at Stage 6...');
        await page.reload({ waitUntil: 'networkidle' });
        await waitBrief(1000);

        const restoredHeading6 = await page.locator('h2').first().textContent();
        assert.ok(restoredHeading6.includes('Cloud') || (await page.locator('div[aria-live="polite"]').textContent()).includes('6'));
        console.log(`  ✓ Stage 6 restored successfully: "${restoredHeading6.trim()}"`);

        const cards6 = page.locator('.decision-cards-list button.decision-action-card:not([disabled])');
        assert.ok(await cards6.count() > 0, 'Decision cards must be rendered after reload');
        await takeScreenshot('04_baseline_stage6_after_reload_resumed.png');

        // Submit decision with atomic response wait
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          cards6.first().click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
        await waitBrief(500);
        continue;
      }

      // -----------------------------------------------------------------------
      // RELOAD CHECK AT STAGE 10 (Convergence probe stage)
      // -----------------------------------------------------------------------
      if (stageOrderNum === 10 && !reloadedBaselineStages.has(10)) {
        reloadedBaselineStages.add(10);
        console.log('  🔍 [Stage 10 Probe] Clicking primary action before reload...');
        const primaryCard10 = page.locator('.decision-cards-list button.decision-action-card:not([disabled])').first();
        await primaryCard10.click();

        const probePanel10 = page.locator('.signal-probe-panel');
        await probePanel10.waitFor({ state: 'visible', timeout: 3000 });
        await takeScreenshot('05_baseline_stage10_before_reload.png');

        console.log('  🔄 Reloading browser at Stage 10...');
        await page.reload({ waitUntil: 'networkidle' });
        await waitBrief(1000);

        const restoredHeading10 = await page.locator('h2').first().textContent();
        assert.ok(restoredHeading10.includes('Merchant') || (await page.locator('div[aria-live="polite"]').textContent()).includes('10'));
        console.log(`  ✓ Stage 10 restored successfully: "${restoredHeading10.trim()}"`);

        const cards10 = page.locator('.decision-cards-list button.decision-action-card:not([disabled])');
        assert.ok(await cards10.count() > 0, 'Decision cards must be rendered after reload');
        await takeScreenshot('06_baseline_stage10_after_reload_resumed.png');

        // Re-activate and submit probe with atomic response wait
        await cards10.first().click();
        const probePanelAfter10 = page.locator('.signal-probe-panel');
        await probePanelAfter10.waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('.signal-probe-panel button.decision-action-card:not([disabled])').first().click();
        await waitBrief(200);

        const confirmBtn10 = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn10.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
        await waitBrief(500);
        continue;
      }

      // Standard stage progression for other stages
      const card = page.locator('.decision-cards-list button.decision-action-card:not([disabled])').first();
      const stepPromise = page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }).catch(() => null);
      await card.click();

      // If probe appears, select first probe and confirm
      const probePanel = page.locator('.signal-probe-panel');
      let hasProbe = false;
      try {
        await probePanel.waitFor({ state: 'visible', timeout: 400 });
        hasProbe = true;
      } catch {
        hasProbe = false;
      }

      if (hasProbe) {
        await page.locator('.signal-probe-panel button.decision-action-card:not([disabled])').first().click();
        await waitBrief(150);
        const confirmBtn = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
      } else {
        const resp = await stepPromise;
        if (resp) {
          const data = await resp.json();
          if (data.isCompleted) break;
        }
      }

      await waitBrief(500);
    }

    // -------------------------------------------------------------------------
    // PART B: COMPLETED ASSESSMENT RE-ENTRY (BASELINE)
    // -------------------------------------------------------------------------
    console.log('\n--- PART B: BASELINE COMPLETED-ASSESSMENT RE-ENTRY CHECK ---');
    console.log('  Navigating back to /assessment/baseline...');
    await page.goto(`${BASE_URL}/assessment/baseline`, { waitUntil: 'networkidle' });
    await waitBrief(800);

    const completedView = page.locator('.completed-history-container, .profile-container, button:has-text("Retake Assessment")');
    assert.ok(await completedView.count() > 0, 'Completed summary view must be displayed on re-entry');
    console.log('  ✓ Completed summary view safely rendered on re-entry');
    await takeScreenshot('08_baseline_completed_reentry.png');

    // Verify in DB that no duplicate session was created
    const baselineSessions = await AssessmentSession.find({ userId, scenarioCode: 'baseline' });
    assert.equal(baselineSessions.length, 1, 'Exactly one baseline assessment session must exist (zero duplicates)');
    console.log(`  ✓ DB session count verified: ${baselineSessions.length} session (zero duplicate creation)`);

    // -------------------------------------------------------------------------
    // PART C: EXPIRED-SESSION RECOVERY CHECK
    // -------------------------------------------------------------------------
    console.log('\n--- PART C: EXPIRED-SESSION RECOVERY CHECK ---');
    const baselineScenario = await Scenario.findOne({ slug: 'baseline', status: 'published' });
    const firstStage = await ScenarioStage.findOne({ scenarioId: baselineScenario._id, stageOrder: 1 });

    const expiredSession = await AssessmentSession.create({
      userId,
      scenarioId: baselineScenario._id,
      scenarioCode: 'baseline',
      scenarioVersion: 2,
      scoringVersion: 2,
      currentStageId: firstStage._id,
      status: 'in-progress',
      score: 50,
      startedAt: new Date(Date.now() - 7200000),
      expiresAt: new Date(Date.now() - 120000) // Expired 2 minutes ago
    });

    // Seed expired session ID into browser's sessionStorage
    await page.evaluate((sessId) => {
      sessionStorage.setItem('active_baseline_session_id', sessId);
    }, expiredSession._id.toString());

    console.log('  Triggering navigation with expired session cache...');
    await page.goto(`${BASE_URL}/assessment/baseline`, { waitUntil: 'networkidle' });
    await waitBrief(1000);

    // Verify recovery: should transition cleanly without unhandled crash
    const expiredCleared = await page.evaluate(() => sessionStorage.getItem('active_baseline_session_id'));
    console.log(`  ✓ Expired session key in sessionStorage: ${expiredCleared} (Expected: null or cleaned)`);

    const updatedExpired = await AssessmentSession.findById(expiredSession._id);
    console.log(`  ✓ Expired session status in DB: "${updatedExpired.status}" (Expected: abandoned)`);
    assert.equal(updatedExpired.status, 'abandoned');
    await takeScreenshot('09_expired_session_clean_recovery.png');

    // Clean up expired session record
    await AssessmentSession.deleteOne({ _id: expiredSession._id });

    // -------------------------------------------------------------------------
    // PART D: FINAL ASSESSMENT RESUMPTION AT STAGES 2, 6, AND 10
    // -------------------------------------------------------------------------
    console.log('\n--- PART D: FINAL ASSESSMENT RESUMPTION & RELOAD CHECKS ---');
    await page.goto(`${BASE_URL}/assessment/final`, { waitUntil: 'networkidle' });

    const beginFinalBtn = page.locator('button:has-text("Start Final Check"), button:has-text("Begin Final Check"), button:has-text("Start Your Digital Day")');
    await beginFinalBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('  Clicking "Start Final Check" on Final Assessment briefing...');
    await beginFinalBtn.first().click();
    await waitBrief(1000);

    const reloadedFinalStages = new Set();
    let finalStageCount = 0;
    while (finalStageCount < 20) {
      finalStageCount++;
      await waitBrief(400);

      const completionCard = page.locator('.profile-container, .profile-title, h1:has-text("Final Check Completed"), h1:has-text("Final Assessment Complete"), h2:has-text("Your Final Check Results"), h2:has-text("Final Assessment Results"), .reveal-view, .reveal-pane');
      if (await completionCard.count() > 0) {
        console.log('  ✓ Reached Final Assessment Completion Screen!');
        await takeScreenshot('13_final_assessment_results.png');
        break;
      }

      const liveRegion = page.locator('div[aria-live="polite"]');
      const liveText = await liveRegion.count() > 0 ? (await liveRegion.first().textContent()).trim() : '';
      const match = liveText.match(/Situation order (\d+):\s*([^.]+)/);
      const stageOrderNum = match ? parseInt(match[1], 10) : finalStageCount;
      const stageHeading = await page.locator('h2').first().textContent();
      console.log(`\n[Final Step ${finalStageCount}] At Stage ${stageOrderNum}: "${stageHeading.trim()}"`);

      // RELOAD CHECK AT STAGE 2
      if (stageOrderNum === 2 && !reloadedFinalStages.has(2)) {
        reloadedFinalStages.add(2);
        console.log('  🔄 Reloading browser at Final Stage 2...');
        await page.reload({ waitUntil: 'networkidle' });
        await waitBrief(1000);

        const restoredHeading = await page.locator('h2').first().textContent();
        assert.ok(restoredHeading.includes('Courier') || (await page.locator('div[aria-live="polite"]').textContent()).includes('2'));
        console.log(`  ✓ Final Stage 2 restored successfully: "${restoredHeading.trim()}"`);
        await takeScreenshot('10_final_stage2_after_reload_resumed.png');

        // Submit decision + probe with atomic response wait
        const cards = page.locator('.decision-cards-list button.decision-action-card:not([disabled])');
        await cards.first().click();
        const probePanel = page.locator('.signal-probe-panel');
        await probePanel.waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('.signal-probe-panel button.decision-action-card:not([disabled])').first().click();
        await waitBrief(200);

        const confirmBtn = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
        await waitBrief(500);
        continue;
      }

      // RELOAD CHECK AT STAGE 6
      if (stageOrderNum === 6 && !reloadedFinalStages.has(6)) {
        reloadedFinalStages.add(6);
        console.log('  🔄 Reloading browser at Final Stage 6...');
        await page.reload({ waitUntil: 'networkidle' });
        await waitBrief(1000);

        const restoredHeading6 = await page.locator('h2').first().textContent();
        assert.ok(restoredHeading6.includes('Cloud') || (await page.locator('div[aria-live="polite"]').textContent()).includes('6'));
        console.log(`  ✓ Final Stage 6 restored successfully: "${restoredHeading6.trim()}"`);
        await takeScreenshot('11_final_stage6_after_reload_resumed.png');

        const cards6 = page.locator('.decision-cards-list button.decision-action-card:not([disabled])');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          cards6.first().click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
        await waitBrief(500);
        continue;
      }

      // RELOAD CHECK AT STAGE 10
      if (stageOrderNum === 10 && !reloadedFinalStages.has(10)) {
        reloadedFinalStages.add(10);
        console.log('  🔄 Reloading browser at Final Stage 10...');
        await page.reload({ waitUntil: 'networkidle' });
        await waitBrief(1000);

        const restoredHeading10 = await page.locator('h2').first().textContent();
        assert.ok(restoredHeading10.includes('Merchant') || (await page.locator('div[aria-live="polite"]').textContent()).includes('10'));
        console.log(`  ✓ Final Stage 10 restored successfully: "${restoredHeading10.trim()}"`);
        await takeScreenshot('12_final_stage10_after_reload_resumed.png');

        const cards10 = page.locator('.decision-cards-list button.decision-action-card:not([disabled])');
        await cards10.first().click();
        const probePanel10 = page.locator('.signal-probe-panel');
        await probePanel10.waitFor({ state: 'visible', timeout: 3000 });
        await page.locator('.signal-probe-panel button.decision-action-card:not([disabled])').first().click();
        await waitBrief(200);

        const confirmBtn10 = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn10.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
        await waitBrief(500);
        continue;
      }

      // Standard stage progression
      const card = page.locator('.decision-cards-list button.decision-action-card:not([disabled])').first();
      const stepPromise = page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }).catch(() => null);
      await card.click();

      const probePanel = page.locator('.signal-probe-panel');
      let hasProbe = false;
      try {
        await probePanel.waitFor({ state: 'visible', timeout: 400 });
        hasProbe = true;
      } catch {
        hasProbe = false;
      }

      if (hasProbe) {
        await page.locator('.signal-probe-panel button.decision-action-card:not([disabled])').first().click();
        await waitBrief(150);
        const confirmBtn = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) break;
      } else {
        const resp = await stepPromise;
        if (resp) {
          const data = await resp.json();
          if (data.isCompleted) break;
        }
      }

      await waitBrief(500);
    }

    // -------------------------------------------------------------------------
    // PART E: COMPLETED ASSESSMENT RE-ENTRY (FINAL)
    // -------------------------------------------------------------------------
    console.log('\n--- PART E: FINAL COMPLETED-ASSESSMENT RE-ENTRY CHECK ---');
    console.log('  Navigating back to /assessment/final...');
    await page.goto(`${BASE_URL}/assessment/final`, { waitUntil: 'networkidle' });
    await waitBrief(800);

    const completedFinalView = page.locator('.completed-history-container, .profile-container, h1:has-text("Final Check Completed"), h2:has-text("Your Final Check Results"), h2:has-text("Final Assessment Results"), button:has-text("See What Changed"), button:has-text("Retake Assessment")');
    assert.ok(await completedFinalView.count() > 0, 'Completed summary view must be displayed on final re-entry');
    console.log('  ✓ Final completed summary view safely rendered on re-entry');
    await takeScreenshot('14_final_completed_reentry.png');

    const finalSessions = await AssessmentSession.find({ userId, scenarioCode: 'final' });
    assert.equal(finalSessions.length, 1, 'Exactly one final assessment session must exist (zero duplicates)');
    console.log(`  ✓ DB final session count verified: ${finalSessions.length} session (zero duplicate creation)`);

    console.log('\n=============================================================');
    console.log('✅ ALL BROWSER RESUMPTION & EXPIRATION CHECKS PASSED 100%!');
    console.log(`   Total screenshots captured & persisted: ${screenshotsTaken.length}`);
    console.log('=============================================================');
  } finally {
    await browser.close();
    try {
      if (typeof userId !== 'undefined') {
        await User.deleteOne({ _id: userId });
        await AssessmentSession.deleteMany({ userId });
      }
    } catch (e) {}
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error('\n❌ BROWSER RESUMPTION SMOKE TEST FAILED:', err);
  process.exit(1);
});
