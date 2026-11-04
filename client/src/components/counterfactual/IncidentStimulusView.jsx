import React from 'react';

/**
 * IncidentStimulusView
 * 
 * Renders static, fictional visual mockups of threat stimuli.
 * 
 * STRICT SAFETY & PRIVACY INVARIANTS:
 * - All stimuli are static educational mockups.
 * - ZERO interactive text input or textarea elements (avoids simulated input traps).
 * - All URLs use .example.invalid; phone numbers use +91-00000-0000X.
 * - QR codes display explicit non-functional watermarks.
 * - No real government insignia, official seals, or active payment destinations.
 */
export default function IncidentStimulusView({ incidentContext }) {
  if (!incidentContext) return null;

  const { targetVector, mockInterfaceType, mockInterfaceData } = incidentContext;

  return (
    <div className="cf-stimulus-container" aria-label="Simulated Threat Stimulus Mockup">
      <div className="cf-stimulus-header">
        <span className="cf-stimulus-badge">Simulated Incident Stimulus</span>
        <span className="cf-stimulus-vector">{targetVector}</span>
      </div>

      <div className="cf-stimulus-body">
        {/* Type 1: Simulated SMS Message */}
        {mockInterfaceType === 'sms' && (
          <div className="cf-mock-sms-shell">
            <div className="cf-mock-sms-topbar">
              <span className="cf-mock-sms-sender">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {mockInterfaceData.senderId}
              </span>
              <span className="cf-mock-sms-time">{mockInterfaceData.timestamp}</span>
            </div>
            <div className="cf-mock-sms-bubble">
              <p className="cf-mock-sms-text">{mockInterfaceData.messageBody}</p>
            </div>
            {mockInterfaceData.warningIndicator && (
              <div className="cf-stimulus-anomaly-box">
                <span className="cf-anomaly-label">Anomalous Signals:</span> {mockInterfaceData.warningIndicator}
              </div>
            )}
          </div>
        )}

        {/* Type 2: Reverse-QR Collect Request / Classifieds Chat */}
        {mockInterfaceType === 'qr_code' && (
          <div className="cf-mock-chat-shell">
            <div className="cf-mock-chat-header">
              <div className="cf-mock-avatar">M</div>
              <div className="cf-mock-chat-info">
                <span className="cf-mock-chat-name">{mockInterfaceData.buyerProfile}</span>
                <span className="cf-mock-chat-sender">{mockInterfaceData.senderId}</span>
              </div>
              <div className="cf-mock-price-pill">Agreed Price: {mockInterfaceData.itemPrice}</div>
            </div>

            <div className="cf-mock-chat-bubble">
              <p>{mockInterfaceData.messageBody}</p>
            </div>

            <div className="cf-mock-qr-card">
              <div className="cf-qr-placeholder-box">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="cf-qr-icon">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  <line x1="17" y1="7" x2="17.01" y2="7"></line>
                  <line x1="7" y1="17" x2="7.01" y2="17"></line>
                  <line x1="17" y1="17" x2="17.01" y2="17"></line>
                </svg>
                <div className="cf-qr-watermark-pill">NON-FUNCTIONAL SIMULATION — DO NOT SCAN</div>
              </div>
              <span className="cf-qr-caption">Simulated Reverse-Collect Payout QR Code</span>
            </div>

            {mockInterfaceData.warningIndicator && (
              <div className="cf-stimulus-anomaly-box">
                <span className="cf-anomaly-label">Anomalous Signals:</span> {mockInterfaceData.warningIndicator}
              </div>
            )}
          </div>
        )}

        {/* Type 3: Law Enforcement Video Summons / Call Mock */}
        {mockInterfaceType === 'phone_call' && (
          <div className="cf-mock-call-shell">
            <div className="cf-mock-call-topbar">
              <div className="cf-call-live-indicator">
                <span className="cf-live-dot"></span> LIVE INCOMING CALL ({mockInterfaceData.callDuration})
              </div>
              <span className="cf-mock-call-caller">{mockInterfaceData.callerIdentity} • {mockInterfaceData.senderId}</span>
            </div>

            <div className="cf-mock-video-frame">
              <div className="cf-mock-video-visual-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <span className="cf-video-simulation-note">{mockInterfaceData.simulatedVisual}</span>
                <span className="cf-video-watermark">SIMULATED SCENARIO — NO REAL OFFICIAL REPRESENTATION</span>
              </div>
            </div>

            <div className="cf-mock-call-statement">
              <p className="cf-statement-text">"{mockInterfaceData.messageBody}"</p>
            </div>

            {mockInterfaceData.warningIndicator && (
              <div className="cf-stimulus-anomaly-box">
                <span className="cf-anomaly-label">Anomalous Signals:</span> {mockInterfaceData.warningIndicator}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cf-stimulus-footer-note">
        Static educational stimulus mock. Contains zero functional links, active credentials, or real communication endpoints.
      </div>
    </div>
  );
}
