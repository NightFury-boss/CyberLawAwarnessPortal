import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function BaselineAssessment({ user, updateProgressTrigger }) {
  const [session, setSession] = useState(null); // active session object
  const [currentStage, setCurrentStage] = useState(null); // active ScenarioStage
  const [currentStep, setCurrentStep] = useState('start_screen'); // start_screen, email_view, login_view, reveal_view
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
      setCurrentStep('email_view');
    } catch (err) {
      setError(err.message || 'Failed to start baseline assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decisionId) => {
    // If user clicks mock email warning link, transition locally to mock portal form
    if (decisionId === 'dec_base_click') {
      setCurrentStep('login_view');
    } else {
      // Direct submit for Inspect/Report or Delete/Ignore
      await submitStep(decisionId);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // Evaluating simulated inputs and discarding them instantly
    // We only send decisionId and sessionId to the backend. No credentials are saved.
    const loginDecision = currentStage.decisions.find(d => d.optionText.includes('Enter simulated login'));
    const decisionId = loginDecision ? loginDecision.id : 'dec_base_click'; // fallback
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
        // Advanced to next stage (in baseline, this would load the login portal stage)
        setCurrentStage(nextData.stage);
        setCurrentStep(nextData.stage.mockInterfaceType === 'website' ? 'login_view' : 'email_view');
      }
    } catch (err) {
      setError(err.message || 'Error submitting response step.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}>
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
            Cyber Awareness Baseline
          </h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: 'var(--space-xl)' }}>
            This short interactive experience helps establish your current cyber-awareness habits. You will navigate a realistic scenario, and receive a personalized learning report afterward.
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

      {currentStep !== 'reveal_view' && currentStep !== 'start_screen' && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--space-xs)' }}>
            Cyber Security Baseline Assessment
          </h1>
          <p className="text-muted">
            Inspect indicators in headers, domains, and certificates before deciding.
          </p>
          {error && <div className="alert alert-error" style={{ marginTop: 'var(--space-md)' }}>{error}</div>}
        </div>
      )}

      {/* Email Inbox Simulation */}
      {currentStep === 'email_view' && currentStage && (
        <div>
          <div className="mock-browser-frame">
            <div className="mock-browser-header">
              <div className="browser-dots">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="mock-browser-url">https://mail.campus-connect.in/inbox</div>
            </div>
            
            <div className="mock-email-container">
              <div className="mock-email-sidebar">
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>Mail Folders</h4>
                <ul className="mock-email-folders">
                  <li className="active">Inbox (1)</li>
                  <li>Drafts</li>
                  <li>Sent</li>
                  <li>Spam</li>
                </ul>
              </div>

              <div className="mock-email-body">
                <div className="email-header-info">
                  <h2>{currentStage.mockInterfaceData.subject}</h2>
                  <div className="email-meta-line">
                    <strong>From:</strong> {currentStage.mockInterfaceData.senderName} &lt;<span style={{ color: 'var(--color-error)', fontWeight: '600' }}>{currentStage.mockInterfaceData.senderEmail}</span>&gt;
                  </div>
                  <div className="email-meta-line">
                    <strong>Date:</strong> {currentStage.mockInterfaceData.dateString}
                  </div>
                </div>

                <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {currentStage.mockInterfaceData.body}
                </div>

                <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md) 0' }}>
                  <button 
                    onClick={() => handleDecision('dec_base_click')} 
                    className="btn btn-danger" 
                    style={{ fontWeight: '600' }}
                  >
                    {currentStage.mockInterfaceData.ctaText}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="editorial-card" style={{ borderTop: '2px solid var(--accent-navy)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>Select Your Immediate Action:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {currentStage.decisions
                .filter(d => d.id !== 'dec_base_click') // Click option is handled via button
                .map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleDecision(opt.id)}
                    className="btn btn-secondary"
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                    disabled={submitting}
                  >
                    {opt.optionText}
                  </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cloned Mock Login Portal */}
      {currentStep === 'login_view' && currentStage && (
        <div>
          <div className="mock-browser-frame">
            <div className="mock-browser-header">
              <div className="browser-dots">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="mock-browser-url" style={{ color: 'var(--color-error)' }}>
                {currentStage.mockInterfaceData.url}
              </div>
            </div>

            <div className="mock-browser-content" style={{ maxWidth: '400px', margin: '40px auto' }}>
              <div className="editorial-card" style={{ padding: 'var(--space-lg)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-navy)' }}>
                    {currentStage.mockInterfaceData.title}
                  </h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Verification Portal</span>
                </div>

                <div className="alert alert-error" style={{ fontSize: '0.75rem', padding: '8px' }}>
                  Warning: {currentStage.mockInterfaceData.warningText}
                </div>

                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label>Account ID / Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. rohan99"
                      value={mockUserId}
                      onChange={(e) => setMockUserId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={mockPassword}
                      onChange={(e) => setMockPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>SMS Verification OTP</label>
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
                    {submitting ? 'Submitting...' : 'Verify & Unlock Account'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Escape Option */}
          <div className="editorial-card" style={{ borderTop: '2px solid var(--accent-navy)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>Review Options:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {currentStage.decisions
                .filter(d => !d.optionText.includes('Enter simulated login'))
                .map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => submitStep(opt.id)}
                    className="btn btn-secondary"
                    style={{ textAlign: 'left', justifyContent: 'flex-start' }}
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
          <h3>This was a Cyber Awareness Simulation.</h3>
          <div style={{ marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: 0 }}>
              "Now you know where your awareness begins."
            </p>
          </div>
          
          <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>
            {result.score >= 70 ? (
              <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                Excellent defense reflex! You recognized the indicators of a spoof communication.
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                Many users click warning links when confronted with fake urgency. Let\'s study how this attack was put together.
              </span>
            )}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 'var(--space-xl)',
            marginBottom: 'var(--space-xl)'
          }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-xs)' }}>Incident Breakdown</h4>
              <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <li style={{ marginBottom: '6px' }}>
                  <strong>The Urgency Trigger:</strong> The email threatened account suspension in <em>2 hours</em>. Attacking entities create artificial deadlines to override standard caution checks.
                </li>
                <li style={{ marginBottom: '6px' }}>
                  <strong>The Spoofed Domain:</strong> The sender was <code>support-alert@bharatconnect-verify.in</code>. Official domains in India end in <code>.gov.in</code> or <code>.nic.in</code>. Scammers buy cheap domains containing words like "verify" to fool targets.
                </li>
                <li style={{ marginBottom: '6px' }}>
                  <strong>The Unsecured Login:</strong> The verification link loaded an HTTP page. Banks and official service providers strictly mandate secure HTTPS sockets to encrypt payload packets.
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
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>BASELINE AWARENESS SCORE</span>
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
