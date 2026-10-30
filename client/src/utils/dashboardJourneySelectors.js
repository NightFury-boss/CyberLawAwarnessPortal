/**
 * dashboardJourneySelectors.js
 * 
 * Authoritative state machine and selectors for the learner dashboard journey:
 * 1. Answering "Where am I in my learning?" (selectJourneyStage)
 * 2. Answering "What should I do next?" (selectPrimaryNextAction)
 * 3. Answering "What have I learned or practiced so far?" (orientation summary)
 * 
 * Architectural Guarantees:
 * - Server-authoritative data is respected; no client-side score fabrication.
 * - Single source of truth for the primary recommendation across all dashboard views.
 * - Deterministic, mutually exclusive prioritization order.
 * - Zero exposure of raw database slugs or internal IDs.
 * - Everyday plain English for learner-facing status, badges, and action prompts.
 */

import { resolvePathwayTitle } from './evidenceSelectors.js';

/**
 * Determines the authoritative Primary Next Step for the learner dashboard.
 * 
 * Priority Ladder:
 * 1. PRE_BASELINE: Learner must take First Check (Your Digital Day) to establish baseline.
 * 2. RESUME_PATHWAY: Learner started a lesson (Step 1 or 2 complete) and should finish what was started.
 * 3. READY_FOR_FINAL: All recommended lessons finished; ready to measure habit shift in Final Check.
 * 4. DUE_SPACED_REVIEW: A 7-day retention check is ready (~2 min check to keep habits sharp).
 * 5. START_PATHWAY: Start the next unstarted recommended lesson.
 * 6. REINFORCE_HABIT: Final check revealed a habit needing reinforcement; targeted practice is ready.
 * 7. ALL_CAUGHT_UP: Everything currently recommended or due is completed. Secondary practice available.
 * 
 * @param {object} params
 * @param {boolean} [params.hasBaseline]
 * @param {boolean} [params.hasFinal]
 * @param {Array} [params.pathwaysWithStatus]
 * @param {Array} [params.dueSpacedReviews]
 * @param {number} [params.completedFocusCount]
 * @param {number} [params.totalFocusCount]
 * @returns {object} { type, eyebrow, title, description, actionLabel, actionType, destination, targetItem, estimatedMinutes, steps }
 */
