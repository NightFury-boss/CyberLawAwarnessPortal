import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

/**
 * Editorial Everyday Digital Situations Section
 * 
 * Synchronized Storytelling Architecture:
 * - Left Column: Sequential scenario narratives (Incident Case Files)
 * - Right Column: Sticky verification workspace updating dynamically with scroll
 * - Active scenario changes smoothly based on scroll reading line and user interaction
 * - Mobile: Unified vertical flow (Narrative -> Transition -> Verification) per scenario
 * 
 * Distinct Educational Responsibilities:
 * - Panel 1 (Narrative): "What happened, and why should I be cautious?"
 *   (Scenario context, simulated incoming communication exclusively here, deceptive signals, why it matters)
 * - Panel 2 (Verification): "How can I independently establish what is genuine and decide what to do?"
 *   (Verification objective, 3 numbered independent steps, evidence to check, safe response Do vs. Avoid, statute)
 */
const MOMENTS_DATA = [
  {
    id: 'utility-sms',
    num: '01',
    tag: 'Utility Communication',
    channel: 'Power Distribution Billing System',
    senderBadge: 'SMS: VK-PSPCL-ALRT',
    timestamp: 'Today · 16:42 IST',
    whatToNotice: 'Unexpected urgency and direct phone contacts',
    guidance: 'Unexpected urgency is a reason to pause. Genuine utility providers do not dispatch individual officers with private mobile numbers to settle arrears.',
    message: 'DEAR CONSUMER: Your electricity connection will be disconnected at 09:30 PM tonight from the power grid substation because previous month bill is unpaid. Immediately call Power Officer Verma at 9811204918 to clear arrears.',
    deceptiveSignal: 'Unofficial 10-digit mobile contact (9811204918) provided for clearance instead of official customer care.',
    whyItMatters: 'Disconnection notices never direct urgent clearance to personal lines. Scammers manufacture evening deadlines to create panic and bypass institutional verification.',
    verification: {
      objective: 'Establish authentic billing and disconnection status directly with the utility, bypassing caller numbers.',
      steps: [
        'Open your browser and navigate directly to your state power distribution portal (e.g., pspcl.in) or registered mobile app.',
        'Enter your 10-digit Consumer Account (CA) number from past bills to check real-time dues and disconnection orders.',
        'Settle dues only through the official payment gateway, or call the verified toll-free care line on past physical bills.'
      ],
      evidence: '10-digit Consumer Account (CA) number on your physical bill and official billing ledger.',
      safeResponse: {
        do: 'Verify status directly through the utility portal or registered customer service desk.',
        avoid: 'Never dial private contacts or transfer money via personal UPI to purported power officers.'
      }
    },
    statuteRef: 'IT ACT § 66D',
    statuteTitle: 'Cheating by Personation',
    exploreLink: '/crimes',
    exploreLabel: 'Explore Impersonation Patterns in Crimes Library'
  },
  {
    id: 'delivery-sms',
    num: '02',
    tag: 'Logistics & Delivery',
    channel: 'Package Shipment Exception Desk',
    senderBadge: 'SMS: DELHIVERY-TRACK',
    timestamp: 'Today · 11:18 IST',
    whatToNotice: 'Nominal fees and unverified external links',
    guidance: 'Deceptive notifications use small unexpected fees to disarm caution. The nominal fee is a pretext to harvest payment credentials.',
    message: 'ALERT: Your package #IN-883921 could not be delivered due to incomplete apartment number. Update your delivery address within 12 hours at delhivery-track-support.top/address to prevent parcel return. Re-routing fee of INR 15 applies.',
    deceptiveSignal: 'Deceptive non-standard domain (.top) and a nominal INR 15 fee used to collect card data.',
    whyItMatters: 'Couriers never demand micro-payments on third-party domains to fix addresses. The link leads to a clone designed to harvest card credentials.',
    verification: {
      objective: 'Establish genuine parcel transit and address exception status using official courier systems without clicking SMS links.',
      steps: [
        'Check your e-commerce order history to confirm the assigned courier partner and authentic tracking number.',
        'Open the courier’s verified portal (e.g., delhivery.com) or mobile app directly in your browser.',
        'Enter the Air Waybill (AWB) number into the official tracker to inspect genuine delivery notes and address flags.'
      ],
      evidence: 'Air Waybill (AWB #IN-883921), merchant order manifest, and address on the merchant portal.',
      safeResponse: {
        do: 'Track shipments solely through the courier’s official app or merchant order history.',
        avoid: 'Never open .top or shortened URLs; never pay unsolicited re-routing fees to prevent returns.'
      }
    },
    statuteRef: 'IT ACT § 66C',
    statuteTitle: 'Identity & Credential Theft',
    exploreLink: '/prevention',
    exploreLabel: 'Explore Safe Verification Protocols in Prevention'
  },
  {
    id: 'tax-refund-sms',
    num: '03',
    tag: 'Financial & Government',
    channel: 'Direct Tax Assessment Year 2024',
    senderBadge: 'SMS: ITD-REFUND-GOV',
    timestamp: 'Yesterday · 14:05 IST',
    whatToNotice: 'Sensitive payment credential requests and unofficial domains',
    guidance: 'Statutory tax refunds credit directly into pre-validated bank accounts without soliciting card numbers, CVVs, or PINs.',
    message: 'Govt of India - Income Tax Dept: An outstanding tax refund of INR 18,420 has been sanctioned for Assessment Year 2024. Please submit your bank account and debit card verification details at incometax-gov-efiling.top/refund to receive immediate credit.',
    deceptiveSignal: 'Solicitation of debit card credentials on an unofficial domain (.top) for incoming funds.',
    whyItMatters: 'Government tax refunds process directly via ECS/NEFT to pre-validated bank accounts. Incoming transfers never require card numbers, CVVs, or ATM PINs.',
    verification: {
      objective: 'Confirm whether a tax refund has been officially issued by the Income Tax Department without disclosing payment credentials.',
      steps: [
        'Navigate directly to the official Income Tax e-Filing portal at eportal.incometax.gov.in.',
        'Log in securely using your PAN or Aadhaar and password with multi-factor authentication.',
        'Go to \'e-File\' > \'Income Tax Returns\' > \'View Filed Returns\' to check the official Refund/Demand Status for AY 2024–25.'
      ],
      evidence: 'ITR-V Acknowledgment Number, Section 143(1) intimation order, and pre-validated bank account status.',
      safeResponse: {
        do: 'Check refund status solely inside the authenticated e-Filing portal.',
        avoid: 'Never enter debit card numbers, CVVs, expiry dates, or OTPs for incoming funds; government refunds never require card verification.'
      }
    },
    statuteRef: 'IT ACT § 66D / RBI RULES',
    statuteTitle: 'Impersonation & Zero-Liability',
    exploreLink: '/cases',
    exploreLabel: 'Review Real Incident Analyses in Case Studies'
  }
];

