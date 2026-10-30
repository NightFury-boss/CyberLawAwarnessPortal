/**
 * evidenceSelectors.js
 * 
 * Production selector and calibration helpers for learning evidence and orientation summary.
 * 
 * Rules:
 * - Server summary is authoritative ONLY when count fields are valid, non-negative integers and internally consistent.
 * - Missing or invalid summary falls back cleanly to record-level derivation.
 * - Never concatenate progress and portfolio arrays to prevent double counting.
 * - Exclude malformed, incomplete, or corrupt review records.
 * - Deduplicate records within the source using stable domain identity (record ID or pathway + session + cycle).
 * - The passed count CANNOT exceed the completed review count under any circumstance.
 * - No composite score calculation, no gamification, no mastery claims.
 */

/**
 * Validates whether an individual spaced review record meets data completeness requirements.
 * 
 * @param {any} sr - candidate review record
 * @returns {boolean} true if valid and complete
 */
export function isValidReviewRecord(sr) {
  if (!sr || typeof sr !== 'object') return false;
  if (typeof sr.pathwayId !== 'string' || !sr.pathwayId.trim()) return false;
  if (!sr.completedAt) return false;

  const compTime = new Date(sr.completedAt).getTime();
  if (Number.isNaN(compTime)) return false;

  if (typeof sr.checkpointScore !== 'number' || Number.isNaN(sr.checkpointScore)) return false;
  if (sr.checkpointScore < 0 || sr.checkpointScore > 100) return false;

  return true;
}

/**
 * Returns a stable, domain-appropriate identity key for a review record.
 * Uses _id / id if present, otherwise uses pathwayId + sourceSessionId + cycleNumber.
 * 
 * @param {object} sr 
 * @returns {string} identity key
 */
export function getReviewIdentityKey(sr) {
  if (sr._id) return `id::${String(sr._id)}`;
  if (sr.id) return `id::${String(sr.id)}`;
  const sId = sr.sourceSessionId?._id ? String(sr.sourceSessionId._id) : (sr.sourceSessionId ? String(sr.sourceSessionId) : 'session-default');
  const cycle = (sr.cycleNumber !== undefined && sr.cycleNumber !== null) ? String(sr.cycleNumber) : '1';
  return `domain::${sr.pathwayId}::${sId}::${cycle}`;
}

/**
 * Selects authoritative completed and passed delayed-recall counts for dashboard display.
 * 
 * @param {object} params
 * @param {object} [params.portfolioData] - Response from /api/progress/portfolio
 * @param {object} [params.progress] - Response from /api/progress
 * @returns {{ completedRecallCount: number, passedRecallCount: number, source: string }}
 */
