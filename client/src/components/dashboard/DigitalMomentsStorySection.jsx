import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * DigitalMomentsStorySection Component
 * 
 * Editorial storytelling connecting everyday digital moments with cybercrime
 * provisions and defensive instinct.
 * 
 * Refined Features (Stage 6 Final Acceptance):
 * - Direction-aware smooth sliding carousel transition (forward / backward).
 * - Explicit previous / next controls with 'Scenario X of 4' counter indicator.
 * - Full keyboard navigation (ArrowLeft / ArrowRight / Home / End) and visible focus rings.
 * - Strict prefers-reduced-motion support (zero layout shift or disorienting motion).
 * - Zero autoplay; 100% learner-controlled pacing.
 * - Fluid mobile responsiveness (375px and 390px) without horizontal page overflow.
 */
const SCENARIOS = [
  {
    id: 'power-cut',
    tabLabel: 'Utility Urgency',
    title: 'The Midnight Power Cut SMS',
    channel: 'SMS: VK-PSPCL-ALRT • 16:42 IST',
    sender: 'Power Distribution Billing System',
    message: '“DEAR CONSUMER: Your electricity connection will be disconnected at 09:30 PM tonight from the substation because previous month bill is unpaid. Immediately call Power Officer at 9811204918 to clear arrears.”',
    deceptiveSignal: 'Unofficial 10-digit mobile contact + artificial 5-hour cutoff designed to bypass critical pause.',
    statutePill: 'IT Act § 66D • Cheating by Personation',
    statuteRule: 'Statutory bodies never dispatch individual officers with private mobile numbers to demand instantaneous payment.',
    verificationProtocol: 'Login solely to the verified state power distribution portal (e.g., pspcl.in) using your registered 10-digit Consumer Account Number.',
    destination: '/workspace/cases',
    ctaText: 'Examine Case Study →'
  },
  {
    id: 'parcel-fee',
    tabLabel: 'Courier Re-Route',
    title: 'The Nominal ₹15 Redirection Fee',
    channel: 'SMS: DELHIVERY-TRACK • 11:18 IST',
    sender: 'Logistics Exception Desk',
    message: '“ALERT: Your package #IN-883921 could not be delivered due to incomplete apartment number. Update address at delhivery-track-support.top within 12 hours. Nominal re-routing fee of ₹15 applies.”',
    deceptiveSignal: 'Deceptive .top domain + nominal ₹15 fee used to disarm suspicion and harvest debit card CVVs.',
    statutePill: 'IT Act § 66C • Identity & Credential Theft',
    statuteRule: 'The small payment is a pretext. The genuine objective is capturing primary payment credentials on an unauthorized server.',
    verificationProtocol: 'Validate AWB #IN-883921 solely inside the official logistics mobile application or verified domain.',
    destination: '/workspace/prevention',
    ctaText: 'Read Prevention Protocol →'
  },
  {
    id: 'digital-arrest',
    tabLabel: 'Digital Arrest',
    title: 'The Video Summons & Coercion',
    channel: 'WhatsApp Video / Skype • 14:05 IST',
    sender: 'Cyber Crime Investigation Cell',
    message: '“Official Notice: An arrest warrant is active in Money Laundering Case #MH-9921. You are placed under Digital Arrest. Stay on video call and transfer funds to the verification escrow account to avoid immediate police arrival.”',
    deceptiveSignal: 'No Indian law enforcement agency or court conducts "digital arrest" via video call or requires funds transfer to "safe accounts".',
    statutePill: 'BNS § 204 & § 318(4) • Public Impersonation & Fraud',
    statuteRule: 'Statutory law permits arrest only under due CrPC/BNSS process. Real officers never conduct video interrogations for fund escrow.',
    verificationProtocol: 'Disconnect call immediately. Call National Cybercrime Helpline 1930 to trigger Golden Hour inter-bank hold coordination.',
    destination: '/workspace/crimes',
    ctaText: 'Explore Threat Pattern →'
  },
  {
    id: 'qr-scam',
    tabLabel: 'Reverse QR Code',
    title: 'The "Approve Payment" QR Code',
    channel: 'UPI Payment Link / Marketplace Chat',
    sender: 'Classifieds Buyer Inquiry',
    message: '“I have transferred ₹14,500 for your listed item. Please scan this attached QR code and enter your 6-digit UPI PIN to approve the funds deposit into your account.”',
    deceptiveSignal: 'Entering a UPI PIN or scanning a merchant QR code ALWAYS debits money; receiving funds NEVER requires entering a PIN.',
    statutePill: 'IT Act § 43 & RBI Digital Directives',
    statuteRule: 'UPI protocols are strictly push-to-pay. Entering a security PIN authorizes an outgoing transaction, never an incoming credit.',
    verificationProtocol: 'Never enter a PIN to receive incoming credits. Check transaction credit directly in your banking passbook.',
    destination: '/quizzes?mode=scenario',
    ctaText: 'Test UPI Knowledge in Quiz →'
  }
];

