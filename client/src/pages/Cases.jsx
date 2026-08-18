import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      setError('Failed to fetch case study database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
        Case Studies Library
      </h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-xl)', maxWidth: '700px' }}>
        Review analyzed case files of digital threat vectors, identify failure points in security responses, and learn preventive steps.
      </p>

      {loading && <p>Loading case studies...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {cases.map((cs) => (
            <div key={cs._id} className="editorial-card" style={{ borderLeft: '4px solid var(--accent-navy)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <span className="tag" style={{ fontSize: '0.8rem' }}>{cs.incidentType}</span>
              </div>
              
              <h2 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-md)' }}>
                {cs.title}
              </h2>

              <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 'var(--space-md)', lineHeight: '1.6' }}>
                <strong>Incident Summary:</strong> {cs.incidentDescription}
              </p>

              {/* Layout for Impact & Lessons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: 'var(--space-lg)',
                backgroundColor: 'var(--bg-secondary)',
                padding: 'var(--space-md)',
                borderRadius: '4px',
                margin: 'var(--space-md) 0'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    Victim Impact
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    {cs.victimImpact}
                  </p>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    Lessons Learned
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{cs.lessonsLearned}"
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    Red Flags / Missed Signs
                  </h4>
                  <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    {cs.warningSigns?.map((sign, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{sign}</li>
                    ))}
                  </ul>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    How It Could Be Prevented
                  </h4>
                  <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {cs.preventionTips?.map((tip, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Connected Legal Framework */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Applicable IT Act Section:</span>
                {cs.legalContext?.map((law, idx) => (
                  <span key={idx} className="section-badge" style={{ backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                    {law}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Cases;
