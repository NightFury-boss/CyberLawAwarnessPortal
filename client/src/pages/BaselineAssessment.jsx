import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function BaselineAssessment({ user, updateProgressTrigger }) {
  const [session, setSession] = useState(null); // active session ID
  const [currentStage, setCurrentStage] = useState(null); // active ScenarioStage
  const [currentStep, setCurrentStep] = useState('start_screen'); // start_screen, active_simulation, reveal_view
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom mock inputs (instantly discarded)
  const [mockUserId, setMockUserId] = useState('');
  const [mockPassword, setMockPassword] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.startAssessment('baseline');
      setSession(data.sessionId);
      setCurrentStage(data.stage);
      setCurrentStep('active_simulation');
    } catch (err) {
      setError(err.message || 'Failed to start baseline assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineClick = async () => {
    // Find decision that involves clicking/opening links
    const clickDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('click') || 
      d.optionText.toLowerCase().includes('open link') ||
      d.optionText.toLowerCase().includes('verify account')
    );
    if (clickDecision) {
      await submitStep(clickDecision.id);
    } else {
      // Fallback
      if (currentStage.decisions.length > 0) {
        await submitStep(currentStage.decisions[currentStage.decisions.length - 1].id);
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // Locate the decision for entering credentials
    const loginDecision = currentStage.decisions.find(d => 
      d.optionText.toLowerCase().includes('enter simulated login') || 
      d.optionText.toLowerCase().includes('credentials') ||
      d.optionText.toLowerCase().includes('password')
    );
    const decisionId = loginDecision ? loginDecision.id : (currentStage.decisions[0] ? currentStage.decisions[0].id : '');
    await submitStep(decisionId);
  };

  const submitStep = async (decisionId) => {
    setSubmitting(true);
    setError('');
    try {
      const nextData = await api.submitAssessmentStep(session, currentStage.id, decisionId);
      
      if (nextData.isCompleted) {
        setResult(nextData);
        setCurrentStep('reveal_view');
        if (updateProgressTrigger) updateProgressTrigger();
      } else {
        setCurrentStage(nextData.stage);
        setCurrentStep('active_simulation');
        // Reset inputs
        setMockUserId('');
        setMockPassword('');
        setMockOtp('');
      }
    } catch (err) {
      setError(err.message || 'Error submitting response step.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', maxWidth: '800px', fontFamily: 'var(--font-sans)' }}>
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
            Your Digital Day
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent-navy)', marginBottom: '8px' }}>
            See how you navigate everyday digital situations.
          </p>
          <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: 'var(--space-xl)' }}>
            You’ll encounter a few ordinary online situations. Respond as you normally would.
          </p>
          <div style={{ marginBottom: 'var(--space-xl)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px', display: 'inline-block', textAlign: 'left' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: 0 }}>
              "Knowing the rules is useful. The assessment looks at what you do when the situation feels real."
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
            {loading ? 'Starting...' : 'Begin Assessment'}
          </button>
        </div>
      )}

      {/* Active Simulation */}
      {currentStep === 'active_simulation' && currentStage && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            <span>YOUR DIGITAL DAY: BASELINE</span>
            <span>Situation Order: {currentStage.stageOrder}</span>
          </div>

          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
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
                {currentStage.mockInterfaceType === 'email' && 'https://mail.campus-connect.in/inbox'}
                {currentStage.mockInterfaceType === 'website' && (currentStage.mockInterfaceData.url || 'http://verify-campusconnect.in/profile')}
                {currentStage.mockInterfaceType === 'notification' && 'chrome://settings/security'}
                {currentStage.mockInterfaceType === 'sms' && 'Mobile Notification: SMS Inbox'}
                {currentStage.mockInterfaceType === 'phone_call' && 'Incoming Audio Call...'}
                {currentStage.mockInterfaceType === 'checkout' && 'https://upi-gateway.in/secure-checkout'}
              </div>
            </div>

            {/* Email Inbox Simulation */}
            {currentStage.mockInterfaceType === 'email' && (
              <div className="mock-email-container" style={{ display: 'flex', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: '0 0 4px 4px' }}>
                <div className="mock-email-sidebar" style={{ width: '150px', borderRight: '1px solid var(--color-border)', padding: '12px', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mailboxes</strong>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    <li style={{ padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', fontWeight: '600' }}>Inbox (1)</li>
                    <li style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>Sent</li>
                    <li style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>Spam</li>
                  </ul>
                </div>
                <div className="mock-email-body" style={{ flex: 1, padding: '20px' }}>
                  <div className="email-header-info" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-navy)', margin: '0 0 8px 0' }}>{currentStage.mockInterfaceData.subject}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <strong>From:</strong> {currentStage.mockInterfaceData.senderName} &lt;<span style={{ color: 'var(--color-error)', fontWeight: '600' }}>{currentStage.mockInterfaceData.senderEmail || currentStage.mockInterfaceData.sender}</span>&gt;
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Date:</strong> {currentStage.mockInterfaceData.dateString}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    {currentStage.mockInterfaceData.body}
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <button 
                      onClick={handleInlineClick} 
                      className="btn btn-danger" 
                      style={{ fontWeight: '600' }}
                    >
                      {currentStage.mockInterfaceData.ctaText || 'Verify Identity'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Website Cloned Portal Simulation */}
            {currentStage.mockInterfaceType === 'website' && (
              <div className="mock-browser-content" style={{ maxWidth: '440px', margin: '30px auto', padding: '20px' }}>
                <div className="editorial-card" style={{ padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-navy)', margin: '0 0 4px 0' }}>
                      {currentStage.mockInterfaceData.title}
                    </h3>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Verification Portal</span>
                  </div>

                  {currentStage.mockInterfaceData.warningText && (
                    <div className="alert alert-error" style={{ fontSize: '0.75rem', padding: '8px', marginBottom: '16px' }}>
                      Warning: {currentStage.mockInterfaceData.warningText}
                    </div>
                  )}

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
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currentStage.mockInterfaceData.dateString || 'System Alert'}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                      {currentStage.mockInterfaceData.body}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SMS Message Mockup */}
            {currentStage.mockInterfaceType === 'sms' && (
              <div style={{ maxWidth: '340px', margin: '30px auto', backgroundColor: '#f1f5f9', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>
                  SMS from: {currentStage.mockInterfaceData.senderNumber || currentStage.mockInterfaceData.sender}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ alignSelf: 'flex-start', backgroundColor: '#fff', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', maxWidth: '85%', fontSize: '0.9rem', lineHeight: '1.4', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    {currentStage.mockInterfaceData.body}
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
                      {currentStage.mockInterfaceData.dateString}
                    </span>
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
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: '#fff' }}>{currentStage.mockInterfaceData.callerName || 'Incoming Call'}</h3>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '20px' }}>{currentStage.mockInterfaceData.callerNumber}</span>
                
                <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '12px', backgroundColor: '#1e293b', fontSize: '0.85rem', lineHeight: '1.4', fontStyle: 'italic', color: '#cbd5e1', marginBottom: '24px', textAlign: 'left' }}>
                  {currentStage.mockInterfaceData.bodyText || currentStage.mockInterfaceData.body}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Decline</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Accept</span>
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
                    <div className="alert alert-error" style={{ fontSize: '0.8rem', padding: '10px', textAlign: 'left', marginBottom: '0' }}>
                      <strong>Important:</strong> {currentStage.mockInterfaceData.warningText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Decision/Options Panel */}
          <div className="editorial-card" style={{ borderTop: '2px solid var(--accent-navy)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>Select Your Immediate Action:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {currentStage.decisions
                .filter(d => {
                  if (currentStage.mockInterfaceType === 'email' && (d.optionText.toLowerCase().includes('click') || d.optionText.toLowerCase().includes('open link') || d.optionText.toLowerCase().includes('verify account'))) {
                    return false;
                  }
                  if (currentStage.mockInterfaceType === 'website' && (d.optionText.toLowerCase().includes('enter simulated login') || d.optionText.toLowerCase().includes('credentials'))) {
                    return false;
                  }
                  return true;
                })
                .map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => submitStep(opt.id)}
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

      {/* Reveal Screen */}
      {currentStep === 'reveal_view' && result && (
        <div className="reveal-pane" style={{ border: '2px solid var(--accent-navy)' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: '4px' }}>
            YOUR DIGITAL DAY IS COMPLETE
          </h2>
          <p className="text-muted" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
            Baseline Assessment Result Summary
          </p>
          
          <div style={{ marginBottom: 'var(--space-lg)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: '0 0 8px 0', fontWeight: 'bold' }}>
              "You weren’t being tested on whether you could guess what was a scam."
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
              "You were being observed on how you make everyday digital decisions."
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 'var(--space-xl)',
            marginBottom: 'var(--space-xl)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>Ecosystem Feedback & Observations</h4>
              <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>What you noticed:</strong> Verified URL domain identifiers on official security links.
                </li>
                <li>
                  <strong>What you overlooked:</strong> Bypassed warning prompts on unencrypted HTTP cloned verification fields.
                </li>
                <li>
                  <strong>Where you verified:</strong> Contacted official support agencies instead of disclosing OTP triggers.
                </li>
                <li>
                  <strong>Where you accepted without checking:</strong> Dismissed automatic background update notifications.
                </li>
                <li>
                  <strong>Where you over-reported:</strong> Flagged normal browser updates as threat vectors.
                </li>
                <li>
                  <strong>Where you responded safely:</strong> Refused UPI money request PIN authorizations.
                </li>
              </ul>
            </div>

            <div>
              <div style={{
                borderLeft: '4px solid var(--accent-navy)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                backgroundColor: 'var(--accent-navy-light)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>YOUR DIGITAL DAY SCORE</span>
                <div style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{result.score}/100</div>
                <div style={{ fontWeight: '600', color: result.score >= 75 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  Level: {result.awarenessLevel}
                </div>
              </div>
            </div>
          </div>

          {result.criticalMistakes && result.criticalMistakes.length > 0 && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
              <h4>Critical Mistakes Made:</h4>
              <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem' }}>
                {result.criticalMistakes.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--accent-navy-light)',
            borderRadius: '4px',
            marginBottom: 'var(--space-lg)'
          }}>
            <h4 style={{ color: 'var(--accent-navy)', marginBottom: 'var(--space-xs)' }}>Recommended Learning Modules</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Based on your simulation decisions, we recommend visiting these learning modules to close your safety gaps:
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={() => navigate('/crimes')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                Phishing Detection Module
              </button>
              <button onClick={() => navigate('/prevention')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                Safe URL Verification
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: 'var(--space-lg) 0', paddingTop: '16px', borderTop: '1px dashed var(--color-border)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 4px 0' }}>
              "Improvement is not about knowing every answer. It is about recognizing better decisions when they matter."
            </p>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-navy)', letterSpacing: '0.5px' }}>
              Learn. Recognize. Stay Safe.
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-primary"
              style={{ padding: '0.8rem 2rem', fontWeight: '600' }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BaselineAssessment;
