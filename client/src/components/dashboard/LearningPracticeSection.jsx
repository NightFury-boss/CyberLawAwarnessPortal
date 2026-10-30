import React from 'react';
import { Link } from 'react-router-dom';
import { formatRecentActivityEvents, resolvePathwayTitle } from '../../utils/evidenceSelectors';

/**
 * LearningPracticeSection Component
 * Section D: Two calm columns on desktop (Learning + Practice) + Recent Educational Events
 * 
 * Rules:
 * - LEARNING: Only verified learning interventions from portfolioData / progress.
 *   Shows checkpoint score ("Passed: {score}%") only when one exists. Never implies mastery.
 * - PRACTICE: Strictly verified QuizAttempt records. No untracked browsing claims.
 * - RECENT EVENTS: Meaningful educational events only (pathway, reinforcement, quiz, assessment).
 */
function LearningPracticeSection({
  hasBaseline,
  pathwaysWithStatus = [],
  quizAttemptsList = [],
  completedPathwaysList = [],
  reinforcementsList = [],
  spacedReviewsList = [],
  dueSpacedReviews = [],
  onLaunchRunner,
  onLaunchSpacedRetrieval,
  completedFocusCount = 0,
  totalFocusCount = 0
}) {
  // Synthesize and format verified educational events from authoritative data
  const displayEvents = formatRecentActivityEvents({
    completedPathwaysList,
    reinforcementsList,
    quizAttemptsList,
    spacedReviewsList,
    limit: 5
  });

  return (
    <div className="desk-columns-container">
      {/* ========================================================================= */}
      {/* TWO CALM COLUMNS: LEARNING & PRACTICE                                     */}
      {/* ========================================================================= */}
      <div className="desk-two-cols">
        
        {/* COLUMN 1: LEARNING INTERVENTIONS */}
        <section className="desk-section desk-col-section" aria-labelledby="learning-heading">
          <div className="desk-section-header">
            <div>
              <h2 id="learning-heading" className="desk-section-title">Lessons</h2>
              <p className="desk-section-sub">Recommended lessons to build safe online habits.</p>
            </div>
            {totalFocusCount > 0 && (
              <span className="desk-section-counter">
                {completedFocusCount} of {totalFocusCount} completed
              </span>
            )}
          </div>

          {hasBaseline && (
            dueSpacedReviews.length > 0 ? (
              <div className="desk-spaced-notice-row">
                <span className="desk-spaced-notice-icon" aria-hidden="true">&#9201;</span>
                <span className="desk-spaced-notice-text">
                  A review is ready for <strong>{resolvePathwayTitle(dueSpacedReviews[0].pathwayId, dueSpacedReviews[0].habitTitle)}</strong> (~2 min).
                </span>
                <button
                  type="button"
                  className="btn btn-secondary desk-btn-compact"
                  onClick={() => onLaunchSpacedRetrieval && onLaunchSpacedRetrieval(dueSpacedReviews[0])}
                  aria-label={`Start quick review for ${resolvePathwayTitle(dueSpacedReviews[0].pathwayId, dueSpacedReviews[0].habitTitle)}`}
                >
                  Review Now &rarr;
                </button>
              </div>
            ) : (
              <div className="desk-spaced-empty-state">
                <span className="desk-spaced-empty-dot" aria-hidden="true" />
                <span>Follow-up practice: All reviews are up to date. Next review opens 7 days after lesson completion.</span>
              </div>
            )
          )}

          {hasBaseline ? (
            pathwaysWithStatus.length > 0 ? (
              <div className="desk-compact-list">
                {pathwaysWithStatus.map((item, idx) => {
                  const rec = item.rec;

                  // Honest fallback for missing or corrupted pathway recommendation data
                  if (!rec || !rec.habitTitle || !rec.pathwayId) {
                    return (
                      <div key={idx} className="desk-compact-row desk-compact-row-fallback">
                        <div className="desk-compact-row-header">
                          <h3 className="desk-compact-title">{rec?.habitTitle || 'Lesson (Unavailable)'}</h3>
                          <div className="desk-compact-status">
                            <span className="desk-pill pill-unavailable">
                              <span className="desk-pill-dot" aria-hidden="true" />
                              Unavailable
                            </span>
                          </div>
                        </div>
                        <div className="desk-compact-row-footer">
                          <div className="desk-compact-meta">
                            <span className="desk-fallback-note">Lesson details are no longer available.</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const steps = item.completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false };
                  const step1Done = Boolean(steps.caseStudy);
                  const step2Done = Boolean(steps.prevention);
                  const step3Done = Boolean(steps.checkpointQuiz);
                  const isFullyCompleted = Boolean(item.isFullyCompleted || item.completedRecord?.completedAt);
                  const checkpointScore = item.completedRecord?.checkpointScore;
                  const hasCheckpointScore = checkpointScore !== null && checkpointScore !== undefined;

                  // Authoritative resolution of status pill and CTA button
                  let statusPill = null;
                  let ctaButton = null;

                  if (item.isSpacedRetrievalDue) {
                    statusPill = (
                      <span className="desk-pill pill-spaced-due">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Review Ready
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-primary desk-btn-compact btn-spaced-retrieval"
                        onClick={() => onLaunchSpacedRetrieval && onLaunchSpacedRetrieval(item)}
                        aria-label={`Start quick review for ${rec.habitTitle}`}
                      >
                        Review Now &rarr;
                      </button>
                    );
                  } else if (item.isReinforced) {
                    statusPill = (
                      <span className="desk-pill pill-reinforced">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Practiced
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-secondary desk-btn-compact"
                        onClick={() => onLaunchRunner(item, false)}
                        aria-label={`Review completed lesson for ${rec.habitTitle}`}
                      >
                        Review &rarr;
                      </button>
                    );
                  } else if (item.isReinforcementEligible && !item.isReinforced) {
                    statusPill = (
                      <span className="desk-pill pill-recommended">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Practice Ready
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-primary desk-btn-compact btn-reinforce-compact"
                        onClick={() => onLaunchRunner(item, true)}
                        aria-label={`Practice habit for ${rec.habitTitle}`}
                      >
                        Practice Habit &rarr;
                      </button>
                    );
                  } else if (isFullyCompleted) {
                    statusPill = (
                      <span className="desk-pill pill-completed">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Completed
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-secondary desk-btn-compact"
                        onClick={() => onLaunchRunner(item, false)}
                        aria-label={`Review completed lesson for ${rec.habitTitle}`}
                      >
                        Review &rarr;
                      </button>
                    );
                  } else if (step1Done && step2Done && !step3Done) {
                    // Both learning steps complete; checkpoint incomplete or failed
                    statusPill = (
                      <span className="desk-pill pill-checkpoint">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Quiz Ready
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-primary desk-btn-compact btn-resume-checkpoint"
                        onClick={() => onLaunchRunner(item, false)}
                        aria-label={`Take quiz for ${rec.habitTitle}`}
                      >
                        Take Quiz &rarr;
                      </button>
                    );
                  } else if (step1Done && !step2Done) {
                    // Case study complete, practical defense incomplete
                    statusPill = (
                      <span className="desk-pill pill-progress">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Rule Ready
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-primary desk-btn-compact"
                        onClick={() => onLaunchRunner(item, false)}
                        aria-label={`Continue to safety rule for ${rec.habitTitle}`}
                      >
                        Read Rule &rarr;
                      </button>
                    );
                  } else if (item.isInProgress) {
                    // Case study in progress
                    statusPill = (
                      <span className="desk-pill pill-progress">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        In Progress
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-primary desk-btn-compact"
                        onClick={() => onLaunchRunner(item, false)}
                        aria-label={`Continue lesson story for ${rec.habitTitle}`}
                      >
                        Continue Story &rarr;
                      </button>
                    );
                  } else {
                    // Unstarted recommended pathway
                    statusPill = (
                      <span className="desk-pill pill-recommended">
                        <span className="desk-pill-dot" aria-hidden="true" />
                        Recommended
                      </span>
                    );
                    ctaButton = (
                      <button
                        type="button"
                        className="btn btn-primary desk-btn-compact"
                        onClick={() => onLaunchRunner(item, false)}
                        aria-label={`Start lesson for ${rec.habitTitle}`}
                      >
                        Start Lesson &rarr;
                      </button>
                    );
                  }

                  return (
                    <div key={idx} className="desk-compact-row">
                      <div className="desk-compact-row-header">
                        <h3 className="desk-compact-title">{rec.habitTitle}</h3>
                        <div className="desk-compact-status">
                          {statusPill}
                        </div>
                      </div>

                      <div className="desk-compact-row-footer">
                        <div className="desk-compact-meta">
                          {rec.estimatedMinutes && <span>~{rec.estimatedMinutes} min</span>}
                          {rec.statutoryReference?.law && (
                            <span>&bull; {rec.statutoryReference.law} {rec.statutoryReference.section || ''}</span>
                          )}
                          {hasCheckpointScore && (
                            <span className="desk-checkpoint-badge">Quiz Score: {checkpointScore}%</span>
                          )}
                        </div>

                        <div className="desk-compact-cta">
                          {ctaButton}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="desk-quiet-empty">No active lessons right now.</p>
            )
          ) : (
            <p className="desk-quiet-empty">
              Complete Your Digital Day to generate your personalized safety lessons.
            </p>
          )}

          <p className="desk-evidence-note">
            Completing a lesson shows what you have studied, not how you will act in every situation.
          </p>
        </section>

        {/* COLUMN 2: KNOWLEDGE PRACTICE */}
        <section className="desk-section desk-col-section" aria-labelledby="practice-heading">
          <div className="desk-section-header">
            <div>
              <h2 id="practice-heading" className="desk-section-title">Law Quizzes</h2>
              <p className="desk-section-sub">Check your understanding of cyber laws and safe practices.</p>
            </div>
            <Link to="/quizzes" className="desk-text-link">
              Explore Quizzes &rarr;
            </Link>
          </div>

          {quizAttemptsList.length > 0 ? (
            <div className="desk-table-container">
              <table className="desk-quiet-table" aria-label="Recent Quiz Practice">
                <thead>
                  <tr>
                    <th scope="col">Quiz</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Score</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizAttemptsList.slice(0, 5).map((qa, idx) => (
                    <tr key={idx}>
                      <td className="desk-table-primary">{qa.quizTitle || 'Cyber Law Quiz'}</td>
                      <td className="desk-table-score" style={{ textAlign: 'center' }}>
                        <span className={`quiz-score-badge ${qa.percentage >= 70 ? 'pass' : 'practice'}`}>
                          {qa.percentage}%
                        </span>
                      </td>
                      <td className="desk-table-date" style={{ textAlign: 'right' }}>{new Date(qa.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {quizAttemptsList.length < 3 && (
                <div className="desk-quiz-suggest-row">
                  <span className="desk-quiz-suggest-text">Practice more topics to test your legal awareness:</span>
                  <Link to="/quizzes" className="btn btn-secondary desk-btn-compact">
                    Browse All Quizzes &rarr;
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="desk-quiet-empty desk-empty-flex">
              <span>No quizzes taken yet.</span>
              <Link to="/quizzes" className="btn btn-secondary desk-btn-compact">
                Take a Quiz &rarr;
              </Link>
            </div>
          )}

          <p className="desk-evidence-note">
            Quiz scores show what you remember about the law, not how you react in real situations.
          </p>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* RECENT EDUCATIONAL EVENTS (COMPACT VERIFIED FEED)                         */}
      {/* ========================================================================= */}
      <section className="desk-section" aria-labelledby="activity-heading">
        <div className="desk-section-header">
          <div>
            <h2 id="activity-heading" className="desk-section-title">Recent Activity</h2>
            <p className="desk-section-sub">A record of your recent lessons, quizzes, and reviews.</p>
          </div>
        </div>

        {displayEvents.length > 0 ? (
          <div className="desk-activity-list" role="feed" aria-label="Recent educational activity">
            {displayEvents.map((evt, idx) => (
              <article key={evt.id || idx} className="desk-activity-item">
                <div className="desk-activity-main">
                  <span className={`desk-activity-badge desk-activity-badge-${evt.type}`}>{evt.badge}</span>
                  <div className="desk-activity-text-group">
                    <span className="desk-activity-title">{evt.title}</span>
                    {evt.context && <span className="desk-activity-subtext">{evt.context}</span>}
                  </div>
                </div>
                <div className="desk-activity-meta">
                  {evt.result && <span className="desk-activity-score">{evt.result}</span>}
                  <time className="desk-activity-date" dateTime={evt.date.toISOString()}>
                    {evt.formattedDate}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="desk-quiet-empty">No recent activity yet.</p>
        )}
      </section>
    </div>
  );
}

export default LearningPracticeSection;
