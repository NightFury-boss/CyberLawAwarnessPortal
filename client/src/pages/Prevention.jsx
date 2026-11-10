import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialRule from '../components/common/EditorialRule';
import IncidentDocketGenerator from '../components/common/IncidentDocketGenerator';

/**
 * Digital Safety Quick-Guide (Prevention)
 * Visual Identity: The Constitutional Atelier (Editorial Field Manual)
 * Palette: Ivory (#FFFDF8), Cream (#FAF4EA), Terracotta (#805B43),
 *          Forest Green (#1F4D3A), Charcoal (#26352B), Crimson Alert (#9B3E35)
 * 
 * Strict Responsibility Boundary:
 * - Learner's Space = Learn & understand (curriculum, lessons, scoring, simulated trials).
 * - Prevention = Act & protect (field manual, red flags, crisis response, evidence, docket).
 * - Resources = Find official help (verified authorities, portals, helplines).
 */

// Section 1: Safety Habits (Structured into 2 Primary Anchor Habits + 4 Operational Safeguards)
const PRIMARY_HABITS = [
  {
    id: 'passwords-mfa',
    number: '01',
    title: 'Use Strong Passwords & App-Based MFA',
    highlight: 'Password reuse turns a single compromised service into a total identity breach.',
    action: 'Create unique, 4-word passphrases (e.g. orchard-velvet-cobalt-harbor) for each account. Use app-based authenticators (Google Authenticator, Microsoft Authenticator, or Bitwarden) instead of SMS OTPs, which are vulnerable to SIM swapping and malware interception.',
    tag: 'CREDENTIAL DEFENSE'
  },
  {
    id: 'otp-upi-credentials',
    number: '02',
    title: 'Never Share OTPs, PINs or UPI Credentials',
    highlight: 'A UPI PIN or QR scan authorizes outgoing debits only; it is never required to receive money.',
    action: 'Entering a UPI PIN or scanning a QR code is strictly for sending money, never receiving. Legitimate banks, utility companies, and government officials will never ask for your passwords, OTPs, or card CVV under any pretext.',
    tag: 'FINANCIAL SWITCH DEFENSE'
  }
];

const COMPLEMENTARY_SAFEGUARDS = [
  {
    id: 'verify-links-portals',
    number: '03',
    title: 'Verify Links & Government Domains',
    action: 'Genuine Indian government and institutional portals strictly end in .gov.in or .nic.in. Inspect destination hostnames carefully before typing credentials or approving payment requests.',
    tag: 'DOMAIN HYGIENE'
  },
  {
    id: 'avoid-apks-remote',
    number: '04',
    title: 'Avoid Unknown APKs & Remote Tools',
    action: 'Never install .apk files received via WhatsApp, Telegram, or SMS. Immediately refuse any caller instructions to install remote support applications like AnyDesk, TeamViewer, or QuickSupport.',
    tag: 'ENDPOINT INTEGRITY'
  },
  {
    id: 'app-permissions',
    number: '05',
    title: 'Review App Permissions Regularly',
    action: 'Regularly audit installed mobile applications and revoke unnecessary access to your camera, microphone, contacts, location, and SMS messages. Keep permissions minimized.',
    tag: 'PRIVACY CONTROL'
  },
  {
    id: 'aadhaar-biometrics',
    number: '06',
    title: 'Lock Aadhaar Biometrics via UIDAI',
    action: 'Lock your Aadhaar biometrics via the official UIDAI portal (myaadhaar.uidai.gov.in) to prevent unauthorized AePS cash debits. Use Masked Aadhaar for routine identity verification.',
    tag: 'IDENTITY SHIELD'
  }
];

