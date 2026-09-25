import React from 'react';

/**
 * OrientationSummary Component
 * Section C: Compact editorial orientation metrics
 * 
 * Rules:
 * - NO large KPI cards, NO score rings, NO gamification.
 * - Understated inline statistics separated by bullets (•).
 * - Real authoritative values only.
 * - Assessment stage rather than fake dimension counts.
 */
function OrientationSummary({
  completedFocusCount = 0,
  quizAttemptsCount = 0,
  hasBaseline = false,
  hasFinal = false,
  hasTrajectoryReassessment = false
}) {
  const getAssessmentStageText = () => {
    if (!hasBaseline) return 'Baseline pending';
    if (!hasFinal) return 'Baseline completed';
    if (hasTrajectoryReassessment) return 'Longitudinal reassessment recorded';
    return 'Final assessment completed';
  };

  return (
    <div className="desk-stats-inline" aria-label="Learning orientation summary">
      <span className="desk-stat-item">
        <strong className="desk-stat-val">{completedFocusCount}</strong>{' '}
        {completedFocusCount === 1 ? 'pathway completed' : 'pathways completed'}
      </span>
      <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
      <span className="desk-stat-item">
        <strong className="desk-stat-val">{quizAttemptsCount}</strong>{' '}
        {quizAttemptsCount === 1 ? 'verified quiz attempt' : 'verified quiz attempts'}
      </span>
      <span className="desk-stat-bullet" aria-hidden="true">&bull;</span>
      <span className="desk-stat-item">
        <span className="desk-stat-tag">{getAssessmentStageText()}</span>
      </span>
    </div>
  );
}

export default OrientationSummary;