export default function DigitalMomentsStorySection() {
  const [activeTab, setActiveTab] = useState(0);
  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef(null);

  const activeScenario = SCENARIOS[activeTab] || SCENARIOS[0];

  const handleSelectScenario = (targetIdx) => {
    if (targetIdx === activeTab || targetIdx < 0 || targetIdx >= SCENARIOS.length) return;
    const direction = targetIdx > activeTab ? 'forward' : 'backward';
    setSlideDirection(direction);
    setIsTransitioning(true);
    setActiveTab(targetIdx);

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 280);
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      handleSelectScenario(activeTab - 1);
    }
  };

  const handleNext = () => {
    if (activeTab < SCENARIOS.length - 1) {
      handleSelectScenario(activeTab + 1);
    }
  };

  // Keyboard navigation across scenarios
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleSelectScenario(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      handleSelectScenario(SCENARIOS.length - 1);
    }
  };

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return (
    <section
      className="story-atelier-section"
      aria-labelledby="storytelling-heading"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Practical Online Safety: Interactive Scenario Simulator"
    >
      {/* Header with Title and Navigation Controls */}
      <div className="story-section-header">
        <div>
          <span className="story-eyebrow">Practical Online Safety</span>
          <h2 id="storytelling-heading" className="story-title">
            How Common Online Scams Work
          </h2>
          <p className="story-sub">
            How statutory awareness and critical pause turn ordinary high-pressure situations into safe, defensible outcomes.
          </p>
        </div>

        {/* Carousel Transition Controls */}
        <div className="story-carousel-controls" aria-label="Scenario navigation controls">
          <span className="story-counter-pill" aria-live="polite">
            Scenario {activeTab + 1} of {SCENARIOS.length}
          </span>
          <div className="story-nav-btn-group">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeTab === 0}
              className="story-nav-arrow-btn"
              aria-label="Previous scenario"
              title="Previous scenario (Left Arrow)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activeTab === SCENARIOS.length - 1}
              className="story-nav-arrow-btn"
              aria-label="Next scenario"
              title="Next scenario (Right Arrow)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Tabs (Direct Selection & Indicator Dots) */}
      <div className="story-scenario-tabs" role="tablist" aria-label="Digital dilemma scenarios">
        {SCENARIOS.map((s, idx) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeTab === idx}
            aria-controls={`scenario-panel-${s.id}`}
            id={`scenario-tab-${s.id}`}
            onClick={() => handleSelectScenario(idx)}
            className={`story-tab-btn ${activeTab === idx ? 'active' : ''}`}
          >
            <span className="story-tab-num">{idx + 1}</span>
            <span className="story-tab-text">{s.tabLabel}</span>
          </button>
        ))}
      </div>

      {/* Viewport with Animated Directional Transitions */}
      <div className="story-carousel-viewport">
        <div
          key={activeScenario.id}
          className={`story-canvas-grid slide-${slideDirection} ${isTransitioning ? 'animating' : 'settled'}`}
          role="tabpanel"
          id={`scenario-panel-${activeScenario.id}`}
          aria-labelledby={`scenario-tab-${activeScenario.id}`}
        >
          {/* Left: Simulated Incoming Alert */}
          <div className="story-phone-mock">
            <div>
              <div className="story-phone-header">
                <span className="story-phone-sender">{activeScenario.sender}</span>
                <span className="story-phone-time">{activeScenario.channel}</span>
              </div>
              <div className="story-phone-bubble">
                {activeScenario.message}
              </div>
              <div className="story-deceptive-highlight">
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Deceptive Signal:
                </strong>{' '}
                {activeScenario.deceptiveSignal}
              </div>
            </div>
          </div>

          {/* Right: Statutory Deconstruction & Protocol */}
          <div className="story-resolution-stage">
            <div>
              <span className="story-statute-pill">
                {activeScenario.statutePill}
              </span>
              <h3 className="story-rule-heading">
                {activeScenario.title}
              </h3>
              <p className="story-rule-desc">
                {activeScenario.statuteRule}
              </p>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Defensive Verification Protocol:
                </span>
                <span style={{ fontSize: '0.8rem', color: '#14532d', lineHeight: 1.45 }}>
                  {activeScenario.verificationProtocol}
                </span>
              </div>
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(12, 29, 46, 0.08)' }}>
              <Link to={activeScenario.destination} className="story-action-link">
                <span>{activeScenario.ctaText}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
