const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Service to select dynamically balanced, non-repetitive questions for a quiz attempt.
 * @param {string} userId - User ID taking the quiz
 * @param {string} quizId - Target Quiz ID
 * @param {string} category - Quiz category/topic
 * @param {number} desiredCount - Number of questions to select (default: 10)
 */
async function selectQuestions(userId, quizId, category, desiredCount = 10) {
  // 1. Fetch recently answered question IDs to avoid immediate repetition
  const recentAttempts = await QuizAttempt.find({ userId, quizId })
    .sort({ createdAt: -1 })
    .limit(2);
  
  const recentlySeenIds = new Set();
  recentAttempts.forEach(attempt => {
    if (attempt.answers && Array.isArray(attempt.answers)) {
      attempt.answers.forEach(ans => {
        if (ans && ans.questionId) {
          recentlySeenIds.add(ans.questionId.toString());
        }
      });
    }
  });

  // 2. Fetch all published questions in the category
  const allQuestions = await QuizQuestion.find({ quizId, published: true });
  if (allQuestions.length === 0) {
    return [];
  }

  // 3. Filter out recently seen questions
  let eligiblePool = allQuestions.filter(q => !recentlySeenIds.has(q._id.toString()));

  // Fallback: If pool is too small because the user has seen everything, relax the filter
  if (eligiblePool.length < Math.min(desiredCount, allQuestions.length)) {
    eligiblePool = allQuestions;
  }

  // 4. Implement balanced type composition (e.g. 2 knowledge, 2 scenario, 2 recognition, 2 prevention, 1 legal-context, 1 distinction)
  const targetTypes = [
    { type: 'knowledge', count: 2 },
    { type: 'scenario', count: 2 },
    { type: 'recognition', count: 2 },
    { type: 'prevention', count: 2 },
    { type: 'legal-context', count: 1 },
    { type: 'distinction', count: 1 }
  ];

  const selected = [];
  const selectedIds = new Set();

  // Helper to shuffle arrays in-place
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Group eligible pool by questionType
  const grouped = {};
  eligiblePool.forEach(q => {
    if (!grouped[q.questionType]) {
      grouped[q.questionType] = [];
    }
    grouped[q.questionType].push(q);
  });

  // Shuffle each group
  Object.keys(grouped).forEach(type => {
    shuffle(grouped[type]);
  });

  // Attempt to fill target type counts
  targetTypes.forEach(target => {
    const typePool = grouped[target.type] || [];
    let addedCount = 0;
    for (let q of typePool) {
      if (addedCount < target.count && !selectedIds.has(q._id.toString())) {
        selected.push(q);
        selectedIds.add(q._id.toString());
        addedCount++;
      }
    }
  });

  // 5. Fallback filler: If we still need questions, pull from remainder of the eligible pool
  if (selected.length < desiredCount) {
    const shuffledEligible = shuffle([...eligiblePool]);
    for (let q of shuffledEligible) {
      if (selected.length < desiredCount && !selectedIds.has(q._id.toString())) {
        selected.push(q);
        selectedIds.add(q._id.toString());
      }
    }
  }

  // 6. Return shuffled final selection so they don't always render in type blocks
  return shuffle(selected);
}

module.exports = { selectQuestions };
