import React from 'react';
import { Link } from 'react-router-dom';
import { selectPrimaryNextAction } from '../../utils/dashboardJourneySelectors.js';

/**
 * PrimaryFocus Component
 * Section B: The dominant learning focal point ("What deserves my attention next?")
 * 
 * Design:
 * - One dominant bordered paper panel (warm white, 1px neutral border, navy left rule).
 * - Immediate 5-second clarity on the learner's single most meaningful next step.
 * - Dynamic action labels matching real state ('Start First Check →', 'Take Checkpoint Quiz →', 'Start Quick Check →').
 * - Three-step learning sequence for active pathways: Real Story → Defense Rule → Quick Quiz.
 * - Unifies all 7 authoritative learner states into a single, cohesive next-action card.
 */
function PrimaryFocus({
  hasBaseline = false,
  hasFinal = false,
  pathwaysWithStatus = [],
  dueSpacedReviews = [],
  completedFocusCount = 0,
  totalFocusCount = 0,
  nextIncompletePathway,
  nextReinforcePathway,
  onLaunchRunner,
  onLaunchSpacedRetrieval,
  onOpenPortfolioModal
}) {
  let effectivePathways = pathwaysWithStatus;
  if ((!effectivePathways || effectivePathways.length === 0) && (nextIncompletePathway || nextReinforcePathway)) {
    effectivePathways = [];
    if (nextIncompletePathway) effectivePathways.push(nextIncompletePathway);
    if (nextReinforcePathway) effectivePathways.push(nextReinforcePathway);
  }

  const action = selectPrimaryNextAction({
    hasBaseline,
    hasFinal,
    pathwaysWithStatus: effectivePathways,
    dueSpacedReviews,
    completedFocusCount,
    totalFocusCount
  });

  /* 1. Pre-Baseline */
  if (action.type === 'PRE_BASELINE') {
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box">
          <div className="desk-focus-body">
            <span className="desk-focus-eyebrow">{action.eyebrow}</span>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {action.title}
            </h2>
            <p className="desk-focus-text">
              {action.description}
            </p>
          </div>
          <div className="desk-focus-action">
            <Link to={action.destination} className="btn btn-primary desk-focus-btn">
              {action.actionLabel}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* 2. Resume Pathway & 4. Start Pathway */
  if (action.type === 'RESUME_PATHWAY' || action.type === 'START_PATHWAY') {
    const steps = action.steps || { step1Done: false, step2Done: false, step3Done: false };
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box">
          <div className="desk-focus-body">
            <div className="desk-focus-meta-row">
              <span className="desk-focus-eyebrow">{action.eyebrow}</span>
              {action.estimatedMinutes && (
                <span className="desk-focus-time">~{action.estimatedMinutes} min</span>
              )}
            </div>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {action.title}
            </h2>
            <p className="desk-focus-text">
              {action.description}
            </p>

            {/* Three-step micro-learning sequence */}
            <div className="desk-pathway-sequence" aria-label="Lesson steps">
              <span className={`sequence-step ${steps.step1Done ? 'step-done' : 'step-current'}`}>
                <span className="sequence-step-num">1</span>
                <span>Real Story</span>
              </span>
              <span className="sequence-arrow" aria-hidden="true">&rarr;</span>
              <span className={`sequence-step ${steps.step2Done ? 'step-done' : (steps.step1Done ? 'step-current' : 'step-upcoming')}`}>
                <span className="sequence-step-num">2</span>
                <span>Defense Rule</span>
              </span>
              <span className="sequence-arrow" aria-hidden="true">&rarr;</span>
              <span className={`sequence-step ${steps.step3Done ? 'step-done' : (steps.step2Done ? 'step-current' : 'step-upcoming')}`}>
                <span className="sequence-step-num">3</span>
                <span>Quick Quiz</span>
              </span>
            </div>
          </div>

          <div className="desk-focus-action">
            <button
              type="button"
              className="btn btn-primary desk-focus-btn"
              onClick={() => onLaunchRunner && onLaunchRunner(action.targetItem, false)}
              aria-label={`${action.actionLabel} for ${action.title}`}
            >
              {action.actionLabel}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* 3. Due Spaced Retrieval (Retention Check) */
  if (action.type === 'DUE_SPACED_REVIEW') {
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box desk-focus-spaced">
          <div className="desk-focus-body">
            <div className="desk-focus-meta-row">
              <span className="desk-focus-eyebrow eyebrow-spaced">{action.eyebrow}</span>
              {action.estimatedMinutes && (
                <span className="desk-focus-time">~{action.estimatedMinutes} min check</span>
              )}
            </div>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {action.title}
            </h2>
            <p className="desk-focus-text">
              {action.description}
            </p>
          </div>

          <div className="desk-focus-action">
            <button
              type="button"
              className="btn btn-primary desk-focus-btn btn-spaced"
              onClick={() => onLaunchSpacedRetrieval && onLaunchSpacedRetrieval(action.targetItem)}
              aria-label={`${action.actionLabel} for ${action.title}`}
            >
              {action.actionLabel}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* 5. Ready for Final Assessment */
  if (action.type === 'READY_FOR_FINAL') {
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box desk-focus-ready">
          <div className="desk-focus-body">
            <div className="desk-focus-meta-row">
              <span className="desk-focus-eyebrow">{action.eyebrow}</span>
              {action.estimatedMinutes && (
                <span className="desk-focus-time">~{action.estimatedMinutes} min</span>
              )}
            </div>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {action.title}
            </h2>
            <p className="desk-focus-text">
              {action.description}
            </p>
          </div>
          <div className="desk-focus-action">
            <Link to={action.destination} className="btn btn-primary desk-focus-btn">
              {action.actionLabel}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* 6. Targeted Habit Reinforcement */
  if (action.type === 'REINFORCE_HABIT') {
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box desk-focus-reinforce">
          <div className="desk-focus-body">
            <div className="desk-focus-meta-row">
              <span className="desk-focus-eyebrow eyebrow-reinforce">{action.eyebrow}</span>
              {action.estimatedMinutes && (
                <span className="desk-focus-time">~{action.estimatedMinutes} min practice</span>
              )}
            </div>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {action.title}
            </h2>
            <p className="desk-focus-text">
              {action.description}
            </p>
          </div>
          <div className="desk-focus-action">
            <button
              type="button"
              className="btn btn-primary desk-focus-btn btn-reinforce"
              onClick={() => onLaunchRunner && onLaunchRunner(action.targetItem, true)}
              aria-label={`${action.actionLabel} for ${action.title}`}
            >
              {action.actionLabel}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* 7. All Caught Up / Maintained */
  return (
    <section className="desk-focus-section" aria-labelledby="focus-card-heading">
      <div className="desk-focus-box desk-focus-caughtup">
        <div className="desk-focus-body">
          <span className="desk-focus-eyebrow">{action.eyebrow}</span>
          <h2 id="focus-card-heading" className="desk-focus-heading">
            {action.title}
          </h2>
          <p className="desk-focus-text">
            {action.description}
          </p>
        </div>
        <div className="desk-focus-action desk-focus-caughtup-actions">
          <Link to={action.destination} className="btn btn-primary desk-focus-btn">
            {action.actionLabel}
          </Link>
          {onOpenPortfolioModal && (
            <button
              type="button"
              onClick={() => onOpenPortfolioModal()}
              className="btn btn-secondary desk-focus-btn"
              aria-label="View verified learning record"
            >
              View Learning Record &rarr;
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default PrimaryFocus;
