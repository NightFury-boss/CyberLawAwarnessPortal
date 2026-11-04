import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RemediationCards from '../RemediationCards';
import '../../styles/digital-awareness-profile.css';

/**
 * DigitalAwarenessProfile Component
 * Phase 2: Evidence-Based Digital Awareness Profile & Storytelling Experience
 * 
 * CORE PRINCIPLES:
 * 1. Knowing the law is only the beginning; everyday habits determine digital safety.
 * 2. Independent six-dimensional behavioral scores (no composite averages or grades).
 * 3. Clear distinction between demonstrated score, limited evidence, and unassessed dimensions.
 * 4. Grounded in server-authoritative evidence from the completed assessment.
 * 5. Clear statutory connections respecting legal status and primary Indian jurisprudence.
 */

const DIMENSION_CONFIG = {
  recognition: {
    code: 'TR',
    technicalTitle: 'Threat Recognition',
    learnerTitle: 'Spotting Dangerous Situations',
    shortDesc: 'Catching deceptive lures, artificial urgency, and disguised traps in everyday communications.',
    measurementExplanation: 'Evaluates your ability to notice when an unsolicited contact attempts to provoke anxiety, haste, or uncritical compliance.',
    practicalRule: 'Treat unprompted urgency as an immediate signal to pause. Verify delivery, bank, or utility alerts directly on official platforms before acting.'
  },
  signalIdentification: {
    code: 'SI',
    technicalTitle: 'Signal Identification',
    learnerTitle: 'Recognising Suspicious Signals',
    shortDesc: 'Noticing domain typos, spoofed headers, mismatched payee details, and payment fee cues.',
    measurementExplanation: 'Evaluates your attention to technical irregularities in sender addresses, domain names, and payment interfaces.',
    practicalRule: 'Inspect root domain names in the browser URL bar. Legitimate employers, banks, and couriers never demand registration fees or advance deposits.'
  },
  verification: {
    code: 'VB',
    technicalTitle: 'Verification Behaviour',
    learnerTitle: 'Checking Before Trusting',
    shortDesc: 'Independently confirming requests through official channels rather than replying inside the contact itself.',
    measurementExplanation: 'Evaluates whether you establish independent out-of-band confirmation before responding to sensitive or coercive requests.',
    practicalRule: 'Never verify an authority using the phone number or link provided in the message. Disconnect and call official numbers from a trusted portal.'
  },
  decisionQuality: {
    code: 'DQ',
    technicalTitle: 'Decision Quality',
    learnerTitle: 'Making Thoughtful Decisions',
    shortDesc: 'Taking prudent, balanced actions across routine digital situations without panic or carelessness.',
    measurementExplanation: 'Evaluates the overall proportion and prudence of your actions when balancing security, convenience, and operational necessity.',
    practicalRule: 'Take a deliberate 2-minute cooling-off period before completing urgent requests or authorizing financial transactions.'
  },
  falsePositive: {
    code: 'FP',
    technicalTitle: 'False Positive Control',
    learnerTitle: 'Avoiding Unnecessary Suspicion',
    shortDesc: 'Recognizing legitimate system notifications and credit receipts without panicking or creating false alarms.',
    measurementExplanation: 'Evaluates whether you can discern routine informative receipts from genuine threats without disrupting legitimate communications.',
    practicalRule: 'Informative notifications confirming past activities require no alarm. Check whether a message actually demands credentials or funds before panicking.'
  },
  unreviewedAcceptance: {
    code: 'UA',
    technicalTitle: 'Unreviewed Acceptance Control',
    learnerTitle: 'Avoiding Action Without Checking',
    shortDesc: 'Resisting autopilot clicking, permission approvals, or credential entry without reading the prompt.',
    measurementExplanation: 'Evaluates your restraint against reflexively approving permissions, downloading APKs, or authorizing unknown requests.',
    practicalRule: 'A UPI PIN is entered ONLY to SEND money, NEVER to receive funds, cashback, or refunds. Always audit app permissions before approving.'
  }
};

