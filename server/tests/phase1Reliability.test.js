const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentDecision = require('../models/AssessmentDecision');
const ScenarioStage = require('../models/ScenarioStage');
const connectDB = require('../config/db');

const BASE_URL = 'http://127.0.0.1:5000';

async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, body: data };
}

async function runReliabilityTests() {
  console.log('=============================================================');
  console.log('PHASE 1.1: FIRST-TIME EXPERIENCE RELIABILITY & EXPIRY TEST SUITE');
  console.log('=============================================================');

  await connectDB();

  let userAId, userAToken;
  let userBId, userBToken;
  let sessionAId;
  const testEmailA = `reliable_learner_a_${Date.now()}@example.com`;
  const testEmailB = `reliable_learner_b_${Date.now()}@example.com`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register Learners
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Registering test learners A & B...');
    const regA = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Tara Sharma',
        email: testEmailA,
        password: 'Password123!'
      }
    });
    if (regA.status !== 201) throw new Error(`User A registration failed: ${JSON.stringify(regA.body)}`);
    userAToken = regA.body.token;
    userAId = regA.body.user.id;

    const regB = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Karan Mehra',
        email: testEmailB,
        password: 'Password123!'
      }
    });
    if (regB.status !== 201) throw new Error(`User B registration failed: ${JSON.stringify(regB.body)}`);
    userBToken = regB.body.token;
    userBId = regB.body.user.id;
    console.log('  ✓ Learners A & B registered successfully.');

    // -------------------------------------------------------------------------
    // TEST 2: Authoritative Resolution for Fresh New Learner
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Verifying authoritative status resolution for new learner...');
    const statusRes = await api('/api/assessments/status/baseline', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });
    if (statusRes.status !== 200) throw new Error(`Status call failed: ${statusRes.status}`);
    if (statusRes.body.hasActiveSession !== false || statusRes.body.hasCompletedSession !== false) {
      throw new Error('Fresh learner must have hasActiveSession: false and hasCompletedSession: false');
    }
    console.log('  ✓ Verified: Fresh learner hasActiveSession: false, hasCompletedSession: false.');

    // -------------------------------------------------------------------------
    // TEST 3: Start Session & Idempotency Check
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Starting baseline assessment and validating idempotency...');
    const startRes1 = await api('/api/assessments/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: { scenarioCode: 'baseline' }
    });
    if (startRes1.status !== 200 || !startRes1.body.sessionId) {
      throw new Error(`Failed to start session: ${JSON.stringify(startRes1.body)}`);
    }
    sessionAId = startRes1.body.sessionId;
    const stage1Id = startRes1.body.stage.id;

    // Idempotent secondary call
    const startRes2 = await api('/api/assessments/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: { scenarioCode: 'baseline' }
    });
    if (startRes2.body.sessionId !== sessionAId) {
      throw new Error('Second startAssessment call must return the identical active sessionId');
    }
    console.log(`  ✓ Idempotency verified: Session ${sessionAId} returned consistently.`);

    // -------------------------------------------------------------------------
    // TEST 4: Initial Sliding Inactivity & Max Lifetime Expiry Values
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Verifying 2-hour sliding window and 24-hour maximum lifetime...');
    const dbSession = await AssessmentSession.findById(sessionAId);
    if (!dbSession.expiresAt || !dbSession.maxLifetimeExpiresAt) {
      throw new Error('Session must have expiresAt and maxLifetimeExpiresAt timestamps set');
    }
    const startedAtMs = new Date(dbSession.startedAt).getTime();
    const expiresAtMs = new Date(dbSession.expiresAt).getTime();
    const maxLifeMs = new Date(dbSession.maxLifetimeExpiresAt).getTime();

    const diffInactivityHours = (expiresAtMs - startedAtMs) / (1000 * 60 * 60);
    const diffMaxLifeHours = (maxLifeMs - startedAtMs) / (1000 * 60 * 60);

    if (Math.abs(diffInactivityHours - 2) > 0.05) {
      throw new Error(`Initial inactivity window should be ~2 hours, got ${diffInactivityHours} hours`);
    }
    if (Math.abs(diffMaxLifeHours - 24) > 0.05) {
      throw new Error(`Initial max lifetime should be ~24 hours, got ${diffMaxLifeHours} hours`);
    }
    console.log(`  ✓ Verified: Initial inactivity window = ${diffInactivityHours.toFixed(2)}h, Max lifetime = ${diffMaxLifeHours.toFixed(2)}h.`);

    // -------------------------------------------------------------------------
    // TEST 5: Cross-User Security Isolation (403 Forbidden)
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Verifying cross-user access isolation (User B accessing User A session)...');
    const crossAccess = await api(`/api/assessments/session/${sessionAId}`, {
      headers: { 'Authorization': `Bearer ${userBToken}` }
    });
    if (crossAccess.status !== 403) {
      throw new Error(`Expected 403 for unauthorized session access, received: ${crossAccess.status}`);
    }
    console.log('  ✓ Verified: Cross-user access rejected with 403 Forbidden.');

    // -------------------------------------------------------------------------
    // TEST 6: Step Submission & Sliding Expiry Window Extension
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Submitting step 1 and verifying sliding expiry extension...');
    const decision1 = await ScenarioDecision.findOne({ stageId: stage1Id });
    if (!decision1) throw new Error('No decision found for stage 1');

    // Simulate 30 minutes passing by setting expiresAt to now + 90 mins
    const artificialPastExpiresAt = new Date(Date.now() + 90 * 60 * 1000);
    await AssessmentSession.findByIdAndUpdate(sessionAId, { expiresAt: artificialPastExpiresAt });

    const submitRes = await api('/api/assessments/submit-step', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: {
        assessmentSessionId: sessionAId,
        stageId: stage1Id,
        decisionId: decision1._id.toString()
      }
    });

    if (submitRes.status !== 200) {
      throw new Error(`Step submission failed: ${JSON.stringify(submitRes.body)}`);
    }

    const updatedSession = await AssessmentSession.findById(sessionAId);
    const newExpiresAtMs = new Date(updatedSession.expiresAt).getTime();
    const extendedDiffMinutes = (newExpiresAtMs - Date.now()) / (1000 * 60);

    // After step submission, sliding window should be reset to ~120 minutes (2 hours) from now
    if (extendedDiffMinutes < 115 || extendedDiffMinutes > 125) {
      throw new Error(`Expected sliding expiry ~120 mins from now, got ${extendedDiffMinutes.toFixed(1)} mins`);
    }
    console.log(`  ✓ Verified: Sliding window reset to ${extendedDiffMinutes.toFixed(1)} mins after active step submission.`);

    // -------------------------------------------------------------------------
    // TEST 7: Inactivity Expiry Enforcement & Session Abandonment
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] Simulating 2 hours of inactivity (> 120 mins)...');
    // Set expiresAt to 5 minutes in the past
    const expiredTimestamp = new Date(Date.now() - 5 * 60 * 1000);
    await AssessmentSession.findByIdAndUpdate(sessionAId, { expiresAt: expiredTimestamp });

    // Calling getScenarioStatus
    const expiredStatusRes = await api('/api/assessments/status/baseline', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });
    if (expiredStatusRes.status !== 200) throw new Error(`Status call failed: ${expiredStatusRes.status}`);
    const expPayload = expiredStatusRes.body;

    if (expPayload.hasActiveSession !== false || expPayload.hasExpiredSession !== true) {
      throw new Error(`Expected hasActiveSession: false, hasExpiredSession: true. Got: ${JSON.stringify(expPayload)}`);
    }
    if (!expPayload.expiredSession || expPayload.expiredSession.stagesCompleted !== 1) {
      throw new Error(`Expected expiredSession with stagesCompleted: 1. Got: ${JSON.stringify(expPayload.expiredSession)}`);
    }
    console.log('  ✓ Verified: Expired session returns hasExpiredSession: true with stagesCompleted info.');

    // Verify session transitioned to abandoned in DB
    const abandonedDbSession = await AssessmentSession.findById(sessionAId);
    if (abandonedDbSession.status !== 'abandoned' || !abandonedDbSession.abandonedAt) {
      throw new Error('Session status should be atomically updated to "abandoned" with abandonedAt timestamp');
    }
    console.log('  ✓ Verified: Session status transitioned atomically to "abandoned".');

    // -------------------------------------------------------------------------
    // TEST 8: Decision Immutability Preservation
    // -------------------------------------------------------------------------
    console.log('\n[Test 8] Verifying decision immutability for abandoned session...');
    const savedDecisions = await AssessmentDecision.find({ assessmentSessionId: sessionAId });
    if (savedDecisions.length !== 1) {
      throw new Error(`Expected exactly 1 preserved decision record, found: ${savedDecisions.length}`);
    }
    if (savedDecisions[0].decisionId.toString() !== decision1._id.toString()) {
      throw new Error('Preserved decision record does not match submitted decision');
    }
    console.log('  ✓ Verified: Previous AssessmentDecision records preserved immutably.');

    // -------------------------------------------------------------------------
    // TEST 9: Fresh Start Recovery (New Clean Session After Expiry)
    // -------------------------------------------------------------------------
    console.log('\n[Test 9] Starting fresh session after expiration...');
    const freshStartRes = await api('/api/assessments/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: { scenarioCode: 'baseline' }
    });
    if (freshStartRes.status !== 200 || !freshStartRes.body.sessionId) {
      throw new Error(`Fresh start failed: ${JSON.stringify(freshStartRes.body)}`);
    }
    const newSessionId = freshStartRes.body.sessionId;
    if (newSessionId === sessionAId) {
      throw new Error('Fresh start must create a new session, not reuse abandoned one');
    }
    console.log(`  ✓ Verified: Fresh session created (${newSessionId}) without conflicts.`);

    // -------------------------------------------------------------------------
    // TEST 10: Maximum Hard Lifetime Cap Enforcement
    // -------------------------------------------------------------------------
    console.log('\n[Test 10] Testing 24-hour maximum hard lifetime cap enforcement...');
    // Set maxLifetimeExpiresAt to 10 seconds in the past while keeping expiresAt in the future
    await AssessmentSession.findByIdAndUpdate(newSessionId, {
      maxLifetimeExpiresAt: new Date(Date.now() - 10 * 1000),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    const maxLifeStatusRes = await api('/api/assessments/status/baseline', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });
    if (maxLifeStatusRes.body.hasActiveSession !== false || maxLifeStatusRes.body.hasExpiredSession !== true) {
      throw new Error(`Session exceeding maxLifetimeExpiresAt must be abandoned. Got: ${JSON.stringify(maxLifeStatusRes.body)}`);
    }

    const hardCappedSession = await AssessmentSession.findById(newSessionId);
    if (hardCappedSession.status !== 'abandoned') {
      throw new Error('Hard-capped session must have status "abandoned"');
    }
    console.log('  ✓ Verified: 24-hour maximum hard lifetime strictly enforced.');

    console.log('\n=============================================================');
    console.log('ALL 10 RELIABILITY & EXPIRY TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('=============================================================');

  } catch (error) {
    console.error('\n❌ Test Failure:', error.message);
    process.exitCode = 1;
  } finally {
    // Cleanup test users
    if (userAId) {
      await User.findByIdAndDelete(userAId);
      await UserProgress.deleteOne({ userId: userAId });
      const sessions = await AssessmentSession.find({ userId: userAId });
      for (const s of sessions) {
        await AssessmentDecision.deleteMany({ assessmentSessionId: s._id });
        await AssessmentSession.findByIdAndDelete(s._id);
      }
    }
    if (userBId) {
      await User.findByIdAndDelete(userBId);
      await UserProgress.deleteOne({ userId: userBId });
      const sessions = await AssessmentSession.find({ userId: userBId });
      for (const s of sessions) {
        await AssessmentDecision.deleteMany({ assessmentSessionId: s._id });
        await AssessmentSession.findByIdAndDelete(s._id);
      }
    }
    await mongoose.connection.close();
    console.log('\n✓ Test teardown and cleanup complete.');
  }
}

runReliabilityTests();
