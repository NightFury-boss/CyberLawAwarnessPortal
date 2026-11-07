import React from 'react';
import { Link } from 'react-router-dom';
import { selectPrimaryNextAction } from '../../utils/dashboardJourneySelectors.js';

/**
 * PrimaryFocus Component — The Daily Briefing & Study Dossier
 * 
 * Philosophy:
 * - Unambiguous next-step clarity across all 11 deterministic learner states.
 * - Layered parchment styling with high-contrast primary CTA.
 * - Interactive 3-step sequence for pathways (*Case Simulation → Defense Rule → Checkpoint Quiz*).
 * - Companion ribbon for secondary retention checks.
 */
export default function PrimaryFocus({
  hasBaseline = false,
  hasFinal = false,
  hasActiveFinal = false,
  activeFinalStage = null,
  pathwaysWithStatus = [],
  dueQuizRecalls = [],
  inProgressLesson = null,
  recommendedLesson = null,
  frequentlyMissedQuizTopic = null,
  completedFocusCount = 0,
  totalFocusCount = 0,
  nextIncompletePathway,
  nextReinforcePathway,
  onLaunchRunner,
  onLaunchQuizRecall,
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
    hasActiveFinal,
    activeFinalStage,
    pathwaysWithStatus: effectivePathways,
    dueQuizRecalls,
    inProgressLesson,
    recommendedLesson,
    frequentlyMissedQuizTopic,
    completedFocusCount,
    totalFocusCount
  });

  const getDossierClass = () => {
    switch (action.type) {
      case 'DUE_QUIZ_RECALL':
        return 'atelier-dossier-card state-recall';
      case 'READY_FOR_FINAL':
      case 'RESUME_FINAL':
        return 'atelier-dossier-card state-ready';
      case 'REINFORCE_HABIT':
        return 'atelier-dossier-card state-reinforce';
      default:
        return 'atelier-dossier-card';
    }
  };

  const hasSecondaryQuizRecall = action.type !== 'DUE_QUIZ_RECALL' && dueQuizRecalls.length > 0;

  const renderActionButton = () => {
    if (action.actionType === 'LINK') {
      return (
        <Link to={action.destination} className="atelier-dossier-btn">
          <span>{action.actionLabel}</span>
        </Link>
      );
    }

    if (action.actionType === 'QUIZ_RECALL_MODAL') {
      return (
        <button
          type="button"
          onClick={() => onLaunchQuizRecall && onLaunchQuizRecall()}
          className="atelier-dossier-btn"
          aria-label={action.actionLabel}
        >
          <span>{action.actionLabel}</span>
        </button>
      );
    }

    if (action.actionType === 'RUNNER_REINFORCE') {
      return (
        <button
          type="button"
          onClick={() => onLaunchRunner && onLaunchRunner(action.targetItem, true)}
          className="atelier-dossier-btn"
          aria-label={action.actionLabel}
        >
          <span>{action.actionLabel}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onLaunchRunner && onLaunchRunner(action.targetItem, false)}
        className="atelier-dossier-btn"
        aria-label={action.actionLabel}
      >
        <span>{action.actionLabel}</span>
      </button>
    );
  };

  return (
    <section aria-labelledby="primary-focus-heading">
      <div className={getDossierClass()}>
        {/* Eyebrow & Estimated Duration */}
        <div className="atelier-dossier-top">
          <span className="atelier-dossier-eyebrow">
            {action.eyebrow}
          </span>
          {action.estimatedMinutes && (
            <span className="atelier-dossier-time">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-1px', marginRight: '4px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ~{action.estimatedMinutes} min duration
            </span>
          )}
        </div>

        {/* Content & Action Row */}
        <div className="atelier-dossier-body">
          <div className="atelier-dossier-copy">
            <h2 id="primary-focus-heading" className="atelier-dossier-title">
              {action.title}
            </h2>
            <p className="atelier-dossier-desc">
              {action.description}
            </p>

            {/* Interactive 3-Step Pathway Progress Indicator */}
            {action.steps && (
              <div className="atelier-pathway-steps" aria-label="Micro-learning sequence">
                <span className={`atelier-step-chip ${action.steps.step1Done ? 'done' : 'active'}`}>
                  <span className="atelier-step-num">1</span>
                  <span>Simulation Story</span>
                </span>
                <span className="atelier-step-arrow" aria-hidden="true">&rarr;</span>
                <span className={`atelier-step-chip ${action.steps.step2Done ? 'done' : (action.steps.step1Done ? 'active' : '')}`}>
                  <span className="atelier-step-num">2</span>
                  <span>Defense Rule</span>
                </span>
                <span className="atelier-step-arrow" aria-hidden="true">&rarr;</span>
                <span className={`atelier-step-chip ${action.steps.step3Done ? 'done' : (action.steps.step2Done ? 'active' : '')}`}>
                  <span className="atelier-step-num">3</span>
                  <span>Checkpoint Quiz</span>
                </span>
              </div>
            )}
          </div>

          <div className="atelier-dossier-cta print-hidden">
            {renderActionButton()}
          </div>
        </div>

        {/* Secondary Non-Competing Companion Notice */}
        {hasSecondaryQuizRecall && (
          <div className="atelier-dossier-companion print-hidden">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: '6px' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
              <strong>Optional Concept Practice:</strong>{' '}
              You have {dueQuizRecalls.length} missed quiz {dueQuizRecalls.length === 1 ? 'concept' : 'concepts'} available for optional review whenever you choose.
            </span>
            {onLaunchQuizRecall && (
              <button
                type="button"
                onClick={onLaunchQuizRecall}
                className="atelier-companion-action"
              >
                Review Concepts Now &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
