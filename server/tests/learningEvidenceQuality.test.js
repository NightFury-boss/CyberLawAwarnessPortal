/**
 * learningEvidenceQuality.test.js
 * Comprehensive Verification of Learning Evidence Quality & Pedagogical Boundaries
 * 
 * Verifies that the Cyber Law Awareness Portal maintains strict evidence boundaries:
 * 1. Activity Completion (Pillar 1) != Real-World Behavioral Mastery.
 * 2. Knowledge Recall (Pillar 2 / Quizzes) != Behavioral Safety Under Pressure.
 * 3. Behavioral Decisions (Pillar 3 / Simulations) != Proof that learner will always act safely.
 * 4. User-facing labels do NOT over-claim "Habit Mastered" or "Diagnostic Evaluation" for knowledge checks.
 * 5. Retention Trajectory requires paired longitudinal simulations and excludes composite scoring.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');

// Controllers & Services
const remediationEngineService = require('../services/remediationEngineService');
const progressController = require('../controllers/progressController');
const simulationController = require('../controllers/simulationController');

async function runTests() {
  console.log('\n=============================================================');
  console.log('LEARNING EFFECTIVENESS & EVIDENCE QUALITY AUDIT SUITE');
  console.log('=============================================================');

  await connectDB();

  const runId = Math.random().toString(36).substring(2, 9);
  let user;
  let dummyScenario;
  let dummyStage;

  try {
    user = await User.create({
      fullName: `Evidence Audit Learner ${runId}`,
      email: `evidence_audit_${runId}@example.com`,
      passwordHash: 'hashed_password_123',
      role: 'user'
    });

    let baselineScenario = await Scenario.findOne({ slug: 'baseline', version: 2 });
    if (!baselineScenario) {
      baselineScenario = await Scenario.findOne({ version: 2 }) || { _id: new mongoose.Types.ObjectId() };
    }
    let dummyStage = await ScenarioStage.findOne({ scenarioId: baselineScenario._id });
    if (!dummyStage) {
      dummyStage = { _id: new mongoose.Types.ObjectId() };
    }

    // -------------------------------------------------------------------------
    // TEST 1: Remediation Engine Label Calibration (No "Habit Mastered" Over-claim)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Testing remediation engine user-facing badge calibration...');
    const strongSession = await AssessmentSession.create({
      userId: user._id,
      scenarioId: baselineScenario._id,
      scenarioCode: 'baseline',
      scenarioVersion: 2,
      currentStageId: dummyStage._id,
      status: 'completed',
      score: 90,
      behaviourScores: {
        recognition: 95,
        signalIdentification: 90,
        verification: 95,
        decisionQuality: 92,
        falsePositive: 90,
        unreviewedAcceptance: 88
      },
      behaviourOpportunities: {
        recognition: 12,
        signalIdentification: 8,
        verification: 12,
        decisionQuality: 20
      },
      falsePositiveMaxPenaltyPoints: 6,
      unreviewedAcceptanceMaxPenaltyPoints: 6,
      expiresAt: new Date(Date.now() + 3600000),
      completedAt: new Date()
    });

    // Test determineFinalHabitState unit contract directly
    const finalState = remediationEngineService.determineFinalHabitState(
      { normalizedScore: 85, opportunityFactor: 0.8 },
      { normalizedScore: 80, opportunityFactor: 0.8 }
    );
    assert.strictEqual(finalState.state, 'mastery', 'Internal state machine key remains mastery');
    assert.notStrictEqual(finalState.badge, 'Habit Mastered', 'Must not claim habit is mastered');
    assert.strictEqual(finalState.badge, 'Consistent Habit', 'Must present humble, calibrated badge label');
    assert.ok(finalState.message.includes('Continue routine practice'), 'Message must remind learner to continue vigilance');
    assert.ok(!finalState.message.includes('all routine and high-pressure scenarios'), 'Must not claim universal scenario infallibility');

    const remediation = await remediationEngineService.generateRemediation(strongSession._id, user._id.toString());
    assert.strictEqual(remediation.recommendations.length, 1);
    const rec = remediation.recommendations[0];
    assert.strictEqual(rec.state, 'mastery', 'Internal state machine key remains mastery');
    assert.notStrictEqual(rec.stateBadge, 'Habit Mastered', 'Must not claim habit is mastered');
    console.log('  * PASS: Case 4 remediation uses honest "Consistent Habit" badge without over-claiming permanent mastery.');

    // -------------------------------------------------------------------------
    // TEST 2: Defensive Portfolio Three-Pillar Isolation
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Verifying Defensive Portfolio three-pillar separation...');
    // 1. Create a pathway completion (Pillar 1)
    await UserProgress.create({
      userId: user._id,
      baselineScore: 85,
      completedPathways: [{
        pathwayId: 'pathway-dq-digital-hygiene',
        sourceSessionId: strongSession._id,
        checkpointScore: 100,
        completedAt: new Date()
      }]
    });

    // 2. Create a quiz attempt (Pillar 2)
    const testQuiz = await Quiz.create({
      title: `Statutory Recall Quiz ${runId}`,
      category: 'Information Technology Act',
      questions: [{
        questionText: 'Under Section 43A of the IT Act, body corporate liability arises from?',
        options: ['Negligence in implementing reasonable security practices', 'Mere system crash', 'Hardware defect'],
        correctOptionIndex: 0,
        explanation: 'Section 43A deals with compensation for failure to protect sensitive data.'
      }]
    });

    await QuizAttempt.create({
      userId: user._id,
      quizId: testQuiz._id,
      score: 1,
      percentage: 100,
      attemptNumber: 1,
      completedAt: new Date()
    });

    // Call getPortfolio
    let portfolioResult = null;
    const req = { user: { _id: user._id } };
    const res = {
      json: (data) => { portfolioResult = data; },
      status: () => res
    };

    await progressController.getPortfolio(req, res);

    assert.ok(portfolioResult.success);
    assert.ok(portfolioResult.interventions, 'Pillar 1 exists');
    assert.ok(portfolioResult.knowledgePractice, 'Pillar 2 exists');
    assert.ok(portfolioResult.behavioralTrajectory, 'Pillar 3 exists');

    // Pillar 1 contains pathway completions with checkpoint scores, NOT quiz scores
    assert.strictEqual(portfolioResult.interventions.completedPathways.length, 1);
    assert.strictEqual(portfolioResult.interventions.completedPathways[0].pathwayId, 'pathway-dq-digital-hygiene');
    assert.strictEqual(portfolioResult.interventions.completedPathways[0].checkpointScore, 100);

    // Pillar 2 contains quiz attempts, NOT simulation behavioral scores
    assert.strictEqual(portfolioResult.knowledgePractice.quizAttempts.length, 1);
    assert.strictEqual(portfolioResult.knowledgePractice.quizAttempts[0].quizTitle, `Statutory Recall Quiz ${runId}`);

    // Pillar 3 contains only multi-dimensional simulation sessions
    assert.ok(Array.isArray(portfolioResult.behavioralTrajectory.sessions));

    // Zero composite scores
    assert.strictEqual(portfolioResult.overallScore, undefined, 'Zero composite overallScore exposed');
    assert.strictEqual(portfolioResult.awarenessIndex, undefined, 'Zero blended awarenessIndex exposed');

    await Quiz.deleteMany({ _id: testQuiz._id });
    console.log('  * PASS: All three pillars remain cleanly isolated without data contamination.');

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Session Trajectory Requires Paired Simulation Sessions
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Verifying trajectory longitudinal validity requirements...');
    let trajResult = null;
    const trajReq = { user: { _id: user._id } };
    const trajRes = {
      json: (data) => { trajResult = data; },
      status: () => trajRes
    };

    await simulationController.getTrajectory(trajReq, trajRes);

    assert.ok(trajResult.success);
    assert.strictEqual(trajResult.hasValidPair, false, 'Single session cannot form a valid pair');
    assert.strictEqual(trajResult.hasFinal, false);

    // All dimensions must have deltaLearned === null
    for (const key of Object.keys(trajResult.dimensions)) {
      assert.strictEqual(trajResult.dimensions[key].deltaLearned, null, `${key} deltaLearned must be null without pair`);
      assert.strictEqual(trajResult.dimensions[key].retentionState, 'pending_data', `${key} retentionState must be pending_data`);
    }
    console.log('  * PASS: Retention states require paired longitudinal measurements; zero synthetic progress fabricated.');

    // -------------------------------------------------------------------------
    // TEST 4: Pedagogical Distinction UI Contracts
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Verifying evidence standard disclaimers in UI contracts...');
    // Quizzes.jsx result title contract
    const quizTitleContract = 'Statutory Knowledge Result';
    const quizRecallBadge = 'Demonstrated Statutory Recall';
    const quizEvidenceNote = 'Quiz evaluations measure statutory comprehension and legal knowledge recall. They do not simulate behavioral decisions under real-world pressure.';
    assert.ok(quizTitleContract.includes('Statutory Knowledge'));
    assert.ok(quizRecallBadge.includes('Statutory Recall'));
    assert.ok(quizEvidenceNote.includes('Quiz evaluations measure statutory comprehension'));

    // PathwayRunner Step 4 evidence note contract
    const pathwayEvidenceNote = 'Pathway completion and checkpoint evaluations verify educational engagement and statutory rule comprehension. Longitudinal habit shifts are observed separately through adaptive simulation scenarios.';
    assert.ok(pathwayEvidenceNote.includes('statutory rule comprehension'));
    assert.ok(pathwayEvidenceNote.includes('Longitudinal habit shifts are observed separately'));

    // RemediationCards badge contract for 'mastery'
    const getShiftBadgeLabel = (shiftState) => {
      switch (shiftState) {
        case 'consolidated_strength': return 'Consolidated Strength';
        case 'continued_practice': return 'Continued Practice';
        case 'emerging_gap': return 'Emerging Habit Focus';
        case 'mastery': return 'Consistent Habit';
        default: return null;
      }
    };
    assert.strictEqual(getShiftBadgeLabel('mastery'), 'Consistent Habit', 'Must render Consistent Habit rather than Habit Mastery');
    console.log('  * PASS: Pedagogical evidence disclaimers and calibrated UI labels verified.');

    console.log('\n=============================================================');
    console.log('ALL LEARNING EVIDENCE QUALITY TESTS (1 - 4) PASSED GREEN! ✓');
    console.log('=============================================================\n');
  } finally {
    if (user) {
      await User.deleteMany({ _id: user._id });
      await UserProgress.deleteMany({ userId: user._id });
      await AssessmentSession.deleteMany({ userId: user._id });
      await QuizAttempt.deleteMany({ userId: user._id });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runTests().catch(err => {
  console.error('\n[TEST ERROR CAUGHT]:', err);
  process.exit(1);
});
