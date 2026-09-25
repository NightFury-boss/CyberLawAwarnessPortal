import React from 'react';

/**
 * DashboardHeader Component
 * Section A: Calm editorial welcome & subtle conceptual orientation journey line
 * 
 * Philosophy:
 * - Mature, educational greeting using actual user name from auth/progress.
 * - State-aware supporting line explaining the learner's current standing.
 * - Subtle narrative step track (Baseline → Learning → Final → Reinforce → Retention),
 *   functioning as an orientation map, NEVER a progress bar with percentages.
 */
function DashboardHeader({
  displayName,
  hasBaseline,
  hasFinal,
  nextReinforcePathway,
  hasTrajectoryReassessment
}) {
  const getJourneyStepState = (step) => {
    if (step === 'baseline') {
      return hasBaseline ? 'state-done' : 'state-current';
    }
    if (step === 'learning') {
      if (!hasBaseline) return 'state-upcoming';
      if (hasFinal) return 'state-done';
      return 'state-current';
    }
    if (step === 'final') {
      if (!hasBaseline) return 'state-upcoming';
      if (hasFinal) return 'state-done';
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

  const getSupportingMessage = () => {
    if (!hasBaseline) {
      return 'Begin with Your Digital Day to map your everyday digital reflexes.';
    }
    if (!hasFinal) {
      return 'Here is a quiet view of your current learning focus and practice records.';
    }
    return 'Your foundational learning pathways are complete. Review your records and habit persistence.';
  };

  return (
    <header className="desk-header">
      <h1 className="desk-title">
        {displayName ? `Welcome back, ${displayName}.` : 'Your Learning Journey'}
      </h1>
      <p className="desk-subtext">
        {getSupportingMessage()}
      </p>

      {/* Subtle narrative journey track — contextual orientation, not a progress bar */}
      <nav className="desk-flow-nav" aria-label="Conceptual learning journey">
        <div className="desk-flow-track">
          <span className={`desk-flow-step ${getJourneyStepState('baseline')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Baseline</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('learning')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Learning</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('final')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Final</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('reinforcement')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Reinforce</span>
          </span>

          <span className="desk-flow-rule" aria-hidden="true" />

          <span className={`desk-flow-step ${getJourneyStepState('retention')}`}>
            <span className="desk-flow-dot" aria-hidden="true" />
            <span className="desk-flow-label">Retention</span>
          </span>
        </div>
      </nav>
    </header>
  );
}

export default DashboardHeader;
