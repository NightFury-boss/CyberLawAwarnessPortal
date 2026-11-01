import React from 'react';
import { selectJourneyStage } from '../../utils/dashboardJourneySelectors.js';

/**
 * OrientationSummary Component
 * Section C: Compact editorial orientation metrics
 * 
 * Rules:
 * - NO large KPI cards, NO score rings, NO gamification.
 * - Understated inline statistics separated by bullets (•).
 * - Real authoritative values only.
 * - Assessment stage tag synchronized with the authoritative journey stage selector.
 */
function OrientationSummary({
  completedFocusCount = 0,
  totalFocusCount = 0,
  lessonsCompletedCount = 0,
  totalLessonsCount = 0,
  quizAttemptsCount = 0,
  completedRecallCount = 0,
  passedRecallCount = 0,
  hasBaseline = false,
  hasFinal = false,
  hasTrajectoryReassessment = false,
  hasReinforceEligible = false,
  onOpenPortfolioModal
}) {
  const stage = selectJourneyStage({
    hasBaseline,
    hasFinal,
    hasTrajectoryReassessment,
    hasReinforceEligible,
    completedFocusCount,
    totalFocusCount
  });

  return (
    <div className="desk-stats-inline" aria-label="Learning orientation summary">
      {totalLessonsCount > 0 && (
        <>
          <span className="desk-stat-item">
            <strong className="desk-stat-val">{lessonsCompletedCount}</strong> of {totalLessonsCount} lessons read
          </span>
          <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
        </>
      )}
      <span className="desk-stat-item">
        <strong className="desk-stat-val">{completedFocusCount}</strong>{' '}
        {completedFocusCount === 1 ? 'intervention completed' : 'interventions completed'}
      </span>
      <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
      <span className="desk-stat-item">
        <strong className="desk-stat-val">{quizAttemptsCount}</strong>{' '}
        {quizAttemptsCount === 1 ? 'quiz taken' : 'quizzes taken'}
      </span>
      <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
      <span className="desk-stat-item">
        {onOpenPortfolioModal ? (
          <button
            type="button"
            onClick={() => onOpenPortfolioModal('delayed-recall')}
            className="desk-stat-btn-inline"
            aria-label={`${completedRecallCount} follow-up reviews, ${passedRecallCount} passed. View details in learning record.`}
          >
            <strong className="desk-stat-val">{completedRecallCount}</strong>{' '}
            {completedRecallCount === 1 ? 'follow-up review' : 'follow-up reviews'}
            {completedRecallCount > 0 && typeof passedRecallCount === 'number' && (
              <span className="desk-stat-subtext"> ({passedRecallCount} passed)</span>
            )}
          </button>
        ) : (
          <>
            <strong className="desk-stat-val">{completedRecallCount}</strong>{' '}
            {completedRecallCount === 1 ? 'follow-up review' : 'follow-up reviews'}
            {completedRecallCount > 0 && typeof passedRecallCount === 'number' && (
              <span className="desk-stat-subtext"> ({passedRecallCount} passed)</span>
            )}
          </>
        )}
      </span>
      <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
      <span className="desk-stat-item">
        <span className="desk-stat-tag">{stage.summaryTag}</span>
      </span>
      {onOpenPortfolioModal && (
        <>
          <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
          <button
            type="button"
            onClick={() => onOpenPortfolioModal()}
            className="desk-stat-link print-hidden"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--color-portal-blue, #2563eb)',
              fontSize: 'inherit',
              fontWeight: '600',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
            aria-label="Open Your Learning Record"
          >
            View Learning Record &rarr;
          </button>
        </>
      )}
    </div>
  );
}

export default OrientationSummary;
