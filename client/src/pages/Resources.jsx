import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      setError('Failed to fetch reference resources.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
        Official Legal Resources
      </h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-lg)' }}>
        Access official government sources, guides, cyber helplines, and legislation texts.
      </p>

      {/* Crucial Banner distinguishing Education vs Complaint */}
      <div className="alert alert-warning" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        🛡️ <strong>Important Notice: Educational Guidance Only</strong><br />
        This portal is an educational project and <strong>does not</strong> file official police complaints or register FIRs. If you need to file an official cybercrime report, please use the verified government links listed below.
      </div>

      {loading && <p>Loading resources...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          {resources.map((res) => (
            <div key={res.id} className="editorial-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="tag" style={{ fontSize: '0.75rem' }}>{res.category}</span>
                <h3 style={{ fontSize: '1.25rem', margin: 'var(--space-xs) 0' }}>{res.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  {res.description}
                </p>
              </div>

              <div>
                <a
                  href={res.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem', padding: 'var(--space-sm)' }}
                >
                  {res.downloadable ? '📥 Download Document' : '🔗 Open Official Resource'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ Section */}
      <div style={{ marginTop: 'var(--space-xxl)' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>
          Frequently Asked Questions
        </h2>

        <div className="editorial-card">
          <h4 style={{ marginBottom: 'var(--space-xs)' }}>Is my bank liable if I share my OTP?</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Under RBI guidelines, if a financial loss occurs due to negligence by the customer (such as sharing login passwords or OTPs), the customer is liable for the loss until they report the fraud to the bank. Reporting it immediately (within 3 days) minimizes your liability.
          </p>
        </div>

        <div className="editorial-card">
          <h4 style={{ marginBottom: 'var(--space-xs)' }}>Can a police officer arrest me for an online comment?</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Section 66A of the IT Act, which allowed arrests for "offensive" online posts, was declared unconstitutional by the Supreme Court of India in 2015. However, hate speech, threats of violence, or obscenity can still be prosecuted under other standard sections of the Bharatiya Nyaya Sanhita (BNS) (formerly IPC).
          </p>
        </div>

        <div className="editorial-card">
          <h4 style={{ marginBottom: 'var(--space-xs)' }}>What is the 'Golden Hour' in cybercrime?</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            The first 1 to 2 hours following a financial cyber fraud is called the Golden Hour. If you call 1930 immediately, cyber cell coordinators can raise alerts on the financial networks and freeze the stolen money before the attacker manages to withdraw it via cash machines or purchase digital gift vouchers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Resources;
