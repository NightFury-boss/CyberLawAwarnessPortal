import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PathwayRunner from './PathwayRunner';

/**
 * RemediationCards Component
 * 
 * Server-authoritative presentation of targeted cyber-safety micro-learning pathways.
 * Displays habit focus areas, practical defensive rules, and educational legal context.
 * Phase 4: Integrates 3-step PathwayRunner with Start / In Progress / Completed status.
 * 
 * NON-NEGOTIABLE DESIGN CONSTRAINTS:
 * - Presentation only; all pathway ranking and legal validation is computed server-side.
 * - Calm, educational language. Never accuse user habits of being statutory violations.
 * - Never displays raw scores, severity weights, or composite metrics.
 */
function RemediationCards({ sessionId, initialData = null, initialProgress = null }) {
  const [data, setData] = useState(initialData);
  const [userProgress, setUserProgress] = useState(initialProgress);
  const [loading, setLoading] = useState(!initialData && Boolean(sessionId));
  const [error, setError] = useState('');
  const [activePathwayForRunner, setActivePathwayForRunner] = useState(null);

  const fetchProgress = async () => {
    try {
      const prog = await api.getProgress();
      setUserProgress(prog);
    } catch (e) {
      // Non-critical if fails
    }
  };

  useEffect(() => {
    if (!initialProgress) {
      fetchProgress();
    }
  }, [initialProgress]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    if (!sessionId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchRemediation = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getAssessmentRemediation(sessionId);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load habit focus recommendations.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRemediation();

    return () => {
      isMounted = false;
    };
  }, [sessionId, initialData]);

  if (loading) {
    return (
      <div className="remediation-section" style={{ padding: 'var(--space-md) 0' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading habit focus recommendations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="remediation-section" style={{ padding: 'var(--space-md) 0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{error}</p>
      </div>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  const assessmentType = data.assessmentType || data.userState;
  const focusSummary = data.focusSummary;
  const recommendations = data.recommendations || [];

  const getShiftBadgeLabel = (shiftState) => {
    switch (shiftState) {
      case 'consolidated_strength':
        return 'Consolidated Strength';
      case 'continued_practice':
        return 'Continued Practice';
      case 'emerging_gap':
        return 'Emerging Habit Focus';
      case 'mastery':
        return 'Habit Mastery';
      default:
        return null;
    }
  };

  return (
    <section className="remediation-section" aria-labelledby="remediation-heading" style={{ marginTop: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
      <div style={{ borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px', marginBottom: 'var(--space-md)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {assessmentType === 'final' ? 'Post-Assessment Guidance' : 'Recommended Learning Path'}
        </span>
        <h3 id="remediation-heading" style={{ fontSize: '1.4rem', color: 'var(--accent-navy)', margin: '4px 0 6px 0' }}>
          Recommended Habit Focus Areas
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
          {focusSummary || 'Targeted micro-learning pathways designed to strengthen routine digital habits and explore relevant legal context.'}
        </p>
      </div>

      <div className="remediation-grid">
        {recommendations.map((rec, index) => {
          const shiftState = rec.habitShiftState || rec.state;
          const shiftLabel = rec.stateBadge || (shiftState ? getShiftBadgeLabel(shiftState) : null);
          const shiftSummary = rec.shiftSummary || rec.stateMessage;

          const completedRecord = (userProgress?.completedPathways || []).find(
            p => p.pathwayId === rec.pathwayId && (sessionId ? (p.sourceSessionId === sessionId || p.sourceSessionId?._id === sessionId) : true)
          );
          const isFullyCompleted = Boolean(completedRecord?.completedAt);
          const isInProgress = !isFullyCompleted && Boolean(completedRecord && (completedRecord.stepsCompleted?.caseStudy || completedRecord.stepsCompleted?.prevention));

          const reinforcementRecord = (userProgress?.reinforcementsCompleted || []).find(
            r => r.pathwayId === rec.pathwayId && (sessionId ? (r.sourceSessionId === sessionId || r.sourceSessionId?._id === sessionId) : true)
          );
          const isReinforced = Boolean(reinforcementRecord);
          const isReinforcementEligible = shiftState === 'continued_practice' || shiftState === 'emerging_gap';

          return (
            <div key={index} className="remediation-card">
              <div>
                {/* Meta Row: Focus Tag, Time, Difficulty, Shift State, Completion Badge */}
                <div className="remediation-meta-row">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--accent-navy)',
                      backgroundColor: 'var(--accent-navy-light)',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      letterSpacing: '0.5px'
                    }}>
                      Habit Focus
                    </span>
                    {rec.difficulty && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rec.difficulty}
                      </span>
                    )}
                    {rec.estimatedMinutes && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        &bull; ~{rec.estimatedMinutes} min
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {isReinforced ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#1e3a8a',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '2px 8px',
                        borderRadius: '3px'
                      }}>
                        Reinforced &#10003;
                      </span>
                    ) : isFullyCompleted ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#065f46',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: '3px'
                      }}>
                        Completed &#10003;
                      </span>
                    ) : isInProgress ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: '#92400e',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        padding: '2px 8px',
                        borderRadius: '3px'
                      }}>
                        In Progress
                      </span>
                    ) : null}

                    {shiftLabel && (
                      <span className={`remediation-state-pill ${shiftState}`}>
                        {shiftLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Habit Title */}
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '8px 0 6px 0', fontWeight: '700' }}>
                  {rec.habitTitle}
                </h4>

                {/* Pedagogical Focus / Why This Matters */}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 var(--space-sm) 0' }}>
                  {rec.pedagogicalFocus}
                </p>

                {/* Practical Defensive Rule */}
                {rec.coreRule && (
                  <div className="remediation-rule-box">
                    <strong>Practical Rule:</strong>
                    {rec.coreRule}
                  </div>
                )}

                {/* Final Assessment Observed Shift Context */}
                {shiftSummary && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: '0 0 var(--space-sm) 0' }}>
                    {shiftSummary}
                  </p>
                )}

                {/* Legal Context Section (Optional) */}
                {rec.legalReferences && rec.legalReferences.length > 0 ? (
                  <div className="remediation-legal-box">
                    <div style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-navy)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      Relevant Legal Context
                    </div>
                    {rec.legalReferences.map((ref, rIdx) => (
                      <div key={rIdx} style={{ marginBottom: rIdx < rec.legalReferences.length - 1 ? '8px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                          <span className="remediation-legal-badge">
                            {ref.act} &bull; {ref.section}
                          </span>
                          {ref.status === 'ENACTED_FUTURE_COMMENCEMENT' && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              color: '#92400e',
                              backgroundColor: '#fef3c7',
                              padding: '1px 6px',
                              borderRadius: '2px',
                              border: '1px solid #fde68a'
                            }}>
                              Enacted &mdash; Future Commencement
                            </span>
                          )}
                        </div>
                        {ref.status === 'ENACTED_FUTURE_COMMENCEMENT' && ref.commencementNote && (
                          <div style={{ fontSize: '0.72rem', color: '#b45309', margin: '2px 0 4px 0' }}>
                            {ref.commencementNote}
                          </div>
                        )}
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                          {ref.educationalContext || ref.attribution}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginBottom: 'var(--space-md)',
                    padding: '4px 8px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '3px'
                  }}>
                    Practical cyber-safety habit &bull; Focuses on defensive hygiene rather than a statutory offence provision.
                  </div>
                )}
              </div>

              {/* Action CTA */}
              <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px dashed var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isReinforcementEligible ? (
                  <button
                    onClick={() => setActivePathwayForRunner({ ...rec, _isReinforcement: true })}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '0.88rem',
                      padding: '9px 12px',
                      backgroundColor: isReinforced ? 'var(--accent-navy)' : '#b45309',
                      borderColor: isReinforced ? 'var(--accent-navy)' : '#b45309',
                      color: '#fff',
                      fontWeight: '600'
                    }}
                  >
                    {isReinforced ? 'Reinforce Defensive Habit (Review \u2713)' : 'Reinforce Defensive Habit \u2192'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActivePathwayForRunner(rec)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      padding: '8px 12px'
                    }}
                  >
                    {isFullyCompleted ? 'Review Learning Pathway \u2713' : (isInProgress ? 'Continue Learning Pathway \u2192' : 'Start Learning Pathway \u2192')}
                  </button>
                )}

                {rec.actionRoute && (
                  <Link
                    to={rec.actionRoute}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      textDecoration: 'underline'
                    }}
                  >
                    View standalone reference ({rec.actionLabel || 'Case Study / Guide'})
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activePathwayForRunner && (
        <PathwayRunner
          pathway={activePathwayForRunner}
          sourceSessionId={sessionId || userProgress?.latestSessionId}
          isReinforcementMode={Boolean(activePathwayForRunner._isReinforcement)}
          initialProgress={{
            ...(userProgress?.completedPathways || []).find(
              p => p.pathwayId === activePathwayForRunner.pathwayId && (sessionId ? (p.sourceSessionId === sessionId || p.sourceSessionId?._id === sessionId) : true)
            ),
            isReinforced: (userProgress?.reinforcementsCompleted || []).some(
              r => r.pathwayId === activePathwayForRunner.pathwayId && (sessionId ? (r.sourceSessionId === sessionId || r.sourceSessionId?._id === sessionId) : true)
            )
          }}
          onClose={() => setActivePathwayForRunner(null)}
          onPathwayCompleted={async () => {
            await fetchProgress();
          }}
        />
      )}
    </section>
  );
}

export default RemediationCards;
