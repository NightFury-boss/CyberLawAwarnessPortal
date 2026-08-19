import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function FinalAssessment({ user, updateProgressTrigger }) {
  const [session, setSession] = useState(null); // active session ID
  const [currentStage, setCurrentStage] = useState(null); // current Mongoose ScenarioStage
  const [currentStep, setCurrentStep] = useState('start_screen'); // start_screen, active_simulation, reveal_view
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom mock inputs (instantly discarded)
  const [mockZipPassword, setMockZipPassword] = useState('');
  const [mockUpiPin, setMockUpiPin] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog/Explanation overlay between steps
  const [stepFeedback, setStepFeedback] = useState('');

  const navigate = useNavigate();

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.startAssessment('final');
      setSession(data.sessionId);
      setCurrentStage(data.stage);
      setCurrentStep('active_simulation');
      setStepFeedback('');
    } catch (err) {
      setError(err.message || 'Failed to start final assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (decisionId) => {
    setSubmitting(true);
    setError('');
    try {
      const nextData = await api.submitAssessmentStep(session, currentStage.id, decisionId);
      
      // Cache feedback explanation
      setStepFeedback(nextData.explanation || 'Action submitted.');

      // Clear input fields
      setMockZipPassword('');
      setMockUpiPin('');
      setMockOtp('');

      if (nextData.isCompleted) {
        setResult(nextData);
        setCurrentStep('reveal_view');
        if (updateProgressTrigger) updateProgressTrigger();
      } else {
        // Move to next adaptive branch stage returned by backend
        setCurrentStage(nextData.stage);
      }
    } catch (err) {
      setError(err.message || 'Error submitting choice step.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}>
      {/* Start Screen */}
      {currentStep === 'start_screen' && (
        <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginTop: '10px', marginBottom: 'var(--space-md)' }}>
            Cyber Awareness Final Assessment
          </h1>
          <p className="text-muted" style={{ fontSize: '1.05rem', marginBottom: 'var(--space-xl)' }}>
            Welcome to **"A Day in Your Digital Life"**. You will navigate multiple sequential situations (some legitimate system processes, others malicious threat indicators). Make choices to verify your judgment.
          </p>
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

      {currentStep === 'active_simulation' && currentStage && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            <span>FINAL ASSESSMENT: A DAY IN YOUR DIGITAL LIFE</span>
            <span>Situation Order: {currentStage.stageOrder}</span>
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-md)' }}>
            {currentStage.title}
          </h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
            {currentStage.description}
          </p>

          {/* Feedback Box showing analysis of previous action */}
          {stepFeedback && (
            <div className="alert alert-success" style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
              💡 <strong>Previous Choice Analysis:</strong> {stepFeedback}
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          {/* Interactive Interface Frame */}
          <div className="mock-browser-frame">
            <div className="mock-browser-header">
              <div className="browser-dots">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="mock-browser-url">
                {currentStage.mockInterfaceType === 'email' && 'https://mail.campus-connect.in/inbox'}
                {currentStage.mockInterfaceType === 'browser' && 'chrome://settings/help'}
                {currentStage.mockInterfaceType === 'website' && 'http://free-antivirus-scan.in/alert'}
                {currentStage.mockInterfaceType === 'qr_code' && 'https://tickets-escrow.in/pay/3012'}
              </div>
            </div>

            {/* Render 1: Email Recruiter ZIP */}
            {currentStage.mockInterfaceType === 'email' && (
              <div className="mock-email-container">
                <div className="mock-email-sidebar">
                  <ul className="mock-email-folders">
                    <li className="active">Inbox</li>
                    <li>Sent</li>
                    <li>Spam</li>
                  </ul>
                </div>
                <div className="mock-email-body">
                  <div className="email-header-info">
                    <h2>{currentStage.mockInterfaceData.subject}</h2>
                    <div className="email-meta-line">
                      <strong>From:</strong> {currentStage.mockInterfaceData.senderName} &lt;<span style={{ color: 'var(--color-error)' }}>{currentStage.mockInterfaceData.senderEmail}</span>&gt;
                    </div>
                  </div>
                  <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
                    {currentStage.mockInterfaceData.body}
                  </p>
                  
                  <div className="email-attachment-box">
                    <span>📁</span>
                    <div>
                      <strong>{currentStage.mockInterfaceData.attachmentName}</strong>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>Size: 242 KB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Render 2: Legitimate browser patch (Mixed Event!) */}
            {currentStage.mockInterfaceType === 'browser' && (
              <div className="mock-browser-content" style={{ padding: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-xs)' }}>
                  {currentStage.mockInterfaceData.title}
                </h3>
                <p className="text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>
                  Active Address: {currentStage.mockInterfaceData.url}
                </p>
                <div className="alert alert-success" style={{ fontSize: '0.9rem', borderLeft: '4px solid var(--color-success)' }}>
                  🛡️ {currentStage.mockInterfaceData.bodyText}
                </div>
              </div>
            )}

            {/* Render 3: Scareware suspicious prompt */}
            {currentStage.mockInterfaceType === 'website' && (
              <div className="mock-browser-content" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.6rem', color: 'var(--color-error)', marginBottom: 'var(--space-xs)' }}>
                  ⚠️ {currentStage.mockInterfaceData.title}
                </h3>
                <p className="text-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>
                  Active Domain: {currentStage.mockInterfaceData.url}
                </p>
                <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
                  {currentStage.mockInterfaceData.bodyText}
                </p>
              </div>
            )}

            {/* Render 4: QR Code Payment */}
            {currentStage.mockInterfaceType === 'qr_code' && (
              <div className="mock-browser-content" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
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
        <div className="reveal-pane" style={{ border: '2px solid var(--accent-navy)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
            Final Assessment Report
          </h2>
          <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '1.05rem' }}>
            Congratulations on completing the **"A Day in Your Digital Life"** branching assessment. We have compiled your decisions and compared them with your baseline score.
          </p>

          {result.deltaMessage && (
            <div className="alert alert-success" style={{ padding: 'var(--space-md)', fontSize: '1.1rem', borderLeft: '4px solid var(--color-success)', marginBottom: 'var(--space-lg)' }}>
              📈 <strong>Learning Outcome Progress:</strong><br />
              {result.deltaMessage}
            </div>
          )}

          {/* Scores grid split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            {/* Left side: Category progress bars */}
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)' }}>🛡️ Category Defense Performance</h3>
              <div className="category-bars">
                {Object.entries(result.categoryScores || {}).map(([cat, score]) => (
                  <div key={cat} className="category-bar-row">
                    <div className="category-bar-label">
                      <span>{cat}</span>
                      <strong>{score}%</strong>
                    </div>
                    <div className="category-bar-track">
                      <div
                        className={`category-bar-fill ${score >= 75 ? 'success' : (score < 50 ? 'warning' : '')}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Overall stats card */}
            <div>
              <div style={{
                border: '1px solid var(--color-border)',
                padding: 'var(--space-lg)',
                borderRadius: '4px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-secondary)',
                marginBottom: 'var(--space-md)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>FINAL ASSESSMENT SCORE</span>
                <div style={{ fontSize: '3.5rem', fontWeight: '700', color: 'var(--accent-navy)' }}>{result.score}/100</div>
                <div style={{ fontWeight: '600', color: 'var(--accent-navy)', fontSize: '1.1rem', margin: '4px 0' }}>
                  {result.awarenessLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Mistakes list */}
          {result.criticalMistakes && result.criticalMistakes.length > 0 && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
              <h4>⚠️ Critical Mistakes Made:</h4>
              <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem' }}>
                {result.criticalMistakes.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

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
