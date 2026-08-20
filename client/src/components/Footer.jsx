import React from 'react';
import { Link } from 'react-router-dom';

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
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <img src="/logo/cyber-law-logo-horizontal.svg" alt="Cyber Law Awareness Portal" style={{ height: '36px', width: 'auto' }} />
          </div>
          <p style={{ maxWidth: '500px', marginBottom: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            An educational platform for cyber-law and digital-safety awareness.
          </p>
          <div className="alert alert-warning" style={{ margin: 0, padding: 'var(--space-sm)', fontSize: '0.8rem' }}>
            <strong>Legal Disclaimer:</strong> Information provided on this portal is for educational awareness purposes only and should not be treated as professional legal advice.
          </div>
        </div>
        
        <div>
          <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem', color: 'var(--accent-navy)', fontWeight: 'bold' }}>Emergency Reporting</h4>
          <p style={{ marginBottom: 'var(--space-sm)', fontSize: '0.85rem' }}>
            If you have been a victim of cyber fraud, report it immediately:
          </p>
          <p style={{ fontWeight: '600', color: 'var(--color-error)', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>
            Helpline: 1930 (Toll-Free)
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            Portal: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>cybercrime.gov.in</a>
          </p>
        </div>

        <div>
          <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem', color: 'var(--accent-navy)', fontWeight: 'bold' }}>Portal Navigation</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
            <li>
              <Link to="/laws" style={{ color: 'var(--text-secondary)' }}>Cyber Laws</Link>
            </li>
            <li>
              <Link to="/crimes" style={{ color: 'var(--text-secondary)' }}>Crimes Library</Link>
            </li>
            <li>
              <Link to="/cases" style={{ color: 'var(--text-secondary)' }}>Case Studies</Link>
            </li>
            <li>
              <Link to="/prevention" style={{ color: 'var(--text-secondary)' }}>Prevention Centre</Link>
            </li>
            <li>
              <Link to="/resources" style={{ color: 'var(--text-secondary)' }}>Legal Resources</Link>
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
