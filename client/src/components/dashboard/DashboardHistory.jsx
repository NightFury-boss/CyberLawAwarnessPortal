import React from 'react';

/**
 * DashboardHistory Component
 * Section F: Secondary progressive disclosure for session history and methodology notes
 * 
 * Philosophy:
 * - Keeps the primary study desk clean and actionable.
 * - Discloses historical assessment sessions, version isolation context, and methodology details.
 * - Does NOT expose internal database IDs, technical stack traces, or formula internals.
 */
function DashboardHistory({
  hasBaseline,
  hasFinal,
  hasTrajectoryReassessment,
  portfolioData,
  trajectoryData
}) {
  const sessions = portfolioData?.behavioralTrajectory?.sessions || [];

  return (
    <section className="desk-section desk-section-borderless" aria-labelledby="history-heading">
      <details className="desk-disclosure">
        <summary className="desk-disclosure-summary">
          <span id="history-heading">Past checks & how we measure habits</span>
        </summary>
        <div className="desk-disclosure-body">
          <p className="desk-history-lead">
            Each check is saved separately to ensure your history remains accurate. We compare checks using matching scenario models so your progress is always measured fairly.
          </p>

          {/* Session History List */}
          {sessions.length > 0 && (
            <div className="desk-history-sessions">
              <h4 className="desk-history-subheading">Completed Checks</h4>
              <ul className="desk-history-list">
                {sessions.map((sess, idx) => {
                  const stageName = sess.scenarioCode === 'baseline' 
                    ? 'First Check (Baseline)' 
                    : sess.scenarioCode === 'final' 
                      ? 'Final Check' 
                      : 'Follow-Up Check';
                  return (
                    <li key={idx} className="desk-history-item">
                      <span className="desk-history-stage">{stageName}</span>
                      <span className="desk-history-version">Version {sess.scenarioVersion}</span>
                      <time className="desk-history-date" dateTime={new Date(sess.completedAt).toISOString()}>
                        {new Date(sess.completedAt).toLocaleDateString()}
                      </time>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="desk-methodology-notes">
            <h4 className="desk-history-subheading">How We Measure Your Habits</h4>
            <ul className="desk-notes-list">
              <li>
                <strong>Six Independent Habits:</strong> Each safety habit is measured on its own rather than averaged together, so a strong area never hides a habit that needs attention.
              </li>
              <li>
                <strong>Knowledge vs. Habits:</strong> Quizzes test your understanding of Indian cyber laws, while scenario stories show how you react to realistic online situations.
              </li>
              <li>
                <strong>Habit Changes Over Time:</strong> Statuses like <em>Still Strong, Steady, Needs Practice, or In Progress</em> are calculated directly by comparing your choices across completed checks.
              </li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

export default DashboardHistory;
