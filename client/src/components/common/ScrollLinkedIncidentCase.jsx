import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * ScrollLinkedIncidentCase
 * 
 * Editorial scroll-linked incident investigation for Case File 014.
 * 
 * Seamlessly connects:
 * - Left: Sticky Forensic Evidence Docket (persists throughout ALL stages, including bottom of stage 04)
 * - Right: Chronological Narrative Flow
 * - Enclosure: Unified Dossier Frame with top and bottom bridge banners
 * 
 * Mobile: Clean natural document flow, zero horizontal overflow.
 */

const CASE_014_STAGES = [
  {
    id: 'stage-contact',
    number: '01',
    phaseName: 'Initial Contact',
    statuteRef: 'IT ACT § 66D',
    statuteTitle: 'Cheating by Personation',
    threatCategory: 'SPOOFED IDENTITY',
    severity: 'INITIAL TRIGGER',
    severityClass: 'severity-medium',
    telemetry: {
      channel: 'Incoming Voice Call (VoIP)',
      callerId: 'Card Security Desk',
      displayNum: '+91-98110-XXXXX',
      anomalousSignal: 'Caller ID mimics official bank syntax but originates from untrusted routing.'
    },
    narrative: {
      title: 'The Deceptive Trigger',
      lead: 'A voice call arrives claiming an unauthorized transaction of ₹48,900 is currently pending debit against your registered credit card.',
      actionDetail: 'The caller addresses you by name and recites the last four digits of your card, creating immediate artificial familiarity.'
    },
    legalContext: 'IT Act § 66D prescribes up to 3 years imprisonment and fines for anyone who by means of any computer resource cheats by personating.'
  },
  {
    id: 'stage-urgency',
    number: '02',
    phaseName: 'Manufactured Urgency',
    statuteRef: 'BNS § 318(4)',
    statuteTitle: 'Criminal Deception & Fraud',
    threatCategory: 'PSYCHOLOGICAL PRESSURE',
    severity: 'ESCALATING PRESSURE',
    severityClass: 'severity-high',
    telemetry: {
      channel: 'Urgency Tactic',
      callerId: 'Immediate Intervention Desk',
      displayNum: 'Urgent Timer: 120s remaining',
      anomalousSignal: 'Perpetrator refuses to allow call-back and threatens immediate total account freeze.'
    },
    narrative: {
      title: 'Suppressing the Critical Pause',
      lead: 'The caller insists that unless identity is re-authenticated within two minutes, the funds will irreversibly leave your account.',
      actionDetail: 'By manufacturing panic, the attacker attempts to bypass rational verification and force an instinctual emotional response.'
    },
    legalContext: 'RBI guidelines strictly mandate that official bank representatives will never demand passwords or one-time passcodes to reverse fraudulent charges.'
  },
  {
    id: 'stage-decision',
    number: '03',
    phaseName: 'Pivotal Decision',
    statuteRef: 'VERIFICATION JUNCTION',
    statuteTitle: 'Critical Security Boundary',
    threatCategory: 'PASSCODE EXTRACTION',
    severity: 'DECISION BOUNDARY',
    severityClass: 'severity-critical',
    telemetry: {
      channel: 'SMS OTP Transmission',
      callerId: 'Issuer Banking SMS',
      displayNum: 'OTP: 839-201',
      anomalousSignal: 'SMS text explicitly states: "Do not share this OTP with anyone, including bank staff."'
    },
    narrative: {
      title: 'The Irreversible Handoff',
      lead: 'An SMS arrives on your mobile containing a 6-digit transaction authorization code. The caller urges: "Read out the digits to cancel."',
      actionDetail: 'This is the inflection point. Providing this number completes the attacker\'s unauthorized debit instead of reversing it.'
    },
    legalContext: 'Sharing an OTP constitutes customer-induced compromise under RBI circulars, jeopardizing the citizen\'s zero-liability defense.'
  },
  {
    id: 'stage-action',
    number: '04',
    phaseName: 'Safer Action',
    statuteRef: 'RBI / HELPLINE 1930',
    statuteTitle: 'Containment & Protection',
    threatCategory: 'CONTAINMENT & RECOVERY',
    severity: 'SAFE RESOLUTION',
    severityClass: 'severity-safe',
    telemetry: {
      channel: 'Citizen-Initiated Defense',
      callerId: 'Helpline 1930 / Official Portal',
      displayNum: 'cybercrime.gov.in',
      anomalousSignal: 'Call terminated. Card frozen via official banking app in 45 seconds.'
    },
    narrative: {
      title: 'Terminating the Chain & Official Reporting',
      lead: 'You pause, disconnect the call immediately, open your official mobile banking application, and temporarily lock the card.',
      actionDetail: 'You dial 1930 to report the spoofing attempt to the National Cyber Crime Reporting Portal, documenting the call timestamp.'
    },
    legalContext: 'Reporting unauthorized attempts within 3 days ensures zero financial liability for citizens under RBI guidelines (DBR.No.Leg.BC.78).'
  }
];

