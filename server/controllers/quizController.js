const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');
const LearningModule = require('../models/LearningModule');
const CaseStudy = require('../models/CaseStudy');

const {
  selectQuestions,
  selectQuestionsForMode,
  sanitizeQuestionForClient
} = require('../services/questionSelectionService');

// The 10 Canonical Subject Categories
const CANONICAL_TOPICS = [
  'Indian Cyber Law and IT Act',
  'BNS and cybercrime provisions',
  'BSA and digital evidence',
  'DPDP and privacy',
  'Phishing and social engineering',
  'UPI, banking and financial fraud',
  'Identity theft and account security',
  'AI, deepfakes and emerging threats',
  'Incident response and reporting',
  'General cybersecurity awareness'
];

// ---------------------------------------------------------------------------
// 1. GET ALL QUIZZES (Catalog View)
// ---------------------------------------------------------------------------
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ published: { $ne: false } }).sort({ createdAt: 1 });
    const populated = await Promise.all(quizzes.map(async (quiz) => {
      const questionsCount = await QuizQuestion.countDocuments({
        $or: [
          { quizId: quiz._id },
          { category: quiz.category }
        ],
        published: true
      });

      return {
        id: quiz._id,
        _id: quiz._id,
        title: quiz.title,
        category: quiz.category,
        description: quiz.description,
        difficulty: quiz.difficulty,
        questionCount: Math.min(10, questionsCount),
        totalQuestionsInBank: questionsCount
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

// ---------------------------------------------------------------------------
// 2. GET QUIZ MODES (The 5 Supported Modes)
// ---------------------------------------------------------------------------
exports.getQuizModes = (req, res) => {
  const modes = [
    {
      id: 'quick_practice',
      title: 'Quick Practice',
      badge: 'Rapid 5-Question Session',
      description: 'Short, untimed quizzes with immediate explanations and takeaways after each question. Perfect for daily practice.',
      questionCount: 5,
      timed: false,
      recommendedFor: 'Rapid review & daily habit building'
    },
    {
      id: 'topic_wise',
      title: 'Topic-wise Practice',
      badge: 'Subject & Level Mastery',
      description: 'Choose any of the 10 Indian cyber law and cybersecurity subjects, and select your difficulty level.',
      questionCount: 10,
      timed: false,
      recommendedFor: 'Targeted study of specific statutes or fraud vectors'
    },
    {
      id: 'scenario',
      title: 'Real-world Scenarios',
      badge: 'Everyday Dilemma Defense',
      description: 'Navigate authentic everyday digital situations, identify suspicious indicators, and make safe defensive decisions.',
      questionCount: 8,
      timed: false,
      recommendedFor: 'Developing practical online safety reflexes'
    },
    {
      id: 'challenge',
      title: 'Challenge Quiz',
      badge: 'Timed Multi-Subject Test',
      description: 'Mixed subjects with higher difficulty (Intermediate & Advanced) and an optional 10-minute timer.',
      questionCount: 15,
      timed: true,
      defaultDurationSeconds: 600,
      recommendedFor: 'Comprehensive readiness and speed testing'
    },
    {
      id: 'case_based',
      title: 'Case-based & Legal Application',
      badge: 'Statutory & Evidence Application',
      description: 'Questions rooted in Indian court cases, BSA Section 63 digital evidence rules, BNS, and IT Act provisions.',
      questionCount: 8,
      timed: false,
      recommendedFor: 'Legal accuracy, statutory analysis & evidentiary standards'
    }
  ];

  res.json({ success: true, modes });
};

// ---------------------------------------------------------------------------
// 3. GET TOPICS BREAKDOWN (The 10 Categories)
// ---------------------------------------------------------------------------
exports.getQuizTopics = async (req, res) => {
  try {
    const topicsData = await Promise.all(CANONICAL_TOPICS.map(async (topic) => {
      let catFilter = { category: topic, published: true };
      if (topic === 'Indian Cyber Law and IT Act') {
        catFilter = { category: { $in: ['Indian Cyber Law and IT Act', 'Cyber Law Basics'] }, published: true };
      } else if (topic === 'Phishing and social engineering') {
        catFilter = { category: { $in: ['Phishing', 'Social Engineering'] }, published: true };
      } else if (topic === 'UPI, banking and financial fraud') {
        catFilter = { category: { $in: ['UPI, banking and financial fraud', 'Financial Safety'] }, published: true };
      } else if (topic === 'Identity theft and account security') {
        catFilter = { category: { $in: ['Identity theft and account security', 'Account Security'] }, published: true };
      }

      const total = await QuizQuestion.countDocuments(catFilter);
      const beginner = await QuizQuestion.countDocuments({ ...catFilter, difficulty: 'Beginner' });
      const intermediate = await QuizQuestion.countDocuments({ ...catFilter, difficulty: 'Intermediate' });
      const advanced = await QuizQuestion.countDocuments({ ...catFilter, difficulty: 'Advanced' });

      return {
        topic,
        totalQuestions: total,
        difficulties: {
          Beginner: beginner,
          Intermediate: intermediate,
          Advanced: advanced
        }
      };
    }));

    res.json({ success: true, topics: topicsData });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'TOPICS_FETCH_ERROR', message: error.message }
    });
  }
};

// ---------------------------------------------------------------------------
// 4. START QUIZ SESSION (Mode-Aware Dynamic Selection)
// ---------------------------------------------------------------------------
exports.startQuizSession = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const { mode = 'topic_wise', category, topic, difficulty = 'All', questionCount } = req.body;

    const selectedCategory = category || topic || 'All';
    const rawQuestions = await selectQuestionsForMode(userId, {
      mode,
      category: selectedCategory,
      difficulty,
      questionCount
    });

    if (!rawQuestions || rawQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_QUESTIONS_FOUND', message: 'No questions match the requested parameters' }
      });
    }

    // CRITICAL SECURITY REQUIREMENT: Sanitize questions to protect answer keys
    const sanitizedQuestions = rawQuestions.map(sanitizeQuestionForClient);

    res.json({
      success: true,
      mode,
      category: selectedCategory,
      difficulty,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions
    });
  } catch (error) {
    console.error('Error starting quiz session:', error);
    res.status(500).json({
      success: false,
      error: { code: 'START_QUIZ_ERROR', message: error.message }
    });
  }
};

