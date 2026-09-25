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
          <span id="history-heading">Session history & methodology</span>
        </summary>
        <div className="desk-disclosure-body">
          <p className="desk-history-lead">
            The portal maintains strict version isolation between historical v1 and active v2 assessments. Longitudinal trajectory pairings require identical scenario models to guarantee measurement integrity.
          </p>

          {/* Session History List */}
          {sessions.length > 0 && (
            <div className="desk-history-sessions">
              <h4 className="desk-history-subheading">Recorded Assessment Sessions</h4>
              <ul className="desk-history-list">
                {sessions.map((sess, idx) => {
                  const stageName = sess.scenarioCode === 'baseline' 
                    ? 'Baseline Diagnostic' 
                    : sess.scenarioCode === 'final' 
                      ? 'Final Adaptive Assessment' 
                      : 'Retention Reassessment';
                  return (
                    <li key={idx} className="desk-history-item">
                      <span className="desk-history-stage">{stageName}</span>
                      <span className="desk-history-version">Model v{sess.scenarioVersion}</span>
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
            <h4 className="desk-history-subheading">Evaluation Methodology</h4>
            <ul className="desk-notes-list">
              <li>
                <strong>Discrete Dimensions:</strong> All six behavioral dimensions are evaluated independently without composite averages, preventing strong habits from masking critical security vulnerabilities.
              </li>
              <li>
                <strong>Evidence Standard:</strong> Quiz practice tests statutory and conceptual recall; simulation decisions observe behavioral habit reflexes under realistic pressure.
              </li>
              <li>
                <strong>Authoritative Classifications:</strong> Longitudinal states (<em>Retained, Stable, Partially Retained, Developing, Delayed Improvement, Declined</em>) are determined by mathematical delta bounds between paired simulation sessions.
              </li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

export default DashboardHistory;