export function selectPrimaryNextAction({
  hasBaseline = false,
  hasFinal = false,
  pathwaysWithStatus = [],
  dueSpacedReviews = [],
  completedFocusCount = 0,
  totalFocusCount = 0
} = {}) {
  // Safe numeric parsing to defend against NaN or negative counters
  const safeCompleted = Math.max(0, Number.isFinite(completedFocusCount) ? completedFocusCount : 0);
  const safeTotal = Math.max(0, Number.isFinite(totalFocusCount) ? totalFocusCount : 0);

  // 1. Pre-Baseline
  if (!hasBaseline) {
    return {
      type: 'PRE_BASELINE',
      eyebrow: 'Step 1 of Your Journey',
      title: 'Start Your First Check (Your Digital Day)',
      description: 'Experience realistic everyday scenarios to discover how you currently react under pressure and get a personalized learning plan.',
      actionLabel: 'Start First Check \u2192',
      actionType: 'LINK',
      destination: '/assessment/baseline',
      targetItem: null,
      estimatedMinutes: 5,
      steps: null
    };
  }

  // Find active in-progress pathway (Step 1 or 2 complete, but not Step 3)
  const inProgressItem = (pathwaysWithStatus || []).find(p => p && p.isInProgress && p.rec && p.rec.pathwayId);

  // 2. Resume Pathway (Active in-progress lesson has highest momentum)
  if (!hasFinal && inProgressItem && inProgressItem.rec) {
    const rec = inProgressItem.rec;
    const completedRecord = inProgressItem.completedRecord;
    const steps = completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false };

    const step1Done = Boolean(steps.caseStudy);
    const step2Done = Boolean(steps.prevention);
    const step3Done = Boolean(steps.checkpointQuiz);

    let actionLabel = 'Continue Lesson \u2192';
    if (step2Done && !step3Done) {
      actionLabel = 'Take Checkpoint Quiz \u2192';
    } else if (step1Done && !step2Done) {
      actionLabel = 'Read Practical Defense Rule \u2192';
    } else {
      actionLabel = 'Continue Story \u2192';
    }

    const title = resolvePathwayTitle(rec.pathwayId, rec.habitTitle);

    return {
      type: 'RESUME_PATHWAY',
      eyebrow: 'Resume Where You Left Off',
      title: `Continue: ${title}`,
      description: rec.pedagogicalFocus || rec.coreRule || 'A practical guide to strengthening your routine defensive habits.',
      actionLabel,
      actionType: 'RUNNER',
      destination: null,
      targetItem: inProgressItem,
      estimatedMinutes: rec.estimatedMinutes || 3,
      steps: {
        step1Done,
        step2Done,
        step3Done
      }
    };
  }

  // Find next unstarted recommended pathway
  const nextIncompleteItem = (pathwaysWithStatus || []).find(p => p && !p.isFullyCompleted && p.rec && p.rec.pathwayId);

  // 3. Ready for Final Assessment (All recommended lessons complete, but Final Check not taken)
  const allFocusComplete = safeTotal > 0 && safeCompleted >= safeTotal;
  if (!hasFinal && (allFocusComplete || (!nextIncompleteItem && (pathwaysWithStatus || []).length > 0))) {
    return {
      type: 'READY_FOR_FINAL',
      eyebrow: 'Ready for Your Final Check',
      title: 'See How Your Habits Improved in the Final Check',
      description: 'You have completed all recommended safety lessons. Take the Final Check to see how your simulated choices have improved compared to your starting baseline.',
      actionLabel: 'Start Final Check \u2192',
      actionType: 'LINK',
      destination: '/assessment/final',
      targetItem: null,
      estimatedMinutes: 5,
      steps: null
    };
  }

  // 4. Due Spaced Retrieval (7-day retention check is time-sensitive and quick ~2 min)
  if (Array.isArray(dueSpacedReviews) && dueSpacedReviews.length > 0 && dueSpacedReviews[0]) {
    const dueItem = dueSpacedReviews[0];
    const habitTitle = resolvePathwayTitle(dueItem.pathwayId, dueItem.habitTitle);

    return {
      type: 'DUE_SPACED_REVIEW',
      eyebrow: 'A Review is Ready (~2 min)',
      title: `Quick Review: ${habitTitle}`,
      description: 'A short follow-up review is ready. Checking what you remember helps safe habits stay second nature.',
      actionLabel: 'Start Quick Review \u2192',
      actionType: 'SPACED_MODAL',
      destination: null,
      targetItem: dueItem,
      estimatedMinutes: 2,
      steps: null
    };
  }

  // 5. Start Next Recommended Pathway
  if (!hasFinal && nextIncompleteItem && nextIncompleteItem.rec) {
    const rec = nextIncompleteItem.rec;
    const title = resolvePathwayTitle(rec.pathwayId, rec.habitTitle);

    return {
      type: 'START_PATHWAY',
      eyebrow: 'Recommended Lesson',
      title,
      description: rec.pedagogicalFocus || rec.coreRule || 'A practical guide to strengthening your routine defensive habits.',
      actionLabel: 'Start Lesson \u2192',
      actionType: 'RUNNER',
      destination: null,
      targetItem: nextIncompleteItem,
      estimatedMinutes: rec.estimatedMinutes || 3,
      steps: {
        step1Done: false,
        step2Done: false,
        step3Done: false
      }
    };
  }

  // Find next eligible reinforcement pathway
  const nextReinforceItem = (pathwaysWithStatus || []).find(p => p && p.isReinforcementEligible && !p.isReinforced && p.rec && p.rec.pathwayId);

  // 6. Targeted Habit Reinforcement Eligible
  if (hasFinal && nextReinforceItem && nextReinforceItem.rec) {
    const rec = nextReinforceItem.rec;
    const title = resolvePathwayTitle(rec.pathwayId, rec.habitTitle);

    return {
      type: 'REINFORCE_HABIT',
      eyebrow: 'Practice Your Safety Habits',
      title: `Keep This Habit Sharp: ${title}`,
      description: 'A targeted practice session recommended based on your Final Check results. Complete this short session to keep your safe online habits strong.',
      actionLabel: 'Practice This Habit \u2192',
      actionType: 'RUNNER_REINFORCE',
      destination: null,
      targetItem: nextReinforceItem,
      estimatedMinutes: rec.estimatedMinutes || 3,
      steps: null
    };
  }

  // 7. All Caught Up / Steady Maintenance
  return {
    type: 'ALL_CAUGHT_UP',
    eyebrow: 'All Up to Date',
    title: 'Your safety habits are up to date.',
    description: 'You have finished your recommended lessons and all reviews are current. You can practice cyber law quizzes, review your learning record, or return later for your next follow-up check.',
    actionLabel: 'Practice Law Quizzes \u2192',
    actionType: 'LINK',
    destination: '/quizzes',
    targetItem: null,
    estimatedMinutes: null,
    steps: null
  };
}

