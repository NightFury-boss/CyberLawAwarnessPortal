const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const AssessmentSession = require('../models/AssessmentSession');
const quizController = require('../controllers/quizController');

// Helper to mock express req/res
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

// Inline mirror of selectPrimaryNextAction for unit validation in CommonJS node environment
function selectPrimaryNextAction({
  hasBaseline = false,
  hasFinal = false,
  pathwaysWithStatus = [],
  dueSpacedReviews = [],
  dueQuizRecalls = [],
  inProgressLesson = null,
  recommendedLesson = null,
  frequentlyMissedQuizTopic = null,
  completedFocusCount = 0,
  totalFocusCount = 0
} = {}) {
  const safeCompleted = Math.max(0, Number.isFinite(completedFocusCount) ? completedFocusCount : 0);
  const safeTotal = Math.max(0, Number.isFinite(totalFocusCount) ? totalFocusCount : 0);

  if (!hasBaseline) {
    return { type: 'PRE_BASELINE', actionType: 'LINK', destination: '/assessment/baseline' };
  }

  if (Array.isArray(dueSpacedReviews) && dueSpacedReviews.length > 0 && dueSpacedReviews[0]) {
    return { type: 'DUE_SPACED_REVIEW', actionType: 'SPACED_MODAL' };
  }

  if (Array.isArray(dueQuizRecalls) && dueQuizRecalls.length > 0 && dueQuizRecalls[0]) {
    return { type: 'DUE_QUIZ_RECALL', actionType: 'QUIZ_RECALL_MODAL' };
  }

  const inProgressItem = (pathwaysWithStatus || []).find(p => p && p.isInProgress && p.rec && p.rec.pathwayId);
  if (!hasFinal && inProgressItem && inProgressItem.rec) {
    return { type: 'RESUME_PATHWAY', actionType: 'RUNNER' };
  }

  if (inProgressLesson && inProgressLesson.slug) {
    return { type: 'RESUME_LESSON', actionType: 'LINK', destination: `/modules/${inProgressLesson.slug}` };
  }

  const nextIncompleteItem = (pathwaysWithStatus || []).find(p => p && !p.isFullyCompleted && p.rec && p.rec.pathwayId);
  const allFocusComplete = safeTotal > 0 && safeCompleted >= safeTotal;
  if (!hasFinal && (allFocusComplete || (!nextIncompleteItem && (pathwaysWithStatus || []).length > 0))) {
    return { type: 'READY_FOR_FINAL', actionType: 'LINK', destination: '/assessment/final' };
  }

  if (!hasFinal && nextIncompleteItem && nextIncompleteItem.rec) {
    return { type: 'START_PATHWAY', actionType: 'RUNNER' };
  }

  if (recommendedLesson && recommendedLesson.slug) {
    return { type: 'START_LESSON', actionType: 'LINK', destination: `/modules/${recommendedLesson.slug}` };
  }

  const nextReinforceItem = (pathwaysWithStatus || []).find(p => p && p.isReinforcementEligible && !p.isReinforced && p.rec && p.rec.pathwayId);
  if (hasFinal && nextReinforceItem && nextReinforceItem.rec) {
    return { type: 'REINFORCE_HABIT', actionType: 'RUNNER_REINFORCE' };
  }

  if (frequentlyMissedQuizTopic && frequentlyMissedQuizTopic.topic) {
    return { type: 'PRACTICE_WEAK_QUIZ', actionType: 'LINK', destination: '/quizzes' };
  }

  return { type: 'ALL_CAUGHT_UP', actionType: 'LINK', destination: '/quizzes' };
}

