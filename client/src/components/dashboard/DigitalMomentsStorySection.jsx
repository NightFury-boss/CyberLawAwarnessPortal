import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * DigitalMomentsStorySection Component
 * 
 * Editorial storytelling connecting everyday digital moments with cybercrime
 * provisions and defensive instinct.
 * 
 * Features:
 * - 4 Authentic real-world digital dilemmas.
 * - Interactive scenario tab switcher.
 * - Simulated device alert visualization with deceptive indicator callout.
 * - Authoritative statutory hook (IT Act §66D, §66C, BNS §318(4), BSA §63).
 * - Direct deep-links to related case studies, prevention guides, and quizzes.
 */
const SCENARIOS = [
  {
    id: 'power-cut',
    tabLabel: '⚡ Utility Urgency',
    title: 'The Midnight Power Cut SMS',
    channel: 'SMS: VK-PSPCL-ALRT • 16:42 IST',
    sender: 'Power Distribution Billing System',
    message: '“DEAR CONSUMER: Your electricity connection will be disconnected at 09:30 PM tonight from the substation because previous month bill is unpaid. Immediately call Power Officer at 9811204918 to clear arrears.”',
    deceptiveSignal: 'Unofficial 10-digit mobile contact + artificial 5-hour cutoff designed to bypass critical pause.',
    statutePill: 'IT Act § 66D • Cheating by Personation',
    statuteRule: 'Statutory bodies never dispatch individual officers with private mobile numbers to demand instantaneous payment.',
    verificationProtocol: 'Login solely to the verified state power distribution portal (e.g., pspcl.in) using your registered 10-digit Consumer Account Number.',
    destination: '/cases',
    ctaText: 'Examine Case Study →'
  },
  {
    id: 'parcel-fee',
    tabLabel: '📦 Courier Re-Route',
    title: 'The Nominal ₹15 Redirection Fee',
    channel: 'SMS: DELHIVERY-TRACK • 11:18 IST',
    sender: 'Logistics Exception Desk',
    message: '“ALERT: Your package #IN-883921 could not be delivered due to incomplete apartment number. Update address at delhivery-track-support.top within 12 hours. Nominal re-routing fee of ₹15 applies.”',
    deceptiveSignal: 'Deceptive .top domain + nominal ₹15 fee used to disarm suspicion and harvest debit card CVVs.',
    statutePill: 'IT Act § 66C • Identity & Credential Theft',
    statuteRule: 'The small payment is a pretext. The genuine objective is capturing primary payment credentials on an unauthorized server.',
    verificationProtocol: 'Validate AWB #IN-883921 solely inside the official logistics mobile application or verified domain.',
    destination: '/prevention',
    ctaText: 'Read Prevention Protocol →'
  },
  {
    id: 'digital-arrest',
    tabLabel: '🚨 Digital Arrest',
    title: 'The Video Summons & Coercion',
    channel: 'WhatsApp Video / Skype • 14:05 IST',
    sender: 'Cyber Crime Investigation Cell',
    message: '“Official Notice: An arrest warrant is active in Money Laundering Case #MH-9921. You are placed under Digital Arrest. Stay on video call and transfer funds to the verification escrow account to avoid immediate police arrival.”',
    deceptiveSignal: 'No Indian law enforcement agency or court conducts "digital arrest" via video call or requires funds transfer to "safe accounts".',
    statutePill: 'BNS § 204 & § 318(4) • Public Impersonation & Fraud',
    statuteRule: 'Statutory law permits arrest only under due CrPC/BNSS process. Real officers never conduct video interrogations for fund escrow.',
    verificationProtocol: 'Disconnect call immediately. Call National Cybercrime Helpline 1930 to trigger Golden Hour inter-bank hold coordination.',
    destination: '/crimes',
    ctaText: 'Explore Threat Pattern →'
  },
  {
    id: 'qr-scam',
    tabLabel: '📲 Reverse QR Code',
    title: 'The "Approve Payment" QR Code',
    channel: 'UPI Payment Link / Marketplace Chat',
    sender: 'Classifieds Buyer Inquiry',
    message: '“I have transferred ₹14,500 for your listed item. Please scan this attached QR code and enter your 6-digit UPI PIN to approve the funds deposit into your account.”',
    deceptiveSignal: 'Entering a UPI PIN or scanning a merchant QR code ALWAYS debits money; receiving funds NEVER requires entering a PIN.',
    statutePill: 'IT Act § 43 & RBI Digital Directives',
    statuteRule: 'UPI protocols are strictly push-to-pay. Entering a security PIN authorizes an outgoing transaction, never an incoming credit.',
    verificationProtocol: 'Never enter a PIN to receive incoming credits. Check transaction credit directly in your banking passbook.',
    destination: '/quizzes',
    ctaText: 'Test UPI Knowledge in Quiz →'
  }
];

export default function DigitalMomentsStorySection() {
  const [activeTab, setActiveTab] = useState(0);
  const activeScenario = SCENARIOS[activeTab] || SCENARIOS[0];

  return (
    <section className="story-atelier-section" aria-labelledby="storytelling-heading">
      <div className="story-section-header">
        <div>
          <span className="story-eyebrow">Interactive Threat Deconstruction</span>
          <h2 id="storytelling-heading" className="story-title">
            Deconstructing Everyday Digital Deceptions
          </h2>
          <p className="story-sub">
            How statutory awareness and critical pause turn ordinary high-pressure situations into safe, defensible outcomes.
          </p>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="story-scenario-tabs" role="tablist" aria-label="Digital dilemma scenarios">
        {SCENARIOS.map((s, idx) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeTab === idx}
            aria-controls={`scenario-panel-${s.id}`}
            id={`scenario-tab-${s.id}`}
            onClick={() => setActiveTab(idx)}
            className={`story-tab-btn ${activeTab === idx ? 'active' : ''}`}
          >
            {s.tabLabel}
          </button>
        ))}
      </div>

      {/* Interactive Story Canvas Grid */}
      <div
        className="story-canvas-grid"
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
              <strong>⚠ Deceptive Signal:</strong> {activeScenario.deceptiveSignal}
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
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '2px' }}>
                🛡️ Defensive Verification Protocol:
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
    </section>
  );
}

