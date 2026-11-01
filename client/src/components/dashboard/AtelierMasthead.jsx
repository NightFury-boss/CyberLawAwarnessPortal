import React from 'react';
import { selectJourneyStage } from '../../utils/dashboardJourneySelectors.js';

/**
 * AtelierMasthead Component — The Editorial Opening & Milestone Constellation
 * 
 * Philosophy:
 * - High-credibility, magazine-style masthead for Indian Cyber Law education.
 * - An integrated Milestone Constellation Map rendering the 5 macro phases with verified states.
 * - Integrated 4-pillar Orientation Ledger unifying curriculum, pathways, quizzes, and retention checks.
 * - Direct trigger for the certified Defensive Portfolio / Learning Record.
 */
export default function AtelierMasthead({
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

  // Calculate 5 milestone status states
  const getMilestoneState = (milestoneKey) => {
    switch (milestoneKey) {
      case 'baseline':
        return hasBaseline ? { status: 'done', label: 'Completed' } : { status: 'current', label: 'First Step' };
      case 'lessons':
        if (!hasBaseline) return { status: 'upcoming', label: 'Upcoming' };
        if (lessonsCompletedCount >= totalLessonsCount) return { status: 'done', label: 'Completed' };
        return { status: 'current', label: `${lessonsCompletedCount}/${totalLessonsCount} Read` };
      case 'final':
        if (!hasBaseline) return { status: 'upcoming', label: 'Locked' };
        if (hasFinal) return { status: 'done', label: 'Completed' };
        if (totalFocusCount > 0 && completedFocusCount >= totalFocusCount) return { status: 'current', label: 'Ready' };
        return { status: 'upcoming', label: 'Requires Pathways' };
      case 'practice':
        if (quizAttemptsCount > 0) return { status: 'done', label: `${quizAttemptsCount} Taken` };
        return { status: 'current', label: 'Active' };
      case 'retention':
        if (hasTrajectoryReassessment) return { status: 'done', label: 'Longitudinal' };
        if (dueRecallCount > 0) return { status: 'current', label: `${dueRecallCount} Due` };
        return { status: 'upcoming', label: 'Monitoring' };
      default:
        return { status: 'upcoming', label: 'Pending' };
    }
  };

  const mBaseline = getMilestoneState('baseline');
  const mLessons = getMilestoneState('lessons');
  const mFinal = getMilestoneState('final');
  const mPractice = getMilestoneState('practice');
  const mRetention = getMilestoneState('retention');

  const getStageTagClass = () => {
    if (!hasBaseline || dueRecallCount > 0) return 'atelier-stage-pill attention';
    if (hasFinal) return 'atelier-stage-pill complete';
    return 'atelier-stage-pill';
  };

  return (
    <header className="atelier-masthead" aria-label="Learner dashboard masthead">
      {/* Topline: Identity & Stage Tag */}
      <div className="atelier-masthead-topline">
        <div className="atelier-edition-badge">
          <span>Cyber Law Awareness Portal</span>
          <span className="edition-dot" aria-hidden="true">•</span>
          <span>Personal Study Journal</span>
          <span className="edition-dot" aria-hidden="true">•</span>
          <span>Indian Statutory Defense</span>
        </div>
        <div className={getStageTagClass()} aria-label={`Current stage: ${stage.stageLabel}`}>
          {stage.stageLabel}
        </div>
      </div>

      {/* Hero: Two-Part Asymmetric Composition */}
      <div className="atelier-masthead-hero">
        {/* Left: Expressive Editorial Intro */}
        <div className="atelier-hero-text">
          <h1>
            {displayName ? `Welcome to your learning desk, ${displayName}.` : 'Your Personal Learning Journal'}
          </h1>
          <p>
            {stage.message}
          </p>

          {onOpenPortfolioModal && (
            <button
              type="button"
              onClick={onOpenPortfolioModal}
              className="atelier-portfolio-trigger print-hidden"
              aria-label="View and print your verified learning record"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Verified Learning Record</span>
            </button>
          )}
        </div>

        {/* Right: Milestone Constellation Progression Map */}
        <div className="atelier-milestone-map" aria-label="Five core learning milestones">
          <div className="atelier-map-heading">
            <span>5 Core Learning Milestones</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted, #8A8075)' }}>Linear Progression</span>
          </div>

          <div className="atelier-milestone-nodes">
            {/* Milestone 1: First Check */}
            <div className={`atelier-milestone-node is-${mBaseline.status}`}>
              <div className="milestone-icon-bubble">1</div>
              <div className="milestone-node-info">
                <span className="milestone-node-title">First Check (Your Digital Day)</span>
                <span className="milestone-node-sub">Establish baseline behavioral instincts</span>
              </div>
              <span className="milestone-node-badge">{mBaseline.label}</span>
            </div>

            {/* Milestone 2: Core Lessons */}
            <div className={`atelier-milestone-node is-${mLessons.status}`}>
              <div className="milestone-icon-bubble">2</div>
              <div className="milestone-node-info">
                <span className="milestone-node-title">Core Curriculum Lessons</span>
                <span className="milestone-node-sub">12 plain-language statutory chapters</span>
              </div>
              <span className="milestone-node-badge">{mLessons.label}</span>
            </div>

            {/* Milestone 3: Final Check */}
            <div className={`atelier-milestone-node is-${mFinal.status}`}>
              <div className="milestone-icon-bubble">3</div>
              <div className="milestone-node-info">
                <span className="milestone-node-title">Final Check (Longitudinal Benchmark)</span>
                <span className="milestone-node-sub">Measure decision improvements under pressure</span>
              </div>
              <span className="milestone-node-badge">{mFinal.label}</span>
            </div>

            {/* Milestone 4: Practice Studio */}
            <div className={`atelier-milestone-node is-${mPractice.status}`}>
              <div className="milestone-icon-bubble">4</div>
              <div className="milestone-node-info">
                <span className="milestone-node-title">Practice Studio</span>
                <span className="milestone-node-sub">5 modes: scenarios, drills, challenge</span>
              </div>
              <span className="milestone-node-badge">{mPractice.label}</span>
            </div>

            {/* Milestone 5: Habits Over Time */}
            <div className={`atelier-milestone-node is-${mRetention.status}`}>
              <div className="milestone-icon-bubble">5</div>
              <div className="milestone-node-info">
                <span className="milestone-node-title">Habits Over Time</span>
                <span className="milestone-node-sub">Spaced recall & 6-dimension trajectory</span>
              </div>
              <span className="milestone-node-badge">{mRetention.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Orientation Ledger (4 Distinct Balanced Columns) */}
      <div className="atelier-orientation-ledger" aria-label="Orientation metrics summary">
        <div className="ledger-column">
          <span className="ledger-label">Curriculum Lessons</span>
          <span className="ledger-value">
            {lessonsCompletedCount} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #8A8075)', fontWeight: 500 }}>/ {totalLessonsCount}</span>
          </span>
          <span className="ledger-sub">
            {lessonsCompletedCount === totalLessonsCount ? 'All chapters read' : `${totalLessonsCount - lessonsCompletedCount} chapters remaining`}
          </span>
        </div>

        <div className="ledger-column">
          <span className="ledger-label">Targeted Pathways</span>
          <span className="ledger-value">
            {hasBaseline ? `${completedFocusCount} / ${totalFocusCount}` : '—'}
          </span>
          <span className="ledger-sub">
            {hasBaseline 
              ? (completedFocusCount >= totalFocusCount && totalFocusCount > 0 ? 'All pathways completed' : 'Personalized coaching')
              : 'Requires First Check'}
          </span>
        </div>

        <div className="ledger-column">
          <span className="ledger-label">Statutory Quizzes</span>
          <span className="ledger-value">
            {quizAttemptsCount} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #8A8075)', fontWeight: 500 }}>taken</span>
          </span>
          <span className="ledger-sub">
            5 dedicated practice modes
          </span>
        </div>

        <div className="ledger-column">
          <span className="ledger-label">Retention Reviews</span>
          <span className="ledger-value">
            {dueRecallCount > 0 ? (
              <span style={{ color: 'var(--color-warning, #B17A38)' }}>{dueRecallCount} Due</span>
            ) : (
              <span style={{ color: 'var(--color-success, #536F61)', fontSize: '1.25rem' }}>All Current</span>
            )}
          </span>
          <span className="ledger-sub">
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

