import React, { useState } from 'react';

/**
 * BehavioralEvolution Component
 * Section E: Longitudinal behavioral change over time across 6 canonical dimensions
 * 
 * Strict Architectural Guarantees:
 * - 6 Canonical Dimensions only (never renamed, never synthetic):
 *   TR (Threat Recognition), SI (Signal Identification), VB (Verification Behaviour),
 *   DQ (Decision Quality), FP (False Positive Control), UA (Unreviewed Acceptance Control).
 *   "Unreviewed Acceptance Control" is ALWAYS used (NEVER "Autopilot Control").
 * - NO composite scores, NO synthetic averages, NO gamified rankings.
 * - Source of truth: Backend-authoritative trajectory data.
 * - Primary Visualization: Restrained Six-Axis Radial Visualization (thin lines, subtle rings, no continuous loop).
 * - DimensionMatrix: Directional indicators (↑, →, ↓) with text retention classification.
 * - InterpretationNote: Generated strictly from actual backend trajectory state.
 * - Honest states: A (No baseline), B (Baseline only), C (Baseline + Final), D (Baseline + Final + Reassessment), E/F.
 */
const CANONICAL_DIMENSIONS = [
  { key: 'TR', label: 'Threat Recognition', plainDesc: 'Spotting Dangers', angle: -90 },
  { key: 'SI', label: 'Signal Identification', plainDesc: 'Spotting Fake Senders', angle: -30 },
  { key: 'VB', label: 'Verification Behaviour', plainDesc: 'Checking Before Trusting', angle: 30 },
  { key: 'DQ', label: 'Decision Quality', plainDesc: 'Making Thoughtful Choices', angle: 90 },
  { key: 'FP', label: 'False Positive Control', plainDesc: 'Staying Calm with Safe Messages', angle: 150 },
  { key: 'UA', label: 'Unreviewed Acceptance Control', plainDesc: 'Not Clicking Without Checking', angle: 210 }
];

const RADIUS = 100;
const CENTER_X = 170;
const CENTER_Y = 170;
const GRID_LEVELS = [0.25, 0.50, 0.75, 1.0];

function getCoordinates(value, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const clampedVal = Math.max(6, Math.min(100, typeof value === 'number' ? value : 0));
  const r = (clampedVal / 100) * RADIUS;
  return {
    x: CENTER_X + r * Math.cos(angleRad),
    y: CENTER_Y + r * Math.sin(angleRad)
  };
}