// ---------------------------------------------------------------------------
// 5. GET QUIZ QUESTIONS BY QUIZ ID (Backward Compatibility)
// ---------------------------------------------------------------------------
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

    // Select questions
    const rawQuestions = await selectQuestions(userId, quizId, quiz.category, 10);
    // CRITICAL: Sanitize questions
    const sanitized = rawQuestions.map(sanitizeQuestionForClient);

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUESTIONS_FETCH_ERROR', message: error.message }
    });
  }
};

// ---------------------------------------------------------------------------
// 6. SUBMIT QUIZ & EVALUATE AUTHORITATIVELY (All 8 Question Formats)
// ---------------------------------------------------------------------------
exports.submitQuiz = async (req, res) => {
  try {
    const {
      quizId,
      mode = 'standard',
      topic = 'All',
      difficulty = 'All',
      timeTaken = 0,
      answers
    } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'answers array must be non-empty' }
      });
    }

    // 1. Detect duplicate question IDs in submission
    const submittedIds = answers.map(a => a.questionId?.toString()).filter(Boolean);
    const uniqueIds = new Set(submittedIds);
    if (uniqueIds.size !== answers.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_QUESTION_IDS', message: 'Duplicate question IDs found in submission' }
      });
    }

    // 2. Fetch questions from database
    const questions = await QuizQuestion.find({
      _id: { $in: submittedIds }
    });

    if (questions.length !== answers.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUESTION_IDS', message: 'One or more submitted question IDs do not exist' }
      });
    }

    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

    // 3. Authoritative Answer Evaluation across all 8 Question Formats
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalScoreEarned = 0;

    const evaluatedAnswers = [];
    const explanations = [];
    const topicTracker = {};

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId.toString());
      const format = q.format || 'single_choice';
      const category = q.category || 'General';

      if (!topicTracker[category]) {
        topicTracker[category] = { correct: 0, total: 0 };
      }
      topicTracker[category].total++;

      let isCorrect = false;
      let partialScore = 0;
      let humanUserAnswer = '';
      let humanCorrectAnswer = '';
      let specificWhyIncorrect = q.whyIncorrect || 'This option does not align with statutory guidelines or safety best practices.';

      // Format 1: single_choice, true_false, scenario_decision, legal_application
      if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
        const selected = ans.selectedOptionIndex;
        if (selected === undefined || selected === null || selected === -1) {
          unansweredCount++;
          humanUserAnswer = 'Unanswered';
        } else {
          humanUserAnswer = (q.options && q.options[selected]) ? q.options[selected] : `Option ${selected + 1}`;
          if (selected === q.correctOptionIndex) {
            isCorrect = true;
            partialScore = 1.0;
            correctCount++;
            topicTracker[category].correct++;
          } else {
            incorrectCount++;
            if (Array.isArray(q.optionExplanations) && q.optionExplanations[selected]) {
              specificWhyIncorrect = q.optionExplanations[selected];
            }
          }
        }
        humanCorrectAnswer = (q.options && q.options[q.correctOptionIndex]) ? q.options[q.correctOptionIndex] : `Option ${(q.correctOptionIndex || 0) + 1}`;
      }

      // Format 2: multiple_choice (Multi-select MCQ)
      else if (format === 'multiple_choice') {
        const selectedIndices = Array.isArray(ans.selectedOptionIndices) ? ans.selectedOptionIndices : [];
        const correctIndices = Array.isArray(q.correctOptionIndices) ? q.correctOptionIndices : [];

        humanUserAnswer = selectedIndices.length > 0
          ? selectedIndices.map(i => q.options[i] || `Option ${i + 1}`).join('; ')
          : 'None selected';
        humanCorrectAnswer = correctIndices.map(i => q.options[i] || `Option ${i + 1}`).join('; ');

        if (selectedIndices.length === 0) {
          unansweredCount++;
        } else {
          const correctSet = new Set(correctIndices);
          const selectedSet = new Set(selectedIndices);

          let correctHits = 0;
          let wrongHits = 0;

          selectedIndices.forEach(idx => {
            if (correctSet.has(idx)) correctHits++;
            else wrongHits++;
          });

          if (correctHits === correctIndices.length && wrongHits === 0) {
            isCorrect = true;
            partialScore = 1.0;
            correctCount++;
            topicTracker[category].correct++;
          } else if (wrongHits === 0 && correctHits > 0) {
            // Partial score for partially correct selection with no false alarms
            partialScore = Number((correctHits / correctIndices.length).toFixed(2));
            totalScoreEarned += partialScore;
            incorrectCount++;
            specificWhyIncorrect = `You identified ${correctHits} of ${correctIndices.length} correct options, but missed some required selections.`;
          } else {
            incorrectCount++;
            specificWhyIncorrect = `Your selection included ${wrongHits} incorrect option(s). Review each requirement carefully.`;
          }
        }
      }

      // Format 3: matching
      else if (format === 'matching') {
        const submittedPairs = Array.isArray(ans.selectedPairs) ? ans.selectedPairs : [];
        const authoritativePairs = q.matchingPairs || [];

        humanUserAnswer = submittedPairs.map(p => `${p.left} → ${p.right}`).join('; ');
        humanCorrectAnswer = authoritativePairs.map(p => `${p.left} → ${p.right}`).join('; ');

        if (submittedPairs.length === 0) {
          unansweredCount++;
        } else {
          let matchedCount = 0;
          const authMap = new Map(authoritativePairs.map(p => [p.left, p.right]));

          submittedPairs.forEach(p => {
            if (authMap.get(p.left) === p.right) matchedCount++;
          });

          if (matchedCount === authoritativePairs.length && authoritativePairs.length > 0) {
            isCorrect = true;
            partialScore = 1.0;
            correctCount++;
            topicTracker[category].correct++;
          } else if (matchedCount > 0) {
            partialScore = Number((matchedCount / authoritativePairs.length).toFixed(2));
            totalScoreEarned += partialScore;
            incorrectCount++;
            specificWhyIncorrect = `Matched ${matchedCount} of ${authoritativePairs.length} pairs correctly.`;
          } else {
            incorrectCount++;
            specificWhyIncorrect = 'None of the submitted pair associations matched the statutory definitions.';
          }
        }
      }

      // Format 4: ordering (Sequence)
      else if (format === 'ordering') {
        const submittedSeq = Array.isArray(ans.selectedSequence) ? ans.selectedSequence : [];
        const authSeq = q.sequenceItems || [];

        humanUserAnswer = submittedSeq.join(' → ');
        humanCorrectAnswer = authSeq.join(' → ');

        if (submittedSeq.length === 0) {
          unansweredCount++;
        } else {
          let correctPositions = 0;
          for (let sIdx = 0; sIdx < Math.min(submittedSeq.length, authSeq.length); sIdx++) {
            if (submittedSeq[sIdx] === authSeq[sIdx]) correctPositions++;
          }

          if (correctPositions === authSeq.length && authSeq.length > 0) {
            isCorrect = true;
            partialScore = 1.0;
            correctCount++;
            topicTracker[category].correct++;
          } else {
            incorrectCount++;
            partialScore = Number((correctPositions / authSeq.length).toFixed(2));
            totalScoreEarned += partialScore;
            specificWhyIncorrect = `Placed ${correctPositions} of ${authSeq.length} steps in the correct chronological order. Critical time-sensitive steps must take precedence.`;
          }
        }
      }

      // Format 5: indicator_identification
      else if (format === 'indicator_identification') {
        const selectedIndicatorIds = Array.isArray(ans.selectedIndicatorIds) ? ans.selectedIndicatorIds : [];
        const indicators = q.indicators || [];
        const trueSuspiciousIds = indicators.filter(ind => ind.isSuspicious).map(ind => ind.id);

        humanUserAnswer = selectedIndicatorIds.length > 0
          ? indicators.filter(ind => selectedIndicatorIds.includes(ind.id)).map(ind => ind.text).join('; ')
          : 'No indicators flagged';
        humanCorrectAnswer = indicators.filter(ind => ind.isSuspicious).map(ind => ind.text).join('; ');

        if (selectedIndicatorIds.length === 0) {
          unansweredCount++;
        } else {
          const trueSet = new Set(trueSuspiciousIds);
          let correctFlags = 0;
          let falseAlarms = 0;

          selectedIndicatorIds.forEach(id => {
            if (trueSet.has(id)) correctFlags++;
            else falseAlarms++;
          });

          if (correctFlags === trueSuspiciousIds.length && falseAlarms === 0) {
            isCorrect = true;
            partialScore = 1.0;
            correctCount++;
            topicTracker[category].correct++;
          } else {
            incorrectCount++;
            specificWhyIncorrect = `Identified ${correctFlags} of ${trueSuspiciousIds.length} red flags, with ${falseAlarms} false alarms.`;
          }
        }
      }

      if (isCorrect) {
        totalScoreEarned += 1.0;
      }

      evaluatedAnswers.push({
        questionId: q._id,
        selectedOptionIndex: ans.selectedOptionIndex,
        selectedOptionIndices: ans.selectedOptionIndices,
        selectedPairs: ans.selectedPairs,
        selectedSequence: ans.selectedSequence,
        selectedIndicatorIds: ans.selectedIndicatorIds,
        isCorrect,
        partialScore
      });

      explanations.push({
        questionId: q._id,
        questionText: q.questionText,
        format,
        category,
        subtopic: q.subtopic || '',
        difficulty: q.difficulty,
        userAnswer: humanUserAnswer,
        correctAnswer: humanCorrectAnswer,
        isCorrect,
        partialScore,
        explanation: q.explanation,
        whyIncorrect: isCorrect ? '' : specificWhyIncorrect,
        optionExplanations: q.optionExplanations || [],
        practicalTakeaway: q.practicalTakeaway || 'Remember: Always verify digital requests through trusted secondary channels.',
        legalReferences: q.legalReferences || []
      });
    }

    const totalQuestions = questions.length;
    const rawPercentage = (totalScoreEarned / totalQuestions) * 100;
    const percentage = Math.min(100, Math.max(0, Math.round(rawPercentage)));

    // 4. Topic breakdown
    const topicBreakdown = Object.entries(topicTracker).map(([tName, stats]) => ({
      topic: tName,
      correct: stats.correct,
      total: stats.total,
      percentage: Math.round((stats.correct / stats.total) * 100)
    }));

    // 5. Recommended further learning based on weak topics (<70%)
    const weakTopics = topicBreakdown.filter(t => t.percentage < 70).map(t => t.topic);
    let recommendedLearning = [];

    if (weakTopics.length > 0) {
      // Find matching Learning Modules or Case Studies
      const recommendedModules = await LearningModule.find({
        published: true,
        $or: [
          { category: { $in: weakTopics } },
          { title: { $regex: weakTopics[0], $options: 'i' } }
        ]
      }).limit(2).select('title slug category estimatedMinutes');

      const recommendedCases = await CaseStudy.find({
        $or: [
          { caseType: { $in: weakTopics } },
          { incidentType: { $in: weakTopics } }
        ]
      }).limit(2).select('title slug caseNumber caseType difficulty');

      recommendedLearning = [
        ...recommendedModules.map(m => ({ type: 'lesson', title: m.title, slug: m.slug, category: m.category, readTime: m.estimatedMinutes })),
        ...recommendedCases.map(c => ({ type: 'case', title: c.title, slug: c.slug, caseNumber: c.caseNumber, difficulty: c.difficulty }))
      ];
    }

    // 6. Save Attempt in Database (Preserve historical integrity)
    let parentQuizId = null;
    if (quizId && mongoose.Types.ObjectId.isValid(quizId)) {
      parentQuizId = quizId;
    }

    const previousAttemptsCount = await QuizAttempt.countDocuments({ userId, quizId: parentQuizId || undefined });
    const attempt = await QuizAttempt.create({
      userId,
      quizId: parentQuizId,
      mode,
      topic,
      difficulty,
      answers: evaluatedAnswers,
      score: percentage,
      percentage,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      topicBreakdown,
      attemptNumber: previousAttemptsCount + 1,
      timeTaken
    });

    // 7. Update UserProgress (Streak, Badges, Activity) WITHOUT altering behavioral assessment dimensions
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
    if (percentage === 100 && !badgesEarned.includes('Scam Spotter')) {
      badgesEarned.push('Scam Spotter');
    }

    const highAttempts = await QuizAttempt.find({ userId, percentage: { $gte: 75 } });
    const distinctQuizzes = new Set(highAttempts.map(a => (a.quizId || a.topic).toString()));
    if (percentage >= 75) {
      distinctQuizzes.add((parentQuizId || topic).toString());
    }
    if (distinctQuizzes.size >= 3 && !badgesEarned.includes('Cyber Law Learner')) {
      badgesEarned.push('Cyber Law Learner');
    }

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

    // Identify missed questions and add to quizRecallItems for spaced retrieval
    const missedQuestionIds = evaluatedAnswers
      .filter(a => a.isCorrect === false)
      .map(a => a.questionId);

    const progressDoc = await UserProgress.findOne({ userId });
    if (progressDoc) {
      if (!Array.isArray(progressDoc.quizRecallItems)) {
        progressDoc.quizRecallItems = [];
      }

      for (const qId of missedQuestionIds) {
        const qObj = questionMap.get(qId.toString());
        const existingIdx = progressDoc.quizRecallItems.findIndex(
          item => item.questionId.toString() === qId.toString()
        );

        if (existingIdx !== -1) {
          progressDoc.quizRecallItems[existingIdx].missedCount = (progressDoc.quizRecallItems[existingIdx].missedCount || 1) + 1;
          progressDoc.quizRecallItems[existingIdx].mastered = false;
          progressDoc.quizRecallItems[existingIdx].lastAttemptedAt = new Date();
          progressDoc.quizRecallItems[existingIdx].nextReviewDue = new Date();
        } else {
          progressDoc.quizRecallItems.push({
            questionId: qId,
            sourceAttemptId: attempt._id,
            category: qObj?.category || 'General',
            missedCount: 1,
            mastered: false,
            lastAttemptedAt: new Date(),
            nextReviewDue: new Date()
          });
        }
      }

      progressDoc.quizAttempts = progressDoc.quizAttempts || [];
      if (!progressDoc.quizAttempts.includes(attempt._id)) {
        progressDoc.quizAttempts.push(attempt._id);
      }
      progressDoc.badgesEarned = badgesEarned;
      progressDoc.currentStreak = currentStreak;
      progressDoc.lastActivity = new Date();
      await progressDoc.save();
    }

    res.json({
      success: true,
      attemptId: attempt._id,
      score: percentage,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions,
      badgesEarned,
      topicBreakdown,
      recommendedLearning,
      explanations
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      error: { code: 'QUIZ_SUBMIT_ERROR', message: error.message }
    });
  }
};

