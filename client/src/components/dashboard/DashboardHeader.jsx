import React from 'react';
import { selectJourneyStage } from '../../utils/dashboardJourneySelectors.js';

/**
 * DashboardHeader Component
 * Section A: Calm editorial welcome, explicit journey stage badge, and subtle conceptual orientation track
 * 
 * Philosophy:
 * - Mature, educational greeting using actual user name from auth/progress.
 * - Explicit stage badge answering "Where am I in my learning?" in the first 2 seconds.
 * - State-aware supporting line explaining the learner's current standing.
 * - Subtle narrative step track (First Check → Lessons → Final Check → Practice → Habits Over Time),
 *   functioning as an orientation map, NEVER a progress bar with percentages.
 */
function DashboardHeader({
  displayName,
  hasBaseline,
  hasFinal,
  nextReinforcePathway,
  hasTrajectoryReassessment,
  completedFocusCount = 0,
  totalFocusCount = 0,
  onOpenPortfolioModal
}) {
  const stage = selectJourneyStage({
    hasBaseline,
    hasFinal,
    hasTrajectoryReassessment,
    hasReinforceEligible: Boolean(nextReinforcePathway),
    completedFocusCount,
    totalFocusCount
  });

  const getJourneyStepState = (step) => {
    if (step === 'baseline') {
      return hasBaseline ? 'state-done' : 'state-current';
    }
    if (step === 'learning') {
      if (!hasBaseline) return 'state-upcoming';
      if (hasFinal || (totalFocusCount > 0 && completedFocusCount >= totalFocusCount)) return 'state-done';
      return 'state-current';
    }
    if (step === 'final') {
      if (!hasBaseline) return 'state-upcoming';
      if (hasFinal) return 'state-done';
      if (totalFocusCount > 0 && completedFocusCount >= totalFocusCount) return 'state-current';
      return 'state-upcoming';
    }
    if (step === 'reinforcement') {
      if (!hasFinal) return 'state-upcoming';
      if (nextReinforcePathway) return 'state-current';
      return 'state-done';
    }
    if (step === 'retention') {
      if (!hasFinal) return 'state-upcoming';
      if (hasTrajectoryReassessment) return 'state-done';
      if (!nextReinforcePathway) return 'state-current';
      return 'state-upcoming';
    }
    return 'state-upcoming';
  };

  return (
    <header className="desk-header">
      <div className="desk-stage-badge" aria-label={`Current stage: ${stage.stageLabel}`}>
        {stage.stageLabel}
      </div>

      <div className="desk-header-top">
        <div>
          <h1 className="desk-title">
            {displayName ? `Welcome back, ${displayName}.` : 'Your Learning Journey'}
          </h1>
          <p className="desk-subtext">
            {stage.message}
          </p>
        </div>
        {onOpenPortfolioModal && (
          <button
            type="button"
            onClick={onOpenPortfolioModal}
            className="desk-portfolio-btn print-hidden"
            aria-label="View and print your verified learning record"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Learning Record</span>
          </button>
        )}
      </div>

      {/* Subtle narrative journey track — contextual orientation, not a progress bar */}
      <nav className="desk-flow-nav" aria-label="Conceptual learning journey">
        <div className="desk-flow-track">
          <span className={`desk-flow-step ${getJourneyStepState('baseline')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">First Check</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('learning')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Lessons</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('final')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Final Check</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('reinforcement')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Practice</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('retention')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Habits Over Time</span>
          </span>
        </div>
      </nav>
    </header>
  );
}

export default DashboardHeader;