const STATUTORY_REFERENCES = [
  {
    act: 'Information Technology Act, 2000',
    section: 'Section 66C',
    officialTitle: 'Punishment for identity theft',
    status: 'IN_FORCE',
    statusLabel: 'In Force',
    summary: 'Penalizes the fraudulent use of another person’s electronic signature, password, or authentication credentials (such as stolen UPI PINs or harvested logins) with up to 3 years imprisonment.',
    practicalContext: 'Your baseline tested whether you entered credentials or authorized payment requests into unverified portals. Section 66C protects individuals from credential hijacking.'
  },
  {
    act: 'Information Technology Act, 2000',
    section: 'Section 66D',
    officialTitle: 'Cheating by personation over computer resources',
    status: 'IN_FORCE',
    statusLabel: 'In Force',
    summary: 'Penalizes anyone who cheats by personating another person, agency, or official authority using any computer or communication device with up to 3 years imprisonment.',
    practicalContext: 'Your baseline simulated courier delivery, bank officer, and recruiter personation. Understanding Section 66D clarifies that fraudulent impersonation carries criminal liability.'
  },
  {
    act: 'Bharatiya Nyaya Sanhita, 2023',
    section: 'Section 318(4) & Section 319',
    officialTitle: 'Cheating and personation offences',
    status: 'IN_FORCE',
    statusLabel: 'In Force',
    summary: 'Modern criminal jurisprudence covering deception, dishonest inducement of property or valuable security, and cheating by personation across all media.',
    practicalContext: 'Applies to advance-fee job scams, fake task recruitment, and digital extortion schemes that coerce money under false pretences.'
  },
  {
    act: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 6(1)–(8) & 6(10)',
    officialTitle: 'Consent standards and withdrawal obligations',
    status: Date.now() >= new Date('2027-05-13T00:00:00.000Z').getTime() ? 'IN_FORCE' : 'ENACTED_FUTURE_COMMENCEMENT',
    statusLabel: Date.now() >= new Date('2027-05-13T00:00:00.000Z').getTime() ? 'In Force' : 'Enacted • Commencement 13 May 2027',
    summary: 'Establishes clear statutory requirements that consent must be free, specific, informed, unconditional, and unambiguous with clear affirmative action. Data fiduciaries cannot bundle non-essential permissions or deny service for withholding non-necessary data.',
    practicalContext: 'Enacted August 2023. Notification G.S.R. 843(E) (dated 13 November 2025) appoints commencement eighteen months post-publication (13 May 2027). Clarifies defensive reflexes against overreaching permission requests.'
  },
  {
    act: 'Digital Personal Data Protection Act, 2023',
    section: 'Section 6(9)',
    officialTitle: 'Registration and Standards of Consent Managers',
    status: Date.now() >= new Date('2026-11-13T00:00:00.000Z').getTime() ? 'IN_FORCE' : 'ENACTED_FUTURE_COMMENCEMENT',
    statusLabel: Date.now() >= new Date('2026-11-13T00:00:00.000Z').getTime() ? 'In Force' : 'Enacted • Commencement 13 Nov 2026',
    summary: 'Establishes statutory registration and operational standards for Consent Managers under the Data Protection Board of India, giving Data Principals unified control to give, manage, review, and withdraw consent.',
    practicalContext: 'Enacted August 2023. Notification G.S.R. 843(E) (dated 13 November 2025) appoints commencement one year post-publication (13 November 2026). Establishes institutional accountability, interoperability, and technical standards for registered Consent Managers through whom citizens manage digital consents.'
  }
];

