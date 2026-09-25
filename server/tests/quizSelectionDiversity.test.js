const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const { selectQuestions } = require('../services/questionSelectionService');
const quizController = require('../controllers/quizController');

async function runTest() {
  console.log('=== TEST: QUIZ SELECTION DIVERSITY & SCORING VALIDATION ===\n');
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const dummyUser = await User.findOne({ role: 'admin' });
    assert(dummyUser, 'Admin user required for test execution');

    const quizzes = await Quiz.find();
    assert(quizzes.length >= 5, 'Expected at least 5 quizzes in database');

    // 1. Test Selection Across All 5 Categories
    console.log('[Test 1] Testing 10-question 5-bucket selection for all categories...');
    for (const quiz of quizzes) {
      const selected = await selectQuestions(dummyUser._id, quiz._id, quiz.category, 10);
      assert.strictEqual(selected.length, 10, `Quiz "${quiz.category}" did not return 10 questions (got ${selected.length})`);

      // Verify no duplicates within the selected attempt
      const idSet = new Set(selected.map(q => q._id.toString()));
      assert.strictEqual(idSet.size, 10, `Quiz "${quiz.category}" returned duplicate questions in single attempt`);

      // Verify cognitive diversity
      const cogLevels = new Set(selected.map(q => q.cognitiveLevel));
      assert(cogLevels.size >= 3, `Quiz "${quiz.category}" has poor cognitive diversity (only ${cogLevels.size} levels)`);

      // Verify difficulty distribution
      const diffCounts = { Beginner: 0, Intermediate: 0, Advanced: 0 };
      selected.forEach(q => { diffCounts[q.difficulty] = (diffCounts[q.difficulty] || 0) + 1; });

      console.log(`  * ${quiz.category}: [${diffCounts.Beginner} Beg, ${diffCounts.Intermediate} Int, ${diffCounts.Advanced} Adv] | Cognitive levels: [${Array.from(cogLevels).join(', ')}]`);
      assert(diffCounts.Beginner >= 1, `${quiz.category} missing Beginner questions`);
      assert(diffCounts.Intermediate >= 2, `${quiz.category} missing Intermediate questions`);
      assert(diffCounts.Advanced >= 1, `${quiz.category} missing Advanced questions`);
    }
    console.log('  * PASS: All categories satisfy 10-question selection and difficulty balance.\n');

    // 2. Test Recent-Question History Avoidance
    console.log('[Test 2] Testing recent-question history avoidance...');
    const testQuiz = quizzes[0];
    const firstAttempt = await selectQuestions(dummyUser._id, testQuiz._id, testQuiz.category, 10);
    const firstIds = new Set(firstAttempt.map(q => q._id.toString()));

    // Record mock attempt
    const mockAttempt = await QuizAttempt.create({
      userId: dummyUser._id,
      quizId: testQuiz._id,
      score: 80,
      percentage: 80,
      attemptNumber: 999,
      answers: firstAttempt.map(q => ({
        questionId: q._id,
        selectedOptionIndex: q.correctOptionIndex
      }))
    });

    // Select again - should deprioritize recently seen questions
    const secondAttempt = await selectQuestions(dummyUser._id, testQuiz._id, testQuiz.category, 10);
    const secondIds = new Set(secondAttempt.map(q => q._id.toString()));

    let overlap = 0;
    secondAttempt.forEach(q => {
      if (firstIds.has(q._id.toString())) overlap++;
    });

    console.log(`  * Overlap with immediate previous attempt: ${overlap} / 10 questions (out of pool of 35)`);
    // Out of 35 questions, avoiding 10 means the second attempt should pull fresh questions
    assert(overlap <= 4, `Expected at most 4 overlapping questions in 35-item bank, got ${overlap}`);
    console.log('  * PASS: History avoidance effectively rotates fresh questions.\n');

    // Clean up mock attempt
    await QuizAttempt.deleteOne({ _id: mockAttempt._id });

    // 3. Test Quiz Scoring Logic (Out of 10, not category pool)
    console.log('[Test 3] Testing submitQuiz scoring out of 10 submitted questions...');
    const selectedQuestions = await selectQuestions(dummyUser._id, testQuiz._id, testQuiz.category, 10);

    // Mock Req/Res helper
    function createMockRes() {
      return {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.data = payload; return this; }
      };
    }

    // Case A: 10 out of 10 correct -> Score must be 100%
    const perfectAnswers = selectedQuestions.map(q => ({
      questionId: q._id,
      selectedOptionIndex: q.correctOptionIndex,
      isCorrect: false // deliberately false on client to test server-authoritative evaluation
    }));

    const reqA = {
      user: dummyUser,
      body: { quizId: testQuiz._id, answers: perfectAnswers }
    };
    const resA = createMockRes();
    await quizController.submitQuiz(reqA, resA);

    assert.strictEqual(resA.statusCode, 200);
    assert.strictEqual(resA.data.score, 100, `Expected 100% for 10/10 correct, got ${resA.data.score}%`);
    assert.strictEqual(resA.data.correctCount, 10);
    assert.strictEqual(resA.data.totalQuestions, 10);
    console.log('  * PASS: 10/10 correct scores 100% (not diluted by 35-question category pool).');

    // Case B: 7 out of 10 correct -> Score must be 70%
    const sevenAnswers = selectedQuestions.map((q, idx) => ({
      questionId: q._id,
      selectedOptionIndex: idx < 7 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4
    }));

    const reqB = {
      user: dummyUser,
      body: { quizId: testQuiz._id, answers: sevenAnswers }
    };
    const resB = createMockRes();
    await quizController.submitQuiz(reqB, resB);

    assert.strictEqual(resB.statusCode, 200);
    assert.strictEqual(resB.data.score, 70, `Expected 70% for 7/10 correct, got ${resB.data.score}%`);
    assert.strictEqual(resB.data.correctCount, 7);
    assert.strictEqual(resB.data.totalQuestions, 10);
    console.log('  * PASS: 7/10 correct scores 70%.');

    // 4. Test Submission Security Validations
    console.log('\n[Test 4] Testing submitQuiz input validation and security guards...');

    // Duplicate question IDs
    const duplicatePayload = [
      { questionId: selectedQuestions[0]._id, selectedOptionIndex: 0 },
      { questionId: selectedQuestions[0]._id, selectedOptionIndex: 1 }
    ];
    const resDup = createMockRes();
    await quizController.submitQuiz({ user: dummyUser, body: { quizId: testQuiz._id, answers: duplicatePayload } }, resDup);
    assert.strictEqual(resDup.statusCode, 400);
    assert.strictEqual(resDup.data.error.code, 'DUPLICATE_QUESTION_IDS');
    console.log('  * PASS: Rejected duplicate question IDs in single submission.');

    // Question ID from another quiz
    const otherQuiz = quizzes.find(q => q._id.toString() !== testQuiz._id.toString());
    const otherQuestion = await QuizQuestion.findOne({ quizId: otherQuiz._id });
    const crossQuizPayload = [
      ...selectedQuestions.slice(0, 9).map(q => ({ questionId: q._id, selectedOptionIndex: 0 })),
      { questionId: otherQuestion._id, selectedOptionIndex: 0 }
    ];
    const resCross = createMockRes();
    await quizController.submitQuiz({ user: dummyUser, body: { quizId: testQuiz._id, answers: crossQuizPayload } }, resCross);
    assert.strictEqual(resCross.statusCode, 400);
    assert.strictEqual(resCross.data.error.code, 'INVALID_QUESTION_IDS');
    console.log('  * PASS: Rejected question ID belonging to a different quiz/category.');

    // Unknown question ID
    const fakeId = new mongoose.Types.ObjectId();
    const fakePayload = [
      ...selectedQuestions.slice(0, 9).map(q => ({ questionId: q._id, selectedOptionIndex: 0 })),
      { questionId: fakeId, selectedOptionIndex: 0 }
    ];
    const resFake = createMockRes();
    await quizController.submitQuiz({ user: dummyUser, body: { quizId: testQuiz._id, answers: fakePayload } }, resFake);
    assert.strictEqual(resFake.statusCode, 400);
    assert.strictEqual(resFake.data.error.code, 'INVALID_QUESTION_IDS');
    console.log('  * PASS: Rejected non-existent question ID.');

    // Malformed answer payload
    const malformedPayload = [
      { questionId: selectedQuestions[0]._id, selectedOptionIndex: 'invalid-string' }
    ];
    const resMal = createMockRes();
    await quizController.submitQuiz({ user: dummyUser, body: { quizId: testQuiz._id, answers: malformedPayload } }, resMal);
    assert.strictEqual(resMal.statusCode, 400);
    assert.strictEqual(resMal.data.error.code, 'MALFORMED_ANSWER');
    console.log('  * PASS: Rejected malformed selectedOptionIndex payload.');

    // Clean up test attempts created for dummyUser
    await QuizAttempt.deleteMany({ userId: dummyUser._id, attemptNumber: { $gt: 900 } });

    console.log('\n✅ All Selection Diversity and Authoritative Scoring tests passed successfully.');
  } finally {
    await mongoose.disconnect();
  }
}

runTest().then(() => {
  console.log('Test passed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