export default function DigitalMomentsSection() {
  const [activeMomentId, setActiveMomentId] = useState(MOMENTS_DATA[0].id);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  );
  const isClickingRef = useRef(false);
  const clickTimeoutRef = useRef(null);

  // Viewport resize watcher
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hybrid Scroll-Linking (IntersectionObserver + Scroll Position Sentinel)
  useEffect(() => {
    if (isMobile) return;

    let ticking = false;

    const evaluateActiveSituation = () => {
      if (isClickingRef.current) return;

      const readingLine = window.innerHeight * 0.38;
      let bestId = null;
      let minDistance = Infinity;

      MOMENTS_DATA.forEach((moment) => {
        const el = document.getElementById(`moment-item-${moment.id}`);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Check if card is within the active vertical range
        if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
          const cardMid = rect.top + Math.min(rect.height * 0.4, 250);
          const distance = Math.abs(cardMid - readingLine);
          if (distance < minDistance) {
            minDistance = distance;
            bestId = moment.id;
          }
        }
      });

      if (bestId) {
        setActiveMomentId((prev) => (prev !== bestId ? bestId : prev));
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          evaluateActiveSituation();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    evaluateActiveSituation();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [isMobile]);

  const handleSelectMoment = (momentId) => {
    const el = document.getElementById(`moment-item-${momentId}`);
    if (!el) return;

    isClickingRef.current = true;
    setActiveMomentId(momentId);

    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const headerOffset = 90;
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 700);
  };

  const activeIndex = MOMENTS_DATA.findIndex((m) => m.id === activeMomentId);
  const currentMoment = MOMENTS_DATA[activeIndex >= 0 ? activeIndex : 0];

  return (
    <section 
      className="digital-moments-section" 
      aria-labelledby="digital-moments-heading"
    >
      <div className="container">
        {/* Section Header */}
        <Reveal variant="fade-up" className="digital-moments-header">
          <span className="digital-moments-eyebrow">Everyday Digital Situations</span>
          <h2 id="digital-moments-heading" className="digital-moments-title">
            Awareness becomes useful when ordinary digital situations ask us to act quickly.
          </h2>
          <p className="digital-moments-subtitle">
            Most digital risk does not begin with complex technical attacks. It begins with ordinary messages, 
            unexpected notifications, and manufactured urgency designed to bypass critical pause.
          </p>
        </Reveal>

        {/* TWO-PART EDITORIAL COMPOSITION (DESKTOP) / NATURAL VERTICAL FLOW (MOBILE) */}
        <div className="digital-moments-editorial-layout">
          
          {/* LEFT COLUMN: PANEL 1 — UNDERSTAND THE SITUATION (SCROLLING NARRATIVE) */}
          <div className="moments-narrative-flow" role="feed" aria-label="Everyday digital situations narrative">
            {MOMENTS_DATA.map((moment) => {
              const isActive = moment.id === activeMomentId;

              return (
                <article
                  key={moment.id}
                  id={`moment-item-${moment.id}`}
                  data-moment-id={moment.id}
                  className={`moment-story-node ${isActive ? 'is-active-moment' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                  tabIndex={0}
                  onFocus={() => !isMobile && setActiveMomentId(moment.id)}
                >
                  <div className="moment-node-main-content">
                    {/* Panel 1 Header & Metadata */}
                    <div className="moment-node-header">
                      <div className="moment-node-meta">
                        <span className="moment-node-num">{moment.num}</span>
                        <span className="moment-node-divider" aria-hidden="true">/</span>
                        <span className="moment-node-tag">{moment.tag}</span>
                        {isActive && (
                          <span className="moment-active-pill" aria-label="Currently active scenario">
                            Active Situation
                          </span>
                        )}
                      </div>
                      <span className="moment-node-channel font-mono">{moment.channel}</span>
                    </div>

                    {/* Headline & Guidance */}
                    <h3 className="moment-node-title">
                      {moment.whatToNotice}
                    </h3>

                    <p className="moment-node-guidance">
                      {moment.guidance}
                    </p>

                    {/* Original Simulated Incoming Message (Displayed ONLY in Panel 1) */}
                    <div className="moment-node-preview-box">
                      <div className="preview-box-sender">
                        <span className="sender-badge font-mono">{moment.senderBadge}</span>
                        <span className="sender-time">{moment.timestamp}</span>
                      </div>
                      <blockquote className="preview-box-quote">
                        <p>&ldquo;{moment.message}&rdquo;</p>
                      </blockquote>
                    </div>

                    {/* Deceptive Signal & Why It Matters */}
                    <div className="moment-signal-block">
                      <div className="signal-row-warning">
                        <div className="signal-icon-wrap" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </div>
                        <div className="signal-content">
                          <span className="signal-label">Deceptive Signal:</span>
                          <p className="signal-desc">{moment.deceptiveSignal}</p>
                        </div>
                      </div>

                      <div className="signal-row-why">
                        <div className="signal-icon-wrap" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div className="signal-content">
                          <span className="signal-why-label">Why This Matters:</span>
                          <p className="signal-why-desc">{moment.whyItMatters}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Only Verification Workspace (Appears directly after narrative) */}
                  {isMobile && (
                    <div className="moment-mobile-verification-section" aria-label={`Verification steps for situation ${moment.num}`}>
                      <div className="moment-mobile-verification-divider">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                        <span className="mobile-verification-label">Investigate &amp; Verify Protocol</span>
                      </div>

                      {/* 1. Verification Objective */}
                      <div className="verification-block">
                        <span className="verification-subheading">1. Verification Objective</span>
                        <p className="verification-objective-text">{moment.verification.objective}</p>
                      </div>

                      {/* 2. Independent Verification Steps */}
                      <div className="verification-block">
                        <span className="verification-subheading">2. Independent Verification Steps</span>
                        <ol className="verification-steps-list">
                          {moment.verification.steps.map((step, idx) => (
                            <li key={idx} className="verification-step-item">
                              <span className="step-number-badge" aria-hidden="true">{idx + 1}</span>
                              <span className="step-text">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* 3. Evidence to Check */}
                      <div className="verification-block">
                        <span className="verification-subheading">3. Evidence to Check</span>
                        <div className="verification-evidence-box">
                          {moment.verification.evidence}
                        </div>
                      </div>

                      {/* 4. Safe Response */}
                      <div className="verification-block">
                        <span className="verification-subheading">4. Safe Response</span>
                        <div className="verification-response-grid">
                          <div className="response-row response-do">
                            <strong>Do:</strong> {moment.verification.safeResponse.do}
                          </div>
                          <div className="response-row response-avoid">
                            <strong>Avoid:</strong> {moment.verification.safeResponse.avoid}
                          </div>
                        </div>
                      </div>

                      {/* Statutory Anchor */}
                      <div className="evidence-statute-row">
                        <span className="statute-ref-badge">{moment.statuteRef}</span>
                        <span className="statute-title-label">{moment.statuteTitle}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Link */}
                  <div className="moment-node-footer">
                    <Link to={moment.exploreLink} className="moment-explore-link">
                      <span>{moment.exploreLabel}</span>
                      <span className="link-arrow" aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* RIGHT COLUMN: PANEL 2 — INVESTIGATE & VERIFY WORKSPACE (DESKTOP STICKY STAGE) */}
          {!isMobile && (
            <aside 
              className="moments-visual-stage-rail" 
              aria-label="Active digital situation verification workspace"
            >
              <div className="moments-evidence-stage" aria-live="polite">
                {/* Stage Header */}
                <div className="evidence-stage-header">
                  <div className="stage-header-left">
                    <span className="stage-context-badge">INVESTIGATE &amp; VERIFY WORKSPACE</span>
                    <span className="stage-active-step">SITUATION {currentMoment.num} OF 03</span>
                  </div>
                  <div className="stage-step-switcher" role="tablist" aria-label="Select digital situation for verification">
                    {MOMENTS_DATA.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="tab"
                        aria-selected={m.id === activeMomentId}
                        onClick={() => handleSelectMoment(m.id)}
                        className={`stage-switch-btn ${m.id === activeMomentId ? 'active' : ''}`}
                        aria-label={`Switch to situation ${m.num}: ${m.tag}`}
                      >
                        {m.num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verification Workspace Body (Specific to Active Situation, No Duplicate Message) */}
                <div key={currentMoment.id} className="evidence-stage-body portal-state-progression">
                  
                  {/* Category & Channel Context Docket */}
                  <div className="evidence-workspace-docket">
                    <div className="workspace-docket-header">
                      <span className="docket-tag font-mono">{currentMoment.tag}</span>
                      <span className="docket-channel font-mono">{currentMoment.channel}</span>
                    </div>
                  </div>

                  {/* 1. Verification Objective */}
                  <div className="verification-block">
                    <div className="verification-block-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12.01" y2="8" />
                      </svg>
                      <span className="verification-heading-label">1. VERIFICATION OBJECTIVE</span>
                    </div>
                    <p className="verification-objective-text">
                      {currentMoment.verification.objective}
                    </p>
                  </div>

                  {/* 2. Independent Verification Steps */}
                  <div className="verification-block">
                    <div className="verification-block-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <span className="verification-heading-label">2. INDEPENDENT VERIFICATION STEPS</span>
                    </div>
                    <ol className="verification-steps-list">
                      {currentMoment.verification.steps.map((step, idx) => (
                        <li key={idx} className="verification-step-item">
                          <span className="step-number-badge" aria-hidden="true">{idx + 1}</span>
                          <span className="step-text">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 3. Evidence to Check */}
                  <div className="verification-block">
                    <div className="verification-block-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span className="verification-heading-label">3. EVIDENCE TO CHECK</span>
                    </div>
                    <div className="verification-evidence-box">
                      {currentMoment.verification.evidence}
                    </div>
                  </div>

                  {/* 4. Safe Response */}
                  <div className="verification-block">
                    <div className="verification-block-header">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="verification-heading-label">4. SAFE RESPONSE</span>
                    </div>
                    <div className="verification-response-grid">
                      <div className="response-row response-do">
                        <strong>Do:</strong> {currentMoment.verification.safeResponse.do}
                      </div>
                      <div className="response-row response-avoid">
                        <strong>Avoid:</strong> {currentMoment.verification.safeResponse.avoid}
                      </div>
                    </div>
                  </div>

                  {/* 5. Statutory Reference Anchor */}
                  <div className="evidence-statute-row">
                    <span className="statute-ref-badge">{currentMoment.statuteRef}</span>
                    <span className="statute-title-label">{currentMoment.statuteTitle}</span>
                  </div>

                </div>

                {/* Stage Footer Hint */}
                <div className="evidence-stage-footer" aria-hidden="true">
                  <span className="stage-hint-dot" />
                  <span className="stage-hint-text">
                    Verification updates as you scroll through everyday situations
                  </span>
                </div>

              </div>
            </aside>
          )}

        </div>
      </div>
    </section>
  );
}
