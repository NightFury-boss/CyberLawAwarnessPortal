import React from 'react';

/**
 * DecisionJunction
 * 
 * Renders the 3-way decision prompt and interactive choice cards.
 * 
 * FEATURES:
 * - Semantic buttons with visible focus states.
 * - Distinct styling for compliance, inaction, and active verification.
 * - Persistent "Explored" indicator for branches already visited in this session.
 */
export default function DecisionJunction({
  decisionJunction,
  exploredBranchIds = [],
  onSelectChoice
}) {
  if (!decisionJunction || !Array.isArray(decisionJunction.choices)) return null;

  const getChoiceTypeMeta = (type) => {
    switch (type) {
      case 'reflexive-compliance':
        return {
          pillClass: 'cf-pill-compliance',
          label: 'Branch A: Reflexive Compliance'
        };
      case 'passive-inaction':
        return {
          pillClass: 'cf-pill-inaction',
          label: 'Branch B: Passive Inaction'
        };
      case 'active-verification':
        return {
          pillClass: 'cf-pill-verification',
          label: 'Branch C: Active Verification'
        };
      default:
        return {
          pillClass: 'cf-pill-default',
          label: 'Alternative Branch'
        };
    }
  };

  return (
    <section className="cf-junction-section" aria-labelledby="cf-junction-heading">
      <div className="cf-junction-header">
        <span className="cf-junction-badge">Decision Junction</span>
        <h3 id="cf-junction-heading" className="cf-junction-prompt">
          {decisionJunction.prompt}
        </h3>
        <p className="cf-junction-instruction">
          Select one of the three decision pathways to inspect its immediate reaction, causal progression, and legal considerations. You can rewind and explore alternative branches at any time.
        </p>
      </div>

      <div className="cf-choices-grid">
        {decisionJunction.choices.map((choice, index) => {
          const isExplored = exploredBranchIds.includes(choice.id);
          const meta = getChoiceTypeMeta(choice.choiceType);

          return (
            <button
              key={choice.id}
              type="button"
              className={`cf-choice-card ${meta.pillClass} ${isExplored ? 'cf-choice-explored' : ''}`}
              onClick={() => onSelectChoice(choice.id)}
              aria-label={`${meta.label}: ${choice.label}`}
            >
              <div className="cf-choice-topbar">
                <span className="cf-choice-tag">{meta.label}</span>
                {isExplored && (
                  <span className="cf-explored-badge" title="You have already explored this branch in this session">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Explored
                  </span>
                )}
              </div>

              <div className="cf-choice-body">
                <span className="cf-choice-number">0{index + 1}</span>
                <p className="cf-choice-label">{choice.label}</p>
              </div>

              <div className="cf-choice-footer">
                <span className="cf-choice-action-indicator">
                  Explore Consequence
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
