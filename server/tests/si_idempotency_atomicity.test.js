/**
 * Automated Test Suite: Signal Identification Atomicity & Idempotency Engine
 * Phase 4.3 Wave 3
 * 
 * Verifies:
 * 1. Mandatory Signal Probe Atomicity:
 *    - Submitting stage without probe -> HTTP 400 (INCOMPLETE_STAGE_SUBMISSION)
 *    - Zero DB writes: session does not advance, no AssessmentDecision inserted
 *    - Submitting invalid probe reference -> HTTP 400 (INVALID_PROBE_REFERENCE)
 * 2. Idempotent Retry Contract:
 *    - Same idempotency key + same payload -> HTTP 200 (isRetry: true)
 *    - Zero duplicate AssessmentDecision records created
 * 3. Conflict Detection:
 *    - Same idempotency key + different payload -> HTTP 409 (IDEMPOTENCY_KEY_PAYLOAD_MISMATCH)
 *    - Replay attempt with different key on completed stage -> HTTP 409 (STAGE_DECISION_ALREADY_COMMITTED / STAGE_OUT_OF_SEQUENCE)
 * 4. Database Partial Unique Index Verification:
 *    - Compound unique index on { assessmentSessionId: 1, idempotencyKey: 1 }
 *    - Allows multiple null/undefined idempotency keys without duplicate key collision
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

const TEST_PORT = 5997;
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

  const email = 'atomicity_idempotency_tester@test.com';
  await User.deleteOne({ email });
  testUser = await User.create({
    fullName: 'Atomicity Tester',
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
      await AssessmentDecision.deleteMany({
        assessmentSessionId: {
          $in: (await AssessmentSession.find({ userId: testUser._id })).map(s => s._id)
        }
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

async function startBaselineSession() {
  const res = await fetch(`${BASE_URL}/assessments/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({ scenarioCode: 'baseline', scenarioVersion: 2 })
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
  console.log('TEST SUITE: SIGNAL IDENTIFICATION ATOMICITY & IDEMPOTENCY');
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
    // 1. MANDATORY SIGNAL PROBE ATOMICITY & REJECTION
    // ---------------------------------------------------------------
    console.log('--- 1. Mandatory Signal Probe Atomicity & Zero-Write Rejection ---');

    let sessionData = await startBaselineSession();
    let sessionId = sessionData.sessionId;

    // Advance Stage 1 (Legitimate banking - no probe) to reach Stage 2 (Courier SMS - has probe)
    const stage1Id = sessionData.stage.id;
    const stage1Decs = await ScenarioDecision.find({ stageId: stage1Id });
    const s1Res = await submitStep({
      assessmentSessionId: sessionId,
      stageId: stage1Id,
      decisionId: stage1Decs[0]._id,
      idempotencyKey: 'key-stage-1'
    });
    assert.strictEqual(s1Res.status, 200, 'Stage 1 submission must succeed');
    assert(s1Res.data.stage, 'Stage 1 must return next stage');

    const stage2 = s1Res.data.stage;
    assert.strictEqual(stage2.hasSignalProbe, true, 'Stage 2 must have hasSignalProbe: true');
    assert(stage2.signalProbes && stage2.signalProbes.length === 4, 'Stage 2 must have 4 probe options');

    const stage2Decs = await ScenarioDecision.find({ stageId: stage2.id });

    await test('Submitting stage without signalProbeDecisionId fails with HTTP 400 (INCOMPLETE_STAGE_SUBMISSION)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id,
        idempotencyKey: 'key-stage-2-missing-probe'
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'INCOMPLETE_STAGE_SUBMISSION');

      // Verify ZERO database writes occurred
      const decisionsInDb = await AssessmentDecision.find({ assessmentSessionId: sessionId, stageId: stage2.id });
      assert.strictEqual(decisionsInDb.length, 0, 'No AssessmentDecision record should be created');

      const sessionInDb = await AssessmentSession.findById(sessionId);
      assert.strictEqual(sessionInDb.currentStageId.toString(), stage2.id.toString(), 'Session currentStageId must not advance');
      assert.strictEqual(sessionInDb.stagesCompleted, 1, 'stagesCompleted must remain at 1');
    });

    await test('Submitting an invalid probe ID fails with HTTP 400 (INVALID_PROBE_REFERENCE)', async () => {
      const fakeProbeId = new mongoose.Types.ObjectId();
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id,
        signalProbeDecisionId: fakeProbeId,
        idempotencyKey: 'key-stage-2-fake-probe'
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error.code, 'INVALID_PROBE_REFERENCE');

      const decisionsInDb = await AssessmentDecision.find({ assessmentSessionId: sessionId, stageId: stage2.id });
      assert.strictEqual(decisionsInDb.length, 0, 'No AssessmentDecision record should be created');
    });

    // ---------------------------------------------------------------
    // 2. IDEMPOTENT RETRY ENGINE
    // ---------------------------------------------------------------
    console.log('\n--- 2. Idempotent Safe Retry Verification ---');

    const validProbeId = stage2.signalProbes[0].id;
    const idempotencyKeyStage2 = 'idemp-stg2-abc-123';

    await test('Valid submission with probe and idempotency key succeeds with HTTP 200', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id,
        signalProbeDecisionId: validProbeId,
        idempotencyKey: idempotencyKeyStage2
      });

      assert.strictEqual(res.status, 200);
      assert(res.data.stage, 'Should return next stage');

      const decisionDoc = await AssessmentDecision.findOne({
        assessmentSessionId: sessionId,
        stageId: stage2.id
      });
      assert(decisionDoc, 'AssessmentDecision must exist');
      assert.strictEqual(decisionDoc.idempotencyKey, idempotencyKeyStage2);
      assert.strictEqual(decisionDoc.signalProbeDecisionId.toString(), validProbeId.toString());
    });

    await test('Submitting exact same payload with same idempotency key returns HTTP 200 (isRetry: true)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id,
        signalProbeDecisionId: validProbeId,
        idempotencyKey: idempotencyKeyStage2
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.isRetry, true);

      // Verify that no duplicate decision was inserted
      const count = await AssessmentDecision.countDocuments({
        assessmentSessionId: sessionId,
        stageId: stage2.id
      });
      assert.strictEqual(count, 1, 'Exactly one AssessmentDecision must exist in DB');
    });

    // ---------------------------------------------------------------
    // 3. CONFLICT DETECTION CONTRACT
    // ---------------------------------------------------------------
    console.log('\n--- 3. Conflict Detection Contract ---');

    await test('Submitting same idempotency key with different decision returns HTTP 409 (IDEMPOTENCY_KEY_PAYLOAD_MISMATCH)', async () => {
      const differentDecision = stage2Decs[1] || stage2Decs[0];
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: differentDecision._id,
        signalProbeDecisionId: stage2.signalProbes[1].id,
        idempotencyKey: idempotencyKeyStage2
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.error.code, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
    });

    await test('Submitting same idempotency key with SAME primary decision but DIFFERENT signalProbeDecisionId returns HTTP 409 without mutating DB', async () => {
      const originalDocBefore = await AssessmentDecision.findOne({
        assessmentSessionId: sessionId,
        stageId: stage2.id
      });
      assert.strictEqual(originalDocBefore.signalProbeDecisionId.toString(), validProbeId.toString());

      // Attempt conflict: same primary decision, DIFFERENT probe
      const differentProbeId = stage2.signalProbes.find(p => p.id.toString() !== validProbeId.toString()).id;
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id, // SAME primary decision
        signalProbeDecisionId: differentProbeId, // DIFFERENT probe
        idempotencyKey: idempotencyKeyStage2 // SAME key
      });

      assert.strictEqual(res.status, 409, 'Must return HTTP 409 on probe mismatch');
      assert.strictEqual(res.data.error.code, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');

      // Assert ZERO mutation occurred in DB
      const originalDocAfter = await AssessmentDecision.findOne({
        assessmentSessionId: sessionId,
        stageId: stage2.id
      });
      assert.strictEqual(originalDocAfter.signalProbeDecisionId.toString(), validProbeId.toString(), 'Original probe decision must not be mutated');
      assert.strictEqual(originalDocAfter.decisionId.toString(), stage2Decs[0]._id.toString(), 'Primary decision must not be mutated');

      // Assert identical retry still works idempotently
      const retryRes = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id,
        signalProbeDecisionId: validProbeId,
        idempotencyKey: idempotencyKeyStage2
      });
      assert.strictEqual(retryRes.status, 200);
      assert.strictEqual(retryRes.data.isRetry, true);
    });

    await test('Attempting to replay already committed stage with a new key returns HTTP 409 (STAGE_DECISION_ALREADY_COMMITTED)', async () => {
      const res = await submitStep({
        assessmentSessionId: sessionId,
        stageId: stage2.id,
        decisionId: stage2Decs[0]._id,
        signalProbeDecisionId: validProbeId,
        idempotencyKey: 'new-different-key-for-old-stage'
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.error.code, 'STAGE_DECISION_ALREADY_COMMITTED');
    });

    // ---------------------------------------------------------------
    // 4. PARTIAL UNIQUE INDEX VERIFICATION
    // ---------------------------------------------------------------
    console.log('\n--- 4. Partial Unique Index Compatibility ---');

    await test('Multiple AssessmentDecisions with undefined idempotencyKey do not collide (partial filter expression)', async () => {
      const stageA = new mongoose.Types.ObjectId();
      const stageB = new mongoose.Types.ObjectId();

      const docA = await AssessmentDecision.create({
        assessmentSessionId: sessionId,
        stageId: stageA,
        decisionId: new mongoose.Types.ObjectId()
      });

      const docB = await AssessmentDecision.create({
        assessmentSessionId: sessionId,
        stageId: stageB,
        decisionId: new mongoose.Types.ObjectId()
      });

      assert(docA && docB, 'Both unkeyed documents must be created without duplicate key collision');

      // Cleanup artificial docs
      await AssessmentDecision.deleteOne({ _id: docA._id });
      await AssessmentDecision.deleteOne({ _id: docB._id });
    });

    console.log('\n=============================================================');
    console.log(`ALL ${passed}/${total} ATOMICITY & IDEMPOTENCY CHECKS PASSED 100%!`);
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

