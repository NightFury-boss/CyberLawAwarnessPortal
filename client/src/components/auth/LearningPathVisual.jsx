import React from 'react';

/**
 * LearningPathVisual Component
 * 
 * Editorial visual representation of the portal's core educational methodology:
 * 01 LAW → 02 REAL SITUATION → 03 VERIFICATION → 04 SAFER ACTION
 * 
 * Rules:
 * - Subtle editorial line work, NOT a technical flowchart or marketing art.
 * - Deep navy lines, four numbered nodes, crisp typography.
 * - Restrained blue accent on the terminal "Safer Action" node.
 * - Responsive: Clean vertical/editorial rhythm on desktop, compact horizontal flow on mobile.
 */
function LearningPathVisual({ isCompact = false }) {
  const steps = [
    {
      num: '01',
      title: 'LAW',
      subtitle: 'Statutory basis',
      detail: 'IT Act & BNS framework'
    },
    {
      num: '02',
      title: 'REAL SITUATION',
      subtitle: 'Digital context',
      detail: 'Everyday online moments'
    },
    {
      num: '03',
      title: 'VERIFICATION',
      subtitle: 'Signal analysis',
      detail: 'Independent signal checks'
    },
    {
      num: '04',
      title: 'SAFER ACTION',
      subtitle: 'Defensive reflex',
      detail: 'Calm, verified decisions',
      isTerminal: true
    }
  ];

  if (isCompact) {
    return (
      <div className="auth-learning-path-compact" aria-label="Portal Learning Methodology">
        <div className="compact-track">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className={`compact-step ${step.isTerminal ? 'terminal' : ''}`}>
                <span className="compact-num">{step.num}</span>
                <span className="compact-name">{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <span className="compact-arrow" aria-hidden="true">&rarr;</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-learning-path" aria-label="Portal Learning Methodology">
      <div className="learning-path-eyebrow">PORTAL METHODOLOGY</div>
      <div className="learning-path-sequence">
        {steps.map((step, idx) => (
          <div 
            key={step.num} 
            className={`path-node-item ${step.isTerminal ? 'terminal-node' : ''}`}
          >
            <div className="node-marker-col">
              <div className="node-dot-wrap">
                <span className="node-dot" />
                <span className="node-num">{step.num}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="node-stem-line" aria-hidden="true" />
              )}
            </div>
            
            <div className="node-text-col">
              <div className="node-title-row">
                <span className="node-title">{step.title}</span>
                <span className="node-subtitle">{step.subtitle}</span>
              </div>
              <p className="node-detail">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningPathVisual;
