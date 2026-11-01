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
      return "Your first check established your starting baseline. Complete your recommended lessons before taking the final check.";
    }

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
      return "A few habits would benefit from extra practice. Short targeted practice checks are recommended.";
    }

    return "Your results show steady, consistent online habits across all six areas.";
  };

  /* ========================================================================= */
  /* STATE A: PRE-BASELINE BLUEPRINT                                           */
  /* ========================================================================= */
  if (!hasBaseline) {
    return (
      <section className="atelier-behavioral-studio desk-behavioral-studio" aria-labelledby="behavior-heading">
        <div className="behavioral-studio-header">
          <div className="desk-panel-header">
            <div>
              <span className="desk-panel-eyebrow">Decision Habits Blueprint</span>
              <h2 id="behavior-heading" className="desk-panel-title">
                Six Discrete Behavioral Dimensions
              </h2>
              <p className="desk-panel-sub">
                We evaluate your instinctive choices across six independent behavioral areas rather than averaging them into a single score.
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 10px', borderRadius: '4px' }}>
              First Check Needed
            </span>
          </div>
        </div>

        <div className="behavioral-narrative-note" style={{ marginBottom: '20px' }}>
          <strong>How it works:</strong> {generateInterpretation()} In <em>Your Digital Day</em>, you navigate realistic dilemmas under simulated time pressure.
        </div>

        <div className="behavioral-dimension-grid">
          {CANONICAL_DIMENSIONS.map(dim => (
            <div key={dim.key} className="dimension-cell">
              <div className="dimension-cell-header">
                <span className="dimension-cell-name">{dim.label}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #8b8b93)', fontFamily: 'monospace' }}>
                  {dim.key}
                </span>
              </div>
              <span className="dimension-cell-plain">{dim.plainDesc}</span>
              <div className="dimension-cell-footer">
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #8b8b93)' }}>Baseline: —</span>
                <span className="dimension-status-badge">Check Needed</span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted, #8b8b93)', fontStyle: 'italic', margin: '16px 0 0 0' }}>
          Each habit is measured independently so that a high score in one area never conceals a dangerous blindspot in another.
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
    <section className="atelier-behavioral-studio desk-behavioral-studio" aria-labelledby="behavior-heading">
      {/* 1. Header */}
      <div className="behavioral-studio-header">
        <div className="desk-panel-header">
          <div>
            <span className="desk-panel-eyebrow">Behavioral Development Studio</span>
            <h2 id="behavior-heading" className="desk-panel-title">
              How Your Decisions Evolve
            </h2>
            <p className="desk-panel-sub">
              Longitudinal habit shifts measured across realistic online dilemmas.
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-navy, #0f2537)', backgroundColor: 'var(--bg-secondary, #f4f3ee)', padding: '4px 10px', borderRadius: '4px' }}>
            {!hasFinal ? 'Baseline Established' : (hasTrajectoryReassessment ? `${trajectoryData?.comparableSessionsCount || 3} Checks Compared` : 'Baseline → Final')}
          </span>
        </div>
      </div>

      {/* 2. Key Observation */}
      <div className="behavioral-narrative-note" style={{ marginBottom: '24px' }}>
        <strong>Key Observation:</strong> {generateInterpretation()}
      </div>

      {/* 3. Split Layout: Radial Visualization & Matrix */}
      <div className="behavioral-atelier-grid behavioral-studio-layout">
        {/* Radial Map */}
        <div className="behavioral-chart-box">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted, #8b8b93)' }}>
              Radial Profile
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b8b93)', fontFamily: 'monospace' }}>
              6 Canonical Axes
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px', aspectRatio: '1/1' }}>
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
                    stroke="var(--color-border, #e6e5e0)"
                    strokeWidth="1"
                    strokeDasharray={lvl === 1.0 ? 'none' : '2 2'}
                  />
                );
              })}

              {/* Axis Spoke Lines */}
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
                    stroke={isHovered ? 'var(--color-primary, #2563eb)' : 'var(--color-border, #e6e5e0)'}
                    strokeWidth={isHovered ? '2' : '1'}
                  />
                );
              })}

              {/* Baseline Polygon (Dashed Charcoal) */}
              {hasBaseline && Object.values(baseScores).some(v => typeof v === 'number') && (
                <polygon
                  points={CANONICAL_DIMENSIONS.map(d => {
                    const c = getCoordinates(baseScores[d.key], d.angle);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(99, 91, 83, 0.08)"
                  stroke="#635B53"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  className="radial-polygon-anim"
                />
              )}

              {/* Final Polygon (Solid Espresso) */}
              {hasFinal && Object.values(finalScores).some(v => typeof v === 'number') && (
                <polygon
                  points={CANONICAL_DIMENSIONS.map(d => {
                    const c = getCoordinates(finalScores[d.key], d.angle);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(48, 43, 39, 0.12)"
                  stroke="#302B27"
                  strokeWidth="2"
                  className="radial-polygon-anim"
                />
              )}

              {/* Reassessment Polygon (Solid Terracotta) */}
              {hasTrajectoryReassessment && Object.values(reassessScores).some(v => typeof v === 'number') && (
                <polygon
                  points={CANONICAL_DIMENSIONS.map(d => {
                    const c = getCoordinates(reassessScores[d.key], d.angle);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(166, 95, 69, 0.12)"
                  stroke="#A65F45"
                  strokeWidth="2"
                  className="radial-polygon-anim"
                />
              )}

              {/* Axis Labels */}
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
                      fill={isHovered ? 'var(--color-accent-terracotta, #A65F45)' : 'var(--color-text-primary, #302B27)'}
                    >
                      {dim.key}
                    </text>
                  </g>
                );
              })}

              {/* Vertex Nodes */}
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
                    fill={isHovered ? '#A65F45' : (hasFinal ? '#302B27' : '#635B53')}
                    stroke="#FCFAF5"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {activeHoveredDim && activeHoveredData && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(48, 43, 39, 0.95)',
                  color: '#FCFAF5',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.76rem',
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {activeHoveredDim.label} ({activeHoveredDim.key})
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', marginTop: '2px' }}>
                  <span>Base: {activeHoveredData.baseline !== null ? `${activeHoveredData.baseline}%` : '—'}</span>
                  {hasFinal && <span>Final: {activeHoveredData.final !== null ? `${activeHoveredData.final}%` : '—'}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="behavioral-chart-legend">
            <div>
              <span className="legend-swatch" style={{ backgroundColor: '#635B53' }} />
              <span>Baseline</span>
            </div>
            {hasFinal && (
              <div>
                <span className="legend-swatch" style={{ backgroundColor: '#302B27' }} />
                <span>Final</span>
              </div>
            )}
            {hasTrajectoryReassessment && (
              <div>
                <span className="legend-swatch" style={{ backgroundColor: '#A65F45' }} />
                <span>Follow-Up</span>
              </div>
            )}
          </div>
        </div>

        {/* Dimension Matrix Grid */}
        <div className="behavioral-matrix-box">
          <div className="behavioral-dimension-grid">
            {CANONICAL_DIMENSIONS.map((dim) => {
              const dimData = dimensions[dim.key] || {};
              const baseVal = dimData.baseline !== null && dimData.baseline !== undefined ? dimData.baseline : null;
              const finalVal = dimData.final !== null && dimData.final !== undefined ? dimData.final : null;
              const dir = getDirectionalIndicator(baseVal, finalVal);
              const isHovered = hoveredDimKey === dim.key;

              return (
                <div
                  key={dim.key}
                  className="dimension-cell"
                  onMouseEnter={() => setHoveredDimKey(dim.key)}
                  onMouseLeave={() => setHoveredDimKey(null)}
                  style={{
                    backgroundColor: isHovered ? 'var(--color-surface-secondary, #EFE8DC)' : 'var(--color-surface-card, #FCFAF5)'
                  }}
                >
                  <div className="dimension-cell-header">
                    <span className="dimension-cell-name">{dim.label}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted, #8b8b93)' }}>
                      {dim.key}
                    </span>
                  </div>
                  <span className="dimension-cell-plain">{dim.plainDesc}</span>
                  <div className="dimension-cell-footer">
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #56565c)' }}>
                      {hasFinal ? `${baseVal ?? '—'}% → ${finalVal ?? '—'}%` : `Score: ${baseVal ?? '—'}%`}
                    </span>
                    <span className="dimension-status-badge">
                      {hasFinal ? (dir ? `${dir.symbol} ${dir.text}` : 'Steady') : 'Baseline Saved'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ margin: '8px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted, #8b8b93)' }}>
            Each habit is evaluated separately from simulated actions. Scores reflect how you reacted under pressure, not legal test answers.
          </p>
        </div>
      </div>
    </section>
  );
}

export default BehavioralEvolution;
