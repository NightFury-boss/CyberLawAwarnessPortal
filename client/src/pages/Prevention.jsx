import React from 'react';

function Prevention() {
  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
        Prevention & Digital Hygiene Centre
      </h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-xl)', fontSize: '1.05rem', lineHeight: '1.6' }}>
        Use these security checklists and guidelines to protect your personal identity, devices, and digital assets.
      </p>

      {/* Guide 1 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--accent-navy)', padding: '24px 32px' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold' }}>Password Hygiene & MFA</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
          Password reuse makes you highly vulnerable to credential stuffing. If a hacker breaches one forum, they test your email/password on banking apps.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Good Practice</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Use passphrases:</strong> Combine 4 random dictionary words (e.g., <code>correct-horse-battery-staple</code>). They are easy to remember but mathematically nearly impossible to brute-force.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Use a password manager:</strong> Auto-generate distinct, secure passwords for every digital service.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Enable Multi-Factor Authentication (MFA):</strong> Set up Google/Microsoft Authenticator or hardware keys. Avoid SMS OTP if possible, as it is vulnerable to SIM-swapping.</span>
          </div>
        </div>
      </div>

      {/* Guide 2 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--accent-navy)', padding: '24px 32px' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold' }}>UPI & Payment Security</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
          UPI payments transfer funds instantly out of your bank account. There is no escrow reversal mechanism.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>PIN is for sending only:</strong> You never need to enter your UPI PIN to receive money or get a refund.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Check recipient name:</strong> Before tapping pay, double-check the recipient's display name inside the UPI application.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>QR scans are debits:</strong> Scanning a merchant code at a checkout is always an outgoing transaction. Refuse remote buyers who request you scan codes.</span>
          </div>
        </div>
      </div>

      {/* Guide 3 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--accent-navy)', padding: '24px 32px' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold' }}>Safe Browsing & Links</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
          Fake portals cloning banking/university login pages are hosted on domains registered to look similar.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Look for HTTPS:</strong> Never enter details on pages labeled "Not Secure" (HTTP).</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Hover and inspect:</strong> Hover your mouse cursor over hyperlinks to inspect the destination URL before clicking.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Check Top-Level Domains (TLDs):</strong> Official Indian government portals end in <code>.gov.in</code>. Beware of variations like <code>.verify-gov.in</code> or <code>.gov-in.org</code>.</span>
          </div>
        </div>
      </div>
      
      {/* Guide 4 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--accent-navy)', padding: '24px 32px' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold' }}>Digital Evidence Preservation</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
          If you fall victim to a cybercrime, preserving evidence is critical to secure an investigation.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Take screenshots:</strong> Capture chat transcripts, spoofed headers, payment transaction ID pages, and profile URLs immediately.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Save header data:</strong> Export the email file (EML/MSG) to preserve sender IP header information.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '3px', color: 'var(--color-info)', backgroundColor: 'var(--color-info-light)', minWidth: '120px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Keep banking alerts:</strong> Preserve the SMS debited notification which has the transaction references.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prevention;
