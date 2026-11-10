import React, { useState } from 'react';
import Reveal from '../common/Reveal';

export default function EmergencyAssistanceSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy1930 = async () => {
    let success = false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText('1930');
        success = true;
      }
    } catch {
      // Fallback for restricted clipboard environments
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = '1930';
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // Fallback completed
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section 
      id="emergency-assistance" 
      className="homepage-emergency-section"
      aria-labelledby="emergency-heading"
    >
      <div className="container">
        <Reveal variant="fade-up" className="emergency-container-card">
          {/* Header & Main Contact Cluster */}
          <div className="emergency-header">
            <div className="emergency-header-text">
              <p className="emergency-eyebrow">
                Immediate Action · Financial Cybercrime
              </p>
              <h2 id="emergency-heading" className="emergency-title">
                Urgent Financial Fraud Assistance
              </h2>
              <p className="emergency-subtitle">
                If you have been targeted by unauthorized transactions or shared sensitive banking credentials, immediate reporting within the first 2 to 3 hours is critical.
              </p>
            </div>

            <div className="emergency-actions-cluster">
              <div className="emergency-number-callout" aria-label="National Cybercrime Helpline: 1930">
                <span className="emergency-callout-label">Helpline</span>
                <span className="emergency-callout-number">1930</span>
              </div>

              <a 
                href="tel:1930" 
                className="emergency-btn-dial"
                aria-label="Dial National Cybercrime Helpline 1930"
              >
                <span>📞 Dial 1930</span>
              </a>

              <button 
                type="button"
                onClick={handleCopy1930}
                className="emergency-btn-copy"
                aria-label="Copy helpline number 1930 to clipboard"
              >
                <span>{copied ? '✓ Copied' : '📋 Copy 1930'}</span>
              </button>

              <a 
                href="https://cybercrime.gov.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="emergency-btn-portal"
                aria-label="Open official National Cybercrime Reporting Portal in a new tab"
              >
                <span>cybercrime.gov.in ↗</span>
              </a>
            </div>
          </div>

          {/* 3-Step Action Guide */}
          <div className="emergency-steps-grid" role="list" aria-label="Three-step immediate fraud response sequence">
            <div className="emergency-step-card" role="listitem">
              <div className="emergency-step-indicator">
                <span className="emergency-step-badge">1</span>
                <span>Immediate Call</span>
              </div>
              <h3 className="emergency-step-title">Dial Helpline 1930</h3>
              <p className="emergency-step-desc">
                Call 1930 immediately (24/7). Quick reporting triggers urgent inter-bank hold requests across participating financial institutions via the CFCFRMS platform.
              </p>
            </div>

            <div className="emergency-step-card" role="listitem">
              <div className="emergency-step-indicator">
                <span className="emergency-step-badge">2</span>
                <span>Formal Docket</span>
              </div>
              <h3 className="emergency-step-title">Register at cybercrime.gov.in</h3>
              <p className="emergency-step-desc">
                File a detailed formal complaint on the official portal within 24 hours. Keep transaction IDs (UTR/RRN), sender details, and account screenshots ready.
              </p>
            </div>

            <div className="emergency-step-card" role="listitem">
              <div className="emergency-step-indicator">
                <span className="emergency-step-badge">3</span>
                <span>Direct Freeze</span>
              </div>
              <h3 className="emergency-step-title">Notify Bank & Block Instruments</h3>
              <p className="emergency-step-desc">
                Contact your bank or card issuer through their official banking app or branch number to lock netbanking, block debit/credit cards, and disable UPI.
              </p>
            </div>
          </div>

          {/* Mandatory Statutory Non-Guarantee Disclaimer */}
          <div className="emergency-disclaimer-box" role="note" aria-label="Statutory disclaimer on fund recovery">
            <svg 
              className="emergency-disclaimer-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="emergency-disclaimer-text">
              <strong>Statutory Guidance Note:</strong> Reporting to Helpline 1930 coordinates urgent communication across participating banks via CFCFRMS, but does not guarantee that funds will be frozen, reversed, or recovered. Never share one-time security codes (OTPs), PINs, or device access with anyone claiming to assist with fund recovery.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
