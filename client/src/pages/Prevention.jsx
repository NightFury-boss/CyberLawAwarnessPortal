import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Prevention() {
  const [activeTopic, setActiveTopic] = useState('passwords');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // IntersectionObserver to auto-update active navigation link on scroll
  useEffect(() => {
    const sections = ['passwords', 'payments', 'browsing', 'evidence', 'wrong', 'reporting'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveTopic(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveTopic(id);
    }
  };

  const navItems = [
    { id: 'passwords', label: 'Passwords' },
    { id: 'payments', label: 'Payments' },
    { id: 'browsing', label: 'Browsing' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'wrong', label: 'If Targeted' },
    { id: 'reporting', label: 'Reporting' }
  ];

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      
      {/* Editorial Hero Header */}
      <div style={{ marginBottom: 'var(--space-xxl)', maxWidth: '800px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-navy)', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
          Prevention Centre
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 12px 0' }}>
          PREVENTION & DIGITAL HYGIENE
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
          Practical guidance for protecting your accounts, devices, personal information, and digital transactions — and knowing what to do when something goes wrong.
        </p>
      </div>

      {/* BEFORE / DURING / AFTER VISUAL FRAMEWORK */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: '24px',
        backgroundColor: 'var(--accent-navy-light)',
        padding: '32px',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-xxl)',
        borderLeft: '4px solid var(--accent-navy)'
      }}>
        {/* Before */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-navy)' }}>
              01 / BEFORE
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', margin: 0, fontWeight: 'bold' }}>Protect</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Reduce risk. Build strong defense habits before any contact or system threat occurs.
          </p>
        </div>

        {/* During */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: isMobile ? 'none' : '1px solid var(--color-border-dark)', paddingLeft: isMobile ? 0 : '24px', paddingTop: isMobile ? '16px' : 0, borderTop: isMobile ? '1px solid var(--color-border-dark)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-navy)' }}>
              02 / DURING
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', margin: 0, fontWeight: 'bold' }}>Pause + Verify</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Avoid escalations. Take control of your decisions when confronted with fake urgency.
          </p>
        </div>

        {/* After */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: isMobile ? 'none' : '1px solid var(--color-border-dark)', paddingLeft: isMobile ? 0 : '24px', paddingTop: isMobile ? '16px' : 0, borderTop: isMobile ? '1px solid var(--color-border-dark)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-navy)' }}>
              03 / AFTER
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', margin: 0, fontWeight: 'bold' }}>Respond + Recover</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Preserve evidence, lock exposed keys/accounts, and report details to safety registries.
          </p>
        </div>
      </div>

      {/* TOPIC NAVIGATION (Desktop sticky / Mobile dropdown) */}
      <div style={{
        position: 'sticky',
        top: '70px',
        backgroundColor: 'var(--bg-primary)',
        padding: '12px 0',
        zIndex: 900,
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 'var(--space-xxl)'
      }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase' }}>
              Jump to Handbook Section
            </label>
            <select
              value={activeTopic}
              onChange={(e) => scrollToSection(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-dark)',
                backgroundColor: 'var(--bg-white)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            >
              {navItems.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Handbook Index:
            </span>
            {navItems.map((item) => {
              const isActive = activeTopic === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: isActive ? '3px solid var(--accent-navy)' : '3px solid transparent',
                    color: isActive ? 'var(--accent-navy)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 'bold' : '500',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: '8px 4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* HANDBOOK SECTIONS MAIN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: '48px', alignItems: 'flex-start' }}>
        
        {/* Main handbook column */}
        <div style={{ maxWidth: '800px' }}>
          
          {/* Section 01: Passwords */}
          <section id="passwords" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>01</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              PASSWORD HYGIENE & MFA
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--accent-navy)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Password reuse makes you highly vulnerable to credential stuffing. If a hacker breaches one forum, they test your email/password on banking apps.
            </p>

            <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Why It Matters
            </h4>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', borderLeft: '3px solid var(--accent-navy)' }}>
              A single compromised password can lead to account takeovers across multiple unrelated sites. Multi-factor authentication acts as a secondary block even if credentials leak.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase' }}>Good Practice</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Use passphrases:</strong> Combine 4 random dictionary words (e.g. <code>correct-horse-battery-staple</code>). They are easy to remember but mathematically nearly impossible to brute-force.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase' }}>Recommended</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Use a password manager:</strong> Auto-generate distinct, secure passwords for every digital service.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase' }}>Important</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Enable Multi-Factor Authentication (MFA):</strong> Set up Google/Microsoft Authenticator or hardware keys. Avoid SMS OTP if possible, as it is vulnerable to SIM-swapping.
                </span>
              </div>
            </div>
          </section>

          {/* Section 02: Payments */}
          <section id="payments" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>02</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              UPI & PAYMENT SECURITY
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--accent-navy)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              UPI payments transfer funds instantly out of your bank account. There is no escrow reversal mechanism.
            </p>

            <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Key Rule
            </h4>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-danger-light)', color: '#7b1c12', borderRadius: 'var(--radius-sm)', marginBottom: '24px', borderLeft: '3px solid var(--color-danger)' }}>
              <strong>UPI PIN is for sending money only:</strong> You never need to enter your PIN or scan a QR code to receive money, deposits, or refunds.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase' }}>Important</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Verify recipient name:</strong> Before confirming any UPI transaction, look at the display name inside the app, not just the phone number.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase' }}>Recommended</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Scan QR codes with caution:</strong> Merchants do not send QR codes to verify incoming credits. Scanning a merchant code is always an outgoing debit.
                </span>
              </div>
            </div>
          </section>

          {/* Section 03: Browsing */}
          <section id="browsing" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>03</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              SAFE BROWSING & LINKS
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--accent-navy)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Fake portals cloning banking/university login pages are hosted on domains registered to look similar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Check the destination TLD</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Official Indian government portals end in <code>.gov.in</code>. Scammers buy cheap domains like <code>.verify-gov.in</code> to spoof users.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Look for HTTPS</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Never enter credentials on pages labeled "Not Secure" (HTTP) inside the URL bar.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Hover and Inspect URLs</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Hover your mouse over links inside emails and chat logs to view the destination before tapping.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 04: Evidence */}
          <section id="evidence" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>04</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              DIGITAL EVIDENCE PRESERVATION
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--accent-navy)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              If you fall victim to a cybercrime, preserving evidence is critical to secure an official investigation.
            </p>

            <div style={{
              borderLeft: '4px solid var(--accent-navy)',
              backgroundColor: 'var(--accent-navy-light)',
              padding: '20px 24px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0, marginBottom: '8px' }}>
                IF SOMETHING HAS ALREADY HAPPENED
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Stop contact with the target profiles immediately. Do not delete chat files or logs; they are crucial forensic footprints.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Screenshots</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Capture profile handles, phone numbers, threat letters, and chat transcripts.</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Transactions</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Record transaction IDs, debit bank account numbers, UPI references, and timestamps.</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Headers & Links</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Save raw EML files or copy destination spoof hyperlinks without loading them.</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Alert Logs</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Keep SMS alerts, email notification logs, and browser connection warning codes.</p>
              </div>
            </div>
          </section>

          {/* Section 05: If Something Goes Wrong */}
          <section id="wrong" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>05</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              IF SOMETHING GOES WRONG
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--accent-navy)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              A standard incident response checklist to guide your recovery actions in real time:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', minWidth: '100px', textAlign: 'center', textTransform: 'uppercase' }}>Before</span>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Security Hygiene</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Keep recovery email links updated and enable secondary keys on account credentials.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '100px', textAlign: 'center', textTransform: 'uppercase' }}>During</span>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Pause and Verify</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Refuse transaction deadlines and do not enter authentication codes under duress.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '100px', textAlign: 'center', textTransform: 'uppercase' }}>After</span>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Secure, Preserve, Report</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Lock credentials, debited bank links, take screenshots, and raise coordinate flags on official support portals.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 06: Reporting */}
          <section id="reporting" style={{ marginBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>06</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              REPORTING & RESPONSE CHANNELS
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--accent-navy)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Use official channels to file complaints. Keep reference files ready when registering reports:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 8px 0', fontWeight: 'bold' }}>National Cyber Crime Reporting Helpline</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Official government portal for filing complaints about financial scams, identity frauds, and abusive posts.</p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span>Phone: <strong>1930</strong> (24/7 Helpline)</span>
                  <span>Link: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: 'var(--accent-navy)', textDecoration: 'underline' }}>cybercrime.gov.in</a></span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', margin: '0 0 8px 0', fontWeight: 'bold' }}>RBI Banking Ombudsman</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Official ombudsman for resolving banking disputes, unauthorized electronic debits, and UPI merchant claims.</p>
                <div style={{ fontSize: '0.85rem' }}>
                  Link: <a href="https://cms.rbi.org.in" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: 'var(--accent-navy)', textDecoration: 'underline' }}>cms.rbi.org.in</a>
                </div>
              </div>
            </div>

            <div className="alert alert-warning" style={{ fontSize: '0.85rem', padding: '16px' }}>
              <strong>Educational Project Disclaimer:</strong> This portal is compiled for public awareness education and is <strong>not</strong> a government police reporting authority. Do not submit active case details or credentials here. Report crimes directly to the verified links above.
            </div>
          </section>

        </div>

        {/* Desktop Optional Right Rail */}
        {!isMobile && (
          <div style={{ position: 'sticky', top: '140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>
                Quick Checklist
              </h4>
              <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <li>Unique Passwords</li>
                <li>App-based MFA</li>
                <li>Verify recipient display name</li>
                <li>Inspect URL domain TLDs</li>
                <li>Helpline is 1930</li>
              </ul>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default Prevention;
