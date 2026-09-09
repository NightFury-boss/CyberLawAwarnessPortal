/**
 * Automated Test Suite for Adaptive Learning Pathways & Progress Tracking
 * Phase 4: Server-Authoritative Progression & Checkpoint Validation
 *
 * Test Matrix:
 * A. Unauthenticated request → 401
 * B. Invalid pathway → 400
 * C. Wrong session owner → 403
 * D. Ineligible pathway → rejected (403)
 * E. Invalid Step 1 action → rejected (400)
 * F. Invalid Step 2 acknowledgment → rejected (400)
 * G. Forged checkpointScore/passed → ignored/rejected (server calculates authoritatively)
 * H. Server checkpoint scoring → correct
 * I. Failed checkpoint → pathway incomplete
 * J. Passing checkpoint → pathway completed (when Steps 1 & 2 complete)
 * K. Duplicate submission → idempotent
 * L. User isolation → protected
 * M. sourceSessionId preserved → verified
 * N. Invalid question IDs/options → rejected
 * O. Regression test check
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

const TEST_PORT = 5996;
const BASE_URL = `http://localhost:${TEST_PORT}/api/progress`;

let server;
let userA;
let userB;
let tokenA;
let tokenB;
let sessionA;
let sessionB;
let eligiblePathwayId;

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

  // Create test users
  const uniqueA = 'test-pathway-a-' + Date.now() + '@example.com';
  const uniqueB = 'test-pathway-b-' + Date.now() + '@example.com';

  userA = await User.create({
    fullName: 'Pathway Test User A',
    email: uniqueA,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  userB = await User.create({
    fullName: 'Pathway Test User B',
    email: uniqueB,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  tokenA = jwt.sign({ id: userA._id, role: userA.role }, jwtSecret, { expiresIn: '1h' });
  tokenB = jwt.sign({ id: userB._id, role: userB.role }, jwtSecret, { expiresIn: '1h' });

  const Scenario = require('../models/Scenario');
  const ScenarioStage = require('../models/ScenarioStage');
  const baselineScenario = await Scenario.findOne({ code: 'baseline', version: 2 });
  const dummyStage = await ScenarioStage.findOne({ scenarioId: baselineScenario?._id }) || { _id: new mongoose.Types.ObjectId() };
  const scenarioId = baselineScenario ? baselineScenario._id : new mongoose.Types.ObjectId();

  // Create a completed assessment session for User A with low Unreviewed Acceptance (UA)
  // This will authoritatively recommend 'pathway-ua-upi-consent'
  sessionA = await AssessmentSession.create({
    userId: userA._id,
    scenarioId,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    currentStageId: dummyStage._id,
    status: 'completed',
    currentStageNumber: 13,
    score: 50,
    behaviourScores: new Map([
      ['recognition', 90],
      ['signalIdentification', 85],
      ['verification', 80],
      ['decisionQuality', 80],
      ['falsePositive', 90],
      ['unreviewedAcceptance', 33] // Weakest metric
    ]),
    behaviourOpportunities: new Map([
      ['recognition', 10],
      ['signalIdentification', 8],
      ['verification', 6],
      ['decisionQuality', 10]
    ]),
    unreviewedAcceptanceMaxPenaltyPoints: 6,
    unreviewedAcceptancePenaltyPoints: 4,
    falsePositiveMaxPenaltyPoints: 6,
    falsePositivePenaltyPoints: 1,
    expiresAt: new Date(Date.now() + 3600000),
    completedAt: new Date()
  });

  // Create a completed assessment session for User B
  sessionB = await AssessmentSession.create({
    userId: userB._id,
    scenarioId,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    currentStageId: dummyStage._id,
    status: 'completed',
    currentStageNumber: 13,
    score: 50,
    behaviourScores: new Map([
      ['recognition', 90],
      ['signalIdentification', 85],
      ['verification', 80],
      ['decisionQuality', 80],
      ['falsePositive', 90],
      ['unreviewedAcceptance', 33]
    ]),
    unreviewedAcceptanceMaxPenaltyPoints: 6,
    expiresAt: new Date(Date.now() + 3600000),
    completedAt: new Date()
  });

  eligiblePathwayId = 'pathway-ua-upi-consent';
}

async function teardown() {
  if (userA) {
    await AssessmentSession.deleteMany({ userId: userA._id });
    await UserProgress.deleteMany({ userId: userA._id });
    await User.deleteOne({ _id: userA._id });
  }
  if (userB) {
    await AssessmentSession.deleteMany({ userId: userB._id });
    await UserProgress.deleteMany({ userId: userB._id });
    await User.deleteOne({ _id: userB._id });
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

async function runTests() {
  console.log('\n=============================================================');
  console.log('PHASE 4: ADAPTIVE LEARNING PATHWAYS PROGRESS TEST SUITE');
  console.log('=============================================================\n');

  try {
    await setup();

    // -------------------------------------------------------------
    // TEST A: Unauthenticated request -> 401
    // -------------------------------------------------------------
    console.log('[TEST A] Unauthenticated request...');
    const resA = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        step: 'caseStudy',
        decisionChoiceIndex: 1
      })
    });
    assert.strictEqual(resA.status, 401, 'Unauthenticated request must return HTTP 401');
    console.log('  * PASS: Unauthenticated request rejected with 401');

    // -------------------------------------------------------------
    // TEST B: Invalid pathway -> 400
    // -------------------------------------------------------------
    console.log('[TEST B] Non-existent pathway -> 400...');
    const resB = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-non-existent-fake',
        sourceSessionId: sessionA._id.toString(),
        step: 'caseStudy',
        decisionChoiceIndex: 0
      })
    });
    assert.strictEqual(resB.status, 400, 'Non-existent pathway must return HTTP 400');
    const jsonB = await resB.json();
    assert.strictEqual(jsonB.error.code, 'PATHWAY_NOT_FOUND');
    console.log('  * PASS: Non-existent pathway rejected with 400 PATHWAY_NOT_FOUND');

    // -------------------------------------------------------------
    // TEST C: Wrong session owner -> 403
    // -------------------------------------------------------------
    console.log('[TEST C] Wrong session owner -> 403...');
    const resC = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}` // User A trying to use User B's session
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionB._id.toString(),
        step: 'caseStudy',
        decisionChoiceIndex: 1
      })
    });
    assert.strictEqual(resC.status, 403, 'Accessing another user’s session must return HTTP 403');
    const jsonC = await resC.json();
    assert.strictEqual(jsonC.error.code, 'FORBIDDEN');
    console.log('  * PASS: Cross-user session access blocked with 403 Forbidden');

    // -------------------------------------------------------------
    // TEST D: Ineligible pathway -> rejected (403)
    // -------------------------------------------------------------
    console.log('[TEST D] Ineligible pathway -> rejected...');
    // User A only has UA and maintenance recommended; TR (phishing) is not recommended because TR score was 90%
    const resD = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-tr-lure-detection', // Not recommended for sessionA
        sourceSessionId: sessionA._id.toString(),
        step: 'caseStudy',
        decisionChoiceIndex: 1
      })
    });
    assert.strictEqual(resD.status, 403, 'Ineligible pathway must return HTTP 403');
    const jsonD = await resD.json();
    assert.strictEqual(jsonD.error.code, 'PATHWAY_NOT_ELIGIBLE');
    console.log('  * PASS: Ineligible pathway rejected with 403 PATHWAY_NOT_ELIGIBLE');

    // -------------------------------------------------------------
    // TEST E: Invalid Step 1 action -> rejected (400)
    // -------------------------------------------------------------
    console.log('[TEST E] Invalid Step 1 action -> rejected...');
    const resE = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        step: 'caseStudy'
        // Missing decisionChoiceIndex
      })
    });
    assert.strictEqual(resE.status, 400, 'Missing decisionChoiceIndex must return HTTP 400');
    const jsonE = await resE.json();
    assert.strictEqual(jsonE.error.code, 'INVALID_STEP_ACTION');
    console.log('  * PASS: Missing decisionChoiceIndex rejected with 400');

    // -------------------------------------------------------------
    // TEST F: Invalid Step 2 acknowledgment -> rejected (400)
    // -------------------------------------------------------------
    console.log('[TEST F] Invalid Step 2 acknowledgment -> rejected...');
    const resF = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        step: 'prevention',
        acknowledged: false // Must be explicitly true
      })
    });
    assert.strictEqual(resF.status, 400, 'Unacknowledged Step 2 must return HTTP 400');
    const jsonF = await resF.json();
    assert.strictEqual(jsonF.error.code, 'INVALID_STEP_ACTION');
    console.log('  * PASS: Unacknowledged Step 2 rejected with 400');

    // Complete Step 1 legitimately
    const validStep1 = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        step: 'caseStudy',
        decisionChoiceIndex: 1
      })
    });
    assert.strictEqual(validStep1.status, 200);
    const validStep1Json = await validStep1.json();
    assert.strictEqual(validStep1Json.stepsCompleted.caseStudy, true);
    assert.strictEqual(validStep1Json.stepsCompleted.prevention, false);
    assert.strictEqual(validStep1Json.isFullyCompleted, false);

    // Complete Step 2 legitimately
    const validStep2 = await fetch(`${BASE_URL}/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        step: 'prevention',
        acknowledged: true
      })
    });
    assert.strictEqual(validStep2.status, 200);
    const validStep2Json = await validStep2.json();
    assert.strictEqual(validStep2Json.stepsCompleted.caseStudy, true);
    assert.strictEqual(validStep2Json.stepsCompleted.prevention, true);
    assert.strictEqual(validStep2Json.isFullyCompleted, false);

    // Fetch sanitized checkpoint
    console.log('[SANITY CHECK] Fetch sanitized checkpoint questions...');
    const chkFetch = await fetch(`${BASE_URL}/pathways/${eligiblePathwayId}/checkpoint?sourceSessionId=${sessionA._id}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    assert.strictEqual(chkFetch.status, 200);
    const chkData = await chkFetch.json();
    assert.strictEqual(chkData.questions.length, 3);
    chkData.questions.forEach(q => {
      assert.strictEqual(q.correctOptionIndex, undefined, 'correctOptionIndex must never be exposed');
      assert.strictEqual(q.explanation, undefined, 'explanation must never be exposed before submission');
    });
    console.log('  * PASS: Checkpoint questions sanitized (zero answer leaks)');

    // -------------------------------------------------------------
    // TEST G: Forged checkpointScore/passed -> ignored/rejected
    // -------------------------------------------------------------
    console.log('[TEST G] Forged checkpointScore/passed in client submission...');
    // Submit deliberately wrong answers (0 out of 3 correct), but inject `checkpointScore: 100` and `passed: true`
    const pathwayObj = catalog.find(p => p.pathwayId === eligiblePathwayId);
    const forgedAnswers = pathwayObj.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: (q.correctOptionIndex + 1) % q.options.length // Wrong choice
    }));

    const resG = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        answers: forgedAnswers,
        checkpointScore: 100, // Forged
        passed: true,         // Forged
        isFullyCompleted: true // Forged
      })
    });
    assert.strictEqual(resG.status, 200);
    const jsonG = await resG.json();
    assert.strictEqual(jsonG.passed, false, 'Server must evaluate score as 0% and passed as false despite client forgery');
    assert.strictEqual(jsonG.score, 0, 'Server must record actual calculated score (0%), not forged 100%');
    assert.strictEqual(jsonG.isFullyCompleted, false);
    console.log('  * PASS: Forged score and completion flags discarded; server calculated 0% failed');

    // -------------------------------------------------------------
    // TEST H & I: Failed checkpoint does not complete pathway
    // -------------------------------------------------------------
    console.log('[TEST H & I] Checkpoint calculation and failure enforcement...');
    // Submit 1 correct out of 3 (score = 33% < passingScore 67%)
    const partialAnswers = pathwayObj.checkpoint.questions.map((q, idx) => ({
      questionId: q.questionId,
      selectedOptionIndex: idx === 0 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % q.options.length
    }));

    const resH = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        answers: partialAnswers
      })
    });
    assert.strictEqual(resH.status, 200);
    const jsonH = await resH.json();
    assert.strictEqual(jsonH.score, 33, 'Server must calculate 33% (1/3)');
    assert.strictEqual(jsonH.passed, false, '33% is below 67% passing threshold');
    assert.strictEqual(jsonH.isFullyCompleted, false);

    // Verify DB record
    const progH = await UserProgress.findOne({ userId: userA._id });
    const recH = progH.completedPathways.find(p => p.pathwayId === eligiblePathwayId);
    assert.strictEqual(recH.stepsCompleted.checkpointQuiz, false);
    assert.strictEqual(recH.completedAt, undefined);
    console.log('  * PASS: Failed checkpoint (33% < 67%) leaves pathway incomplete');

    // -------------------------------------------------------------
    // TEST J: Passing checkpoint -> pathway completed
    // -------------------------------------------------------------
    console.log('[TEST J] Passing checkpoint completes pathway...');
    // Submit 3 correct out of 3 (100% >= 67%)
    const correctAnswers = pathwayObj.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));

    const resJ = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        answers: correctAnswers
      })
    });
    assert.strictEqual(resJ.status, 200);
    const jsonJ = await resJ.json();
    assert.strictEqual(jsonJ.passed, true);
    assert.strictEqual(jsonJ.score, 100);
    assert.strictEqual(jsonJ.isFullyCompleted, true);
    assert(jsonJ.completedAt !== null, 'completedAt timestamp must be set');

    // Verify DB record
    const progJ = await UserProgress.findOne({ userId: userA._id });
    const recJ = progJ.completedPathways.find(p => p.pathwayId === eligiblePathwayId);
    assert.strictEqual(recJ.stepsCompleted.checkpointQuiz, true);
    assert.strictEqual(recJ.stepsCompleted.caseStudy, true);
    assert.strictEqual(recJ.stepsCompleted.prevention, true);
    assert.strictEqual(recJ.checkpointScore, 100);
    assert(recJ.completedAt !== undefined, 'completedAt must be persisted');
    console.log('  * PASS: Passing checkpoint (100% >= 67%) completes pathway and sets completedAt');

    // -------------------------------------------------------------
    // TEST K: Duplicate submission -> idempotent
    // -------------------------------------------------------------
    console.log('[TEST K] Duplicate submission idempotency...');
    const resK = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        answers: correctAnswers
      })
    });
    assert.strictEqual(resK.status, 200);
    const progK = await UserProgress.findOne({ userId: userA._id });
    const matchingRecs = progK.completedPathways.filter(
      p => p.pathwayId === eligiblePathwayId && p.sourceSessionId.toString() === sessionA._id.toString()
    );
    assert.strictEqual(matchingRecs.length, 1, 'Duplicate submissions must not produce duplicate array elements');
    console.log('  * PASS: Duplicate submission is idempotent (1 record maintained)');

    // -------------------------------------------------------------
    // TEST L: User isolation -> protected
    // -------------------------------------------------------------
    console.log('[TEST L] User data isolation...');
    const progB = await UserProgress.findOne({ userId: userB._id });
    const bCompletions = progB ? progB.completedPathways.length : 0;
    assert.strictEqual(bCompletions, 0, 'User A actions must never leak into User B progress');
    console.log('  * PASS: User A completions strictly isolated from User B');

    // -------------------------------------------------------------
    // TEST M: sourceSessionId preserved -> verified
    // -------------------------------------------------------------
    console.log('[TEST M] Verification of preserved sourceSessionId...');
    assert.strictEqual(
      recJ.sourceSessionId.toString(),
      sessionA._id.toString(),
      'Preserved sourceSessionId must exactly match the assessment session that recommended it'
    );
    console.log('  * PASS: sourceSessionId preserved with full learning traceability');

    // -------------------------------------------------------------
    // TEST N: Invalid question IDs/options -> rejected (400)
    // -------------------------------------------------------------
    console.log('[TEST N] Invalid question IDs / option indices...');
    const resN1 = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        answers: [{ questionId: 'chk-invalid-fake-id', selectedOptionIndex: 0 }]
      })
    });
    assert.strictEqual(resN1.status, 400);
    const jsonN1 = await resN1.json();
    assert.strictEqual(jsonN1.error.code, 'INCOMPLETE_ANSWERS');

    const resN2 = await fetch(`${BASE_URL}/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: eligiblePathwayId,
        sourceSessionId: sessionA._id.toString(),
        answers: [{ questionId: 'chk-ua-1', selectedOptionIndex: 999 }] // Out of range index
      })
    });
    assert.strictEqual(resN2.status, 400);
    const jsonN2 = await resN2.json();
    assert.strictEqual(jsonN2.error.code, 'INVALID_OPTION_INDEX');
    console.log('  * PASS: Malformed question IDs and out-of-range option indices rejected with 400');

    console.log('\n=============================================================');
    console.log('ALL PATHWAY PROGRESS TESTS (A - N) PASSED 100%!');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err);
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

runTests();