function DigitalAwarenessProfile({ result, completedHistory, onRetake }) {
  const navigate = useNavigate();
  const [openEvidenceIndex, setOpenEvidenceIndex] = useState(null);

  const activeData = result || completedHistory || {};
  const sessionId = activeData.sessionId || activeData._id;

  const rawScores = activeData.behaviourScores || {};
  const rawOpportunities = activeData.behaviourOpportunities || {};
  const decisionEvidence = activeData.decisionEvidence || [];

  const completedAt = activeData.completedAt 
    ? new Date(activeData.completedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recent Assessment';

  // Analyze strengths and improvement opportunities from evidence
  const isV2 = activeData.scoringVersion === 2;
  const rawEncounters = activeData.behaviourEncounters || {};

  const evaluatedDimensions = Object.keys(DIMENSION_CONFIG).map((key) => {
    const config = DIMENSION_CONFIG[key];
    const score = typeof rawScores[key] === 'number' ? rawScores[key] : null;
    const opps = typeof rawOpportunities[key] === 'number' ? rawOpportunities[key] : 0;
    const encounters = typeof rawEncounters[key] === 'number' ? rawEncounters[key] : opps;
    
    let status = 'unassessed';
    if (score === null || opps === 0 || encounters === 0) {
      status = 'unassessed';
    } else if (encounters === 1) {
      status = 'limited';
    } else if (key === 'falsePositive' && isV2 && typeof activeData.falsePositivePenaltyPoints === 'number' && activeData.falsePositivePenaltyPoints <= 2) {
      status = 'strength';
    } else if (score >= 75) {
      status = 'strength';
    } else {
      status = 'opportunity';
    }

    return {
      key,
      ...config,
      score,
      opportunities: opps,
      encounters,
      status
    };
  });

  const strengths = evaluatedDimensions.filter((d) => d.status === 'strength');
  const opportunities = evaluatedDimensions
    .filter((d) => d.status === 'opportunity')
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  const toggleEvidence = (idx) => {
    setOpenEvidenceIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="profile-container page-entry">
      {/* ========================================================================= */}
      {/* 1. COMPLETION ACKNOWLEDGEMENT & MASTHEAD                                  */}
      {/* ========================================================================= */}
      <header className="profile-masthead">
        <div className="profile-masthead-meta">
          <span className="profile-badge-scenario">
            <span className="profile-badge-dot" aria-hidden="true" />
            Baseline Diagnostic • Your Digital Day
          </span>
          <span className="profile-timestamp">Completed: {completedAt}</span>
        </div>

        <h1 className="profile-title">Your Digital Awareness Profile</h1>
        <p className="profile-lead">
          This profile maps how you navigate everyday digital communications, alerts, and decisions. 
          It establishes your evidence-based starting point before you begin learning modules.
        </p>

        <div className="profile-principle-box">
          <p className="profile-principle-quote">
            &quot;Knowing the law is only the beginning. Everyday habits determine digital safety.&quot;
          </p>
          <p className="profile-principle-text">
            This assessment evaluates decisions under simulated conditions, not your character or intelligence. 
            There are no letter grades, ranks, or pass/fail labels. Each finding reflects observed choices in simulated situations.
          </p>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. WHAT YOU ALREADY DO WELL (STRENGTHS)                                   */}
      {/* ========================================================================= */}
      <section className="profile-section" aria-labelledby="heading-strengths">
        <div className="profile-section-header header-strengths">
          <span className="profile-section-kicker">Assessment Evidence</span>
          <h2 id="heading-strengths" className="profile-section-title">
            What You Already Do Well
          </h2>
          <p className="profile-section-desc">
            Defensive habits where you demonstrated consistent caution and safe decision-making during your simulation.
          </p>
        </div>

        {strengths.length > 0 ? (
          <div className="profile-cards-grid">
            {strengths.map((s) => (
              <article key={s.key} className="profile-item-card card-strength">
                <span className="profile-item-tag tag-strength">
                  Demonstrated Strength • {s.code}
                </span>
                <h3 className="profile-item-title">{s.learnerTitle}</h3>
                <p className="profile-item-evidence">
                  {s.key === 'falsePositive' && isV2 ? (
                    <>
                      You exercised calm restraint across <strong>{s.encounters}</strong> evaluated authentic situations, accruing only <strong>{activeData.falsePositivePenaltyPoints ?? 0}</strong> penalty point(s) out of <strong>{s.opportunities}</strong> max applicable penalty points (normalized: <strong>{s.score}%</strong>). In our model, a penalty ≤ 2 denotes <strong>Demonstrated Strength</strong> across both branch paths.
                    </>
                  ) : s.key === 'unreviewedAcceptance' && isV2 ? (
                    <>
                      You inspected requests carefully across <strong>{s.encounters}</strong> evaluated situations, accruing only <strong>{activeData.unreviewedAcceptancePenaltyPoints ?? 0}</strong> penalty point(s) out of <strong>{s.opportunities}</strong> max penalty points (normalized: <strong>{s.score}%</strong>).
                    </>
                  ) : (
                    <>
                      {s.measurementExplanation} You maintained a score of <strong>{s.score}%</strong> across {s.opportunities} simulated opportunities.
                    </>
                  )}
                </p>
                <div className="profile-item-callout">
                  <strong>Practical Value</strong>
                  {s.practicalRule}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-item-card">
            <span className="profile-item-tag tag-opportunity">Starting Baseline</span>
            <h3 className="profile-item-title">Building Your Defensive Reflexes</h3>
            <p className="profile-item-evidence">
              Your baseline revealed opportunities to build stronger defensive habits across routine situations. 
              This is a natural starting point: everyday digital threats exploit common instincts like urgency and trust. 
              The modules ahead will provide clear, repeatable reflexes.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. WHERE YOU CAN BECOME SAFER (IMPROVEMENT OPPORTUNITIES)                 */}
      {/* ========================================================================= */}
      <section className="profile-section" aria-labelledby="heading-opportunities">
        <div className="profile-section-header header-opportunities">
          <span className="profile-section-kicker">Targeted Growth</span>
          <h2 id="heading-opportunities" className="profile-section-title">
            Where You Can Become Safer
          </h2>
          <p className="profile-section-desc">
            Situations where pressure, urgency, or unfamiliar interfaces created risk, along with practical safer alternatives.
          </p>
        </div>

        {opportunities.length > 0 ? (
          <div className="profile-cards-grid">
            {opportunities.map((opp) => (
              <article key={opp.key} className="profile-item-card card-opportunity">
                <span className="profile-item-tag tag-opportunity">
                  Improvement Opportunity • {opp.code}
                </span>
                <h3 className="profile-item-title">{opp.learnerTitle}</h3>
                <p className="profile-item-evidence">
                  Observed baseline score: <strong>{opp.score}%</strong> across {opp.opportunities} decision opportunities. 
                  Under simulated urgency or unfamiliar requests, choices leaned toward action without sufficient verification.
                </p>
                <div className="profile-item-callout">
                  <strong>Safer Alternative Habit</strong>
                  {opp.practicalRule}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-item-card card-strength">
            <span className="profile-item-tag tag-strength">Robust Baseline</span>
            <h3 className="profile-item-title">Consistent Caution Across Measured Situations</h3>
            <p className="profile-item-evidence">
              You avoided the major deception traps presented in Your Digital Day. To stay resilient against emerging threats 
              such as AI voice cloning, SIM swapping, and institutional impersonation, continue routine practice.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. THE SIX BEHAVIOURAL DIMENSIONS BREAKDOWN                               */}
      {/* ========================================================================= */}
      <section className="profile-section" aria-labelledby="heading-dimensions">
        <div className="profile-section-header header-dimensions">
          <span className="profile-section-kicker">Complete Measurement</span>
          <h2 id="heading-dimensions" className="profile-section-title">
            Understand the Six Behavioural Dimensions
          </h2>
          <p className="profile-section-desc">
            Digital awareness requires distinct, independent reflexes. We measure six separate areas rather than calculating a misleading average score.
          </p>
        </div>

        <div className="profile-dimensions-grid">
          {evaluatedDimensions.map((dim) => {
            const isUnassessed = dim.status === 'unassessed';
            const isLimited = dim.status === 'limited';
            const isStrength = dim.status === 'strength';

            let badgeClass = 'badge-measured-opportunity';
            let badgeText = 'Improvement Opportunity';
            let fillClass = 'meter-fill-opportunity';

            if (isUnassessed) {
              badgeClass = 'badge-not-assessed';
              badgeText = 'Not Evaluated in This Scenario';
            } else if (isLimited) {
              badgeClass = 'badge-limited-evidence';
              badgeText = 'Limited Evidence (1 check)';
            } else if (isStrength) {
              badgeClass = 'badge-measured-strength';
              badgeText = isV2 && dim.encounters >= 2 && dim.encounters <= 3
                ? 'Demonstrated Strength (Focused sample)'
                : 'Demonstrated Strength';
              fillClass = 'meter-fill-strength';
            } else if ((dim.score ?? 0) < 40) {
              fillClass = 'meter-fill-danger';
            } else if (isV2 && dim.encounters >= 2 && dim.encounters <= 3) {
              badgeText = 'Improvement Opportunity (Focused sample)';
            }

            const statsLabel = isUnassessed
              ? 'No evaluations'
              : isV2
                ? `${dim.encounters} evaluated situations`
                : `${dim.opportunities} opportunity points`;

            return (
              <div key={dim.key} className="dimension-card">
                <div>
                  <div className="dimension-card-header">
                    <div className="dimension-name-group">
                      <span className="dimension-code-chip">{dim.code}</span>
                      <h3 className="dimension-label">{dim.learnerTitle}</h3>
                    </div>
                    <span className={`dimension-status-badge ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <p className="dimension-meta-desc">{dim.shortDesc}</p>

                  <div className="dimension-meter-container">
                    <div 
                      className="dimension-meter-bar" 
                      role="progressbar" 
                      aria-valuenow={isUnassessed ? 0 : dim.score} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                      aria-label={`${dim.learnerTitle} score`}
                    >
                      {!isUnassessed && (
                        <div 
                          className={`dimension-meter-fill ${fillClass}`} 
                          style={{ width: `${Math.max(4, dim.score ?? 0)}%` }} 
                        />
                      )}
                    </div>
                    <div className="dimension-meter-stats">
                      <span>{statsLabel}</span>
                      <span className="dimension-score-number">
                        {isUnassessed ? 'N/A' : `${dim.score}%`}
                      </span>
                    </div>
                  </div>

                  {dim.key === 'falsePositive' && !isUnassessed && isV2 && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong>Scoring Transparency:</strong> Accrued <strong>{activeData.falsePositivePenaltyPoints ?? 0}</strong> penalty pt(s) out of <strong>{dim.opportunities || activeData.falsePositiveMaxPenaltyPoints || 8}</strong> max penalty across <strong>{dim.encounters}</strong> evaluated authentic situations. A raw penalty ≤ 2 is classified as <strong>Demonstrated Strength</strong> across both branch paths.
                    </div>
                  )}

                  {dim.key === 'unreviewedAcceptance' && !isUnassessed && isV2 && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong>Scoring Transparency:</strong> Accrued <strong>{activeData.unreviewedAcceptancePenaltyPoints ?? 0}</strong> penalty pt(s) out of <strong>{dim.opportunities || activeData.unreviewedAcceptanceMaxPenaltyPoints || 8}</strong> max penalty across <strong>{dim.encounters}</strong> evaluated situations.
                    </div>
                  )}
                </div>

                <div className="dimension-action-rule">
                  <strong>Defensive Reflex</strong>
                  {dim.practicalRule}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INDIAN CYBER LAW CONNECTIONS                                           */}
      {/* ========================================================================= */}
      <section className="profile-section" aria-labelledby="heading-law">
        <div className="profile-section-header header-law">
          <span className="profile-section-kicker">Statutory Context</span>
          <h2 id="heading-law" className="profile-section-title">
            How Your Habits Connect to Indian Cyber Law
          </h2>
          <p className="profile-section-desc">
            Understanding legal boundaries clarifies why certain digital behaviors matter. Laws define perpetrator liabilities, victim protections, and procedural remedies.
          </p>
        </div>

        <div className="statute-cards-grid">
          {STATUTORY_REFERENCES.map((st, idx) => (
            <article key={idx} className="statute-card">
              <div className="statute-header">
                <span className="statute-section-tag">{st.section}</span>
                <span className={`statute-status-pill ${st.status === 'IN_FORCE' ? 'status-in-force' : 'status-enacted-future'}`}>
                  {st.statusLabel}
                </span>
              </div>
              <div className="statute-act-name">{st.act} • {st.officialTitle}</div>
              <p className="statute-summary">{st.summary}</p>
              <div className="statute-practical-context">
                <strong>Why this matters to you:</strong> {st.practicalContext}
              </div>
            </article>
          ))}
        </div>

        {/* Emergency Reporting Banner */}
        <div className="emergency-helpline-banner">
          <div className="helpline-details">
            <h3 className="helpline-title">National Cybercrime Reporting: Helpline 1930</h3>
            <p className="helpline-desc">
              If financial cyber fraud occurs, report as swiftly as possible to the National Cybercrime Helpline <strong>1930</strong> or visit <strong>cybercrime.gov.in</strong>. 
              Prompt reporting enables law enforcement and financial intermediaries to coordinate through CFCFRMS to attempt inter-bank transaction holds. 
              <em>(Inter-bank hold execution is subject to technical verification and intermediary response speeds; fund freezes or recovery cannot be guaranteed.)</em>
            </p>
          </div>
          <a 
            href="https://cybercrime.gov.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="helpline-badge-cta"
            aria-label="Visit National Cybercrime Reporting Portal (opens in new tab)"
          >
            cybercrime.gov.in &rarr;
          </a>
        </div>

        {/* Explicit Legal Safeguards Notice */}
        <div className="legal-safeguards-box">
          <strong>Legal Distinction &amp; Educational Notice:</strong> A mistake in a simulated situation is not a criminal violation. 
          Similarly, receiving an unsolicited or suspicious message does not automatically satisfy the formal elements of a statutory offence. 
          This portal provides educational awareness to cultivate defensive habits and does not constitute formal legal counsel.
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. WHAT HAPPENS NEXT? (ADAPTIVE MICRO-LEARNING PATHWAYS)                   */}
      {/* ========================================================================= */}
      <section className="profile-section" aria-labelledby="heading-remediation">
        <div className="profile-section-header header-strengths">
          <span className="profile-section-kicker">Recommended Pathways</span>
          <h2 id="heading-remediation" className="profile-section-title">
            What Happens Next?
          </h2>
          <p className="profile-section-desc">
            Based on your baseline findings, your learning workspace has unlocked targeted 3-step micro-learning pathways. You can launch, practice, and track them directly from your dashboard.
          </p>
        </div>

        <RemediationCards sessionId={sessionId} isPreviewOnly={true} />
      </section>

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE DECISION EVIDENCE TRAIL (EXPANDABLE)                       */}
      {/* ========================================================================= */}
      {decisionEvidence.length > 0 && (
        <section className="profile-section evidence-trail-container" aria-labelledby="heading-evidence">
          <div className="profile-section-header">
            <span className="profile-section-kicker">Verified Trail</span>
            <h2 id="heading-evidence" className="profile-section-title">
              Your Decision Trail Across the 5 Situations
            </h2>
            <p className="profile-section-desc">
              Review each specific situation you encountered and see the reasoning behind your decisions.
            </p>
          </div>

          <div className="evidence-trail-list">
            {decisionEvidence.map((item, idx) => {
              const isOpen = openEvidenceIndex === idx;
              const isSafe = item.riskLevel === 'safe' || item.outcomeType === 'correct';
              const isCaution = item.riskLevel === 'low-risk' || item.outcomeType === 'neutral';
              const isRisk = item.riskLevel === 'high-risk' || item.riskLevel === 'critical' || item.isCriticalMistake;

              let outcomeBadgeClass = 'badge-outcome-caution';
              let outcomeBadgeText = 'Neutral / Low Risk';

              if (isSafe) {
                outcomeBadgeClass = 'badge-outcome-safe';
                outcomeBadgeText = 'Safe Decision';
              } else if (isRisk) {
                outcomeBadgeClass = 'badge-outcome-risk';
                outcomeBadgeText = item.isCriticalMistake ? 'Critical Vulnerability' : 'Unsafe Action';
              }

              return (
                <div key={idx} className={`evidence-row-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="evidence-row-button"
                    onClick={() => toggleEvidence(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`evidence-content-${idx}`}
                  >
                    <div className="evidence-row-summary">
                      <div className="evidence-stage-tag">
                        Situation {item.stageOrder || idx + 1} • {item.eventClassification === 'legitimate' ? 'Legitimate Notice' : 'Threat Lure'}
                      </div>
                      <h3 className="evidence-stage-title">{item.stageTitle}</h3>
                    </div>
                    <div className="evidence-badges-group">
                      <span className={outcomeBadgeClass}>{outcomeBadgeText}</span>
                      <span className="evidence-expand-chevron" aria-hidden="true">&#9662;</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div id={`evidence-content-${idx}`} className="evidence-details-pane">
                      <div className="evidence-detail-group">
                        <span className="evidence-detail-label">Your Decision</span>
                        <p className="evidence-choice-text">&ldquo;{item.decisionText}&rdquo;</p>
                      </div>

                      <div className="evidence-detail-group">
                        <span className="evidence-detail-label">Why This Matters</span>
                        <p className="evidence-explanation-text">{item.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. ACTIONS & NAVIGATION                                                   */}
      {/* ========================================================================= */}
      <div className="profile-actions-bar">
        <button
          onClick={() => navigate('/dashboard')}
          className="profile-btn-primary"
        >
          Go to Your Learning Dashboard &rarr;
        </button>

        {onRetake && (
          <button
            onClick={onRetake}
            className="profile-btn-secondary"
          >
            Retake First Check (New Session)
          </button>
        )}
      </div>
    </div>
  );
}

export default DigitalAwarenessProfile;

