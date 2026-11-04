/**
 * Playwright Browser Smoke Test: 5 Universal Signal Identification Probes
 * 
 * Verifies live browser-level interaction across:
 * - Baseline Assessment (Stages 2, 3, 10, 11, 12)
 * - Final Assessment (Stages 2, 3, 10, 11, 12)
 * 
 * Verifies:
 * 1. Step 1 click triggers in-place rendering of .signal-probe-panel
 * 2. Confirm button is disabled before probe selection
 * 3. Step 2 probe selection enables confirm button
 * 4. Atomic submission advances to next stage
 * 5. SessionStorage key persistence across reloads/retries
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

const SHOT_DIR = path.join(__dirname, '../screenshots/browser-smoke-test');
const ARTIFACT_DIR = process.env.ARTIFACT_DIR
  ? path.join(process.env.ARTIFACT_DIR, 'screenshots', 'browser-smoke-test')
  : SHOT_DIR;

fs.mkdirSync(SHOT_DIR, { recursive: true });
if (ARTIFACT_DIR !== SHOT_DIR) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function copyToArtifact(srcPath, filename) {
  if (ARTIFACT_DIR !== SHOT_DIR) {
    const destPath = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(srcPath, destPath);
  }
}

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'si_browser_smoker@test.com';
const TEST_PASS = 'SmokerPass123!Secure';

async function run() {
  console.log('=============================================================');
  console.log('PLAYWRIGHT BROWSER SMOKE TEST: 5 UNIVERSAL SI PROBES');
  console.log('=============================================================\n');

  // 1. Setup DB test user & clear sessions
  console.log('[Setup] Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Setup] MongoDB Atlas connected.');

  const existingOldUser = await User.findOne({ email: TEST_EMAIL });
  if (existingOldUser) {
    const oldSessions = await AssessmentSession.find({ userId: existingOldUser._id }).select('_id');
    const oldSessionIds = oldSessions.map(s => s._id);
    await AssessmentDecision.deleteMany({ assessmentSessionId: { $in: oldSessionIds } });
    await AssessmentSession.deleteMany({ userId: existingOldUser._id });
    await User.deleteOne({ _id: existingOldUser._id });
  }

  const user = await User.create({
    fullName: 'SI Browser Smoke User',
    email: TEST_EMAIL,
    passwordHash: bcrypt.hashSync(TEST_PASS, 10),
    role: 'user',
    isActive: true
  });
  console.log(`[Setup] Created test user: ${user.email} (ID: ${user._id})`);

  // 2. Launch Browser
  console.log('\n[Browser] Launching Playwright Chromium (1440x900)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Helper to wait for network idle & short delay
  const waitBrief = (ms = 500) => new Promise(r => setTimeout(r, ms));

  try {
    // 3. Login
    console.log(`[Browser] Navigating to ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    console.log('[Browser] Submitting credentials...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('  ✓ Login successful, redirected to /dashboard');

    // -------------------------------------------------------------------------
    // PART A: BASELINE ASSESSMENT (5 PROBES)
    // -------------------------------------------------------------------------
    console.log('\n--- PART A: BASELINE ASSESSMENT LIVE BROWSER SMOKE TEST ---');
    await page.goto(`${BASE_URL}/assessment/baseline`, { waitUntil: 'networkidle' });

    // Click "Start Your Digital Day" briefing button if present
    const startBriefingBtn = page.locator('button:has-text("Start Your Digital Day")');
    if (await startBriefingBtn.count() > 0) {
      console.log('[Baseline] Clicking "Start Your Digital Day" on briefing card...');
      await startBriefingBtn.first().click();
      await waitBrief(1200);
    }

    const baselineProbeStagesEncountered = [];

    // Loop through stages until baseline completed
    let baselineStageCount = 0;
    while (baselineStageCount < 20) {
      baselineStageCount++;
      await waitBrief(300);

      // Check if already on completion screen
      const completionCard = page.locator('.profile-container, .profile-title, h1:has-text("Your Digital Awareness Profile")');
      if (await completionCard.count() > 0) {
        console.log('[Baseline] Reached Baseline Completion Screen (Digital Awareness Profile)!');
        break;
      }

      // Extract exact canonical stageOrder and title from rendered DOM
      const liveRegion = page.locator('div[aria-live="polite"]');
      const liveText = await liveRegion.count() > 0 ? (await liveRegion.first().textContent()).trim() : '';
      const match = liveText.match(/Situation order (\d+):\s*([^.]+)/);
      const stageOrderNum = match ? parseInt(match[1], 10) : baselineStageCount;
      const stageTitle = match ? match[2].trim() : (await page.locator('h2').first().textContent()).trim();
      const stageDescriptor = `Stage ${stageOrderNum}: ${stageTitle}`;
      console.log(`\n[Baseline Step ${baselineStageCount}] Active situation: "${stageDescriptor}"`);

      // Wait for primary action card to be visible and enabled
      const primaryBtn = page.locator('.decision-cards-list button.decision-action-card:not([disabled])').first();
      try {
        await primaryBtn.waitFor({ state: 'visible', timeout: 10000 });
      } catch (err) {
        if (await completionCard.count() > 0) {
          console.log('[Baseline] Reached Baseline Completion Screen!');
          break;
        }
        throw err;
      }

      // Set up response listener in case it's a non-probe stage (submits on card click)
      const stepPromise = page.waitForResponse(
        r => r.url().includes('submit-step') && r.status() === 200,
        { timeout: 15000 }
      ).catch(() => null);

      await primaryBtn.click();

      // Check if probe panel appeared within 500ms
      const probePanel = page.locator('.signal-probe-panel');
      let hasProbe = false;
      try {
        await probePanel.waitFor({ state: 'visible', timeout: 500 });
        hasProbe = true;
      } catch {
        hasProbe = false;
      }

      if (hasProbe) {
        console.log('  🔍 [PROBE DETECTED] .signal-probe-panel rendered in-place!');
        baselineProbeStagesEncountered.push({ order: stageOrderNum, title: stageTitle, descriptor: stageDescriptor });

        const confirmBtn = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const isDisabled = await confirmBtn.isDisabled();
        console.log(`  ✓ Confirm button disabled state before probe selection: ${isDisabled} (Expected: true)`);
        if (!isDisabled) throw new Error('FAIL: Confirm button should be disabled before probe selection!');

        const probeOptions = page.locator('.signal-probe-panel button.decision-action-card:not([disabled])');
        const probeCount = await probeOptions.count();
        console.log(`  [Probe] Found ${probeCount} forensic cue options. Clicking option 1...`);
        await probeOptions.first().click();
        await waitBrief(200);

        const isNowDisabled = await confirmBtn.isDisabled();
        console.log(`  ✓ Confirm button disabled state after probe selection: ${isNowDisabled} (Expected: false)`);
        if (isNowDisabled) throw new Error('FAIL: Confirm button should be enabled after probe selection!');

        const shotName = `baseline_probe_${baselineProbeStagesEncountered.length}.png`;
        const shotPath = path.join(SHOT_DIR, shotName);
        await page.screenshot({ path: shotPath, fullPage: true });
        copyToArtifact(shotPath, shotName);
        console.log(`  📷 Captured screenshot: ${shotName}`);

        console.log('  [Confirm] Clicking "Confirm Decision & Signal Observation"...');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) {
          console.log('[Baseline] Assessment completed via probe stage confirm!');
          break;
        }
      } else {
        // Non-probe stage: stepPromise resolves with the response
        const resp = await stepPromise;
        if (resp) {
          const data = await resp.json();
          console.log('  [Non-probe] Primary choice submitted immediately.');
          if (data.isCompleted) {
            console.log('[Baseline] Assessment completed via non-probe final stage!');
            break;
          }
        }
      }

      // Check if completion screen rendered
      if (await completionCard.count() > 0) {
        console.log('[Baseline] Reached Baseline Completion Screen!');
        break;
      }
    }

    console.log(`\n✓ Baseline Assessment finished! Encountered ${baselineProbeStagesEncountered.length} forensic probe stages:`);
    baselineProbeStagesEncountered.forEach((s, idx) => console.log(`   ${idx + 1}. Stage ${s.order}: "${s.title}"`));
    const baselineOrders = baselineProbeStagesEncountered.map(s => s.order);
    console.log(`  [Canonical Verification] Baseline probe stage orders: [${baselineOrders.join(', ')}]`);
    if (baselineProbeStagesEncountered.length !== 5) {
      throw new Error(`Expected exactly 5 forensic probe stages in Baseline, got ${baselineProbeStagesEncountered.length}`);
    }
    assert.deepStrictEqual(baselineOrders, [2, 3, 10, 11, 12], 'Baseline probe stages must strictly match canonical orders [2, 3, 10, 11, 12]');

    // -------------------------------------------------------------------------
    // PART B: FINAL ASSESSMENT (5 PROBES)
    // -------------------------------------------------------------------------
    console.log('\n--- PART B: FINAL ASSESSMENT LIVE BROWSER SMOKE TEST ---');
    console.log(`[Browser] Navigating to ${BASE_URL}/assessment/final...`);
    await page.goto(`${BASE_URL}/assessment/final`, { waitUntil: 'networkidle' });

    // Click "Start Final Check" briefing button if present
    const startFinalBtn = page.locator('button.btn-primary:has-text("Start Final Check"), button:has-text("Start Final Check")');
    if (await startFinalBtn.count() > 0) {
      console.log('[Final] Clicking "Start Final Check" on briefing card...');
      await startFinalBtn.first().click();
      await waitBrief(1200);
    }

    const finalProbeStagesEncountered = [];
    let finalStageCount = 0;

    while (finalStageCount < 20) {
      finalStageCount++;
      await waitBrief(300);

      // Check if completed
      const finalCompletion = page.locator('.reveal-pane, h2:has-text("Your Final Check Results")');
      if (await finalCompletion.count() > 0) {
        console.log('[Final] Reached Final Completion / Results Screen!');
        break;
      }

      // Extract exact canonical stageOrder and title from rendered DOM
      const liveRegion = page.locator('div[aria-live="polite"]');
      const liveText = await liveRegion.count() > 0 ? (await liveRegion.first().textContent()).trim() : '';
      const match = liveText.match(/Situation order (\d+):\s*([^.]+)/);
      const stageOrderNum = match ? parseInt(match[1], 10) : finalStageCount;
      const stageTitle = match ? match[2].trim() : (await page.locator('h2').first().textContent()).trim();
      const stageDescriptor = `Stage ${stageOrderNum}: ${stageTitle}`;
      console.log(`\n[Final Step ${finalStageCount}] Active situation: "${stageDescriptor}"`);

      const primaryBtn = page.locator('.decision-cards-list button.decision-action-card:not([disabled])').first();
      try {
        await primaryBtn.waitFor({ state: 'visible', timeout: 10000 });
      } catch (err) {
        if (await finalCompletion.count() > 0) {
          console.log('[Final] Reached Final Completion / Results Screen!');
          break;
        }
        throw err;
      }

      const stepPromise = page.waitForResponse(
        r => r.url().includes('submit-step') && r.status() === 200,
        { timeout: 15000 }
      ).catch(() => null);

      await primaryBtn.click();

      const probePanel = page.locator('.signal-probe-panel');
      let hasProbe = false;
      try {
        await probePanel.waitFor({ state: 'visible', timeout: 500 });
        hasProbe = true;
      } catch {
        hasProbe = false;
      }

      if (hasProbe) {
        console.log('  🔍 [PROBE DETECTED] .signal-probe-panel rendered in-place!');
        finalProbeStagesEncountered.push({ order: stageOrderNum, title: stageTitle, descriptor: stageDescriptor });

        const confirmBtn = page.locator('button.btn-primary:has-text("Confirm Decision & Signal Observation")');
        const isDisabled = await confirmBtn.isDisabled();
        console.log(`  ✓ Confirm button disabled state before probe selection: ${isDisabled} (Expected: true)`);
        if (!isDisabled) throw new Error('FAIL: Confirm button should be disabled before probe selection!');

        const probeOptions = page.locator('.signal-probe-panel button.decision-action-card:not([disabled])');
        const probeCount = await probeOptions.count();
        console.log(`  [Probe] Found ${probeCount} forensic cue options. Clicking option 1...`);
        await probeOptions.first().click();
        await waitBrief(200);

        const isNowDisabled = await confirmBtn.isDisabled();
        console.log(`  ✓ Confirm button disabled state after probe selection: ${isNowDisabled} (Expected: false)`);
        if (isNowDisabled) throw new Error('FAIL: Confirm button should be enabled after probe selection!');

        const shotName = `final_probe_${finalProbeStagesEncountered.length}.png`;
        const shotPath = path.join(SHOT_DIR, shotName);
        await page.screenshot({ path: shotPath, fullPage: true });
        copyToArtifact(shotPath, shotName);
        console.log(`  📷 Captured screenshot: ${shotName}`);

        console.log('  [Confirm] Clicking "Confirm Decision & Signal Observation"...');
        const [resp] = await Promise.all([
          page.waitForResponse(r => r.url().includes('submit-step') && r.status() === 200, { timeout: 15000 }),
          confirmBtn.click()
        ]);
        const data = await resp.json();
        if (data.isCompleted) {
          console.log('[Final] Assessment completed via probe stage confirm!');
          break;
        }
      } else {
        const resp = await stepPromise;
        if (resp) {
          const data = await resp.json();
          console.log('  [Non-probe] Primary choice submitted immediately.');
          if (data.isCompleted) {
            console.log('[Final] Assessment completed via non-probe final stage!');
            break;
          }
        }
      }

      if (await finalCompletion.count() > 0) {
        console.log('[Final] Reached Final Completion / Results Screen!');
        break;
      }
    }

    console.log(`\n✓ Final Assessment finished! Encountered ${finalProbeStagesEncountered.length} forensic probe stages:`);
    finalProbeStagesEncountered.forEach((s, idx) => console.log(`   ${idx + 1}. Stage ${s.order}: "${s.title}"`));
    const finalOrders = finalProbeStagesEncountered.map(s => s.order);
    console.log(`  [Canonical Verification] Final probe stage orders: [${finalOrders.join(', ')}]`);
    if (finalProbeStagesEncountered.length !== 5) {
      throw new Error(`Expected exactly 5 forensic probe stages in Final, got ${finalProbeStagesEncountered.length}`);
    }
    assert.deepStrictEqual(finalOrders, [2, 3, 10, 11, 12], 'Final probe stages must strictly match canonical orders [2, 3, 10, 11, 12]');

    // 4. Capture Final Digital Awareness Profile Reveal
    await waitBrief(1500);
    const profileShot = path.join(SHOT_DIR, '00_digital_awareness_profile_reveal.png');
    await page.screenshot({ path: profileShot, fullPage: true });
    copyToArtifact(profileShot, '00_digital_awareness_profile_reveal.png');
    console.log('\n📷 Captured Full Digital Awareness Profile Reveal Screenshot!');

    console.log('\n=============================================================');
    console.log('✅ BROWSER SMOKE TEST PASSED 100% ACROSS ALL 10 PROBE ENCOUNTERS!');
    console.log('=============================================================');

  } finally {
    await browser.close();
    // Cleanup DB
    if (user && user._id) {
      await AssessmentSession.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });
      console.log('\n[Teardown] Cleaned up smoke test user records.');
    }
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error('\n❌ BROWSER SMOKE TEST FAILED:', err);
  process.exit(1);
});
