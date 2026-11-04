import React from 'react';

/**
 * ConsequenceTimeline
 * 
 * Renders the two-phase causal consequence progression for the selected decision branch:
 * Phase 1: Immediate Reaction & Exploit Mechanisms (0-5 mins)
 * Phase 2: Potential Later Escalation & Impact Assessment (Hours / Days)
 * 
 * Action Toolbar:
 * - Rewind to Decision Junction (preserves explored branch state)
 * - Compare Explored Outcomes (unlocked when exploredBranchIds.length >= 2)
 * - View Defensive Takeaway & Law
 */
export default function ConsequenceTimeline({
  choice,
  exploredBranchIds = [],
  onRewind,
  onOpenComparison,
  onOpenTakeaway
}) {
  if (!choice || !choice.consequence) return null;

  const { consequence, shortAction, choiceType } = choice;
  const canCompare = exploredBranchIds.length >= 2;

  const getBranchBadge = () => {
    switch (choiceType) {
      case 'reflexive-compliance':
        return { label: 'Path: Reflexive Compliance', badgeClass: 'cf-badge-compliance' };
      case 'passive-inaction':
        return { label: 'Path: Passive Inaction', badgeClass: 'cf-badge-inaction' };
      case 'active-verification':
        return { label: 'Path: Active Verification', badgeClass: 'cf-badge-verification' };
      default:
        return { label: 'Explored Path', badgeClass: 'cf-badge-default' };
    }
  };

  const branchMeta = getBranchBadge();

  return (
    <article className="cf-timeline-article" aria-labelledby="cf-timeline-heading">
      {/* Active Branch Header */}
      <div className="cf-timeline-header">
        <div className="cf-branch-indicator">
          <span className={`cf-branch-pill ${branchMeta.badgeClass}`}>{branchMeta.label}</span>
          <span className="cf-branch-action">"{shortAction}"</span>
        </div>
        <h3 id="cf-timeline-heading" className="cf-timeline-title">
          Causal Consequence Progression
        </h3>
      </div>

      {/* Sequential Two-Phase Timeline */}
      <div className="cf-timeline-track">
        {/* Phase 1: Immediate Reaction */}
        <section className="cf-timeline-node cf-node-immediate" aria-labelledby="cf-immediate-title">
          <div className="cf-node-marker">
            <span className="cf-node-step">01</span>
            <div className="cf-node-line"></div>
          </div>
          <div className="cf-node-content">
            <div className="cf-node-eyebrow">Immediate Reaction (0–5 Minutes)</div>
            <h4 id="cf-immediate-title" className="cf-node-heading">
              {consequence.immediateTitle}
            </h4>
            <p className="cf-node-body">{consequence.immediateBody}</p>

            {/* Why It Happened Breakdown */}
            {consequence.whyItHappened && (
              <div className="cf-mechanism-grid">
                <div className="cf-mechanism-card">
                  <div className="cf-mechanism-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    Technical Exploit Vector
                  </div>
                  <p className="cf-mechanism-text">{consequence.whyItHappened.technicalFactor}</p>
                </div>

                <div className="cf-mechanism-card">
                  <div className="cf-mechanism-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                      <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                    </svg>
                    Psychological Pressure
                  </div>
                  <p className="cf-mechanism-text">{consequence.whyItHappened.psychologicalFactor}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Phase 2: Potential Later Escalation */}
        <section className="cf-timeline-node cf-node-escalated" aria-labelledby="cf-escalated-title">
          <div className="cf-node-marker">
            <span className="cf-node-step">02</span>
          </div>
          <div className="cf-node-content">
            <div className="cf-node-eyebrow">Potential Later Escalation (Hours / Days)</div>
            <h4 id="cf-escalated-title" className="cf-node-heading">
              {consequence.escalatedTitle}
            </h4>
            <p className="cf-node-body">{consequence.escalatedBody}</p>

            {/* Impact Assessment Ledger */}
            {consequence.impactAssessment && (
              <div className="cf-impact-ledger">
                <div className="cf-ledger-header">Impact Assessment Ledger</div>
                <div className="cf-ledger-row">
                  <span className="cf-ledger-label">Financial Exposure</span>
                  <span className="cf-ledger-value">{consequence.impactAssessment.financialExposure}</span>
                </div>
                <div className="cf-ledger-row">
                  <span className="cf-ledger-label">Account Safety</span>
                  <span className={`cf-safety-badge cf-safety-${consequence.impactAssessment.accountSafety.toLowerCase().replace(/\s+/g, '-')}`}>
                    {consequence.impactAssessment.accountSafety}
                  </span>
                </div>
                <div className="cf-ledger-row cf-ledger-legal">
                  <span className="cf-ledger-label">Legal Considerations</span>
                  <span className="cf-ledger-value">{consequence.impactAssessment.legalConsiderations}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Action Toolbar */}
      <div className="cf-timeline-actions-bar">
        <button
          type="button"
          className="cf-btn cf-btn-secondary"
          onClick={onRewind}
          aria-label="Rewind to decision junction to test alternative choices"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Rewind to Decision Junction
        </button>

        <div className="cf-actions-right">
          {canCompare && (
            <button
              type="button"
              className="cf-btn cf-btn-outline"
              onClick={onOpenComparison}
              aria-label="Open side-by-side comparison of explored branches"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Compare Explored Paths ({exploredBranchIds.length}/3)
            </button>
          )}

          <button
            type="button"
            className="cf-btn cf-btn-primary"
            onClick={onOpenTakeaway}
            aria-label="Proceed to defensive takeaway and statutory framework"
          >
            View Defensive Takeaway & Law
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
