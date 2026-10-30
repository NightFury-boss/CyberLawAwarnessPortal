import React, { useEffect, useRef } from 'react';
import { isValidReviewRecord, getReviewIdentityKey, resolvePathwayTitle, resolveRetentionStatusLabel } from '../../utils/evidenceSelectors.js';

/**
 * DefensivePortfolioModal Component
 * 
 * An authoritative, dignified Three-Pillar Defensive Portfolio Statement:
 * Pillar 1: Learning Interventions (verified pathways & reinforcements with checkpoint scores)
 * Pillar 2: Knowledge Practice (verified quiz attempts with dates & percentages)
 * Pillar 3: Behavioral Evolution (6 discrete dimensions TR, SI, VB, DQ, FP, UA across baseline & final)
 * 
 * Strict Guarantees:
 * - NO fake hashes claiming cryptographic or issuer proof.
 * - NO composite scores or blended awareness averages.
 * - NO psychometric, clinical, or formal legal certification claims.
 * - Authoritative backend-derived data only; missing values rendered honestly as 'Pending'.
 * - Clean `@media print` support for letter/A4 printing and PDF generation.
 */

const CANONICAL_DIMENSIONS = [
  { key: 'TR', label: 'Threat Recognition', desc: 'Spotting suspicious links, urgent pretexts, and digital tricks.' },
  { key: 'SI', label: 'Signal Identification', desc: 'Spotting fake senders, made-up authority, and unexpected requests.' },
  { key: 'VB', label: 'Verification Behaviour', desc: 'Checking facts through official channels before acting or transferring money.' },
  { key: 'DQ', label: 'Decision Quality', desc: 'Making calm, thoughtful choices when facing online pressure.' },
  { key: 'FP', label: 'False Positive Control', desc: 'Staying calm and avoiding panic over routine or safe messages.' },
  { key: 'UA', label: 'Unreviewed Acceptance Control', desc: 'Taking time to check before clicking links, accepting permissions, or downloading files.' }
];

