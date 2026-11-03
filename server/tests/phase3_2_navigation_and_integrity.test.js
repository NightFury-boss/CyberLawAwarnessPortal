/**
 * Phase 3.2 Verification Suite: Navigation, Routing & Final Assessment Integrity
 *
 * Verifies:
 * 1. Server-side baseline prerequisite enforcement for final assessment (HTTP 403 PREREQUISITE_NOT_MET)
 * 2. Uncompleted / in-progress baseline does not satisfy final prerequisite
 * 3. Cross-user isolation: User B's completed baseline does not allow User A to start final
 * 4. Completed baseline learner can start final assessment
 * 5. Active in-progress final session is resumed without creating duplicate sessions
 * 6. Historical baseline session immutability during final session lifecycle
 * 7. Curriculum chapter slugs integrity: all 6 featured chapters exist and are published
 * 8. Semantic accuracy: it-act-fundamentals is verified as IT Act 2000 statutory framework
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const LearningModule = require('../models/LearningModule');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const simulationRoutes = require('../routes/simulations');

const TEST_PORT = 5994;
let server;
let userUnassessed;
let userWithCompletedBaseline;
let userWithInProgressBaseline;
let tokenUnassessed;
let tokenCompleted;
let tokenInProgress;
let baselineSession;
let baselineScenario;
let finalScenario;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/assessments', simulationRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Phase 3.2 Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const timestamp = Date.now();
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_cyber_law_portal';

  // Find or create baseline and final scenarios
  baselineScenario = await Scenario.findOne({ code: 'baseline' });
  let baselineStage = baselineScenario ? await ScenarioStage.findOne({ scenarioId: baselineScenario._id }) : null;
  if (!baselineScenario) {
    baselineScenario = await Scenario.create({
      title: 'Digital Day Baseline Assessment',
      slug: 'digital-day-baseline',
      code: 'baseline',
      description: 'Baseline scenario',
      version: 2,
      difficulty: 'Intermediate'
    });
  }
  if (!baselineStage) {
    baselineStage = await ScenarioStage.create({
      scenarioId: baselineScenario._id,
      stageOrder: 1,
      title: 'Suspicious Delivery SMS',
      description: 'You receive an urgent message',
      mockInterfaceType: 'sms'
    });
  }

  finalScenario = await Scenario.findOne({ code: 'final' });
  let finalStage = finalScenario ? await ScenarioStage.findOne({ scenarioId: finalScenario._id }) : null;
  if (!finalScenario) {
    finalScenario = await Scenario.create({
      title: 'Final Cyber Awareness Evaluation',
      slug: 'final-evaluation',
      code: 'final',
      description: 'Final scenario',
      version: 2,
      difficulty: 'Intermediate'
    });
  }
  if (!finalStage) {
    finalStage = await ScenarioStage.create({
      scenarioId: finalScenario._id,
      stageOrder: 1,
      title: 'Emergency Account Verification',
      description: 'You receive an urgent account notice',
      mockInterfaceType: 'sms'
    });
  }

  // Create test users
  userUnassessed = await User.create({
    fullName: `Unassessed Learner ${timestamp}`,
    email: `unassessed_${timestamp}@example.com`,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    role: 'user'
  });

  userWithCompletedBaseline = await User.create({
    fullName: `Completed Baseline Learner ${timestamp}`,
    email: `completed_baseline_${timestamp}@example.com`,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    role: 'user'
  });

  userWithInProgressBaseline = await User.create({
    fullName: `In-Progress Learner ${timestamp}`,
    email: `inprogress_baseline_${timestamp}@example.com`,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    role: 'user'
  });

  tokenUnassessed = jwt.sign({ id: userUnassessed._id }, secret, { expiresIn: '1h' });
  tokenCompleted = jwt.sign({ id: userWithCompletedBaseline._id }, secret, { expiresIn: '1h' });
  tokenInProgress = jwt.sign({ id: userWithInProgressBaseline._id }, secret, { expiresIn: '1h' });

  // Baseline completed session
  baselineSession = await AssessmentSession.create({
    userId: userWithCompletedBaseline._id,
    scenarioId: baselineScenario._id,
    currentStageId: baselineStage._id,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    status: 'completed',
    score: 80,
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    behaviourScores: new Map([
      ['recognition', 85],
      ['signalIdentification', 80],
      ['verification', 75],
      ['decisionQuality', 80],
      ['falsePositive', 90],
      ['unreviewedAcceptance', 70]
    ])
  });

  // Baseline in-progress session
  await AssessmentSession.create({
    userId: userWithInProgressBaseline._id,
    scenarioId: baselineScenario._id,
    currentStageId: baselineStage._id,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    status: 'in-progress',
    score: 0,
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000)
  });
}

async function teardown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await AssessmentSession.deleteMany({
    userId: { $in: [userUnassessed._id, userWithCompletedBaseline._id, userWithInProgressBaseline._id] }
  });
  await User.deleteMany({
    _id: { $in: [userUnassessed._id, userWithCompletedBaseline._id, userWithInProgressBaseline._id] }
  });
  await mongoose.disconnect();
}

async function runTests() {
  console.log('=============================================================');
  console.log('🚀 RUNNING PHASE 3.2 VERIFICATION TEST SUITE');
  console.log('=============================================================');

  try {
    await setup();

    // 1. Direct POST /api/assessments/start with scenarioCode: 'final' by unassessed learner
    console.log('\n[Test 1] Unassessed learner direct POST /api/assessments/start (scenarioCode: "final")...');
    {
      const res = await fetch(`http://localhost:${TEST_PORT}/api/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUnassessed}`
        },
        body: JSON.stringify({ scenarioCode: 'final' })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 403, 'Should reject with HTTP 403 Forbidden');
      assert.strictEqual(data.error?.code, 'PREREQUISITE_NOT_MET', 'Should specify PREREQUISITE_NOT_MET error code');
      assert.strictEqual(data.success, false);
      assert.ok(data.error?.message?.includes('First Check'), 'Message must guide learner to complete First Check');
      console.log('  * PASS: Unassessed learner blocked with HTTP 403 and educational prerequisite message.');
    }

    // 2. Direct POST /api/assessments/start with scenarioCode: 'final' by learner with in-progress baseline
    console.log('\n[Test 2] Learner with in-progress baseline attempts to start final assessment...');
    {
      const res = await fetch(`http://localhost:${TEST_PORT}/api/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenInProgress}`
        },
        body: JSON.stringify({ scenarioCode: 'final' })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 403, 'Incomplete baseline must not satisfy prerequisite');
      assert.strictEqual(data.error?.code, 'PREREQUISITE_NOT_MET');
      console.log('  * PASS: In-progress baseline correctly rejected with HTTP 403.');
    }

    // 3. Learner with completed baseline starts final assessment successfully
    console.log('\n[Test 3] Learner with completed baseline starts final assessment...');
    let activeFinalSessionId;
    {
      const res = await fetch(`http://localhost:${TEST_PORT}/api/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompleted}`
        },
        body: JSON.stringify({ scenarioCode: 'final' })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, `Expected HTTP 200, got ${res.status}`);
      assert.ok(data.sessionId, 'Should return sessionId');
      assert.ok(data.stage, 'Should return initial stage');
      activeFinalSessionId = data.sessionId;

      const createdSession = await AssessmentSession.findById(activeFinalSessionId);
      assert.ok(createdSession, 'Session must exist in database');
      assert.strictEqual(createdSession.scenarioCode, 'final');
      assert.strictEqual(createdSession.status, 'in-progress');
      console.log(`  * PASS: Final assessment created successfully (Session ID: ${activeFinalSessionId}).`);
    }

    // 4. In-progress final assessment session resumption
    console.log('\n[Test 4] Resumption of active in-progress final assessment...');
    {
      const res = await fetch(`http://localhost:${TEST_PORT}/api/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompleted}`
        },
        body: JSON.stringify({ scenarioCode: 'final' })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200, 'Resumption should return HTTP 200');
      assert.strictEqual(data.resumed, true, 'Should flag resumed: true');
      assert.strictEqual(String(data.sessionId), String(activeFinalSessionId), 'Must return the same active session');

      // Verify no duplicate final sessions were created in the database
      const finalCount = await AssessmentSession.countDocuments({
        userId: userWithCompletedBaseline._id,
        scenarioCode: 'final'
      });
      assert.strictEqual(finalCount, 1, 'Exactly one final assessment session must exist');
      console.log('  * PASS: Active final session successfully resumed without duplicating records.');
    }

    // 5. Historical baseline session immutability
    console.log('\n[Test 5] Historical baseline session immutability...');
    {
      const baselineAfter = await AssessmentSession.findById(baselineSession._id);
      assert.strictEqual(baselineAfter.status, 'completed');
      assert.strictEqual(baselineAfter.score, 80);
      assert.strictEqual(baselineAfter.behaviourScores.get('recognition'), 85);
      console.log('  * PASS: Historical baseline record remained 100% frozen and unmodified.');
    }

    // 5b. Expired final assessment cannot be resumed
    console.log('\n[Test 5b] Expired final assessment session cannot be resumed...');
    {
      // Fast-forward active final session expiration to the past
      await AssessmentSession.findByIdAndUpdate(activeFinalSessionId, {
        expiresAt: new Date(Date.now() - 60000)
      });

      const res = await fetch(`http://localhost:${TEST_PORT}/api/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompleted}`
        },
        body: JSON.stringify({ scenarioCode: 'final' })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.resumed, undefined, 'Expired session must NOT be resumed');
      assert.notStrictEqual(String(data.sessionId), String(activeFinalSessionId), 'A new session must be created');
      console.log('  * PASS: Expired final session correctly rejected for resumption; fresh session initialized.');
    }

    // 5c. Strict cross-user prerequisite boundary
    console.log('\n[Test 5c] Cross-user prerequisite boundary...');
    {
      // userWithCompletedBaseline has completed baseline; userUnassessed does not.
      const res = await fetch(`http://localhost:${TEST_PORT}/api/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenUnassessed}`
        },
        body: JSON.stringify({ scenarioCode: 'final' })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 403, 'Cross-user baseline completion must NOT unlock final for other users');
      assert.strictEqual(data.error?.code, 'PREREQUISITE_NOT_MET');
      console.log('  * PASS: Cross-user boundary strictly enforced. Another user baseline cannot unlock final assessment.');
    }

    // 6. Curriculum chapter slugs integrity in database
    console.log('\n[Test 6] Curriculum constellation chapter slugs verification...');
    {
      const expectedSlugs = [
        'digital-identity-foundations',
        'phishing-social-engineering',
        'upi-qr-payment-fraud',
        'passwords-mfa-passkeys',
        'digital-evidence-bsa-63',
        'it-act-fundamentals'
      ];

      for (const slug of expectedSlugs) {
        const moduleDoc = await LearningModule.findOne({ slug });
        assert.ok(moduleDoc, `Module with slug '${slug}' must exist in LearningModule collection`);
        assert.strictEqual(moduleDoc.published, true, `Module '${slug}' must be published`);
        console.log(`  * PASS: Slugs matched in catalog: '${slug}' -> "${moduleDoc.title}"`);
      }
    }

    // 7. IT Act Statutory Framework semantic check
    console.log('\n[Test 7] IT Act Statutory Framework semantic accuracy...');
    {
      const itActModule = await LearningModule.findOne({ slug: 'it-act-fundamentals' });
      assert.ok(itActModule, 'Module it-act-fundamentals must exist');
      assert.strictEqual(itActModule.title, 'Understanding the Information Technology Act');
      assert.strictEqual(itActModule.category, 'Indian Cyber Law');
      assert.ok(
        itActModule.relatedLawSections.some(s => s.toLowerCase().includes('it act') || s.includes('Section 43') || s.includes('Section 66')),
        'Related laws must reference IT Act sections, not BNS'
      );
      console.log('  * PASS: it-act-fundamentals verified as authoritative IT Act 2000 statutory framework.');
    }

    console.log('\n=============================================================');
    console.log('✅ ALL 7 PHASE 3.2 VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('=============================================================\n');
  } finally {
    await teardown();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
