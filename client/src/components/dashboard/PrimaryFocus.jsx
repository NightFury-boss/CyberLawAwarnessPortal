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
  pathwaysWithStatus = [],
  dueSpacedReviews = [],
  dueQuizRecalls = [],
  inProgressLesson = null,
  recommendedLesson = null,
  frequentlyMissedQuizTopic = null,
  completedFocusCount = 0,
  totalFocusCount = 0,
  nextIncompletePathway,
  nextReinforcePathway,
  onLaunchRunner,
  onLaunchSpacedRetrieval,
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
    pathwaysWithStatus: effectivePathways,
    dueSpacedReviews,
    dueQuizRecalls,
    inProgressLesson,
    recommendedLesson,
    frequentlyMissedQuizTopic,
    completedFocusCount,
    totalFocusCount
  });

  const getDossierClass = () => {
    switch (action.type) {
      case 'DUE_SPACED_REVIEW':
      case 'DUE_QUIZ_RECALL':
        return 'atelier-dossier-card state-recall';
      case 'READY_FOR_FINAL':
        return 'atelier-dossier-card state-ready';
      case 'REINFORCE_HABIT':
        return 'atelier-dossier-card state-reinforce';
      default:
        return 'atelier-dossier-card';
    }
  };

  const hasSecondaryQuizRecall = action.type !== 'DUE_QUIZ_RECALL' && dueQuizRecalls.length > 0;
  const hasSecondarySpacedReview = action.type !== 'DUE_SPACED_REVIEW' && dueSpacedReviews.length > 0;

  const renderActionButton = () => {
    if (action.actionType === 'LINK') {
      return (
        <Link to={action.destination} className="atelier-dossier-btn">
          <span>{action.actionLabel}</span>
        </Link>
      );
    }

    if (action.actionType === 'SPACED_MODAL') {
      return (
        <button
          type="button"
          onClick={() => onLaunchSpacedRetrieval && onLaunchSpacedRetrieval(action.targetItem)}
          className="atelier-dossier-btn"
          aria-label={action.actionLabel}
        >
          <span>{action.actionLabel}</span>
        </button>
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
    <section aria-labelledby="dossier-heading">
      <div className={getDossierClass()}>
        {/* Eyebrow & Estimated Duration */}
        <div className="atelier-dossier-top">
          <span className="atelier-dossier-eyebrow">
            {action.eyebrow}
          </span>
          {action.estimatedMinutes && (
            <span className="atelier-dossier-time">
              ⏱ ~{action.estimatedMinutes} min duration
            </span>
          )}
        </div>

        {/* Content & Action Row */}
        <div className="atelier-dossier-body">
          <div className="atelier-dossier-copy">
            <h2 id="dossier-heading" className="atelier-dossier-title">
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
        {(hasSecondaryQuizRecall || hasSecondarySpacedReview) && (
          <div className="atelier-dossier-companion print-hidden">
            <span>
              💡 <strong>Retention check ready:</strong>{' '}
              {hasSecondaryQuizRecall
                ? `You also have ${dueQuizRecalls.length} missed quiz ${dueQuizRecalls.length === 1 ? 'concept' : 'concepts'} ready for quick recall review.`
                : 'A scheduled follow-up retention check is also ready.'}
            </span>
            {hasSecondaryQuizRecall && onLaunchQuizRecall && (
              <button
                type="button"
                onClick={onLaunchQuizRecall}
                className="atelier-companion-action"
              >
                Review Concepts Now &rarr;
              </button>
            )}
            {!hasSecondaryQuizRecall && hasSecondarySpacedReview && onLaunchSpacedRetrieval && (
              <button
                type="button"
                onClick={() => onLaunchSpacedRetrieval(dueSpacedReviews[0])}
                className="atelier-companion-action"
              >
                Review Follow-Up Now &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
