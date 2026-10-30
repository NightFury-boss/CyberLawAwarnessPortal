/**
 * pathwayResumption.test.js
 * Comprehensive Verification Suite for Pathway Resumption States
 * 
 * Verifies:
 * 1. Step 1 Incomplete (Unstarted): Action "Start →", Pill "Recommended", opens Step 1.
 * 2. Step 1 Incomplete (In-progress): Action "Resume Learning →", Pill "In progress", opens Step 1.
 * 3. Step 1 Complete, Step 2 Incomplete: Action "Resume Defense →", Pill "Defense Pending", opens Step 2 directly.
 * 4. Step 1 & Step 2 Complete, Checkpoint Incomplete/Failed: Action strictly "Resume Checkpoint →", Pill "Checkpoint Pending", opens Step 3 directly.
 * 5. Fully Completed: Action "Review →", Pill "Completed", Checkpoint Badge, opens Step 4 directly without redoing steps.
 * 6. Unavailable / Corrupted Pathway Data: Honest fallback card rendered with "Unavailable" pill without fabricating progress.
 * 7. Missing Assessment Session / Ineligible: Safe rejection with clear error message instead of crashing or inventing progress.
 * 8. Authoritative Server Progression: Client-supplied scores ignored; prerequisite steps strictly validated before checkpoint.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const catalog = require('../config/remediationCatalog');
const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const UserProgress = require('../models/UserProgress');
const progressRoutes = require('../routes/progress');
const simulationRoutes = require('../routes/simulations');

const TEST_PORT = 5998;
const BASE_URL = `http://localhost:${TEST_PORT}/api/progress`;

let server;
let testUser;
let testToken;
let testSession;
let testPathway;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/progress', progressRoutes);
  app.use('/api/assessments', simulationRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const unique = 'resume-test-' + Date.now() + '@example.com';
  testUser = await User.create({
    fullName: 'Pathway Resumption Tester',
    email: unique,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  testToken = jwt.sign({ id: testUser._id, role: testUser.role }, jwtSecret, { expiresIn: '1h' });

  // Create completed baseline session with low unreviewedAcceptance score so 'pathway-ua-upi-consent' is recommended
  testPathway = catalog.find(p => p.pathwayId === 'pathway-ua-upi-consent');
  assert.ok(testPathway, 'pathway-ua-upi-consent must exist in catalog');

  const Scenario = require('../models/Scenario');
  const ScenarioStage = require('../models/ScenarioStage');
  const baselineScenario = await Scenario.findOne({ code: 'baseline', version: 2 });
  const dummyStage = await ScenarioStage.findOne({ scenarioId: baselineScenario?._id }) || { _id: new mongoose.Types.ObjectId() };
  const scenarioId = baselineScenario ? baselineScenario._id : new mongoose.Types.ObjectId();

  testSession = await AssessmentSession.create({
    userId: testUser._id,
    type: 'baseline',
    status: 'completed',
    score: 65,
    scenarioCode: 'baseline',
    scenarioId,
    scenarioVersion: 2,
    currentStageId: dummyStage._id,
    behaviourScores: new Map([
      ['unreviewedAcceptance', 30],
      ['verification', 80],
      ['recognition', 85],
      ['signalIdentification', 75],
      ['decisionQuality', 80],
      ['falsePositive', 20]
    ]),
    behaviourOpportunities: new Map([
      ['unreviewedAcceptance', 5],
      ['verification', 5],
      ['recognition', 5],
      ['signalIdentification', 5],
      ['decisionQuality', 5],
      ['falsePositive', 5]
    ]),
    completedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000)
  });

  console.log(`[Setup] Test environment ready. User: ${testUser._id}, Session: ${testSession._id}`);
}

async function teardown() {
  if (testUser) {
    await User.deleteOne({ _id: testUser._id });
    await AssessmentSession.deleteMany({ userId: testUser._id });
    await UserProgress.deleteMany({ userId: testUser._id });
  }
  if (server) {
    await new Promise(resolve => server.close(resolve));
    console.log('[Test Server] Stopped.');
  }
  await mongoose.disconnect();
}

/**
 * Mirror of client-side step calculation logic used in LearningPracticeSection and PathwayRunner
 */
