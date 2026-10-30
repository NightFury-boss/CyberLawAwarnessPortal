const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const PORT = 5996;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let testUser;
let testToken;
let testQuiz;

async function runPortfolioContractTests() {
  console.log('========================================================');
  console.log('RUNNING DEFENSIVE PORTFOLIO STATEMENT CONTRACT SUITE');
  console.log('========================================================\n');

  try {
    // 1. Boot test server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[Test Server] Listening on port ${PORT}`);
        resolve();
      });
    });

    // 2. Connect DB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 3. Setup test data
    console.log('- Preparing test learner and portfolio records...');
    await User.deleteMany({ email: 'portfolio_statement_test@portal.test' });

    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    testUser = await User.create({
      fullName: 'Aarav Sharma',
      email: 'portfolio_statement_test@portal.test',
      passwordHash,
      role: 'user'
    });

    testToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create a verified quiz & attempt for Pillar 2
    testQuiz = await Quiz.create({
      title: 'IT Act Section 66D Impersonation Assessment',
      category: 'Cyber Fraud & Impersonation',
      questions: []
    });

    await QuizAttempt.create({
      userId: testUser._id,
      quizId: testQuiz._id,
      score: 4,
      percentage: 80,
      attemptNumber: 1,
      completedAt: new Date()
    });

    // Create verified Model v2 baseline and final sessions for Pillar 3
    const dummyScenarioId = new mongoose.Types.ObjectId();
    const dummyStageId = new mongoose.Types.ObjectId();

    const baselineSession = await AssessmentSession.create({
      userId: testUser._id,
      scenarioId: dummyScenarioId,
      currentStageId: dummyStageId,
      scenarioCode: 'baseline',
      scenarioVersion: 2,
      status: 'completed',
      score: 55,
      completedAt: new Date(Date.now() - 3600000 * 2),
      expiresAt: new Date(Date.now() + 86400000),
      behaviourScores: {
        recognition: 60,
        signalIdentification: 50,
        verification: 40,
        decisionQuality: 70,
        falsePositive: 80,
        unreviewedAcceptance: 50
      },
      behaviourOpportunities: {
        recognition: 3,
        signalIdentification: 3,
        verification: 2,
        decisionQuality: 4,
        falsePositive: 2,
        unreviewedAcceptance: 3
      }
    });

    // Create verified pathway intervention for Pillar 1
    await UserProgress.create({
      userId: testUser._id,
      completedPathways: [
        {
          pathwayId: 'phishing-url-verification',
          sourceSessionId: baselineSession._id,
          completedAt: new Date(),
          checkpointScore: 90,
          stepsCompleted: { caseStudy: true, prevention: true, checkpointQuiz: true }
        }
      ],
      reinforcementsCompleted: [
        {
          pathwayId: 'phishing-url-verification',
          sourceSessionId: baselineSession._id,
          sourceHabitState: 'continued_practice',
          completedAt: new Date(),
          checkpointScore: 100
        }
      ]
    });

    await AssessmentSession.create({
      userId: testUser._id,
      scenarioId: dummyScenarioId,
      currentStageId: dummyStageId,
      scenarioCode: 'final',
      scenarioVersion: 2,
      status: 'completed',
      score: 80,
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      behaviourScores: {
        recognition: 85,
        signalIdentification: 75,
        verification: 80,
        decisionQuality: 90,
        falsePositive: 85,
        unreviewedAcceptance: 80
      },
      behaviourOpportunities: {
        recognition: 3,
        signalIdentification: 3,
        verification: 2,
        decisionQuality: 4,
        falsePositive: 2,
        unreviewedAcceptance: 3
      }
    });

    // TEST 1: Unauthenticated request is denied
    console.log('[TEST 1] Verifying unauthenticated portfolio request returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/progress/portfolio`);
    assert.strictEqual(unauthRes.status, 401, 'Expected 401 Unauthorized');
    console.log('  * PASS: 401 Unauthorized enforced for unauthenticated requests');

    // TEST 2: Authenticated request returns all three pillars
    console.log('[TEST 2] Verifying Three-Pillar payload structure...');
    const authRes = await fetch(`${BASE_URL}/progress/portfolio`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert.strictEqual(authRes.status, 200, 'Expected 200 OK');
    const data = await authRes.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.interventions, 'Expected interventions (Pillar 1)');
    assert.ok(data.knowledgePractice, 'Expected knowledgePractice (Pillar 2)');
    assert.ok(data.behavioralTrajectory, 'Expected behavioralTrajectory (Pillar 3)');
    console.log('  * PASS: Three-Pillar portfolio payload verified');

    // TEST 3: Pillar 1 records verified pathways with checkpoint scores
    console.log('[TEST 3] Auditing Pillar 1 (Interventions & Checkpoints)...');
    assert.strictEqual(data.interventions.completedPathways.length, 1);
    assert.strictEqual(data.interventions.completedPathways[0].pathwayId, 'phishing-url-verification');
    assert.strictEqual(data.interventions.completedPathways[0].checkpointScore, 90);
    assert.strictEqual(data.interventions.reinforcementsCompleted.length, 1);
    assert.strictEqual(data.interventions.reinforcementsCompleted[0].checkpointScore, 100);
    console.log('  * PASS: Pillar 1 contains verified pathway completions and checkpoint scores');

    // TEST 4: Pillar 2 records verified quiz attempts
    console.log('[TEST 4] Auditing Pillar 2 (Knowledge Practice)...');
    assert.strictEqual(data.knowledgePractice.quizAttempts.length, 1);
    assert.strictEqual(data.knowledgePractice.quizAttempts[0].quizTitle, 'IT Act Section 66D Impersonation Assessment');
    assert.strictEqual(data.knowledgePractice.quizAttempts[0].percentage, 80);
    assert.strictEqual(data.knowledgePractice.summary.totalAttempts, 1);
    assert.strictEqual(data.knowledgePractice.summary.distinctQuizzesTaken, 1);
    console.log('  * PASS: Pillar 2 contains verified quiz attempt details and percentages');

    // TEST 5: Pillar 3 records 6 canonical behavioral dimensions
    console.log('[TEST 5] Auditing Pillar 3 (Behavioral Evolution Dimensions)...');
    assert.strictEqual(data.behavioralTrajectory.comparableSessionsCount, 2);
    const sessions = data.behavioralTrajectory.sessions;
    assert.strictEqual(sessions.length, 2);
    const requiredDims = ['TR', 'SI', 'VB', 'DQ', 'FP', 'UA'];
    sessions.forEach(sess => {
      assert.ok(sess.behaviourScores, 'Session must include behaviourScores');
      requiredDims.forEach(dim => {
        assert.strictEqual(typeof sess.behaviourScores[dim], 'number', `Dimension ${dim} must be a number`);
      });
    });
    console.log('  * PASS: Pillar 3 includes all 6 canonical dimensions without omission');

    // TEST 6: Strict exclusion of synthetic composite scores
    console.log('[TEST 6] Verifying exclusion of synthetic composite scores...');
    assert.strictEqual(data.compositeScore, undefined, 'Composite score must be absent');
    assert.strictEqual(data.overallAwarenessScore, undefined, 'Overall awareness score must be absent');
    assert.strictEqual(data.awarenessIndex, undefined, 'Awareness index must be absent');
    console.log('  * PASS: Composite scores and synthetic indexes are strictly excluded');

    // TEST 7: Delayed Recall Empty State & Backward Compatibility
    console.log('[TEST 7] Verifying Delayed Recall empty state & backward compatibility...');
    assert.ok(Array.isArray(data.interventions.spacedReviews), 'spacedReviews array must exist in interventions');
    assert.strictEqual(data.interventions.spacedReviews.length, 0, 'No spaced reviews initially');
    assert.strictEqual(data.interventions.summary.totalSpacedReviews, 0);
    assert.strictEqual(data.interventions.summary.passedSpacedReviews, 0);
    console.log('  * PASS: User without spaced reviews returns clean empty array and zero counts');

    // TEST 8: Completed and Passed Spaced Reviews Representation
    console.log('[TEST 8] Verifying completed and passed spaced retrieval reviews...');
    await UserProgress.updateOne(
      { userId: testUser._id },
      {
        $push: {
          spacedReviews: {
            pathwayId: 'pathway-ua-upi-consent',
            sourceSessionId: baselineSession._id,
            cycleNumber: 1,
            completedAt: new Date(),
            checkpointScore: 100,
            passed: true,
            reviewAnswers: []
          }
        }
      }
    );

    const res8 = await fetch(`${BASE_URL}/progress/portfolio`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const data8 = await res8.json();
    assert.strictEqual(data8.interventions.spacedReviews.length, 1);
    assert.strictEqual(data8.interventions.spacedReviews[0].pathwayId, 'pathway-ua-upi-consent');
    assert.strictEqual(data8.interventions.spacedReviews[0].habitTitle, 'Autopilot Control & UPI PIN Safety');
    assert.strictEqual(data8.interventions.spacedReviews[0].passed, true);
    assert.strictEqual(data8.interventions.spacedReviews[0].checkpointScore, 100);
    assert.strictEqual(data8.interventions.summary.totalSpacedReviews, 1);
    assert.strictEqual(data8.interventions.summary.passedSpacedReviews, 1);
    console.log('  * PASS: Passed review accurately represented with habit title and score');

    // TEST 9: Failed Reviews Are NOT Misrepresented as Passed
    console.log('[TEST 9] Verifying failed reviews are NOT misrepresented as passed...');
    await UserProgress.updateOne(
      { userId: testUser._id },
      {
        $push: {
          spacedReviews: {
            pathwayId: 'pathway-vb-out-of-band',
            sourceSessionId: baselineSession._id,
            cycleNumber: 1,
            completedAt: new Date(),
            checkpointScore: 33,
            passed: false,
            reviewAnswers: []
          }
        }
      }
    );

    const res9 = await fetch(`${BASE_URL}/progress/portfolio`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const data9 = await res9.json();
    assert.strictEqual(data9.interventions.spacedReviews.length, 2);
    assert.strictEqual(data9.interventions.summary.totalSpacedReviews, 2);
    assert.strictEqual(data9.interventions.summary.passedSpacedReviews, 1, 'Only passed reviews should be counted in passedSpacedReviews');
    const failedReview = data9.interventions.spacedReviews.find(r => r.pathwayId === 'pathway-vb-out-of-band');
    assert.ok(failedReview);
    assert.strictEqual(failedReview.passed, false, 'Failed review must have passed: false');
    assert.strictEqual(failedReview.checkpointScore, 33);
    console.log('  * PASS: Failed review is accurately recorded with passed: false and not counted in passed total');

    // TEST 10: Malformed or Incomplete Records Handled Safely
    console.log('[TEST 10] Verifying malformed or incomplete records are safely filtered...');
    await UserProgress.updateOne(
      { userId: testUser._id },
      {
        $push: {
          spacedReviews: {
            $each: [
              { pathwayId: 'malformed-no-date', sourceSessionId: baselineSession._id, completedAt: null, checkpointScore: 100, passed: true },
              { pathwayId: '', sourceSessionId: baselineSession._id, completedAt: new Date(), checkpointScore: 100, passed: true },
              { pathwayId: 'malformed-no-score', sourceSessionId: baselineSession._id, completedAt: new Date(), checkpointScore: null, passed: true }
            ]
          }
        }
      }
    );

    const res10 = await fetch(`${BASE_URL}/progress/portfolio`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    const data10 = await res10.json();
    assert.strictEqual(data10.interventions.spacedReviews.length, 2, 'Malformed records must be filtered out');
    assert.strictEqual(data10.interventions.summary.totalSpacedReviews, 2);
    assert.strictEqual(data10.interventions.summary.passedSpacedReviews, 1);
    console.log('  * PASS: Malformed records are safely excluded from portfolio counts');

    // TEST 11: Non-Interference with Existing Three Pillars
    console.log('[TEST 11] Verifying existing Three-Pillar integrity remains intact...');
    assert.strictEqual(data10.interventions.completedPathways.length, 1);
    assert.strictEqual(data10.interventions.reinforcementsCompleted.length, 1);
    assert.strictEqual(data10.knowledgePractice.quizAttempts.length, 1);
    assert.strictEqual(data10.behavioralTrajectory.comparableSessionsCount, 2);
    console.log('  * PASS: Completed pathways, reinforcements, quiz attempts, and behavioral dimensions are 100% intact');

    console.log('\n========================================================');
    console.log('✅ ALL 11 PORTFOLIO STATEMENT CONTRACT TESTS PASSED (100%)');
    console.log('========================================================\n');

  } catch (err) {
    console.error('❌ PORTFOLIO CONTRACT TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    try {
      if (testUser) {
        await User.deleteMany({ _id: testUser._id });
        await UserProgress.deleteMany({ userId: testUser._id });
        await AssessmentSession.deleteMany({ userId: testUser._id });
        await QuizAttempt.deleteMany({ userId: testUser._id });
      }
      if (testQuiz) {
        await Quiz.deleteMany({ _id: testQuiz._id });
      }
      if (server) {
        server.close();
      }
      await mongoose.disconnect();
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }
  }
}

runPortfolioContractTests();