/**
 * Determines the overall conceptual learning journey stage for orientation.
 * Synchronizes the dashboard header, stage badge, and orientation summary.
 * 
 * Stages:
 * Stage 1: First Check Needed
 * Stage 2: Lessons & Practice (Baseline complete, lessons in progress)
 * Stage 3: Ready for Final Check (All lessons finished, final check pending)
 * Stage 4: Your Progress Over Time / Practice Your Safety Habits / Keeping Habits Sharp
 * 
 * @param {object} params
 * @param {boolean} [params.hasBaseline]
 * @param {boolean} [params.hasFinal]
 * @param {boolean} [params.hasTrajectoryReassessment]
 * @param {boolean} [params.hasReinforceEligible]
 * @param {number} [params.completedFocusCount]
 * @param {number} [params.totalFocusCount]
 * @returns {object} { stageNum, totalStages, stageLabel, summaryTag, message }
 */
export function selectJourneyStage({
  hasBaseline = false,
  hasFinal = false,
  hasTrajectoryReassessment = false,
  hasReinforceEligible = false,
  completedFocusCount = 0,
  totalFocusCount = 0
} = {}) {
  const totalStages = 4;
  const safeCompleted = Math.max(0, Number.isFinite(completedFocusCount) ? completedFocusCount : 0);
  const safeTotal = Math.max(0, Number.isFinite(totalFocusCount) ? totalFocusCount : 0);

  if (!hasBaseline) {
    return {
      stageNum: 1,
      totalStages,
      stageLabel: 'Stage 1 of 4: First Check Needed',
      summaryTag: 'First check needed',
      message: 'Start with Your Digital Day to discover how you currently react in everyday online situations.'
    };
  }

  if (!hasFinal) {
    const allDone = safeTotal > 0 && safeCompleted >= safeTotal;
    if (allDone) {
      return {
        stageNum: 3,
        totalStages,
        stageLabel: 'Stage 3 of 4: Ready for Final Check',
        summaryTag: 'Ready for final check',
        message: 'All recommended lessons completed! Take your Final Check to see how your habits improved.'
      };
    }
    return {
      stageNum: 2,
      totalStages,
      stageLabel: 'Stage 2 of 4: Lessons & Practice',
      summaryTag: 'Lessons in progress',
      message: 'Here is an overview of what you are learning and practicing to build safe online habits.'
    };
  }

  // Post-Final Check (Stage 4)
  if (hasTrajectoryReassessment) {
    return {
      stageNum: 4,
      totalStages,
      stageLabel: 'Stage 4 of 4: Your Progress Over Time',
      summaryTag: 'Progress recorded',
      message: 'You have recorded follow-up checks. Keep your safety habits sharp with periodic reviews.'
    };
  }

  if (hasReinforceEligible) {
    return {
      stageNum: 4,
      totalStages,
      stageLabel: 'Stage 4 of 4: Practice Your Safety Habits',
      summaryTag: 'Practice open',
      message: 'Your Final Check is complete. Strengthen specific safety habits through targeted practice sessions.'
    };
  }

  return {
    stageNum: 4,
    totalStages,
    stageLabel: 'Stage 4 of 4: Keeping Habits Sharp',
    summaryTag: 'All checks complete',
    message: 'You have completed your core lessons and checks. Keep your safety habits sharp with periodic reviews.'
  };
}