// Section 2: Warning Signs (Divided into Psychological Pretexts vs Tactical Anomalies)
const PSYCHOLOGICAL_FLAGS = [
  {
    id: 'urgency-pressure',
    sign: 'Urgent threats or pressure to act immediately',
    pretext: 'Pretext: "Electricity disconnected tonight at 9:30 PM" or "Account suspended within 2 hours."',
    reality: 'Scammers invent artificial emergencies to induce panic and prevent independent verification through official utility or banking helplines.'
  },
  {
    id: 'fake-authority-calls',
    sign: 'Threatening calls claiming to be from authorities',
    pretext: 'Pretext: "Video call from CBI / Police / Customs with narcotics parcel linked to your Aadhaar."',
    reality: 'Real Indian law enforcement conducts inquiries through formal statutory summons under BNSS Section 35, never through WhatsApp or Skype video calls. Digital Arrest is entirely fabricated.'
  }
];

const TACTICAL_FLAGS = [
  {
    id: 'otp-confidential',
    code: 'FLAG 03',
    sign: 'Requests to share OTPs or confidential credentials',
    explanation: 'Any caller or message demanding an OTP, netbanking password, or card security code is fraudulent. Genuine organizations never request sensitive credentials.'
  },
  {
    id: 'qr-receive-money',
    code: 'FLAG 04',
    sign: 'Requests to scan QR codes or approve collect requests to receive money',
    explanation: 'Scanning a QR code or entering a UPI PIN strictly authorizes an outgoing payment from your account, never an incoming credit, refund, or cashback.'
  },
  {
    id: 'unexpected-kyc-links',
    code: 'FLAG 05',
    sign: 'Unexpected payment or KYC update links',
    explanation: 'Unsolicited messages warning that your bank account, PAN card, or SIM card is deactivated unless you click a link or download an update are phishing traps.'
  },
  {
    id: 'remote-access-apps',
    code: 'FLAG 06',
    sign: 'Requests to install unknown applications or remote desktop software',
    explanation: 'Callers directing you to download remote support tools (AnyDesk, QuickSupport) or sideloaded APKs intend to monitor your screen and intercept bank verification codes.'
  },
  {
    id: 'unusual-network-drop',
    code: 'FLAG 07',
    sign: 'Unusual account activity or sudden loss of mobile network',
    explanation: 'A sudden loss of cellular service with a prolonged "No Service" status can indicate a SIM-swap attack. Unexpected password reset SMS alerts signal unauthorized login attempts.'
  }
];

// Section 3: What to Do Immediately (Situation 3 is the Primary Emergency; others are Action Protocols)
const EMERGENCY_FINANCIAL_ACTION = {
  id: 'lost-money',
  situation: 'Lost Money or Noticed an Unauthorized Transaction',
  summary: 'Time is the decisive factor in financial cybercrime. Execute these three containment actions immediately:',
  steps: [
    {
      phase: 'Step 1: Immediate Bank Lock',
      action: 'Contact your bank or payment provider immediately to block debit cards, disable netbanking, and freeze UPI transactions. Prompt notification within 3 working days protects citizens from customer liability under RBI regulations.'
    },
    {
      phase: 'Step 2: Dial Helpline 1930 (Golden Hour)',
      action: 'Call the National Cybercrime Helpline 1930 promptly. Have your bank account number, exact debit amount, and 12-digit UPI UTR reference ready to trigger Citizen Financial Cyber Fraud Reporting & Management System (CFCFRMS) inter-bank hold alerts.'
    },
    {
      phase: 'Step 3: Formalize on cybercrime.gov.in',
      action: 'Register an official written complaint docket on the National Cyber Crime Reporting Portal (cybercrime.gov.in) and retain the system acknowledgement number for all subsequent police and banking follow-up.'
    }
  ]
};

