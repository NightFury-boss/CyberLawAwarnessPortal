import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

/**
 * Editorial Everyday Digital Moments Section
 * 
 * Complies with Section 1: HOME — EVERYDAY DIGITAL MOMENTS
 * - Desktop: Two-part composition (Left: scrolling narrative items 01, 02, 03; Right: stable visual/evidence stage)
 * - Active state changes as user scrolls: 01 → 02 → 03 with subtle, restrained transitions
 * - Mobile: Natural vertical sequence (Situation → Visual → Explanation → Next) without sticky constraint
 * - Full accessibility: semantic headings, keyboard jump, prefers-reduced-motion support, no scroll-jacking
 */
const MOMENTS_DATA = [
  {
    id: 'utility-sms',
    num: '01',
    tag: 'Utility Communication',
    channel: 'Power Distribution Billing System',
    senderBadge: 'SMS: VK-PSPCL-ALRT',
    timestamp: 'Today · 16:42 IST',
    deceptiveSignal: 'Unofficial 10-digit mobile contact (9811204918) provided for clearance',
    statuteRef: 'IT ACT § 66D',
    statuteTitle: 'Cheating by Personation',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    message: 'DEAR CONSUMER: Your electricity connection will be disconnected at 09:30 PM tonight from the power grid substation because previous month bill is unpaid. Immediately call Power Officer Verma at 9811204918 to clear arrears.',
    whatToNotice: 'Unexpected urgency and direct phone contacts',
    guidance: 'Unexpected urgency is a reason to pause. Genuine utility providers do not dispatch individual officers with private mobile numbers to settle arrears.',
    whatToVerify: 'Verify disconnection status directly inside your registered consumer portal or official customer care center.',
    officialPath: 'Login directly to state power distribution portal (e.g., pspcl.in) using your registered 10-digit Consumer Account Number.',
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
    deceptiveSignal: 'Deceptive .top domain & nominal INR 15 fee used to disarm caution',
    statuteRef: 'IT ACT § 66C',
    statuteTitle: 'Identity & Credential Theft',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    message: 'ALERT: Your package #IN-883921 could not be delivered due to incomplete apartment number. Update your delivery address within 12 hours at delhivery-track-support.top/address to prevent parcel return. Re-routing fee of INR 15 applies.',
    whatToNotice: 'Nominal fees and unverified external links',
    guidance: 'Deceptive notifications often use small unexpected fees to disarm caution. The fee is a pretext to harvest payment credentials.',
    whatToVerify: 'Check shipment status directly inside your official courier application using the original tracking number.',
    officialPath: 'Query AWB #IN-883921 solely within the courier\'s verified mobile app or verified portal domain.',
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
    deceptiveSignal: 'Solicitation of debit card credentials for incoming funds',
    statuteRef: 'IT ACT § 66D / RBI RULES',
    statuteTitle: 'Impersonation & Zero-Liability',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="7" y1="8" x2="17" y2="8" />
        <line x1="7" y1="12" x2="13" y2="12" />
        <circle cx="16" cy="15" r="2" />
      </svg>
    ),
    message: 'Govt of India - Income Tax Dept: An outstanding tax refund of INR 18,420 has been sanctioned for Assessment Year 2024. Please submit your bank account and debit card verification details at incometax-gov-efiling.top/refund to receive immediate credit.',
    whatToNotice: 'Sensitive payment credential requests and unofficial domains',
    guidance: 'Statutory tax refunds credit directly into pre-validated bank accounts without soliciting card numbers, CVVs, or PINs.',
    whatToVerify: 'Confirm tax refund issuance on the official e-filing portal (eportal.incometax.gov.in). Do not enter card data for incoming funds.',
    officialPath: 'Validate refund remittance solely within authenticated eportal.incometax.gov.in. No incoming transfer requires card PIN/CVV.',
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

  // IntersectionObserver for Desktop Scroll-Linking
  useEffect(() => {
    if (isMobile) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0.1
    };

    const handleIntersect = (entries) => {
      if (isClickingRef.current) return;

      const visible = entries.find((e) => e.isIntersecting);
      if (visible) {
        const id = visible.target.getAttribute('data-moment-id');
        if (id) {
          setActiveMomentId(id);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    MOMENTS_DATA.forEach((moment) => {
      const el = document.getElementById(`moment-item-${moment.id}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [isMobile]);

  const handleSelectMoment = (momentId) => {
    const el = document.getElementById(`moment-item-${momentId}`);
    if (!el) return;

    isClickingRef.current = true;
    setActiveMomentId(momentId);

    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const headerOffset = 84;
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 600);
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
          
          {/* LEFT COLUMN: SCROLLING NARRATIVE ITEMS */}
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
                  {/* Item Header & Numbering */}
                  <div className="moment-node-header">
                    <div className="moment-node-meta">
                      <span className="moment-node-num">{moment.num}</span>
                      <span className="moment-node-divider" aria-hidden="true">/</span>
                      <span className="moment-node-tag">{moment.tag}</span>
                    </div>
                    <span className="moment-node-channel font-mono">{moment.channel}</span>
                  </div>

                  {/* Headline */}
                  <h3 className="moment-node-title">
                    {moment.whatToNotice}
                  </h3>

                  {/* Educational Context & Deception Analysis */}
                  <p className="moment-node-guidance">
                    {moment.guidance}
                  </p>

                  {/* Simulated Incoming Message Box (Visible on both desktop & mobile) */}
                  <div className="moment-node-preview-box">
                    <div className="preview-box-sender">
                      <span className="sender-badge font-mono">{moment.senderBadge}</span>
                      <span className="sender-time">{moment.timestamp}</span>
                    </div>
                    <blockquote className="preview-box-quote">
                      <p>&ldquo;{moment.message}&rdquo;</p>
                    </blockquote>
                  </div>

                  {/* Deceptive Indicator & Verification Checklist */}
                  <div className="moment-node-checks">
                    <div className="node-check-row check-warning">
                      <div className="check-icon-wrap" aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <div className="check-text">
                        <strong className="check-label">Deceptive Signal:</strong> {moment.deceptiveSignal}
                      </div>
                    </div>

                    <div className="node-check-row check-safe">
                      <div className="check-icon-wrap" aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="check-text">
                        <strong className="check-label">What to verify:</strong> {moment.whatToVerify}
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Only Visual Stage Anchor */}
                  {isMobile && (
                    <div className="moment-mobile-stage-card" aria-label="Verification path">
                      <div className="mobile-stage-header">
                        <span className="stage-statute-pill">{moment.statuteRef}</span>
                        <span className="stage-statute-name">{moment.statuteTitle}</span>
                      </div>
                      <p className="mobile-stage-protocol">
                        <strong>Official Protocol:</strong> {moment.officialPath}
                      </p>
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

          {/* RIGHT COLUMN: STABLE VISUAL / EVIDENCE STAGE (DESKTOP ONLY) */}
          {!isMobile && (
            <aside 
              className="moments-visual-stage-rail" 
              aria-label="Active digital situation evidence stage"
            >
              <div className="moments-evidence-stage" aria-live="polite">
                
                {/* Stage Header */}
                <div className="evidence-stage-header">
                  <div className="stage-header-left">
                    <span className="stage-context-badge">EVIDENCE &amp; VERIFICATION STAGE</span>
                    <span className="stage-active-step">SITUATION {currentMoment.num} OF 03</span>
                  </div>
                  <div className="stage-step-switcher" role="tablist" aria-label="Select digital situation">
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

                {/* Subtle State-Aware Transition Container */}
                <div key={currentMoment.id} className="evidence-stage-body portal-state-progression">
                  
                  {/* Transmission Origin Slip */}
                  <div className="evidence-dispatch-slip">
                    <div className="slip-top-row">
                      <span className="slip-channel-tag font-mono">{currentMoment.channel}</span>
                      <span className="slip-timestamp font-mono">{currentMoment.timestamp}</span>
                    </div>
                    <div className="slip-source-row">
                      <span className="slip-sender font-mono">{currentMoment.senderBadge}</span>
                      <span className="slip-status-indicator">UNVERIFIED INCOMING</span>
                    </div>
                  </div>

                  {/* Simulated Authentic Document / Communication Card */}
                  <div className="evidence-message-card">
                    <div className="message-card-topbar">
                      <span className="message-type-indicator">Simulated Communication</span>
                      <span className="message-carrier">Telecom / Gateway Notice</span>
                    </div>
                    <p className="message-content-text">
                      {currentMoment.message}
                    </p>
                    
                    {/* Callout to Deceptive Indicator */}
                    <div className="message-anomaly-callout">
                      <span className="anomaly-callout-dot" aria-hidden="true" />
                      <div className="anomaly-callout-content">
                        <strong>Deceptive Indicator:</strong> {currentMoment.deceptiveSignal}
                      </div>
                    </div>
                  </div>

                  {/* Side-by-side Official Verification Protocol */}
                  <div className="evidence-verification-docket">
                    <div className="verification-docket-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                      <span>INDEPENDENT VERIFICATION PROTOCOL</span>
                    </div>
                    <p className="verification-docket-text">
                      {currentMoment.officialPath}
                    </p>
                  </div>

                  {/* Statutory Reference Anchor */}
                  <div className="evidence-statute-row">
                    <span className="statute-ref-badge">{currentMoment.statuteRef}</span>
                    <span className="statute-title-label">{currentMoment.statuteTitle}</span>
                  </div>

                </div>

                {/* Stage Footer Hint */}
                <div className="evidence-stage-footer" aria-hidden="true">
                  <span className="stage-hint-dot" />
                  <span className="stage-hint-text">
                    Stage updates as you read through everyday situations
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
