import React from 'react';
import { Link } from 'react-router-dom';
import { formatRecentActivityEvents, resolvePathwayTitle } from '../../utils/evidenceSelectors';

/**
 * TargetedInterventionsPanel Component
 * Personalized practice recommended strictly from diagnostic assessment findings.
 */
export function TargetedInterventionsPanel({
  hasBaseline,
  pathwaysWithStatus = [],
  dueSpacedReviews = [],
  onLaunchRunner,
  onLaunchSpacedRetrieval,
  completedFocusCount = 0,
  totalFocusCount = 0
}) {
  return (
    <section className="atelier-pathways-card" aria-labelledby="interventions-heading">
      <div className="atelier-section-header">
        <div>
          <span className="atelier-section-eyebrow">Personalized Coaching</span>
          <h2 id="interventions-heading" className="atelier-section-title">
            Targeted Defense Pathways
          </h2>
          <p className="atelier-section-sub">
            Personalized coaching generated from your diagnostic assessment findings.
          </p>
        </div>
        {totalFocusCount > 0 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #302B27)' }}>
              {completedFocusCount} of {totalFocusCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #8A8075)', display: 'block' }}>
              Pathways Done
            </span>
          </div>
        )}
      </div>

      {/* Follow-up Spaced Review Notice */}
      {hasBaseline && (
        dueSpacedReviews.length > 0 ? (
          <div className="atelier-recall-card" style={{ marginTop: '14px', marginBottom: '16px' }}>
            <div className="atelier-recall-top">
              <span className="atelier-recall-tag">Follow-Up Review Due</span>
              <span className="atelier-recall-count">~2 min check</span>
            </div>
            <p className="atelier-recall-desc">
              A retention check is ready for <strong>{resolvePathwayTitle(dueSpacedReviews[0].pathwayId, dueSpacedReviews[0].habitTitle)}</strong>.
            </p>
            <button
              type="button"
              className="atelier-recall-btn"
              onClick={() => onLaunchSpacedRetrieval && onLaunchSpacedRetrieval(dueSpacedReviews[0])}
              aria-label={`Start quick review for ${resolvePathwayTitle(dueSpacedReviews[0].pathwayId, dueSpacedReviews[0].habitTitle)}`}
            >
              Start Review &rarr;
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #8A8075)', marginTop: '6px', marginBottom: '14px' }}>
            ✓ Follow-up reviews: All scheduled checks are up to date (opens 7 days post-completion).
          </div>
        )
      )}

      {/* Pathways List or Pre-Baseline Preview */}
      {hasBaseline ? (
        pathwaysWithStatus.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pathwaysWithStatus.map((item, idx) => {
              const rec = item.rec;
              if (!rec || !rec.habitTitle || !rec.pathwayId) return null;

              const steps = item.completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false };
              const isFullyCompleted = Boolean(item.isFullyCompleted || item.completedRecord?.completedAt);
              const checkpointScore = item.completedRecord?.checkpointScore;

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                    border: '1px solid var(--color-border, #DED6C9)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--color-text-primary, #302B27)', margin: '0 0 4px 0' }}>
                      {resolvePathwayTitle(rec.pathwayId, rec.habitTitle)}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #635B53)', margin: 0, lineHeight: 1.45 }}>
                      {rec.pedagogicalFocus || rec.coreRule}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', backgroundColor: steps.caseStudy ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-surface-secondary, #EFE8DC)', color: steps.caseStudy ? 'var(--color-success, #536F61)' : 'var(--color-text-muted, #8A8075)', fontWeight: 700 }}>
                        {steps.caseStudy ? '✓ 1. Story' : '1. Story'}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', backgroundColor: steps.prevention ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-surface-secondary, #EFE8DC)', color: steps.prevention ? 'var(--color-success, #536F61)' : 'var(--color-text-muted, #8A8075)', fontWeight: 700 }}>
                        {steps.prevention ? '✓ 2. Rule' : '2. Rule'}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', backgroundColor: steps.checkpointQuiz ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-surface-secondary, #EFE8DC)', color: steps.checkpointQuiz ? 'var(--color-success, #536F61)' : 'var(--color-text-muted, #8A8075)', fontWeight: 700 }}>
                        {steps.checkpointQuiz ? `✓ 3. Quiz (${checkpointScore || 100}%)` : '3. Quiz'}
                      </span>
                    </div>
                  </div>

                  <div className="print-hidden">
                    {isFullyCompleted ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-success, #536F61)', fontWeight: 800 }}>
                        ✓ Completed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onLaunchRunner && onLaunchRunner(item)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '7px 16px', borderRadius: '6px' }}
                      >
                        {item.isInProgress ? 'Continue →' : 'Start →'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #635B53)', margin: '10px 0 0 0' }}>
            No pathways recommended yet.
          </p>
        )
      ) : (
        <div className="atelier-pathways-preview">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary, #302B27)', margin: '0 0 6px 0' }}>
            Unlock Personalized Safety Pathways
          </h3>
          <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'var(--color-text-secondary, #635B53)', margin: '0 0 16px 0', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            Complete your First Check (Your Digital Day) to discover your behavioral blindspots and unlock targeted coaching in credential safety, UPI verification, and alert triage.
          </p>
          <Link
            to="/assessment/baseline"
            className="atelier-dossier-btn"
            style={{ fontSize: '0.86rem', padding: '9px 20px' }}
          >
            Start First Check &rarr;
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * RecentActivityStream Component
 * Compact verified educational activity timeline.
 */
export function RecentActivityStream({
  completedPathwaysList = [],
  reinforcementsList = [],
  quizAttemptsList = [],
  spacedReviewsList = []
}) {
  const displayEvents = formatRecentActivityEvents({
    completedPathwaysList,
    reinforcementsList,
    quizAttemptsList,
    spacedReviewsList,
    limit: 4
  });

  return (
    <section className="atelier-activity-card" aria-labelledby="activity-heading">
      <div className="atelier-section-header" style={{ marginBottom: '14px' }}>
        <div>
          <span className="atelier-section-eyebrow">Verified Record</span>
          <h2 id="activity-heading" className="atelier-section-title">
            Recent Activity
          </h2>
        </div>
      </div>

      {displayEvents.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }} role="feed" aria-label="Recent learning events">
          {displayEvents.map((evt, idx) => (
            <article
              key={evt.id || idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.82rem',
                color: '#445160',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#fbfbf9',
                border: '1px solid rgba(12, 29, 46, 0.08)'
              }}
            >
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f3efe6', color: '#0c1d2e', flexShrink: 0 }}>
                {evt.badge}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, color: '#0c1d2e', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {evt.title}
                </span>
                <div style={{ fontSize: '0.74rem', color: '#7a8898', marginTop: '2px' }}>
                  {evt.result && <strong style={{ color: '#0c1d2e', marginRight: '6px' }}>{evt.result}</strong>}
                  <time dateTime={evt.date.toISOString()}>{evt.formattedDate}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.84rem', color: '#7a8898', margin: 0 }}>
          No learning activity recorded yet.
        </p>
      )}
    </section>
  );
}

function LearningPracticeSection(props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TargetedInterventionsPanel {...props} />
      <RecentActivityStream {...props} />
    </div>
  );
}

export default LearningPracticeSection;
