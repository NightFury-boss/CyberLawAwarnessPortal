const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');

const { selectQuestions } = require('../services/questionSelectionService');

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    // Return quizzes populated with attempt size and total bank size
    const populated = await Promise.all(quizzes.map(async (quiz) => {
      const questions = await QuizQuestion.find({ quizId: quiz._id, published: true });
      return {
        id: quiz._id,
        title: quiz.title,
        category: quiz.category,
        description: quiz.description,
        difficulty: quiz.difficulty,
        questionCount: Math.min(10, questions.length),
        totalQuestionsInBank: questions.length,
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          options: q.options,
          relatedLawSection: q.relatedLawSection || q.relatedLaw || '',
          difficulty: q.difficulty,
          cognitiveLevel: q.cognitiveLevel,
          questionType: q.questionType
        }))
      };
    }));
    res.json(populated);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUIZ_FETCH_ERROR', message: error.message }
    });
  }
};

exports.getQuizQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user ? req.user._id : null;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUIZ_ID', message: 'Invalid quiz ID format' }
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' }
      });
    }

    // Load questions dynamically via selection service
    const questions = await selectQuestions(userId, quizId, quiz.category, 10);
    
    // EXCLUDE correctOptionIndex and explanation to prevent client-side inspection
    const sanitized = questions.map(q => ({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      relatedLawSection: q.relatedLawSection || q.relatedLaw || '',
      difficulty: q.difficulty,
      cognitiveLevel: q.cognitiveLevel,
      questionType: q.questionType
    }));

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUESTIONS_FETCH_ERROR', message: error.message }
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.user._id;

    // 1. Validate basic parameters
    if (!quizId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'quizId and non-empty answers array are required' }
      });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUIZ_ID', message: 'Invalid quiz ID format' }
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' }
      });
    }

    // 2. Validate answer payload format
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      if (!a || !a.questionId || !mongoose.Types.ObjectId.isValid(a.questionId)) {
        return res.status(400).json({
          success: false,
          error: { code: 'MALFORMED_ANSWER', message: `Answer at index ${i} has invalid or missing questionId` }
        });
      }
      if (typeof a.selectedOptionIndex !== 'number' || a.selectedOptionIndex < -1 || a.selectedOptionIndex > 3) {
        return res.status(400).json({
          success: false,
          error: { code: 'MALFORMED_ANSWER', message: `Answer at index ${i} has invalid selectedOptionIndex` }
        });
      }
    }

    // 3. Detect duplicate submitted question IDs
    const submittedQuestionIds = answers.map(a => a.questionId.toString());
    const uniqueIds = new Set(submittedQuestionIds);
    if (uniqueIds.size !== submittedQuestionIds.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_QUESTION_IDS', message: 'Duplicate question IDs found in submission' }
      });
    }

    // 4. Fetch submitted questions belonging strictly to this quiz
    const questions = await QuizQuestion.find({
      _id: { $in: submittedQuestionIds },
      quizId: quiz._id
    });

    // Detect unknown IDs or IDs from a different quiz
    if (questions.length !== submittedQuestionIds.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUESTION_IDS', message: 'One or more submitted question IDs do not belong to the requested quiz' }
      });
    }

    // 5. Backend-Authoritative score calculations out of submitted questions (NOT entire category)
    let correctCount = 0;
    const explanations = [];
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    for (let ans of answers) {
      const question = questionMap.get(ans.questionId.toString());
      const selectedIndex = ans.selectedOptionIndex;
      // Do NOT trust client-supplied correctness; calculate directly against question.correctOptionIndex
      const isCorrect = selectedIndex === question.correctOptionIndex;

      if (isCorrect) {
        correctCount++;
      }

      explanations.push({
        questionId: question._id,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation
      });
    }

    const totalAttemptQuestions = questions.length;
    const percentage = Math.round((correctCount / totalAttemptQuestions) * 100);

    // 6. Save attempt
    const previousAttemptsCount = await QuizAttempt.countDocuments({ userId, quizId });
    const attemptNumber = previousAttemptsCount + 1;

    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      answers: answers.map(a => ({
        questionId: a.questionId,
        selectedOptionIndex: a.selectedOptionIndex
      })),
      score: percentage,
      percentage,
      attemptNumber
    });

    // 7. Update user progress profiles, streaks, and badges
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        completedModules: [],
        badgesEarned: ['First Step'],
        currentStreak: 1
      });
    }

    const badgesEarned = [...(progress.badgesEarned || [])];
    
    // Evaluates "Scam Spotter" (100% on a Phishing quiz)
    if (quiz.category === 'Phishing' && percentage === 100 && !badgesEarned.includes('Scam Spotter')) {
      badgesEarned.push('Scam Spotter');
    }

    // Evaluates "Cyber Law Learner" (complete 3 quizzes with >= 75% score)
    const highAttempts = await QuizAttempt.find({ userId, percentage: { $gte: 75 } });
    const distinctQuizzes = new Set(highAttempts.map(a => a.quizId.toString()));
    if (percentage >= 75) {
      distinctQuizzes.add(quizId.toString());
    }

    if (distinctQuizzes.size >= 3 && !badgesEarned.includes('Cyber Law Learner')) {
      badgesEarned.push('Cyber Law Learner');
    }

    // Streak tracker
    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = progress.lastActivity ? progress.lastActivity.toISOString().split('T')[0] : '';
    let currentStreak = progress.currentStreak || 0;

    if (lastActiveDate !== today) {
      if (lastActiveDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }

    await UserProgress.findOneAndUpdate({ userId }, {
      $addToSet: { quizAttempts: attempt._id },
      badgesEarned,
      currentStreak,
      lastActivity: new Date()
    });

    res.json({
      success: true,
      attemptId: attempt._id,
      score: percentage,
      percentage,
      correctCount,
      totalQuestions: totalAttemptQuestions,
      badgesEarned,
      explanations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUIZ_SUBMIT_ERROR', message: error.message }
    });
  }
};
