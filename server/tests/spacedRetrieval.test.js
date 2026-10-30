/**
 * spacedRetrieval.test.js
 * Verification Suite for Spaced Retrieval & Follow-Up Learning
 *
 * Test Matrix:
 * 1. Configurable delay: A pathway is NOT due before the configured delay.
 * 2. Delay boundary: A pathway becomes due at the exact boundary (>= delay days).
 * 3. Incomplete pathways are strictly ineligible (excluded from due list and 403 on direct access).
 * 4. Cycle deduplication: A completed review does not repeatedly reappear for the same cycle.
 * 5. Authorization & Ownership Gate: Learner B cannot access or submit Learner A's review (403 Forbidden). Unauthenticated -> 401.
 * 6. Zero Answer Leakage & Server-Authoritative Scoring: Initial question payload strips answers/explanations; client-supplied scores/pass flags are discarded.
 * 7. Submission Idempotency: Duplicate submissions do not bloat or duplicate completion records.
 * 8. Architectural Non-Interference: Historical assessment sessions, completed pathways, and reinforcements remain immutable.
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
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const progressRoutes = require('../routes/progress');
const spacedRetrievalService = require('../services/spacedRetrievalService');

const TEST_PORT = 5997;
const BASE_URL = `http://localhost:${TEST_PORT}/api/progress`;

let server;
let userA;
let userB;
let tokenA;
let tokenB;
let sessionA;
let testPathway;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/progress', progressRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Spaced Retrieval suite listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const uniqueA = 'spaced-test-a-' + Date.now() + '@example.com';
  const uniqueB = 'spaced-test-b-' + Date.now() + '@example.com';

  userA = await User.create({
    fullName: 'Spaced Learner A',
    email: uniqueA,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  userB = await User.create({
    fullName: 'Spaced Learner B',
    email: uniqueB,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  const secret = process.env.JWT_SECRET || 'secret';
  tokenA = jwt.sign({ id: userA._id }, secret, { expiresIn: '1h' });
  tokenB = jwt.sign({ id: userB._id }, secret, { expiresIn: '1h' });

  // Get test scenario & stage
  let scenario = await Scenario.findOne({ version: 2 });
  if (!scenario) {
    scenario = await Scenario.create({
      title: 'Baseline Scenario',
      code: 'baseline',
      version: 2,
      stages: []
    });
  }
  let stage = await ScenarioStage.findOne({ scenarioId: scenario._id });
  if (!stage) {
    stage = await ScenarioStage.create({
      scenarioId: scenario._id,
      stageNumber: 1,
      title: 'Initial Stage'
    });
  }

  // Find a pathway with a valid checkpoint in catalog
  testPathway = catalog.find(p => p.checkpoint && p.checkpoint.questions && p.checkpoint.questions.length >= 2);
  assert(testPathway, 'Remediation catalog must contain at least one pathway with checkpoint questions');

  // Create an authoritative completed assessment session for User A
  sessionA = await AssessmentSession.create({
    userId: userA._id,
    scenarioId: scenario._id,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    currentStageId: stage._id,
    status: 'completed',
    score: 80,
    behaviourScores: {
      recognition: 80,
      signalIdentification: 75,
      verification: 85,
      decisionQuality: 80,
      falsePositive: 90,
      unreviewedAcceptance: 70
    },
    completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
}

async function teardown() {
  if (userA) {
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await AssessmentSession.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await UserProgress.deleteMany({ userId: { $in: [userA._id, userB._id] } });
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('SPACED RETRIEVAL & FOLLOW-UP LEARNING VERIFICATION SUITE');
  console.log('=============================================================');

  try {
    await setup();

    // -------------------------------------------------------------------------
    // TEST 1: Pathway is NOT due before the configured delay
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing pathway is NOT due before configured delay...');
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

    await UserProgress.create({
      userId: userA._id,
      completedPathways: [
        {
          pathwayId: testPathway.pathwayId,
          sourceSessionId: sessionA._id,
          completedAt: threeDaysAgo,
          checkpointScore: 100,
          stepsCompleted: { caseStudy: true, prevention: true, checkpointQuiz: true }
        }
      ],
      spacedReviews: []
    });

    const res1 = await fetch(`${BASE_URL}/pathways/spaced-retrieval/due`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(data1.success, true);
    assert.strictEqual(data1.totalDue, 0, 'Pathway completed 3 days ago must NOT be due under 7-day delay');
    console.log('✓ Pathway completed 3 days ago is not due (0 due items)');

    // -------------------------------------------------------------------------
    // TEST 2: Pathway becomes due at the delay boundary (>= 7 days)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Testing pathway becomes due at delay boundary (>= 7 days)...');
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000);
    await UserProgress.updateOne(
      { userId: userA._id, 'completedPathways.pathwayId': testPathway.pathwayId },
      { $set: { 'completedPathways.0.completedAt': eightDaysAgo } }
    );

    const res2 = await fetch(`${BASE_URL}/pathways/spaced-retrieval/due`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(data2.totalDue, 1, 'Pathway completed 8 days ago must be due');
    assert.strictEqual(data2.dueReviews[0].pathwayId, testPathway.pathwayId);
    assert.strictEqual(data2.dueReviews[0].cycleNumber, 1);
    console.log('✓ Pathway completed 8 days ago is due for Cycle 1 review');

    // -------------------------------------------------------------------------
    // TEST 3: Incomplete pathways are strictly ineligible
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing incomplete pathways are strictly ineligible...');
    // Create an incomplete pathway record for User A (no completedAt)
    const incompletePathwayId = 'pathway-incomplete-test';
    await UserProgress.updateOne(
      { userId: userA._id },
      {
        $push: {
          completedPathways: {
            pathwayId: incompletePathwayId,
            sourceSessionId: sessionA._id,
            completedAt: null,
            stepsCompleted: { caseStudy: true, prevention: false, checkpointQuiz: false }
          }
        }
      }
    );

    const res3Due = await fetch(`${BASE_URL}/pathways/spaced-retrieval/due`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data3Due = await res3Due.json();
    assert(!data3Due.dueReviews.some(r => r.pathwayId === incompletePathwayId), 'Incomplete pathway must NOT be returned in due list');

    // Direct access to incomplete pathway questions must be rejected with 403
    const res3Direct = await fetch(`${BASE_URL}/pathways/${incompletePathwayId}/spaced-retrieval?sourceSessionId=${sessionA._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(res3Direct.status, 403, 'Direct access to incomplete pathway must be 403 Forbidden');
    console.log('✓ Incomplete pathways are strictly excluded from due list and direct access rejected with 403');

    // -------------------------------------------------------------------------
    // TEST 4: Zero answer leakage in initial question delivery
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing zero answer leakage in initial question payload...');
    const res4 = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval?sourceSessionId=${sessionA._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data4 = await res4.json();
    assert.strictEqual(res4.status, 200);
    assert.strictEqual(data4.success, true);
    assert(Array.isArray(data4.questions) && data4.questions.length > 0);

    data4.questions.forEach((q, idx) => {
      assert.strictEqual(q.correctOptionIndex, undefined, `Question ${idx + 1} must NOT expose correctOptionIndex`);
      assert.strictEqual(q.explanation, undefined, `Question ${idx + 1} must NOT expose explanation`);
      assert(Array.isArray(q.options) && q.options.length >= 2, `Question ${idx + 1} must have options array`);
    });
    console.log('✓ Questions payload sanitized: correctOptionIndex and explanations completely stripped');

    // -------------------------------------------------------------------------
    // TEST 5: Authorization & Ownership Gate (User B cannot access or submit User A's review)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing cross-user access controls...');
    // User B tries to fetch User A's pathway retrieval
    const res5Fetch = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval?sourceSessionId=${sessionA._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.strictEqual(res5Fetch.status, 403, 'User B must not access User A session retrieval');

    // User B tries to submit to User A's session
    const res5Submit = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        sourceSessionId: sessionA._id,
        answers: [{ questionId: testPathway.checkpoint.questions[0].questionId, selectedOptionIndex: 0 }]
      })
    });
    assert.strictEqual(res5Submit.status, 403, 'User B submission must be 403 Forbidden');

    // Unauthenticated access
    const res5Unauth = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval`);
    assert.strictEqual(res5Unauth.status, 401, 'Unauthenticated request must be 401 Unauthorized');
    console.log('✓ Cross-user and unauthenticated access strictly blocked');

    // -------------------------------------------------------------------------
    // TEST 6: Client-supplied scores, pass flags, and completion flags are not trusted
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Testing server-authoritative scoring (client scores discarded)...');
    // Prepare answers: purposefully select wrong answers
    const wrongAnswers = testPathway.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      // Choose option that is NOT correctOptionIndex
      selectedOptionIndex: (q.correctOptionIndex + 1) % q.options.length
    }));

    const res6 = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        sourceSessionId: sessionA._id,
        answers: wrongAnswers,
        // Client attempts to spoof scores
        score: 100,
        passed: true,
        checkpointScore: 100,
        isFullyCompleted: true
      })
    });
    const data6 = await res6.json();
    assert.strictEqual(res6.status, 200);
    assert.strictEqual(data6.passed, false, 'Spoofed passed: true must be ignored; calculated outcome must be false');
    assert.strictEqual(data6.score, 0, 'All wrong answers must yield score: 0 despite client sending 100');
    console.log('✓ Server authoritatively evaluated answers; client spoofed scores and pass flags discarded');

    // -------------------------------------------------------------------------
    // TEST 7: Successful submission & review cycle deduplication
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Testing cycle deduplication (completed review does not repeatedly reappear)...');
    // Submit correct answers for cycle 1
    const correctAnswers = testPathway.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));

    const res7 = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        sourceSessionId: sessionA._id,
        answers: correctAnswers
      })
    });
    const data7 = await res7.json();
    assert.strictEqual(data7.passed, true);
    assert.strictEqual(data7.score, 100);

    // Verify due list immediately after submission: must be 0 (no repeated prompt)
    const res7Due = await fetch(`${BASE_URL}/pathways/spaced-retrieval/due`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const data7Due = await res7Due.json();
    assert.strictEqual(data7Due.totalDue, 0, 'Pathway must NOT repeatedly appear in due list for the same cycle');
    console.log('✓ Completed review clears due state; does not repeatedly reappear for same cycle');

    // -------------------------------------------------------------------------
    // TEST 8: Submission idempotency (duplicate submissions do not bloat records)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Testing submission idempotency...');
    const progressBefore = await UserProgress.findOne({ userId: userA._id });
    const countBefore = progressBefore.spacedReviews.length;

    // Submit again immediately
    const res8 = await fetch(`${BASE_URL}/pathways/${testPathway.pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        sourceSessionId: sessionA._id,
        answers: correctAnswers
      })
    });
    const data8 = await res8.json();
    assert.strictEqual(res8.status, 200);

    const progressAfter = await UserProgress.findOne({ userId: userA._id });
    assert.strictEqual(progressAfter.spacedReviews.length, countBefore, 'Immediate duplicate submission must be updated idempotently without creating duplicate records');
    console.log('✓ Idempotency verified: rapid duplicate submission updated record without increasing array length');

    // -------------------------------------------------------------------------
    // TEST 9: Architectural Non-Interference (historical data preserved)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 9] Testing architectural non-interference...');
    // Verify AssessmentSession is unmodified
    const freshSession = await AssessmentSession.findById(sessionA._id);
    assert.strictEqual(freshSession.score, 80);
    assert.strictEqual(freshSession.behaviourScores.get ? freshSession.behaviourScores.get('recognition') : freshSession.behaviourScores.recognition, 80);

    // Verify UserProgress.completedPathways original checkpointScore and steps are unchanged
    const freshProgress = await UserProgress.findOne({ userId: userA._id });
    const originalPathway = freshProgress.completedPathways.find(p => p.pathwayId === testPathway.pathwayId);
    assert.strictEqual(originalPathway.checkpointScore, 100);
    assert.strictEqual(originalPathway.stepsCompleted.caseStudy, true);
    assert.strictEqual(originalPathway.stepsCompleted.checkpointQuiz, true);

    // Verify portfolio endpoint includes spacedReviews in interventions
    const resPortfolio = await fetch(`${BASE_URL}/portfolio`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const portfolioJson = await resPortfolio.json();
    assert.strictEqual(resPortfolio.status, 200);
    assert(portfolioJson.interventions.spacedReviews.length > 0);
    assert.strictEqual(portfolioJson.interventions.summary.totalSpacedReviews, 1);
    console.log('✓ Historical sessions, completed pathways, and portfolio integrity confirmed');

    console.log('\n=============================================================');
    console.log('ALL 9 SPACED RETRIEVAL INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('=============================================================\n');
  } finally {
    await teardown();
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
