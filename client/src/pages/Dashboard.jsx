import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PathwayRunner from '../components/PathwayRunner';

/**
 * Dashboard Component — Academic Learning Record
 * 
 * Design Principles:
 * - Restrained, academic learning record and personal journey.
 * - Zero gamification, badges, trophy icons, achievement unlocks, XP, or levels.
 * - Restrained typography, subtle rules, and supportive (not dominant) status colors.
 * - Pedagogical boundary enforcement: learning completion != behavioral mastery != quiz recall.
 * - Information Hierarchy:
 *   1. Page Header (Learning Journey Overview)
 *   2. Current Focus / Next Action (single clear primary CTA)
 *   3. Learning Progress (compact pathway rows with calm status)
 *   4. Knowledge Practice (strictly verified statutory quiz attempts)
 *   5. Behavioral Evolution (academically rigorous 6-dimension discrete matrix)
 *   6. Assessment Record & Methodology (collapsible session history)
 */
function Dashboard({ user, progressTrigger }) {
  const [progress, setProgress] = useState(null);
  const [remediationData, setRemediationData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePathwayForRunner, setActivePathwayForRunner] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [user, progressTrigger]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prog, port, traj] = await Promise.all([
        api.getProgress(),
        api.getPortfolio().catch(() => null),
        api.getTrajectory().catch(() => null)
      ]);

      setProgress(prog);
      setPortfolioData(port);
      setTrajectoryData(traj);

      if (prog?.latestSessionId) {
        try {
          const rem = await api.getAssessmentRemediation(prog.latestSessionId);
          setRemediationData(rem);
        } catch (re) {
          // Non-blocking
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load your learning record.');
    } finally {
      setLoading(false);
    }
  };

  const getRetentionLabel = (state) => {
    switch (state) {
      case 'Retained': return 'Retained';
      case 'Stable': return 'Stable';
      case 'Partially Retained': return 'Partially Retained';
      case 'Declined': return 'Declined';
      case 'Delayed Improvement': return 'Delayed Improvement';
      case 'Developing': return 'Developing';
      case 'Unimproved': return 'Unimproved';
      case 'pending_reassessment': return 'Pending Reassessment';
      case 'pending_data': return 'Pending Data';
      default: return state || 'Pending Data';
    }
  };

  if (loading) {
    return (
      <div className="container page-entry" style={{ padding: 'var(--space-xxl) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading your learning record...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}>
        <div className="alert alert-error" role="alert">{error}</div>
      </div>
    );
  }

  if (!progress) return null;

  const hasBaseline = progress.baselineScore !== null;
  const hasFinal = progress.finalScore !== null;
  const isV2Baseline = Boolean(progress.baselineVersion && progress.baselineVersion >= 2) || Boolean(progress.baselineBehaviourScores);

  const completedPathwaysList = portfolioData?.interventions?.completedPathways || progress.completedPathways || [];
  const reinforcementsList = portfolioData?.interventions?.reinforcementsCompleted || progress.reinforcementsCompleted || [];
  const quizAttemptsList = portfolioData?.knowledgePractice?.quizAttempts || [];
  const trajectoryDimensions = trajectoryData?.dimensions || {};
  const hasTrajectoryReassessment = Boolean(trajectoryData?.hasReassessment);

  // Derive Pathway Recommendation Statuses
  const recommendations = remediationData?.recommendations || [];
  const pathwaysWithStatus = recommendations.map(rec => {
    const completedRecord = completedPathwaysList.find(
      p => p.pathwayId === rec.pathwayId && (progress?.latestSessionId ? (p.sourceSessionId === progress.latestSessionId || p.sourceSessionId?._id === progress.latestSessionId) : true)
    );
    const isFullyCompleted = Boolean(completedRecord?.completedAt);
    const isInProgress = !isFullyCompleted && Boolean(completedRecord && (completedRecord.stepsCompleted?.caseStudy || completedRecord.stepsCompleted?.prevention));

    const reinforcementRecord = reinforcementsList.find(
      r => r.pathwayId === rec.pathwayId && (progress?.latestSessionId ? (r.sourceSessionId === progress.latestSessionId || r.sourceSessionId?._id === progress.latestSessionId) : true)
    );
    const isReinforced = Boolean(reinforcementRecord);
    const shiftState = rec.habitShiftState || rec.state;
    const isReinforcementEligible = hasFinal && (shiftState === 'continued_practice' || shiftState === 'emerging_gap');

    return {
      rec,
      isFullyCompleted,
      isInProgress,
      isReinforced,
      isReinforcementEligible,
      completedRecord,
      reinforcementRecord,
      shiftState
    };
  });

  const completedFocusCount = pathwaysWithStatus.filter(p => p.isFullyCompleted).length;
  const totalFocusCount = pathwaysWithStatus.length;

  // Next Action Selection
  const nextIncompletePathway = pathwaysWithStatus.find(p => !p.isFullyCompleted);
  const nextReinforcePathway = pathwaysWithStatus.find(p => p.isReinforcementEligible && !p.isReinforced);

  const handleLaunchRunner = (pathwayItem, isReinforce = false) => {
    setActivePathwayForRunner({
      pathway: pathwayItem.rec,
      sourceSessionId: progress.latestSessionId,
      initialProgress: {
        completedAt: pathwayItem.completedRecord?.completedAt || null,
        stepsCompleted: pathwayItem.completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false },
        isReinforced: pathwayItem.isReinforced,
        checkpointScore: pathwayItem.completedRecord?.checkpointScore || null
      },
      isReinforcementMode: isReinforce
    });
  };

  return (
    <div className="dashboard-journey page-entry">
      
      {/* ========================================================================= */}
      {/* 1. PAGE INTRODUCTION / HEADER                                             */}
      {/* ========================================================================= */}
      <header className="journey-header">
        <span className="journey-header-kicker">Learning Record</span>
        <h1 className="journey-header-title">
          Your Learning Journey
        </h1>
        <p className="journey-header-subtext">
          Track what you've learned, what you've practiced, and how your defensive habits change over time.
        </p>
        <div className="journey-header-meta">
          <span>{progress.fullName}</span>
          <span>&bull;</span>
          <span>{progress.email}</span>
          <span>&bull;</span>
          <span>{hasBaseline ? (isV2Baseline ? 'Diagnostic: Your Digital Day (v2)' : 'Diagnostic: Baseline (v1)') : 'Diagnostic Pending'}</span>
          {hasFinal && (
            <>
              <span>&bull;</span>
              <span>Final Assessment Completed</span>
            </>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CURRENT FOCUS / NEXT ACTION (PRIMARY VISUAL EMPHASIS)                  */}
      {/* ========================================================================= */}
      <section aria-labelledby="current-focus-heading" style={{ marginBottom: 'var(--space-xl)' }}>
        {!hasBaseline ? (
          <div className="journey-focus-card">
            <div className="journey-focus-content">
              <span className="journey-focus-label">Immediate Next Step</span>
              <h2 id="current-focus-heading" className="journey-focus-title">Complete Your Baseline Assessment</h2>
              <p className="journey-focus-subtext">
                Begin with the "Your Digital Day" simulation to assess your routine digital habits and uncover your specific defensive focus areas.
              </p>
            </div>
            <div className="journey-focus-action">
              <Link to="/assessment/baseline" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '0.92rem' }}>
                Start Baseline Simulation &rarr;
              </Link>
            </div>
          </div>
        ) : !hasFinal ? (
          nextIncompletePathway ? (
            <div className="journey-focus-card">
              <div className="journey-focus-content">
                <span className="journey-focus-label">
                  Current Focus &bull; {completedFocusCount} of {totalFocusCount} Focus Pathways Completed
                </span>
                <h2 id="current-focus-heading" className="journey-focus-title">
                  {nextIncompletePathway.isInProgress ? 'Continue' : 'Start'}: {nextIncompletePathway.rec.habitTitle}
                </h2>
                <p className="journey-focus-subtext">
                  {nextIncompletePathway.rec.pedagogicalFocus}
                </p>
              </div>
              <div className="journey-focus-action">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleLaunchRunner(nextIncompletePathway, false)}
                  style={{ padding: '10px 22px', fontSize: '0.92rem' }}
                  aria-label={`${nextIncompletePathway.isInProgress ? 'Continue' : 'Start'} learning pathway for ${nextIncompletePathway.rec.habitTitle}`}
                >
                  {nextIncompletePathway.isInProgress ? 'Continue Learning Pathway' : 'Start Learning Pathway'} &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="journey-focus-card" style={{ borderLeftColor: '#166534' }}>
              <div className="journey-focus-content">
                <span className="journey-focus-label" style={{ color: '#166534' }}>
                  Focus Pathways Complete
                </span>
                <h2 id="current-focus-heading" className="journey-focus-title">
                  Evaluate Your Habit Shifts in the Final Assessment
                </h2>
                <p className="journey-focus-subtext">
                  You have completed all recommended focus pathways. Take the final adaptive branching simulation to observe behavioral changes across all six dimensions.
                </p>
              </div>
              <div className="journey-focus-action">
                <Link to="/assessment/final" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '0.92rem' }}>
                  Take Final Branching Assessment &rarr;
                </Link>
              </div>
            </div>
          )
        ) : nextReinforcePathway ? (
          <div className="journey-focus-card" style={{ borderLeftColor: '#b45309' }}>
            <div className="journey-focus-content">
              <span className="journey-focus-label" style={{ color: '#b45309' }}>
                Post-Assessment Reinforcement
              </span>
              <h2 id="current-focus-heading" className="journey-focus-title">
                Reinforce Habit: {nextReinforcePathway.rec.habitTitle}
              </h2>
              <p className="journey-focus-subtext">
                Targeted habit reinforcement recommended ({nextReinforcePathway.shiftState === 'continued_practice' ? 'Continued Practice' : 'Emerging Habit Focus'}). Complete a quick micro-drill to consolidate defensive habits.
              </p>
            </div>
            <div className="journey-focus-action">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleLaunchRunner(nextReinforcePathway, true)}
                style={{ padding: '10px 22px', fontSize: '0.92rem', backgroundColor: '#b45309', borderColor: '#b45309' }}
                aria-label={`Reinforce defensive habit for ${nextReinforcePathway.rec.habitTitle}`}
              >
                Reinforce Defensive Habit &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="journey-focus-card" style={{ borderLeftColor: '#166534' }}>
            <div className="journey-focus-content">
              <span className="journey-focus-label" style={{ color: '#166534' }}>
                Current Record
              </span>
              <h2 id="current-focus-heading" className="journey-focus-title">
                Your Current Focus Pathways Are Complete
              </h2>
              <p className="journey-focus-subtext">
                You have completed all prioritized learning pathways and targeted reinforcements. You may optionally retake the simulation at any time to assess longitudinal habit retention.
              </p>
            </div>
            <div className="journey-focus-action">
              <Link to="/assessment/final" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
                Retake Assessment to Test Retention
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. LEARNING PROGRESS (COMPACT PATHWAY ROWS & RESTRAINED STATUS)           */}
      {/* ========================================================================= */}
      {hasBaseline && (
        <section className="journey-section" aria-labelledby="learning-progress-heading">
          <div className="journey-section-header">
            <div>
              <h2 id="learning-progress-heading" className="journey-section-title">
                Learning Progress
              </h2>
              <p className="journey-section-desc">
                Targeted micro-learning pathways and practical defenses completed for diagnosed behavioral focus areas.
              </p>
            </div>
            {totalFocusCount > 0 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {completedFocusCount} of {totalFocusCount} Pathways Completed
              </span>
            )}
          </div>

          {pathwaysWithStatus.length > 0 ? (
            <div className="journey-pathway-list">
              {pathwaysWithStatus.map((item, idx) => {
                const rec = item.rec;
                return (
                  <div key={idx} className="journey-pathway-row">
                    <div className="journey-pathway-main">
                      <div className="journey-pathway-meta">
                        <span style={{ fontWeight: '700', color: 'var(--accent-navy)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                          Focus Area {idx + 1}
                        </span>
                        {rec.difficulty && <span>&bull; {rec.difficulty}</span>}
                        {rec.estimatedMinutes && <span>&bull; ~{rec.estimatedMinutes} min</span>}
                        {rec.statutoryReference?.law && (
                          <span>&bull; {rec.statutoryReference.law} {rec.statutoryReference.section || ''}</span>
                        )}
                      </div>

                      <h3 className="journey-pathway-title">{rec.habitTitle}</h3>

                      {rec.coreRule && (
                        <p className="journey-pathway-rule">
                          <strong>Practical Rule:</strong> {rec.coreRule}
                        </p>
                      )}
                    </div>

                    <div className="journey-pathway-controls">
                      {/* Restrained typographical status presentation (no chunky pills) */}
                      <div className="journey-status-indicator">
                        {item.isReinforced ? (
                          <>
                            <span className="journey-status-tag status-reinforced">
                              Reinforced
                            </span>
                            <span className="journey-status-detail">
                              Checkpoint: {item.reinforcementRecord?.checkpointScore || 100}%
                            </span>
                          </>
                        ) : item.isFullyCompleted ? (
                          <>
                            <span className="journey-status-tag status-completed">
                              Completed
                            </span>
                            <span className="journey-status-detail">
                              Checkpoint: {item.completedRecord?.checkpointScore || 100}%
                            </span>
                          </>
                        ) : item.isInProgress ? (
                          <>
                            <span className="journey-status-tag status-in-progress">
                              In Progress
                            </span>
                            <span className="journey-status-detail">
                              Step 2 of 3
                            </span>
                          </>
                        ) : (
                          <span className="journey-status-tag status-recommended">
                            Recommended
                          </span>
                        )}
                      </div>

                      {item.isReinforcementEligible && !item.isReinforced ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleLaunchRunner(item, true)}
                          style={{ padding: '6px 14px', fontSize: '0.82rem', backgroundColor: '#b45309', borderColor: '#b45309' }}
                          aria-label={`Reinforce habit for ${rec.habitTitle}`}
                        >
                          Reinforce &rarr;
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={item.isFullyCompleted ? "btn btn-secondary" : "btn btn-primary"}
                          onClick={() => handleLaunchRunner(item, false)}
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                          aria-label={`${item.isFullyCompleted ? 'Review' : (item.isInProgress ? 'Continue' : 'Start')} pathway for ${rec.habitTitle}`}
                        >
                          {item.isFullyCompleted ? 'Review' : (item.isInProgress ? 'Continue' : 'Start')} &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No active learning pathway recommendations.
            </p>
          )}

          {/* Targeted Reinforcement Log if available */}
          {reinforcementsList.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>
                Recorded Habit Reinforcements
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {reinforcementsList.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    fontSize: '0.82rem'
                  }}>
                    <span>
                      <strong>{r.pathwayId}</strong>
                      <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                        ({r.sourceHabitState === 'continued_practice' ? 'Continued Practice' : 'Emerging Gap'})
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Checkpoint: {r.checkpointScore}% &bull; {new Date(r.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="journey-callout">
            <strong>Defensive Evidence Standard:</strong> Learning completion demonstrates successful performance on targeted learning checkpoints, distinct from observed behavioral evolution in simulations.
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. KNOWLEDGE PRACTICE (STATUTORY QUIZZES — NO GAMIFIED BADGES)            */}
      {/* ========================================================================= */}
      <section className="journey-section" aria-labelledby="knowledge-practice-heading">
        <div className="journey-section-header">
          <div>
            <h2 id="knowledge-practice-heading" className="journey-section-title">
              Knowledge Practice
            </h2>
            <p className="journey-section-desc">
              Verified statutory knowledge testing through objective cyber law quizzes.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {quizAttemptsList.length} Quiz Attempt{quizAttemptsList.length === 1 ? '' : 's'}
            </span>
            <Link to="/quizzes" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Explore Quizzes &rarr;
            </Link>
          </div>
        </div>

        {quizAttemptsList.length > 0 ? (
          <div className="journey-table-wrapper">
            <table className="journey-table" aria-label="Recent Quiz Attempts">
              <thead>
                <tr>
                  <th scope="col">Quiz Title</th>
                  <th scope="col">Score</th>
                  <th scope="col">Evaluation</th>
                  <th scope="col">Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {quizAttemptsList.slice(0, 5).map((qa, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      {qa.quizTitle || 'Cyber Law Quiz'}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {qa.percentage}%
                    </td>
                    <td>
                      <span className={qa.passed ? "journey-status-tag status-completed" : "journey-status-tag status-recommended"}>
                        {qa.passed ? 'Passed' : 'Attempted'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(qa.completedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              No quiz attempts recorded yet. Practice quizzes evaluate your recall of IT Act sections, BNS fraud offences, and reporting protocols.
            </p>
            <Link to="/quizzes" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Take a Quiz
            </Link>
          </div>
        )}

        <div className="journey-callout">
          <strong>Pedagogical Distinction:</strong> Quiz scores reflect statutory recall and procedural knowledge, not operational cybersecurity safety.
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BEHAVIORAL EVOLUTION (ACADEMIC RIGOR — 6 DISCRETE DIMENSIONS)          */}
      {/* ========================================================================= */}
      {hasBaseline && (
        <section className="journey-section" aria-labelledby="behavioral-evolution-heading">
          <div className="journey-section-header">
            <div>
              <h2 id="behavioral-evolution-heading" className="journey-section-title">
                Behavioral Evolution
              </h2>
              <p className="journey-section-desc">
                Behavioral evolution is measured independently through simulated assessment decisions across everyday digital scenarios.
              </p>
            </div>
            {hasFinal && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {trajectoryData?.comparableSessionsCount || 2} Comparable Sessions
              </span>
            )}
          </div>

          {!hasFinal ? (
            <div style={{
              padding: 'var(--space-lg)',
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', margin: '0 0 6px 0' }}>
                Final Assessment Pending
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 16px auto' }}>
                Complete the Final branching assessment after practicing your focus pathways to evaluate behavioral changes across all six dimensions.
              </p>
              <Link to="/assessment/final" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
                Take Final Branching Assessment &rarr;
              </Link>
            </div>
          ) : Object.keys(trajectoryDimensions).length > 0 ? (
            <div className="journey-table-wrapper">
              <table className="journey-table" aria-label="Behavioral Evolution Matrix">
                <thead>
                  <tr>
                    <th scope="col">Dimension</th>
                    <th scope="col">Baseline</th>
                    <th scope="col">Final</th>
                    <th scope="col">Intervention Delta</th>
                    {hasTrajectoryReassessment && (
                      <>
                        <th scope="col">Reassessment*</th>
                        <th scope="col">Retention Delta</th>
                      </>
                    )}
                    <th scope="col">Retention Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(trajectoryDimensions).map(([dimKey, dimData]) => {
                    const learnedDelta = dimData.deltaLearned;
                    const retDelta = dimData.deltaRetention;
                    const statusClass = `state-${dimData.retentionState.toLowerCase().replace(/_/g, '-')}`;

                    return (
                      <tr key={dimKey}>
                        <td>
                          <span className="trajectory-dim-title">{dimData.label}</span>
                          <span className="trajectory-dim-code">{dimKey}</span>
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {dimData.baseline !== null ? `${dimData.baseline}%` : '—'}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {dimData.final !== null ? `${dimData.final}%` : '—'}
                        </td>
                        <td>
                          {learnedDelta !== null ? (
                            <span style={{
                              fontWeight: '600',
                              color: learnedDelta > 0 ? '#166534' : (learnedDelta < 0 ? '#991b1b' : 'var(--text-muted)')
                            }}>
                              {learnedDelta > 0 ? `+${learnedDelta}%` : `${learnedDelta}%`}
                            </span>
                          ) : '—'}
                        </td>
                        {hasTrajectoryReassessment && (
                          <>
                            <td style={{ fontWeight: '600' }}>
                              {dimData.reassessment !== null ? `${dimData.reassessment}%` : '—'}
                            </td>
                            <td>
                              {retDelta !== null ? (
                                <span style={{
                                  fontWeight: '600',
                                  color: retDelta >= 0 ? '#166534' : (retDelta < -15 ? '#991b1b' : '#b45309')
                                }}>
                                  {retDelta > 0 ? `+${retDelta}%` : `${retDelta}%`}
                                </span>
                              ) : '—'}
                            </td>
                          </>
                        )}
                        <td>
                          <span
                            role="status"
                            aria-label={`Retention classification: ${getRetentionLabel(dimData.retentionState)}`}
                            className={`retention-state-text ${statusClass}`}
                          >
                            {getRetentionLabel(dimData.retentionState)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Trajectory data is being synthesized.
            </p>
          )}

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: 'var(--space-sm)' }}>
            * Dimensions are measured discretely. No composite score or overall average grade is computed to avoid masking vulnerabilities.
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. OPTIONAL LONGITUDINAL HISTORY & METHODOLOGY                            */}
      {/* ========================================================================= */}
      {hasFinal && (
        <section className="journey-section" aria-labelledby="history-heading" style={{ borderBottom: 'none' }}>
          <h2 id="history-heading" className="journey-section-title" style={{ fontSize: '1.15rem' }}>
            Assessment Record & Methodology
          </h2>

          <details className="journey-details">
            <summary>
              <span>Session History & Measurement Isolation ({trajectoryData?.comparableSessionsCount || 2} sessions)</span>
            </summary>
            <div className="journey-details-body">
              <p style={{ margin: '0 0 10px 0' }}>
                The portal maintains strict version isolation between historical v1 and active v2 assessments. All trajectory pairings require identical v2 scenario models.
              </p>
              <ul style={{ margin: '0 0 12px 18px', padding: 0 }}>
                <li><strong>Baseline Session:</strong> Established initial behavioral baseline before educational intervention.</li>
                <li><strong>Final Branching Session:</strong> Post-intervention evaluation testing adaptive branching at Stage 7.</li>
                {hasTrajectoryReassessment && (
                  <li><strong>Retention Reassessment:</strong> Voluntarily completed later compatible assessment measuring longitudinal habit persistence.</li>
                )}
              </ul>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Retention classifications adhere to formal mathematical bounds: <strong>Retained</strong> (&ge; -5 delta or sustained vigilance), <strong>Stable</strong> (within baseline bounds), <strong>Partially Retained</strong> (minor decay exceeding baseline), <strong>Declined</strong> (significant decay or return to baseline vulnerability), <strong>Unimproved</strong> (persistent pre-intervention deficit), <strong>Developing</strong> (measurable improvement emerging toward delayed threshold), <strong>Delayed Improvement</strong> (significant improvement emerging on subsequent trial).
              </p>
            </div>
          </details>
        </section>
      )}

      {/* PathwayRunner Modal */}
      {activePathwayForRunner && (
        <PathwayRunner
          pathway={activePathwayForRunner.pathway}
          sourceSessionId={activePathwayForRunner.sourceSessionId}
          initialProgress={activePathwayForRunner.initialProgress}
          isReinforcementMode={activePathwayForRunner.isReinforcementMode}
          onClose={() => setActivePathwayForRunner(null)}
          onPathwayCompleted={() => {
            fetchDashboardData();
            setActivePathwayForRunner(null);
          }}
        />
      )}

    </div>
  );
}

export default Dashboard;
