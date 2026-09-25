import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import RemediationCards from '../components/RemediationCards';
import { performStateTransition } from '../utils/transitionUtils';

function FinalAssessment({ user, updateProgressTrigger }) {
  const [session, setSession] = useState(null); // active session ID
  const [currentStage, setCurrentStage] = useState(null); // current Mongoose ScenarioStage
  const [currentStep, setCurrentStep] = useState('start_screen'); // start_screen, active_simulation, reveal_view, completed_summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedHistory, setCompletedHistory] = useState(null);
  const stageHeadingRef = useRef(null);
  
  // Custom mock inputs (instantly discarded)
  const [mockUserId, setMockUserId] = useState('');
  const [mockPassword, setMockPassword] = useState('');
  const [mockOtp, setMockOtp] = useState('');
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
    // Find decision that involves clicking/opening links
    const clickDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('click') || 
      d.optionText.toLowerCase().includes('open link') ||
      d.optionText.toLowerCase().includes('telegram')
    );
    if (clickDecision) {
      await handleSelectOption(clickDecision.id);
    } else {
      if (currentStage.decisions.length > 0) {
        await handleSelectOption(currentStage.decisions[currentStage.decisions.length - 1].id);
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
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
    const zipDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('run') || 
      d.optionText.toLowerCase().includes('download') ||
      d.optionText.toLowerCase().includes('extract')
    );
    const decisionId = zipDecision ? zipDecision.id : (currentStage.decisions[0] ? currentStage.decisions[0].id : '');
    await handleSelectOption(decisionId);
  };

  const handleSelectOption = async (decisionId) => {
    setSubmitting(true);
    setError('');
    try {
      const nextData = await api.submitAssessmentStep(session, currentStage.id, decisionId);

      // Clear input fields
      setMockUserId('');
      setMockPassword('');
      setMockOtp('');
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
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', maxWidth: '800px', fontFamily: 'var(--font-sans)' }}>
      {/* Accessible Live Region */}
      <div aria-live="polite" className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        {currentStage ? `Situation order ${currentStage.stageOrder}: ${currentStage.title}. ${currentStage.description}` : ''}
      </div>

      {/* Completed Session Summary Screen */}
      {currentStep === 'completed_summary' && completedHistory && (
        <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <img src="/logo/cyber-law-logo-icon.svg" alt="" style={{ height: '32px', width: 'auto' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Cyber Law Awareness Portal
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', marginTop: '10px', marginBottom: 'var(--space-sm)' }}>
            Final Assessment Completed
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.05rem', marginBottom: 'var(--space-lg)' }}>
            You have completed the final assessment with recorded results.
          </p>

          {completedHistory.behaviourScores ? (
            <div style={{
              border: '1px solid var(--color-border)',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: 'var(--space-xl)',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                Recorded Final Behavioral Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Threat Recognition</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{completedHistory.behaviourScores?.recognition ?? 0}%</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signal Identification</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{completedHistory.behaviourScores?.signalIdentification ?? 0}%</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verification Behaviour</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{completedHistory.behaviourScores?.verification ?? 0}%</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decision Quality</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{completedHistory.behaviourScores?.decisionQuality ?? 0}%</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>False Positive Control</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{completedHistory.behaviourScores?.falsePositive ?? 0}%</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unreviewed Acceptance Control</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{completedHistory.behaviourScores?.unreviewedAcceptance ?? 0}%</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              borderLeft: '4px solid var(--accent-navy)',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: 'var(--space-xl)'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>RECORDED FINAL EVALUATION</span>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: '8px 0 0 0' }}>
                Your post-learning evaluation has been recorded across six discrete behavioral dimensions.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxWidth: '380px', margin: '0 auto' }}>
            <button 
              onClick={() => { setResult(completedHistory); setCurrentStep('reveal_view'); }}
              className="btn btn-primary"
              style={{ padding: '0.8rem 1.5rem', fontWeight: '600' }}
            >
              View Full Behavioral Habits Breakdown
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              style={{ padding: '0.8rem 1.5rem' }}
            >
              Continue to Dashboard
            </button>
            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={handleStart}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Retake Assessment (New Attempt)'}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Starting a new attempt will not overwrite your historical completed records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {currentStep === 'start_screen' && (
        <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <img src="/logo/cyber-law-logo-icon.svg" alt="" style={{ height: '32px', width: 'auto' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Cyber Law Awareness Portal
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginTop: '10px', marginBottom: 'var(--space-md)' }}>
            Cyber Awareness Final Assessment
          </h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: 'var(--space-xl)' }}>
            Welcome to <strong>&ldquo;A Day in Your Digital Life&rdquo;</strong>. You will navigate multiple sequential situations (some legitimate system processes, others malicious threat indicators). Make choices to verify your judgment.
          </p>
          <div style={{ marginBottom: 'var(--space-xl)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px', display: 'inline-block', textAlign: 'left' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: 0 }}>
              "What changed between knowing and recognizing?"
            </p>
          </div>
          <p style={{ display: 'none' }} />
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
          <button 
            onClick={handleStart} 
            className="btn btn-primary" 
            style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', fontWeight: '600' }}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Begin Final Assessment'}
          </button>
        </div>
      )}

      {/* Active Simulation */}
      {currentStep === 'active_simulation' && currentStage && (
        <div key={currentStage.id} className="portal-state-progression" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            <div className="portal-assessment-stage-pill">
              <span className="stage-pill-dot" aria-hidden="true" />
              <span>FINAL ASSESSMENT: A DAY IN YOUR DIGITAL LIFE</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>
              Situation {currentStage.stageOrder} of 5
            </div>
          </div>

          {/* Thin-line progression track */}
          <div className="portal-progression-track" style={{ marginBottom: '18px' }} aria-hidden="true">
            <div 
              className="portal-progression-indicator" 
              style={{ width: `${(currentStage.stageOrder / 5) * 100}%` }}
            />
          </div>

          <h2 ref={stageHeadingRef} tabIndex="-1" style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)', outline: 'none' }}>
            {currentStage.title}
          </h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.95rem' }}>
            {currentStage.description}
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          {/* Interactive Interface Frame */}
          <div className="mock-browser-frame" style={{ marginBottom: '24px' }}>
            <div className="mock-browser-header">
              <div className="browser-dots">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="mock-browser-url">
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
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Folders</strong>
                  <ul className="mock-email-folders" style={{ padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li className="active">Inbox (1)</li>
                    <li>Sent</li>
                    <li>Spam</li>
                  </ul>
                </div>
                <div className="mock-email-body">
                  <div className="email-header-info">
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-navy)', margin: '0 0 8px 0' }}>{currentStage.mockInterfaceData.subject}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <strong>From:</strong> {currentStage.mockInterfaceData.senderName || currentStage.mockInterfaceData.from} &lt;<span style={{ color: 'var(--accent-navy)', fontWeight: '600' }}>{currentStage.mockInterfaceData.senderEmail || currentStage.mockInterfaceData.sender || currentStage.mockInterfaceData.from}</span>&gt;
                    </div>
                    {(currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp) && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <strong>Date:</strong> {currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp}
                      </div>
                    )}
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
                        style={{ fontWeight: '600' }}
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
              <div className="mock-browser-content" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-xs)' }}>
                  {currentStage.mockInterfaceData.title}
                </h3>
                <p className="text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>
                  Active Address: {currentStage.mockInterfaceData.url}
                </p>
                
                {/* Check if zip file input is needed */}
                {currentStage.mockInterfaceData.url && currentStage.mockInterfaceData.url.endsWith('.zip') ? (
                  <div style={{ maxWidth: '400px', margin: '20px auto', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <strong style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem' }}>Extract ZIP contents:</strong>
                    <form onSubmit={handleZipSubmit}>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.8rem' }}>Enter Decryption Password (if required)</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          value={mockZipPassword}
                          onChange={(e) => setMockZipPassword(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-danger" style={{ width: '100%', fontSize: '0.85rem' }} disabled={submitting}>
                        Run setup.exe
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="alert alert-success" style={{ fontSize: '0.9rem', borderLeft: '4px solid var(--color-success)', margin: 0 }}>
                    {currentStage.mockInterfaceData.bodyText || currentStage.mockInterfaceData.body}
                  </div>
                )}
              </div>
            )}

            {/* website (Normal or Cloned Web Page) */}
            {currentStage.mockInterfaceType === 'website' && (
              <div className="mock-browser-content" style={{ padding: '24px' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-navy)', margin: '0 0 4px 0' }}>{currentStage.mockInterfaceData.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Address: {currentStage.mockInterfaceData.url}</span>
                </div>

                {currentStage.mockInterfaceData.warningText && (
                  <div className="mock-scenario-note" style={{ marginBottom: '16px' }}>
                    <strong>Observation:</strong> {currentStage.mockInterfaceData.warningText}
                  </div>
                )}

                {/* If it requires credentials form input */}
                {currentStage.mockInterfaceData.requiresCredentials ? (
                  <div style={{ maxWidth: '400px', margin: '20px auto', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <form onSubmit={handleLoginSubmit}>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Netbanking User ID</label>
                        <input type="text" className="form-control" placeholder="UserID" required value={mockUserId} onChange={e => setMockUserId(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Netbanking Password</label>
                        <input type="password" className="form-control" placeholder="Password" required value={mockPassword} onChange={e => setMockPassword(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-danger" style={{ width: '100%', fontWeight: '600' }} disabled={submitting}>
                        Submit Secure Payment
                      </button>
                    </form>
                  </div>
                ) : (
                  currentStage.mockInterfaceData.bodyText && (
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {currentStage.mockInterfaceData.bodyText}
                    </p>
                  )
                )}
              </div>
            )}

            {/* QR Code Scan Mockup */}
            {currentStage.mockInterfaceType === 'qr_code' && (
              <div className="mock-browser-content" style={{ textAlign: 'center', padding: '24px' }}>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-xs)' }}>
                  {currentStage.mockInterfaceData.title}
                </h3>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-error)', marginBottom: 'var(--space-md)' }}>
                  Amount due: {currentStage.mockInterfaceData.amount}
                </p>

                {/* QR Symbol */}
                <div style={{
                  width: '180px',
                  height: '180px',
                  border: '3px solid black',
                  margin: '0 auto var(--space-md) auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', width: '140px', height: '140px' }}>
                    {[...Array(25)].map((_, i) => (
                      <div key={i} style={{ backgroundColor: (i % 2 === 0 || i % 5 === 0) ? 'black' : 'transparent' }} />
                    ))}
                  </div>
                </div>

                <p className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                  {currentStage.mockInterfaceData.instructions}
                </p>
              </div>
            )}

            {/* SMS Message Mockup */}
            {currentStage.mockInterfaceType === 'sms' && (
              <div style={{ maxWidth: '340px', width: '100%', margin: '30px auto', backgroundColor: '#f1f5f9', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>
                  SMS from: {currentStage.mockInterfaceData.senderNumber || currentStage.mockInterfaceData.sender}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ alignSelf: 'flex-start', backgroundColor: '#fff', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', maxWidth: '88%', fontSize: '0.9rem', lineHeight: '1.45', color: 'var(--accent-navy)', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', boxSizing: 'border-box' }}>
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
              <div style={{ maxWidth: '320px', margin: '30px auto', backgroundColor: '#0f172a', color: '#fff', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#94a3b8' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: '#fff' }}>{currentStage.mockInterfaceData.callerName || currentStage.mockInterfaceData.callerLabel || 'Incoming Call'}</h3>
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
                      style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.15s ease' }}
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
                      style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.15s ease' }}
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
              <div style={{ maxWidth: '340px', margin: '30px auto', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ backgroundColor: 'var(--accent-navy)', color: '#fff', padding: '12px 16px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Secure UPI Gateway Request
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Requested by</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '16px' }}>{currentStage.mockInterfaceData.merchantName}</strong>
                  
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

            {/* Chat Sandbox Messenger Simulation */}
            {(currentStage.mockInterfaceType === 'chat' || currentStage.mockInterfaceType === 'messaging') && (
              <div style={{ maxWidth: '400px', width: '100%', margin: '30px auto', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#efeae2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: 'var(--accent-navy)', color: '#fff', padding: '10px 16px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>{currentStage.mockInterfaceData.sender || currentStage.mockInterfaceData.callerID || currentStage.mockInterfaceData.platform || 'Direct Message'}</span>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ alignSelf: 'flex-start', backgroundColor: '#fff', padding: '10px 12px', borderRadius: '0 8px 8px 8px', maxWidth: '88%', fontSize: '0.85rem', lineHeight: '1.45', color: 'var(--accent-navy)', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
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
              <div style={{ maxWidth: '440px', margin: '30px auto', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', borderLeft: '4px solid var(--accent-navy)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-navy-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-navy)' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--accent-navy)' }}>{currentStage.mockInterfaceData.title}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentStage.mockInterfaceData.dateString || currentStage.mockInterfaceData.timestamp || 'System Alert'}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {currentStage.mockInterfaceData.body || currentStage.mockInterfaceData.message || currentStage.mockInterfaceData.bodyText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Panels */}
          <div className="editorial-card" style={{ borderTop: '2px solid var(--accent-navy)', marginTop: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>Select Your Move:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {currentStage.decisions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className="btn btn-secondary"
                  style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '12px 16px', lineHeight: '1.4' }}
                  disabled={submitting}
                >
                  {opt.optionText}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Report View */}
      {currentStep === 'reveal_view' && result && (
        <div className="reveal-pane portal-state-reveal-down" style={{ border: '2px solid var(--accent-navy)' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
            Final Assessment Report
          </h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '1.05rem' }}>
            Congratulations on completing the <strong>&ldquo;A Day in Your Digital Life&rdquo;</strong> branching assessment. We have compiled your decisions and compared them with your baseline score.
          </p>

          <div style={{ marginBottom: 'var(--space-lg)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px' }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: '0 0 8px 0', fontWeight: 'bold' }}>
              "You weren’t being tested on whether you could guess what was a scam."
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
              "You were being observed on how you make everyday digital decisions."
            </p>
          </div>

          {/* Scores grid split */}
          <div className="reveal-layout-grid">
            {/* Left side: Observed Digital Habits breakdown */}
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>Observed Digital Habits Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <strong>What You Recognized (Threat Recognition):</strong> {result.behaviourScores?.recognition || 0}%
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Recognition of deceptive prompts and urgency cues across situations.</div>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <strong>Where You Verified (Verification Behaviour):</strong> {result.behaviourScores?.verification || 0}%
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Independent verification through official channels before acting.</div>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <strong>Decision Quality (Choice Soundness):</strong> {result.behaviourScores?.decisionQuality || 0}%
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Overall quality and soundness of choices across all everyday stages.</div>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '3px solid var(--accent-navy)' }}>
                  <strong>Signal Identification (Deception Clues):</strong> {result.behaviourScores?.signalIdentification || 0}%
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Detection of specific indicators such as domain mismatches and payment traps.</div>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '3px solid var(--color-warning)' }}>
                  <strong>Unreviewed Acceptance Control:</strong> {result.behaviourScores?.unreviewedAcceptance ?? 0}%
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Occasions where permissions or requests were approved without checking ({result.unreviewedAcceptancePenaltyPoints || 0} penalty point(s)).
                  </div>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', borderLeft: '3px solid var(--color-warning)' }}>
                  <strong>False Positive Behaviour (Over-Reporting Control):</strong> {result.behaviourScores?.falsePositive ?? 0}%
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Occasions where authentic notices or system patches were treated as threats ({result.falsePositivePenaltyPoints || 0} penalty point(s)).
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Authoritative Six-Metric Habit Shift card */}
            <div>
              <div style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-md)',
                backgroundColor: 'var(--accent-navy-light)',
                marginBottom: 'var(--space-md)'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Behavioral Habit Shift (Baseline &rarr; Final)
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 12px 0' }}>
                  Authoritative dimensional comparison of observed habits.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'recognition', label: 'Threat Recognition' },
                    { key: 'signalIdentification', label: 'Signal Identification' },
                    { key: 'verification', label: 'Verification Behaviour' },
                    { key: 'decisionQuality', label: 'Decision Quality' },
                    { key: 'falsePositive', label: 'False Positive Control' },
                    { key: 'unreviewedAcceptance', label: 'Unreviewed Acceptance Control' }
                  ].map((m) => {
                    const deltaObj = result.behaviourDelta?.[m.key];
                    const finalVal = result.behaviourScores?.[m.key] ?? 0;
                    const baseVal = deltaObj?.baseline ?? (result.baselineScores?.[m.key] ?? null);
                    const diff = deltaObj?.delta ?? (baseVal !== null ? finalVal - baseVal : null);

                    return (
                      <div key={m.key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '4px'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>{m.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {baseVal !== null ? `${baseVal}% → ${finalVal}%` : `Final: ${finalVal}%`}
                          </div>
                        </div>
                        {diff !== null ? (
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: diff > 0 ? 'rgba(40, 167, 69, 0.1)' : diff < 0 ? 'rgba(220, 53, 69, 0.1)' : 'var(--bg-secondary)',
                            color: diff > 0 ? 'var(--color-success)' : diff < 0 ? 'var(--color-error)' : 'var(--text-muted)'
                          }}>
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-navy)' }}>
                            {finalVal}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {result.deltaMessage && (
                <div className="alert alert-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4', borderLeft: '4px solid var(--accent-navy)' }}>
                  <strong>Observed Shift Summary:</strong> {result.deltaMessage}
                </div>
              )}
            </div>
          </div>

          {/* Critical Mistakes list */}
          {result.criticalMistakes && result.criticalMistakes.length > 0 && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
              <h4>Critical Mistakes:</h4>
              <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem' }}>
                {result.criticalMistakes.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Targeted Remediation & Micro-Learning Pathways */}
          <RemediationCards sessionId={result?.sessionId || session || completedHistory?._id} />

          {/* Thematic narrative thread lockup */}
          <div style={{ textAlign: 'center', margin: 'var(--space-lg) 0', paddingTop: '16px', borderTop: '1px dashed var(--color-border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
              Knowing the law is only the beginning.
            </span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 12px 0' }}>
              Baseline &rarr; Learning &rarr; Practice &rarr; Final
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 4px 0' }}>
              "Improvement is not about knowing every answer. It is about recognizing better decisions when they matter."
            </p>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-navy)', letterSpacing: '0.5px' }}>
              Learn. Recognize. Stay Safe.
            </span>
          </div>

          {/* CTA footer */}
          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
              style={{ padding: '0.8rem 2.5rem', fontWeight: '600' }}
            >
              Finish & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinalAssessment;