// ---------------------------------------------------------------------------
// 7. GET LEARNER QUIZ HISTORY & PERFORMANCE METRICS
// ---------------------------------------------------------------------------
exports.getQuizHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const attempts = await QuizAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .limit(20)
      .populate('quizId', 'title category difficulty');

    const totalAttempts = await QuizAttempt.countDocuments({ userId });
    const highScores = await QuizAttempt.countDocuments({ userId, percentage: { $gte: 80 } });

    // Calculate aggregated metrics
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;
    let totalQuestionsIncorrect = 0;
    const topicStatsMap = {};

    attempts.forEach(a => {
      totalQuestionsAttempted += (a.totalQuestions || 0);
      totalQuestionsCorrect += (a.correctCount || 0);
      totalQuestionsIncorrect += (a.incorrectCount || 0);

      const topicName = a.quizId?.category || a.topic || 'General';
      if (!topicStatsMap[topicName]) {
        topicStatsMap[topicName] = {
          topic: topicName,
          attempts: 0,
          totalQuestions: 0,
          correctQuestions: 0,
          accuracy: 0
        };
      }
      topicStatsMap[topicName].attempts += 1;
      topicStatsMap[topicName].totalQuestions += (a.totalQuestions || 0);
      topicStatsMap[topicName].correctQuestions += (a.correctCount || 0);
    });

    const topicStats = Object.values(topicStatsMap).map(ts => {
      const accuracy = ts.totalQuestions > 0 ? Math.round((ts.correctQuestions / ts.totalQuestions) * 100) : 0;
      return { ...ts, accuracy };
    });

    // Sort to identify frequently missed topics (accuracy < 70%, sorted lowest first)
    const frequentlyMissedTopics = topicStats
      .filter(ts => ts.accuracy < 70 && ts.totalQuestions >= 3)
      .sort((a, b) => a.accuracy - b.accuracy);

    // Check count of due unmastered quiz recall items
    const progress = await UserProgress.findOne({ userId });
    const now = new Date();
    const dueRecallCount = (progress?.quizRecallItems || []).filter(
      item => !item.mastered && (!item.nextReviewDue || new Date(item.nextReviewDue) <= now)
    ).length;

    const overallAccuracyPercent = totalQuestionsAttempted > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100)
      : 0;

    res.json({
      success: true,
      totalAttempts,
      highScores,
      totalQuestionsAttempted,
      totalQuestionsCorrect,
      totalQuestionsIncorrect,
      overallAccuracyPercent,
      topicStats,
      frequentlyMissedTopics,
      dueRecallCount,
      recentAttempts: attempts.map(a => ({
        id: a._id,
        quizTitle: a.quizId?.title || a.topic || 'Dynamic Quiz',
        category: a.quizId?.category || a.topic || 'General',
        mode: a.mode,
        score: a.score,
        percentage: a.percentage,
        correctCount: a.correctCount,
        incorrectCount: a.incorrectCount,
        unansweredCount: a.unansweredCount,
        totalQuestions: a.totalQuestions,
        completedAt: a.completedAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUIZ_HISTORY_ERROR', message: error.message }
    });
  }
};

// ---------------------------------------------------------------------------
// 8. GET DUE QUIZ RECALL ITEMS (Spaced Retrieval for Missed Questions)
// ---------------------------------------------------------------------------
exports.getDueQuizRecallItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const progress = await UserProgress.findOne({ userId }).populate('quizRecallItems.questionId');
    if (!progress || !Array.isArray(progress.quizRecallItems)) {
      return res.json({ success: true, dueItems: [], totalDue: 0 });
    }

    const now = new Date();
    const unmastered = progress.quizRecallItems.filter(item =>
      !item.mastered &&
      item.questionId &&
      item.questionId.published !== false &&
      (!item.nextReviewDue || new Date(item.nextReviewDue) <= now)
    );

    // Sanitize questions to enforce strict answer secrecy before evaluation
    const sanitizedList = unmastered.map(item => {
      const sanitizedQ = sanitizeQuestionForClient(item.questionId);
      return {
        recallItemId: item._id,
        questionId: item.questionId._id,
        category: item.category || item.questionId.category,
        missedCount: item.missedCount,
        lastAttemptedAt: item.lastAttemptedAt,
        question: sanitizedQ
      };
    });

    res.json({
      success: true,
      dueItems: sanitizedList,
      totalDue: sanitizedList.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DUE_RECALL_ERROR', message: error.message }
    });
  }
};

