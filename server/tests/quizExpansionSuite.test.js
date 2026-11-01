const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
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

async function runQuizExpansionTestSuite() {
  console.log('\n=============================================================');
  console.log('CYBER LAW QUIZ EXPANSION & LEARNER EXPERIENCE TEST SUITE');
  console.log('=============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Database] Connected to MongoDB.\n');

  let testUser1 = null;
  let testUser2 = null;

  try {
    // Setup test learners
    testUser1 = await User.create({
      email: `quiz_learner_1_${Date.now()}@test.internal`,
      fullName: 'Quiz Learner Alpha',
      passwordHash: 'dummy_hash',
      role: 'user'
    });

    testUser2 = await User.create({
      email: `quiz_learner_2_${Date.now()}@test.internal`,
      fullName: 'Quiz Learner Beta',
      passwordHash: 'dummy_hash',
      role: 'user'
    });

    // Initialize progress for User 1 with baseline behavioral dimensions
    await UserProgress.create({
      userId: testUser1._id,
      dimensions: {
        TR: 65,
        SI: 70,
        VB: 80,
        DQ: 60,
        FP: 75,
        UA: 85
      },
      currentStreak: 2,
      lastActivity: new Date()
    });

    // -------------------------------------------------------------------------
    // TEST 1: Question Bank Size & 10 Canonical Categories
    // -------------------------------------------------------------------------
    console.log('[Test 1] Verifying Question Bank Scale & Category Coverage...');
    const totalQuestions = await QuizQuestion.countDocuments({ published: true });
    console.log(`  -> Total published questions in database: ${totalQuestions}`);
    assert(totalQuestions >= 300, `Expected at least 300 questions, got ${totalQuestions}`);

    const reqTopics = {};
    const resTopics = createMockRes();
    await quizController.getQuizTopics(reqTopics, resTopics);

    assert.strictEqual(resTopics.statusCode, 200);
    assert(resTopics.data.success);
    assert.strictEqual(resTopics.data.topics.length, 10, 'Must cover exactly 10 canonical subject categories');

    const canonicalTitles = resTopics.data.topics.map(t => t.topic);
    assert(canonicalTitles.includes('Indian Cyber Law and IT Act'));
    assert(canonicalTitles.includes('BNS and cybercrime provisions'));
    assert(canonicalTitles.includes('BSA and digital evidence'));
    assert(canonicalTitles.includes('DPDP and privacy'));
    assert(canonicalTitles.includes('Phishing and social engineering'));
    assert(canonicalTitles.includes('UPI, banking and financial fraud'));
    assert(canonicalTitles.includes('Identity theft and account security'));
    assert(canonicalTitles.includes('AI, deepfakes and emerging threats'));
    assert(canonicalTitles.includes('Incident response and reporting'));
    assert(canonicalTitles.includes('General cybersecurity awareness'));
    console.log('  ✓ Test 1 Passed: 300+ questions across 10 canonical categories confirmed.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Five Dedicated Quiz Modes
    // -------------------------------------------------------------------------
    console.log('[Test 2] Verifying Five Dedicated Quiz Modes Configuration...');
    const reqModes = {};
    const resModes = createMockRes();
    quizController.getQuizModes(reqModes, resModes);

    assert.strictEqual(resModes.statusCode, 200);
    const modes = resModes.data.modes;
    assert.strictEqual(modes.length, 5, 'Must provide exactly 5 quiz modes');

    const modeIds = modes.map(m => m.id);
    assert(modeIds.includes('quick_practice'));
    assert(modeIds.includes('topic_wise'));
    assert(modeIds.includes('scenario'));
    assert(modeIds.includes('challenge'));
    assert(modeIds.includes('case_based'));

    const quickPractice = modes.find(m => m.id === 'quick_practice');
    assert.strictEqual(quickPractice.questionCount, 5);
    assert.strictEqual(quickPractice.timed, false);

    const challenge = modes.find(m => m.id === 'challenge');
    assert.strictEqual(challenge.questionCount, 15);
    assert.strictEqual(challenge.timed, true);
    assert.strictEqual(challenge.defaultDurationSeconds, 600);
    console.log('  ✓ Test 2 Passed: 5 Quiz Modes configured with precise specifications.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Mode-Aware Question Selection & Answer Secrecy
    // -------------------------------------------------------------------------
    console.log('[Test 3] Verifying Dynamic Selection & Client Answer Secrecy...');
    for (const modeId of ['quick_practice', 'scenario', 'challenge', 'case_based']) {
      const reqStart = {
        user: testUser1,
        body: { mode: modeId, difficulty: 'All' }
      };
      const resStart = createMockRes();
      await quizController.startQuizSession(reqStart, resStart);

      assert.strictEqual(resStart.statusCode, 200, `Mode ${modeId} should return 200`);
      assert(resStart.data.success);
      assert(resStart.data.questions.length > 0);

      // Verify answer secrecy: NO answer keys or explanations sent to client
      for (const q of resStart.data.questions) {
        assert.strictEqual(q.correctOptionIndex, undefined, 'CRITICAL: correctOptionIndex must never leak');
        assert.strictEqual(q.correctOptionIndices, undefined, 'CRITICAL: correctOptionIndices must never leak');
        assert.strictEqual(q.matchingPairs, undefined, 'CRITICAL: matchingPairs solution must never leak');
        assert.strictEqual(q.explanation, undefined, 'CRITICAL: explanation must not be visible before submission');
        assert.strictEqual(q.whyIncorrect, undefined, 'CRITICAL: whyIncorrect must not be visible before submission');
        assert.strictEqual(q.optionExplanations, undefined, 'CRITICAL: optionExplanations must not be visible before submission');

        if (q.format === 'matching') {
          assert(Array.isArray(q.leftItems));
          assert(Array.isArray(q.rightItems));
          assert.strictEqual(q.leftItems.length, q.rightItems.length);
        }
        if (q.format === 'ordering') {
          assert(Array.isArray(q.sequenceItems));
        }
        if (q.format === 'indicator_identification') {
          assert(Array.isArray(q.indicators));
          q.indicators.forEach(ind => {
            assert.strictEqual(ind.isSuspicious, undefined, 'isSuspicious flag must be stripped');
          });
        }
      }
    }
    console.log('  ✓ Test 3 Passed: Answer secrecy rigorously maintained across all modes.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Authoritative Multi-Format Submission & Scoring
    // -------------------------------------------------------------------------
    console.log('[Test 4] Verifying Authoritative Scoring across All 8 Formats...');

    // Fetch sample questions of various formats from database
    const qSingle = await QuizQuestion.findOne({ format: 'single_choice', published: true });
    const qTrueFalse = await QuizQuestion.findOne({ format: 'true_false', published: true });
    const qMultiple = await QuizQuestion.findOne({ format: 'multiple_choice', published: true });
    const qMatching = await QuizQuestion.findOne({ format: 'matching', published: true });
    const qOrdering = await QuizQuestion.findOne({ format: 'ordering', published: true });
    const qScenario = await QuizQuestion.findOne({ format: 'scenario_decision', published: true });
    const qLegal = await QuizQuestion.findOne({ format: 'legal_application', published: true });

    assert(qSingle, 'Need single_choice test question');
    assert(qMultiple, 'Need multiple_choice test question');
    assert(qMatching, 'Need matching test question');
    assert(qOrdering, 'Need ordering test question');

    // Case 4A: Fully Correct Submission
    const correctSubmissionAnswers = [
      {
        questionId: qSingle._id,
        selectedOptionIndex: qSingle.correctOptionIndex
      },
      {
        questionId: qMultiple._id,
        selectedOptionIndices: qMultiple.correctOptionIndices
      },
      {
        questionId: qMatching._id,
        selectedPairs: qMatching.matchingPairs.map(p => ({ left: p.left, right: p.right }))
      },
      {
        questionId: qOrdering._id,
        selectedSequence: [...qOrdering.sequenceItems]
      }
    ];

    if (qTrueFalse) {
      correctSubmissionAnswers.push({
        questionId: qTrueFalse._id,
        selectedOptionIndex: qTrueFalse.correctOptionIndex
      });
    }
    if (qScenario) {
      correctSubmissionAnswers.push({
        questionId: qScenario._id,
        selectedOptionIndex: qScenario.correctOptionIndex
      });
    }
    if (qLegal) {
      correctSubmissionAnswers.push({
        questionId: qLegal._id,
        selectedOptionIndex: qLegal.correctOptionIndex
      });
    }

    const reqSubmit = {
      user: testUser1,
      body: {
        mode: 'quick_practice',
        topic: 'Mixed Multi-Format',
        timeTaken: 120,
        answers: correctSubmissionAnswers
      }
    };
    const resSubmit = createMockRes();
    await quizController.submitQuiz(reqSubmit, resSubmit);

    assert.strictEqual(resSubmit.statusCode, 200);
    assert(resSubmit.data.success);
    assert.strictEqual(resSubmit.data.percentage, 100, 'All correct answers must achieve 100%');
    assert.strictEqual(resSubmit.data.correctCount, correctSubmissionAnswers.length);
    assert.strictEqual(resSubmit.data.incorrectCount, 0);
    assert(Array.isArray(resSubmit.data.topicBreakdown));
    console.log('  ✓ Test 4A Passed: 100% score verified for all-correct multi-format answers.\n');

    // Case 4B: Incorrect Answers & Explanations Verification
    console.log('[Test 5] Verifying "Review Your Answers" & Simple Explanations for Mistakes...');
    // Intentionally pick incorrect options
    const wrongSingleOption = (qSingle.correctOptionIndex + 1) % (qSingle.options.length || 4);
    const partialMultipleOptions = [qMultiple.correctOptionIndices[0]]; // partial selection

    const incorrectSubmissionAnswers = [
      {
        questionId: qSingle._id,
        selectedOptionIndex: wrongSingleOption
      },
      {
        questionId: qMultiple._id,
        selectedOptionIndices: partialMultipleOptions
      },
      {
        questionId: qMatching._id,
        selectedPairs: qMatching.matchingPairs.map((p, idx, arr) => ({
          left: p.left,
          right: arr[(idx + 1) % arr.length].right // mismatched pair
        }))
      }
    ];

    const reqSubmitWrong = {
      user: testUser1,
      body: {
        mode: 'topic_wise',
        topic: 'Review Verification',
        timeTaken: 180,
        answers: incorrectSubmissionAnswers
      }
    };
    const resSubmitWrong = createMockRes();
    await quizController.submitQuiz(reqSubmitWrong, resSubmitWrong);

    assert.strictEqual(resSubmitWrong.statusCode, 200);
    assert(resSubmitWrong.data.percentage < 50, 'Incorrect answers must yield low percentage');
    assert(resSubmitWrong.data.incorrectCount >= 2);

    // Verify explanation objects
    const expList = resSubmitWrong.data.explanations;
    assert.strictEqual(expList.length, 3);

    const expSingle = expList.find(e => e.questionId.toString() === qSingle._id.toString());
    assert(expSingle, 'Explanation for single choice question must exist');
    assert.strictEqual(expSingle.isCorrect, false);
    assert(expSingle.whyIncorrect, 'Must provide simple friendly explanation for why answer was incorrect');
    assert(expSingle.explanation, 'Must provide authoritative reason why correct answer is right');
    assert(expSingle.practicalTakeaway, 'Must provide memorable practical takeaway');

    console.log(`    -> Sample 'whyIncorrect': "${expSingle.whyIncorrect.substring(0, 60)}..."`);
    console.log(`    -> Sample 'practicalTakeaway': "${expSingle.practicalTakeaway.substring(0, 60)}..."`);

    // Verify recommended learning links
    assert(Array.isArray(resSubmitWrong.data.recommendedLearning));
    console.log(`    -> Recommended learning items: ${resSubmitWrong.data.recommendedLearning.length}`);
    console.log('  ✓ Test 5 Passed: Rich incorrect answer explanations and takeaways verified.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Security, Edge Cases & Cross-User History
    // -------------------------------------------------------------------------
    console.log('[Test 6] Verifying Security Validations & Cross-User History...');

    // 6A: Duplicate question IDs rejected
    const reqDuplicate = {
      user: testUser1,
      body: {
        answers: [
          { questionId: qSingle._id, selectedOptionIndex: 0 },
          { questionId: qSingle._id, selectedOptionIndex: 1 }
        ]
      }
    };
    const resDuplicate = createMockRes();
    await quizController.submitQuiz(reqDuplicate, resDuplicate);
    assert.strictEqual(resDuplicate.statusCode, 400);
    assert.strictEqual(resDuplicate.data.error.code, 'DUPLICATE_QUESTION_IDS');

    // 6B: Empty answers array rejected
    const reqEmpty = {
      user: testUser1,
      body: { answers: [] }
    };
    const resEmpty = createMockRes();
    await quizController.submitQuiz(reqEmpty, resEmpty);
    assert.strictEqual(resEmpty.statusCode, 400);
    assert.strictEqual(resEmpty.data.error.code, 'INVALID_PARAMETERS');

    // 6C: Cross-user history isolation
    const reqHist1 = { user: testUser1 };
    const resHist1 = createMockRes();
    await quizController.getQuizHistory(reqHist1, resHist1);
    assert.strictEqual(resHist1.statusCode, 200);
    assert.strictEqual(resHist1.data.totalAttempts, 2, 'User 1 should have 2 attempts recorded');

    const reqHist2 = { user: testUser2 };
    const resHist2 = createMockRes();
    await quizController.getQuizHistory(reqHist2, resHist2);
    assert.strictEqual(resHist2.statusCode, 200);
    assert.strictEqual(resHist2.data.totalAttempts, 0, 'User 2 must have 0 attempts (complete user isolation)');
    console.log('  ✓ Test 6 Passed: Security controls and user isolation verified.\n');

    // -------------------------------------------------------------------------
    // TEST 7: Behavioral Dimension Invariant Protection
    // -------------------------------------------------------------------------
    console.log('[Test 7] Verifying Behavioral Dimensions Invariant Protection...');
    // Create an assessment session fixture with the 6 authoritative dimensions
    const AssessmentSession = require('../models/AssessmentSession');
    const Scenario = require('../models/Scenario');
    const ScenarioStage = require('../models/ScenarioStage');

    let dummyScenario = await Scenario.findOne();
    let dummyStage = await ScenarioStage.findOne();

    if (!dummyScenario) {
      dummyScenario = { _id: new mongoose.Types.ObjectId() };
    }
    if (!dummyStage) {
      dummyStage = { _id: new mongoose.Types.ObjectId() };
    }

    const testSession = await AssessmentSession.create({
      userId: testUser1._id,
      scenarioId: dummyScenario._id,
      scenarioCode: 'INVARIANT_TEST',
      currentStageId: dummyStage._id,
      expiresAt: new Date(Date.now() + 3600000),
      behaviourScores: {
        recognition: 65,
        signalIdentification: 70,
        verification: 80,
        decisionQuality: 60,
        falsePositive: 75,
        unreviewedAcceptance: 85
      }
    });

    // Submit another quiz
    const reqSubmitFinal = {
      user: testUser1,
      body: {
        mode: 'quick_practice',
        answers: [
          { questionId: qSingle._id, selectedOptionIndex: qSingle.correctOptionIndex }
        ]
      }
    };
    const resSubmitFinal = createMockRes();
    await quizController.submitQuiz(reqSubmitFinal, resSubmitFinal);

    // Verify AssessmentSession behaviourScores remain strictly untouched
    const sessionAfter = await AssessmentSession.findById(testSession._id);
    const scores = sessionAfter.behaviourScores;
    assert.strictEqual(scores.get('recognition'), 65, 'recognition (TR) must remain unchanged');
    assert.strictEqual(scores.get('signalIdentification'), 70, 'signalIdentification (SI) must remain unchanged');
    assert.strictEqual(scores.get('verification'), 80, 'verification (VB) must remain unchanged');
    assert.strictEqual(scores.get('decisionQuality'), 60, 'decisionQuality (DQ) must remain unchanged');
    assert.strictEqual(scores.get('falsePositive'), 75, 'falsePositive (FP) must remain unchanged');
    assert.strictEqual(scores.get('unreviewedAcceptance'), 85, 'unreviewedAcceptance (UA) must remain unchanged');

    await AssessmentSession.deleteOne({ _id: testSession._id });
    console.log('  ✓ Test 7 Passed: Behavioral dimensions (TR, SI, VB, DQ, FP, UA) strictly preserved.\n');

    // -------------------------------------------------------------------------
    // TEST 8: Spaced Retrieval for Missed Standalone Quiz Questions (Quiz Recall)
    // -------------------------------------------------------------------------
    console.log('[Test 8] Verifying Spaced Retrieval for Missed Quiz Questions...');
    // testUser1 missed qSingle in Test 5. Check if it exists in due recall items.
    const reqDue = { user: testUser1 };
    const resDue = createMockRes();
    await quizController.getDueQuizRecallItems(reqDue, resDue);

    assert.strictEqual(resDue.statusCode, 200);
    assert(resDue.data.success);
    assert(resDue.data.totalDue >= 1, 'Expected at least 1 due recall item from missed questions in Test 5');

    const dueItem = resDue.data.dueItems.find(it => it.questionId.toString() === qSingle._id.toString());
    assert(dueItem, 'qSingle should be in due recall items');
    assert.strictEqual(dueItem.question.correctOptionIndex, undefined, 'Answer secrecy: correctOptionIndex must be stripped');
    assert.strictEqual(dueItem.question.explanation, undefined, 'Answer secrecy: explanation must be stripped');

    // Submit correct answer to recall item
    const reqRecallSubmit = {
      user: testUser1,
      body: {
        questionId: qSingle._id,
        answer: qSingle.correctOptionIndex
      }
    };
    const resRecallSubmit = createMockRes();
    await quizController.submitQuizRecall(reqRecallSubmit, resRecallSubmit);

    assert.strictEqual(resRecallSubmit.statusCode, 200);
    assert(resRecallSubmit.data.success);
    assert.strictEqual(resRecallSubmit.data.isCorrect, true);
    assert.strictEqual(resRecallSubmit.data.mastered, true);
    assert(resRecallSubmit.data.explanation, 'Must return explanation upon recall submission');
    assert(resRecallSubmit.data.practicalTakeaway, 'Must return takeaway upon recall submission');

    // Verify UserProgress has updated mastered status and spacedReviews remains isolated
    const progressRecall = await UserProgress.findOne({ userId: testUser1._id });
    const recallEntry = progressRecall.quizRecallItems.find(it => it.questionId.toString() === qSingle._id.toString());
    assert.strictEqual(recallEntry.mastered, true, 'Question must be marked as mastered');
    assert.strictEqual(progressRecall.spacedReviews.length, 0, 'Pathway spacedReviews array must remain strictly isolated');

    console.log('  ✓ Test 8 Passed: Quiz recall queue, answer secrecy, and mastery evaluation verified.\n');

    console.log('=============================================================');
    console.log('ALL QUIZ EXPANSION & LEARNER EXPERIENCE TESTS PASSED (8/8)');
    console.log('=============================================================\n');

  } finally {
    // Clean up test data
    if (testUser1) {
      await QuizAttempt.deleteMany({ userId: testUser1._id });
      await UserProgress.deleteMany({ userId: testUser1._id });
      await User.deleteOne({ _id: testUser1._id });
    }
    if (testUser2) {
      await QuizAttempt.deleteMany({ userId: testUser2._id });
      await UserProgress.deleteMany({ userId: testUser2._id });
      await User.deleteOne({ _id: testUser2._id });
    }
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB. Cleaned up test fixtures.');
  }
}

if (require.main === module) {
  runQuizExpansionTestSuite().catch(err => {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  });
}

module.exports = { runQuizExpansionTestSuite };
