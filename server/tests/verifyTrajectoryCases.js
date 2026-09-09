const assert = require('assert');
const { classifyRetention } = require('../controllers/simulationController');

// Test Case runner for Longitudinal Session Pairing & Retention Boundaries
console.log('======================================================');
console.log('TESTING RETENTION CLASSIFICATION BOUNDARIES');
console.log('======================================================');

// Boundary 1: deltaLearned = 10
// S_base = 50, S_final = 60 (deltaLearned = 10)
// deltaRetention = -5 (S_reassess = 55) -> Retained
assert.strictEqual(classifyRetention(50, 60, 55), 'Retained', 'Boundary deltaRetention = -5 should be Retained');

// Boundary 2: deltaRetention = -20
// S_base = 50, S_final = 75 (deltaLearned = 25)
// deltaRetention = -20 (S_reassess = 55 > S_base) -> Partially Retained
assert.strictEqual(classifyRetention(50, 75, 55), 'Partially Retained', 'Boundary deltaRetention = -20 with S_reassess > S_base should be Partially Retained');

// Boundary 3: reassessment = baseline
// S_base = 50, S_final = 65 (deltaLearned = 15)
// S_reassess = 50 (S_reassess <= S_base) -> Declined
assert.strictEqual(classifyRetention(50, 65, 50), 'Declined', 'Boundary S_reassess = S_base should be Declined');

// Boundary 4: baseline/final = 75
// S_base = 75, S_final = 75
// S_reassess = 75 -> Retained
assert.strictEqual(classifyRetention(75, 75, 75), 'Retained', 'Boundary S_reassess = 75 on already-strong should be Retained');

// Boundary 5: reassessment = 70 on already-strong
// S_base = 80, S_final = 85
// S_reassess = 70 -> Stable
assert.strictEqual(classifyRetention(80, 85, 70), 'Stable', 'Boundary S_reassess = 70 on already-strong should be Stable (70 <= S < 75)');

// Boundary 6: reassessment = 69 on already-strong (< 70) -> Declined
assert.strictEqual(classifyRetention(80, 85, 69), 'Declined', 'S_reassess = 69 on already-strong should be Declined');

// Boundary 7: final = 50 vs final = 49 (final remains below 50)
// S_final = 49, S_reassess = 49 -> Unimproved
assert.strictEqual(classifyRetention(40, 49, 49), 'Unimproved', 'S_final < 50 and S_reassess < 50 should be Unimproved');

// Boundary 8: final = 49, reassessment = 50 -> Developing
assert.strictEqual(classifyRetention(40, 49, 50), 'Developing', 'S_final < 50 and S_reassess = 50 should be Developing');

// Boundary 9: final = 49, reassessment = 65 -> Delayed Improvement
assert.strictEqual(classifyRetention(40, 49, 65), 'Delayed Improvement', 'S_final < 50 and S_reassess = 65 should be Delayed Improvement');

// Boundary 10: reassessment = null -> pending_reassessment
assert.strictEqual(classifyRetention(40, 70, null), 'pending_reassessment', 'Missing reassessment should be pending_reassessment');

console.log('✓ All 10 retention boundary tests passed successfully!\n');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const AssessmentSession = require('../models/AssessmentSession');
const User = require('../models/User');
const { getTrajectory } = require('../controllers/simulationController');

const standardScores = {
  recognition: 70,
  signalIdentification: 70,
  verification: 70,
  decisionQuality: 70,
  falsePositive: 70,
  unreviewedAcceptance: 70
};

