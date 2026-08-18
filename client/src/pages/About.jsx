import React from 'react';

function About() {
  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
        About the Project
      </h1>
      
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: '1.6' }}>
        The <strong>Cyber Law Awareness Portal</strong> is a complete educational project designed to bridge the gap between abstract legal sections and the actual mechanics of digital cyber attacks.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-lg) 0' }} />

      <h3 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-sm)' }}>1. Project Objectives</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        Most online cyber law repositories present laws merely as legal text. However, ordinary citizens struggle to identify when these laws are relevant. This platform combines:
      </p>
      <ul style={{ paddingLeft: 'var(--space-lg)', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
        <li style={{ marginBottom: 'var(--space-xs)' }}>Plain-English breakdowns of the Indian Information Technology Act, 2000.</li>
        <li style={{ marginBottom: 'var(--space-xs)' }}>Realistic digital threat simulations (phishing, vishing, QR scams) to test response habits.</li>
        <li style={{ marginBottom: 'var(--space-xs)' }}>Targeted recommendations connecting assessment weaknesses directly to learning material.</li>
        <li style={{ marginBottom: 'var(--space-xs)' }}>Before-and-after assessment comparison to measure learning outcomes.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-sm)' }}>2. Simulation Ethics & Data Privacy</h3>
      <div className="alert alert-success" style={{ marginBottom: 'var(--space-lg)' }}>
        🛡️ <strong>Zero Data Retention Policy for Sensitive Inputs:</strong><br />
        To teach credential protection safely, our simulations include visual password, phone, OTP, or account inputs. The application **does not read, store, or transmit** these values. They are evaluated instantly inside the local browser session and discarded. We record only the action event status (e.g., whether you entered input or inspected domains).
      </div>

      <h3 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-sm)' }}>3. Distinguishing Education from Legal Advice</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        This application is created solely as an academic and community awareness tool. 
        It does not represent a law firm, government office, or court authority. 
        The information on this portal is provided for general education and does not constitute formal legal counsel. 
        If you require official legal assistance, please consult an advocate or verify provisions against the official Gazette of India.
      </p>

      <h3 style={{ fontSize: '1.4rem', marginBottom: 'var(--space-sm)' }}>4. Educational Methodology</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        We follow the central awareness loop:
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-secondary)',
        padding: 'var(--space-md)',
        borderRadius: '4px',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '0.85rem',
        color: 'var(--accent-navy)',
        marginBottom: 'var(--space-lg)'
      }}>
        <span>Experience ➔</span>
        <span>Understand ➔</span>
        <span>Learn ➔</span>
        <span>Practice ➔</span>
        <span>Improve</span>
      </div>
    </div>
  );
}

export default About;