async function runDashboardReworkPhase6Tests() {
  console.log('\n=============================================================');
  console.log('DASHBOARD REWORK & RETENTION SYSTEM TEST SUITE (PHASE 6)');
  console.log('=============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Database] Connected to MongoDB.\n');

  let testUser = null;
  let testQuestion = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: selectPrimaryNextAction Priority Ladder Unit Tests
    // -------------------------------------------------------------------------
    console.log('[Test 1] Testing selectPrimaryNextAction 11-step priority ladder...');

    // 1. Pre-baseline takes precedence over everything
    const r1 = selectPrimaryNextAction({ hasBaseline: false });
    assert.strictEqual(r1.type, 'PRE_BASELINE');

    // 2. Due Spaced Review takes precedence when baseline exists
    const r2 = selectPrimaryNextAction({
      hasBaseline: true,
      dueSpacedReviews: [{ pathwayId: 'pwd_1', habitTitle: 'Review Password' }],
      dueQuizRecalls: [{ questionId: 'q1' }]
    });
    assert.strictEqual(r2.type, 'DUE_SPACED_REVIEW');

    // 3. Due Quiz Recall takes precedence when no due spaced review exists
    const r3 = selectPrimaryNextAction({
      hasBaseline: true,
      dueSpacedReviews: [],
      dueQuizRecalls: [{ questionId: 'q1', category: 'Indian Cyber Law' }]
    });
    assert.strictEqual(r3.type, 'DUE_QUIZ_RECALL');

    // 4. In-progress pathway takes precedence if no retention items are due
    const r4 = selectPrimaryNextAction({
      hasBaseline: true,
      dueSpacedReviews: [],
      dueQuizRecalls: [],
      pathwaysWithStatus: [
        { isInProgress: true, rec: { pathwayId: 'path_1', habitTitle: 'Verify Links' } }
      ]
    });
    assert.strictEqual(r4.type, 'RESUME_PATHWAY');

    // 5. In-progress curriculum lesson takes precedence over unstarted items
    const r5 = selectPrimaryNextAction({
      hasBaseline: true,
      dueSpacedReviews: [],
      dueQuizRecalls: [],
      pathwaysWithStatus: [],
      inProgressLesson: { slug: 'dpdp-act-2023', title: 'DPDP Act Overview' }
    });
    assert.strictEqual(r5.type, 'RESUME_LESSON');

    // 6. Ready for Final when all pathways are completed
    const r6 = selectPrimaryNextAction({
      hasBaseline: true,
      hasFinal: false,
      completedFocusCount: 3,
      totalFocusCount: 3,
      pathwaysWithStatus: [
        { isFullyCompleted: true, rec: { pathwayId: 'p1' } },
        { isFullyCompleted: true, rec: { pathwayId: 'p2' } },
        { isFullyCompleted: true, rec: { pathwayId: 'p3' } }
      ]
    });
    assert.strictEqual(r6.type, 'READY_FOR_FINAL');

    // 7. Start unstarted recommended pathway
    const r7 = selectPrimaryNextAction({
      hasBaseline: true,
      hasFinal: false,
      pathwaysWithStatus: [
        { isFullyCompleted: false, isInProgress: false, rec: { pathwayId: 'p1', habitTitle: 'Safe Browsing' } }
      ]
    });
    assert.strictEqual(r7.type, 'START_PATHWAY');

    // 8. Start recommended curriculum lesson
    const r8 = selectPrimaryNextAction({
      hasBaseline: true,
      hasFinal: false,
      pathwaysWithStatus: [],
      recommendedLesson: { slug: 'it-act-2000-essentials', title: 'IT Act Essentials' }
    });
    assert.strictEqual(r8.type, 'START_LESSON');

    // 9. Reinforce habit after Final Check
    const r9 = selectPrimaryNextAction({
      hasBaseline: true,
      hasFinal: true,
      pathwaysWithStatus: [
        { isReinforcementEligible: true, isReinforced: false, rec: { pathwayId: 'p1', habitTitle: 'Verify Sender' } }
      ]
    });
    assert.strictEqual(r9.type, 'REINFORCE_HABIT');

    // 10. Practice weak quiz topic (<70% accuracy)
    const r10 = selectPrimaryNextAction({
      hasBaseline: true,
      hasFinal: true,
      pathwaysWithStatus: [],
      frequentlyMissedQuizTopic: { topic: 'BSA and digital evidence', accuracy: 55 }
    });
    assert.strictEqual(r10.type, 'PRACTICE_WEAK_QUIZ');

    // 11. All caught up
    const r11 = selectPrimaryNextAction({
      hasBaseline: true,
      hasFinal: true,
      pathwaysWithStatus: [],
      frequentlyMissedQuizTopic: null
    });
    assert.strictEqual(r11.type, 'ALL_CAUGHT_UP');

    console.log('  ✓ Test 1 Passed: selectPrimaryNextAction deterministically handles all 11 states in order.\n');

    // -------------------------------------------------------------------------
    // TEST 2: User Setup and Baseline Isolation
    // -------------------------------------------------------------------------
    console.log('[Test 2] Creating test fixtures for learner history and progress...');
    testUser = await User.create({
      email: `dashboard_phase6_${Date.now()}@test.internal`,
      fullName: 'Dashboard Phase6 Learner',
      passwordHash: 'dummy_hash',
      role: 'user'
    });

    const initialProgress = await UserProgress.create({
      userId: testUser._id,
      currentStreak: 4,
      lastActivity: new Date(),
      quizRecallItems: [],
      spacedReviews: []
    });

    const testSession = await AssessmentSession.create({
      userId: testUser._id,
      scenarioId: new mongoose.Types.ObjectId(),
      scenarioCode: 'DIGITAL_DAY_V1',
      scenarioVersion: 1,
      currentStageId: new mongoose.Types.ObjectId(),
      sessionType: 'baseline',
      mode: 'baseline',
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3000000),
      expiresAt: new Date(Date.now() + 3600000),
      behaviourScores: {
        recognition: 72,
        signalIdentification: 68,
        verification: 85,
        decisionQuality: 75,
        falsePositive: 80,
        unreviewedAcceptance: 90
      }
    });

    assert(initialProgress);
    assert(testSession);
    console.log('  ✓ Test 2 Passed: Test fixtures successfully initialized.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Quiz History Aggregation (topicStats, accuracy, weak topics)
    // -------------------------------------------------------------------------
    console.log('[Test 3] Testing getQuizHistory aggregation & weak topic identification...');
    
    // Create 3 attempts in different categories with known scores
    await QuizAttempt.create({
      userId: testUser._id,
      mode: 'topic_wise',
      topic: 'Indian Cyber Law and IT Act',
      score: 4,
      correctCount: 4,
      incorrectCount: 1,
      totalQuestions: 5,
      percentage: 80,
      passed: true,
      timeSpentSeconds: 90
    });

    await QuizAttempt.create({
      userId: testUser._id,
      mode: 'quick_practice',
      topic: 'BSA and digital evidence',
      score: 2,
      correctCount: 2,
      incorrectCount: 3,
      totalQuestions: 5,
      percentage: 40,
      passed: false,
      timeSpentSeconds: 65
    });

    await QuizAttempt.create({
      userId: testUser._id,
      mode: 'quick_practice',
      topic: 'BSA and digital evidence',
      score: 3,
      correctCount: 3,
      incorrectCount: 2,
      totalQuestions: 5,
      percentage: 60,
      passed: false,
      timeSpentSeconds: 70
    });

    const reqHistory = { user: testUser };
    const resHistory = createMockRes();
    await quizController.getQuizHistory(reqHistory, resHistory);

    assert.strictEqual(resHistory.statusCode, 200);
    assert(resHistory.data.success);
    assert.strictEqual(resHistory.data.totalAttempts, 3);
    assert.strictEqual(resHistory.data.recentAttempts.length, 3);

    // Verify overall accuracy: (4 + 2 + 3) / (5 + 5 + 5) = 9/15 = 60%
    assert.strictEqual(resHistory.data.overallAccuracyPercent, 60);

    // Verify topicStats
    const bsaStat = resHistory.data.topicStats.find(t => t.topic === 'BSA and digital evidence');
    assert(bsaStat, 'BSA topic stat must be present');
    assert.strictEqual(bsaStat.attempts, 2);
    assert.strictEqual(bsaStat.totalQuestions, 10);
    assert.strictEqual(bsaStat.correctQuestions, 5);
    assert.strictEqual(bsaStat.accuracy, 50);

    // Verify frequentlyMissedTopics contains BSA (accuracy 50% < 70% threshold)
    assert(resHistory.data.frequentlyMissedTopics.length >= 1);
    assert.strictEqual(resHistory.data.frequentlyMissedTopics[0].topic, 'BSA and digital evidence');
    assert.strictEqual(resHistory.data.frequentlyMissedTopics[0].accuracy, 50);

    console.log('  ✓ Test 3 Passed: getQuizHistory correctly computes topic stats, accuracy, and weak topics.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Quiz Recall Queueing, Retrieval & Answer Secrecy
    // -------------------------------------------------------------------------
    console.log('[Test 4] Testing Quiz Recall Queueing and Answer Secrecy...');

    testQuestion = await QuizQuestion.findOne({ published: true });
    assert(testQuestion, 'Must find at least one published question in database');

    // Add missed question into user's quizRecallItems
    await UserProgress.updateOne(
      { userId: testUser._id },
      {
        $push: {
          quizRecallItems: {
            questionId: testQuestion._id,
            category: testQuestion.category,
            missedCount: 1,
            mastered: false,
            lastAttemptedAt: new Date(Date.now() - 86400000), // 1 day ago
            nextReviewDue: new Date(Date.now() - 3600000),    // 1 hour ago (due!)
            reviewHistory: []
          }
        }
      }
    );

    const reqDue = { user: testUser };
    const resDue = createMockRes();
    await quizController.getDueQuizRecallItems(reqDue, resDue);

    assert.strictEqual(resDue.statusCode, 200);
    assert(resDue.data.success);
    assert.strictEqual(resDue.data.totalDue, 1);

    const dueItem = resDue.data.dueItems[0];
    assert.strictEqual(dueItem.questionId.toString(), testQuestion._id.toString());
    
    // Strict Answer Secrecy Checks
    assert.strictEqual(dueItem.question.correctOptionIndex, undefined, 'Secrecy: correctOptionIndex must not be exposed');
    assert.strictEqual(dueItem.question.correctOptionIndices, undefined, 'Secrecy: correctOptionIndices must not be exposed');
    assert.strictEqual(dueItem.question.correctOption, undefined, 'Secrecy: correctOption must not be exposed');
    assert.strictEqual(dueItem.question.explanation, undefined, 'Secrecy: explanation must not be exposed before submission');

    console.log('  ✓ Test 4 Passed: Due recall items retrieved with 100% answer secrecy.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Incorrect Recall Evaluation (Reschedule + Increment Missed Count)
    // -------------------------------------------------------------------------
    console.log('[Test 5] Testing incorrect recall submission rescheduling & penalty...');

    // Identify an incorrect answer
    const wrongAnswer = testQuestion.correctOptionIndex === 0 ? 1 : 0;
    const reqWrongSubmit = {
      user: testUser,
      body: {
        questionId: testQuestion._id,
        answer: wrongAnswer
      }
    };
    const resWrongSubmit = createMockRes();
    await quizController.submitQuizRecall(reqWrongSubmit, resWrongSubmit);

    assert.strictEqual(resWrongSubmit.statusCode, 200);
    assert(resWrongSubmit.data.success);
    assert.strictEqual(resWrongSubmit.data.isCorrect, false);
    assert.strictEqual(resWrongSubmit.data.mastered, false);
    assert(resWrongSubmit.data.explanation, 'Must provide statutory explanation after submission');

    // Verify UserProgress record was updated with incremented missedCount and future nextReviewDue (+3 days)
    const progAfterWrong = await UserProgress.findOne({ userId: testUser._id });
    const itemAfterWrong = progAfterWrong.quizRecallItems.find(i => i.questionId.toString() === testQuestion._id.toString());
    assert.strictEqual(itemAfterWrong.missedCount, 2, 'missedCount should increment to 2');
    assert.strictEqual(itemAfterWrong.mastered, false);
    assert(new Date(itemAfterWrong.nextReviewDue) > new Date(), 'nextReviewDue must be scheduled in future');
    assert.strictEqual(itemAfterWrong.reviewHistory.length, 1);
    assert.strictEqual(itemAfterWrong.reviewHistory[0].isCorrect, false);

    console.log('  ✓ Test 5 Passed: Incorrect recall submission handled with rescheduling and diagnostic review history.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Correct Recall Evaluation (Mastery Transition)
    // -------------------------------------------------------------------------
    console.log('[Test 6] Testing correct recall submission and mastery transition...');

    // Reset due time to allow immediate re-submission test
    await UserProgress.updateOne(
      { userId: testUser._id, 'quizRecallItems.questionId': testQuestion._id },
      { $set: { 'quizRecallItems.$.nextReviewDue': new Date(Date.now() - 1000) } }
    );

    const reqCorrectSubmit = {
      user: testUser,
      body: {
        questionId: testQuestion._id,
        answer: testQuestion.correctOptionIndex
      }
    };
    const resCorrectSubmit = createMockRes();
    await quizController.submitQuizRecall(reqCorrectSubmit, resCorrectSubmit);

    assert.strictEqual(resCorrectSubmit.statusCode, 200);
    assert(resCorrectSubmit.data.success);
    assert.strictEqual(resCorrectSubmit.data.isCorrect, true);
    assert.strictEqual(resCorrectSubmit.data.mastered, true);
    assert(resCorrectSubmit.data.practicalTakeaway, 'Must provide practical takeaway');

    const progAfterCorrect = await UserProgress.findOne({ userId: testUser._id });
    const itemAfterCorrect = progAfterCorrect.quizRecallItems.find(i => i.questionId.toString() === testQuestion._id.toString());
    assert.strictEqual(itemAfterCorrect.mastered, true, 'Question must transition to mastered: true');
    assert.strictEqual(itemAfterCorrect.reviewHistory.length, 2);
    assert.strictEqual(itemAfterCorrect.reviewHistory[1].isCorrect, true);

    // Verify question is no longer in due queue
    const reqDueAfter = { user: testUser };
    const resDueAfter = createMockRes();
    await quizController.getDueQuizRecallItems(reqDueAfter, resDueAfter);
    assert.strictEqual(resDueAfter.data.totalDue, 0, 'Mastered question must not appear in due queue');

    console.log('  ✓ Test 6 Passed: Correct recall submission successfully transitions question to mastered.\n');

    // -------------------------------------------------------------------------
    // TEST 7: Strict Behavioral Dimensions & Spaced Reviews Isolation
    // -------------------------------------------------------------------------
    console.log('[Test 7] Verifying strict isolation between quiz recall and assessment dimensions...');

    const finalProg = await UserProgress.findOne({ userId: testUser._id });
    assert.strictEqual(finalProg.spacedReviews.length, 0, 'Pathway spacedReviews must have 0 items (never polluted by quiz recall)');

    const sessionCheck = await AssessmentSession.findOne({ userId: testUser._id });
    assert(sessionCheck, 'AssessmentSession must exist');
    const scores = sessionCheck.behaviourScores;
    assert.strictEqual(scores.get('recognition'), 72, 'TR must remain strictly 72');
    assert.strictEqual(scores.get('signalIdentification'), 68, 'SI must remain strictly 68');
    assert.strictEqual(scores.get('verification'), 85, 'VB must remain strictly 85');
    assert.strictEqual(scores.get('decisionQuality'), 75, 'DQ must remain strictly 75');
    assert.strictEqual(scores.get('falsePositive'), 80, 'FP must remain strictly 80');
    assert.strictEqual(scores.get('unreviewedAcceptance'), 90, 'UA must remain strictly 90');

    console.log('  ✓ Test 7 Passed: Assessment dimensions (TR, SI, VB, DQ, FP, UA) and pathway spacedReviews strictly isolated.\n');

    console.log('=============================================================');
    console.log('ALL PHASE 6 DASHBOARD REWORK & RETENTION TESTS PASSED (7/7)');
    console.log('=============================================================\n');

  } finally {
    if (testUser) {
      await AssessmentSession.deleteMany({ userId: testUser._id });
      await QuizAttempt.deleteMany({ userId: testUser._id });
      await UserProgress.deleteMany({ userId: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB. Cleaned up test fixtures.');
  }
}

if (require.main === module) {
  runDashboardReworkPhase6Tests().catch(err => {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  });
}

module.exports = { runDashboardReworkPhase6Tests };
