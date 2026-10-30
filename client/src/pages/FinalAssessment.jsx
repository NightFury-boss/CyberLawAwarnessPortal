import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemediationCards from '../components/RemediationCards';
import { performStateTransition } from '../utils/transitionUtils';

function FinalAssessment({ _user, updateProgressTrigger }) {
  const [session, setSession] = useState(null); // active session ID
  const [currentStage, setCurrentStage] = useState(null); // current ScenarioStage
  const [currentStep, setCurrentStep] = useState('start_screen'); // start_screen, active_simulation, reveal_view, completed_summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedHistory, setCompletedHistory] = useState(null);
  const stageHeadingRef = useRef(null);
  
  // Custom mock inputs (instantly discarded)
  const [mockUserId, setMockUserId] = useState('');
  const [mockPassword, setMockPassword] = useState('');
  const [mockZipPassword, setMockZipPassword] = useState('');

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

        const cachedSessionId = sessionStorage.getItem('active_final_session_id');
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
            sessionStorage.removeItem('active_final_session_id');
          }
        }

        const statusData = await api.getAssessmentStatus('final');
        if (!isMounted) return;

        if (statusData.hasActiveSession && statusData.stage) {
          sessionStorage.setItem('active_final_session_id', statusData.sessionId);
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
          console.warn('Could not restore final session:', err.message);
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
      const data = await api.startAssessment('final');
      sessionStorage.setItem('active_final_session_id', data.sessionId);
      setSession(data.sessionId);
      performStateTransition(() => {
        setCurrentStage(data.stage);
        setCurrentStep('active_simulation');
        window.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => stageHeadingRef.current?.focus(), 50);
      });
    } catch (err) {
      setError(err.message || 'Failed to start final assessment.');
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
        await handleSelectOption(declineDecision.id);
      }
    } else if (actionType === 'accept') {
      const acceptDecision = currentStage.decisions.find(d => 
        d.optionText.toLowerCase().includes('press 9') || 
        d.optionText.toLowerCase().includes('connect') ||
        d.optionText.toLowerCase().includes('accept')
      );
      if (acceptDecision) {
        await handleSelectOption(acceptDecision.id);
      }
    }
  };

  const handleInlineClick = async () => {
    if (submitting || !currentStage) return;
    const clickDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('click') || 
      d.optionText.toLowerCase().includes('open link') ||
      d.optionText.toLowerCase().includes('telegram')
    );
    if (clickDecision) {
      await handleSelectOption(clickDecision.id);
    } else if (currentStage.decisions.length > 0) {
      await handleSelectOption(currentStage.decisions[currentStage.decisions.length - 1].id);
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
    await handleSelectOption(decisionId);
  };

  const handleZipSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !currentStage) return;
    const zipDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('run') || 
      d.optionText.toLowerCase().includes('download') ||
      d.optionText.toLowerCase().includes('extract')
    );
    const decisionId = zipDecision ? zipDecision.id : (currentStage.decisions[0] ? currentStage.decisions[0].id : '');
    await handleSelectOption(decisionId);
  };

  const handleSelectOption = async (decisionId) => {
    if (submitting || !session || !currentStage) return;
    setSubmitting(true);
    setError('');
    try {
      const nextData = await api.submitAssessmentStep(session, currentStage.id, decisionId);

      // Clear input fields
      setMockUserId('');
      setMockPassword('');
      setMockZipPassword('');

      performStateTransition(() => {
        if (nextData.isCompleted) {
          sessionStorage.removeItem('active_final_session_id');
          setResult(nextData);
          setCurrentStep('reveal_view');
          window.scrollTo({ top: 0, behavior: 'instant' });
          if (updateProgressTrigger) updateProgressTrigger();
        } else {
          // Move to next adaptive branch stage returned by backend
          setCurrentStage(nextData.stage);
          window.scrollTo({ top: 0, behavior: 'instant' });
          setTimeout(() => stageHeadingRef.current?.focus(), 50);
        }
      });
    } catch (err) {
      setError(err.message || 'Error submitting choice step.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', maxWidth: '860px', fontFamily: 'var(--font-sans)' }}>
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

          <h1 className="simulation-briefing-title">Your Final Safety Check</h1>
          <p className="simulation-briefing-lead">
            Welcome back to <strong>&ldquo;A Day in Your Digital Life&rdquo;</strong>. Experience 5 realistic situations and make the decisions you would make in everyday life. See how much your digital safety habits have grown since your First Check.
          </p>

          <div className="simulation-briefing-points">
            <div className="simulation-point-item">
              <span className="simulation-point-icon">1</span>
              <div>
                <h4 className="simulation-point-title">Real-World Decisions</h4>
                <p className="simulation-point-desc">Interact with authentic mock emails, SMS messages, phone calls, and checkout screens.</p>
              </div>
            </div>

            <div className="simulation-point-item">
              <span className="simulation-point-icon">2</span>
              <div>
                <h4 className="simulation-point-title">Safe &amp; Suspicious Mix</h4>
                <p className="simulation-point-desc">Some notices are completely genuine; others contain deceptive psychological tricks.</p>
              </div>
            </div>

            <div className="simulation-point-item">
              <span className="simulation-point-icon">3</span>
              <div>
                <h4 className="simulation-point-title">Measuring Habit Growth</h4>
                <p className="simulation-point-desc">Compare your instincts side-by-side with your First Check across 6 practical habits.</p>
              </div>
            </div>

            <div className="simulation-point-item">
              <span className="simulation-point-icon">4</span>
              <div>
                <h4 className="simulation-point-title">No Pressure</h4>
                <p className="simulation-point-desc">There are no trick questions. Choose what you would genuinely do online today.</p>
              </div>
            </div>
          </div>

          <div style={{ margin: '0 auto 24px auto', maxWidth: '580px', borderLeft: '3px solid #0f2537', paddingLeft: '16px', textAlign: 'left' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
              &ldquo;Improvement is not about knowing every answer. It is about recognizing better decisions when they matter.&rdquo;
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '18px', maxWidth: '580px', margin: '0 auto 18px auto' }}>{error}</div>}

          <div>
            <button 
              onClick={handleStart} 
              className="btn btn-primary" 
              style={{ padding: '0.85rem 2.8rem', fontSize: '1.05rem', fontWeight: '700' }}
              disabled={loading}
            >
              {loading ? 'Preparing Simulation...' : 'Start Final Check →'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMPLETED SESSION SUMMARY SCREEN                                       */}
      {/* ========================================================================= */}
      {currentStep === 'completed_summary' && completedHistory && (
        <div className="simulation-briefing-card" style={{ textAlign: 'center' }}>
          <div className="simulation-briefing-logo">
            <img src="/logo/cyber-law-logo-icon.svg" alt="" style={{ height: '36px', width: 'auto' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cyber Law Awareness Portal
            </span>
          </div>

          <h1 className="simulation-briefing-title">Final Check Completed</h1>
          <p className="simulation-briefing-lead">
            You have completed your final safety check. Here is how your online safety habits look now.
          </p>

          {completedHistory.behaviourScores ? (
            <div style={{ marginBottom: '28px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f2537', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', textAlign: 'center' }}>
                Your Final Habits Across 6 Safety Areas
              </div>
              <div className="habit-benchmark-grid">
                {[
                  { key: 'recognition', label: 'Spotting Dangers', desc: 'Detecting deceptive offers, threats, and urgency' },
                  { key: 'signalIdentification', label: 'Spotting Fake Senders', desc: 'Noticing spoofed email addresses and URLs' },
                  { key: 'verification', label: 'Checking Before Trusting', desc: 'Verifying claims via independent channels' },
                  { key: 'decisionQuality', label: 'Making Thoughtful Choices', desc: 'Evaluating overall risk before acting' },
                  { key: 'falsePositive', label: 'Staying Calm with Safe Messages', desc: 'Avoiding false panic on legitimate notices' },
                  { key: 'unreviewedAcceptance', label: 'Not Clicking Without Checking', desc: 'Stopping automatic approval of permissions' }
                ].map(habit => {
                  const score = completedHistory.behaviourScores?.[habit.key] ?? 0;
                  return (
                    <div key={habit.key} className="habit-benchmark-card">
                      <div className="habit-benchmark-top">
                        <span className="habit-benchmark-label">{habit.label}</span>
                        <span className="habit-benchmark-score">{score}%</span>
                      </div>
                      <div className="habit-benchmark-bar">
                        <div className="habit-benchmark-bar-fill" style={{ width: `${score}%` }} />
                      </div>
                      <p className="habit-benchmark-desc">{habit.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="alert alert-secondary" style={{ marginBottom: '28px', textAlign: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f2537' }}>FINAL CHECK RECORDED</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Your final check has been securely recorded across your 6 online safety habits.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
            <button 
              onClick={() => { setResult(completedHistory); setCurrentStep('reveal_view'); }}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.6rem', fontWeight: '700' }}
            >
              See What Changed &amp; Why →
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.6rem' }}
            >
              Go to Dashboard
            </button>
            <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={handleStart} 
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Take Final Check Again'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Starting again will not erase your past scores.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE SIMULATION                                                      */}
      {/* ========================================================================= */}
      {currentStep === 'active_simulation' && currentStage && (
        <div key={currentStage.id} className="portal-state-progression">
          {/* Situation Stepper Bar */}
          <div className="situation-stepper-bar">
            <div className="situation-badge">
              <span className="situation-badge-dot" aria-hidden="true" />
              <span>FINAL CHECK: A DAY IN YOUR DIGITAL LIFE</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.85rem' }}>
              Situation {currentStage.stageOrder} of 5
            </div>
          </div>

          {/* Thin Progress Bar */}
          <div className="quiz-progress-track" style={{ marginBottom: '22px' }} aria-hidden="true">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${(currentStage.stageOrder / 5) * 100}%` }}
            />
          </div>

          <h2 ref={stageHeadingRef} tabIndex="-1" style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f2537', marginBottom: '8px', outline: 'none' }}>
            {currentStage.title}
          </h2>
          <p className="text-secondary" style={{ marginBottom: '22px', fontSize: '0.96rem', lineHeight: '1.5' }}>
            {currentStage.description}
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: '18px' }}>{error}</div>}

          {/* ===================================================================== */}
          {/* Mock Browser & Device Frames                                          */}
          {/* ===================================================================== */}
          <div className="mock-browser-frame">
            <div className="mock-browser-header">
              <div className="mock-browser-dots">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <div className="mock-browser-address">
                {currentStage.mockInterfaceType === 'email' && (currentStage.mockInterfaceData.senderEmail ? 'https://mail.google.com/mail/u/0/#inbox' : 'https://mail.personal-inbox.com')}
                {currentStage.mockInterfaceType === 'browser' && (currentStage.mockInterfaceData.url || 'browser://app-permissions')}
                {currentStage.mockInterfaceType === 'website' && (currentStage.mockInterfaceData.url || 'https://web-portal.in')}
                {currentStage.mockInterfaceType === 'qr_code' && 'https://upi-gateway.in/qr-pay'}
                {currentStage.mockInterfaceType === 'sms' && 'Mobile SMS Inbox'}
                {currentStage.mockInterfaceType === 'phone_call' && 'Incoming Audio Call...'}
                {currentStage.mockInterfaceType === 'checkout' && 'https://upi-gateway.in/secure-checkout'}
                {(currentStage.mockInterfaceType === 'chat' || currentStage.mockInterfaceType === 'messaging') && 'Mobile Messaging Sandbox'}
                {currentStage.mockInterfaceType === 'notification' && 'System Notification Tray'}
              </div>
            </div>

            {/* Email Inbox Simulation */}
            {currentStage.mockInterfaceType === 'email' && (
              <div className="mock-email-container">
                <div className="mock-email-sidebar">
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Folders</span>
                  <ul className="mock-email-folders" style={{ padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li className="active">Inbox (1)</li>
                    <li>Sent</li>
                    <li>Spam</li>
                  </ul>
                </div>
                <div className="mock-email-body">
                  <div className="mock-email-header">
                    <h3 className="mock-email-subject">{currentStage.mockInterfaceData.subject}</h3>
                    <div className="mock-email-meta">
                      <strong>From:</strong> {currentStage.mockInterfaceData.senderName || currentStage.mockInterfaceData.from} &lt;<span style={{ color: '#0f2537', fontWeight: '700' }}>{currentStage.mockInterfaceData.senderEmail || currentStage.mockInterfaceData.sender || currentStage.mockInterfaceData.from}</span>&gt;
                    </div>
                    {(currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp) && (
                      <div className="mock-email-meta">
                        <strong>Date:</strong> {currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp}
                      </div>
                    )}
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: '1.55', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.bodyText}
                  </div>
                  
                  {currentStage.mockInterfaceData.attachmentName && (
                    <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-secondary)' }}>
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      <strong>{currentStage.mockInterfaceData.attachmentName}</strong>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>Size: 242 KB</span>
                    </div>
                  )}

                  {currentStage.mockInterfaceData.ctaText && (
                    <div style={{ marginTop: '20px' }}>
                      <button 
                        onClick={handleInlineClick} 
                        className="btn btn-danger" 
                        style={{ fontWeight: '700' }}
                      >
                        {currentStage.mockInterfaceData.ctaText}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Legitimate browser patch / Browser UI */}
            {currentStage.mockInterfaceType === 'browser' && (
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#0f2537', marginBottom: '6px' }}>
                  {currentStage.mockInterfaceData.title}
                </h3>
                <p className="text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: '16px' }}>
                  Address: {currentStage.mockInterfaceData.url}
                </p>
                
                {currentStage.mockInterfaceData.url && currentStage.mockInterfaceData.url.endsWith('.zip') ? (
                  <div style={{ maxWidth: '420px', margin: '20px auto', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                    <strong style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>Extract ZIP archive contents:</strong>
                    <form onSubmit={handleZipSubmit}>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Decryption Password (if prompted)</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          value={mockZipPassword}
                          onChange={(e) => setMockZipPassword(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-danger" style={{ width: '100%', fontSize: '0.88rem', fontWeight: '700' }} disabled={submitting}>
                        Run setup.exe
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="alert alert-success" style={{ fontSize: '0.92rem', borderLeft: '4px solid #16a34a', margin: 0 }}>
                    {currentStage.mockInterfaceData.bodyText || currentStage.mockInterfaceData.body}
                  </div>
                )}
              </div>
            )}

            {/* Website (Normal or Cloned Web Page) */}
            {currentStage.mockInterfaceType === 'website' && (
              <div style={{ padding: '24px' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.35rem', color: '#0f2537', margin: '0 0 4px 0' }}>{currentStage.mockInterfaceData.title}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Address: {currentStage.mockInterfaceData.url}</span>
                </div>

                {currentStage.mockInterfaceData.warningText && (
                  <div className="mock-scenario-note" style={{ marginBottom: '18px' }}>
                    <strong>Observation:</strong> {currentStage.mockInterfaceData.warningText}
                  </div>
                )}

                {currentStage.mockInterfaceData.requiresCredentials ? (
                  <div style={{ maxWidth: '420px', margin: '20px auto', border: '1px solid var(--color-border)', padding: '22px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <form onSubmit={handleLoginSubmit}>
                      <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>Netbanking Customer ID</label>
                        <input type="text" className="form-control" placeholder="Customer ID" required value={mockUserId} onChange={e => setMockUserId(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>Password / IPIN</label>
                        <input type="password" className="form-control" placeholder="Password" required value={mockPassword} onChange={e => setMockPassword(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-danger" style={{ width: '100%', fontWeight: '700' }} disabled={submitting}>
                        Submit Secure Payment
                      </button>
                    </form>
                  </div>
                ) : (
                  currentStage.mockInterfaceData.bodyText && (
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
                      {currentStage.mockInterfaceData.bodyText}
                    </p>
                  )
                )}
              </div>
            )}

            {/* QR Code Scan Mockup */}
            {currentStage.mockInterfaceType === 'qr_code' && (
              <div style={{ textAlign: 'center', padding: '26px' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#0f2537', marginBottom: '4px' }}>
                  {currentStage.mockInterfaceData.title}
                </h3>
                <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b91c1c', marginBottom: '18px' }}>
                  Amount due: {currentStage.mockInterfaceData.amount}
                </p>

                <div style={{
                  width: '180px',
                  height: '180px',
                  border: '3px solid #0f2537',
                  margin: '0 auto 16px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', width: '140px', height: '140px' }}>
                    {[...Array(25)].map((_, i) => (
                      <div key={i} style={{ backgroundColor: (i % 2 === 0 || i % 5 === 0) ? '#0f2537' : 'transparent' }} />
                    ))}
                  </div>
                </div>

                <p className="text-muted" style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
                  {currentStage.mockInterfaceData.instructions}
                </p>
              </div>
            )}

            {/* SMS Message Mockup */}
            {currentStage.mockInterfaceType === 'sms' && (
              <div className="mock-sms-phone">
                <div className="sms-header">
                  SMS from: {currentStage.mockInterfaceData.senderNumber || currentStage.mockInterfaceData.sender}
                </div>
                <div className="sms-bubble">
                  {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.bodyText}
                  {(currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp) && (
                    <span className="sms-timestamp">
                      {currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Phone Call Simulator */}
            {currentStage.mockInterfaceType === 'phone_call' && (
              <div className="mock-phone-container">
                <div className="phone-avatar">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3 className="phone-caller-name">{currentStage.mockInterfaceData.callerName || currentStage.mockInterfaceData.callerLabel || 'Incoming Call'}</h3>
                <span className="phone-caller-number">{currentStage.mockInterfaceData.callerNumber}</span>
                
                <div className="phone-audio-prompt">
                  {currentStage.mockInterfaceData.bodyText || currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.audioPrompt || currentStage.mockInterfaceData.message}
                </div>

                <div className="phone-actions-row">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handlePhoneAction('decline')}
                      disabled={submitting}
                      className="phone-btn decline"
                      aria-label="Decline Call"
                      title="Decline Call"
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
                      className="phone-btn accept"
                      aria-label="Accept Call"
                      title="Accept Call"
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
              <div className="mock-upi-card">
                <div className="upi-header">
                  Secure UPI Gateway Request
                </div>
                <div className="upi-body">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Requested by</span>
                  <strong style={{ fontSize: '1.15rem', color: '#0f2537', display: 'block', marginBottom: '16px' }}>{currentStage.mockInterfaceData.merchantName}</strong>
                  
                  <div className="upi-amount-box">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount Request</span>
                    <div className="upi-amount">₹{currentStage.mockInterfaceData.amount}</div>
                  </div>

                  {currentStage.mockInterfaceData.warningText && (
                    <div className="mock-scenario-note" style={{ textAlign: 'left', marginBottom: '0' }}>
                      <strong>Observation:</strong> {currentStage.mockInterfaceData.warningText}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Sandbox Messenger Simulation */}
            {(currentStage.mockInterfaceType === 'chat' || currentStage.mockInterfaceType === 'messaging') && (
              <div className="mock-chat-window">
                <div className="chat-window-header">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>{currentStage.mockInterfaceData.sender || currentStage.mockInterfaceData.callerID || currentStage.mockInterfaceData.platform || 'Direct Message'}</span>
                </div>
                <div className="chat-window-body">
                  <div className="chat-bubble">
                    {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.transcript || currentStage.mockInterfaceData.bodyText}
                    {(currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp) && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                        {currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification / Browser Dialog */}
            {currentStage.mockInterfaceType === 'notification' && (
              <div className="mock-system-alert">
                <div className="alert-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#0f2537' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f2537' }}>{currentStage.mockInterfaceData.title}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp || 'System Alert'}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.45', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.bodyText}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* Decision Station Console                                              */}
          {/* ===================================================================== */}
          <div className="decision-station">
            <h3 className="decision-station-title">What would you do?</h3>
            <div className="decision-cards-list">
              {currentStage.decisions.map((opt, idx) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className="decision-action-card"
                  disabled={submitting}
                  aria-label={`Action ${idx + 1}: ${opt.optionText}`}
                >
                  <span className="decision-number-badge">{idx + 1}</span>
                  <span className="decision-action-text">{opt.optionText}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COMPARISON & REVEAL VIEW                                               */}
      {/* ========================================================================= */}
      {currentStep === 'reveal_view' && result && (
        <div className="reveal-pane portal-state-reveal-down" style={{ border: '1px solid var(--color-border)', borderTop: '3px solid #0f2537' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0f2537', marginBottom: '10px' }}>
            Your Final Check Results
          </h2>
          <p className="text-secondary" style={{ marginBottom: '22px', fontSize: '1.05rem', lineHeight: '1.55' }}>
            Here is what your choices show about your online safety habits, and how they compare with your starting check.
          </p>

          <div style={{ marginBottom: '26px', borderLeft: '3px solid #0f2537', paddingLeft: '16px' }}>
            <p style={{ fontSize: '1.05rem', color: '#0f2537', fontStyle: 'italic', margin: '0 0 6px 0', fontWeight: '700' }}>
              &ldquo;You weren’t being tested on whether you could guess what was a scam.&rdquo;
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
              &ldquo;You were being observed on how you make everyday digital decisions under realistic conditions.&rdquo;
            </p>
          </div>

          {/* Scores grid split */}
          <div className="reveal-layout-grid" style={{ marginBottom: '32px' }}>
            {/* Left side: Observed Digital Habits breakdown */}
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#0f2537', marginBottom: '14px' }}>
                Your Safety Habits
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'recognition', label: 'Spotting Dangers', desc: 'How well you caught sneaky tricks, fake alerts, and pressure tactics.' },
                  { key: 'signalIdentification', label: 'Spotting Fake Senders', desc: 'Noticing suspicious sender emails, fake domains, and payment links.' },
                  { key: 'verification', label: 'Checking Before Trusting', desc: 'Double-checking through official websites, apps, or real phone numbers.' },
                  { key: 'decisionQuality', label: 'Making Thoughtful Choices', desc: 'How sound and safe your overall reactions were across situations.' },
                  { 
                    key: 'falsePositive', 
                    label: 'Staying Calm with Safe Messages', 
                    desc: `Recognizing real system updates or authentic notices without panicking (${result.falsePositivePenaltyPoints || 0} penalty point(s)).` 
                  },
                  { 
                    key: 'unreviewedAcceptance', 
                    label: 'Not Clicking Without Checking', 
                    desc: `Avoiding approving requests or permissions without reading first (${result.unreviewedAcceptancePenaltyPoints || 0} penalty point(s)).` 
                  }
                ].map(item => {
                  const val = result.behaviourScores?.[item.key] ?? 0;
                  return (
                    <div key={item.key} style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', borderLeft: '3px solid #0f2537' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0f2537' }}>{item.label}</strong>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f2537' }}>{val}%</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: '1.4' }}>
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Authoritative Six-Metric Habit Shift card */}
            <div>
              <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '18px 20px',
                backgroundColor: 'var(--bg-white)',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f2537', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  How Your Habits Changed
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 14px 0' }}>
                  Comparing your choices from your first check to your final check.
                </p>

                <div className="habit-shift-grid" style={{ gridTemplateColumns: '1fr', gap: '8px', marginTop: 0 }}>
                  {[
                    { key: 'recognition', label: 'Spotting Dangers' },
                    { key: 'signalIdentification', label: 'Spotting Fake Senders' },
                    { key: 'verification', label: 'Checking Before Trusting' },
                    { key: 'decisionQuality', label: 'Making Thoughtful Choices' },
                    { key: 'falsePositive', label: 'Staying Calm with Safe Messages' },
                    { key: 'unreviewedAcceptance', label: 'Not Clicking Without Checking' }
                  ].map((m) => {
                    const deltaObj = result.behaviourDelta?.[m.key];
                    const finalVal = result.behaviourScores?.[m.key] ?? 0;
                    const baseVal = deltaObj?.baseline ?? (result.baselineScores?.[m.key] ?? null);
                    const diff = deltaObj?.delta ?? (baseVal !== null ? finalVal - baseVal : null);

                    return (
                      <div key={m.key} className="habit-shift-card">
                        <div>
                          <div className="habit-shift-name">{m.label}</div>
                          <div className="habit-shift-numbers">
                            {baseVal !== null ? `${baseVal}% → ${finalVal}%` : `Final: ${finalVal}%`}
                          </div>
                        </div>
                        {diff !== null ? (
                          <div className={`habit-delta-pill ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}`}>
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f2537' }}>
                            {finalVal}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {result.deltaMessage && (
                <div className="alert alert-secondary" style={{ fontSize: '0.88rem', lineHeight: '1.45', borderLeft: '4px solid #0f2537' }}>
                  <strong style={{ color: '#0f2537' }}>What This Means:</strong> {result.deltaMessage}
                </div>
              )}
            </div>
          </div>

          {/* Critical Mistakes list */}
          {result.criticalMistakes && result.criticalMistakes.length > 0 && (
            <div className="alert alert-error" style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Decisions That Needed Extra Care:</h4>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.88rem' }}>
                {result.criticalMistakes.map((m, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Targeted Remediation & Micro-Learning Pathways */}
          <RemediationCards sessionId={result?.sessionId || session || completedHistory?._id} />

          {/* Thematic narrative thread lockup */}
          <div style={{ textAlign: 'center', margin: '32px 0 24px 0', paddingTop: '20px', borderTop: '1px dashed var(--color-border)' }}>
            <span style={{ fontSize: '0.85rem', color: '#0f2537', fontWeight: '800', textTransform: 'uppercase', display: 'block', letterSpacing: '0.08em' }}>
              Knowing the law is only the beginning.
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 12px 0' }}>
              First Check &rarr; Learning Pathways &rarr; Practice Quizzes &rarr; Final Check
            </p>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 6px 0' }}>
              &ldquo;Improvement is not about knowing every answer. It is about recognizing better decisions when they matter.&rdquo;
            </p>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e3a8a', letterSpacing: '0.05em' }}>
              Learn. Recognize. Stay Safe.
            </span>
          </div>

          {/* CTA footer */}
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
              style={{ padding: '0.85rem 2.8rem', fontWeight: '700', fontSize: '1rem' }}
            >
              Finish &amp; Go to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalAssessment;