async function runCases() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Running Cases A–J for Longitudinal Session-Role Pairing...');

  const testUser = await User.create({
    fullName: 'Trajectory Test User',
    email: `traj_${Date.now()}@example.com`,
    passwordHash: 'dummyHash123',
    role: 'user'
  });

  const userId = testUser._id;

  async function invokeTrajectory() {
    return new Promise((resolve) => {
      const req = { user: { _id: userId } };
      const res = {
        json: (data) => resolve(data),
        status: () => res
      };
      getTrajectory(req, res);
    });
  }

  try {
    // ----------------------------------------------------
    // CASE A: Baseline -> Final -> Reassessment
    // ----------------------------------------------------
    console.log('[CASE A] Baseline -> Final -> Reassessment...');
    const t0 = new Date('2026-01-01T10:00:00Z');
    const t1 = new Date('2026-01-02T10:00:00Z');
    const t2 = new Date('2026-01-03T10:00:00Z');

    const sA_base = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 50,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sA_final = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 80,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sA_reassess = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 85,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });

    let res = await invokeTrajectory();
    assert.strictEqual(res.hasBaseline, true);
    assert.strictEqual(res.hasFinal, true);
    assert.strictEqual(res.hasValidPair, true);
    assert.strictEqual(res.hasReassessment, true);
    assert.strictEqual(res.baselineSessionId.toString(), sA_base._id.toString());
    assert.strictEqual(res.finalSessionId.toString(), sA_final._id.toString());
    assert.strictEqual(res.reassessmentSessionId.toString(), sA_reassess._id.toString());
    console.log('  * PASS: Case A correctly paired Baseline -> Final -> Reassessment');

    // ----------------------------------------------------
    // CASE B: Baseline -> Final -> Reassessment 1 -> Reassessment 2
    // ----------------------------------------------------
    console.log('[CASE B] Repeated voluntary reassessments...');
    const t3 = new Date('2026-01-04T10:00:00Z');
    const sA_reassess2 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 90,
      completedAt: t3, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.reassessmentSessionId.toString(), sA_reassess2._id.toString(), 'Latest reassessment should be selected');
    console.log('  * PASS: Case B selected latest reassessment session');

    // Clean up sessions for next tests
    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE C: Multiple sessions before valid Baseline/Final pair exists
    // ----------------------------------------------------
    console.log('[CASE C] Multiple sessions before valid pair...');
    const sC_1 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 40,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sC_2 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 45,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.hasBaseline, true);
    assert.strictEqual(res.hasFinal, false);
    assert.strictEqual(res.hasValidPair, false);
    assert.strictEqual(res.hasReassessment, false);
    assert.strictEqual(res.dimensions.TR.retentionState, 'pending_data');
    console.log('  * PASS: Case C reports pending_data without valid pair');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE D: Multiple Final-type sessions
    // ----------------------------------------------------
    console.log('[CASE D] Multiple Final-type sessions...');
    const sD_base = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 40,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sD_final1 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 70,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sD_final2 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 85,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.baselineSessionId.toString(), sD_base._id.toString());
    assert.strictEqual(res.finalSessionId.toString(), sD_final1._id.toString());
    assert.strictEqual(res.reassessmentSessionId.toString(), sD_final2._id.toString());
    console.log('  * PASS: Case D paired first Final as final and second Final as voluntary reassessment');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE E: Multiple Baseline-type sessions before Final
    // ----------------------------------------------------
    console.log('[CASE E] Multiple Baseline-type sessions before Final...');
    const sE_base1 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 30,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sE_base2 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 45,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sE_final = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 80,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.baselineSessionId.toString(), sE_base2._id.toString(), 'Latest baseline immediately preceding final must be paired');
    assert.strictEqual(res.finalSessionId.toString(), sE_final._id.toString());
    assert.strictEqual(res.hasReassessment, false);
    console.log('  * PASS: Case E paired immediately preceding baseline');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE F: Mixed compatible v2 sessions with different scenario codes
    // ----------------------------------------------------
    console.log('[CASE F] Non-standard scenario code ignored...');
    const sF_base = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 40,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sF_custom = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'custom_experimental', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 99,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sF_final = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 80,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.baselineSessionId.toString(), sF_base._id.toString());
    assert.strictEqual(res.finalSessionId.toString(), sF_final._id.toString());
    assert.strictEqual(res.hasReassessment, false, 'custom_experimental is not a valid reassessment code');
    console.log('  * PASS: Case F excluded foreign scenarioCode');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE G: Legacy v1 sessions mixed into history
    // ----------------------------------------------------
    console.log('[CASE G] Legacy v1 excluded...');
    const sG_v1 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 1,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 20,
      completedAt: t0, expiresAt: new Date()
    });
    const sG_base = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 40,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sG_final = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 85,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.comparableSessionsCount, 2);
    assert.strictEqual(res.baselineSessionId.toString(), sG_base._id.toString());
    console.log('  * PASS: Case G excluded legacy v1 sessions');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE H: Abandoned/incomplete sessions mixed into history
    // ----------------------------------------------------
    console.log('[CASE H] Incomplete / abandoned sessions excluded...');
    const sH_base = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 40,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sH_abandoned = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'abandoned', score: 0,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sH_final = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 85,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.comparableSessionsCount, 2);
    assert.strictEqual(res.finalSessionId.toString(), sH_final._id.toString());
    console.log('  * PASS: Case H excluded abandoned sessions');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE I: Reassessment taken without valid Baseline -> Final pair
    // ----------------------------------------------------
    console.log('[CASE I] Reassessment without valid pair...');
    // User took Final 1, then Final 2, but NEVER took a Baseline!
    const sI_final1 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 70,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sI_final2 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 80,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.hasValidPair, false);
    assert.strictEqual(res.hasReassessment, false, 'Without valid pair, no reassessment is allowed');
    assert.strictEqual(res.reassessmentSessionId, null);
    assert.strictEqual(res.dimensions.TR.retentionState, 'pending_data');
    console.log('  * PASS: Case I rejected reassessment without valid pair');

    await AssessmentSession.deleteMany({ userId });

    // ----------------------------------------------------
    // CASE J: Repeated voluntary reassessments after valid pair
    // ----------------------------------------------------
    console.log('[CASE J] Repeated voluntary reassessments (3 reassessments)...');
    const sJ_base = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 40,
      completedAt: t0, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sJ_final = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 80,
      completedAt: t1, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sJ_r1 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 82,
      completedAt: t2, expiresAt: new Date(), behaviourScores: standardScores
    });
    const sJ_r2 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'baseline', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 85,
      completedAt: t3, expiresAt: new Date(), behaviourScores: standardScores
    });
    const t4 = new Date('2026-01-05T10:00:00Z');
    const sJ_r3 = await AssessmentSession.create({
      userId, scenarioId: new mongoose.Types.ObjectId(), scenarioCode: 'final', scenarioVersion: 2,
      currentStageId: new mongoose.Types.ObjectId(), status: 'completed', score: 95,
      completedAt: t4, expiresAt: new Date(), behaviourScores: standardScores
    });

    res = await invokeTrajectory();
    assert.strictEqual(res.hasValidPair, true);
    assert.strictEqual(res.hasReassessment, true);
    assert.strictEqual(res.baselineSessionId.toString(), sJ_base._id.toString());
    assert.strictEqual(res.finalSessionId.toString(), sJ_final._id.toString());
    assert.strictEqual(res.reassessmentSessionId.toString(), sJ_r3._id.toString(), 'Latest of 3 reassessments must be active');
    console.log('  * PASS: Case J selected latest voluntary reassessment (r3)');

    console.log('\n======================================================');
    console.log('ALL CASES A–J PASSED 100% GREEN! ✓');
    console.log('======================================================');

  } finally {
    await AssessmentSession.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    await mongoose.disconnect();
  }
}

runCases().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

