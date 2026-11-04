import React from 'react';
import { getComparisonBranches } from '../../utils/counterfactualEngine';

/**
 * ComparativeMatrix
 * 
 * Side-by-side synthesis contrasting only the branches that the learner has explored.
 * 
 * INVARIANTS:
 * - Displays ONLY explored choices (filtering out unvisited branches).
 * - Full responsive adaptation: desktop comparative matrix, stacked cards on mobile.
 * - Provides immediate navigation back to timeline or forward to takeaway.
 */
export default function ComparativeMatrix({
  scenario,
  exploredBranchIds = [],
  onReturnToTimeline,
  onRewindToJunction,
  onOpenTakeaway
}) {
  if (!scenario) return null;

  const comparedChoices = getComparisonBranches(exploredBranchIds, scenario);

  return (
    <section className="cf-matrix-section" aria-labelledby="cf-matrix-heading">
      <div className="cf-matrix-header">
        <span className="cf-matrix-badge">Comparative Synthesis</span>
        <h3 id="cf-matrix-heading" className="cf-matrix-title">
          Side-by-Side Outcome Comparison ({comparedChoices.length} Explored Pathways)
        </h3>
        <p className="cf-matrix-subtitle">
          Comparing the causal consequences and legal positions resulting from your explored decisions in this simulation.
        </p>
      </div>

      {/* Desktop / Tablet Matrix Table */}
      <div className="cf-matrix-table-wrap">
        <table className="cf-matrix-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: '20%' }}>Comparison Dimension</th>
              {comparedChoices.map(c => (
                <th key={c.id} scope="col" style={{ width: `${80 / comparedChoices.length}%` }}>
                  <div className="cf-col-header">
                    <span className="cf-col-choice-type">{c.choiceType.replace('-', ' ').toUpperCase()}</span>
                    <span className="cf-col-choice-title">{c.shortAction}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="cf-row-label">Immediate Reaction (0–5 min)</th>
              {comparedChoices.map(c => (
                <td key={c.id} className="cf-cell-content">
                  <div className="cf-cell-lead">{c.consequence.immediateTitle}</div>
                  <p>{c.consequence.immediateBody}</p>
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row" className="cf-row-label">Later Escalation Risk</th>
              {comparedChoices.map(c => (
                <td key={c.id} className="cf-cell-content">
                  <div className="cf-cell-lead">{c.consequence.escalatedTitle}</div>
                  <p>{c.consequence.escalatedBody}</p>
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row" className="cf-row-label">Financial & Account Impact</th>
              {comparedChoices.map(c => (
                <td key={c.id} className="cf-cell-content">
                  <div className="cf-cell-stat">
                    <strong>Financial:</strong> {c.consequence.impactAssessment?.financialExposure}
                  </div>
                  <div className="cf-cell-stat" style={{ marginTop: 6 }}>
                    <strong>Safety:</strong>{' '}
                    <span className={`cf-safety-badge cf-safety-${c.consequence.impactAssessment?.accountSafety?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {c.consequence.impactAssessment?.accountSafety}
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row" className="cf-row-label">Legal Considerations</th>
              {comparedChoices.map(c => (
                <td key={c.id} className="cf-cell-content cf-cell-legal">
                  <p>{c.consequence.impactAssessment?.legalConsiderations}</p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      <div className="cf-matrix-actions-bar">
        <button
          type="button"
          className="cf-btn cf-btn-secondary"
          onClick={onReturnToTimeline}
          aria-label="Return to the active timeline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Timeline
        </button>

        <button
          type="button"
          className="cf-btn cf-btn-outline"
          onClick={onRewindToJunction}
          aria-label="Rewind to decision junction to explore remaining choices"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Rewind to Junction ({3 - comparedChoices.length} Remaining)
        </button>

        <button
          type="button"
          className="cf-btn cf-btn-primary"
          onClick={onOpenTakeaway}
          aria-label="View defensive takeaway and statutory framework"
        >
          View Defensive Takeaway & Law
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </section>
  );
}
