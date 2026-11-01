const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Strips all answer keys, solution orders, and explanations from questions before sending to client.
 */
function sanitizeQuestionForClient(q) {
  const format = q.format || 'single_choice';
  const base = {
    id: q._id,
    questionId: q.questionId,
    format,
    questionText: q.questionText,
    category: q.category,
    subtopic: q.subtopic || '',
    difficulty: q.difficulty,
    cognitiveLevel: q.cognitiveLevel,
    questionType: q.questionType,
    relatedLawSection: q.relatedLawSection || q.relatedLaw || ''
  };

  if (['single_choice', 'multiple_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
    base.options = q.options || [];
  } else if (format === 'matching') {
    // Expose left and right items separately with right items scrambled
    const pairs = q.matchingPairs || [];
    base.leftItems = pairs.map(p => p.left);
    base.rightItems = shuffle(pairs.map(p => p.right));
  } else if (format === 'ordering') {
    // Scramble the sequence items so the client cannot read the correct order
    base.sequenceItems = shuffle(q.sequenceItems || []);
  } else if (format === 'indicator_identification') {
    base.textToInspect = q.textToInspect || '';
    // Strip isSuspicious and explanation
    base.indicators = (q.indicators || []).map(ind => ({
      id: ind.id,
      text: ind.text
    }));
  }

  return base;
}

/**
 * Standard 5-Bucket Selection for specific Quiz ID (backward compatible)
 */
async function selectQuestions(userId, quizId, category, desiredCount = 10) {
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

  const allQuestions = await QuizQuestion.find({ quizId, published: true });
  if (allQuestions.length === 0) {
    return [];
  }

  const BUCKET_DEFINITIONS = [
    { name: 'Foundations', targetCount: 2, cognitiveLevels: ['Level 1', 'Level 2'], types: ['knowledge', 'distinction'], preferredDifficulties: ['Beginner'] },
    { name: 'Conceptual & Myth-Busting', targetCount: 2, cognitiveLevels: ['Level 2'], types: ['distinction', 'myth-fact', 'recognition'], preferredDifficulties: ['Intermediate', 'Beginner'] },
    { name: 'Applied Defense & Recognition', targetCount: 2, cognitiveLevels: ['Level 3'], types: ['prevention', 'recognition'], preferredDifficulties: ['Intermediate', 'Beginner'] },
    { name: 'Complex Scenario Reasoning', targetCount: 2, cognitiveLevels: ['Level 4'], types: ['scenario'], preferredDifficulties: ['Intermediate', 'Advanced'] },
    { name: 'Legal & Behavioral Judgment', targetCount: 2, cognitiveLevels: ['Level 5', 'Level 6'], types: ['legal-context', 'situational-judgment'], preferredDifficulties: ['Advanced', 'Intermediate'] }
  ];

  const selected = [];
  const selectedIds = new Set();

  function matchesBucket(q, bucket) {
    const cog = q.cognitiveLevel || 'Level 1';
    return bucket.cognitiveLevels.includes(cog) && bucket.types.includes(q.questionType);
  }

  function pickFromCandidates(candidates, countNeeded, preferDifficulty) {
    const scored = candidates.map(q => {
      let score = 0;
      if (!recentlySeenIds.has(q._id.toString())) score += 50;
      if (preferDifficulty && preferDifficulty.includes(q.difficulty)) score += 30;
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
      }
    }
    return picked;
  }

  for (const bucket of BUCKET_DEFINITIONS) {
    const exactMatches = allQuestions.filter(q => !selectedIds.has(q._id.toString()) && matchesBucket(q, bucket));
    const picked = pickFromCandidates(exactMatches, bucket.targetCount, bucket.preferredDifficulties);
    selected.push(...picked);
  }

  if (selected.length < desiredCount) {
    const remaining = allQuestions.filter(q => !selectedIds.has(q._id.toString()));
    const needed = desiredCount - selected.length;
    const filler = pickFromCandidates(remaining, needed, ['Intermediate', 'Beginner', 'Advanced']);
    selected.push(...filler);
  }

  return shuffle(selected);
}

/**
 * Mode-Aware Dynamic Question Selection Service
 * Selects questions for the 5 distinct quiz modes.
 */
async function selectQuestionsForMode(userId, { mode = 'topic_wise', category, topic, difficulty = 'All', questionCount }) {
  const targetCategory = category || topic;

  // 1. Fetch recently answered question IDs
  let recentlySeenIds = new Set();
  if (userId) {
    const recentAttempts = await QuizAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    recentAttempts.forEach(attempt => {
      if (attempt.answers && Array.isArray(attempt.answers)) {
        attempt.answers.forEach(ans => {
          if (ans && ans.questionId) {
            recentlySeenIds.add(ans.questionId.toString());
          }
        });
      }
    });
  }

  // 2. Build base query
  const query = { published: true };

  // Category aliasing / mapping
  if (targetCategory && targetCategory !== 'All') {
    if (targetCategory === 'Indian Cyber Law and IT Act') {
      query.category = { $in: ['Indian Cyber Law and IT Act', 'Cyber Law Basics'] };
    } else if (targetCategory === 'Phishing and social engineering') {
      query.category = { $in: ['Phishing', 'Social Engineering'] };
    } else if (targetCategory === 'UPI, banking and financial fraud') {
      query.category = { $in: ['UPI, banking and financial fraud', 'Financial Safety'] };
    } else if (targetCategory === 'Identity theft and account security') {
      query.category = { $in: ['Identity theft and account security', 'Account Security'] };
    } else {
      query.category = targetCategory;
    }
  }

  if (difficulty && difficulty !== 'All') {
    query.difficulty = difficulty;
  }

  // Mode-specific query tailoring and defaults
  let targetCount = questionCount || 10;

  if (mode === 'quick_practice') {
    targetCount = questionCount || 5;
    // Prefer Beginner and Intermediate
    if (!difficulty || difficulty === 'All') {
      query.difficulty = { $in: ['Beginner', 'Intermediate'] };
    }
  } else if (mode === 'topic_wise') {
    targetCount = questionCount || 10;
  } else if (mode === 'scenario') {
    targetCount = questionCount || 8;
    query.$or = [
      { format: { $in: ['scenario_decision', 'indicator_identification'] } },
      { questionType: { $in: ['scenario', 'recognition', 'situational-judgment'] } }
    ];
  } else if (mode === 'challenge') {
    targetCount = questionCount || 15;
    // Higher difficulty
    if (!difficulty || difficulty === 'All') {
      query.difficulty = { $in: ['Intermediate', 'Advanced'] };
    }
  } else if (mode === 'case_based') {
    targetCount = questionCount || 8;
    query.$or = [
      { format: { $in: ['legal_application', 'matching'] } },
      { questionType: { $in: ['legal-context', 'distinction'] } },
      { 'legalReferences.0': { $exists: true } }
    ];
  }

  let candidates = await QuizQuestion.find(query);

  // If strict filtering returned fewer candidates than target, relax difficulty or format constraint
  if (candidates.length < targetCount) {
    const relaxedQuery = { published: true };
    if (targetCategory && targetCategory !== 'All') {
      relaxedQuery.category = query.category;
    }
    candidates = await QuizQuestion.find(relaxedQuery);
  }

  if (candidates.length === 0) {
    // Ultimate fallback: any published questions
    candidates = await QuizQuestion.find({ published: true });
  }

  // Score candidates to balance recent-history avoidance and topic diversity
  const scored = candidates.map(q => {
    let score = 0;
    if (!recentlySeenIds.has(q._id.toString())) score += 50;
    if (difficulty && difficulty !== 'All' && q.difficulty === difficulty) score += 30;
    // Diversity jitter
    score += Math.random() * 20;
    return { q, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = [];
  const selectedIds = new Set();
  const selectedCategories = new Set();

  for (const item of scored) {
    if (selected.length >= targetCount) break;
    if (!selectedIds.has(item.q._id.toString())) {
      // For quick practice and challenge without topic filter, prefer category variety
      if ((mode === 'quick_practice' || mode === 'challenge') && (!targetCategory || targetCategory === 'All')) {
        if (!selectedCategories.has(item.q.category) || selected.length >= candidates.length / 2) {
          selected.push(item.q);
          selectedIds.add(item.q._id.toString());
          selectedCategories.add(item.q.category);
          continue;
        }
      }
      selected.push(item.q);
      selectedIds.add(item.q._id.toString());
    }
  }

  return shuffle(selected);
}

module.exports = {
  selectQuestions,
  selectQuestionsForMode,
  sanitizeQuestionForClient,
  shuffle
};
