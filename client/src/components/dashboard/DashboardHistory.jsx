import React from 'react';

/**
 * DashboardHistory Component
 * Section F: Secondary progressive disclosure for session history and methodology notes
 * 
 * Philosophy:
 * - Keeps the primary study desk clean, purposeful, and actionable.
 * - Discloses historical assessment sessions, version isolation context, and methodology details on demand.
 * - Does NOT expose internal database IDs, stack traces, or formula internals.
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
    <section className="atelier-archive-drawer desk-archive-box" aria-labelledby="history-heading">
      <details className="desk-disclosure">
        <summary className="atelier-archive-summary desk-archive-summary">
          <span id="history-heading">▸ Past Assessment Sessions &amp; Methodology Archive</span>
        </summary>
        <div className="desk-archive-body">
          <p style={{ margin: '0 0 14px 0', color: 'var(--text-secondary, #56565c)' }}>
            Each assessment session is recorded immutably under strict version isolation. Longitudinal progress is calculated only across comparable scenario versions to ensure rigorous measurement validity.
          </p>

          {/* Session History List */}
          {sessions.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-navy, #0f2537)' }}>
                Recorded Checkpoints
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sessions.map((sess, idx) => {
                  const stageName = sess.scenarioCode === 'baseline' 
                    ? 'First Check (Your Digital Day)' 
                    : sess.scenarioCode === 'final' 
                      ? 'Final Check' 
                      : 'Retention Follow-Up';
                  return (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-primary, #fbfbf9)',
                        border: '1px solid var(--color-border, #e6e5e0)',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--accent-navy, #0f2537)' }}>{stageName}</span>
                      <span style={{ color: 'var(--text-muted, #8b8b93)', fontSize: '0.74rem' }}>
                        Scenario Model v{sess.scenarioVersion || 1} • {new Date(sess.completedAt).toLocaleDateString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div style={{ borderTop: '1px dashed var(--color-border, #e6e5e0)', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-navy, #0f2537)' }}>
              Methodological Commitments
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary, #56565c)' }}>
              <li>
                <strong>Six Canonical Habits:</strong> Each safety habit (TR, SI, VB, DQ, FP, UA) is measured independently, avoiding deceptive composite scores.
              </li>
              <li>
                <strong>Knowledge vs. Reflex:</strong> Statutory quizzes evaluate knowledge of primary legislation, whereas assessment simulations measure instinctive reaction under pressure.
              </li>
              <li>
                <strong>Version Isolation:</strong> Completed sessions are immutable; improvements are tracked through longitudinal differential analysis.
              </li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

export default DashboardHistory;
