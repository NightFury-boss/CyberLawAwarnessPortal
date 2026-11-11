/**
 * Phase 3 Visual Acceptance Verification Script
 *
 * Captures comprehensive desktop (1440px) and mobile (375px) screenshots for:
 * 1. Recommendation Cards (Dimension badges, evidence explanations, why it matters, curriculum links)
 * 2. Pathway Step 1: Real Story / Case Study (Incident narrative and decision choices)
 * 3. Pathway Step 2: Safety Rule & 4 Defensive Pillars (Structured defense + curriculum deep dive)
 * 4. Pathway Step 3: Interactive Checkpoint (3 scenario questions with 67% pass threshold)
 * 5. Checkpoint Completion & Feedback (Evaluation outcome, explanations, completed status)
 * 6. Connected Curriculum Integration (Deep-link curriculum module view)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const express = require('../server/node_modules/express');

const app = require('../server/server');
const User = require('../server/models/User');
const UserProgress = require('../server/models/UserProgress');

const SHOT_DIR = path.join(__dirname, '../screenshots/phase3-acceptance');
const ARTIFACT_DIR = process.env.ARTIFACT_DIR
  ? path.join(process.env.ARTIFACT_DIR, 'screenshots', 'phase3-acceptance')
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

async function startServer() {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const assignedPort = server.address().port;
      console.log(`[Unified Server] Serving frontend + API on http://127.0.0.1:${assignedPort}`);
      resolve({ server, port: assignedPort });
    });
  });
}

const VIEWPORTS = [
  { name: 'desktop_1440px', width: 1440, height: 900 },
  { name: 'mobile_375px', width: 375, height: 812 }
];

async function run() {
  console.log('=== STARTING PHASE 3 VISUAL ACCEPTANCE RUNNER ===\n');

  let serverObj;
  let browser;
  let demoUser = null;
  let originalCompletedPathways = undefined;

  try {
    const { server, port } = await startServer();
    serverObj = server;

    // Save and reset demo user's pathway completion state so interactive journey runs from Step 1 cleanly
    demoUser = await User.findOne({ email: 'demo.returning@cyberlawportal.in' });
    if (demoUser) {
      const demoProgress = await UserProgress.findOne({ userId: demoUser._id });
      originalCompletedPathways = demoProgress ? demoProgress.completedPathways : [];
      await UserProgress.updateOne(
        { userId: demoUser._id },
        { $pull: { completedPathways: { pathwayId: 'pathway-ua-upi-consent' } } }
      );
      console.log('  * Reset pathway progress for clean end-to-end interactive capture.');
    }

    browser = await chromium.launch({ headless: true });

    for (const vp of VIEWPORTS) {
      console.log(`\n======================================================`);
      console.log(`VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`======================================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();

      // 1. Authenticate
      console.log('1. Authenticating as demo.returning@cyberlawportal.in...');
      await page.goto(`http://127.0.0.1:${port}/login`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', 'demo.returning@cyberlawportal.in');
      await page.fill('input[type="password"]', 'Password@123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('  * Successfully logged in.');

      // 2. Navigate to Digital Awareness Profile / Assessment Baseline
      console.log('2. Navigating to /assessment/baseline for Digital Awareness Profile...');
      await page.goto(`http://127.0.0.1:${port}/assessment/baseline`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);

      // Screenshot 1: Recommendation Cards Section
      const cardsSelector = '.remediation-card, .remediation-section, #heading-remediation';
      await page.waitForSelector(cardsSelector, { timeout: 15000 });
      const cardsEl = await page.$(cardsSelector);
      if (cardsEl) {
        await cardsEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(600);
      }

      const shot1Name = `01_recommendation_cards_${vp.name}.png`;
      const shot1Path = path.join(SHOT_DIR, shot1Name);
      await page.screenshot({ path: shot1Path, fullPage: false });
      copyToArtifact(shot1Path, shot1Name);
      console.log(`  * Saved: ${shot1Name}`);

      // 3. Open PathwayRunner by clicking first CTA button on recommendation cards
      console.log('3. Opening PathwayRunner modal...');
      const ctaBtn = page.locator('.remediation-card button.btn-primary').first();
      await ctaBtn.waitFor({ state: 'visible', timeout: 10000 });
      const ctaText = await ctaBtn.textContent();
      console.log(`  * Clicking CTA: "${ctaText.trim()}"`);
      await ctaBtn.click();

      await page.waitForSelector('.pathway-runner-modal', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Switch to Step 1 if not on Step 1
      const tab1 = await page.$('#pathway-stage-tab-1');
      if (tab1) {
        await tab1.click().catch(() => {});
        await page.waitForTimeout(600);
      }

      // Screenshot 2: Pathway Step 1 (Real Story / Case Study)
      const shot2Name = `02_pathway_step1_case_study_${vp.name}.png`;
      const shot2Path = path.join(SHOT_DIR, shot2Name);
      await page.screenshot({ path: shot2Path, fullPage: false });
      copyToArtifact(shot2Path, shot2Name);
      console.log(`  * Saved: ${shot2Name}`);

      // Interact with Step 1 decision and submit
      console.log('4. Completing Step 1 interactive decision...');
      const step1Radios = await page.$$('#pathway-stage-panel-1 button[role="radio"]');
      if (step1Radios.length > 0) {
        const firstRadio = step1Radios[0];
        const isDis = await firstRadio.isDisabled();
        if (!isDis) {
          await firstRadio.click();
          await page.waitForTimeout(400);

          const submitChoiceBtn = await page.$('#pathway-stage-panel-1 button.btn-primary');
          if (submitChoiceBtn && !(await submitChoiceBtn.isDisabled())) {
            await submitChoiceBtn.click();
            await page.waitForTimeout(800);
          }
        }
      }

      const continueToStep2 = await page.$('button:has-text("Continue to Step 2"), button:has-text("Safety Rule"), #pathway-stage-tab-2');
      if (continueToStep2 && !(await continueToStep2.isDisabled())) {
        await continueToStep2.click();
        await page.waitForTimeout(800);
      }

      // Screenshot 3: Pathway Step 2 (Practical Defense, 4 Pillars, Curriculum Deep Dive)
      const shot3Name = `03_pathway_step2_prevention_pillars_${vp.name}.png`;
      const shot3Path = path.join(SHOT_DIR, shot3Name);
      await page.screenshot({ path: shot3Path, fullPage: false });
      copyToArtifact(shot3Path, shot3Name);
      console.log(`  * Saved: ${shot3Name}`);

      // Step 2 Acknowledge & proceed to Step 3
      console.log('5. Acknowledging rule and proceeding to Step 3 Checkpoint...');
      const step2AckBtn = await page.$('#pathway-stage-panel-2 button.btn-primary');
      if (step2AckBtn && !(await step2AckBtn.isDisabled())) {
        await step2AckBtn.click();
        await page.waitForTimeout(1500);
      } else {
        const tab3 = await page.$('#pathway-stage-tab-3');
        if (tab3 && !(await tab3.isDisabled())) {
          await tab3.click();
          await page.waitForTimeout(1000);
        }
      }

      // Wait for Step 3 panel
      await page.waitForSelector('#pathway-stage-panel-3', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);

      // Screenshot 4: Pathway Step 3 (Checkpoint Quiz Questions)
      const shot4Name = `04_pathway_step3_checkpoint_quiz_${vp.name}.png`;
      const shot4Path = path.join(SHOT_DIR, shot4Name);
      await page.screenshot({ path: shot4Path, fullPage: false });
      copyToArtifact(shot4Path, shot4Name);
      console.log(`  * Saved: ${shot4Name}`);

      // 6. Answer checkpoint questions with correct answers (Q1: 1, Q2: 1, Q3: 0)
      console.log('6. Answering checkpoint questions...');
      const correctIndices = [1, 1, 0];
      const radiogroups = await page.$$('#pathway-stage-panel-3 div[role="radiogroup"]');
      for (let i = 0; i < radiogroups.length; i++) {
        const optionButtons = await radiogroups[i].$$('button[role="radio"]');
        const targetIdx = correctIndices[i] !== undefined && optionButtons[correctIndices[i]] ? correctIndices[i] : 0;
        if (optionButtons[targetIdx] && !(await optionButtons[targetIdx].isDisabled())) {
          await optionButtons[targetIdx].click();
          await page.waitForTimeout(300);
        }
      }

      const submitQuizBtn = await page.$('button:has-text("Submit Quiz Answers")');
      if (submitQuizBtn && !(await submitQuizBtn.isDisabled())) {
        await submitQuizBtn.click();
        await page.waitForTimeout(2000);
      }

      // Screenshot 5: Checkpoint Feedback View
      const shot5Name = `05_checkpoint_feedback_${vp.name}.png`;
      const shot5Path = path.join(SHOT_DIR, shot5Name);
      await page.screenshot({ path: shot5Path, fullPage: false });
      copyToArtifact(shot5Path, shot5Name);
      console.log(`  * Saved: ${shot5Name}`);

      // 7. Navigate to Connected Curriculum Module
      console.log('7. Navigating to connected curriculum module (/modules?slug=upi-qr-payment-fraud)...');
      await page.goto(`http://127.0.0.1:${port}/modules?slug=upi-qr-payment-fraud`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Screenshot 6: Curriculum Module Deep-Dive View
      const shot6Name = `06_curriculum_integration_${vp.name}.png`;
      const shot6Path = path.join(SHOT_DIR, shot6Name);
      await page.screenshot({ path: shot6Path, fullPage: false });
      copyToArtifact(shot6Path, shot6Name);
      console.log(`  * Saved: ${shot6Name}`);

      await context.close();
    }

    console.log('\n✔ ALL 12 VISUAL ACCEPTANCE SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Visual acceptance failed:', err);
    process.exitCode = 1;
  } finally {
    if (demoUser && originalCompletedPathways !== undefined) {
      try {
        await UserProgress.updateOne(
          { userId: demoUser._id },
          { $set: { completedPathways: originalCompletedPathways } }
        );
        console.log('  * Restored demo user pathway progress.');
      } catch (restoreErr) {
        console.error('Failed to restore demo user progress:', restoreErr);
      }
    }
    if (browser) await browser.close();
    if (serverObj) {
      await new Promise((resolve) => serverObj.close(resolve));
      console.log('[Server] Shutdown cleanly.');
    }
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

run();
