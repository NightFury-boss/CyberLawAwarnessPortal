/**
 * Automated Test Suite for Phase 5
 * Targeted Habit Reinforcement + Longitudinal Evidence & Portfolio
 *
 * Test Matrix:
 * A. Unauthenticated reinforcement → 401
 * B. Cross-user sourceSessionId → 403
 * C. Ineligible pathway → rejected (403)
 * D. Mastery / consolidated-strength pathway → rejected (403)
 * E. Forged score/passed flag → ignored / recalculated server-side
 * F. Incorrect checkpoint → not completed (fails < 67%)
 * G. Correct checkpoint → reinforcement persisted (>= 67%)
 * H. Duplicate submission → idempotent (single record maintained)
 * I. AssessmentSession behaviourScores remain strictly unchanged
 * J. Portfolio contains correct three pillars
 * K. Untracked Category C evidence is absent from portfolio
 * L. Legacy v1 sessions excluded from trajectory & portfolio
 * M. Abandoned / in-progress sessions excluded from trajectory
 * N. Incompatible sessions (missing dimensions) excluded
 * O. Chronological trajectory ordering verified
 * P. Retention classification boundary tests (all mathematical thresholds)
 * Q. Zero composite-score exposure (strictly discrete dimensions)
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
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const progressRoutes = require('../routes/progress');
const simulationRoutes = require('../routes/simulations');
const { classifyRetention } = require('../controllers/simulationController');

const TEST_PORT = 5997;
const BASE_PROGRESS_URL = `http://localhost:${TEST_PORT}/api/progress`;
const BASE_ASSESS_URL = `http://localhost:${TEST_PORT}/api/assessments`;

let server;
let userA;
let userB;
let tokenA;
let tokenB;

let baselineSessionA;
let finalSessionA;
let sessionB;
let dummyQuiz;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/progress', progressRoutes);
  app.use('/api/assessments', simulationRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Phase 5 Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const uniqueA = 'test-p5-a-' + Date.now() + '@example.com';
  const uniqueB = 'test-p5-b-' + Date.now() + '@example.com';

  userA = await User.create({
    fullName: 'Phase 5 User A',
    email: uniqueA,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  userB = await User.create({
    fullName: 'Phase 5 User B',
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
  const finalScenario = await Scenario.findOne({ code: 'final', version: 2 });
  const dummyStage = await ScenarioStage.findOne({ scenarioId: baselineScenario?._id }) || { _id: new mongoose.Types.ObjectId() };
  const scenarioIdBaseline = baselineScenario ? baselineScenario._id : new mongoose.Types.ObjectId();
  const scenarioIdFinal = finalScenario ? finalScenario._id : new mongoose.Types.ObjectId();

  // Baseline session for User A: weak in UA (33) and VB (40), strong in TR (85)
  baselineSessionA = await AssessmentSession.create({
    userId: userA._id,
    scenarioId: scenarioIdBaseline,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    currentStageId: dummyStage._id,
    currentStageNumber: 13,
    status: 'completed',
    score: 55,
    expiresAt: new Date(Date.now() + 86400000),
    behaviourScores: new Map([
      ['recognition', 85],
      ['signalIdentification', 75],
      ['verification', 40],
      ['decisionQuality', 80],
      ['falsePositive', 90],
      ['unreviewedAcceptance', 33]
    ]),
    behaviourOpportunities: new Map([
      ['recognition', 10],
      ['signalIdentification', 8],
      ['verification', 6],
      ['decisionQuality', 10],
      ['falsePositive', 5],
      ['unreviewedAcceptance', 6]
    ]),
    unreviewedAcceptanceMaxPenaltyPoints: 6,
    falsePositiveMaxPenaltyPoints: 5,
    startedAt: new Date(Date.now() - 3600000 * 5),
    completedAt: new Date(Date.now() - 3600000 * 4)
  });

  // Final session for User A:
  // UA: 40 (< 75, base was 33 < 75) -> continued_practice
  // VB: 80 (>= 75, base was 40 < 75) -> consolidated_strength
  finalSessionA = await AssessmentSession.create({
    userId: userA._id,
    scenarioId: scenarioIdFinal,
    scenarioCode: 'final',
    scenarioVersion: 2,
    currentStageId: dummyStage._id,
    currentStageNumber: 13,
    status: 'completed',
    score: 65,
    expiresAt: new Date(Date.now() + 86400000),
    behaviourScores: new Map([
      ['recognition', 90],
      ['signalIdentification', 80],
      ['verification', 80], // Consolidated strength!
      ['decisionQuality', 85],
      ['falsePositive', 90],
      ['unreviewedAcceptance', 40] // Continued practice!
    ]),
    behaviourOpportunities: new Map([
      ['recognition', 10],
      ['signalIdentification', 8],
      ['verification', 6],
      ['decisionQuality', 10],
      ['falsePositive', 5],
      ['unreviewedAcceptance', 6]
    ]),
    unreviewedAcceptanceMaxPenaltyPoints: 6,
    falsePositiveMaxPenaltyPoints: 5,
    startedAt: new Date(Date.now() - 3600000 * 3),
    completedAt: new Date(Date.now() - 3600000 * 2)
  });

  // Session for User B
  sessionB = await AssessmentSession.create({
    userId: userB._id,
    scenarioId: scenarioIdFinal,
    scenarioCode: 'final',
    scenarioVersion: 2,
    currentStageId: dummyStage._id,
    currentStageNumber: 13,
    status: 'completed',
    score: 50,
    expiresAt: new Date(Date.now() + 86400000),
    behaviourScores: new Map([
      ['recognition', 70],
      ['signalIdentification', 70],
      ['verification', 70],
      ['decisionQuality', 70],
      ['falsePositive', 70],
      ['unreviewedAcceptance', 40]
    ]),
    behaviourOpportunities: new Map([
      ['recognition', 6],
      ['signalIdentification', 6],
      ['verification', 6],
      ['decisionQuality', 6],
      ['falsePositive', 5],
      ['unreviewedAcceptance', 6]
    ]),
    unreviewedAcceptanceMaxPenaltyPoints: 6,
    falsePositiveMaxPenaltyPoints: 5,
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date()
  });

  // Create a dummy quiz attempt for user A
  dummyQuiz = await Quiz.create({
    title: 'Phishing Awareness Quiz',
    category: 'Phishing',
    difficulty: 'easy',
    timeLimitMinutes: 10,
    passingScorePercentage: 75
  });

  await QuizAttempt.create({
    userId: userA._id,
    quizId: dummyQuiz._id,
    score: 80,
    percentage: 80,
    passed: true,
    attemptNumber: 1,
    completedAt: new Date()
  });
}

async function teardown() {
  if (userA) {
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await AssessmentSession.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await UserProgress.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await QuizAttempt.deleteMany({ userId: userA._id });
  }
  if (dummyQuiz) {
    await Quiz.deleteOne({ _id: dummyQuiz._id });
  }
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  await mongoose.disconnect();
}

async function runTests() {
  console.log('\n========================================');
  console.log('RUNNING PHASE 5 COMPREHENSIVE TEST SUITE');
  console.log('========================================\n');

  try {
    await setup();

    // ----------------------------------------------------
    // Test A: Unauthenticated reinforcement → 401
    // ----------------------------------------------------
    console.log('[Test A] Unauthenticated reinforcement returns 401...');
    const resA = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: finalSessionA._id,
        answers: []
      })
    });
    assert.strictEqual(resA.status, 401, 'Expected 401 for unauthenticated request');
    console.log('✓ Test A passed');

    // ----------------------------------------------------
    // Test B: Cross-user sourceSessionId → 403
    // ----------------------------------------------------
    console.log('[Test B] Cross-user sourceSessionId returns 403...');
    const resB = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}` // User B trying to access User A's session
      },
      body: JSON.stringify({
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: finalSessionA._id,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 },
          { questionId: 'chk-ua-2', selectedOptionIndex: 1 },
          { questionId: 'chk-ua-3', selectedOptionIndex: 0 }
        ]
      })
    });
    assert.strictEqual(resB.status, 403, 'Expected 403 for cross-user sourceSessionId');
    const dataB = await resB.json();
    assert.strictEqual(dataB.error?.code, 'FORBIDDEN');
    console.log('✓ Test B passed');

    // ----------------------------------------------------
    // Test C: Ineligible pathway → rejected (403)
    // ----------------------------------------------------
    console.log('[Test C] Ineligible pathway rejected with 403...');
    const resC = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-tr-lure-detection', // Not in User A's recommendations (TR was 90%)
        sourceSessionId: finalSessionA._id,
        answers: [{ questionId: 'chk-tr-1', selectedOptionIndex: 1 }]
      })
    });
    assert.strictEqual(resC.status, 403, 'Expected 403 for ineligible pathway');
    const dataC = await resC.json();
    assert.strictEqual(dataC.error?.code, 'PATHWAY_NOT_ELIGIBLE');
    console.log('✓ Test C passed');

    // ----------------------------------------------------
    // Test D: Mastery / consolidated-strength pathway → rejected (403)
    // ----------------------------------------------------
    console.log('[Test D] Consolidated strength or mastery pathway rejected for reinforcement...');
    // pathway-maintenance-reinforcement is recommended for User A, but has habitShiftState: 'mastery'
    const resD = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-maintenance-reinforcement',
        sourceSessionId: finalSessionA._id,
        answers: [{ questionId: 'chk-maint-1', selectedOptionIndex: 0 }]
      })
    });
    assert.strictEqual(resD.status, 403, 'Expected 403 for mastery pathway reinforcement attempt');
    const dataD = await resD.json();
    assert.strictEqual(dataD.error?.code, 'REINFORCEMENT_NOT_ELIGIBLE');
    console.log('✓ Test D passed');

    // ----------------------------------------------------
    // Test E: Forged score/passed flag → ignored / recalculated server-side
    // ----------------------------------------------------
    console.log('[Test E] Forged client score/passed ignored; server calculates authoritatively...');
    // Submit 1 correct out of 3 (33%) but send client claims { score: 100, passed: true }
    const resE = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: finalSessionA._id,
        score: 100, // FORGED
        passed: true, // FORGED
        checkpointScore: 100, // FORGED
        isFullyCompleted: true, // FORGED
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 }, // correct
          { questionId: 'chk-ua-2', selectedOptionIndex: 0 }, // wrong (correct is 1)
          { questionId: 'chk-ua-3', selectedOptionIndex: 1 }  // wrong (correct is 0)
        ]
      })
    });
    assert.strictEqual(resE.status, 200);
    const dataE = await resE.json();
    assert.strictEqual(dataE.score, 33, 'Server must calculate 33% (1 of 3 correct)');
    assert.strictEqual(dataE.passed, false, 'Client passed: true flag must be ignored');
    assert.strictEqual(dataE.isReinforcementCompleted, false, 'Reinforcement must not be completed');
    console.log('✓ Test E passed');

    // ----------------------------------------------------
    // Test F: Incorrect checkpoint → not persisted in reinforcementsCompleted
    // ----------------------------------------------------
    console.log('[Test F] Failed checkpoint is not saved in reinforcementsCompleted...');
    const progF = await UserProgress.findOne({ userId: userA._id });
    const hasRecordF = (progF?.reinforcementsCompleted || []).some(
      r => r.pathwayId === 'pathway-ua-upi-consent' && r.sourceSessionId.toString() === finalSessionA._id.toString()
    );
    assert.strictEqual(hasRecordF, false, 'Failed reinforcement must not be persisted');
    console.log('✓ Test F passed');

    // ----------------------------------------------------
    // Test G: Correct checkpoint → reinforcement persisted in reinforcementsCompleted
    // ----------------------------------------------------
    console.log('[Test G] Passing checkpoint is persisted with authoritative metadata...');
    const resG = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: finalSessionA._id,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 }, // correct
          { questionId: 'chk-ua-2', selectedOptionIndex: 1 }, // correct
          { questionId: 'chk-ua-3', selectedOptionIndex: 0 }  // correct
        ]
      })
    });
    assert.strictEqual(resG.status, 200);
    const dataG = await resG.json();
    assert.strictEqual(dataG.passed, true);
    assert.strictEqual(dataG.score, 100);
    assert.strictEqual(dataG.isReinforcementCompleted, true);
    assert.strictEqual(dataG.sourceHabitState, 'continued_practice');
    assert.ok(dataG.message.includes('demonstrates successful performance on the targeted learning checkpoint.'));

    // Check DB persistence
    const progG = await UserProgress.findOne({ userId: userA._id });
    const savedRecG = (progG?.reinforcementsCompleted || []).find(
      r => r.pathwayId === 'pathway-ua-upi-consent' && r.sourceSessionId.toString() === finalSessionA._id.toString()
    );
    assert.ok(savedRecG, 'Reinforcement must be persisted in DB');
    assert.strictEqual(savedRecG.checkpointScore, 100);
    assert.strictEqual(savedRecG.sourceHabitState, 'continued_practice');
    console.log('✓ Test G passed');

    // ----------------------------------------------------
    // Test H: Duplicate submission → idempotent
    // ----------------------------------------------------
    console.log('[Test H] Duplicate submission maintains single idempotent record...');
    const resH = await fetch(`${BASE_PROGRESS_URL}/pathways/reinforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: finalSessionA._id,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 },
          { questionId: 'chk-ua-2', selectedOptionIndex: 1 },
          { questionId: 'chk-ua-3', selectedOptionIndex: 0 }
        ]
      })
    });
    assert.strictEqual(resH.status, 200);
    const progH = await UserProgress.findOne({ userId: userA._id });
    const matchesH = (progH?.reinforcementsCompleted || []).filter(
      r => r.pathwayId === 'pathway-ua-upi-consent' && r.sourceSessionId.toString() === finalSessionA._id.toString()
    );
    assert.strictEqual(matchesH.length, 1, 'Duplicate submissions must not duplicate records');
    console.log('✓ Test H passed');

    // ----------------------------------------------------
    // Test I: AssessmentSession behaviourScores remain strictly unchanged
    // ----------------------------------------------------
    console.log('[Test I] Verifying AssessmentSession.behaviourScores are unchanged by reinforcement...');
    const freshSessionA = await AssessmentSession.findById(finalSessionA._id);
    const freshScores = freshSessionA.behaviourScores instanceof Map
      ? Object.fromEntries(freshSessionA.behaviourScores)
      : freshSessionA.behaviourScores;
    assert.strictEqual(freshScores.unreviewedAcceptance, 40, 'UA score must remain 40');
    assert.strictEqual(freshScores.verification, 80, 'VB score must remain 80');
    assert.strictEqual(freshScores.recognition, 90, 'TR score must remain 90');
    console.log('✓ Test I passed');

    // ----------------------------------------------------
    // Test J: Portfolio contains correct three pillars
    // ----------------------------------------------------
    console.log('[Test J] Verifying Three-Pillar Defensive Portfolio structure...');
    const resJ = await fetch(`${BASE_PROGRESS_URL}/portfolio`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(resJ.status, 200);
    const portfolio = await resJ.json();
    assert.ok(portfolio.interventions, 'Pillar 1 (interventions) missing');
    assert.ok(portfolio.knowledgePractice, 'Pillar 2 (knowledgePractice) missing');
    assert.ok(portfolio.behavioralTrajectory, 'Pillar 3 (behavioralTrajectory) missing');

    assert.strictEqual(portfolio.interventions.summary.totalReinforcements, 1);
    assert.strictEqual(portfolio.knowledgePractice.summary.totalAttempts, 1);
    assert.strictEqual(portfolio.behavioralTrajectory.comparableSessionsCount, 2);
    console.log('✓ Test J passed');

    // ----------------------------------------------------
    // Test K: Untracked Category C evidence is absent from portfolio
    // ----------------------------------------------------
    console.log('[Test K] Verifying untracked Category C evidence is absent...');
    assert.strictEqual(portfolio.knowledgePractice.lawsRead, undefined);
    assert.strictEqual(portfolio.knowledgePractice.caseStudiesViewed, undefined);
    assert.strictEqual(portfolio.knowledgePractice.preventionSectionsViewed, undefined);
    assert.strictEqual(portfolio.lawsRead, undefined);
    assert.strictEqual(portfolio.caseStudiesViewed, undefined);
    console.log('✓ Test K passed');

    // ----------------------------------------------------
    // Test L: Legacy v1 sessions excluded from trajectory & portfolio
    // ----------------------------------------------------
    console.log('[Test L] Verifying legacy v1 sessions are excluded...');
    const v1Session = await AssessmentSession.create({
      userId: userA._id,
      scenarioId: new mongoose.Types.ObjectId(),
      currentStageId: new mongoose.Types.ObjectId(),
      scenarioCode: 'baseline',
      scenarioVersion: 1, // Legacy
      currentStageNumber: 13,
      status: 'completed',
      score: 40,
      expiresAt: new Date(Date.now() + 86400000),
      completedAt: new Date(Date.now() - 3600000 * 10)
    });

    const resL = await fetch(`${BASE_ASSESS_URL}/trajectory`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.strictEqual(resL.status, 200);
    const trajL = await resL.json();
    assert.strictEqual(trajL.comparableSessionsCount, 2, 'Legacy v1 session must be excluded');
    await AssessmentSession.deleteOne({ _id: v1Session._id });
    console.log('✓ Test L passed');

    // ----------------------------------------------------
    // Test M: Abandoned / in-progress sessions excluded from trajectory
    // ----------------------------------------------------
    console.log('[Test M] Verifying abandoned/in-progress sessions are excluded...');
    const abandonedSession = await AssessmentSession.create({
      userId: userA._id,
      scenarioId: new mongoose.Types.ObjectId(),
      currentStageId: new mongoose.Types.ObjectId(),
      scenarioCode: 'final',
      scenarioVersion: 2,
      status: 'in-progress', // Abandoned
      currentStageNumber: 4,
      expiresAt: new Date(Date.now() + 86400000),
      behaviourScores: new Map([['recognition', 50]])
    });

    const resM = await fetch(`${BASE_ASSESS_URL}/trajectory`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const trajM = await resM.json();
    assert.strictEqual(trajM.comparableSessionsCount, 2, 'In-progress session must be excluded');
    await AssessmentSession.deleteOne({ _id: abandonedSession._id });
    console.log('✓ Test M passed');

    // ----------------------------------------------------
    // Test N: Incompatible sessions (missing dimensions) excluded
    // ----------------------------------------------------
    console.log('[Test N] Verifying sessions with missing behavioral dimensions are excluded...');
    const incompatibleSession = await AssessmentSession.create({
      userId: userA._id,
      scenarioId: new mongoose.Types.ObjectId(),
      currentStageId: new mongoose.Types.ObjectId(),
      scenarioCode: 'final',
      scenarioVersion: 2,
      status: 'completed',
      score: 60,
      expiresAt: new Date(Date.now() + 86400000),
      behaviourScores: new Map([
        ['recognition', 50] // missing 5 other dimensions
      ]),
      completedAt: new Date()
    });

    const resN = await fetch(`${BASE_ASSESS_URL}/trajectory`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const trajN = await resN.json();
    assert.strictEqual(trajN.comparableSessionsCount, 2, 'Incompatible session must be excluded');
    await AssessmentSession.deleteOne({ _id: incompatibleSession._id });
    console.log('✓ Test N passed');

    // ----------------------------------------------------
    // Test O: Chronological trajectory ordering verified
    // ----------------------------------------------------
    console.log('[Test O] Verifying chronological trajectory ordering and reassessment tracking...');
    // Create voluntary reassessment session for User A (Session 3)
    const reassessmentSessionA = await AssessmentSession.create({
      userId: userA._id,
      scenarioId: new mongoose.Types.ObjectId(),
      currentStageId: new mongoose.Types.ObjectId(),
      scenarioCode: 'baseline',
      scenarioVersion: 2,
      currentStageNumber: 13,
      status: 'completed',
      score: 75,
      expiresAt: new Date(Date.now() + 86400000),
      behaviourScores: new Map([
        ['recognition', 88],
        ['signalIdentification', 82],
        ['verification', 75],
        ['decisionQuality', 85],
        ['falsePositive', 90],
        ['unreviewedAcceptance', 60]
      ]),
      behaviourOpportunities: new Map([
        ['recognition', 10],
        ['signalIdentification', 8],
        ['verification', 6],
        ['decisionQuality', 10],
        ['falsePositive', 5],
        ['unreviewedAcceptance', 6]
      ]),
      startedAt: new Date(Date.now() - 1800000),
      completedAt: new Date(Date.now() - 900000)
    });

    const resO = await fetch(`${BASE_ASSESS_URL}/trajectory`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const trajO = await resO.json();
    assert.strictEqual(trajO.comparableSessionsCount, 3, 'Must have 3 comparable sessions');
    assert.strictEqual(trajO.hasBaseline, true);
    assert.strictEqual(trajO.hasFinal, true);
    assert.strictEqual(trajO.hasReassessment, true);
    assert.strictEqual(trajO.baselineSessionId.toString(), baselineSessionA._id.toString());
    assert.strictEqual(trajO.finalSessionId.toString(), finalSessionA._id.toString());
    assert.strictEqual(trajO.reassessmentSessionId.toString(), reassessmentSessionA._id.toString());

    // TR: base=85, final=90, reassess=88 -> already-strong (85 & 90 >= 75), reassess=88 (>= 75) -> 'Retained'
    assert.strictEqual(trajO.dimensions.TR.retentionState, 'Retained');
    // VB: base=40, final=80 (deltaLearned=40 >= 10), reassess=75 (deltaRetention = -5 >= -5) -> 'Retained'
    assert.strictEqual(trajO.dimensions.VB.retentionState, 'Retained');
    console.log('✓ Test O passed');

    // ----------------------------------------------------
    // Test P: Retention classification boundary tests
    // ----------------------------------------------------
    console.log('[Test P] Testing mathematical retention classification boundaries...');

    // Case 1: Meaningful intervention gain (deltaLearned >= 10)
    // base=30, final=80 (deltaLearned=50)
    // 1a: reassess=78 (deltaRetention=-2 >= -5) -> Retained
    assert.strictEqual(classifyRetention(30, 80, 78), 'Retained');
    // 1b: reassess=75 (deltaRetention=-5 >= -5 boundary) -> Retained
    assert.strictEqual(classifyRetention(30, 80, 75), 'Retained');
    // 1c: reassess=70 (deltaRetention=-10, -20 <= delta < -5 and reassess > base) -> Partially Retained
    assert.strictEqual(classifyRetention(30, 80, 70), 'Partially Retained');
    // 1d: reassess=60 (deltaRetention=-20 boundary, and 60 > 30) -> Partially Retained
    assert.strictEqual(classifyRetention(30, 80, 60), 'Partially Retained');
    // 1e: reassess=55 (deltaRetention=-25 < -20) -> Declined
    assert.strictEqual(classifyRetention(30, 80, 55), 'Declined');
    // 1f: reassess=30 (reassess <= base) -> Declined
    assert.strictEqual(classifyRetention(30, 80, 30), 'Declined');

    // Case 2: Already-strong dimensions (base >= 75 and final >= 75)
    // base=80, final=85
    // 2a: reassess=80 (>= 75) -> Retained
    assert.strictEqual(classifyRetention(80, 85, 80), 'Retained');
    // 2b: reassess=75 (boundary >= 75) -> Retained
    assert.strictEqual(classifyRetention(80, 85, 75), 'Retained');
    // 2c: reassess=72 (boundary 70..74) -> Stable
    assert.strictEqual(classifyRetention(80, 85, 72), 'Stable');
    // 2d: reassess=68 (< 70) -> Declined
    assert.strictEqual(classifyRetention(80, 85, 68), 'Declined');

    // Case 3: Intervention did not shift habit (final < 50)
    // base=30, final=40
    // 3a: reassess=35 (< 50) -> Unimproved
    assert.strictEqual(classifyRetention(30, 40, 35), 'Unimproved');
    // 3b: reassess=55 (50..64) -> Developing
    assert.strictEqual(classifyRetention(30, 40, 55), 'Developing');
    // 3c: reassess=65 (>= 65) -> Delayed Improvement
    assert.strictEqual(classifyRetention(30, 40, 65), 'Delayed Improvement');
    // 3d: reassess=75 (>= 65) -> Delayed Improvement
    assert.strictEqual(classifyRetention(30, 40, 75), 'Delayed Improvement');

    // Edge case: reassess is pending/null
    assert.strictEqual(classifyRetention(40, 70, null), 'pending_reassessment');
    console.log('✓ Test P passed');

    // ----------------------------------------------------
    // Test Q: Zero composite-score exposure
    // ----------------------------------------------------
    console.log('[Test Q] Verifying zero composite scores or blended indexes are exposed...');
    assert.strictEqual(trajO.compositeRetentionRate, undefined);
    assert.strictEqual(trajO.averageRetention, undefined);
    assert.strictEqual(trajO.overallRetentionScore, undefined);
    assert.strictEqual(trajO.grade, undefined);
    assert.strictEqual(portfolio.overallAwarenessScore, undefined);
    assert.strictEqual(portfolio.compositeScore, undefined);
    assert.strictEqual(portfolio.awarenessIndex, undefined);

    // Each of the 6 dimensions is reported independently
    const expectedDims = ['TR', 'SI', 'VB', 'DQ', 'FP', 'UA'];
    assert.deepStrictEqual(Object.keys(trajO.dimensions).sort(), expectedDims.sort());
    console.log('✓ Test Q passed');

    console.log('\n========================================');
    console.log('ALL PHASE 5 TESTS (A–Q) PASSED GREEN! ✓');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ PHASE 5 TEST SUITE FAILED:', error);
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

runTests();
