const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Multi-Factor 5-Bucket Quiz Question Selection Service
 * Selects 10 questions balancing cognitiveLevel, questionType, difficulty, topic diversity,
 * and recent-question history avoidance.
 * 
 * @param {string} userId - User ID taking the quiz
 * @param {string} quizId - Target Quiz ID
 * @param {string} category - Quiz category
 * @param {number} desiredCount - Number of questions to select (default: 10)
 * @returns {Promise<Array>} Selected QuizQuestion documents
 */
async function selectQuestions(userId, quizId, category, desiredCount = 10) {
  // 1. Fetch recently answered question IDs to avoid repetition
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

  // 2. Fetch all published questions in the category/quiz
  const allQuestions = await QuizQuestion.find({ quizId, published: true });
  if (allQuestions.length === 0) {
    return [];
  }

  // 3. Define 5 Target Selection Buckets
  const BUCKET_DEFINITIONS = [
    {
      name: 'Foundations',
      targetCount: 2,
      cognitiveLevels: ['Level 1', 'Level 2'],
      types: ['knowledge', 'distinction'],
      preferredDifficulties: ['Beginner']
    },
    {
      name: 'Conceptual & Myth-Busting',
      targetCount: 2,
      cognitiveLevels: ['Level 2'],
      types: ['distinction', 'myth-fact', 'recognition'],
      preferredDifficulties: ['Intermediate', 'Beginner']
    },
    {
      name: 'Applied Defense & Recognition',
      targetCount: 2,
      cognitiveLevels: ['Level 3'],
      types: ['prevention', 'recognition'],
      preferredDifficulties: ['Intermediate', 'Beginner']
    },
    {
      name: 'Complex Scenario Reasoning',
      targetCount: 2,
      cognitiveLevels: ['Level 4'],
      types: ['scenario'],
      preferredDifficulties: ['Intermediate', 'Advanced']
    },
    {
      name: 'Legal & Behavioral Judgment',
      targetCount: 2,
      cognitiveLevels: ['Level 5', 'Level 6'],
      types: ['legal-context', 'situational-judgment'],
      preferredDifficulties: ['Advanced', 'Intermediate']
    }
  ];

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const selected = [];
  const selectedIds = new Set();
  const selectedTopics = new Set();

  function matchesBucket(q, bucket) {
    const cog = q.cognitiveLevel || (q.learningObjective && q.learningObjective.match(/Level \d/)?.[0]) || 'Level 1';
    const cogMatch = bucket.cognitiveLevels.includes(cog);
    const typeMatch = bucket.types.includes(q.questionType);
    return cogMatch && typeMatch;
  }

  // Helper to pick best candidates from a list respecting topic diversity & recent history
  function pickFromCandidates(candidates, countNeeded, preferDifficulty) {
    // Sort candidates:
    // 1. Not recently seen > recently seen
    // 2. Matches preferred difficulty > other difficulty
    // 3. New topicTag > already seen topicTag
    const scored = candidates.map(q => {
      let score = 0;
      const isRecent = recentlySeenIds.has(q._id.toString());
      if (!isRecent) score += 50;

      if (preferDifficulty && preferDifficulty.length > 0) {
        const prefIdx = preferDifficulty.indexOf(q.difficulty);
        if (prefIdx === 0) {
          score += 30; // Primary preferred difficulty
        } else if (prefIdx > 0) {
          score += 15; // Secondary preferred difficulty
        }
      }

      const topic = q.topicTag || q.relatedCrime || q.relatedModule || '';
      if (topic && !selectedTopics.has(topic)) {
        score += 15;
      }

      // Random jitter for fair rotation among equally scored
      score += Math.random() * 5;
      return { q, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const picked = [];
    for (const item of scored) {
      if (picked.length >= countNeeded) break;
      if (!selectedIds.has(item.q._id.toString())) {
        picked.push(item.q);
        selectedIds.add(item.q._id.toString());
        const topic = item.q.topicTag || item.q.relatedCrime || item.q.relatedModule || '';
        if (topic) selectedTopics.add(topic);
      }
    }
    return picked;
  }

  // Step A: Fill each of the 5 buckets
  for (const bucket of BUCKET_DEFINITIONS) {
    // Exact bucket matches
    const exactMatches = allQuestions.filter(q => !selectedIds.has(q._id.toString()) && matchesBucket(q, bucket));
    const picked = pickFromCandidates(exactMatches, bucket.targetCount, bucket.preferredDifficulties);
    selected.push(...picked);

    // Fallback within bucket if fewer than targetCount were available
    const needed = bucket.targetCount - picked.length;
    if (needed > 0) {
      // Relax questionType, match cognitiveLevel only
      const relaxed = allQuestions.filter(q => {
        if (selectedIds.has(q._id.toString())) return false;
        const cog = q.cognitiveLevel || (q.learningObjective && q.learningObjective.match(/Level \d/)?.[0]) || 'Level 1';
        return bucket.cognitiveLevels.includes(cog);
      });
      const fallbackPicked = pickFromCandidates(relaxed, needed, bucket.preferredDifficulties);
      selected.push(...fallbackPicked);
    }
  }

  // Step B: If total is still under desiredCount, fill from remaining questions with diversity
  if (selected.length < desiredCount) {
    const remaining = allQuestions.filter(q => !selectedIds.has(q._id.toString()));
    const needed = desiredCount - selected.length;
    const filler = pickFromCandidates(remaining, needed, ['Intermediate', 'Beginner', 'Advanced']);
    selected.push(...filler);
  }

  // Step C: Shuffle final selection so buckets aren't strictly contiguous in question presentation
  return shuffle(selected);
}

module.exports = {
  selectQuestions
};
