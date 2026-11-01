import React from 'react';
import { selectJourneyStage } from '../../utils/dashboardJourneySelectors.js';

/**
 * DashboardHeader Component — Editorial Masthead & Journey Compass
 * 
 * Philosophy:
 * - High-credibility, magazine-style masthead for Indian Cyber Law education.
 * - Answers "Where am I in my learning journey?" in the first 2 seconds.
 * - Narrative Journey Compass functioning as an orientation roadmap (NEVER a synthetic percentage bar).
 * - Integrated 4-pillar Orientation Ledger unifying lessons, interventions, quizzes, and retention checks.
 * - Direct trigger for the certified Defensive Portfolio / Learning Record.
 */
function DashboardHeader({
  displayName,
  hasBaseline,
  hasFinal,
  nextReinforcePathway,
  hasTrajectoryReassessment,
  completedFocusCount = 0,
  totalFocusCount = 0,
  lessonsCompletedCount = 0,
  totalLessonsCount = 12,
  quizAttemptsCount = 0,
  completedRecallCount = 0,
  passedRecallCount = 0,
  dueRecallCount = 0,
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

  const getStageTagClass = () => {
    if (!hasBaseline || dueRecallCount > 0) return 'desk-stage-tag stage-attention';
    if (hasFinal) return 'desk-stage-tag stage-complete';
    return 'desk-stage-tag';
  };

  return (
    <header className="desk-masthead" aria-label="Learner dashboard masthead">
      {/* Topline: Identity & Stage Tag */}
      <div className="desk-masthead-topline">
        <div className="desk-masthead-edition">
          <span>Cyber Law Awareness Portal</span>
          <span className="edition-bullet" aria-hidden="true">•</span>
          <span>Personal Study Desk</span>
          <span className="edition-bullet" aria-hidden="true">•</span>
          <span>Indian Statutory Defense</span>
        </div>
        <div className={getStageTagClass()} aria-label={`Current stage: ${stage.stageLabel}`}>
          {stage.stageLabel}
        </div>
      </div>

      {/* Hero: Greeting & Certified Portfolio Action */}
      <div className="desk-masthead-hero">
        <div className="desk-masthead-intro">
          <h1 className="desk-masthead-title">
            {displayName ? `Welcome back, ${displayName}.` : 'Your Learning Workspace'}
          </h1>
          <p className="desk-masthead-subtext">
            {stage.message}
          </p>
        </div>

        {onOpenPortfolioModal && (
          <div className="desk-masthead-actions print-hidden">
            <button
              type="button"
              onClick={() => onOpenPortfolioModal()}
              className="desk-portfolio-btn"
              aria-label="View and print your verified learning record"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Verified Learning Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Macro Journey Compass (5-step orientation roadmap) */}
      <nav className="desk-journey-compass" aria-label="Conceptual learning journey">
        <div className="desk-compass-track">
          <span className={`desk-compass-step ${getJourneyStepState('baseline')}`}>
            <span className="desk-compass-dot" aria-hidden="true" />
            <span>1. First Check</span>
          </span>

          <span className="desk-compass-line" aria-hidden="true" />

          <span className={`desk-compass-step ${getJourneyStepState('learning')}`}>
            <span className="desk-compass-dot" aria-hidden="true" />
            <span>2. Core Lessons</span>
          </span>

          <span className="desk-compass-line" aria-hidden="true" />

          <span className={`desk-compass-step ${getJourneyStepState('final')}`}>
            <span className="desk-compass-dot" aria-hidden="true" />
            <span>3. Final Check</span>
          </span>

          <span className="desk-compass-line" aria-hidden="true" />

          <span className={`desk-compass-step ${getJourneyStepState('reinforcement')}`}>
            <span className="desk-compass-dot" aria-hidden="true" />
            <span>4. Practice Studio</span>
          </span>

          <span className="desk-compass-line" aria-hidden="true" />

          <span className={`desk-compass-step ${getJourneyStepState('retention')}`}>
            <span className="desk-compass-dot" aria-hidden="true" />
            <span>5. Habits Over Time</span>
          </span>
        </div>
      </nav>

      {/* Integrated Orientation Ledger (4 Distinct Pillars) */}
      <div className="desk-orientation-ledger" aria-label="Orientation metrics summary">
        {/* Pillar 1: Curriculum Lessons */}
        <div className="desk-ledger-item">
          <span className="desk-ledger-label">Curriculum Lessons</span>
          <span className="desk-ledger-value">
            {lessonsCompletedCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {totalLessonsCount}</span>
          </span>
          <span className="desk-ledger-sub">
            {lessonsCompletedCount === totalLessonsCount ? 'All chapters read' : `${totalLessonsCount - lessonsCompletedCount} chapters remaining`}
          </span>
        </div>

        {/* Pillar 2: Diagnostic Interventions */}
        <div className="desk-ledger-item">
          <span className="desk-ledger-label">Targeted Pathways</span>
          <span className="desk-ledger-value">
            {hasBaseline ? `${completedFocusCount} / ${totalFocusCount}` : '—'}
          </span>
          <span className="desk-ledger-sub">
            {hasBaseline 
              ? (completedFocusCount >= totalFocusCount && totalFocusCount > 0 ? 'All pathways complete' : 'Adaptive coaching')
              : 'Requires First Check'}
          </span>
        </div>

        {/* Pillar 3: Knowledge Quizzes */}
        <div className="desk-ledger-item">
          <span className="desk-ledger-label">Statutory Quizzes</span>
          <span className="desk-ledger-value">
            {quizAttemptsCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>taken</span>
          </span>
          <span className="desk-ledger-sub">
            5 dedicated practice modes
          </span>
        </div>

        {/* Pillar 4: Retention Reviews & Portfolio */}
        <div className="desk-ledger-item">
          <span className="desk-ledger-label">Retention Reviews</span>
          <span className="desk-ledger-value">
            {dueRecallCount > 0 ? (
              <span style={{ color: '#d97706' }}>{dueRecallCount} Due</span>
            ) : (
              <span style={{ color: '#059669', fontSize: '1.05rem' }}>All Current</span>
            )}
          </span>
          <span className="desk-ledger-sub">
            {completedRecallCount > 0 ? (
              <span>{completedRecallCount} follow-ups completed</span>
            ) : (
              <span>7-day spaced recall active</span>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
