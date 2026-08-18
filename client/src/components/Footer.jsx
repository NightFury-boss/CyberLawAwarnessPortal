import React from 'react';

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      padding: 'var(--space-xl) 0',
      backgroundColor: 'var(--bg-secondary)',
      marginTop: 'var(--space-xxl)',
      fontSize: '0.9rem',
      color: 'var(--text-secondary)'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 'var(--space-xl)'
      }}>
        <div>
          <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
            ⚖️ Cyber Law Awareness Portal
          </h3>
          <p style={{ maxWidth: '500px', marginBottom: 'var(--space-md)' }}>
            An academic final-year project designed to educate citizens about Indian Cyber Law, especially the Information Technology Act, 2000, and standard safe digital habits through simulations.
          </p>
          <div className="alert alert-warning" style={{ margin: 0, padding: 'var(--space-sm)' }}>
            ⚠️ <strong>Legal Disclaimer:</strong> Information provided on this portal is for educational awareness purposes only and should not be treated as professional legal advice.
          </div>
        </div>
        
        <div>
          <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Emergency Reporting</h4>
          <p style={{ marginBottom: 'var(--space-sm)' }}>
            If you have been a victim of cyber fraud, report it immediately:
          </p>
          <p style={{ fontWeight: '600', color: 'var(--color-error)', marginBottom: 'var(--space-xs)' }}>
            📞 Helpline: 1930 (Toll-Free)
          </p>
          <p>
            💻 Portal: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>
          </p>
        </div>

        <div>
          <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Reference Links</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: 'var(--space-xs)' }}>
              <a href="https://www.meity.gov.in" target="_blank" rel="noopener noreferrer">MeitY Official</a>
            </li>
            <li style={{ marginBottom: 'var(--space-xs)' }}>
              <a href="https://www.cert-in.org.in" target="_blank" rel="noopener noreferrer">CERT-In</a>
            </li>
            <li style={{ marginBottom: 'var(--space-xs)' }}>
              <a href="https://www.rbi.org.in" target="_blank" rel="noopener noreferrer">RBI Safe Payments</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container" style={{
        marginTop: 'var(--space-xl)',
        paddingTop: 'var(--space-md)',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        &copy; {new Date().getFullYear()} Cyber Law Awareness Portal. Built for Academic and Awareness purposes.
      </div>
    </footer>
  );
}

export default Footer;