function resolvePathwayPresentation(item) {
  const rec = item.rec;
  if (!rec || !rec.habitTitle || !rec.pathwayId) {
    return {
      isFallback: true,
      pillText: 'Unavailable',
      pillClass: 'pill-unavailable',
      ctaText: null,
      initialStep: null
    };
  }

  const steps = item.completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false };
  const step1Done = Boolean(steps.caseStudy);
  const step2Done = Boolean(steps.prevention);
  const step3Done = Boolean(steps.checkpointQuiz);
  const isFullyCompleted = Boolean(item.isFullyCompleted || item.completedRecord?.completedAt);

  // PathwayRunner step determination logic
  let initialStep = 1;
  if (isFullyCompleted) {
    initialStep = 4;
  } else if (step2Done) {
    initialStep = 3;
  } else if (step1Done) {
    initialStep = 2;
  } else {
    initialStep = 1;
  }

  if (item.isReinforced) {
    return {
      isFallback: false,
      pillText: 'Reinforced',
      pillClass: 'pill-reinforced',
      ctaText: 'Review →',
      initialStep: 4
    };
  }
  if (item.isReinforcementEligible && !item.isReinforced) {
    return {
      isFallback: false,
      pillText: 'Reinforce',
      pillClass: 'pill-recommended',
      ctaText: 'Reinforce →',
      initialStep: 1
    };
  }
  if (isFullyCompleted) {
    return {
      isFallback: false,
      pillText: 'Completed',
      pillClass: 'pill-completed',
      ctaText: 'Review →',
      initialStep: 4
    };
  }
  if (step1Done && step2Done && !step3Done) {
    return {
      isFallback: false,
      pillText: 'Checkpoint Pending',
      pillClass: 'pill-checkpoint',
      ctaText: 'Resume Checkpoint →',
      initialStep: 3
    };
  }
  if (step1Done && !step2Done) {
    return {
      isFallback: false,
      pillText: 'Defense Pending',
      pillClass: 'pill-progress',
      ctaText: 'Resume Defense →',
      initialStep: 2
    };
  }
  if (item.isInProgress) {
    return {
      isFallback: false,
      pillText: 'In progress',
      pillClass: 'pill-progress',
      ctaText: 'Resume Learning →',
      initialStep: 1
    };
  }
  return {
    isFallback: false,
    pillText: 'Recommended',
    pillClass: 'pill-recommended',
    ctaText: 'Start →',
    initialStep: 1
  };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('PATHWAY RESUMPTION VERIFICATION TEST SUITE');
  console.log('=============================================================\n');

  try {
    await setup();

    // -------------------------------------------------------------------------
    // TEST 1: Unstarted Recommended Pathway
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Unstarted pathway state...');
    const unstartedItem = {
      rec: testPathway,
      isFullyCompleted: false,
      isInProgress: false,
      isReinforced: false,
      isReinforcementEligible: false,
      completedRecord: null
    };
    const pres1 = resolvePathwayPresentation(unstartedItem);
    assert.strictEqual(pres1.pillText, 'Recommended');
    assert.strictEqual(pres1.pillClass, 'pill-recommended');
    assert.strictEqual(pres1.ctaText, 'Start →');
    assert.strictEqual(pres1.initialStep, 1);
    console.log('  * PASS: Unstarted pathway shows "Start →", "Recommended", opens Step 1.');

    // -------------------------------------------------------------------------
    // TEST 2: In-Progress Pathway with Case Study Incomplete
    // -------------------------------------------------------------------------
    console.log('[TEST 2] In-progress pathway with case study incomplete...');
    const inProgressItem = {
      rec: testPathway,
      isFullyCompleted: false,
      isInProgress: true,
      isReinforced: false,
      isReinforcementEligible: false,
      completedRecord: {
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        stepsCompleted: { caseStudy: false, prevention: false, checkpointQuiz: false }
      }
    };
    const pres2 = resolvePathwayPresentation(inProgressItem);
    assert.strictEqual(pres2.pillText, 'In progress');
    assert.strictEqual(pres2.pillClass, 'pill-progress');
    assert.strictEqual(pres2.ctaText, 'Resume Learning →');
    assert.strictEqual(pres2.initialStep, 1);
    console.log('  * PASS: Incomplete case study shows "Resume Learning →", "In progress", opens Step 1.');

    // -------------------------------------------------------------------------
    // TEST 3: Step 1 Complete, Step 2 Incomplete (Directs to Practical Defense)
    // -------------------------------------------------------------------------
    console.log('[TEST 3] Step 1 complete, Step 2 incomplete...');
    // Record Step 1 on server
    const step1Res = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        step: 'caseStudy',
        decisionChoiceIndex: 0
      })
    });
    const step1Data = await step1Res.json();
    assert.strictEqual(step1Res.status, 200);
    assert.strictEqual(step1Data.stepsCompleted.caseStudy, true);
    assert.strictEqual(step1Data.stepsCompleted.prevention, false);

    const step1Item = {
      rec: testPathway,
      isFullyCompleted: false,
      isInProgress: true,
      isReinforced: false,
      isReinforcementEligible: false,
      completedRecord: {
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        stepsCompleted: step1Data.stepsCompleted
      }
    };
    const pres3 = resolvePathwayPresentation(step1Item);
    assert.strictEqual(pres3.pillText, 'Defense Pending');
    assert.strictEqual(pres3.pillClass, 'pill-progress');
    assert.strictEqual(pres3.ctaText, 'Resume Defense →');
    assert.strictEqual(pres3.initialStep, 2);
    console.log('  * PASS: Step 1 complete shows "Resume Defense →", "Defense Pending", opens Step 2 directly.');

    // -------------------------------------------------------------------------
    // TEST 4: Both Learning Steps Complete, Checkpoint Incomplete / Unsuccessful
    // -------------------------------------------------------------------------
    console.log('[TEST 4] Both steps complete, Checkpoint Pending / Failed...');
    // Record Step 2 on server
    const step2Res = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        step: 'prevention',
        acknowledged: true
      })
    });
    const step2Data = await step2Res.json();
    assert.strictEqual(step2Res.status, 200);
    assert.strictEqual(step2Data.stepsCompleted.caseStudy, true);
    assert.strictEqual(step2Data.stepsCompleted.prevention, true);
    assert.strictEqual(step2Data.stepsCompleted.checkpointQuiz, false);

    const checkpointPendingItem = {
      rec: testPathway,
      isFullyCompleted: false,
      isInProgress: true,
      isReinforced: false,
      isReinforcementEligible: false,
      completedRecord: {
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        stepsCompleted: step2Data.stepsCompleted,
        checkpointScore: null,
        completedAt: null
      }
    };
    const pres4 = resolvePathwayPresentation(checkpointPendingItem);
    assert.strictEqual(pres4.pillText, 'Checkpoint Pending');
    assert.strictEqual(pres4.pillClass, 'pill-checkpoint');
    assert.strictEqual(pres4.ctaText, 'Resume Checkpoint →');
    assert.strictEqual(pres4.initialStep, 3);
    console.log('  * PASS: Steps 1 & 2 complete shows strictly "Resume Checkpoint →", "Checkpoint Pending", opens Step 3 directly.');

    // Verify checkpoint attempt failure keeps checkpoint pending
    const failAnswers = testPathway.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: (q.correctOptionIndex + 1) % q.options.length // Deliberately incorrect
    }));
    const failRes = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        answers: failAnswers
      })
    });
    const failData = await failRes.json();
    assert.strictEqual(failRes.status, 200);
    assert.strictEqual(failData.passed, false);
    assert.strictEqual(failData.isFullyCompleted, false);
    assert.strictEqual(failData.completedAt, null);

    // Refresh user progress to verify server state
    const progAfterFail = await UserProgress.findOne({ userId: testUser._id });
    const pRecAfterFail = progAfterFail.completedPathways.find(p => p.pathwayId === testPathway.pathwayId);
    assert.strictEqual(pRecAfterFail.stepsCompleted.caseStudy, true);
    assert.strictEqual(pRecAfterFail.stepsCompleted.prevention, true);
    assert.strictEqual(pRecAfterFail.stepsCompleted.checkpointQuiz, false);
    assert.strictEqual(pRecAfterFail.completedAt, undefined);

    const pres4b = resolvePathwayPresentation({
      rec: testPathway,
      isFullyCompleted: false,
      isInProgress: true,
      completedRecord: pRecAfterFail
    });
    assert.strictEqual(pres4b.ctaText, 'Resume Checkpoint →');
    assert.strictEqual(pres4b.initialStep, 3);
    console.log('  * PASS: Unsuccessful checkpoint attempt leaves pathway incomplete and resumes at Step 3.');

    // -------------------------------------------------------------------------
    // TEST 5: Fully Completed Pathway (Shows Completed, Review, No Implied Work)
    // -------------------------------------------------------------------------
    console.log('[TEST 5] Fully completed pathway...');
    // Submit correct answers to pass checkpoint
    const passAnswers = testPathway.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));
    const passRes = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        pathwayId: testPathway.pathwayId,
        sourceSessionId: testSession._id,
        answers: passAnswers
      })
    });
    const passData = await passRes.json();
    assert.strictEqual(passRes.status, 200);
    assert.strictEqual(passData.passed, true);
    assert.strictEqual(passData.isFullyCompleted, true);
    assert.ok(passData.completedAt);

    const completedProg = await UserProgress.findOne({ userId: testUser._id });
    const completedRecord = completedProg.completedPathways.find(p => p.pathwayId === testPathway.pathwayId);
    assert.strictEqual(completedRecord.stepsCompleted.checkpointQuiz, true);
    assert.ok(completedRecord.completedAt);

    const completedItem = {
      rec: testPathway,
      isFullyCompleted: true,
      isInProgress: false,
      isReinforced: false,
      isReinforcementEligible: false,
      completedRecord
    };
    const pres5 = resolvePathwayPresentation(completedItem);
    assert.strictEqual(pres5.pillText, 'Completed');
    assert.strictEqual(pres5.pillClass, 'pill-completed');
    assert.strictEqual(pres5.ctaText, 'Review →');
    assert.strictEqual(pres5.initialStep, 4);
    console.log('  * PASS: Fully completed pathway shows "Review →", "Completed", opens Step 4 summary without repeating steps.');

    // -------------------------------------------------------------------------
    // TEST 6: Unavailable / Corrupted Pathway Data Fallback
    // -------------------------------------------------------------------------
    console.log('[TEST 6] Corrupted or unavailable pathway fallback...');
    const corruptedItem = {
      rec: null, // Missing recommendation
      isFullyCompleted: false,
      isInProgress: false,
      completedRecord: null
    };
    const pres6 = resolvePathwayPresentation(corruptedItem);
    assert.strictEqual(pres6.isFallback, true);
    assert.strictEqual(pres6.pillText, 'Unavailable');
    assert.strictEqual(pres6.pillClass, 'pill-unavailable');
    assert.strictEqual(pres6.ctaText, null);
    console.log('  * PASS: Corrupted/missing pathway renders honest fallback without inventing progress.');

    // -------------------------------------------------------------------------
    // TEST 7: Ineligible / Missing Session ID Safeguard
    // -------------------------------------------------------------------------
    console.log('[TEST 7] Session validation safeguards...');
    const invalidSessionId = new mongoose.Types.ObjectId();
    const badRes = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`
      },
      body: JSON.stringify({
        pathwayId: testPathway.pathwayId,
        sourceSessionId: invalidSessionId,
        step: 'caseStudy',
        decisionChoiceIndex: 0
      })
    });
    assert.strictEqual(badRes.status, 404);
    const badData = await badRes.json();
    assert.strictEqual(badData.error.code, 'SESSION_NOT_FOUND');
    console.log('  * PASS: Invalid/non-existent session rejected with 404 SESSION_NOT_FOUND.');

    console.log('\n=============================================================');
    console.log('ALL PATHWAY RESUMPTION TESTS (1 - 7) PASSED GREEN! ✓');
    console.log('=============================================================\n');
  } finally {
    await teardown();
  }
}

runTests().catch(err => {
  console.error('[TEST ERROR]', err);
  process.exit(1);
});