// ---------------------------------------------------------------------------
// 9. SUBMIT QUIZ RECALL EVALUATION (Authoritative Graded Spaced Review)
// ---------------------------------------------------------------------------
exports.submitQuizRecall = async (req, res) => {
  try {
    const userId = req.user._id;
    const { questionId, answer } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'questionId is required.' }
      });
    }

    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found.' }
      });
    }

    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROGRESS_NOT_FOUND', message: 'User progress not found.' }
      });
    }

    const format = question.format || 'single_choice';
    let isCorrect = false;

    if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
      const selected = typeof answer === 'object' ? answer?.selectedOptionIndex : answer;
      isCorrect = (selected === question.correctOptionIndex);
    } else if (format === 'multiple_choice') {
      const selected = Array.isArray(answer?.selectedOptionIndices) ? answer.selectedOptionIndices : [];
      const correct = question.correctOptionIndices || [];
      isCorrect = (selected.length === correct.length && selected.every(idx => correct.includes(idx)));
    } else if (format === 'matching') {
      const submittedPairs = Array.isArray(answer?.selectedPairs) ? answer.selectedPairs : [];
      const authMap = new Map((question.matchingPairs || []).map(p => [p.left, p.right]));
      let matchCount = 0;
      submittedPairs.forEach(p => {
        if (authMap.get(p.left) === p.right) matchCount++;
      });
      isCorrect = (matchCount === (question.matchingPairs?.length || 0));
    } else if (format === 'ordering') {
      const submittedSeq = Array.isArray(answer?.selectedSequence) ? answer.selectedSequence : [];
      const authSeq = question.sequenceItems || [];
      isCorrect = (submittedSeq.length === authSeq.length && submittedSeq.every((item, i) => item === authSeq[i]));
    } else if (format === 'indicator_identification') {
      const selectedIds = Array.isArray(answer?.selectedIndicatorIds) ? answer.selectedIndicatorIds : [];
      const trueSuspicious = (question.indicators || []).filter(ind => ind.isSuspicious).map(ind => ind.id);
      isCorrect = (selectedIds.length === trueSuspicious.length && selectedIds.every(id => trueSuspicious.includes(id)));
    }

    // Update progress item
    const itemIdx = (progress.quizRecallItems || []).findIndex(
      it => it.questionId.toString() === questionId.toString()
    );

    if (itemIdx !== -1) {
      const it = progress.quizRecallItems[itemIdx];
      if (isCorrect) {
        it.mastered = true;
      } else {
        it.missedCount = (it.missedCount || 1) + 1;
        it.mastered = false;
        // Schedule next recall 3 days from now
        it.nextReviewDue = new Date(Date.now() + 3 * 86400000);
      }
      it.reviewHistory.push({
        reviewedAt: new Date(),
        selectedOptionIndex: typeof answer === 'object' ? answer?.selectedOptionIndex : answer,
        isCorrect
      });
      await progress.save();
    }

    res.json({
      success: true,
      isCorrect,
      mastered: isCorrect,
      explanation: question.explanation,
      whyIncorrect: isCorrect ? null : (question.whyIncorrect || 'This choice does not align with the established statutory rule.'),
      practicalTakeaway: question.practicalTakeaway || 'Always verify digital communications through trusted independent channels.',
      legalReferences: question.legalReferences || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SUBMIT_RECALL_ERROR', message: error.message }
    });
  }
};
