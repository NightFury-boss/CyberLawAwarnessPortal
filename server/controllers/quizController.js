const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    // Return quizzes populated with their questions list, but WITHOUT correct answers or explanations (Security Protection)
    const populated = await Promise.all(quizzes.map(async (quiz) => {
      const questions = await QuizQuestion.find({ quizId: quiz._id });
      return {
        id: quiz._id,
        title: quiz.title,
        category: quiz.category,
        description: quiz.description,
        difficulty: quiz.difficulty,
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          options: q.options,
          relatedLawSection: q.relatedLawSection,
          difficulty: q.difficulty
          // EXCLUDED correctOptionIndex and explanation to prevent client-side inspecting
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

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body; // answers is an array of { questionId, selectedOptionIndex }
    const userId = req.user._id;

    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'quizId and answers array are required' }
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' }
      });
    }

    // Fetch official questions list for validation
    const questions = await QuizQuestion.find({ quizId });
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'QUIZ_NO_QUESTIONS', message: 'Quiz contains no questions' }
      });
    }

    // Backend-Authoritative score calculations
    let correctCount = 0;
    const explanations = [];

    for (let question of questions) {
      const userAns = answers.find(a => a.questionId.toString() === question._id.toString());
      const selectedIndex = userAns ? userAns.selectedOptionIndex : -1;
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

    const percentage = Math.round((correctCount / questions.length) * 100);

    // Save attempt
    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      answers: answers.map(a => ({
        questionId: a.questionId,
        selectedOptionIndex: a.selectedOptionIndex
      })),
      score: percentage,
      percentage
    });

    // Update progress profiles, streaks, and badges
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
    // Include current attempt if it was high score
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
      totalQuestions: questions.length,
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