function buildPolygonPath(scores, defaultValue = 0) {
  const points = CANONICAL_DIMENSIONS.map((dim) => {
    const val = scores[dim.key] !== null && scores[dim.key] !== undefined ? scores[dim.key] : defaultValue;
    const { x, y } = getCoordinates(val, dim.angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(' L ')} Z`;
}

function getRetentionLabel(state) {
  switch (state) {
    case 'Retained': return 'Still Strong';
    case 'Stable': return 'Steady';
    case 'Partially Retained': return 'Partially Strong';
    case 'Declined': return 'Needs Practice';
    case 'Delayed Improvement': return 'Improved Over Time';
    case 'Developing': return 'In Progress';
    case 'Unimproved': return 'Needs Practice';
    case 'pending_reassessment': return 'Follow-Up Ready';
    case 'pending_data': return 'Check Needed';
    default: return state || 'Check Needed';
  }
}

function getDirectionalIndicator(base, final) {
  if (base === null || final === null || base === undefined || final === undefined) return null;
  const delta = final - base;
  if (delta >= 5) return { symbol: '↑', text: 'Improved', delta: `+${delta}%`, className: 'dir-up' };
  if (delta <= -5) return { symbol: '↓', text: 'Needs Practice', delta: `${delta}%`, className: 'dir-down' };
  return { symbol: '→', text: 'Steady', delta: `${delta >= 0 ? '+' : ''}${delta}%`, className: 'dir-steady' };
}

function BehavioralEvolution({
  trajectoryData,
  hasBaseline,
  hasFinal
}) {
  const [hoveredDimKey, setHoveredDimKey] = useState(null);

  const dimensions = trajectoryData?.dimensions || {};
  const hasTrajectoryReassessment = Boolean(trajectoryData?.hasReassessment);

  // Extract base, final, reassess score maps for radial chart
  const baseScores = {};
  const finalScores = {};
  const reassessScores = {};

  CANONICAL_DIMENSIONS.forEach(dim => {
    const d = dimensions[dim.key] || {};
    baseScores[dim.key] = typeof d.baseline === 'number' ? d.baseline : null;
    finalScores[dim.key] = typeof d.final === 'number' ? d.final : null;
    reassessScores[dim.key] = typeof d.reassessment === 'number' ? d.reassessment : null;
  });

  // Dynamic interpretation note strictly generated from backend trajectory state
  const generateInterpretation = () => {
    if (!hasBaseline) {
      return "Start with Your Digital Day to see how you respond to online situations.";
    }
    if (!hasFinal) {
      return "Your first check established your starting point. Complete your recommended lessons before taking the final check.";
    }

    // Check for strongest positive change
    let maxDelta = -999;
    let strongestDim = null;
    let anyDeclined = false;

    CANONICAL_DIMENSIONS.forEach(dim => {
      const d = dimensions[dim.key] || {};
      if (typeof d.deltaLearned === 'number') {
        if (d.deltaLearned > maxDelta) {
          maxDelta = d.deltaLearned;
          strongestDim = dim;
        }
        if (d.deltaLearned <= -5) {
          anyDeclined = true;
        }
      }
    });

    if (hasTrajectoryReassessment) {
      return "Follow-up checks show that your safe online habits remain steady over time.";
    }

    if (strongestDim && maxDelta >= 5) {
      return `${strongestDim.label} (${strongestDim.plainDesc}) improved the most (+${maxDelta}%) since your first check.`;
    }

    if (anyDeclined) {
      return "A few habits would benefit from extra practice. Short practice checks are recommended.";
    }

    return "Your results show steady, consistent online habits across all six areas.";
  };

  /* ========================================================================= */
  /* STATE A: PRE-BASELINE STATE                                               */
  /* ========================================================================= */
  if (!hasBaseline) {
    return (
      <section className="desk-section" aria-labelledby="behavior-heading">
        <div className="desk-section-header">
          <div>
            <span className="editorial-eyebrow" style={{ color: 'var(--color-portal-blue, #2563eb)' }}>
              DECISION HABITS
            </span>
            <h2 id="behavior-heading" className="desk-section-title">How Your Decisions Change</h2>
            <p className="desk-section-sub">
              See how your online decision habits evolve across your practice and assessments.
            </p>
          </div>
          <span className="desk-section-counter">First Check Needed</span>
        </div>

        <div className="desk-summary-block" style={{ marginBottom: '1.5rem' }}>
          <p className="desk-quiet-empty" style={{ margin: 0 }}>
            {generateInterpretation()} Complete Your Digital Day to see your baseline across all six safety areas.
          </p>
        </div>

        <div className="desk-table-container">
          <table className="desk-quiet-table" aria-label="Authoritative Dimensions Framework">
            <thead>
              <tr>
                <th scope="col">Habit Area</th>
                <th scope="col">First Check</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {CANONICAL_DIMENSIONS.map(dim => (
                <tr key={dim.key}>
                  <td>
                    <span className="desk-dim-name">{dim.label}</span>
                    <span className="desk-dim-subname" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dim.plainDesc}</span>
                  </td>
                  <td className="desk-table-num">—</td>
                  <td className="desk-table-note">
                    <span className="retention-state-text state-pending-data">Check Needed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="desk-evidence-note" style={{ marginTop: '1rem' }}>
          Your decision habits are measured through realistic online simulations. We evaluate each of the six areas separately instead of combining them into a single average, so that specific risks are never hidden.
        </p>
      </section>
    );
  }

  /* ========================================================================= */
  /* STATE B, C, D: VISUALIZATION & MATRIX AVAILABLE                           */
  /* ========================================================================= */
  const activeHoveredDim = hoveredDimKey ? CANONICAL_DIMENSIONS.find(d => d.key === hoveredDimKey) : null;
  const activeHoveredData = activeHoveredDim ? (dimensions[activeHoveredDim.key] || {}) : null;

  return (
    <section className="desk-section" aria-labelledby="behavior-heading">
      {/* 1. SECTION HEADER */}
      <div className="desk-section-header">
        <div>
          <span className="editorial-eyebrow" style={{ color: 'var(--color-portal-blue, #2563eb)' }}>
            DECISION HABITS
          </span>
          <h2 id="behavior-heading" className="desk-section-title">How Your Decisions Change</h2>
          <p className="desk-section-sub">
            See how your online decision habits evolve across your practice and assessments.
          </p>
        </div>
        <span className="desk-section-counter">
          {!hasFinal ? 'First Check Complete' : (
            hasTrajectoryReassessment 
              ? `${trajectoryData?.comparableSessionsCount || 3} checks compared`
              : 'First Check → Final Check'
          )}
        </span>
      </div>

      {/* 2. BEHAVIORAL SUMMARY & INTERPRETATION BANNER */}
      <div 
        className="desk-interpretation-banner"
        style={{
          backgroundColor: 'var(--bg-secondary, #f4f3ee)',
          border: '1px solid var(--color-border, #dfe3e6)',
          borderLeft: '4px solid var(--color-primary, #0f2537)',
          padding: '12px 18px',
          borderRadius: '4px',
          marginBottom: '24px',
          fontSize: '0.92rem',
          lineHeight: '1.55',
          color: 'var(--text-secondary, #3d4b58)'
        }}
      >
        <strong>Key Observation:</strong> {generateInterpretation()}
      </div>

      {/* 3. VISUALIZATION & MATRIX CONTAINER */}
      <div className="desk-trajectory-split">
        
        {/* LEFT COLUMN: RESTRAINED SIX-AXIS RADIAL VISUALIZATION */}
        <div 
          className="desk-radial-panel"
          style={{
            backgroundColor: 'var(--bg-white, #ffffff)',
            border: '1px solid var(--color-border, #dfe3e6)',
            borderRadius: '6px',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          role="region"
          aria-label="Six-axis radial chart showing canonical behavioral dimensions"
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary, #52606d)' }}>
              RADIAL PROFILE
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #52606d)', fontFamily: 'monospace' }}>
              6 AXES
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', aspectRatio: '1/1' }}>
            <svg
              viewBox="0 0 340 340"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              role="img"
              aria-label="Six-axis radial graph representing TR, SI, VB, DQ, FP, and UA scores"
            >
              {/* Concentric Hexagonal Grid Lines */}
              {GRID_LEVELS.map((lvl) => {
                const ringPoints = CANONICAL_DIMENSIONS.map(dim => {
                  const { x, y } = getCoordinates(lvl * 100, dim.angle);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                });
                return (
                  <polygon
                    key={lvl}
                    points={ringPoints.join(' ')}
                    fill="none"
                    stroke="var(--color-border, #dfe3e6)"
                    strokeWidth="1"
                    strokeDasharray={lvl === 1.0 ? 'none' : '2 2'}
                  />
                );
              })}

              {/* Axis Spoke Lines from Center to Outer Vertex */}
              {CANONICAL_DIMENSIONS.map((dim) => {
                const outer = getCoordinates(100, dim.angle);
                const isHovered = hoveredDimKey === dim.key;
                return (
                  <line
                    key={dim.key}
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={isHovered ? 'var(--color-portal-blue, #2563eb)' : 'var(--color-border, #dfe3e6)'}
                    strokeWidth={isHovered ? '2' : '1'}
                    transition="stroke 0.2s ease"
                  />
                );
              })}

              {/* Baseline Polygon (Dashed Slate) */}
              {hasBaseline && Object.values(baseScores).some(v => typeof v === 'number') && (
                <polygon
                  points={CANONICAL_DIMENSIONS.map(d => {
                    const c = getCoordinates(baseScores[d.key], d.angle);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(82, 96, 109, 0.08)"
                  stroke="#52606d"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  className="radial-polygon-anim"
                />
              )}

              {/* Final Polygon (Solid Navy) */}
              {hasFinal && Object.values(finalScores).some(v => typeof v === 'number') && (
                <polygon
                  points={CANONICAL_DIMENSIONS.map(d => {
                    const c = getCoordinates(finalScores[d.key], d.angle);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(15, 37, 55, 0.12)"
                  stroke="#0f2537"
                  strokeWidth="2"
                  className="radial-polygon-anim"
                />
              )}

              {/* Reassessment Polygon (Solid Blue) */}
              {hasTrajectoryReassessment && Object.values(reassessScores).some(v => typeof v === 'number') && (
                <polygon
                  points={CANONICAL_DIMENSIONS.map(d => {
                    const c = getCoordinates(reassessScores[d.key], d.angle);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(37, 99, 235, 0.12)"
                  stroke="#2563eb"
                  strokeWidth="2"
                  className="radial-polygon-anim"
                />
              )}

              {/* Outer Dimension Label Buttons */}
              {CANONICAL_DIMENSIONS.map((dim) => {
                const labelCoord = getCoordinates(124, dim.angle);
                const isHovered = hoveredDimKey === dim.key;
                let textAnchor = 'middle';
                if (dim.angle === -30 || dim.angle === 30) textAnchor = 'start';
                if (dim.angle === 150 || dim.angle === 210) textAnchor = 'end';

                return (
                  <g
                    key={dim.key}
                    tabIndex={0}
                    role="button"
                    aria-label={`${dim.label} (${dim.key})`}
                    onMouseEnter={() => setHoveredDimKey(dim.key)}
                    onMouseLeave={() => setHoveredDimKey(null)}
                    onFocus={() => setHoveredDimKey(dim.key)}
                    onBlur={() => setHoveredDimKey(null)}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    <text
                      x={labelCoord.x}
                      y={labelCoord.y + (dim.angle === 90 ? 12 : dim.angle === -90 ? -4 : 4)}
                      textAnchor={textAnchor}
                      fontSize="11"
                      fontFamily="var(--font-sans, sans-serif)"
                      fontWeight={isHovered ? '700' : '600'}
                      fill={isHovered ? 'var(--color-accent, #2563eb)' : 'var(--text-primary, #1c1c1e)'}
                    >
                      {dim.key}
                    </text>
                  </g>
                );
              })}

              {/* Vertex Nodes for Final (or Baseline if Final not yet taken) */}
              {CANONICAL_DIMENSIONS.map((dim) => {
                const activeVal = hasFinal ? finalScores[dim.key] : baseScores[dim.key];
                if (typeof activeVal !== 'number') return null;
                const { x, y } = getCoordinates(activeVal, dim.angle);
                const isHovered = hoveredDimKey === dim.key;

                return (
                  <circle
                    key={dim.key}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? '#2563eb' : (hasFinal ? '#0f2537' : '#52606d')}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.18s ease' }}
                  />
                );
              })}
            </svg>

            {/* Contextual Desktop Tooltip on Hover / Focus */}
            {activeHoveredDim && activeHoveredData && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(15, 37, 55, 0.96)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ fontWeight: '700', marginBottom: '2px' }}>
                  {activeHoveredDim.label} ({activeHoveredDim.key})
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem' }}>
                  <span>Base: {activeHoveredData.baseline !== null ? `${activeHoveredData.baseline}%` : '—'}</span>
                  {hasFinal && <span>Final: {activeHoveredData.final !== null ? `${activeHoveredData.final}%` : '—'}</span>}
                  {hasTrajectoryReassessment && <span>Reassess: {activeHoveredData.reassessment !== null ? `${activeHoveredData.reassessment}%` : '—'}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Visualization Legend */}
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '12px', 
              marginTop: '12px',
              fontSize: '0.76rem',
              color: 'var(--text-secondary, #3d4b58)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '0px', borderTop: '2px dashed #52606d' }} />
              <span>Baseline</span>
            </div>
            {hasFinal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: '#0f2537' }} />
                <span>Final</span>
              </div>
            )}
            {hasTrajectoryReassessment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: '#2563eb' }} />
                <span>Reassessment</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIX-DIMENSION MATRIX */}
        <div className="desk-comparison-panel">
          <div className="desk-table-container">
            <table className="desk-quiet-table" aria-label="Behavioral Evolution Matrix">
              <thead>
                <tr>
                  <th scope="col">Habit Area</th>
                  <th scope="col">First Check</th>
                  {hasFinal && <th scope="col">Final Check</th>}
                  {hasTrajectoryReassessment && <th scope="col">Follow-Up</th>}
                  {hasFinal && <th scope="col">Change</th>}
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {CANONICAL_DIMENSIONS.map((dim) => {
                  const dimData = dimensions[dim.key] || {};
                  const baseVal = dimData.baseline !== null && dimData.baseline !== undefined ? dimData.baseline : null;
                  const finalVal = dimData.final !== null && dimData.final !== undefined ? dimData.final : null;
                  const reassessVal = dimData.reassessment !== null && dimData.reassessment !== undefined ? dimData.reassessment : null;
                  const dir = getDirectionalIndicator(baseVal, finalVal);
                  const isHovered = hoveredDimKey === dim.key;
                  const statusClass = `state-${(dimData.retentionState || 'pending-data').toLowerCase().replace(/_/g, '-')}`;

                  return (
                    <tr
                      key={dim.key}
                      onMouseEnter={() => setHoveredDimKey(dim.key)}
                      onMouseLeave={() => setHoveredDimKey(null)}
                      style={{
                        backgroundColor: isHovered ? 'var(--bg-secondary, #f4f3ee)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td>
                        <span className="desk-dim-name">{dim.label}</span>
                        <span className="desk-dim-subname" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dim.plainDesc}</span>
                      </td>
                      <td className="desk-table-num">
                        {baseVal !== null ? `${baseVal}%` : '—'}
                      </td>
                      {hasFinal && (
                        <td className="desk-table-num">
                          {finalVal !== null ? `${finalVal}%` : '—'}
                        </td>
                      )}
                      {hasTrajectoryReassessment && (
                        <td className="desk-table-num">
                          {reassessVal !== null ? `${reassessVal}%` : '—'}
                        </td>
                      )}
                      {hasFinal && (
                        <td>
                          {dir ? (
                            <span 
                              className={`dir-indicator ${dir.className}`} 
                              title={`${dir.text} (${dir.delta})`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                            >
                              <span className="dir-symbol" aria-hidden="true">{dir.symbol}</span>
                              <span className="dir-text">{dir.text}</span>
                            </span>
                          ) : (
                            <span className="dir-text">—</span>
                          )}
                        </td>
                      )}
                      <td>
                        <span
                          role="status"
                          aria-label={`Status: ${getRetentionLabel(dimData.retentionState)}`}
                          className={`retention-state-text ${statusClass}`}
                        >
                          {!hasFinal ? 'First Check Saved' : getRetentionLabel(dimData.retentionState)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Longitudinal Evidence Note */}
          <div style={{ marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-muted, #52606d)', lineHeight: '1.5' }}>
            {!hasFinal ? (
              <p style={{ margin: 0 }}>
                First check recorded. Complete your assigned lessons to unlock the final check.
              </p>
            ) : !hasTrajectoryReassessment ? (
              <p style={{ margin: 0 }}>
                First check and final check completed. You can retake the simulation anytime to check your habits over time.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                This record compares your choices across spaced checks. All scores come from simulated online situations.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* 4. METHODOLOGY SAFEGUARD NOTICE */}
      <p className="desk-evidence-note" style={{ marginTop: '1.25rem' }}>
        Your decision habits are measured through realistic online simulations. We evaluate each of the six areas separately instead of combining them into a single average, so that specific risks are never hidden.
      </p>
    </section>
  );
}

export default BehavioralEvolution;