const ACTION_PROTOCOLS = [
  {
    id: 'clicked-link',
    protocol: 'PROTOCOL 01 // LINK COMPROMISE',
    situation: 'Clicked a Suspicious Link',
    steps: [
      { label: 'Sever Connection', detail: 'Stop interacting with the page immediately. Close the tab and toggle Airplane Mode ON or disconnect from Wi-Fi and mobile data.' },
      { label: 'Withhold Information', detail: 'Do not enter any passwords, OTPs, or financial details on the page.' },
      { label: 'Rotate Credentials', detail: 'If credentials were typed in, use a separate clean device to change passwords and select "Log out of all sessions".' },
      { label: 'Inspect Downloads', detail: 'Check your device downloads folder for unrecognized files (.apk, .exe) and delete them permanently; run a security scan.' }
    ]
  },
  {
    id: 'shared-otp',
    protocol: 'PROTOCOL 02 // CREDENTIAL COMPROMISE',
    situation: 'Shared an OTP or Password',
    steps: [
      { label: 'Reset Master Password', detail: 'Change the affected password immediately and terminate all other active login sessions in account settings.' },
      { label: 'Lock Payment Channels', detail: 'If banking credentials were shared, call your bank\'s 24x7 toll-free fraud helpline to freeze netbanking access or lock debit cards.' },
      { label: 'Upgrade to App MFA', detail: 'Secure associated recovery emails and phone numbers, and upgrade authentication from SMS OTP to an app-based authenticator.' }
    ]
  },
  {
    id: 'sim-swapped',
    protocol: 'PROTOCOL 03 // TELECOM CLONING',
    situation: 'Account Compromised or SIM Swapped',
    steps: [
      { label: 'Halt Carrier Swap', detail: 'If your mobile phone abruptly shows "No Service" in an area with coverage, contact your telecom carrier store immediately to halt unauthorized SIM replacement.' },
      { label: 'Recover Accounts', detail: 'Use verified backup email or offline recovery codes to regain account ownership. Never trust paid "account recovery" scammers.' },
      { label: 'Alert Financial Institutions', detail: 'Inform your bank immediately if financial accounts or recovery channels are tied to the compromised phone number.' }
    ]
  },
  {
    id: 'blackmail-extortion',
    protocol: 'PROTOCOL 04 // DIGITAL EXTORTION',
    situation: 'Experiencing Blackmail or Image-Based Abuse',
    steps: [
      { label: 'Zero Monetary Compliance', detail: 'Never comply with extortion threats or send money. Paying does not end extortion; it confirms vulnerability and triggers escalated demands.' },
      { label: 'Preserve Raw Evidence', detail: 'Capture full uncropped screenshots of messages, profile handles, phone numbers, and payment details before blocking perpetrators.' },
      { label: 'Official Reporting & Hash Shield', detail: 'Report immediately to cybercrime.gov.in (supports confidential filing for women/child-related abuse) and generate cryptographic hashes at StopNCII.org.' }
    ]
  }
];

// Section 4: Forensic Evidence Board (6 Specimen Categories)
const FORENSIC_SPECIMENS = [
  {
    id: 'ev-screenshots',
    code: 'SPECIMEN 01',
    label: 'Full Screenshots',
    cue: 'Uncropped device frame showing mobile status bar (time, battery, network), sender phone numbers, WhatsApp handles, and profile links.'
  },
  {
    id: 'ev-transactions',
    code: 'SPECIMEN 02',
    label: 'Transaction Identifiers',
    cue: 'Exact 12-digit UPI UTR numbers, bank account statements, debit SMS notifications, payee Virtual Payment Addresses (VPAs), and transaction receipts.'
  },
  {
    id: 'ev-contacts',
    code: 'SPECIMEN 03',
    label: 'Communications & Headers',
    cue: 'Complete incoming caller phone numbers, SMS header codes, and full raw exported email files (.eml or .msg) containing server routing data.'
  },
  {
    id: 'ev-urls',
    code: 'SPECIMEN 04',
    label: 'Suspicious URLs & Domains',
    cue: 'Full website link addresses, spoofed domain names, and QR code image files sent by fraudsters.'
  },
  {
    id: 'ev-timestamps',
    code: 'SPECIMEN 05',
    label: 'Chronological Timestamps',
    cue: 'Precise chronological log recording when each message was received, link was clicked, call took place, and debit occurred.'
  },
  {
    id: 'ev-files',
    code: 'SPECIMEN 06',
    label: 'Original Files & Audio Logs',
    cue: 'Raw downloaded APK files, audio recordings, and exported chat transcripts without editing, cropping, or altering metadata.'
  }
];

