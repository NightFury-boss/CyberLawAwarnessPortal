const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const { auditScenario } = require('../services/scenarioIntegrityService');

const PORT = 5998;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let userToken = '';
let userId = '';

async function setup() {
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[Test Server] Listening on port ${PORT}`);
      resolve();
    });
  });

  const testEmail = 'digital_day_tester@test.com';
  await User.deleteOne({ email: testEmail });
  const user = await User.create({
    fullName: 'Digital Day Test User',
    email: testEmail,
    passwordHash: bcrypt.hashSync('TestPass123!', 10),
    role: 'user',
    isActive: true
  });
  userId = user._id;

  // Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'TestPass123!' })
  });
  const loginData = await loginRes.json();
  userToken = loginData.token;
}

async function teardown() {
  try {
    if (userId) {
      await AssessmentSession.deleteMany({ userId });
      await User.deleteOne({ _id: userId });
    }
  } catch (err) {
    console.error('Error cleaning up test user records:', err.message);
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('[Test Server] Stopped.');
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Mongoose connection closed.');
  }
}

async function runAllTests() {
  console.log('\n==================================================');
  console.log('PHASE 2.3: "YOUR DIGITAL DAY" COMPREHENSIVE TEST SUITE');
  console.log('==================================================\n');

  try {
    await setup();

    const finalV2 = await Scenario.findOne({ slug: 'final', version: 2 });
    if (!finalV2) throw new Error('Final scenario version 2 not found in DB!');

    const baselineV2 = await Scenario.findOne({ slug: 'baseline', version: 2 });
    if (!baselineV2) throw new Error('Baseline scenario version 2 not found in DB!');

    console.log(`Verified Production Scenarios:`);
    console.log(`- Final v2 ID: ${finalV2._id} ("${finalV2.title}")`);
    console.log(`- Baseline v2 ID: ${baselineV2._id} ("${baselineV2.title}")`);

    // Helper to start session
    async function startSession(code, version = 2) {
      const res = await fetch(`${BASE_URL}/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ scenarioCode: code, scenarioVersion: version })
      });
      const data = await res.json();
      if (res.status !== 200) throw new Error(`Failed to start session: ${data.error?.message || data.message}`);
      return data;
    }

    // Helper to submit step
    async function submitStep(sessionId, stageId, decisionId, extras = {}) {
      const res = await fetch(`${BASE_URL}/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          assessmentSessionId: sessionId,
          stageId,
          decisionId,
          ...extras
        })
      });
      const data = await res.json();
      return { status: res.status, data };
    }

    // ----------------------------------------------------
    // TEST A: SAFE PATH TRAVERSAL
    // 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7A -> 8A -> 9 -> 10 -> 11 -> 12 -> 13
    // ----------------------------------------------------
    console.log('\n[TEST A] Testing Safe Path Traversal (7A -> 8A)...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      // Stage 1: Salary Credit -> 1A (Acknowledge)
      let decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec1A = decs.find(d => d.optionText.includes('Acknowledge'));
      let step1 = await submitStep(sessionId, curStage.id, dec1A._id);
      if (step1.status !== 200) throw new Error(`Stage 1 submit failed: ${JSON.stringify(step1.data)}`);
      curStage = step1.data.stage;
      if (curStage.title !== 'SpeedPost Delivery Notice') throw new Error(`Expected Stage 2, got ${curStage.title}`);

      // Stage 2: SpeedPost -> 2B (Open official India Post)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec2B = decs.find(d => d.optionText.includes('Open the official India Post'));
      let step2 = await submitStep(sessionId, curStage.id, dec2B._id);
      curStage = step2.data.stage;
      if (curStage.title !== 'Freelance Career Inquiry') throw new Error(`Expected Stage 3, got ${curStage.title}`);

      // Stage 3: Freelance -> 3B (Decline upfront payment & verify on portal)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec3B = decs.find(d => d.optionText.includes('Decline the upfront payment'));
      let step3 = await submitStep(sessionId, curStage.id, dec3B._id);
      curStage = step3.data.stage;
      if (curStage.title !== 'UPI Cashback Collect Request') throw new Error(`Expected Stage 4, got ${curStage.title}`);

      // Stage 4: UPI Cashback -> 4C (Decline and report VPA)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec4C = decs.find(d => d.optionText.includes('report the unknown VPA'));
      let step4 = await submitStep(sessionId, curStage.id, dec4C._id);
      curStage = step4.data.stage;
      if (curStage.title !== 'New Browser Sign-In Prompt') throw new Error(`Expected Stage 5, got ${curStage.title}`);

      // Stage 5: Google Sign-in -> 5A (Review device, Yes it's me)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec5A = decs.find(d => d.optionText.includes('Review device and location'));
      let step5 = await submitStep(sessionId, curStage.id, dec5A._id);
      curStage = step5.data.stage;
      if (curStage.title !== 'Document Scanner Permissions') throw new Error(`Expected Stage 6, got ${curStage.title}`);

      // Stage 6: Scanner Permissions -> 6B (Camera only)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec6B = decs.find(d => d.optionText.includes('allow Camera only'));
      let step6 = await submitStep(sessionId, curStage.id, dec6B._id);
      curStage = step6.data.stage;
      if (curStage.title !== 'Telecom Disconnection Call') throw new Error(`Expected Stage 7, got ${curStage.title}`);

      // Stage 7: Telecom IVR -> 7A (Hang up and check with telecom customer care)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec7A = decs.find(d => d.optionText.includes('official customer care'));
      let step7 = await submitStep(sessionId, curStage.id, dec7A._id);
      curStage = step7.data.stage;
      if (curStage.title !== 'E-Commerce Order Dispatched') {
        throw new Error(`Branching failure: 7A must route to Stage 8A (E-Commerce Order Dispatched), got: ${curStage.title}`);
      }

      // Stage 8A: E-Commerce Dispatch -> 8AA (Review order status normally)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec8AA = decs.find(d => d.optionText.includes('Review order status and delivery date'));
      let step8 = await submitStep(sessionId, curStage.id, dec8AA._id);
      curStage = step8.data.stage;
      if (curStage.title !== 'Cafe Counter QR Sticker') throw new Error(`Expected Stage 9, got ${curStage.title}`);

      // Stage 9: Cafe QR -> 9B (Notice merchant mismatch & alert staff)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec9B = decs.find(d => d.optionText.includes('Notice merchant name mismatch'));
      let step9 = await submitStep(sessionId, curStage.id, dec9B._id);
      curStage = step9.data.stage;
      if (curStage.title !== 'Streaming Auto-Renewal') throw new Error(`Expected Stage 10, got ${curStage.title}`);

      // Stage 10: Streaming Renewal -> 10B (Spot fake sender domain & verify inside app)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec10B = decs.find(d => d.optionText.includes('Spot fake sender domain'));
      let step10 = await submitStep(sessionId, curStage.id, dec10B._id);
      curStage = step10.data.stage;
      if (curStage.title !== "Friend's Emergency Medical Transfer") throw new Error(`Expected Stage 11, got ${curStage.title}`);

      // Stage 11: Friend Emergency -> 11B (Contact friend via normal cellular phone number)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec11B = decs.find(d => d.optionText.includes('normal cellular phone number'));
      let step11 = await submitStep(sessionId, curStage.id, dec11B._id);
      curStage = step11.data.stage;
      if (curStage.title !== 'OS Critical Patch Notification') throw new Error(`Expected Stage 12, got ${curStage.title}`);

      // Stage 12: OS Patch -> 12A (Schedule or install official update)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec12A = decs.find(d => d.optionText.includes('Schedule or install official'));
      let step12 = await submitStep(sessionId, curStage.id, dec12A._id);
      curStage = step12.data.stage;
      if (curStage.title !== 'Evening Closure') throw new Error(`Expected Stage 13, got ${curStage.title}`);

      // Stage 13: Evening Closure -> 13A (Terminal node, zero scoring)
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec13A = decs[0];
      let step13 = await submitStep(sessionId, curStage.id, dec13A._id);
      if (!step13.data.isCompleted) throw new Error('Stage 13 did not complete assessment!');

      const finalReport = step13.data;
      console.log(`  * Final Safe Path Completed! Score: ${finalReport.score}/100`);
      console.log(`  * Behaviour Scores:`, finalReport.behaviourScores);
      console.log(`  * Opportunities:`, finalReport.behaviourOpportunities);

      // Verify Safe Path Opportunities match approved specification:
      // TR Max = 14, SI Max = 8, VB Max = 14, DQ Max = 24, FP Max = 8, UA Max = 6
      if (finalReport.behaviourOpportunities.recognition !== 14) throw new Error(`Safe Path TR Max expected 14, got ${finalReport.behaviourOpportunities.recognition}`);
      if (finalReport.behaviourOpportunities.signalIdentification !== 8) throw new Error(`Safe Path SI Max expected 8, got ${finalReport.behaviourOpportunities.signalIdentification}`);
      if (finalReport.behaviourOpportunities.verification !== 14) throw new Error(`Safe Path VB Max expected 14, got ${finalReport.behaviourOpportunities.verification}`);
      if (finalReport.behaviourOpportunities.decisionQuality !== 24) throw new Error(`Safe Path DQ Max expected 24, got ${finalReport.behaviourOpportunities.decisionQuality}`);
      if (finalReport.behaviourOpportunities.falsePositive !== 8) throw new Error(`Safe Path FP Max Penalty expected 8, got ${finalReport.behaviourOpportunities.falsePositive}`);
      if (finalReport.behaviourOpportunities.unreviewedAcceptance !== 6) throw new Error(`Safe Path UA Max Penalty expected 6, got ${finalReport.behaviourOpportunities.unreviewedAcceptance}`);

      // Optimal choices: 100% across all metrics
      if (finalReport.behaviourScores.recognition !== 100) throw new Error(`Safe Path TR expected 100%, got ${finalReport.behaviourScores.recognition}`);
      if (finalReport.behaviourScores.verification !== 100) throw new Error(`Safe Path VB expected 100%, got ${finalReport.behaviourScores.verification}`);
      if (finalReport.behaviourScores.decisionQuality !== 100) throw new Error(`Safe Path DQ expected 100%, got ${finalReport.behaviourScores.decisionQuality}`);
      if (finalReport.falsePositivePenaltyPoints !== 0) throw new Error(`Safe Path FP penalties expected 0, got ${finalReport.falsePositivePenaltyPoints}`);
      if (finalReport.unreviewedAcceptancePenaltyPoints !== 0) throw new Error(`Safe Path UA penalties expected 0, got ${finalReport.unreviewedAcceptancePenaltyPoints}`);

      console.log('  * PASS: Safe Path traversal & opportunity matrix 100% verified');
    }

    // ----------------------------------------------------
    // TEST B: RISKY PATH TRAVERSAL
    // 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7B -> 8B -> 9 -> 10 -> 11 -> 12 -> 13
    // ----------------------------------------------------
    console.log('\n[TEST B] Testing Risky Path Traversal (7B -> 8B)...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      // Fast-forward stages 1 to 6 using optimal choices
      for (let s = 1; s <= 6; s++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const dec = decs[0]; // Choose any valid option
        const res = await submitStep(sessionId, curStage.id, dec._id);
        curStage = res.data.stage;
      }
      if (curStage.title !== 'Telecom Disconnection Call') throw new Error(`Expected Stage 7, got ${curStage.title}`);

      // Stage 7: Choose 7B (Press 9 in panic) -> Must route to Stage 8B
      const decs7 = await ScenarioDecision.find({ stageId: curStage.id });
      const dec7B = decs7.find(d => d.optionText.includes('Press 9 in panic'));
      const step7 = await submitStep(sessionId, curStage.id, dec7B._id);
      curStage = step7.data.stage;
      if (curStage.title !== 'Digital Arrest Video Demand') {
        throw new Error(`Branching failure: 7B must route to Stage 8B (Digital Arrest Video Demand), got: ${curStage.title}`);
      }

      // Stage 8B: Choose 8BA (Disconnect & report) -> Must route to Stage 9 (Cafe QR)
      const decs8B = await ScenarioDecision.find({ stageId: curStage.id });
      const dec8BA = decs8B.find(d => d.optionText.includes('Disconnect call immediately and report'));
      const step8 = await submitStep(sessionId, curStage.id, dec8BA._id);
      curStage = step8.data.stage;
      if (curStage.title !== 'Cafe Counter QR Sticker') {
        throw new Error(`Routing failure: 8BA must route to Stage 9 (Cafe Counter QR Sticker), got: ${curStage.title}`);
      }

      // Fast-forward remaining stages 9 to 13
      for (let s = 9; s <= 12; s++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const res = await submitStep(sessionId, curStage.id, decs[0]._id);
        curStage = res.data.stage;
      }
      const decs13 = await ScenarioDecision.find({ stageId: curStage.id });
      const finalStep = await submitStep(sessionId, curStage.id, decs13[0]._id);
      if (!finalStep.data.isCompleted) throw new Error('Risky Path did not complete!');

      const report = finalStep.data;
      console.log(`  * Risky Path Completed! Scores:`, report.behaviourScores);
      console.log(`  * Opportunities:`, report.behaviourOpportunities);

      // Verify Risky Path Opportunities match approved specification:
      // TR Max = 16, SI Max = 8, VB Max = 16, DQ Max = 24, FP Max = 6, UA Max = 6
      if (report.behaviourOpportunities.recognition !== 16) throw new Error(`Risky Path TR Max expected 16, got ${report.behaviourOpportunities.recognition}`);
      if (report.behaviourOpportunities.signalIdentification !== 8) throw new Error(`Risky Path SI Max expected 8, got ${report.behaviourOpportunities.signalIdentification}`);
      if (report.behaviourOpportunities.verification !== 16) throw new Error(`Risky Path VB Max expected 16, got ${report.behaviourOpportunities.verification}`);
      if (report.behaviourOpportunities.decisionQuality !== 24) throw new Error(`Risky Path DQ Max expected 24, got ${report.behaviourOpportunities.decisionQuality}`);
      if (report.behaviourOpportunities.falsePositive !== 6) throw new Error(`Risky Path FP Max Penalty expected 6 (Stage 8A skipped), got ${report.behaviourOpportunities.falsePositive}`);
      if (report.behaviourOpportunities.unreviewedAcceptance !== 6) throw new Error(`Risky Path UA Max Penalty expected 6, got ${report.behaviourOpportunities.unreviewedAcceptance}`);

      console.log('  * PASS: Risky Path traversal & opportunity matrix 100% verified');
    }

    // ----------------------------------------------------
    // TEST C: STAGE 7C TRAVERSAL
    // 7C (Cautious disengagement without verification) -> Routes to 8A
    // ----------------------------------------------------
    console.log('\n[TEST C] Testing Stage 7C Traversal (Cautious Disengagement -> 8A)...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      for (let s = 1; s <= 6; s++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const res = await submitStep(sessionId, curStage.id, decs[0]._id);
        curStage = res.data.stage;
      }
      const decs7 = await ScenarioDecision.find({ stageId: curStage.id });
      const dec7C = decs7.find(d => d.optionText.includes('without independent verification'));
      const step7C = await submitStep(sessionId, curStage.id, dec7C._id);
      curStage = step7C.data.stage;
      if (curStage.title !== 'E-Commerce Order Dispatched') {
        throw new Error(`Branching failure: 7C must route to Stage 8A, got: ${curStage.title}`);
      }
      console.log('  * PASS: Stage 7C correctly routed to Stage 8A');
    }

    // ----------------------------------------------------
    // TEST D: OVER-REPORTING BEHAVIOUR (FP PENALTY ACCUMULATION)
    // ----------------------------------------------------
    console.log('\n[TEST D] Testing Over-Reporting Behaviour (FP Penalty Points)...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      // Stage 1 (Legitimate): Choose 1B (Report SMS as fraud) -> +2 FP Penalty
      let decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec1B = decs.find(d => d.optionText.includes('Report SMS as fraud'));
      let res = await submitStep(sessionId, curStage.id, dec1B._id);
      curStage = res.data.stage;

      // Stages 2-4: Pick neutral choices
      for (let s = 2; s <= 4; s++) {
        decs = await ScenarioDecision.find({ stageId: curStage.id });
        res = await submitStep(sessionId, curStage.id, decs[0]._id);
        curStage = res.data.stage;
      }

      // Stage 5 (Legitimate): Choose 5B (Panicked click on No) -> +2 FP Penalty
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec5B = decs.find(d => d.optionText.includes('No, secure account'));
      res = await submitStep(sessionId, curStage.id, dec5B._id);
      curStage = res.data.stage;

      // Stages 6-7: Pick safe choice 7A to reach 8A
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      res = await submitStep(sessionId, curStage.id, decs[0]._id); // Stage 6
      curStage = res.data.stage;
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec7A = decs.find(d => d.optionText.includes('official customer care'));
      res = await submitStep(sessionId, curStage.id, dec7A._id); // Stage 7 -> 8A
      curStage = res.data.stage;

      // Stage 8A (Legitimate): Choose 8AB (Report dispatch email as phishing) -> +2 FP Penalty
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec8AB = decs.find(d => d.optionText.includes('Report dispatch confirmation'));
      res = await submitStep(sessionId, curStage.id, dec8AB._id);
      curStage = res.data.stage;

      // Stages 9-11: Pick neutral choices
      for (let s = 9; s <= 11; s++) {
        decs = await ScenarioDecision.find({ stageId: curStage.id });
        res = await submitStep(sessionId, curStage.id, decs[0]._id);
        curStage = res.data.stage;
      }

      // Stage 12 (Legitimate): Choose 12B (Block update service as potential spyware) -> +2 FP Penalty
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec12B = decs.find(d => d.optionText.includes('Block update service'));
      res = await submitStep(sessionId, curStage.id, dec12B._id);
      curStage = res.data.stage;

      // Stage 13: Terminal
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let finalRes = await submitStep(sessionId, curStage.id, decs[0]._id);

      const fpScore = finalRes.data.behaviourScores.falsePositive;
      const fpPenalty = finalRes.data.falsePositivePenaltyPoints;
      const fpMaxPenalty = finalRes.data.falsePositiveMaxPenaltyPoints;

      console.log(`  * FP Penalty Points: ${fpPenalty}/${fpMaxPenalty} | Normalized Score: ${fpScore}%`);
      if (fpPenalty !== 8) throw new Error(`Expected exactly 8 FP penalty points, got ${fpPenalty}`);
      if (fpMaxPenalty !== 8) throw new Error(`Expected exactly 8 FP max penalty points, got ${fpMaxPenalty}`);
      if (fpScore !== 0) throw new Error(`Expected 0% FP score after maximum false positives, got ${fpScore}%`);

      console.log('  * PASS: FP over-reporting penalty points correctly calculated');
    }

    // ----------------------------------------------------
    // TEST E: AUTOPILOT BEHAVIOUR (UA PENALTY ACCUMULATION)
    // ----------------------------------------------------
    console.log('\n[TEST E] Testing Autopilot Behaviour (UA Penalty Points)...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      // Stages 1-3: neutral
      for (let s = 1; s <= 3; s++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const res = await submitStep(sessionId, curStage.id, decs[0]._id);
        curStage = res.data.stage;
      }

      // Stage 4 (UPI Cashback): Choose 4A (Enter UPI PIN blindly) -> +2 UA Penalty, Critical Mistake!
      let decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec4A = decs.find(d => d.optionText.includes('Enter UPI PIN'));
      let res = await submitStep(sessionId, curStage.id, dec4A._id);
      curStage = res.data.stage;

      // Stage 5: neutral
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      res = await submitStep(sessionId, curStage.id, decs[0]._id);
      curStage = res.data.stage;

      // Stage 6 (Scanner Permissions): Choose 6A (Allow All Permissions) -> +2 UA Penalty
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec6A = decs.find(d => d.optionText.includes('Allow All Permissions'));
      res = await submitStep(sessionId, curStage.id, dec6A._id);
      curStage = res.data.stage;

      // Stages 7-8: Route to 9
      for (let s = 7; s <= 8; s++) {
        decs = await ScenarioDecision.find({ stageId: curStage.id });
        res = await submitStep(sessionId, curStage.id, decs[0]._id);
        curStage = res.data.stage;
      }

      // Stage 9 (Cafe QR): Choose 9A (Pay without reviewing merchant) -> +2 UA Penalty
      decs = await ScenarioDecision.find({ stageId: curStage.id });
      let dec9A = decs.find(d => d.optionText.includes('pay without reviewing'));
      res = await submitStep(sessionId, curStage.id, dec9A._id);
      curStage = res.data.stage;

      // Fast-forward remaining stages to completion
      for (let s = 10; s <= 13; s++) {
        decs = await ScenarioDecision.find({ stageId: curStage.id });
        res = await submitStep(sessionId, curStage.id, decs[0]._id);
        if (res.data.stage) curStage = res.data.stage;
      }

      const uaScore = res.data.behaviourScores.unreviewedAcceptance;
      const uaPenalty = res.data.unreviewedAcceptancePenaltyPoints;
      const uaMaxPenalty = res.data.unreviewedAcceptanceMaxPenaltyPoints;

      console.log(`  * UA Penalty Points: ${uaPenalty}/${uaMaxPenalty} | Normalized Score: ${uaScore}%`);
      console.log(`  * Critical Mistakes recorded:`, res.data.criticalMistakes);

      if (uaPenalty !== 6) throw new Error(`Expected exactly 6 UA penalty points, got ${uaPenalty}`);
      if (uaMaxPenalty !== 6) throw new Error(`Expected exactly 6 UA max penalty points, got ${uaMaxPenalty}`);
      if (uaScore !== 0) throw new Error(`Expected 0% UA score after maximum unreviewed acceptance, got ${uaScore}%`);
      if (res.data.criticalMistakes.length === 0) throw new Error('Expected critical mistake recorded for Stage 4A!');

      console.log('  * PASS: UA autopilot penalty points & critical mistake recorded correctly');
    }

    // ----------------------------------------------------
    // TEST F & G: STRONG (VB=2) VS PARTIAL (VB=1) VERIFICATION
    // ----------------------------------------------------
    console.log('\n[TEST F & G] Testing Strong (VB=2) vs Partial (VB=1) Verification in Stage 11...');
    {
      const stage11 = await ScenarioStage.findOne({
        scenarioId: finalV2._id,
        stageOrder: 12,
        title: "Friend's Emergency Medical Transfer"
      });
      const decs11 = await ScenarioDecision.find({ stageId: stage11._id });
      
      const strongDec = decs11.find(d => d.optionText.includes('normal cellular phone number'));
      const partialDec = decs11.find(d => d.optionText.includes('within the same chat'));
      const blindDec = decs11.find(d => d.optionText.includes('Send ₹4,000 immediately'));
      const declineDec = decs11.find(d => d.optionText.includes('Decline the transfer'));

      if (strongDec.behaviorEffects.verification !== 2) throw new Error(`Strong verification expected VB=2, got ${strongDec.behaviorEffects.verification}`);
      if (partialDec.behaviorEffects.verification !== 1) throw new Error(`Partial verification expected VB=1, got ${partialDec.behaviorEffects.verification}`);
      if (blindDec.behaviorEffects.verification !== 0) throw new Error(`Blind transfer expected VB=0, got ${blindDec.behaviorEffects.verification}`);
      if (declineDec.behaviorEffects.verification !== 0) throw new Error(`Decline transfer expected VB=0, got ${declineDec.behaviorEffects.verification}`);

      console.log('  * PASS: Strong (VB=2), Partial (VB=1), and Non-verification (VB=0) verified exactly as specified');
    }

    // ----------------------------------------------------
    // TEST H: SIGNAL IDENTIFICATION (SI) CALIBRATION
    // ----------------------------------------------------
    console.log('\n[TEST H] Testing Signal Identification (SI) Calibration...');
    {
      const stagesWithSI = await ScenarioStage.find({
        scenarioId: finalV2._id,
        measurementFocus: 'SIGNAL_IDENTIFICATION'
      }).sort({ stageOrder: 1 });

      const stageOrders = stagesWithSI.map(s => s.stageOrder);
      console.log(`  * Stages measuring SI (orders):`, stageOrders);
      // Expected: Stage 2 (order 2), Stage 3 (order 3), Stage 9 (order 10), Stage 10 (order 11)
      if (stagesWithSI.length !== 4) throw new Error(`Expected exactly 4 stages measuring SI, got ${stagesWithSI.length}`);
      if (!stageOrders.includes(2) || !stageOrders.includes(3) || !stageOrders.includes(10) || !stageOrders.includes(11)) {
        throw new Error(`Unexpected stages measuring SI: ${stageOrders}`);
      }
      console.log('  * PASS: SI applied only to authored stages (2, 3, 9, 10)');
    }

    // ----------------------------------------------------
    // TEST I: DECISION QUALITY (DQ) CALIBRATION
    // ----------------------------------------------------
    console.log('\n[TEST I] Testing Decision Quality (DQ) Calibration...');
    {
      const stagesWithDQ = await ScenarioStage.find({
        scenarioId: finalV2._id,
        measurementFocus: 'DECISION_QUALITY'
      });
      // 12 scored stages: 1-7, 8A, 8B, 9-12 (total 13 stage records in DB including both 8A and 8B)
      console.log(`  * Scored stages measuring DQ in DB: ${stagesWithDQ.length}`);
      if (stagesWithDQ.length !== 13) throw new Error(`Expected 13 stage records with DQ (12 on each path), got ${stagesWithDQ.length}`);

      const stage13 = await ScenarioStage.findOne({ scenarioId: finalV2._id, stageOrder: 14 });
      if (stage13.measurementFocus.includes('DECISION_QUALITY')) {
        throw new Error('Stage 13 must NOT include DECISION_QUALITY (pure non-scoring)');
      }
      if (stage13.measurementFocus.length !== 0) {
        throw new Error(`Stage 13 measurementFocus must be empty [], got: ${stage13.measurementFocus}`);
      }
      console.log('  * PASS: DQ balanced across all 12 situations; Stage 13 is strictly non-scoring');
    }

    // ----------------------------------------------------
    // TEST J: REPLAY ATTACK DEFENSE
    // ----------------------------------------------------
    console.log('\n[TEST J] Testing Replay Attack Defense (Double Submission Block)...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      const stageId = start.stage.id;
      const decs = await ScenarioDecision.find({ stageId });

      // First submit: Should succeed
      const res1 = await submitStep(sessionId, stageId, decs[0]._id);
      if (res1.status !== 200) throw new Error(`First submit failed: ${JSON.stringify(res1.data)}`);

      // Second submit of SAME stage: Must be rejected with 400 DUPLICATE_SUBMISSION or STAGE_OUT_OF_SEQUENCE
      const res2 = await submitStep(sessionId, stageId, decs[0]._id);
      if (res2.status !== 400) {
        throw new Error(`Replay attack allowed! Expected status 400, got ${res2.status}`);
      }
      console.log(`  * Replay blocked with code: ${res2.data.error?.code}`);
      console.log('  * PASS: Replay submission rejected');
    }

    // ----------------------------------------------------
    // TEST K: CROSS-SCENARIO DECISION INJECTION
    // ----------------------------------------------------
    console.log('\n[TEST K] Testing Cross-Scenario Decision Injection...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      const stageId = start.stage.id;

      // Find a decision belonging to baseline v1 or fixture
      const foreignDecision = await ScenarioDecision.findOne({ stageId: { $ne: stageId } });
      const injectionRes = await submitStep(sessionId, stageId, foreignDecision._id);
      if (injectionRes.status !== 400) {
        throw new Error(`Cross-scenario decision injection allowed! Expected status 400, got ${injectionRes.status}`);
      }
      if (injectionRes.data.error?.code !== 'INVALID_DECISION') {
        throw new Error(`Expected INVALID_DECISION error code, got: ${injectionRes.data.error?.code}`);
      }
      console.log('  * PASS: Cross-scenario decision injection rejected');
    }

    // ----------------------------------------------------
    // TEST L: CLIENT METRIC INJECTION DEFENSE
    // ----------------------------------------------------
    console.log('\n[TEST L] Testing Client Metric Injection Defense...');
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      const stageId = start.stage.id;
      const decs = await ScenarioDecision.find({ stageId });

      const forgedRes = await submitStep(sessionId, stageId, decs[0]._id, {
        score: 1000,
        behaviourScores: { recognition: 999, decisionQuality: 999 },
        behaviorEffects: { recognition: 999 },
        nextStageId: new mongoose.Types.ObjectId()
      });

      const sessionInDb = await AssessmentSession.findById(sessionId);
      if (sessionInDb.score > 100) {
        throw new Error(`Client injected score accepted! DB score: ${sessionInDb.score}`);
      }
      if (sessionInDb.behaviourScores.get('recognition') > 100) {
        throw new Error(`Client injected metric accepted! DB metric: ${sessionInDb.behaviourScores.get('recognition')}`);
      }
      console.log('  * PASS: Client forged scoring/metric fields completely ignored');
    }

    // ----------------------------------------------------
    // TEST M: GRAPH INTEGRITY VIA scenarioIntegrityService
    // ----------------------------------------------------
    console.log('\n[TEST M] Running scenarioIntegrityService on Production Scenarios...');
    {
      const auditFinal = await auditScenario(finalV2._id);
      if (!auditFinal.valid) {
        throw new Error(`Final v2 audit failed: ${auditFinal.errors.join(', ')}`);
      }
      console.log(`  * Final v2 Audit: VALID (${auditFinal.errors.length} errors, ${auditFinal.warnings.length} warnings)`);

      const auditBaseline = await auditScenario(baselineV2._id);
      if (!auditBaseline.valid) {
        throw new Error(`Baseline v2 audit failed: ${auditBaseline.errors.join(', ')}`);
      }
      console.log(`  * Baseline v2 Audit: VALID (${auditBaseline.errors.length} errors, ${auditBaseline.warnings.length} warnings)`);
      console.log('  * PASS: scenarioIntegrityService confirmed 0 errors on production v2 graphs');
    }

    console.log('\n==================================================');
    console.log('ALL DIGITAL DAY TESTS (A - M) PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } finally {
    await teardown();
  }
}

if (require.main === module) {
  runAllTests().catch(err => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  });
}

module.exports = runAllTests;
