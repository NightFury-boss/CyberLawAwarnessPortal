import React, { useState, useEffect } from 'react';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import { performStateTransition } from '../utils/transitionUtils';
import IncidentDocketGenerator from '../components/common/IncidentDocketGenerator';

function Prevention() {
  const [activeTopic, setActiveTopic] = useState('passwords');
  const [selectedPhase, setSelectedPhase] = useState('all'); // 'all', 'before', 'during', 'after'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [copiedHelpline, setCopiedHelpline] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

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
      setCopyFailed(false);
      setTimeout(() => setCopiedHelpline(false), 2500);
    } else {
      setCopyFailed(true);
      setCopiedHelpline(false);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  const handlePhaseChange = (phase) => {
    performStateTransition(() => {
      setSelectedPhase(phase);
    });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Support ?phase= query param (e.g. from Home page or direct links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('phase');
    if (p && ['before', 'during', 'after', 'all'].includes(p)) {
      setSelectedPhase(p);
    }
  }, []);

  // Handle deep-linked hash anchor navigation (e.g., /prevention#payments)
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveTopic(id);
        }, 150);
      }
    }
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
      <EditorialPageHeader
        eyebrow="Stay Safe Online"
        title="Online Safety & Prevention Guide"
        subtitle='"Knowledge helps most when it changes what we do."'
        description="Practical guidance for protecting your accounts, devices, personal information, and digital transactions — and knowing what to do when something goes wrong."
      >
        <WorkspaceBreadcrumb />
      </EditorialPageHeader>

      {/* BEFORE / DURING / AFTER EDITORIAL FRAMEWORK WITH INTENTIONAL STATE TRANSITIONS */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="prevention-phase-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)' }}>
              Step-by-Step Defense:
            </span>
            <div className="portal-state-sequence-bar" style={{ margin: 0 }}>
              <button 
                type="button"
                onClick={() => handlePhaseChange('all')}
                className={`portal-state-sequence-node ${selectedPhase === 'all' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-pressed={selectedPhase === 'all'}
              >
                All Advice
              </button>
              <span className="portal-state-sequence-arrow" aria-hidden="true">&rarr;</span>
              <button 
                type="button"
                onClick={() => handlePhaseChange('before')}
                className={`portal-state-sequence-node ${selectedPhase === 'before' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-pressed={selectedPhase === 'before'}
              >
                01 Before an Incident
              </button>
              <span className="portal-state-sequence-arrow" aria-hidden="true">&rarr;</span>
              <button 
                type="button"
                onClick={() => handlePhaseChange('during')}
                className={`portal-state-sequence-node ${selectedPhase === 'during' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-pressed={selectedPhase === 'during'}
              >
                02 If Targeted
              </button>
              <span className="portal-state-sequence-arrow" aria-hidden="true">&rarr;</span>
              <button 
                type="button"
                onClick={() => handlePhaseChange('after')}
                className={`portal-state-sequence-node ${selectedPhase === 'after' ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
                aria-pressed={selectedPhase === 'after'}
              >
                03 After an Attack
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {selectedPhase === 'all' && 'All 3 Safety Stages'}
            {selectedPhase === 'before' && 'Stage 01: Protecting Yourself Beforehand'}
            {selectedPhase === 'during' && 'Stage 02: Pausing & Verifying Under Pressure'}
            {selectedPhase === 'after' && 'Stage 03: Fast Action & Helpline 1930'}
          </div>
        </div>

        {/* Thin progression line representing active lifecycle position */}
        <div className="portal-progression-track" style={{ marginBottom: '14px' }} aria-hidden="true">
          <div 
            className="portal-progression-indicator" 
            style={{ 
              width: selectedPhase === 'all' ? '100%' : selectedPhase === 'before' ? '33.33%' : selectedPhase === 'during' ? '66.66%' : '100%'
            }} 
          />
        </div>

        {/* Persistent Connected 3-Phase Lifecycle Track */}
        <div className="prevention-ruled-docket" style={{ marginBottom: '16px' }}>
          <div 
            className="prevention-phases-row" 
            role="tablist"
            aria-label="Incident response lifecycle phases"
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: '16px'
            }}
          >
            {/* Phase 01: Before */}
            <div 
              role="tab"
              tabIndex={0}
              aria-selected={selectedPhase === 'before'}
              aria-controls="prevention-phase-panel"
              onClick={() => handlePhaseChange('before')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePhaseChange('before'); } }}
              className={`prevention-phase-card ${selectedPhase === 'before' ? 'is-active-phase' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              title="Click to view Stage 01: Before steps"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="phase-indicator">01 / BEFORE</span>
                {selectedPhase === 'before' && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase' }}>Viewing Now</span>
                )}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, fontWeight: 'bold' }}>Protect</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Verify unexpected requests. Protect credentials. Build strong defense habits before any contact or system threat occurs.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: 'auto', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{selectedPhase === 'before' ? 'Current View' : 'View Steps'}</span>
                <span aria-hidden="true">&rarr;</span>
              </div>
            </div>

            {/* Phase 02: During */}
            <div 
              role="tab"
              tabIndex={0}
              aria-selected={selectedPhase === 'during'}
              aria-controls="prevention-phase-panel"
              onClick={() => handlePhaseChange('during')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePhaseChange('during'); } }}
              className={`prevention-phase-card ${selectedPhase === 'during' ? 'is-active-phase' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              title="Click to view Stage 02: If Targeted steps"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="phase-indicator">02 / DURING</span>
                {selectedPhase === 'during' && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--color-warning)', textTransform: 'uppercase' }}>Viewing Now</span>
                )}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, fontWeight: 'bold' }}>Pause &amp; Verify</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Pause. Verify independently. Avoid sharing sensitive information or one-time codes when confronted with manufactured urgency.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: 'auto', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{selectedPhase === 'during' ? 'Current View' : 'View Steps'}</span>
                <span aria-hidden="true">&rarr;</span>
              </div>
            </div>

            {/* Phase 03: After */}
            <div 
              role="tab"
              tabIndex={0}
              aria-selected={selectedPhase === 'after'}
              aria-controls="prevention-phase-panel"
              onClick={() => handlePhaseChange('after')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePhaseChange('after'); } }}
              className={`prevention-phase-card ${selectedPhase === 'after' ? 'is-active-phase' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              title="Click to view Stage 03: After steps"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="phase-indicator">03 / AFTER</span>
                {selectedPhase === 'after' && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--color-success)', textTransform: 'uppercase' }}>Viewing Now</span>
                )}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, fontWeight: 'bold' }}>Respond &amp; Recover</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Preserve evidence. Secure affected accounts immediately. Report the incident through National Helpline 1930 and official registries.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: 'auto', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{selectedPhase === 'after' ? 'Current View' : 'View Steps'}</span>
                <span aria-hidden="true">&rarr;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Protocol Panel for Active Phase */}
        <div id="prevention-phase-panel" key={selectedPhase} className="prevention-active-phase-card prevention-ruled-docket portal-state-progression">
          {selectedPhase === 'all' && (
            <div style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
                  Your Complete Online Safety Guide
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Click any stage above to see specific steps
                </span>
              </div>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                Staying safe online happens in three simple stages: setting up strong protection beforehand, taking a calm pause when someone contacts you with urgency, and acting quickly if an incident happens.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handlePhaseChange('before')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  See Stage 01: Before &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => handlePhaseChange('during')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  See Stage 02: If Targeted &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => handlePhaseChange('after')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  See Stage 03: After an Attack &rarr;
                </button>
              </div>
            </div>
          )}

          {selectedPhase === 'before' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
                  Phase 01 · Proactive Defense
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handlePhaseChange('all')} 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                  >
                    View All Phases
                  </button>
                  <button 
                    onClick={() => handlePhaseChange('during')} 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                  >
                    Next: During Attack &rarr;
                  </button>
                </div>
              </div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  01 / BEFORE: Independent Verification & Zero-Trust Hygiene
                </h3>
                <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '16px' }}>
                  Proactive security eliminates vulnerabilities before an attacker makes contact. Do not wait for an alert to test whether your accounts and devices are secure.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Credential Separation</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Use distinct, unshared passwords and dedicated passkeys across financial and personal accounts.</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Direct Bookmarking</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Bookmark trusted bank portals and utilities directly to avoid sponsored deceptive search ads.</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Multi-Factor Authentication</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Enable app-based authenticator codes or hardware tokens instead of plaintext SMS fallback.</span>
                  </div>
                </div>
              </div>
            )}

            {selectedPhase === 'during' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-warning)' }}>
                    Phase 02 · Active Engagement
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handlePhaseChange('before')} 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                    >
                      &larr; Before
                    </button>
                    <button 
                      onClick={() => handlePhaseChange('after')} 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                    >
                      Next: After &rarr;
                    </button>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  02 / DURING: The Critical Pause & Immediate Refusal
                </h3>
                <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '16px' }}>
                  When confronted with urgent demands, threats of disconnection, or arrest claims: pause. Urgency is the primary psychological exploit used by cyber criminals.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Refuse One-Time Codes</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>No legitimate agency or bank ever asks for your OTP over phone, chat, or email.</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Reject Screen-Sharing</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Never install remote desktop apps (AnyDesk, TeamViewer) at the request of an incoming caller.</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Break Contact Channel</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Hang up the incoming call and redial the organization's verified public number independently.</span>
                  </div>
                </div>
              </div>
            )}

            {selectedPhase === 'after' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-success)' }}>
                    Phase 03 · Post-Incident Response
                  </span>
                  <button 
                    onClick={() => handlePhaseChange('during')} 
                    className="btn btn-outline" 
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                  >
                    &larr; Back: During Attack
                  </button>
                </div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                  03 / AFTER: Immediate Containment & Statutory Reporting
                </h3>
                <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '16px' }}>
                  If you suspect an incident has occurred or credentials were compromised, the first 2 hours are critical to freezing unauthorized transactions and preserving legal evidence.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>National Helpline 1930</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Dial 1930 immediately to trigger the Citizen Financial Cyber Fraud Reporting System.</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Bank Account Freeze</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Contact your bank's fraud desk to block cards, freeze internet banking, and revoke active UPI handles.</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-white, #ffffff)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(15, 37, 55, 0.04)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Preserve Digital Evidence</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Capture screenshots of payment messages, transaction UTR numbers, caller logs, and chat histories.</span>
                  </div>
                </div>
              </div>
            )}
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
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
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
                    borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
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
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              PASSWORD HYGIENE & MFA
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Password reuse makes you highly vulnerable to credential stuffing. If a hacker breaches one forum, they test your email/password on banking apps.
            </p>

            <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Why It Matters
            </h4>
            <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', borderLeft: '3px solid var(--color-primary)' }}>
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
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              UPI & PAYMENT SECURITY
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
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
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              SAFE BROWSING & LINKS
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Fake portals cloning banking/university login pages are hosted on domains registered to look similar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Check the destination TLD</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Official Indian government portals end in <code>.gov.in</code>. Scammers buy cheap domains like <code>.verify-gov.in</code> to spoof users.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Look for HTTPS</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Never enter credentials on pages labeled "Not Secure" (HTTP) inside the URL bar.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Hover and Inspect URLs</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Hover your mouse over links inside emails and chat logs to view the destination before tapping.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 04: Evidence */}
          <section id="evidence" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>04</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              DIGITAL EVIDENCE PRESERVATION
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              If you fall victim to a cybercrime, preserving evidence is critical to secure an official investigation.
            </p>

            <div style={{
              borderLeft: '4px solid var(--color-primary)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '20px 24px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0, marginBottom: '8px' }}>
                IF SOMETHING HAS ALREADY HAPPENED
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Stop contact with the target profiles immediately. Do not delete chat files or logs; they are crucial forensic footprints.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Screenshots</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Capture profile handles, phone numbers, threat letters, and chat transcripts.</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Transactions</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Record transaction IDs, debit bank account numbers, UPI references, and timestamps.</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Headers & Links</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Save raw EML files or copy destination spoof hyperlinks without loading them.</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h5 style={{ fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '0.9rem' }}>Alert Logs</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Keep SMS alerts, email notification logs, and browser connection warning codes.</p>
              </div>
            </div>
          </section>

          {/* Section 05: If Something Goes Wrong */}
          <section id="wrong" style={{ marginBottom: 'var(--space-xxl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>05</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              IF SOMETHING GOES WRONG
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              A standard incident response checklist to guide your recovery actions in real time:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', minWidth: '100px', textAlign: 'center', textTransform: 'uppercase' }}>Before</span>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Security Hygiene</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Keep recovery email links updated and enable secondary keys on account credentials.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '100px', textAlign: 'center', textTransform: 'uppercase' }}>During</span>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Pause and Verify</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Refuse transaction deadlines and do not enter authentication codes under duress.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '100px', textAlign: 'center', textTransform: 'uppercase' }}>After</span>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0', fontWeight: 'bold' }}>Secure, Preserve, Report</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Lock credentials, debited bank links, take screenshots, and raise coordinate flags on official support portals.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 06: Reporting */}
          <section id="reporting" style={{ marginBottom: 'var(--space-xxl)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '300', color: 'var(--text-muted)', fontFamily: 'monospace' }}>06</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '4px', marginBottom: '16px' }}>
              REPORTING & RESPONSE CHANNELS
            </h2>
            <div style={{ width: '40px', height: '3px', backgroundColor: 'var(--color-primary)', borderRadius: '1.5px', marginBottom: '20px' }} />
            
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Use official channels to file complaints. Keep reference files ready when registering reports:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                padding: '20px 24px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '4px solid var(--color-danger, #dc2626)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ flex: '1 1 360px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--color-danger, #dc2626)', border: '1px solid var(--color-danger, #dc2626)', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Emergency Service • Golden Hour Window
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CFCFRMS / MHA</span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                    National Cyber Crime Reporting Helpline: 1930
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>
                    Official 24/7 national coordination helpline for financial fraud and unauthorized debits. Reporting within the initial <strong>2–3 hour &quot;Golden Hour&quot;</strong> significantly enhances the chances of coordinating inter-bank hold alerts via the CFCFRMS to restrict illicit withdrawals before funds are dispersed across mule accounts. Fund freezing is not guaranteed and depends on rapid notification. <strong>The Golden Hour is not an exclusion deadline</strong> — reports filed after 3 hours or days later remain vital, officially processed 24/7, and essential for legal remedies.
                  </p>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Official Web Portal: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" aria-label="Open cybercrime.gov.in in a new tab" style={{ fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'underline' }}>cybercrime.gov.in</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', alignSelf: 'center' }}>
                  <a
                    href="tel:1930"
                    aria-label="Dial Helpline 1930"
                    style={{
                      backgroundColor: 'var(--color-danger, #dc2626)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    📞 Dial 1930
                  </a>
                  <button
                    onClick={handleCopyHelpline}
                    aria-label={
                      copiedHelpline
                        ? 'Helpline number 1930 copied to clipboard'
                        : copyFailed
                          ? 'Copy failed, please dial 1930 directly'
                          : 'Copy National Cyber Crime Helpline Number 1930'
                    }
                    style={{
                      backgroundColor: 'var(--bg-white)',
                      color: copyFailed ? 'var(--color-danger, #b91c1c)' : 'var(--text-primary)',
                      border: copyFailed ? '1px solid var(--color-danger, #b91c1c)' : '1px solid var(--color-border-dark)',
                      padding: '7px 14px',
                      borderRadius: '4px',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span aria-live="polite">
                      {copiedHelpline
                        ? '✓ Copied'
                        : copyFailed
                          ? '⚠️ Copy failed — dial 1930'
                          : '📋 Copy 1930'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Zero-Telemetry Golden Hour Incident Docket Generator */}
              <div style={{ margin: '20px 0' }}>
                <IncidentDocketGenerator />
              </div>

              <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 8px 0', fontWeight: 'bold' }}>RBI Banking Ombudsman</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Official ombudsman for resolving banking disputes, unauthorized electronic debits, and UPI merchant claims.</p>
                <div style={{ fontSize: '0.85rem' }}>
                  Link: <a href="https://cms.rbi.org.in" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600', color: 'var(--color-primary)', textDecoration: 'underline' }}>cms.rbi.org.in</a>
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
            <div style={{ borderLeft: '3px solid var(--color-primary)', paddingLeft: '16px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
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

      {/* Dynamic branding tagline at the bottom */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-xxl)', paddingTop: '24px', borderTop: '1px dashed var(--color-border)' }}>
        <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
          Learn. Recognize. Stay Safe.
        </span>
      </div>

    </div>
  );
}

export default Prevention;
