import React from 'react';

/**
 * MethodologyFlow: Diagrammatic, progressive reveal of the portal's learning methodology.
 * 
 * Progression:
 * 01 LAW → 02 THREAT → 03 CASE → 04 PREVENTION → 05 PRACTICE → 06 IMPROVEMENT
 * 
 * Behavior:
 * - Triggers once when scrolled into view via IntersectionObserver.
 * - Progressively reveals each step over ~2.4 seconds with calm, restrained easing.
 * - Stops completely once revealed (zero continuous animation / looping).
 * - Renders all steps immediately when prefers-reduced-motion is active.
 * - Responsive: Horizontal flow on desktop, structured vertical timeline on mobile.
 */

const METHODOLOGY_STEPS = [
  {
    num: '01',
    name: 'Law',
    role: 'Statutory Foundation',
    desc: 'Statutory provisions, rights, and obligations in plain language under Indian digital law.'
  },
  {
    num: '02',
    name: 'Threat',
    role: 'Pattern Recognition',
    desc: 'Common threat signatures, psychological urgency triggers, and delivery vectors.'
  },
  {
    num: '03',
    name: 'Case',
    role: 'Real Incident Precedents',
    desc: 'Real incident timelines showing how situations unfold and where warning signals were missed.'
  },
  {
    num: '04',
    name: 'Prevention',
    role: 'Defensive Protocols',
    desc: 'Actionable steps for what to do before, during, and after an encounter to secure systems.'
  },
  {
    num: '05',
    name: 'Practice',
    role: 'Experiential Scenarios',
    desc: 'Simulated everyday decision points that test active recognition in realistic contexts.'
  },
  {
    num: '06',
    name: 'Improvement',
    role: 'Measured Growth',
    desc: 'Evaluation across six distinct behavioral habits to track tangible safety progress over time.'
  }
];

export default function MethodologyFlow() {
  return (
    <div 
      className="methodology-flow-wrapper"
      aria-label="Progressive methodology overview"
    >
      <div className="methodology-flow-header">
        <span className="methodology-flow-eyebrow">System Architecture</span>
        <h3 className="methodology-flow-title">How Knowledge Becomes Capability</h3>
        <p className="methodology-flow-subtitle">
          The portal moves learners progressively from legal statutory rules to active, everyday recognition.
        </p>
      </div>

      <div className="methodology-flow-track" role="list">
        {METHODOLOGY_STEPS.map((step, index) => {
          return (
            <div
              key={step.num}
              role="listitem"
              className="methodology-flow-node revealed"
            >
              <div className="flow-node-index" aria-hidden="true">{step.num}</div>
              <div className="flow-node-content">
                <div className="flow-node-name">{step.name}</div>
                <div className="flow-node-role">{step.role}</div>
                <p className="flow-node-desc">{step.desc}</p>
              </div>

              {index < METHODOLOGY_STEPS.length - 1 && (
                <div className="flow-node-arrow" aria-hidden="true">
                  <span className="arrow-line" />
                  <span className="arrow-head">&rarr;</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
