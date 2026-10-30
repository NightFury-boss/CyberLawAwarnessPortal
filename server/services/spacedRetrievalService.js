/**
 * spacedRetrievalService.js
 * Domain service for Spaced Retrieval & Follow-Up Learning
 * 
 * Strict Architectural & Pedagogical Principles:
 * 1. Delayed statutory recall != Observed behavioral reflex under live attack pressure.
 * 2. Delay threshold is configurable via SPACED_RETRIEVAL_DELAY_DAYS (default 7 days).
 * 3. Incomplete pathways are strictly ineligible.
 * 4. Completed reviews reset the delay window to prevent repeated prompts for the same cycle.
 * 5. Zero answer leakage: retrieval questions are served with correctOptionIndex and explanations stripped.
 * 6. Authoritative server-side grading; client scores and pass flags are disregarded.
 */

const catalog = require('../config/remediationCatalog');

/**
 * Get configured spaced retrieval delay in days (default: 7)
 */
function getSpacedRetrievalDelayDays() {
  const envVal = parseInt(process.env.SPACED_RETRIEVAL_DELAY_DAYS, 10);
  return (!isNaN(envVal) && envVal >= 0) ? envVal : 7;
}

/**
 * Check if a completed pathway record is currently due for a spaced retrieval review
 * 
 * @param {Object} completedPathwayRecord - Record from UserProgress.completedPathways
 * @param {Array} spacedReviews - Array of UserProgress.spacedReviews
 * @param {number|null} customDelayDays - Optional override for testing
 * @returns {boolean}
 */
function isPathwayEligibleForSpacedRetrieval(completedPathwayRecord, spacedReviews = [], customDelayDays = null) {
  // Incomplete pathways or records without completedAt are strictly ineligible
  if (!completedPathwayRecord || !completedPathwayRecord.completedAt) {
    return false;
  }

  const completedTime = new Date(completedPathwayRecord.completedAt).getTime();
  if (isNaN(completedTime)) {
    return false;
  }

  const delayDays = (customDelayDays !== null && customDelayDays !== undefined)
    ? customDelayDays
    : getSpacedRetrievalDelayDays();
  const delayMs = delayDays * 24 * 60 * 60 * 1000;

  const pathwayId = completedPathwayRecord.pathwayId;
  const sourceSessionId = String(completedPathwayRecord.sourceSessionId?._id || completedPathwayRecord.sourceSessionId);

  // Find reviews previously completed for this pathway
  const relevantReviews = (spacedReviews || []).filter(r => {
    const rSessionId = String(r.sourceSessionId?._id || r.sourceSessionId);
    return r.pathwayId === pathwayId && (!r.sourceSessionId || rSessionId === sourceSessionId);
  });

  if (relevantReviews.length === 0) {
    // No review completed yet: due if time since pathway completion >= delayMs
    return (Date.now() - completedTime) >= delayMs;
  }

  // Sort reviews descending by completion time
  const sortedReviews = [...relevantReviews].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const latestReviewTime = new Date(sortedReviews[0].completedAt).getTime();

  if (isNaN(latestReviewTime)) {
    return (Date.now() - completedTime) >= delayMs;
  }

  // Due if time since the latest review >= delayMs
  return (Date.now() - latestReviewTime) >= delayMs;
}

/**
 * Identify all due spaced reviews for a user's progress
 * 
 * @param {Object} progress - UserProgress document
 * @param {number|null} customDelayDays - Optional override for testing
 * @returns {Array} List of due review summaries
 */
function getDueSpacedReviews(progress, customDelayDays = null) {
  if (!progress || !Array.isArray(progress.completedPathways)) {
    return [];
  }

  const delayDays = (customDelayDays !== null && customDelayDays !== undefined)
    ? customDelayDays
    : getSpacedRetrievalDelayDays();

  const dueList = [];
  const spacedReviews = progress.spacedReviews || [];

  for (const record of progress.completedPathways) {
    if (isPathwayEligibleForSpacedRetrieval(record, spacedReviews, delayDays)) {
      const pathwayDef = catalog.find(p => p.pathwayId === record.pathwayId);
      if (!pathwayDef || !pathwayDef.checkpoint) {
        continue;
      }

      const completedTime = new Date(record.completedAt).getTime();
      const daysSinceCompletion = Math.max(0, Math.floor((Date.now() - completedTime) / (24 * 60 * 60 * 1000)));

      // Count prior completed reviews for this pathway to determine cycle number
      const priorReviewsCount = spacedReviews.filter(r => r.pathwayId === record.pathwayId).length;

      dueList.push({
        pathwayId: record.pathwayId,
        sourceSessionId: record.sourceSessionId,
        habitTitle: pathwayDef.habitTitle,
        coreRule: pathwayDef.coreRule,
        pedagogicalFocus: pathwayDef.pedagogicalFocus,
        estimatedMinutes: pathwayDef.estimatedMinutes || 2,
        statutoryReference: pathwayDef.legalReferences?.[0] ? {
          law: pathwayDef.legalReferences[0].act,
          section: pathwayDef.legalReferences[0].section,
          status: pathwayDef.legalReferences[0].status
        } : null,
        passingScore: pathwayDef.checkpoint.passingScore || 67,
        totalQuestions: pathwayDef.checkpoint.questions?.length || 0,
        originalCompletedAt: record.completedAt,
        daysSinceCompletion,
        cycleNumber: priorReviewsCount + 1,
        delayDaysConfigured: delayDays
      });
    }
  }

  return dueList;
}