export default function DefensivePortfolioModal({
  isOpen,
  onClose,
  user,
  progress,
  portfolioData,
  trajectoryData,
  initialPillar = null
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus modal on open for accessibility
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Navigate to targeted pillar or subentry upon opening
  useEffect(() => {
    if (!isOpen || !initialPillar) return;

    const timer = setTimeout(() => {
      let targetEl = null;
      if (initialPillar === 'delayed-recall') {
        targetEl = modalRef.current?.querySelector('#portfolio-delayed-recall') ||
                   modalRef.current?.querySelector('#portfolio-pillar-interventions');
      } else if (initialPillar === 'interventions' || initialPillar === 'pillar-1') {
        targetEl = modalRef.current?.querySelector('#portfolio-pillar-interventions');
      } else if (initialPillar === 'knowledge' || initialPillar === 'pillar-2') {
        targetEl = modalRef.current?.querySelector('#portfolio-pillar-knowledge');
      } else if (initialPillar === 'behavior' || initialPillar === 'pillar-3') {
        targetEl = modalRef.current?.querySelector('#portfolio-pillar-behavior');
      }

      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, initialPillar]);

  if (!isOpen) return null;

  const fullName = user?.name || user?.fullName || progress?.fullName || 'Registered Learner';
  const email = user?.email || progress?.email || '';
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hasBaseline = progress?.baselineScore !== null && progress?.baselineScore !== undefined;
  const hasFinal = progress?.finalScore !== null && progress?.finalScore !== undefined;
  const hasTrajectoryReassessment = Boolean(trajectoryData?.hasReassessment);

  // Pillar 1 Data
  const completedPathways = portfolioData?.interventions?.completedPathways || progress?.completedPathways || [];
  const reinforcements = portfolioData?.interventions?.reinforcementsCompleted || progress?.reinforcementsCompleted || [];
  const rawSpacedReviews = portfolioData?.interventions?.spacedReviews || progress?.spacedReviews || [];
  
  const seenSrKeys = new Set();
  const spacedReviews = [];
  for (const sr of rawSpacedReviews) {
    if (!isValidReviewRecord(sr)) continue;
    const k = getReviewIdentityKey(sr);
    if (seenSrKeys.has(k)) continue;
    seenSrKeys.add(k);
    spacedReviews.push(sr);
  }
  const passedSpacedCount = spacedReviews.filter(sr => Boolean(sr.passed)).length;

  // Pillar 2 Data
  const quizAttempts = portfolioData?.knowledgePractice?.quizAttempts || [];
  const distinctQuizzesCount = portfolioData?.knowledgePractice?.summary?.distinctQuizzesTaken || 0;

  // Pillar 3 Data
  const dimensions = trajectoryData?.dimensions || {};
  const sessions = portfolioData?.behavioralTrajectory?.sessions || [];
  const latestSessionVersion = sessions.length > 0 ? sessions[sessions.length - 1].scenarioVersion : 2;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="portfolio-modal-overlay" 
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="portfolio-modal-container" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="portfolio-modal-title"
        ref={modalRef}
      >
        {/* Top Control Bar (Screen Only) */}
        <div className="portfolio-modal-controls print-hidden">
          <div className="portfolio-modal-status-hint">
            <span>Your Learning Record &bull; View or Save as PDF</span>
            <span className="portfolio-modal-print-tip"> (Tip: In browser print settings, uncheck &ldquo;Headers and footers&rdquo; for a clean copy)</span>
          </div>
          <div className="portfolio-modal-buttons">
            <button 
              type="button" 
              onClick={handlePrint} 
              className="btn btn-primary portfolio-btn-print"
              aria-label="Print or Save Learning Record as PDF"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print / Save PDF</span>
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary portfolio-btn-close"
              ref={closeButtonRef}
              aria-label="Close Learning Record"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="portfolio-document" id="printable-portfolio-area">
          {/* Document Header */}
          <header className="portfolio-doc-header">
            <div className="portfolio-doc-brand">
              <span className="portfolio-institution">Cyber Law Awareness Portal</span>
              <span className="portfolio-framework">National Digital Literacy & Legal Awareness Framework</span>
            </div>
            <h1 id="portfolio-modal-title" className="portfolio-doc-title">
              Your Learning Record
            </h1>
            <p className="portfolio-doc-subtitle">
              A verified record of what you have studied, laws you have practiced, and how your online decisions change over time.
            </p>

            <div className="portfolio-meta-grid">
              <div className="portfolio-meta-cell">
                <span className="meta-label">Learner Name</span>
                <strong className="meta-value">{fullName}</strong>
              </div>
              {email && (
                <div className="portfolio-meta-cell">
                  <span className="meta-label">Account Email</span>
                  <strong className="meta-value">{email}</strong>
                </div>
              )}
              <div className="portfolio-meta-cell">
                <span className="meta-label">Record Date</span>
                <strong className="meta-value">{currentDate}</strong>
              </div>
              <div className="portfolio-meta-cell">
                <span className="meta-label">Assessment Version</span>
                <strong className="meta-value">Simulation Model v{latestSessionVersion}</strong>
              </div>
            </div>
          </header>

          {/* Educational Purpose Statement */}
          <div className="portfolio-disclosure-note">
            <strong>Educational Record Notice:</strong> This document brings together your recorded learning activities, quiz attempts and results, and simulated decisions across three learning areas. It is designed for educational awareness and does not constitute formal legal advice or certification.
          </div>

          {/* PILLAR 1: LEARNING INTERVENTIONS */}
          <section className="portfolio-pillar-section" id="portfolio-pillar-interventions" aria-labelledby="pillar-1-heading">
            <div className="portfolio-pillar-header">
              <span className="pillar-num">Pillar 01</span>
              <div>
                <h2 id="pillar-1-heading" className="pillar-title">What You’ve Practiced (Lessons &amp; Drills)</h2>
                <p className="pillar-desc">
                  Recommended safety lessons completed after your first check. Shows that you reviewed a real story, learned the practical safety rule, and passed the quick quiz.
                </p>
              </div>
            </div>

            {completedPathways.length === 0 ? (
              <div className="portfolio-empty-box">
                <p>No completed lessons recorded yet.</p>
                <span className="portfolio-empty-hint">Lessons are recommended based on your first check.</span>
              </div>
            ) : (
              <div className="portfolio-table-wrap">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: '45%' }}>Lesson Title / Focus</th>
                      <th scope="col">Quiz Score</th>
                      <th scope="col">Status</th>
                      <th scope="col">Date Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedPathways.map((p, idx) => {
                      const isReinforced = reinforcements.some(r => r.pathwayId === p.pathwayId);
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{resolvePathwayTitle(p.pathwayId, p.habitTitle)}</strong>
                            <div className="portfolio-table-sub">Targeted safety practice drill</div>
                          </td>
                          <td>
                            {p.checkpointScore !== null && p.checkpointScore !== undefined 
                              ? <span className="portfolio-score-tag">Passed: {p.checkpointScore}%</span>
                              : <span className="portfolio-sub-tag">Completed</span>}
                          </td>
                          <td>
                            {isReinforced 
                              ? <span className="portfolio-badge-reinforced">Practiced</span>
                              : <span className="portfolio-badge-completed">Completed</span>}
                          </td>
                          <td className="portfolio-date-cell">
                            {p.completedAt ? new Date(p.completedAt).toLocaleDateString('en-GB') : 'Recorded'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Delayed Recall Practice Entry */}
            <div className="portfolio-subentry" id="portfolio-delayed-recall">
              <div className="portfolio-subentry-header">
                <h3 className="portfolio-subentry-title">Practice Again Later (Follow-Up Reviews)</h3>
                <p className="portfolio-subentry-desc">
                  Short follow-up checks taken days later to make sure key safety rules and laws stay fresh in your memory.
                </p>
              </div>

              {spacedReviews.length === 0 ? (
                <div className="portfolio-empty-subbox">
                  <p>No follow-up reviews completed yet.</p>
                  <span className="portfolio-empty-hint">
                    Completed lessons become eligible for a quick review 7 days later.
                  </span>
                </div>
              ) : (
                <>
                  <div className="portfolio-summary-metrics">
                    <div className="portfolio-metric-chip">
                      <span className="metric-chip-num">{spacedReviews.length}</span>
                      <span className="metric-chip-label">Completed Reviews</span>
                    </div>
                    <div className="portfolio-metric-chip">
                      <span className="metric-chip-num">{passedSpacedCount}</span>
                      <span className="metric-chip-label">Passed Checks</span>
                    </div>
                  </div>

                  <div className="portfolio-table-wrap">
                    <table className="portfolio-table">
                      <thead>
                        <tr>
                          <th scope="col" style={{ width: '45%' }}>Lesson / Review Cycle</th>
                          <th scope="col">Review Score</th>
                          <th scope="col">Outcome</th>
                          <th scope="col">Date Reviewed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spacedReviews.map((sr, idx) => {
                          const reviewDate = sr.completedAt ? new Date(sr.completedAt).toLocaleDateString('en-GB') : 'Recorded';
                          return (
                            <tr key={idx}>
                              <td>
                                <strong>{resolvePathwayTitle(sr.pathwayId, sr.habitTitle)}</strong>
                                <div className="portfolio-table-sub">
                                  Review Cycle {sr.cycleNumber || 1} &bull; Follow-up review
                                </div>
                              </td>
                              <td>
                                {typeof sr.checkpointScore === 'number'
                                  ? <span className="portfolio-score-tag">{sr.checkpointScore}%</span>
                                  : <span className="portfolio-sub-tag">—</span>}
                              </td>
                              <td>
                                {sr.passed ? (
                                  <span className="portfolio-badge-passed">Passed follow-up check</span>
                                ) : (
                                  <span className="portfolio-badge-review">Review recommended</span>
                                )}
                              </td>
                              <td className="portfolio-date-cell">{reviewDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* PILLAR 2: KNOWLEDGE PRACTICE */}
          <section className="portfolio-pillar-section" id="portfolio-pillar-knowledge" aria-labelledby="pillar-2-heading">
            <div className="portfolio-pillar-header">
              <span className="pillar-num">Pillar 02</span>
              <div>
                <h2 id="pillar-2-heading" className="pillar-title">What You’ve Learned (Law Quizzes)</h2>
                <p className="pillar-desc">
                  Quizzes checking what you know about Indian cyber laws (IT Act 2000, DPDP Act 2023, BNS 2023) and reporting channels like Helpline 1930.
                </p>
              </div>
            </div>

            {quizAttempts.length === 0 ? (
              <div className="portfolio-empty-box">
                <p>No verified law quizzes completed yet.</p>
                <span className="portfolio-empty-hint">Take quizzes in the Quizzes section to test what you know about cyber law.</span>
              </div>
            ) : (
              <>
                <div className="portfolio-stat-summary-bar">
                  <span>Total Quizzes Taken: <strong>{quizAttempts.length}</strong></span>
                  <span className="stat-bullet">&bull;</span>
                  <span>Distinct Law Topics Tested: <strong>{distinctQuizzesCount || quizAttempts.length}</strong></span>
                </div>
                <div className="portfolio-table-wrap">
                  <table className="portfolio-table">
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: '50%' }}>Quiz Topic / Legal Category</th>
                        <th scope="col">Score</th>
                        <th scope="col">Attempt Number</th>
                        <th scope="col">Date Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizAttempts.map((qa, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{qa.quizTitle || 'Cyber Law Quiz'}</strong>
                            <div className="portfolio-table-sub">{qa.category || 'Law Knowledge'}</div>
                          </td>
                          <td>
                            <strong className="portfolio-percentage">{qa.percentage}%</strong>
                          </td>
                          <td>Attempt #{qa.attemptNumber || 1}</td>
                          <td className="portfolio-date-cell">
                            {qa.completedAt ? new Date(qa.completedAt).toLocaleDateString('en-GB') : 'Recorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* PILLAR 3: BEHAVIORAL EVOLUTION */}
          <section className="portfolio-pillar-section" id="portfolio-pillar-behavior" aria-labelledby="pillar-3-heading">
            <div className="portfolio-pillar-header">
              <span className="pillar-num">Pillar 03</span>
              <div>
                <h2 id="pillar-3-heading" className="pillar-title">How Your Decisions Change (Decision Habits)</h2>
                <p className="pillar-desc">
                  How your online choices change across 6 specific habit areas during realistic scenarios. Each area is measured separately so you always know where your habits are strong and where to stay alert.
                </p>
              </div>
            </div>

            {!hasBaseline ? (
              <div className="portfolio-empty-box">
                <p>First check has not yet been taken.</p>
                <span className="portfolio-empty-hint">Complete Your Digital Day to see your baseline habits.</span>
              </div>
            ) : (
              <div className="portfolio-table-wrap">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th scope="col" style={{ width: hasTrajectoryReassessment ? '34%' : '38%' }}>Safety Habit Area</th>
                      <th scope="col" style={{ width: hasTrajectoryReassessment ? '12%' : '14%' }}>First Check</th>
                      <th scope="col" style={{ width: hasTrajectoryReassessment ? '12%' : '14%' }}>Final Check</th>
                      {hasTrajectoryReassessment && <th scope="col" style={{ width: '12%' }}>Follow-Up</th>}
                      <th scope="col" style={{ width: hasTrajectoryReassessment ? '15%' : '16%' }}>Change</th>
                      <th scope="col" style={{ width: hasTrajectoryReassessment ? '15%' : '18%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CANONICAL_DIMENSIONS.map(dim => {
                      const d = dimensions[dim.key] || {};
                      const baseScore = typeof d.baseline === 'number' ? d.baseline : null;
                      const finalScore = typeof d.final === 'number' ? d.final : null;
                      const reassessScore = typeof d.reassessment === 'number' ? d.reassessment : null;
                      const delta = typeof d.deltaLearned === 'number' ? d.deltaLearned : null;
                      const retentionState = resolveRetentionStatusLabel(d.retentionState, hasFinal);

                      let shiftText = '—';
                      let shiftClass = '';
                      if (delta !== null) {
                        if (delta >= 5) {
                          shiftText = `+${delta}% (Improved)`;
                          shiftClass = 'shift-up';
                        } else if (delta <= -5) {
                          shiftText = `${delta}% (Needs Practice)`;
                          shiftClass = 'shift-down';
                        } else {
                          shiftText = `${delta >= 0 ? '+' : ''}${delta}% (Steady)`;
                          shiftClass = 'shift-steady';
                        }
                      }

                      return (
                        <tr key={dim.key}>
                          <td>
                            <strong>{dim.label}</strong>
                            <div className="portfolio-dim-code">{dim.key} &bull; {dim.desc}</div>
                          </td>
                          <td>{baseScore !== null ? `${baseScore}%` : '—'}</td>
                          <td>{finalScore !== null ? `${finalScore}%` : 'Pending'}</td>
                          {hasTrajectoryReassessment && (
                            <td>{reassessScore !== null ? `${reassessScore}%` : '—'}</td>
                          )}
                          <td className={shiftClass}>{shiftText}</td>
                          <td>
                            <span className="portfolio-state-pill">{retentionState}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Document Footer & Methodology Summary */}
          <footer className="portfolio-doc-footer">
            <div className="portfolio-footer-box">
              <h3 className="portfolio-footer-heading">How We Verify Your Progress</h3>
              <ul className="portfolio-footer-notes">
                <li>
                  <strong>Separate Habit Checks:</strong> We check each of the 6 decision areas independently. Doing well in spotting tricks does not hide when someone clicks too quickly without checking.
                </li>
                <li>
                  <strong>Fair Comparisons:</strong> Progress is compared using the same scenario models to make sure results are consistent.
                </li>
                <li>
                  <strong>Grounded in Indian Law:</strong> Legal guidance reflects the Information Technology Act 2000, Digital Personal Data Protection Act 2023, and Bharatiya Nyaya Sanhita 2023.
                </li>
              </ul>
            </div>

            <div className="portfolio-footer-signoff">
              <div className="signoff-line">
                <span>Issued for educational verification purposes by the Cyber Law Awareness Portal.</span>
              </div>
              <div className="signoff-id">
                <span>Session Context: Model v{latestSessionVersion} &bull; Validated Server Records</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