export function selectAuthoritativeRecallCounts({ portfolioData, progress } = {}) {
  const summary = portfolioData?.interventions?.summary;
  const isNonNegativeInt = (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0;

  // 1. Authoritative Server Summary Check
  const hasValidServerSummary = Boolean(
    summary &&
    isNonNegativeInt(summary.totalSpacedReviews) &&
    isNonNegativeInt(summary.passedSpacedReviews) &&
    summary.passedSpacedReviews <= summary.totalSpacedReviews
  );

  if (hasValidServerSummary) {
    return {
      completedRecallCount: summary.totalSpacedReviews,
      passedRecallCount: summary.passedSpacedReviews,
      source: 'portfolio_summary'
    };
  }

  // 2. Authoritative Record-Based Fallback
  // Prioritize portfolio interventions array, then progress array. Never concatenate them.
  let rawReviews = [];
  if (Array.isArray(portfolioData?.interventions?.spacedReviews)) {
    rawReviews = portfolioData.interventions.spacedReviews;
  } else if (Array.isArray(progress?.spacedReviews)) {
    rawReviews = progress.spacedReviews;
  }

  // Deduplicate and filter malformed records
  const seenKeys = new Set();
  const validRecords = [];

  for (const sr of rawReviews) {
    if (!isValidReviewRecord(sr)) continue;
    const key = getReviewIdentityKey(sr);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    validRecords.push(sr);
  }

  const completed = validRecords.length;
  const passed = validRecords.filter((sr) => Boolean(sr.passed)).length;

  // Invariant guarantee: passed cannot exceed completed, non-negative
  const safeCompleted = Math.max(0, completed);
  const safePassed = Math.max(0, Math.min(safeCompleted, passed));

  return {
    completedRecallCount: safeCompleted,
    passedRecallCount: safePassed,
    source: 'validated_records'
  };
}

/**
 * Pure formatting helper for delayed recall orientation text.
 * 
 * @param {number} completedCount 
 * @param {number} passedCount 
 * @returns {{ mainText: string, subText: string | null, fullText: string }}
 */
export function formatRecallSummaryLabel(completedCount = 0, passedCount = 0) {
  const safeCompleted = typeof completedCount === 'number' && Number.isInteger(completedCount) && completedCount >= 0
    ? completedCount
    : 0;
  const rawPassed = typeof passedCount === 'number' && Number.isInteger(passedCount) && passedCount >= 0
    ? passedCount
    : 0;
  const safePassed = Math.min(safeCompleted, rawPassed);

  const mainText = `${safeCompleted} ${safeCompleted === 1 ? 'follow-up review' : 'follow-up reviews'}`;
  const subText = safeCompleted > 0 ? `(${safePassed} passed)` : null;
  const fullText = subText ? `${mainText} ${subText}` : mainText;

  return { mainText, subText, fullText };
}

/**
 * Authoritative mapping of learning pathway IDs to verified, human-readable habit titles.
 * Derived directly from server/config/remediationCatalog.js.
 */
export const AUTHORITATIVE_PATHWAY_TITLES = {
  'pathway-ua-upi-consent': 'Autopilot Control & UPI PIN Safety',
  'pathway-vb-out-of-band': 'Independent Out-of-Band Verification',
  'pathway-tr-lure-detection': 'Threat Lure Spotting in Routine Contacts',
  'pathway-si-syntax-analysis': 'Technical Signal & Domain Inspection',
  'pathway-dq-digital-hygiene': 'Daily Digital Prudence & System Hygiene',
  'pathway-fp-evidence-triage': 'Evidence-Based Alert Triage',
  'pathway-maintenance-reinforcement': 'Advanced Defense & Secondary Channel Hardening',
  // Known legacy / test fixture mappings
  'phishing-url-verification': 'Phishing Link & Domain Verification'
};

/**
 * Resolves a human-readable, educational title for a pathway.
 * Guarantees that internal database IDs or slugs (like 'pathway-fp-evidence-triage')
 * are NEVER exposed to the learner.
 * 
 * @param {string} [pathwayId]
 * @param {string} [habitTitle] - Pre-populated title from backend or recommendation
 * @returns {string} Human-readable activity title
 */
export function resolvePathwayTitle(pathwayId, habitTitle) {
  if (habitTitle && typeof habitTitle === 'string' && habitTitle.trim() && !habitTitle.startsWith('pathway-')) {
    return habitTitle.trim();
  }
  if (pathwayId && typeof pathwayId === 'string' && AUTHORITATIVE_PATHWAY_TITLES[pathwayId]) {
    return AUTHORITATIVE_PATHWAY_TITLES[pathwayId];
  }
  if (!pathwayId || typeof pathwayId !== 'string') {
    return 'Safety Lesson';
  }

  // Safe fallback for unmapped legacy IDs: strip prefix and convert to clean Title Case
  const clean = pathwayId.replace(/^pathway-/, '').replace(/[-_]+/g, ' ').trim();
  if (!clean) return 'Safety Lesson';
  return clean
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Synthesizes and cleans verified educational activity events for the dashboard Recent Activity feed.
 * 
 * Guarantees:
 * 1. Meaningful titles: Resolves raw pathway IDs into human-readable habit titles.
 * 2. No redundant wording: Badges and titles are distinct and concise (no "Completed lesson:").
 * 3. Clarifies percentages: Disambiguates checkpoint/quiz scores ("Score: 100%") from completion status ("Completed").
 * 4. Honest handling of repeated activities: Preserves foundational lessons vs. reinforcements while deduplicating exact technical duplicate timestamps.
 * 5. Robust sorting: Chronologically descending by completedAt.
 * 
 * @param {object} params
 * @param {Array} [params.completedPathwaysList]
 * @param {Array} [params.reinforcementsList]
 * @param {Array} [params.quizAttemptsList]
 * @param {Array} [params.spacedReviewsList]
 * @param {number} [params.limit=5]
 * @returns {Array<object>} formatted activity items
 */
export function formatRecentActivityEvents({
  completedPathwaysList = [],
  reinforcementsList = [],
  quizAttemptsList = [],
  spacedReviewsList = [],
  limit = 5
} = {}) {
  const events = [];
  const seenTechnicalKeys = new Set();

  // 1. Foundational Lessons (completedPathways)
  (completedPathwaysList || []).forEach(p => {
    if (!p || !p.completedAt) return;
    const dateObj = new Date(p.completedAt);
    if (Number.isNaN(dateObj.getTime())) return;

    const pathwayId = p.pathwayId || '';
    const scoreVal = typeof p.checkpointScore === 'number' && !Number.isNaN(p.checkpointScore)
      ? Math.max(0, Math.min(100, Math.round(p.checkpointScore)))
      : null;

    // Technical deduplication key within this type
    const techKey = `pathway::${pathwayId}::${dateObj.getTime()}::${scoreVal}`;
    if (seenTechnicalKeys.has(techKey)) return;
    seenTechnicalKeys.add(techKey);

    const title = resolvePathwayTitle(pathwayId, p.habitTitle);
    const resultLabel = scoreVal !== null ? `Score: ${scoreVal}%` : 'Completed';

    events.push({
      id: `lesson-${pathwayId}-${dateObj.getTime()}`,
      type: 'pathway',
      badge: 'Lesson',
      title,
      context: 'Foundational lesson',
      score: scoreVal,
      result: resultLabel,
      date: dateObj,
      formattedDate: dateObj.toLocaleDateString()
    });
  });

  // 2. Habit Reinforcements (reinforcementsCompleted)
  (reinforcementsList || []).forEach(r => {
    if (!r || !r.completedAt) return;
    const dateObj = new Date(r.completedAt);
    if (Number.isNaN(dateObj.getTime())) return;

    const pathwayId = r.pathwayId || '';
    const scoreVal = typeof r.checkpointScore === 'number' && !Number.isNaN(r.checkpointScore)
      ? Math.max(0, Math.min(100, Math.round(r.checkpointScore)))
      : null;

    const techKey = `reinforcement::${pathwayId}::${dateObj.getTime()}::${scoreVal}`;
    if (seenTechnicalKeys.has(techKey)) return;
    seenTechnicalKeys.add(techKey);

    const title = resolvePathwayTitle(pathwayId, r.habitTitle);
    const resultLabel = scoreVal !== null ? `Score: ${scoreVal}%` : 'Completed';

    events.push({
      id: `reinforce-${pathwayId}-${dateObj.getTime()}`,
      type: 'reinforcement',
      badge: 'Practice',
      title,
      context: 'Habit reinforcement',
      score: scoreVal,
      result: resultLabel,
      date: dateObj,
      formattedDate: dateObj.toLocaleDateString()
    });
  });

  // 3. Quiz Attempts
  (quizAttemptsList || []).forEach(qa => {
    if (!qa || !qa.completedAt) return;
    const dateObj = new Date(qa.completedAt);
    if (Number.isNaN(dateObj.getTime())) return;

    const quizId = qa.quizId?._id ? String(qa.quizId._id) : (qa.quizId ? String(qa.quizId) : '');
    const pctVal = typeof qa.percentage === 'number' && !Number.isNaN(qa.percentage)
      ? Math.max(0, Math.min(100, Math.round(qa.percentage)))
      : (typeof qa.score === 'number' && !Number.isNaN(qa.score) ? qa.score : null);

    const techKey = `quiz::${quizId || qa.quizTitle}::${dateObj.getTime()}::${pctVal}`;
    if (seenTechnicalKeys.has(techKey)) return;
    seenTechnicalKeys.add(techKey);

    const title = qa.quizTitle && qa.quizTitle.trim() ? qa.quizTitle.trim() : 'Cyber Law Quiz';
    const resultLabel = pctVal !== null ? `Score: ${pctVal}%` : 'Completed';
    const contextLabel = qa.category ? `${qa.category} quiz` : 'Topic quiz';

    events.push({
      id: `quiz-${quizId || 'quiz'}-${dateObj.getTime()}`,
      type: 'quiz',
      badge: 'Quiz',
      title,
      context: contextLabel,
      score: pctVal,
      result: resultLabel,
      date: dateObj,
      formattedDate: dateObj.toLocaleDateString()
    });
  });

  // 4. Spaced Retrieval Follow-Up Reviews
  (spacedReviewsList || []).forEach(sr => {
    if (!sr || !sr.completedAt) return;
    const dateObj = new Date(sr.completedAt);
    if (Number.isNaN(dateObj.getTime())) return;

    const pathwayId = sr.pathwayId || '';
    const scoreVal = typeof sr.checkpointScore === 'number' && !Number.isNaN(sr.checkpointScore)
      ? Math.max(0, Math.min(100, Math.round(sr.checkpointScore)))
      : null;

    const techKey = `spaced-retrieval::${pathwayId}::${dateObj.getTime()}::${scoreVal}`;
    if (seenTechnicalKeys.has(techKey)) return;
    seenTechnicalKeys.add(techKey);

    const title = resolvePathwayTitle(pathwayId, sr.habitTitle);
    const cycle = sr.cycleNumber || 1;
    const resultLabel = scoreVal !== null ? `Score: ${scoreVal}%` : 'Completed';

    events.push({
      id: `review-${pathwayId}-${cycle}-${dateObj.getTime()}`,
      type: 'spaced-retrieval',
      badge: 'Review',
      title,
      context: `Follow-up check (Cycle ${cycle})`,
      score: scoreVal,
      result: resultLabel,
      date: dateObj,
      formattedDate: dateObj.toLocaleDateString()
    });
  });

  // Sort descending by completion date
  events.sort((a, b) => b.date - a.date);

  return events.slice(0, limit);
}

/**
 * Maps raw backend retention status enums to learner-facing, human-readable display labels.
 * 
 * Enums from simulationController.js:
 * - 'pending_reassessment' -> 'Awaiting reassessment'
 * - 'pending_data' -> 'Awaiting data'
 * - 'Retained' -> 'Retained'
 * - 'Stable' -> 'Steady'
 * - 'Partially Retained' -> 'Partially retained'
 * - 'Declined' -> 'Needs practice'
 * - 'Delayed Improvement' -> 'Delayed gain'
 * - 'Developing' -> 'Developing'
 * - 'Unimproved' -> 'Needs practice'
 * 
 * @param {string} [state] - Raw backend status
 * @param {boolean} [hasFinal=true] - Whether learner completed final check
 * @returns {string} Human-readable display label
 */
export function resolveRetentionStatusLabel(state, hasFinal = true) {
  if (!state) {
    return hasFinal ? 'Awaiting reassessment' : 'Awaiting final check';
  }

  switch (state) {
    case 'pending_reassessment':
      return 'Awaiting reassessment';
    case 'pending_data':
      return 'Awaiting data';
    case 'Retained':
      return 'Retained';
    case 'Stable':
      return 'Steady';
    case 'Partially Retained':
      return 'Partially retained';
    case 'Declined':
      return 'Needs practice';
    case 'Delayed Improvement':
      return 'Delayed gain';
    case 'Developing':
      return 'Developing';
    case 'Unimproved':
      return 'Needs practice';
    default:
      // Strip underscores and format cleanly
      return state.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
