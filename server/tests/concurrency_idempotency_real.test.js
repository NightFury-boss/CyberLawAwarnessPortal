/**
 * Automated Test Suite: Real Concurrent Idempotency & Transaction Verification
 * Phase 4.3 Acceptance Verification
 * 
 * Verifies:
 * 1. Idempotency Key Validation (Task 4):
 *    - Missing key on v2 -> HTTP 400 (MISSING_IDEMPOTENCY_KEY)
 *    - Empty string -> HTTP 400 (INVALID_IDEMPOTENCY_KEY)
 *    - Whitespace string -> HTTP 400 (INVALID_IDEMPOTENCY_KEY)
 *    - Malformed format -> HTTP 400 (MALFORMED_IDEMPOTENCY_KEY)
 * 2. Real Concurrent Request Handling (Task 3):
 *    - Simultaneous identical submissions (Promise.all) -> 1 committed, 1 idempotent HTTP 200 (isRetry: true)
 *    - Simultaneous conflicting submissions (same key, diff payload) -> 1 committed HTTP 200, 1 HTTP 409
 *    - Simultaneous different-key submissions for same stage -> 1 committed HTTP 200, 1 HTTP 409
 *    - Key reused on a different stage -> HTTP 409
 * 3. Replica-Set ACID Multi-Document Transactions:
 *    - Aborted transaction leaves zero partial state in database
 * 4. Historical v1 session compatibility:
 *    - v1 session succeeds without idempotencyKey
 *    - Unkeyed documents coexist peacefully under partial unique index
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const simulationRoutes = require('../routes/simulations');
const authRoutes = require('../routes/auth');

const TEST_PORT = 5993;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server;
let testUser;
let testToken;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/assessments', simulationRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const email = `concurrency_tester_${Date.now()}@test.com`;
  testUser = await User.create({
    fullName: 'Concurrency Tester',
    email,
    passwordHash: bcrypt.hashSync('Pass123!Secure', 10),
    role: 'user',
    isActive: true
  });

  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Pass123!Secure' })
  });
  const loginData = await loginRes.json();
  testToken = loginData.token;
}

async function teardown() {
  try {
    if (testUser) {
      const userSessions = await AssessmentSession.find({ userId: testUser._id });
      await AssessmentDecision.deleteMany({
        assessmentSessionId: { $in: userSessions.map(s => s._id) }
      });
      await AssessmentSession.deleteMany({ userId: testUser._id });
      await User.deleteOne({ _id: testUser._id });
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
    console.log('[Database] Mongoose disconnected.');
  }
}

async function startSession(code = 'baseline', version = 2) {
  const res = await fetch(`${BASE_URL}/assessments/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({ scenarioCode: code, scenarioVersion: version })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200, `Failed to start session: ${JSON.stringify(data)}`);
  return data;
}

async function submitStep(payload) {
  const res = await fetch(`${BASE_URL}/assessments/submit-step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('TEST SUITE: REAL CONCURRENT IDEMPOTENCY & TRANSACTION SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  try {
    await setup();

    // ---------------------------------------------------------------
    // 1. IDEMPOTENCY KEY VALIDATION (TASK 4)
    // ---------------------------------------------------------------
    console.log('--- 1. Idempotency Key Validation Engine ---');

    const sessionData = await startSession('baseline', 2);
    const sessionId = sessionData.sessionId;
    const stage1Id = sessionData.stage.id;
    const stage1Decs = await ScenarioDecision.find({ stageId: stage1Id });
    assert(stage1Decs.length > 0, 'Stage 1 decisions must exist');

    await test('Missing idempotencyKey on v2 session returns HTTP 400 (MISSING_IDEMPOTENCY_KEY)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: stage1Decs[0]._id
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'MISSING_IDEMPOTENCY_KEY');
    });

    await test('Empty string idempotencyKey returns HTTP 400 (INVALID_IDEMPOTENCY_KEY)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: stage1Decs[0]._id,
        idempotencyKey: ''
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'INVALID_IDEMPOTENCY_KEY');
    });

    await test('Whitespace-only idempotencyKey returns HTTP 400 (INVALID_IDEMPOTENCY_KEY)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: stage1Decs[0]._id,
        idempotencyKey: '     '
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'INVALID_IDEMPOTENCY_KEY');
    });

    await test('Malformed idempotencyKey (< 8 chars) returns HTTP 400 (MALFORMED_IDEMPOTENCY_KEY)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: stage1Decs[0]._id,
        idempotencyKey: 'short'
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'MALFORMED_IDEMPOTENCY_KEY');
    });

    await test('Malformed idempotencyKey (disallowed characters) returns HTTP 400 (MALFORMED_IDEMPOTENCY_KEY)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: stage1Decs[0]._id,
        idempotencyKey: 'invalid$char#key*123'
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'MALFORMED_IDEMPOTENCY_KEY');
    });

    // ---------------------------------------------------------------
    // 2. REAL SIMULTANEOUS CONCURRENCY REQUESTS (TASK 3)
    // ---------------------------------------------------------------
    console.log('\n--- 2. Real Concurrent Simultaneous Submissions ---');

    await test('Simultaneous identical requests (same key & payload): exactly one commits, other returns HTTP 200 (isRetry: true)', async () => {
      const concurrentKey = `idemp-simul-ident-${Date.now()}`;
      const payload = {
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: stage1Decs[0]._id,
        idempotencyKey: concurrentKey
      };

      // Fire both requests genuinely simultaneously via Promise.all
      const [res1, res2] = await Promise.all([
        submitStep(payload),
        submitStep(payload)
      ]);

      const statuses = [res1.status, res2.status];
      assert.deepStrictEqual(statuses, [200, 200], 'Both requests must resolve successfully with HTTP 200');

      const isRetryCount = (res1.data.isRetry ? 1 : 0) + (res2.data.isRetry ? 1 : 0);
      const normalCount = (res1.data.stage ? 1 : 0) + (res2.data.stage ? 1 : 0);

      assert.strictEqual(normalCount, 1, 'Exactly one request should advance the stage');
      assert.strictEqual(isRetryCount, 1, 'Exactly one request should be acknowledged as an idempotent retry');

      // Verify DB state
      const decisionsInDb = await AssessmentDecision.find({ assessmentSessionId: sessionId, stageId: stage1Id });
      assert.strictEqual(decisionsInDb.length, 1, 'Exactly one AssessmentDecision record must exist');

      const sessionInDb = await AssessmentSession.findById(sessionId);
      assert.strictEqual(sessionInDb.stagesCompleted, 1, 'stagesCompleted must be exactly 1 (no duplicate increments)');
    });

    // Advance to Stage 2
    const sessionDocAfterStage1 = await AssessmentSession.findById(sessionId);
    const stage2Id = sessionDocAfterStage1.currentStageId;
    const stage2 = await ScenarioStage.findById(stage2Id);
    assert(stage2.hasSignalProbe, 'Stage 2 must have signal probe');
    const stage2Decs = await ScenarioDecision.find({ stageId: stage2Id });
    const probeOption = stage2.signalProbes[0]._id;

    await test('Simultaneous conflicting requests (same key, different payloads): 1 commits (HTTP 200), 1 rejected (HTTP 409)', async () => {
      const conflictKey = `idemp-simul-conflict-${Date.now()}`;
      const payloadA = {
        assessmentSessionId: sessionId,
        stageId: stage2Id,
        decisionId: stage2Decs[0]._id,
        signalProbeDecisionId: probeOption,
        idempotencyKey: conflictKey
      };
      const payloadB = {
        assessmentSessionId: sessionId,
        stageId: stage2Id,
        decisionId: stage2Decs[1]._id,
        signalProbeDecisionId: probeOption,
        idempotencyKey: conflictKey
      };

      const [resA, resB] = await Promise.all([
        submitStep(payloadA),
        submitStep(payloadB)
      ]);

      const has200 = resA.status === 200 || resB.status === 200;
      const has409 = resA.status === 409 || resB.status === 409;

      assert(has200, 'One request must succeed with HTTP 200');
      assert(has409, 'Conflicting request must be rejected with HTTP 409');

      const failedRes = resA.status === 409 ? resA : resB;
      assert.strictEqual(failedRes.data.error.code, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');

      // Verify DB state
      const decisionsInDb = await AssessmentDecision.find({ assessmentSessionId: sessionId, stageId: stage2Id });
      assert.strictEqual(decisionsInDb.length, 1, 'Exactly one AssessmentDecision record committed');

      const sessionInDb = await AssessmentSession.findById(sessionId);
      assert.strictEqual(sessionInDb.stagesCompleted, 2, 'stagesCompleted must be exactly 2');
    });

    // Advance to Stage 3
    const sessionDocAfterStage2 = await AssessmentSession.findById(sessionId);
    const stage3Id = sessionDocAfterStage2.currentStageId;
    const stage3 = await ScenarioStage.findById(stage3Id);
    const stage3Decs = await ScenarioDecision.find({ stageId: stage3Id });
    const probeOption3 = stage3.signalProbes[0]._id;

    await test('Simultaneous submissions for same stage with DIFFERENT keys: 1 commits (HTTP 200), 1 rejected (HTTP 409)', async () => {
      const key1 = `idemp-stage3-key-one-${Date.now()}`;
      const key2 = `idemp-stage3-key-two-${Date.now()}`;

      const payload1 = {
        assessmentSessionId: sessionId,
        stageId: stage3Id,
        decisionId: stage3Decs[0]._id,
        signalProbeDecisionId: probeOption3,
        idempotencyKey: key1
      };
      const payload2 = {
        assessmentSessionId: sessionId,
        stageId: stage3Id,
        decisionId: stage3Decs[0]._id,
        signalProbeDecisionId: probeOption3,
        idempotencyKey: key2
      };

      const [res1, res2] = await Promise.all([
        submitStep(payload1),
        submitStep(payload2)
      ]);

      const has200 = res1.status === 200 || res2.status === 200;
      const has409 = res1.status === 409 || res2.status === 409;

      assert(has200, 'One request must succeed with HTTP 200');
      assert(has409, 'Other request must fail with HTTP 409 (STAGE_DECISION_ALREADY_COMMITTED)');

      const failedRes = res1.status === 409 ? res1 : res2;
      assert.strictEqual(failedRes.data.error.code, 'STAGE_DECISION_ALREADY_COMMITTED');

      const count = await AssessmentDecision.countDocuments({ assessmentSessionId: sessionId, stageId: stage3Id });
      assert.strictEqual(count, 1, 'Exactly one decision committed in database');
    });

    // Advance to Stage 4 to test cross-stage key reuse
    const sessionDocAfterStage3 = await AssessmentSession.findById(sessionId);
    const stage4Id = sessionDocAfterStage3.currentStageId;
    const stage4Decs = await ScenarioDecision.find({ stageId: stage4Id });

    await test('Reusing an idempotency key previously used for a different stage returns HTTP 409', async () => {
      // Re-use key1 from Stage 3 on Stage 4
      const reusedKey = `idemp-stage3-key-one-${Date.now()}`; // previously committed key
      const committedDecision = await AssessmentDecision.findOne({ assessmentSessionId: sessionId, stageId: stage3Id });
      const oldKey = committedDecision.idempotencyKey;

      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage4Id,
        decisionId: stage4Decs[0]._id,
        idempotencyKey: oldKey
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.error.code, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
    });

    // ---------------------------------------------------------------
    // 3. REPLICA SET TRANSACTION ROLLBACK (TASK 3)
    // ---------------------------------------------------------------
    console.log('\n--- 3. Replica-Set ACID Multi-Document Transaction Rollback ---');

    await test('Failed/Aborted multi-document transaction leaves zero partial state in MongoDB Atlas', async () => {
      const mockSessionId = new mongoose.Types.ObjectId();
      const mockStageId = new mongoose.Types.ObjectId();
      const mockDecisionId = new mongoose.Types.ObjectId();

      const mongoSession = await mongoose.startSession();
      mongoSession.startTransaction();

      // Step A: Insert decision within transaction
      await AssessmentDecision.create([{
        assessmentSessionId: mockSessionId,
        stageId: mockStageId,
        decisionId: mockDecisionId,
        idempotencyKey: 'tx-rollback-test-key-12345'
      }], { session: mongoSession });

      // Step B: Abort transaction (simulating mid-flight crash or CAS mismatch)
      await mongoSession.abortTransaction();
      await mongoSession.endSession();

      // Step C: Verify outside the transaction
      const foundInDb = await AssessmentDecision.findOne({ assessmentSessionId: mockSessionId });
      assert.strictEqual(foundInDb, null, 'No decision should exist in database after transaction rollback');
    });

    // ---------------------------------------------------------------
    // 4. HISTORICAL V1 SESSION COMPATIBILITY (TASK 6)
    // ---------------------------------------------------------------
    console.log('\n--- 4. Historical v1 Session Compatibility ---');

    await test('v1 session submits without idempotencyKey and coexists under partial unique index', async () => {
      // Create explicit v1 session
      const v1Scenario = await Scenario.findOne({ slug: 'baseline', version: 1 });
      const firstV1Stage = await ScenarioStage.findOne({ scenarioId: v1Scenario._id }).sort({ stageOrder: 1 });
      const v1Decs = await ScenarioDecision.find({ stageId: firstV1Stage._id });

      const v1Session = await AssessmentSession.create({
        userId: testUser._id,
        scenarioId: v1Scenario._id,
        scenarioCode: 'baseline',
        scoringVersion: 1,
        currentStageId: firstV1Stage._id,
        status: 'in-progress',
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Submit WITHOUT idempotencyKey (historical v1 client contract)
      const res = await submitStep({
        assessmentSessionId: v1Session._id,
        stageId: firstV1Stage._id,
        decisionId: v1Decs[0]._id
      });

      assert.strictEqual(res.status, 200, 'v1 session without idempotencyKey must succeed');

      const v1DecisionDoc = await AssessmentDecision.findOne({
        assessmentSessionId: v1Session._id,
        stageId: firstV1Stage._id
      });
      assert(v1DecisionDoc, 'v1 AssessmentDecision must be created');
      assert.strictEqual(v1DecisionDoc.idempotencyKey, undefined, 'idempotencyKey should remain undefined');

      // Verify that another unkeyed decision can be created without duplicate key collision
      const secondV1Stage = await ScenarioStage.findOne({ scenarioId: v1Scenario._id, stageOrder: 2 });
      const unkeyedDoc2 = await AssessmentDecision.create({
        assessmentSessionId: v1Session._id,
        stageId: secondV1Stage._id,
        decisionId: new mongoose.Types.ObjectId()
      });
      assert(unkeyedDoc2, 'Second unkeyed decision must insert without collision');

      // Cleanup
      await AssessmentDecision.deleteMany({ assessmentSessionId: v1Session._id });
      await AssessmentSession.deleteOne({ _id: v1Session._id });
    });

    console.log('\n=============================================================');
    console.log(`ALL ${passed}/${total} CONCURRENCY & IDEMPOTENCY CHECKS PASSED 100%!`);
    console.log('=============================================================\n');

  } finally {
    await teardown();
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  });
}

module.exports = runTests;