/**
 * Retrieve sanitized questions for spaced retrieval (stripping answers and explanations)
 * 
 * @param {string} pathwayId 
 * @returns {Object} Sanitized questions payload
 */
function getSanitizedRetrievalQuestions(pathwayId) {
  const pathway = catalog.find(p => p.pathwayId === pathwayId);
  if (!pathway) {
    const error = new Error(`Pathway '${pathwayId}' not found in remediation catalog.`);
    error.status = 404;
    error.code = 'PATHWAY_NOT_FOUND';
    throw error;
  }

  if (!pathway.checkpoint || !Array.isArray(pathway.checkpoint.questions) || pathway.checkpoint.questions.length === 0) {
    const error = new Error(`No retrieval questions configured for pathway '${pathwayId}'.`);
    error.status = 404;
    error.code = 'RETRIEVAL_QUESTIONS_NOT_FOUND';
    throw error;
  }

  const sanitizedQuestions = pathway.checkpoint.questions.map(q => ({
    questionId: q.questionId,
    questionText: q.questionText,
    options: q.options
  }));

  return {
    pathwayId: pathway.pathwayId,
    habitTitle: pathway.habitTitle,
    coreRule: pathway.coreRule,
    pedagogicalFocus: pathway.pedagogicalFocus,
    passingScore: pathway.checkpoint.passingScore || 67,
    totalQuestions: sanitizedQuestions.length,
    questions: sanitizedQuestions
  };
}

/**
 * Authoritatively evaluate a spaced retrieval submission
 * 
 * @param {string} pathwayId 
 * @param {Array} answers - [{ questionId, selectedOptionIndex }]
 * @returns {Object} Evaluation outcome
 */
function evaluateSpacedRetrievalSubmission(pathwayId, answers) {
  const pathway = catalog.find(p => p.pathwayId === pathwayId);
  if (!pathway) {
    const error = new Error(`Pathway '${pathwayId}' not found in remediation catalog.`);
    error.status = 404;
    error.code = 'PATHWAY_NOT_FOUND';
    throw error;
  }

  if (!pathway.checkpoint || !Array.isArray(pathway.checkpoint.questions)) {
    const error = new Error(`No retrieval checkpoint configured for pathway '${pathwayId}'.`);
    error.status = 404;
    error.code = 'RETRIEVAL_QUESTIONS_NOT_FOUND';
    throw error;
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    const error = new Error('Answers array is required.');
    error.status = 400;
    error.code = 'INVALID_ANSWERS';
    throw error;
  }

  const checkpointDef = pathway.checkpoint;
  const totalQuestions = checkpointDef.questions.length;
  let correctCount = 0;
  const reviewAnswers = [];
  const explanations = [];

  for (const q of checkpointDef.questions) {
    const userAns = answers.find(a => a.questionId === q.questionId);
    if (!userAns || typeof userAns.selectedOptionIndex !== 'number') {
      const error = new Error(`Missing answer for question ${q.questionId}.`);
      error.status = 400;
      error.code = 'INCOMPLETE_ANSWERS';
      throw error;
    }

    if (userAns.selectedOptionIndex < 0 || userAns.selectedOptionIndex >= q.options.length) {
      const error = new Error(`Invalid option index selected for question ${q.questionId}.`);
      error.status = 400;
      error.code = 'INVALID_OPTION_INDEX';
      throw error;
    }

    const isCorrect = userAns.selectedOptionIndex === q.correctOptionIndex;
    if (isCorrect) {
      correctCount++;
    }

    reviewAnswers.push({
      questionId: q.questionId,
      selectedOptionIndex: userAns.selectedOptionIndex,
      isCorrect
    });

    explanations.push({
      questionId: q.questionId,
      questionText: q.questionText,
      selectedOptionIndex: userAns.selectedOptionIndex,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
      explanation: q.explanation
    });
  }

  const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
  const passingScore = checkpointDef.passingScore || 67;
  const passed = calculatedScore >= passingScore;

  return {
    pathwayId,
    habitTitle: pathway.habitTitle,
    coreRule: pathway.coreRule,
    calculatedScore,
    passingScore,
    passed,
    correctCount,
    totalQuestions,
    reviewAnswers,
    explanations
  };
}

module.exports = {
  getSpacedRetrievalDelayDays,
  isPathwayEligibleForSpacedRetrieval,
  getDueSpacedReviews,
  getSanitizedRetrievalQuestions,
  evaluateSpacedRetrievalSubmission
};
