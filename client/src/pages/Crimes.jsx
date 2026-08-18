import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Crimes() {
  const [crimes, setCrimes] = useState([]);
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCrimes();
  }, []);

  const fetchCrimes = async () => {
    setLoading(true);
    try {
      const data = await api.getCrimes();
      setCrimes(data);
      if (data.length > 0) {
        setSelectedCrime(data[0]); // default to first category
      }
    } catch (err) {
      setError('Failed to fetch cybercrime data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
        Cybercrime & Security Library
      </h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-xl)', maxWidth: '700px' }}>
        Learn about common online threats, identify social engineering indicators, and explore defensive action checklists.
      </p>

      {loading && <p>Loading cybercrime library...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 'var(--space-xl)'
        }}>
          {/* Sidebar categories */}
          <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
              Categories
            </h3>
            <ul style={{ listStyle: 'none' }}>
              {crimes.map((c) => (
                <li key={c.id} style={{ marginBottom: 'var(--space-xs)' }}>
                  <button
                    onClick={() => setSelectedCrime(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '0.95rem',
                      fontWeight: selectedCrime?.id === c.id ? '600' : '400',
                      color: selectedCrime?.id === c.id ? 'var(--accent-navy)' : 'var(--text-secondary)',
                      backgroundColor: selectedCrime?.id === c.id ? 'var(--bg-secondary)' : 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔒 {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Content Pane */}
          {selectedCrime && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <span className="tag" style={{ fontSize: '0.8rem' }}>{selectedCrime.category}</span>
              </div>
              
              <h2 style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
                {selectedCrime.title}
              </h2>

              <h3 style={{ fontSize: '1.2rem', margin: 'var(--space-md) 0 var(--space-xs) 0' }}>
                What is it?
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                {selectedCrime.whatIsIt}
              </p>

              <h3 style={{ fontSize: '1.2rem', margin: 'var(--space-md) 0 var(--space-xs) 0' }}>
                How does it work?
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.95rem' }}>
                {selectedCrime.howItWorks}
              </p>

              {/* Warning signs */}
              <div className="alert alert-warning" style={{ margin: 'var(--space-lg) 0' }}>
                <h4 style={{ color: '#8c3b00', fontSize: '1.05rem', marginBottom: 'var(--space-xs)' }}>
                  ⚠️ Red Flags / Warning Signs
                </h4>
                <ul style={{ paddingLeft: 'var(--space-md)' }}>
                  {selectedCrime.warningSigns?.map((sign, idx) => (
                    <li key={idx} style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{sign}</li>
                  ))}
                </ul>
              </div>

              {/* Do vs Avoid split */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-lg)',
                margin: 'var(--space-lg) 0'
              }}>
                <div style={{
                  backgroundColor: 'var(--color-success-light)',
                  borderLeft: '4px solid var(--color-success)',
                  padding: 'var(--space-md)',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ color: '#1a6234', marginBottom: 'var(--space-xs)' }}>✅ What You Should Do</h4>
                  <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem' }}>
                    {selectedCrime.actionSteps?.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div style={{
                  backgroundColor: 'var(--color-error-light)',
                  borderLeft: '4px solid var(--color-error)',
                  padding: 'var(--space-md)',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ color: '#7b1c12', marginBottom: 'var(--space-xs)' }}>❌ What You Should Avoid</h4>
                  <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem' }}>
                    {selectedCrime.avoidSteps?.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Legal Context & Links */}
              <div style={{
                marginTop: 'var(--space-lg)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: 'var(--space-lg)',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    Relevant Law Sections
                  </h4>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    {selectedCrime.legalContext?.map((law, idx) => (
                      <span key={idx} className="section-badge" style={{ backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        {law}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    Practices & Case Links
                  </h4>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '0.85rem' }}>
                    {selectedCrime.caseStudyLink && (
                      <Link to="/cases" style={{ fontWeight: '600', textDecoration: 'underline' }}>
                        Read Case Study &rarr;
                      </Link>
                    )}
                    {selectedCrime.exerciseId && (
                      <Link to="/dashboard" style={{ fontWeight: '600', color: 'var(--color-success)', textDecoration: 'underline' }}>
                        Test Your Response &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Crimes;
