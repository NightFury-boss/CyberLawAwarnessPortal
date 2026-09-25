import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PrimaryFocus Component
 * Section B: The dominant learning focal point ("What deserves my attention next?")
 * 
 * Design:
 * - One dominant bordered paper panel (warm white, 1px neutral border, navy left rule).
 * - Immediate 5-second clarity on the learner's single most meaningful next step.
 * - Dynamic action labels matching real state ('Start pathway →', 'Continue pathway →', 'Take checkpoint →').
 * - Three-step learning sequence for active pathways: Incident Learning → Practical Defense → Learning Checkpoint.
 */
function PrimaryFocus({
  hasBaseline,
  hasFinal,
  nextIncompletePathway,
  nextReinforcePathway,
  onLaunchRunner,
  completedFocusCount,
  totalFocusCount
}) {
  /* State 1: Pre-Baseline */
  if (!hasBaseline) {
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box">
          <div className="desk-focus-body">
            <span className="desk-focus-eyebrow">Primary Focus</span>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              Complete Your Digital Day
            </h2>
            <p className="desk-focus-text">
              Begin with Your Digital Day to discover where your everyday digital habits can be strengthened.
            </p>
          </div>
          <div className="desk-focus-action">
            <Link to="/assessment/baseline" className="btn btn-primary desk-focus-btn">
              Start Your Digital Day &rarr;
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* State 2: Active Incomplete Pathway */
  if (!hasFinal && nextIncompletePathway) {
    const rec = nextIncompletePathway.rec;
    const completedRecord = nextIncompletePathway.completedRecord;
    const steps = completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false };

    // Determine 3-step sequence states
    const step1Done = Boolean(steps.caseStudy);
    const step2Done = Boolean(steps.prevention);
    const step3Done = Boolean(steps.checkpointQuiz);

    // Dynamic action button label
    let actionLabel = 'Start pathway \u2192';
    if (step2Done && !step3Done) {
      actionLabel = 'Take checkpoint \u2192';
    } else if (nextIncompletePathway.isInProgress || step1Done) {
      actionLabel = 'Continue pathway \u2192';
    }

    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box">
          <div className="desk-focus-body">
            <div className="desk-focus-meta-row">
              <span className="desk-focus-eyebrow">Primary Focus</span>
              {rec.estimatedMinutes && (
                <span className="desk-focus-time">~{rec.estimatedMinutes} min</span>
              )}
            </div>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {rec.habitTitle}
            </h2>
            <p className="desk-focus-text">
              {rec.pedagogicalFocus || rec.coreRule || 'A practical guide to strengthening your routine defensive habits.'}
            </p>

            {/* Three-step micro-learning sequence */}
            <div className="desk-pathway-sequence" aria-label="Pathway sequence">
              <span className={`sequence-step ${step1Done ? 'step-done' : 'step-current'}`}>
                <span className="sequence-step-num">1</span>
                <span>Incident Learning</span>
              </span>
              <span className="sequence-arrow" aria-hidden="true">&rarr;</span>
              <span className={`sequence-step ${step2Done ? 'step-done' : (step1Done ? 'step-current' : 'step-upcoming')}`}>
                <span className="sequence-step-num">2</span>
                <span>Practical Defense</span>
              </span>
              <span className="sequence-arrow" aria-hidden="true">&rarr;</span>
              <span className={`sequence-step ${step3Done ? 'step-done' : (step2Done ? 'step-current' : 'step-upcoming')}`}>
                <span className="sequence-step-num">3</span>
                <span>Learning Checkpoint</span>
              </span>
            </div>
          </div>

          <div className="desk-focus-action">
            <button
              type="button"
              className="btn btn-primary desk-focus-btn"
              onClick={() => onLaunchRunner(nextIncompletePathway, false)}
              aria-label={`${actionLabel} for ${rec.habitTitle}`}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* State 3: Pathways Completed, Ready for Final Assessment */
  if (!hasFinal && (!nextIncompletePathway || (totalFocusCount > 0 && completedFocusCount >= totalFocusCount))) {
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box desk-focus-ready">
          <div className="desk-focus-body">
            <span className="desk-focus-eyebrow">Primary Focus</span>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              Evaluate Your Habit Shifts in the Final Assessment
            </h2>
            <p className="desk-focus-text">
              You have completed your prioritized learning pathways. Take the final adaptive simulation to observe how your defensive behaviors have evolved across all six dimensions.
            </p>
          </div>
          <div className="desk-focus-action">
            <Link to="/assessment/final" className="btn btn-primary desk-focus-btn">
              Take Final Assessment &rarr;
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* State 4: Targeted Habit Reinforcement Eligible */
  if (hasFinal && nextReinforcePathway) {
    const rec = nextReinforcePathway.rec;
    return (
      <section className="desk-focus-section" aria-labelledby="focus-card-heading">
        <div className="desk-focus-box desk-focus-reinforce">
          <div className="desk-focus-body">
            <span className="desk-focus-eyebrow eyebrow-reinforce">Targeted Habit Reinforcement</span>
            <h2 id="focus-card-heading" className="desk-focus-heading">
              {rec.habitTitle}
            </h2>
            <p className="desk-focus-text">
              Targeted habit reinforcement recommended based on your final assessment. Complete a concise micro-drill to consolidate your routine defensive reflexes.
            </p>
          </div>
          <div className="desk-focus-action">
            <button
              type="button"
              className="btn btn-primary desk-focus-btn btn-reinforce"
              onClick={() => onLaunchRunner(nextReinforcePathway, true)}
              aria-label={`Reinforce defensive habit for ${rec.habitTitle}`}
            >
              Reinforce Defensive Habit &rarr;
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* State 5: All Caught Up */
  return (
    <section className="desk-focus-section" aria-labelledby="focus-card-heading">
      <div className="desk-focus-box desk-focus-caughtup">
        <div className="desk-focus-body">
          <span className="desk-focus-eyebrow">Up to Date</span>
          <h2 id="focus-card-heading" className="desk-focus-heading">
            You're up to date.
          </h2>
          <p className="desk-focus-text">
            Your prioritized learning pathways and targeted reinforcements are complete. You may review your records below, practice statutory quizzes, or retake the simulation when you wish to test habit retention.
          </p>
        </div>
        <div className="desk-focus-action">
          <Link to="/assessment/final" className="btn btn-secondary desk-focus-btn">
            Retake Assessment to Test Habit Retention &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PrimaryFocus;
