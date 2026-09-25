import React from 'react';
import { Link } from 'react-router-dom';

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
  onLaunchRunner,
  completedFocusCount = 0,
  totalFocusCount = 0
}) {
  // Synthesize verified educational events from authoritative data
  const recentEvents = [];

  // Add completed pathways
  completedPathwaysList.forEach(p => {
    if (p.completedAt) {
      recentEvents.push({
        type: 'pathway',
        title: `Completed pathway: ${p.pathwayId || 'Defensive Habit'}`,
        score: p.checkpointScore !== null && p.checkpointScore !== undefined ? `${p.checkpointScore}%` : null,
        date: new Date(p.completedAt),
        badge: 'Intervention'
      });
    }
  });

  // Add reinforcements
  reinforcementsList.forEach(r => {
    if (r.completedAt) {
      recentEvents.push({
        type: 'reinforcement',
        title: `Targeted habit reinforcement: ${r.pathwayId || 'Defensive Habit'}`,
        score: r.checkpointScore !== null && r.checkpointScore !== undefined ? `${r.checkpointScore}%` : null,
        date: new Date(r.completedAt),
        badge: 'Reinforcement'
      });
    }
  });

  // Add quiz attempts
  quizAttemptsList.forEach(qa => {
    if (qa.completedAt) {
      recentEvents.push({
        type: 'quiz',
        title: `Quiz evaluation: ${qa.quizTitle || 'Cyber Law Quiz'}`,
        score: `${qa.percentage}%`,
        date: new Date(qa.completedAt),
        badge: 'Knowledge'
      });
    }
  });

  // Sort chronologically descending and take top 4
  recentEvents.sort((a, b) => b.date - a.date);
  const displayEvents = recentEvents.slice(0, 4);

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
              <h2 id="learning-heading" className="desk-section-title">Learning</h2>
              <p className="desk-section-sub">Recommended and completed learning pathways.</p>
            </div>
            {totalFocusCount > 0 && (
              <span className="desk-section-counter">
                {completedFocusCount} of {totalFocusCount} completed
              </span>
            )}
          </div>

          {hasBaseline ? (
            pathwaysWithStatus.length > 0 ? (
              <div className="desk-compact-list">
                {pathwaysWithStatus.map((item, idx) => {
                  const rec = item.rec;
                  const checkpointScore = item.completedRecord?.checkpointScore;
                  const hasCheckpointScore = checkpointScore !== null && checkpointScore !== undefined;

                  return (
                    <div key={idx} className="desk-compact-row">
                      <div className="desk-compact-main">
                        <h3 className="desk-compact-title">{rec.habitTitle}</h3>
                        <div className="desk-compact-meta">
                          {rec.estimatedMinutes && <span>~{rec.estimatedMinutes} min</span>}
                          {rec.statutoryReference?.law && (
                            <span>&bull; {rec.statutoryReference.law} {rec.statutoryReference.section || ''}</span>
                          )}
                          {hasCheckpointScore && (
                            <span className="desk-checkpoint-badge">Passed: {checkpointScore}%</span>
                          )}
                        </div>
                      </div>

                      <div className="desk-compact-aside">
                        <div className="desk-compact-status">
                          {item.isReinforced ? (
                            <span className="desk-pill pill-reinforced">
                              <span className="desk-pill-dot" aria-hidden="true" />
                              Reinforced
                            </span>
                          ) : item.isFullyCompleted ? (
                            <span className="desk-pill pill-completed">
                              <span className="desk-pill-dot" aria-hidden="true" />
                              Completed
                            </span>
                          ) : item.isInProgress ? (
                            <span className="desk-pill pill-progress">
                              <span className="desk-pill-dot" aria-hidden="true" />
                              In progress
                            </span>
                          ) : (
                            <span className="desk-pill pill-recommended">
                              <span className="desk-pill-dot" aria-hidden="true" />
                              Recommended
                            </span>
                          )}
                        </div>

                        <div className="desk-compact-cta">
                          {item.isReinforcementEligible && !item.isReinforced ? (
                            <button
                              type="button"
                              className="btn btn-primary desk-btn-compact btn-reinforce-compact"
                              onClick={() => onLaunchRunner(item, true)}
                              aria-label={`Reinforce habit for ${rec.habitTitle}`}
                            >
                              Reinforce &rarr;
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={item.isFullyCompleted ? "btn btn-secondary desk-btn-compact" : "btn btn-primary desk-btn-compact"}
                              onClick={() => onLaunchRunner(item, false)}
                              aria-label={`${item.isFullyCompleted ? 'Review' : (item.isInProgress ? 'Continue' : 'Start')} pathway for ${rec.habitTitle}`}
                            >
                              {item.isFullyCompleted ? 'Review' : (item.isInProgress ? 'Continue' : 'Start')} &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="desk-quiet-empty">No active learning recommendations.</p>
            )
          ) : (
            <p className="desk-quiet-empty">
              Complete Your Digital Day to generate your personalized learning recommendations.
            </p>
          )}

          <p className="desk-evidence-note">
            Pathway completion records your learning activity.
          </p>
        </section>

        {/* COLUMN 2: KNOWLEDGE PRACTICE */}
        <section className="desk-section desk-col-section" aria-labelledby="practice-heading">
          <div className="desk-section-header">
            <div>
              <h2 id="practice-heading" className="desk-section-title">Practice</h2>
              <p className="desk-section-sub">Verified statutory and conceptual quiz attempts.</p>
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
                    <th scope="col">Score</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {quizAttemptsList.slice(0, 5).map((qa, idx) => (
                    <tr key={idx}>
                      <td className="desk-table-primary">{qa.quizTitle || 'Cyber Law Quiz'}</td>
                      <td className="desk-table-score">{qa.percentage}%</td>
                      <td className="desk-table-date">{new Date(qa.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="desk-quiet-empty desk-empty-flex">
              <span>No verified quiz attempts yet.</span>
              <Link to="/quizzes" className="btn btn-secondary desk-btn-compact">
                Take a Quiz &rarr;
              </Link>
            </div>
          )}

          <p className="desk-evidence-note">
            Quiz practice reflects knowledge recall, not behavioral safety.
          </p>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* RECENT EDUCATIONAL EVENTS (COMPACT VERIFIED FEED)                         */}
      {/* ========================================================================= */}
      <section className="desk-section" aria-labelledby="activity-heading">
        <div className="desk-section-header">
          <div>
            <h2 id="activity-heading" className="desk-section-title">Recent Learning Activity</h2>
            <p className="desk-section-sub">Chronological log of verified educational milestones.</p>
          </div>
        </div>

        {displayEvents.length > 0 ? (
          <div className="desk-activity-list" role="feed" aria-label="Recent educational activity">
            {displayEvents.map((evt, idx) => (
              <article key={idx} className="desk-activity-item">
                <span className="desk-activity-badge">{evt.badge}</span>
                <span className="desk-activity-title">{evt.title}</span>
                {evt.score && <span className="desk-activity-score">{evt.score}</span>}
                <time className="desk-activity-date" dateTime={evt.date.toISOString()}>
                  {evt.date.toLocaleDateString()}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <p className="desk-quiet-empty">No recent learning activity yet.</p>
        )}
      </section>
    </div>
  );
}

export default LearningPracticeSection;