export default function ScrollLinkedIncidentCase() {
  const [activeStageId, setActiveStageId] = useState(CASE_014_STAGES[0].id);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  );
  const isClicking = useRef(false);
  const clickTimeout = useRef(null);

  // Monitor viewport width for mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // IntersectionObserver to sync active stage with scroll position
  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px',
      threshold: [0, 0.25, 0.5]
    };

    const handleIntersect = (entries) => {
      if (isClicking.current) return;

      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        const targetLine = window.innerHeight * 0.35;
        visibleEntries.sort((a, b) => {
          return Math.abs(a.boundingClientRect.top - targetLine) - Math.abs(b.boundingClientRect.top - targetLine);
        });
        const id = visibleEntries[0].target.getAttribute('data-stage-id');
        if (id) {
          setActiveStageId(id);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    CASE_014_STAGES.forEach((stage) => {
      const el = document.getElementById(`incident-stage-${stage.id}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, []);

  const handleStepClick = (stageId) => {
    const el = document.getElementById(`incident-stage-${stageId}`);
    if (!el) return;

    isClicking.current = true;
    setActiveStageId(stageId);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerOffset = 90;
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      isClicking.current = false;
    }, 600);
  };

  const activeIndex = CASE_014_STAGES.findIndex((s) => s.id === activeStageId);
  const activeStage = CASE_014_STAGES[activeIndex >= 0 ? activeIndex : 0];
  const progressPercent = ((activeIndex + 1) / CASE_014_STAGES.length) * 100;

  return (
    <div className="incident-dossier-frame" aria-label="Case File 014 Incident Progression">
      
      {/* 1. TOP INSTITUTIONAL DOSSIER BANNER (CONNECTS BOTH SIDES) */}
      <div className="dossier-frame-banner">
        <div className="banner-meta-left">
          <span className="banner-file-badge">CASE FILE 014</span>
          <span className="banner-file-title">Simulated Vishing Reconstruction</span>
          <span className="banner-file-statute">IT Act § 66D</span>
        </div>
        <div className="banner-meta-right">
          <div className="banner-live-indicator">
            <span className={`live-pulse-dot dot-${activeStage.severityClass}`} />
            <span className="live-status-text">
              Stage {activeStage.number} of 04: {activeStage.phaseName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN SEAMLESSLY CONNECTED TWO-COLUMN GRID */}
      <div className="incident-scroll-grid">
        
        {/* LEFT COLUMN: PERSISTENT STICKY CASE EVIDENCE & STATUTORY CONTEXT (DESKTOP) */}
        {!isMobile && (
          <aside className="incident-sticky-rail" aria-label="Active incident evidence and statutory context">
            <div className="incident-dossier-card" aria-live="polite">
              
              {/* Dossier Card Header */}
              <div className="dossier-top-bar">
                <div className="dossier-status-pill">
                  <span className={`status-dot dot-${activeStage.severityClass}`} />
                  <span className="status-text">{activeStage.severity}</span>
                </div>
                <span className="dossier-step-counter">
                  STAGE {activeStage.number} / 04
                </span>
              </div>

              {/* Progress Line */}
              <div 
                className="dossier-progress-line" 
                role="progressbar" 
                aria-valuenow={progressPercent} 
                aria-valuemin={0} 
                aria-valuemax={100}
                aria-label="Incident timeline progression"
              >
                <div 
                  className="dossier-progress-fill" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>

              {/* Incident Record Panel */}
              <div className="dossier-telemetry-box">
                <div className="telemetry-row">
                  <span className="telemetry-label">Channel</span>
                  <span className="telemetry-val">{activeStage.telemetry.channel}</span>
                </div>
                <div className="telemetry-row">
                  <span className="telemetry-label">Source</span>
                  <span className="telemetry-val font-mono">{activeStage.telemetry.callerId}</span>
                </div>
                <div className="telemetry-row">
                  <span className="telemetry-label">Identifier</span>
                  <span className="telemetry-val font-mono">{activeStage.telemetry.displayNum}</span>
                </div>
              </div>

              {/* Key Deceptive Indicator */}
              <div className="dossier-anomaly-block">
                <span className="anomaly-heading">Key Deceptive Indicator:</span>
                <p className="anomaly-desc">{activeStage.telemetry.anomalousSignal}</p>
              </div>

              {/* Statutory Anchor Box */}
              <div className="dossier-statute-box">
                <div className="statute-box-header">
                  <span className="statute-badge">{activeStage.statuteRef}</span>
                  <span className="statute-sub">{activeStage.statuteTitle}</span>
                </div>
                <p className="statute-text">{activeStage.legalContext}</p>
              </div>

              {/* Quick Jump Stage Indicator Tabs with Active Arrow Bridge */}
              <div className="dossier-nav-pills" role="navigation" aria-label="Incident stages">
                {CASE_014_STAGES.map((stg) => {
                  const isCur = stg.id === activeStageId;
                  return (
                    <button
                      key={stg.id}
                      type="button"
                      onClick={() => handleStepClick(stg.id)}
                      className={`dossier-nav-btn ${isCur ? 'is-active' : ''}`}
                      aria-current={isCur ? 'step' : undefined}
                      aria-label={`Jump to stage ${stg.number}: ${stg.phaseName}`}
                    >
                      <span className="nav-num">{stg.number}</span>
                      <span className="nav-name">{stg.phaseName}</span>
                      {isCur && <span className="nav-active-arrow" aria-hidden="true">&rarr;</span>}
                    </button>
                  );
                })}
              </div>

              <div className="dossier-footer">
                <span className="dossier-hint">Evidence and statutory context synchronized to active narrative</span>
              </div>
            </div>
          </aside>
        )}

        {/* RIGHT COLUMN: SCROLLING EDITORIAL NARRATIVE STAGES */}
        <div className="incident-narrative-flow" role="feed" aria-label="Incident timeline narrative">
          {CASE_014_STAGES.map((stg, idx) => {
            const isCur = stg.id === activeStageId;
            const isLast = idx === CASE_014_STAGES.length - 1;

            return (
              <article
                key={stg.id}
                id={`incident-stage-${stg.id}`}
                data-stage-id={stg.id}
                className={`incident-stage-block ${isCur ? 'is-current-stage' : ''} ${stg.severityClass}`}
                aria-current={isCur ? 'step' : undefined}
              >
                {/* Connecting Spine Visual */}
                <div className="stage-spine-column" aria-hidden="true">
                  <div className={`stage-node-circle ${isCur ? 'node-active' : ''}`}>
                    <span>{stg.number}</span>
                  </div>
                  {!isLast && <div className={`stage-spine-rail ${isCur ? 'rail-active' : ''}`} />}
                </div>

                {/* Stage Narrative Card Content */}
                <div className="stage-content-card">
                  <header className="stage-card-header">
                    <div className="stage-badge-group">
                      <span className="stage-phase-tag">{stg.phaseName}</span>
                      <span className={`stage-severity-tag tag-${stg.severityClass}`}>
                        {stg.threatCategory}
                      </span>
                    </div>
                    <h4 className="stage-card-title">{stg.narrative.title}</h4>
                    <p className="stage-card-lead">{stg.narrative.lead}</p>
                  </header>

                  <div className="stage-card-body">
                    <p className="stage-action-detail">{stg.narrative.actionDetail}</p>
                  </div>

                  {/* INLINE TELEMETRY & STATUTE FOR MOBILE VIEW (<= 900px) */}
                  {isMobile && (
                    <div className="stage-mobile-evidence-panel" aria-label="Stage evidence">
                      <div className="mobile-telemetry-row">
                        <span className="mobile-signal-label">Signal:</span>
                        <span className="mobile-signal-val">{stg.telemetry.anomalousSignal}</span>
                      </div>
                      <div className="mobile-statute-row">
                        <span className="mobile-statute-badge">{stg.statuteRef}</span>
                        <span className="mobile-statute-text">{stg.legalContext}</span>
                      </div>
                    </div>
                  )}

                  {/* Stage Footer Anchor */}
                  <footer className="stage-card-footer">
                    <span className="stage-statute-ref">Reference: {stg.statuteRef} · {stg.statuteTitle}</span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>

      </div>

      {/* 3. CASE DOSSIER BOTTOM BRIDGE BAR (SEALS THE ENCLOSURE) */}
      <div className="dossier-frame-bottombar">
        <div className="bottombar-left">
          <strong>Outcome of Verified Decision:</strong>
          <span> Zero citizen financial liability under RBI guidelines; attacker vector reported to Helpline 1930.</span>
        </div>
        <Link to="/cases" className="bottombar-link">
          <span>Explore All 14 Case Studies</span>
          <span className="link-arrow" aria-hidden="true">&rarr;</span>
        </Link>
      </div>

    </div>
  );
}
