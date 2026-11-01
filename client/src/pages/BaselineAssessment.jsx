import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DigitalAwarenessProfile from '../components/assessment/DigitalAwarenessProfile';
import { performStateTransition } from '../utils/transitionUtils';

function BaselineAssessment({ _user, updateProgressTrigger }) {
  const [session, setSession] = useState(null); // active session ID
  const [currentStage, setCurrentStage] = useState(null); // active ScenarioStage
  const [currentStep, setCurrentStep] = useState('start_screen'); // start_screen, active_simulation, reveal_view, completed_summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedHistory, setCompletedHistory] = useState(null);
  const stageHeadingRef = useRef(null);
  
  // Custom mock inputs (instantly discarded)
  const [mockUserId, setMockUserId] = useState('');
  const [mockPassword, setMockPassword] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // Detect active or completed session on mount for safe resumption
  useEffect(() => {
    let isMounted = true;
    const initAssessment = async () => {
      setLoading(true);
      try {
        if (!api.isAuthenticated()) {
          if (isMounted) {
            setCurrentStep('start_screen');
            setLoading(false);
          }
          return;
        }

        const cachedSessionId = sessionStorage.getItem('active_baseline_session_id');
        if (cachedSessionId) {
          try {
            const sessionData = await api.getAssessmentSession(cachedSessionId);
            if (sessionData && sessionData.status === 'in-progress' && isMounted) {
              setSession(sessionData.sessionId);
              setCurrentStage(sessionData.stage);
              setCurrentStep('active_simulation');
              setLoading(false);
              return;
            }
          } catch (e) {
            sessionStorage.removeItem('active_baseline_session_id');
          }
        }

        const statusData = await api.getAssessmentStatus('baseline');
        if (!isMounted) return;

        if (statusData.hasActiveSession && statusData.stage) {
          sessionStorage.setItem('active_baseline_session_id', statusData.sessionId);
          setSession(statusData.sessionId);
          setCurrentStage(statusData.stage);
          setCurrentStep('active_simulation');
        } else if (statusData.hasCompletedSession && statusData.completedSession) {
          setCompletedHistory(statusData.completedSession);
          setResult(statusData.completedSession);
          setCurrentStep('completed_summary');
        } else {
          setCurrentStep('start_screen');
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Could not restore baseline session:', err.message);
          setCurrentStep('start_screen');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAssessment();
    return () => { isMounted = false; };
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.startAssessment('baseline');
      sessionStorage.setItem('active_baseline_session_id', data.sessionId);
      setSession(data.sessionId);
      performStateTransition(() => {
        setCurrentStage(data.stage);
        setCurrentStep('active_simulation');
        window.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => stageHeadingRef.current?.focus(), 50);
      });
    } catch (err) {
      setError(err.message || 'Failed to start first check assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAction = async (actionType) => {
    if (submitting || !currentStage) return;
    if (actionType === 'decline') {
      const declineDecision = currentStage.decisions.find(d => 
        d.optionText.toLowerCase().includes('hang up') || 
        d.optionText.toLowerCase().includes('ignore') ||
        d.optionText.toLowerCase().includes('decline')
      );
      if (declineDecision) {
        await submitStep(declineDecision.id);
      }
    } else if (actionType === 'accept') {
      const acceptDecision = currentStage.decisions.find(d => 
        d.optionText.toLowerCase().includes('press 9') || 
        d.optionText.toLowerCase().includes('connect') ||
        d.optionText.toLowerCase().includes('accept')
      );
      if (acceptDecision) {
        await submitStep(acceptDecision.id);
      }
    }
  };

  const handleInlineClick = async () => {
    if (submitting || !currentStage) return;
    const clickDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('click') || 
      d.optionText.toLowerCase().includes('open link') ||
      d.optionText.toLowerCase().includes('verify account')
    );
    if (clickDecision) {
      await submitStep(clickDecision.id);
    } else if (currentStage.decisions.length > 0) {
      await submitStep(currentStage.decisions[currentStage.decisions.length - 1].id);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !currentStage) return;
    const loginDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('enter simulated login') || 
      d.optionText.toLowerCase().includes('credentials') ||
      d.optionText.toLowerCase().includes('password')
    );
    const decisionId = loginDecision ? loginDecision.id : (currentStage.decisions[0] ? currentStage.decisions[0].id : '');
    await submitStep(decisionId);
  };

  const submitStep = async (decisionId) => {
    if (submitting || !session || !currentStage) return;
    setSubmitting(true);
    setError('');
    try {
      const nextData = await api.submitAssessmentStep(session, currentStage.id, decisionId);
      
      performStateTransition(() => {
        if (nextData.isCompleted) {
          sessionStorage.removeItem('active_baseline_session_id');
          setResult(nextData);
          setCurrentStep('reveal_view');
          window.scrollTo({ top: 0, behavior: 'instant' });
          if (updateProgressTrigger) updateProgressTrigger();
        } else {
          setCurrentStage(nextData.stage);
          setCurrentStep('active_simulation');
          setMockUserId('');
          setMockPassword('');
          setMockOtp('');
          window.scrollTo({ top: 0, behavior: 'instant' });
          setTimeout(() => stageHeadingRef.current?.focus(), 50);
        }
      });
    } catch (err) {
      setError(err.message || 'Error submitting response step.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) var(--space-md)', maxWidth: '840px', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}>
      {/* Accessible Live Region */}
      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        {currentStage ? `Situation order ${currentStage.stageOrder}: ${currentStage.title}. ${currentStage.description}` : ''}
      </div>

      {/* ========================================================================= */}
      {/* 1. START SCREEN & BRIEFING                                                */}
      {/* ========================================================================= */}
      {currentStep === 'start_screen' && (
        <div className="simulation-briefing-card">
          <div className="simulation-briefing-logo">
            <img src="/logo/cyber-law-logo-icon.svg" alt="" style={{ height: '36px', width: 'auto' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cyber Law Awareness Portal
            </span>
          </div>

          <h1 className="simulation-briefing-title">Your Digital Day</h1>
          <p className="simulation-briefing-lead">
            Experience 5 everyday digital situations. Make the decisions you would make in real life.
          </p>

          <div className="simulation-briefing-points">
            <div className="simulation-point-item">
              <span className="simulation-point-icon">1</span>
              <div>
                <h4 className="simulation-point-title">Everyday Situations</h4>
                <p className="simulation-point-desc">Navigate realistic emails, SMS notices, phone calls, and payment prompts.</p>
              </div>
            </div>

            <div className="simulation-point-item">
              <span className="simulation-point-icon">2</span>
              <div>
                <h4 className="simulation-point-title">Safe &amp; Suspicious Mix</h4>
                <p className="simulation-point-desc">Some messages are completely legitimate system notices; others are scams.</p>
              </div>
            </div>

            <div className="simulation-point-item">
              <span className="simulation-point-icon">3</span>
              <div>
                <h4 className="simulation-point-title">Your Natural Habits</h4>
                <p className="simulation-point-desc">There are no trick questions. Choose what you would actually do online.</p>
              </div>
            </div>

            <div className="simulation-point-item">
              <span className="simulation-point-icon">4</span>
              <div>
                <h4 className="simulation-point-title">Your Baseline</h4>
                <p className="simulation-point-desc">Measures your starting habits across 6 safety areas before you begin lessons.</p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Takes about <strong>5–7 minutes</strong> • 5 situations • Private &amp; secure
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '16px' }} role="alert">{error}</div>}

          <button 
            onClick={handleStart} 
            className="btn btn-primary" 
            style={{ padding: '12px 36px', fontSize: '1.05rem', fontWeight: '700' }}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Your Digital Day \u2192'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE SIMULATION & DECISION STATION                                   */}
      {/* ========================================================================= */}
      {currentStep === 'active_simulation' && currentStage && (
        <div key={currentStage.id} className="simulation-container portal-state-progression">
          {/* Situation Stepper Header */}
          <div className="situation-stepper-bar">
            <div className="situation-badge">
              <span className="situation-badge-dot" aria-hidden="true" />
              <span>FIRST CHECK: YOUR DIGITAL DAY</span>
            </div>
            <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>
              Situation {currentStage.stageOrder} of 5
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="quiz-progress-track" style={{ marginBottom: '18px' }} aria-hidden="true">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${(currentStage.stageOrder / 5) * 100}%` }}
            />
          </div>

          {/* Situation Title & Context */}
          <h2 ref={stageHeadingRef} tabIndex="-1" style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', outline: 'none' }}>
            {currentStage.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '20px' }}>
            {currentStage.description}
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: '16px' }} role="alert">{error}</div>}

          {/* Mock Interactive Device Frame */}
          <div className="mock-browser-frame" style={{ marginBottom: '24px' }}>
            <div className="mock-browser-header">
              <div className="browser-dots" aria-hidden="true">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="mock-browser-url">
                {currentStage.mockInterfaceType === 'email' && (currentStage.mockInterfaceData.senderEmail ? 'https://mail.google.com/mail/u/0/#inbox' : 'https://mail.personal-inbox.com')}
                {currentStage.mockInterfaceType === 'website' && (currentStage.mockInterfaceData.url || 'https://web-portal.in')}
                {currentStage.mockInterfaceType === 'notification' && 'System Notification Tray'}
                {currentStage.mockInterfaceType === 'sms' && 'Mobile SMS Notification Inbox'}
                {currentStage.mockInterfaceType === 'phone_call' && 'Incoming Call...'}
                {currentStage.mockInterfaceType === 'checkout' && 'https://upi-gateway.in/secure-checkout'}
                {(currentStage.mockInterfaceType === 'chat' || currentStage.mockInterfaceType === 'messaging') && 'Mobile Messaging Sandbox'}
                {currentStage.mockInterfaceType === 'browser' && (currentStage.mockInterfaceData.url || 'browser://app-permissions')}
              </div>
            </div>

            {/* Email Inbox Simulation */}
            {currentStage.mockInterfaceType === 'email' && (
              <div className="mock-email-container">
                <div className="mock-email-sidebar">
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mailboxes</strong>
                  <ul className="mock-email-folders" style={{ padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li className="active">Inbox (1)</li>
                    <li>Sent</li>
                    <li>Spam</li>
                  </ul>
                </div>
                <div className="mock-email-body">
                  <div className="email-header-info">
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{currentStage.mockInterfaceData.subject}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <strong>From:</strong> {currentStage.mockInterfaceData.senderName || currentStage.mockInterfaceData.from} &lt;<span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{currentStage.mockInterfaceData.senderEmail || currentStage.mockInterfaceData.sender || currentStage.mockInterfaceData.from}</span>&gt;
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Date:</strong> {currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.55', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.bodyText}
                  </div>
                  {currentStage.mockInterfaceData.ctaText && (
                    <div style={{ marginTop: '20px' }}>
                      <button 
                        onClick={handleInlineClick} 
                        className="btn btn-danger" 
                        style={{ fontWeight: '600' }}
                      >
                        {currentStage.mockInterfaceData.ctaText}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Website Cloned Portal / Web Page Simulation */}
            {currentStage.mockInterfaceType === 'website' && (
              <div className="mock-browser-content" style={{ padding: '24px' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {currentStage.mockInterfaceData.title}
                  </h3>
                  {currentStage.mockInterfaceData.url && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {currentStage.mockInterfaceData.url}
                    </span>
                  )}
                </div>

                {currentStage.mockInterfaceData.warningText && (
                  <div className="mock-scenario-note" style={{ marginBottom: '16px' }}>
                    <strong>Observation:</strong> {currentStage.mockInterfaceData.warningText}
                  </div>
                )}

                {currentStage.mockInterfaceData.requiresCredentials ? (
                  <div style={{ maxWidth: '420px', margin: '20px auto', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px', backgroundColor: 'var(--color-surface-card, #FCFAF5)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Verification Portal</h4>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>Enter credentials to proceed</span>
                    </div>
                    <form onSubmit={handleLoginSubmit}>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Account ID / Username</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. user99"
                          value={mockUserId}
                          onChange={(e) => setMockUserId(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="••••••••"
                          value={mockPassword}
                          onChange={(e) => setMockPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SMS Verification OTP</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 559102"
                          value={mockOtp}
                          onChange={(e) => setMockOtp(e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-danger"
                        style={{ width: '100%', padding: '0.7rem', fontWeight: '600' }}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Verify & Unlock'}
                      </button>
                    </form>
                  </div>
                ) : (
                  currentStage.mockInterfaceData.bodyText && (
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6', padding: '8px 0' }}>
                      {currentStage.mockInterfaceData.bodyText}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Notification / Browser Dialog */}
            {currentStage.mockInterfaceType === 'notification' && (
              <div style={{ maxWidth: '440px', margin: '30px auto', backgroundColor: 'var(--color-surface-card, #FCFAF5)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', borderLeft: '4px solid var(--color-text-primary, #302B27)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-surface-secondary, #EFE8DC)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-primary, #302B27)' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{currentStage.mockInterfaceData.title}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp || 'System Alert'}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.45' }}>
                      {currentStage.mockInterfaceData.bodyText || currentStage.mockInterfaceData.message}
                    </p>
                    {currentStage.mockInterfaceData.ctaText && (
                      <button 
                        onClick={handleInlineClick}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        {currentStage.mockInterfaceData.ctaText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SMS Message Mockup */}
            {currentStage.mockInterfaceType === 'sms' && (
              <div style={{ maxWidth: '340px', margin: '30px auto', backgroundColor: 'var(--color-surface-secondary, #EFE8DC)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>
                  SMS from: {currentStage.mockInterfaceData.senderNumber || currentStage.mockInterfaceData.sender}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--color-surface-card, #FCFAF5)', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', maxWidth: '88%', fontSize: '0.9rem', lineHeight: '1.45', color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.bodyText}
                    {(currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp) && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
                        {currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phone Call Simulator */}
            {currentStage.mockInterfaceType === 'phone_call' && (
              <div style={{ maxWidth: '320px', margin: '30px auto', backgroundColor: '#0f172a', color: '#FCFAF5', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#94a3b8' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: '#FCFAF5' }}>{currentStage.mockInterfaceData.callerName || currentStage.mockInterfaceData.callerLabel || 'Incoming Call'}</h3>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '20px' }}>{currentStage.mockInterfaceData.callerNumber}</span>
                
                <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '12px', backgroundColor: '#1e293b', fontSize: '0.85rem', lineHeight: '1.4', fontStyle: 'italic', color: '#cbd5e1', marginBottom: '24px', textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {currentStage.mockInterfaceData.bodyText || currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.audioPrompt || currentStage.mockInterfaceData.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handlePhoneAction('decline')}
                      disabled={submitting}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                      aria-label="Decline Call"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Decline</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handlePhoneAction('accept')}
                      disabled={submitting}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-success, #536F61)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                      aria-label="Accept Call"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Accept</span>
                  </div>
                </div>
              </div>
            )}

            {/* UPI Checkout Payment Simulation */}
            {currentStage.mockInterfaceType === 'checkout' && (
              <div style={{ maxWidth: '340px', margin: '30px auto', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--color-surface-card, #FCFAF5)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ backgroundColor: 'var(--color-text-primary, #302B27)', color: '#FCFAF5', padding: '12px 16px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Secure UPI Gateway Request
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Requested by</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'block', marginBottom: '16px' }}>{currentStage.mockInterfaceData.merchantName}</strong>
                  
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount Request</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-error)' }}>₹{currentStage.mockInterfaceData.amount}</div>
                  </div>

                  {currentStage.mockInterfaceData.warningText && (
                    <div className="mock-scenario-note" style={{ textAlign: 'left', marginBottom: '0' }}>
                      <strong>Observation:</strong> {currentStage.mockInterfaceData.warningText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Decision Station Console */}
          <section className="decision-station" aria-label="Decision Action Console">
            <h3 className="decision-station-title">What would you do?</h3>
            <div className="decision-cards-list">
              {currentStage.decisions.map((opt, optIdx) => (
                <button
                  key={opt.id}
                  onClick={() => submitStep(opt.id)}
                  className="decision-action-card"
                  disabled={submitting}
                >
                  <span className="decision-number-badge">{optIdx + 1}</span>
                  <span className="decision-action-text">{opt.optionText}</span>
                </button>
              ))}
            </div>
            {submitting && (
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Recording your decision...
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DIGITAL AWARENESS PROFILE (POST-COMPLETION & RETURNING VIEW)          */}
      {/* ========================================================================= */}
      {(currentStep === 'reveal_view' || currentStep === 'completed_summary') && (result || completedHistory) && (
        <DigitalAwarenessProfile
          result={result}
          completedHistory={completedHistory}
          onRetake={handleStart}
        />
      )}
    </div>
  );
}

export default BaselineAssessment;