export default function Prevention() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  const [copiedHelpline, setCopiedHelpline] = useState(false);

  // Copy Helpline 1930 with graceful clipboard fallback
  const handleCopyHelpline = async () => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText('1930');
        success = true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = '1930';
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        textArea.remove();
      }
    } catch {
      success = false;
    }

    if (success) {
      setCopiedHelpline(true);
      setTimeout(() => setCopiedHelpline(false), 2500);
    }
  };

  // Smooth scroll to targeted anchor hash or query phase with legacy fallback mapping
  useEffect(() => {
    const anchorMap = {
      habits: 'protect',
      passwords: 'protect',
      payments: 'protect',
      browsing: 'protect',
      signals: 'warning-signs',
      playbooks: 'immediately',
      wrong: 'immediately',
      'lost-money': 'lost-money-card',
      evidence: 'evidence',
      reporting: 'docket',
      docket: 'docket'
    };

    const phaseMap = {
      before: 'protect',
      during: 'warning-signs',
      after: 'immediately'
    };

    // Precedence: explicit hash takes priority over query parameter
    let targetId = null;
    if (location.hash) {
      const rawHash = location.hash.replace('#', '');
      targetId = anchorMap[rawHash] || rawHash;
    } else if (location.search) {
      const searchParams = new URLSearchParams(location.search);
      const phase = searchParams.get('phase');
      if (phase && phaseMap[phase]) {
        targetId = phaseMap[phase];
      }
    }

    if (targetId) {
      let attempts = 0;
      const maxAttempts = 10;
      let timerId = null;
      let rafId = null;

      const tryScroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const header = document.querySelector('.top-header, .workspace-topbar');
          const headerHeight = header ? header.offsetHeight : 72;
          const topOffset = el.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 20);
          window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        } else if (attempts < maxAttempts) {
          attempts += 1;
          timerId = setTimeout(() => {
            rafId = requestAnimationFrame(tryScroll);
          }, 50);
        }
      };

      rafId = requestAnimationFrame(tryScroll);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (timerId) clearTimeout(timerId);
      };
    }
  }, [location.hash, location.search]);

  const scrollToAnchor = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="prevention-page-container">
      {/* ------------------------------------------------------------------
          PAGE HEADER (MASTHEAD)
          ------------------------------------------------------------------ */}
      <EditorialPageHeader
        eyebrow="CITIZEN DIGITAL DEFENSE FIELD MANUAL · QUICK-GUIDE"
        title="Digital Safety Quick-Guide"
        subtitle="Practical actions to protect yourself and respond immediately if targeted."
        description="A concise reference for essential everyday habits, recognizing deception before harm occurs, immediate crisis response, and preserving admissible digital evidence."
      >
        <WorkspaceBreadcrumb />
      </EditorialPageHeader>

      <EditorialRule />

      {/* ------------------------------------------------------------------
          URGENT EMERGENCY JUMP STRIP (FOR ACTIVE INCIDENTS)
          ------------------------------------------------------------------ */}
      <nav className="prevention-urgent-strip" aria-label="Quick jump to emergency incident actions">
        <div className="prevention-urgent-text">
          <span className="prevention-urgent-beacon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span className="prevention-urgent-label">Facing an active cyber incident right now?</span>
        </div>

        <div className="prevention-urgent-actions">
          <button
            type="button"
            onClick={() => scrollToAnchor('lost-money-card')}
            className="prevention-urgent-chip is-danger"
          >
            <span>Lost Money &amp; 1930 &darr;</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToAnchor('immediately')}
            className="prevention-urgent-chip"
          >
            <span>Crisis Action Protocols &darr;</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToAnchor('docket')}
            className="prevention-urgent-chip"
          >
            <span>Incident Docket Generator &darr;</span>
          </button>
        </div>
      </nav>

      {/* ------------------------------------------------------------------
          FIVE CORE PRACTICAL SECTIONS
          ------------------------------------------------------------------ */}
      <div className="prevention-quick-sections">

        {/* ================================================================
            SECTION 1: PROTECT YOURSELF (FOUNDATIONAL DEFENSE LEDGER)
            ================================================================ */}
        <div id="habits" className="prevention-anchor-target" />
        <section id="protect" className="prevention-quick-section" aria-labelledby="protect-heading">
          <header className="prevention-section-header">
            <div className="prevention-section-eyebrow-row">
              <span className="prevention-section-eyebrow">PRACTICAL DEFENSE · 01</span>
              <span className="prevention-section-status-tag">BASELINE HYGIENE</span>
            </div>
            <h2 id="protect-heading" className="prevention-section-title">
              Protect Yourself
            </h2>
            <p className="prevention-section-lead">
              Sensible cyber defense begins before contact occurs. Setting up resilient credentials and device boundaries eliminates vulnerabilities before an attacker makes contact.
            </p>
          </header>

          {/* Featured Primary Anchor Habits (Two Core Pillars) */}
          <div className="prevention-anchor-habits-grid">
            {PRIMARY_HABITS.map((item) => (
              <article key={item.id} className="prevention-anchor-card">
                <div className="prevention-anchor-header">
                  <span className="prevention-anchor-numeral">{item.number}</span>
                  <span className="prevention-anchor-tag">{item.tag}</span>
                </div>
                <div className="prevention-anchor-body">
                  <div className="prevention-anchor-icon" aria-hidden="true">
                    {item.id === 'passwords-mfa' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <circle cx="12" cy="10" r="3" />
                        <path d="M12 13v3" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <line x1="12" y1="15" x2="12" y2="17" />
                      </svg>
                    )}
                  </div>
                  <h3 className="prevention-anchor-title">{item.title}</h3>
                  <div className="prevention-anchor-highlight">{item.highlight}</div>
                  <p className="prevention-anchor-action">{item.action}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Four Complementary Operational Safeguards */}
          <div className="prevention-safeguards-grid">
            {COMPLEMENTARY_SAFEGUARDS.map((item) => (
              <article key={item.id} className="prevention-safeguard-card">
                <div className="prevention-safeguard-top">
                  <span className="prevention-safeguard-badge">{item.tag}</span>
                  <div className="prevention-safeguard-icon" aria-hidden="true">
                    {item.id === 'verify-links-portals' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    )}
                    {item.id === 'avoid-apks-remote' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                      </svg>
                    )}
                    {item.id === 'app-permissions' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    )}
                    {item.id === 'aadhaar-biometrics' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 11c0-2.2-1.8-4-4-4s-4 1.8-4 4c0 3.3 2.7 6 6 6" />
                        <path d="M12 7c1.7 0 3 1.3 3 3v2" />
                        <rect x="15" y="14" width="7" height="8" rx="1" />
                        <path d="M17 14v-2a1.5 1.5 0 0 1 3 0v2" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="prevention-safeguard-title">{item.title}</h3>
                <p className="prevention-safeguard-action">{item.action}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ================================================================
            SECTION 2: KNOW THE WARNING SIGNS (RED-FLAG FIELD GUIDE)
            ================================================================ */}
        <div id="signals" className="prevention-anchor-target" />
        <section id="warning-signs" className="prevention-quick-section" aria-labelledby="warning-heading">
          <header className="prevention-section-header">
            <div className="prevention-section-eyebrow-row">
              <span className="prevention-section-eyebrow">THREAT RECOGNITION · 02</span>
              <span className="prevention-section-status-tag">FIELD INDICATORS</span>
            </div>
            <h2 id="warning-heading" className="prevention-section-title">
              Know the Warning Signs
            </h2>
            <p className="prevention-section-lead">
              Social engineering succeeds by exploiting psychological pressure rather than technical flaws. Recognize these seven verified red flags to pause and verify before taking action.
            </p>
          </header>

          {/* Two Major Psychological Manipulation Banners */}
          <div className="prevention-psych-flags-grid">
            {PSYCHOLOGICAL_FLAGS.map((item, idx) => (
              <article key={item.id} className="prevention-psych-flag-card">
                <div className="prevention-psych-flag-header">
                  <div className="prevention-psych-marker" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 22 20 2 20 12 2" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <span className="prevention-psych-code">PSYCHOLOGICAL LEVERAGE · {idx === 0 ? 'TIME PANIC' : 'LEGAL INTIMIDATION'}</span>
                    <h3 className="prevention-psych-title">{item.sign}</h3>
                  </div>
                </div>
                <blockquote className="prevention-psych-pretext">
                  {item.pretext}
                </blockquote>
                <div className="prevention-psych-reality">
                  <strong>Reality Check:</strong> {item.reality}
                </div>
              </article>
            ))}
          </div>

          {/* Tactical Lures & Anomalies Register */}
          <div className="prevention-tactical-register">
            <div className="prevention-register-title">Tactical Lures &amp; Endpoint Anomalies</div>
            <div className="prevention-register-rows">
              {TACTICAL_FLAGS.map((item) => (
                <div key={item.id} className="prevention-register-row">
                  <div className="prevention-register-badge">
                    <span className="prevention-register-code">{item.code}</span>
                  </div>
                  <div className="prevention-register-content">
                    <h3 className="prevention-register-sign">{item.sign}</h3>
                    <p className="prevention-register-explanation">{item.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="prevention-explore-banner">
            <div className="prevention-explore-text">
              <strong>Need a complete technical breakdown of threat mechanisms?</strong>
              <span> Explore 29 threat models, attack lifecycles, and attacker profiles in the Crimes directory.</span>
            </div>
            <Link to={getContextPath('/crimes')} className="prevention-explore-btn">
              Browse Cyber Crimes Directory &rarr;
            </Link>
          </div>
        </section>

        {/* ================================================================
            SECTION 3: WHAT TO DO IMMEDIATELY (INCIDENT RESPONSE PROTOCOLS)
            ================================================================ */}
        <div id="playbooks" className="prevention-anchor-target" />
        <div id="wrong" className="prevention-anchor-target" />
        <section id="immediately" className="prevention-quick-section" aria-labelledby="immediately-heading">
          <header className="prevention-section-header">
            <div className="prevention-section-eyebrow-row">
              <span className="prevention-section-eyebrow">CRISIS RESPONSE · 03</span>
              <span className="prevention-section-status-tag is-alert">DECISIVE ACTION</span>
            </div>
            <h2 id="immediately-heading" className="prevention-section-title">
              What to Do Immediately
            </h2>
            <p className="prevention-section-lead">
              If an incident has occurred, panic costs critical time. Execute these immediate containment sequences based on your specific situation.
            </p>
          </header>

          {/* HIGHEST PRIORITY: EMERGENCY FINANCIAL FRAUD CARD (SITUATION 3) */}
          <div id="lost-money-card" className="prevention-anchor-target" />
          <article className="prevention-emergency-hero-panel" aria-labelledby="emergency-hero-title">
            <div className="prevention-emergency-hero-header">
              <div className="prevention-emergency-hero-badge-row">
                <span className="prevention-emergency-hero-badge">CRITICAL EMERGENCY · PRIORITY 1</span>
                <span className="prevention-emergency-hero-tag">GOLDEN HOUR CONTAINMENT</span>
              </div>
              <h3 id="emergency-hero-title" className="prevention-emergency-hero-title">
                {EMERGENCY_FINANCIAL_ACTION.situation}
              </h3>
              <p className="prevention-emergency-hero-summary">
                {EMERGENCY_FINANCIAL_ACTION.summary}
              </p>
            </div>

            {/* Direct Helpline 1930 Call Action Bar */}
            <div className="prevention-emergency-hero-callout">
              <div className="prevention-callout-text">
                <span className="prevention-callout-eyebrow">NATIONAL CYBERCRIME HELPLINE (MHA / I4C)</span>
                <span className="prevention-callout-number">Short Code: 1930</span>
                <span className="prevention-callout-desc">Coordinates immediate transactional hold alerts across banks via CFCFRMS.</span>
              </div>
              <div className="prevention-callout-actions">
                <a
                  href="tel:1930"
                  className="prevention-callout-dial-btn"
                >
                  <span aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <span>Dial 1930 Now</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyHelpline}
                  className="prevention-callout-copy-btn"
                >
                  <span aria-live="polite">
                    {copiedHelpline ? '✓ Copied' : '📋 Copy 1930'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sequential 3-Step Action Path */}
            <div className="prevention-emergency-steps-timeline">
              {EMERGENCY_FINANCIAL_ACTION.steps.map((st, sIdx) => (
                <div key={sIdx} className="prevention-timeline-step-card">
                  <div className="prevention-timeline-phase-marker">{st.phase}</div>
                  <p className="prevention-timeline-phase-action">{st.action}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Four Distinct Action Protocols (Situations 1, 2, 4, 5) */}
          <div className="prevention-protocols-grid">
            {ACTION_PROTOCOLS.map((proto) => (
              <article key={proto.id} className="prevention-protocol-card">
                <div className="prevention-protocol-header">
                  <div className="prevention-protocol-icon" aria-hidden="true">
                    {proto.id === 'clicked-link' && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    )}
                    {proto.id === 'shared-otp' && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        <path d="M2 2l20 20" />
                      </svg>
                    )}
                    {proto.id === 'sim-swapped' && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 20h.01" />
                        <path d="M7 20v-4" />
                        <path d="M12 20v-8" />
                        <path d="M17 20V4" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                    {proto.id === 'blackmail-extortion' && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="prevention-protocol-code">{proto.protocol}</span>
                    <h3 className="prevention-protocol-title">{proto.situation}</h3>
                  </div>
                </div>

                <div className="prevention-protocol-steps">
                  {proto.steps.map((st, stIdx) => (
                    <div key={stIdx} className="prevention-protocol-step-item">
                      <span className="prevention-step-badge">STEP {stIdx + 1}</span>
                      <div className="prevention-step-content">
                        <strong className="prevention-step-label">{st.label}: </strong>
                        <span className="prevention-step-detail">{st.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="prevention-qualification-box">
            <div className="prevention-qualification-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="prevention-qualification-text">
              <strong>Statutory &amp; Operational Reality:</strong> Reporting via Helpline 1930 coordinates urgent communication via CFCFRMS across financial institutions, but <strong>does not guarantee that fraudulent funds will be frozen, reversed, or recovered</strong>. Final restitution depends on prompt notification within the 2–3 hour window, individual bank dispute resolution under RBI Customer Liability Master Directions, and police investigation.
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4: KEEP THE IMPORTANT DETAILS (FORENSIC EVIDENCE BOARD)
            ================================================================ */}
        <section id="evidence" className="prevention-quick-section" aria-labelledby="evidence-heading">
          <header className="prevention-section-header">
            <div className="prevention-section-eyebrow-row">
              <span className="prevention-section-eyebrow">EVIDENCE INTEGRITY · 04</span>
              <span className="prevention-section-status-tag">BSA 2023 SPECIMENS</span>
            </div>
            <h2 id="evidence-heading" className="prevention-section-title">
              Keep the Important Details
            </h2>
            <p className="prevention-section-lead">
              Digital evidence must be preserved in its original, unaltered form to remain credible and legally admissible. Review the six forensic specimens required for police dockets and banking claims.
            </p>
          </header>

          <div className="prevention-forensic-board">
            {FORENSIC_SPECIMENS.map((item) => (
              <div key={item.id} className="prevention-specimen-card">
                <div className="prevention-specimen-top">
                  <span className="prevention-specimen-tag">{item.code}</span>
                  <div className="prevention-specimen-icon" aria-hidden="true">
                    {item.id === 'ev-screenshots' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    )}
                    {item.id === 'ev-transactions' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    )}
                    {item.id === 'ev-contacts' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    )}
                    {item.id === 'ev-urls' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                    {item.id === 'ev-timestamps' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    {item.id === 'ev-files' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="prevention-specimen-title">{item.label}</h3>
                <p className="prevention-specimen-cue">{item.cue}</p>
              </div>
            ))}
          </div>

          <div className="prevention-bsa-notice">
            <div className="prevention-bsa-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <rect x="3" y="7" width="18" height="4" rx="1" />
                <path d="M6 11l-2 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l-2-5" />
                <path d="M18 11l-2 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2l-2-5" />
              </svg>
            </div>
            <div className="prevention-bsa-text">
              <strong>Statutory Admissibility Standard:</strong> Under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA), electronic records are admissible in court when their integrity, hash state, and custodial origin are reliably preserved without modification. Never crop, annotate, or filter digital evidence screenshots before submission.{' '}
              <Link to={`${getContextPath('/laws')}#BSA-Section-63`} className="prevention-inline-link">
                Learn more about BSA Section 63 in Cyber Laws &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 5: DOCUMENT YOUR INCIDENT (DOCKET WORKSPACE)
            ================================================================ */}
        <div id="reporting" className="prevention-anchor-target" />
        <section id="docket" className="prevention-quick-section" aria-labelledby="docket-heading">
          <header className="prevention-section-header">
            <div className="prevention-section-eyebrow-row">
              <span className="prevention-section-eyebrow">INCIDENT DOCUMENTATION · 05</span>
              <span className="prevention-section-status-tag">BROWSER WORKSPACE</span>
            </div>
            <h2 id="docket-heading" className="prevention-section-title">
              Document Your Incident
            </h2>
            <p className="prevention-section-lead">
              Organize your incident details into a structured, printable report before reporting to your bank or the cyber police.
            </p>
          </header>

          <div className="prevention-docket-workspace-card">
            <div className="prevention-docket-workspace-banner">
              <div>
                <span className="prevention-docket-tool-badge">ZERO-TELEMETRY BROWSER TOOL</span>
                <h3 className="prevention-docket-workspace-heading">
                  Citizen Incident Docket Workspace
                </h3>
                <p className="prevention-docket-workspace-desc">
                  This interactive tool runs entirely in your local browser memory. It helps you prepare an organized, court-ready incident dossier for submission to your bank or law enforcement. It does not file a police complaint or guarantee acceptance by an authority.
                </p>
              </div>
              <div className="prevention-docket-privacy-stamp" aria-hidden="true">
                <span className="prevention-stamp-lock">🔒</span>
                <span className="prevention-stamp-text">100% Client-Side Privacy Guaranteed</span>
              </div>
            </div>

            <div className="prevention-docket-workspace-body">
              <IncidentDocketGenerator initialCategory="unauthorized_upi" />
            </div>
          </div>
        </section>

      </div>

      {/* ------------------------------------------------------------------
          CLOSING REFERRAL: NEED OFFICIAL HELP?
          ------------------------------------------------------------------ */}
      <section className="prevention-referral-card" aria-labelledby="referral-heading">
        <div className="prevention-referral-seal" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="prevention-referral-text">
          <h2 id="referral-heading" className="prevention-referral-title">
            Need official help?
          </h2>
          <p className="prevention-referral-desc">
            Find verified cybercrime reporting portals, regulatory ombudsmen, toll-free helplines, and state cyber police desks.
          </p>
        </div>

        <Link
          to={getContextPath('/resources')}
          className="prevention-referral-btn"
        >
          <span>Visit Official Resources Directory &rarr;</span>
        </Link>
      </section>
    </div>
  );
}
