import React from 'react';

function Prevention() {
  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
        Prevention & Digital Hygiene Centre
      </h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
        Use these security checklists and guidelines to protect your personal identity, devices, and digital assets.
      </p>

      {/* Guide 1 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>🔐 Password Hygiene & MFA</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
          Password reuse makes you highly vulnerable to credential stuffing. If a hacker breaches one forum, they test your email/password on banking apps.
        </p>
        <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '4px' }}><strong>Use passphrases:</strong> Combine 4 random dictionary words (e.g., <code>correct-horse-battery-staple</code>). They are easy to remember but mathematically nearly impossible to brute-force.</li>
          <li style={{ marginBottom: '4px' }}><strong>Use a password manager:</strong> Auto-generate distinct, secure passwords for every digital service.</li>
          <li style={{ marginBottom: '4px' }}><strong>Enable Multi-Factor Authentication (MFA):</strong> Set up Google/Microsoft Authenticator or hardware keys. Avoid SMS OTP if possible, as it is vulnerable to SIM-swapping.</li>
        </ul>
      </div>

      {/* Guide 2 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>📱 UPI & Payment Security</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
          UPI payments transfer funds instantly out of your bank account. There is no escrow reversal mechanism.
        </p>
        <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '4px' }}><strong>PIN is for sending only:</strong> You never need to enter your UPI PIN to receive money or get a refund.</li>
          <li style={{ marginBottom: '4px' }}><strong>Check recipient name:</strong> Before tapping pay, double-check the recipient's display name inside the UPI application.</li>
          <li style={{ marginBottom: '4px' }}><strong>QR scans are debits:</strong> Scanning a merchant code at a checkout is always an outgoing transaction. Refuse remote buyers who request you scan codes.</li>
        </ul>
      </div>

      {/* Guide 3 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>🌐 Safe Browsing & Links</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
          Fake portals cloning banking/university login pages are hosted on domains registered to look similar.
        </p>
        <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '4px' }}><strong>Look for HTTPS:</strong> Never enter details on pages labeled "Not Secure" (HTTP).</li>
          <li style={{ marginBottom: '4px' }}><strong>Hover and inspect:</strong> Hover your mouse cursor over hyperlinks to inspect the destination URL before clicking.</li>
          <li style={{ marginBottom: '4px' }}><strong>Check Top-Level Domains (TLDs):</strong> Official Indian government portals end in <code>.gov.in</code>. Beware of variations like <code>.verify-gov.in</code> or <code>.gov-in.org</code>.</li>
        </ul>
      </div>
      
      {/* Guide 4 */}
      <div className="editorial-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>📁 Digital Evidence Preservation</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
          If you fall victim to a cybercrime, preserving evidence is critical to secure an investigation.
        </p>
        <ul style={{ paddingLeft: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '4px' }}><strong>Take screenshots:</strong> Capture chat transcripts, spoofed headers, payment transaction ID pages, and profile URLs immediately.</li>
          <li style={{ marginBottom: '4px' }}><strong>Save header data:</strong> Export the email file (EML/MSG) to preserve sender IP header information.</li>
          <li style={{ marginBottom: '4px' }}><strong>Keep banking alerts:</strong> Preserve the SMS debited notification which has the transaction references.</li>
        </ul>
      </div>
    </div>
  );
}

export default Prevention;
