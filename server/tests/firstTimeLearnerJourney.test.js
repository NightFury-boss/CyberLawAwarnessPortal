const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const ScenarioDecision = require('../models/ScenarioDecision');
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

async function runTests() {
  console.log('=============================================================');
  console.log('PHASE 1: FIRST-TIME LEARNER JOURNEY & SECURITY TEST SUITE');
  console.log('=============================================================');

  await connectDB();

  let userAId, userAToken;
  let userBId, userBToken;
  let sessionAId;
  const testEmailA = `firsttime_learner_a_${Date.now()}@example.com`;
  const testEmailB = `firsttime_learner_b_${Date.now()}@example.com`;

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1 & 2: Newly registered learner registration & first-visit state
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 1 & 2] Testing newly registered learner creation and initial state...');
    const regRes = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Aarav Patel',
        email: testEmailA,
        password: 'Password123!'
      }
    });

    if (regRes.status !== 201 || !regRes.body.token) {
      throw new Error(`User A registration failed: ${JSON.stringify(regRes.body)}`);
    }
    userAToken = regRes.body.token;
    userAId = regRes.body.user.id;
    console.log(`  ✓ Learner A created (${testEmailA}, ID: ${userAId}).`);

    // Verify initial progress
    const progRes = await api('/api/progress', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });

    if (progRes.status !== 200) throw new Error(`Get progress failed: ${progRes.status}`);
    const progA = progRes.body;

    if (progA.baselineScore !== null) throw new Error('New learner must have baselineScore: null');
    if (progA.completedModules?.length !== 0) throw new Error('New learner must have 0 completed modules');
    console.log('  ✓ Verified: baselineScore is null, completedModules is empty.');

    // Check baseline status
    const statusRes1 = await api('/api/assessments/status/baseline', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });

    if (statusRes1.status !== 200) throw new Error(`Get baseline status failed: ${statusRes1.status}`);
    const st1 = statusRes1.body;
    if (st1.hasActiveSession !== false || st1.hasCompletedSession !== false) {
      throw new Error('New learner must have hasActiveSession: false and hasCompletedSession: false');
    }
    console.log('  ✓ Verified: First-time learner correctly classified as Case A (Assessment Not Started).');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Learner starts Your Digital Day
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 3] Testing learner starting Your Digital Day assessment...');
    const startRes = await api('/api/assessments/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: { scenarioCode: 'baseline' }
    });

    if (startRes.status !== 200 || !startRes.body.sessionId || !startRes.body.stage) {
      throw new Error(`Start assessment failed: ${JSON.stringify(startRes.body)}`);
    }
    sessionAId = startRes.body.sessionId;
    const stage1 = startRes.body.stage;
    console.log(`  ✓ Assessment started. Session ID: ${sessionAId}`);
    console.log(`  ✓ Initial stage received: "${stage1.title}" (ID: ${stage1.id}) with ${stage1.decisions.length} choices.`);

    // -------------------------------------------------------------------------
    // SCENARIO 4 & 5: Learner leaves during assessment and resumes same session
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 4 & 5] Testing interrupted session detection & idempotent resumption...');
    // Make 1 decision to advance past step 1
    const dec1 = stage1.decisions[0];
    const submit1Res = await api('/api/assessments/submit-step', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: {
        assessmentSessionId: sessionAId,
        stageId: stage1.id,
        decisionId: dec1.id
      }
    });

    if (submit1Res.status !== 200 || !submit1Res.body.stage) {
      throw new Error(`Submit step 1 failed: ${JSON.stringify(submit1Res.body)}`);
    }
    const stage2 = submit1Res.body.stage;
    console.log(`  ✓ Step 1 submitted. Advanced to stage: "${stage2.title}" (ID: ${stage2.id}).`);

    // Learner navigates away to dashboard. Check status endpoint for Case B
    const statusRes2 = await api('/api/assessments/status/baseline', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });

    const st2 = statusRes2.body;
    if (!st2.hasActiveSession || st2.sessionId !== sessionAId) {
      throw new Error(`Expected active session ${sessionAId}, got: ${JSON.stringify(st2)}`);
    }
    if (st2.stage.id !== stage2.id) {
      throw new Error(`Expected resume at stage ${stage2.id}, got ${st2.stage.id}`);
    }
    console.log(`  ✓ Case B confirmed: Active in-progress session detected at Stage "${st2.stage.title}".`);

    // Learner clicks "Start/Resume" again: Verify idempotency (no duplicate session created)
    const resumeRes = await api('/api/assessments/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userAToken}` },
      body: { scenarioCode: 'baseline' }
    });

    if (resumeRes.status !== 200) throw new Error(`Resume start failed: ${resumeRes.status}`);
    if (resumeRes.body.sessionId !== sessionAId) {
      throw new Error(`Expected same session ${sessionAId}, but new session was created: ${resumeRes.body.sessionId}`);
    }
    if (!resumeRes.body.resumed) {
      throw new Error('Expected resumed: true flag from idempotent start call');
    }
    console.log('  ✓ Idempotent resumption verified: Same session preserved without duplicate creation.');

    // -------------------------------------------------------------------------
    // SCENARIO 6 & 7: Learner completes assessment and returns to dashboard
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 6 & 7] Testing completion of remaining stages and post-baseline transition...');
    let currentStage = stage2;
    let isCompleted = false;
    let stepCount = 1;

    while (!isCompleted && currentStage) {
      stepCount++;
      const decisions = await ScenarioDecision.find({ stageId: currentStage.id });
      if (decisions.length === 0) break;

      const subRes = await api('/api/assessments/submit-step', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userAToken}` },
        body: {
          assessmentSessionId: sessionAId,
          stageId: currentStage.id,
          decisionId: decisions[0]._id.toString()
        }
      });

      if (subRes.body.isCompleted) {
        isCompleted = true;
        console.log(`  ✓ Assessment completed after ${stepCount} steps. Final Score: ${subRes.body.finalScore}%`);
        break;
      }
      currentStage = subRes.body.stage;
    }

    if (!isCompleted) throw new Error('Assessment loop finished without isCompleted flag');

    // Verify session record in DB
    const finalSessionDoc = await AssessmentSession.findById(sessionAId);
    if (finalSessionDoc.status !== 'completed' || !finalSessionDoc.completedAt) {
      throw new Error('Assessment session doc must be completed with completedAt date');
    }
    console.log(`  ✓ Database session verified: status='completed', completedAt=${finalSessionDoc.completedAt}`);

    // Verify progress updated
    const progResPost = await api('/api/progress', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });

    const progPost = progResPost.body;
    if (progPost.baselineScore === null) {
      throw new Error('User progress baselineScore must be populated after completion');
    }
    console.log(`  ✓ User progress updated: baselineScore=${progPost.baselineScore}, level="${progPost.baselineLevel}".`);

    // Verify baseline status is now completed
    const statusRes3 = await api('/api/assessments/status/baseline', {
      headers: { 'Authorization': `Bearer ${userAToken}` }
    });

    const st3 = statusRes3.body;
    if (st3.hasActiveSession !== false || st3.hasCompletedSession !== true) {
      throw new Error(`Expected hasCompletedSession: true, got: ${JSON.stringify(st3)}`);
    }
    console.log('  ✓ Post-assessment status verified: hasCompletedSession=true -> First-visit screen dismissed.');

    // -------------------------------------------------------------------------
    // SCENARIO 8 & 9: Established learner login & existing history preservation
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 8 & 9] Testing established learner login & history preservation...');
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmailA,
        password: 'Password123!'
      }
    });

    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error('Established learner login failed');
    }

    const estProgRes = await api('/api/progress', {
      headers: { 'Authorization': `Bearer ${loginRes.body.token}` }
    });

    if (estProgRes.body.baselineScore !== progPost.baselineScore) {
      throw new Error('Established learner baseline score changed unexpectedly');
    }
    console.log('  ✓ Established learner history preserved intact across login sessions.');

    // -------------------------------------------------------------------------
    // SCENARIO 10: Cross-user session ownership isolation
    // -------------------------------------------------------------------------
    console.log('\n[Scenario 10] Testing cross-user session isolation and ownership protection...');
    const regResB = await api('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Kavita Singh',
        email: testEmailB,
        password: 'Password123!'
      }
    });

    userBToken = regResB.body.token;
    userBId = regResB.body.user.id;
    console.log(`  ✓ Learner B created (${testEmailB}, ID: ${userBId}).`);

    // Learner B attempts to inspect Learner A's session
    const hackGet = await api(`/api/assessments/session/${sessionAId}`, {
      headers: { 'Authorization': `Bearer ${userBToken}` }
    });

    if (hackGet.status !== 403) {
      throw new Error(`Expected 403 ACCESS_DENIED on cross-user session inspection, got ${hackGet.status}`);
    }
    console.log('  ✓ Cross-user session GET strictly rejected with 403 ACCESS_DENIED.');

    // Learner B attempts to submit a step to Learner A's session
    const hackSubmit = await api('/api/assessments/submit-step', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userBToken}` },
      body: {
        assessmentSessionId: sessionAId,
        stageId: stage1.id,
        decisionId: dec1.id
      }
    });

    if (hackSubmit.status !== 403) {
      throw new Error(`Expected 403 ACCESS_DENIED on cross-user step submission, got ${hackSubmit.status}`);
    }
    console.log('  ✓ Cross-user step submission strictly rejected with 403 ACCESS_DENIED.');

    console.log('\n=============================================================');
    console.log('✅ ALL 10 FIRST-TIME LEARNER JOURNEY SCENARIOS PASSED 100%');
    console.log('=============================================================');

  } finally {
    // Clean up test data
    console.log('\nCleaning up test users and sessions...');
    if (userAId) {
      await User.findByIdAndDelete(userAId);
      await UserProgress.deleteOne({ userId: userAId });
      await AssessmentSession.deleteMany({ userId: userAId });
    }
    if (userBId) {
      await User.findByIdAndDelete(userBId);
      await UserProgress.deleteOne({ userId: userBId });
      await AssessmentSession.deleteMany({ userId: userBId });
    }
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
