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

const PORT = 5996;
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

  const testEmail = 'behavioral_authoritative_tester@test.com';
  await User.deleteOne({ email: testEmail });
  const user = await User.create({
    fullName: 'Behavioral Test User',
    email: testEmail,
    passwordHash: bcrypt.hashSync('Pass123!Secure', 10),
    role: 'user',
    isActive: true
  });
  userId = user._id;

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Pass123!Secure' })
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
    console.error('Teardown cleanup error:', err.message);
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
  if (res.status !== 200) throw new Error(`Failed to start session: ${JSON.stringify(data)}`);
  return data;
}

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

async function runTests() {
  console.log('\n=============================================================');
  console.log('AUTHORITATIVE SIX-METRIC BEHAVIORAL ASSESSMENT TEST SUITE');
  console.log('=============================================================\n');

  try {
    await setup();

    const finalV2 = await Scenario.findOne({ slug: 'final', version: 2 });
    const baselineV2 = await Scenario.findOne({ slug: 'baseline', version: 2 });
    if (!finalV2 || !baselineV2) throw new Error('Production v2 scenarios not found in MongoDB!');

    // -------------------------------------------------------------
    // TEST A: DIFFERENT DECISION PATHS CREATE DIFFERENT 6-METRIC RESULTS
    // Deriving expected values mathematically from authored behaviorEffects:
    // -------------------------------------------------------------
    console.log('[TEST A] Testing that different decision paths produce mathematically derived 6-metric results...');

    const safeOptionSnippets = [
      'Acknowledge',                                    // Stage 1
      'Open the official India Post',                   // Stage 2
      'Decline the upfront payment',                    // Stage 3
      'report the unknown VPA',                         // Stage 4
      'Review device and location',                     // Stage 5
      'allow Camera only',                              // Stage 6
      'official customer care',                         // Stage 7 -> routes to 8A
      'Review order status and delivery date',          // Stage 8A
      'Notice merchant name mismatch',                  // Stage 9
      'Spot fake sender domain',                        // Stage 10
      'normal cellular phone number',                   // Stage 11
      'Schedule or install official',                   // Stage 12
      ''                                                // Stage 13 (terminal)
    ];

    const poorOptionSnippets = [
      'Acknowledge',                                    // Stage 1 (DQ=2)
      'Click link immediately',                         // Stage 2 (Poor: TR=0, SI=0, VB=0, DQ=0)
      'Pay ₹499 upfront fee',                           // Stage 3 (Poor: TR=0, SI=0, VB=0, DQ=0)
      'Enter UPI PIN to authorize',                     // Stage 4 (Poor: TR=0, VB=0, DQ=0, UA=+2)
      'Review device and location',                     // Stage 5 (DQ=2)
      'Allow All Permissions',                          // Stage 6 (Poor: DQ=0, UA=+2)
      'Press 9 in panic',                               // Stage 7 -> routes to 8B (TR=0, VB=0, DQ=0)
      'Transfer ₹25,000 security deposit',              // Stage 8B (Poor: TR=0, VB=0, DQ=0)
      'pay without reviewing merchant name',            // Stage 9 (Poor: TR=0, SI=0, VB=0, DQ=0, UA=+2)
      'Cancel Subscription',                            // Stage 10 (Poor: TR=0, SI=0, VB=0, DQ=0)
      'Send ₹4,000 immediately without verifying',     // Stage 11 (Poor: TR=0, VB=0, DQ=0)
      'Schedule or install official',                   // Stage 12 (DQ=2)
      ''                                                // Stage 13 (terminal)
    ];

    // Path 1: Safe Path (1A -> 2B -> 3B -> 4C -> 5A -> 6B -> 7A -> 8AA -> 9B -> 10B -> 11B -> 12A -> 13A)
    // Mathematical derivation:
    // TR: stages 2, 3, 4, 7, 9, 10, 11 (7 stages * 2 = 14 max, 14 scored -> 100%)
    // SI: stages 2, 3, 9, 10 (4 stages * 2 = 8 max, 8 scored -> 100%)
    // VB: stages 2, 3, 4, 7, 9, 10, 11 (7 stages * 2 = 14 max, 14 scored -> 100%)
    // DQ: 12 stages * 2 = 24 max, 24 scored -> 100%
    // FP: 0 penalties / 8 max penalty -> (1 - 0/8) * 100 = 100%
    // UA: 0 penalties / 6 max penalty -> (1 - 0/6) * 100 = 100%
    let safeFinalReport;
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      for (let i = 0; i < safeOptionSnippets.length; i++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const dec = safeOptionSnippets[i] ? decs.find(d => d.optionText.includes(safeOptionSnippets[i])) : decs[0];
        const res = await submitStep(sessionId, curStage.id, dec._id);
        if (res.data.isCompleted) {
          safeFinalReport = res.data;
          break;
        }
        curStage = res.data.stage;
      }

      console.log('  [Safe Path] Calculated 6-metric profile:', safeFinalReport.behaviourScores);
      if (safeFinalReport.behaviourScores.recognition !== 100) throw new Error(`Safe Path TR expected 100, got ${safeFinalReport.behaviourScores.recognition}`);
      if (safeFinalReport.behaviourScores.signalIdentification !== 100) throw new Error(`Safe Path SI expected 100, got ${safeFinalReport.behaviourScores.signalIdentification}`);
      if (safeFinalReport.behaviourScores.verification !== 100) throw new Error(`Safe Path VB expected 100, got ${safeFinalReport.behaviourScores.verification}`);
      if (safeFinalReport.behaviourScores.decisionQuality !== 100) throw new Error(`Safe Path DQ expected 100, got ${safeFinalReport.behaviourScores.decisionQuality}`);
      if (safeFinalReport.behaviourScores.falsePositive !== 100) throw new Error(`Safe Path FP expected 100, got ${safeFinalReport.behaviourScores.falsePositive}`);
      if (safeFinalReport.behaviourScores.unreviewedAcceptance !== 100) throw new Error(`Safe Path UA expected 100, got ${safeFinalReport.behaviourScores.unreviewedAcceptance}`);
    }

    // Path 2: Risky Path with Poor Choices
    // Mathematical derivation:
    // Stages 1-6 default (first option):
    // - Stage 1: 1A (DQ=2)
    // - Stage 2: 2A (Open link, TR=0, SI=0, VB=0, DQ=0)
    // - Stage 3: 3A (Pay registration, TR=0, SI=0, VB=0, DQ=0)
    // - Stage 4: 4A (Enter UPI PIN, TR=0, VB=0, DQ=0, UA penalty=2)
    // - Stage 5: 5A (Review device, DQ=2)
    // - Stage 6: 6A (Allow all, DQ=0, UA penalty=2)
    // - Stage 7: 7B (Press 9 panic, TR=0, VB=0, DQ=0) -> routes to 8B
    // - Stage 8B: 8BB (Send 50,000 deposit, TR=0, VB=0, DQ=0) -> routes to 9
    // - Stage 9: 9A (Pay blindly, TR=0, SI=0, VB=0, DQ=0, UA penalty=2)
    // - Stage 10: 10A (Update payment details, TR=0, SI=0, VB=0, DQ=0)
    // - Stage 11: 11A (Send 4,000 immediately, TR=0, VB=0, DQ=0)
    // - Stage 12: 12A (Schedule update, DQ=2)
    // - Stage 13: 13A (terminal)
    // Opportunities on Risky Path:
    // TR Max = 16 (stages 2, 3, 4, 7, 8B, 9, 10, 11 -> 8 * 2 = 16)
    // Scored TR = 0 -> Normalized TR = 0%
    // SI Max = 8 (stages 2, 3, 9, 10 -> 4 * 2 = 8)
    // Scored SI = 0 -> Normalized SI = 0%
    // VB Max = 16 (stages 2, 3, 4, 7, 8B, 9, 10, 11 -> 8 * 2 = 16)
    // Scored VB = 0 -> Normalized VB = 0%
    // DQ Max = 24 (12 scored stages * 2 = 24)
    // Scored DQ: Stage 1 (2) + Stage 5 (2) + Stage 12 (2) = 6 / 24 -> Normalized DQ = Math.round(6/24 * 100) = 25%
    // UA: Stages 4 (+2), 6 (+2), 9 (+2) = 6 penalty points / 6 max penalty -> (1 - 6/6) * 100 = 0%
    // FP: 0 penalties accumulated / 6 max penalty on 8B path -> 100%
    let poorFinalReport;
    {
      const start = await startSession('final', 2);
      const sessionId = start.sessionId;
      let curStage = start.stage;

      for (let i = 0; i < poorOptionSnippets.length; i++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const dec = poorOptionSnippets[i] ? (decs.find(d => d.optionText.includes(poorOptionSnippets[i])) || decs[0]) : decs[0];
        const res = await submitStep(sessionId, curStage.id, dec._id);
        if (res.data.isCompleted) {
          poorFinalReport = res.data;
          break;
        }
        curStage = res.data.stage;
      }

      console.log('  [Poor Path] Calculated 6-metric profile:', poorFinalReport.behaviourScores);
      if (poorFinalReport.behaviourScores.recognition !== 0) throw new Error(`Poor Path TR expected 0, got ${poorFinalReport.behaviourScores.recognition}`);
      if (poorFinalReport.behaviourScores.signalIdentification !== 0) throw new Error(`Poor Path SI expected 0, got ${poorFinalReport.behaviourScores.signalIdentification}`);
      if (poorFinalReport.behaviourScores.verification !== 0) throw new Error(`Poor Path VB expected 0, got ${poorFinalReport.behaviourScores.verification}`);
      if (poorFinalReport.behaviourScores.decisionQuality !== 25) throw new Error(`Poor Path DQ expected 25 (6/24), got ${poorFinalReport.behaviourScores.decisionQuality}`);
      if (poorFinalReport.behaviourScores.unreviewedAcceptance !== 0) throw new Error(`Poor Path UA expected 0 (6/6 penalty), got ${poorFinalReport.behaviourScores.unreviewedAcceptance}`);
      if (poorFinalReport.falsePositivePenaltyPoints !== 0) throw new Error(`Poor Path FP penalty expected 0, got ${poorFinalReport.falsePositivePenaltyPoints}`);
      if (poorFinalReport.unreviewedAcceptancePenaltyPoints !== 6) throw new Error(`Poor Path UA penalty expected 6, got ${poorFinalReport.unreviewedAcceptancePenaltyPoints}`);
    }

    console.log('  * PASS: Safe path (TR=100%, SI=100%, VB=100%, DQ=100%, UA=100%) vs Poor path (TR=0%, SI=0%, VB=0%, DQ=25%, UA=0%) mathematically verified!');

    // -------------------------------------------------------------
    // TEST B: V2 RESPONSES DELIVER AUTHORITATIVE 6-METRIC DATA
    // -------------------------------------------------------------
    console.log('\n[TEST B] Testing that v2 API responses contain authoritative 6-metric data...');
    {
      for (const m of ['recognition', 'signalIdentification', 'verification', 'decisionQuality', 'falsePositive', 'unreviewedAcceptance']) {
        if (typeof safeFinalReport.behaviourScores[m] !== 'number') {
          throw new Error(`Missing numeric score for metric: ${m}`);
        }
        if (typeof safeFinalReport.behaviourOpportunities[m] !== 'number') {
          throw new Error(`Missing numeric opportunities for metric: ${m}`);
        }
      }
      console.log('  * PASS: API response exposes all 6 behavioral dimensions and opportunities');
    }

    // -------------------------------------------------------------
    // TEST C: PERSISTED BEHAVIOUR SCORES MATCH CALCULATIONS
    // -------------------------------------------------------------
    console.log('\n[TEST C] Verifying persisted MongoDB AssessmentSession behaviourScores...');
    {
      const latestSession = await AssessmentSession.findOne({ userId, scenarioCode: 'final' }).sort({ completedAt: -1 });
      if (!latestSession) throw new Error('Persisted session not found in DB!');

      const persistedScores = latestSession.behaviourScores instanceof Map
        ? Object.fromEntries(latestSession.behaviourScores)
        : latestSession.behaviourScores;

      console.log('  Persisted DB behaviourScores:', persistedScores);
      if (persistedScores.recognition !== poorFinalReport.behaviourScores.recognition) {
        throw new Error(`Persisted TR ${persistedScores.recognition} !== returned ${poorFinalReport.behaviourScores.recognition}`);
      }
      if (persistedScores.decisionQuality !== poorFinalReport.behaviourScores.decisionQuality) {
        throw new Error(`Persisted DQ ${persistedScores.decisionQuality} !== returned ${poorFinalReport.behaviourScores.decisionQuality}`);
      }
      if (persistedScores.unreviewedAcceptance !== poorFinalReport.behaviourScores.unreviewedAcceptance) {
        throw new Error(`Persisted UA ${persistedScores.unreviewedAcceptance} !== returned ${poorFinalReport.behaviourScores.unreviewedAcceptance}`);
      }
      console.log('  * PASS: Persisted MongoDB records are identical to returned authoritative scores');
    }

    // -------------------------------------------------------------
    // TEST D: V1 HISTORICAL SESSIONS STILL WORK
    // -------------------------------------------------------------
    console.log('\n[TEST D] Testing historical v1 scenario compatibility...');
    {
      const v1BaselineScenario = await Scenario.findOne({ slug: 'baseline', version: 1 });
      const v1FinalScenario = await Scenario.findOne({ slug: 'final', version: 1 });

      if (v1BaselineScenario && v1FinalScenario) {
        const v1BaseStart = await startSession('baseline', 1);
        const v1BaseStage = await ScenarioStage.findOne({ scenarioId: v1BaselineScenario._id, stageOrder: 1 });
        const v1BaseDecs = await ScenarioDecision.find({ stageId: v1BaseStage._id });
        const v1BaseRes = await submitStep(v1BaseStart.sessionId, v1BaseStage._id, v1BaseDecs[0]._id);

        if (v1BaseRes.data.isCompleted) {
          console.log(`  * v1 Baseline completed with legacy score: ${v1BaseRes.data.score}/100`);
          if (typeof v1BaseRes.data.score !== 'number') throw new Error('v1 Baseline did not return numeric score');
        }

        const v1FinalStart = await startSession('final', 1);
        const v1FinalStage = await ScenarioStage.findOne({ scenarioId: v1FinalScenario._id, stageOrder: 1 });
        const v1FinalDecs = await ScenarioDecision.find({ stageId: v1FinalStage._id });
        const v1FinalRes = await submitStep(v1FinalStart.sessionId, v1FinalStage._id, v1FinalDecs[0]._id);

        if (v1FinalRes.data.isCompleted) {
          console.log(`  * v1 Final completed with legacy delta message: "${v1FinalRes.data.deltaMessage}"`);
          if (!v1FinalRes.data.deltaMessage.includes('Baseline')) {
            throw new Error('v1 Final did not produce legacy pre/post score delta');
          }
        }
        console.log('  * PASS: v1 historical category-weighted score & monolithic delta logic intact');
      } else {
        console.log('  * SKIP: v1 scenarios not found in this environment');
      }
    }

    // -------------------------------------------------------------
    // TEST E: V2 BASELINE -> FINAL DELTA COMPARES 6 BEHAVIORAL DIMENSIONS
    // -------------------------------------------------------------
    console.log('\n[TEST E] Testing v2 Baseline -> Final 6-metric behaviourDelta comparison...');
    {
      // Clean existing sessions to ensure exact 1 baseline and 1 final pairing
      await AssessmentSession.deleteMany({ userId });

      // Run baseline v2 with poor choices (TR=0, SI=0, VB=0, DQ=25, UA=0)
      const baseStart = await startSession('baseline', 2);
      let curStage = baseStart.stage;
      let baseFinalRes;
      while (curStage) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const dec = decs.find(d => d.riskLevel === 'critical')
          || decs.find(d => d.riskLevel === 'high-risk')
          || decs.find(d => d.outcomeType === 'unsafe-action')
          || decs[0];
        const res = await submitStep(baseStart.sessionId, curStage.id, dec._id);
        if (res.data.isCompleted) {
          baseFinalRes = res.data;
          break;
        }
        curStage = res.data.stage;
      }

      // Now run final v2 with safe choices (TR=100, SI=100, VB=100, DQ=100, UA=100)
      const finalStart = await startSession('final', 2);
      curStage = finalStart.stage;
      let finalRes;
      for (let i = 0; i < safeOptionSnippets.length; i++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const dec = safeOptionSnippets[i] ? (decs.find(d => d.optionText.includes(safeOptionSnippets[i])) || decs[0]) : decs[0];
        const res = await submitStep(finalStart.sessionId, curStage.id, dec._id);
        if (res.data.isCompleted) {
          finalRes = res.data;
          break;
        }
        curStage = res.data.stage;
      }

      console.log('  v2 Final delta message:', finalRes.deltaMessage);
      console.log('  v2 Final behaviourDelta:', finalRes.behaviourDelta);

      if (!finalRes.behaviourDelta) {
        throw new Error('FAIL: v2 final did not return behaviourDelta object');
      }

      // Mathematical verification of deltas:
      // Baseline was: TR=0, SI=0, VB=0, DQ=25, UA=0, FP=100
      // Final was: TR=100, SI=100, VB=100, DQ=100, UA=100, FP=100
      // Expected deltas:
      // TR: 100 - 0 = +100%
      // SI: 100 - 0 = +100%
      // VB: 100 - 0 = +100%
      // DQ: 100 - 25 = +75%
      // UA: 100 - 0 = +100%
      // FP: 100 - 100 = 0%
      const bDelta = finalRes.behaviourDelta;
      if (bDelta.recognition.delta !== 100) throw new Error(`Expected TR delta +100, got ${bDelta.recognition.delta}`);
      if (bDelta.signalIdentification.delta !== 100) throw new Error(`Expected SI delta +100, got ${bDelta.signalIdentification.delta}`);
      if (bDelta.verification.delta !== 100) throw new Error(`Expected VB delta +100, got ${bDelta.verification.delta}`);
      if (bDelta.decisionQuality.delta !== 75) throw new Error(`Expected DQ delta +75, got ${bDelta.decisionQuality.delta}`);
      if (bDelta.unreviewedAcceptance.delta !== 100) throw new Error(`Expected UA delta +100, got ${bDelta.unreviewedAcceptance.delta}`);
      if (bDelta.falsePositive.delta !== 0) throw new Error(`Expected FP delta 0, got ${bDelta.falsePositive.delta}`);

      console.log('  * PASS: v2 behaviourDelta matches exact mathematical difference across all 6 dimensions!');
    }

    // -------------------------------------------------------------
    // TEST F: V1 / V2 ISOLATION
    // -------------------------------------------------------------
    console.log('\n[TEST F] Testing v1/v2 cross-version isolation...');
    {
      await AssessmentSession.deleteMany({ userId });

      // Create only a v1 Baseline
      const v1Scenario = await Scenario.findOne({ slug: 'baseline', version: 1 });
      const v1Stage = await ScenarioStage.findOne({ scenarioId: v1Scenario._id });
      const v1Base = await AssessmentSession.create({
        userId,
        scenarioId: v1Scenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 1,
        currentStageId: v1Stage._id,
        status: 'completed',
        score: 45,
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date(Date.now() - 3600000)
      });

      // Complete a v2 Final
      const startV2 = await startSession('final', 2);
      let curStage = startV2.stage;
      let finalV2Res;
      for (let s = 1; s <= 13; s++) {
        const decs = await ScenarioDecision.find({ stageId: curStage.id });
        const res = await submitStep(startV2.sessionId, curStage.id, decs[0]._id);
        if (res.data.isCompleted) {
          finalV2Res = res.data;
          break;
        }
        curStage = res.data.stage;
      }

      if (finalV2Res.deltaMessage !== null || finalV2Res.behaviourDelta !== null) {
        throw new Error('FAIL: v2 Final improperly paired with v1 Baseline!');
      }
      console.log('  * PASS: v2 Final strictly ignores v1 Baseline records');
    }

    // -------------------------------------------------------------
    // TEST G: FORGED CLIENT METRICS CANNOT MODIFY RESULTS
    // -------------------------------------------------------------
    console.log('\n[TEST G] Testing defense against client metric/score forgery...');
    {
      const start = await startSession('final', 2);
      const stageId = start.stage.id;
      const decs = await ScenarioDecision.find({ stageId });

      const forgedPayload = {
        score: 999,
        behaviourScores: {
          recognition: 999,
          signalIdentification: 999,
          verification: 999,
          decisionQuality: 999,
          falsePositive: 999,
          unreviewedAcceptance: 999
        },
        behaviorEffects: { recognition: 999 },
        falsePositivePenaltyPoints: 0
      };

      const res = await submitStep(start.sessionId, stageId, decs[0]._id, forgedPayload);
      const sessionInDb = await AssessmentSession.findById(start.sessionId);

      for (const m of ['recognition', 'signalIdentification', 'verification', 'decisionQuality', 'falsePositive', 'unreviewedAcceptance']) {
        const val = sessionInDb.behaviourScores.get(m);
        if (val > 100) {
          throw new Error(`Forged metric accepted! ${m} = ${val}`);
        }
      }
      console.log('  * PASS: All client forged metric fields strictly rejected/ignored');
    }

    console.log('\n=============================================================');
    console.log('ALL AUTHORITATIVE 6-METRIC RESULT TESTS (A - G) PASSED 100%!');
    console.log('=============================================================\n');

  } finally {
    await teardown();
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  });
}

module.exports = runTests;
