import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Laws() {
  const [laws, setLaws] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLaws();
  }, []);

  const fetchLaws = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getLaws();
      setLaws(data);
    } catch (err) {
      setError(err.message || 'Error fetching legal database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.searchLaws(searchTerm);
      setLaws(data);
    } catch (err) {
      setError(err.message || 'Error executing search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0' }}>
      <div style={{ maxWidth: '800px', marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-sm)' }}>
          Indian Cyber Law Database
        </h1>
        <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
          Explore key sections of the **Information Technology Act, 2000** (IT Act) that govern digital actions, online impersonation, data protection duties, and cybercrime liabilities.
        </p>

        {/* Legal Advice Notice */}
        <div style={{
          borderLeft: '4px solid var(--accent-navy)',
          backgroundColor: 'var(--bg-secondary)',
          padding: 'var(--space-md)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginTop: 'var(--space-md)',
          lineHeight: '1.5'
        }}>
          💡 <strong>Academic & Educational Guidance Notice:</strong><br />
          This search interface provides general educational summaries of legal provisions. It is intended for public awareness only and does **not** constitute formal legal advice. For official statutory citations or pending trials, refer to official government code registries.
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: '600px', marginBottom: 'var(--space-xl)' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search sections (e.g. 66C, data, identity)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ fontWeight: '600', padding: '0 24px' }}>
          Search Code
        </button>
      </form>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading legal database...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {laws.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
              No matches found in the legal registry.
            </div>
          ) : (
            laws.map((section) => {
              const isOmitted = section.legalStatus === 'omitted';

              return (
                <div 
                  key={section._id} 
                  className="editorial-card"
                  style={{
                    borderLeft: isOmitted ? '4px solid var(--color-error)' : '4px solid var(--accent-navy)',
                    backgroundColor: isOmitted ? 'rgba(239, 68, 68, 0.02)' : 'var(--bg-primary)',
                    opacity: isOmitted ? 0.9 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {section.actName}
                      </span>
                      <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginTop: '2px', color: isOmitted ? 'var(--color-error)' : 'var(--accent-navy)' }}>
                        {section.sectionNumber}: {section.officialTitle}
                      </h2>
                    </div>

                    {/* Status Badge */}
                    <span 
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        backgroundColor: isOmitted ? 'var(--color-error-light)' : 'var(--accent-navy-light)',
                        color: isOmitted ? 'var(--color-error)' : 'var(--accent-navy)',
                        border: isOmitted ? '1px solid var(--color-error)' : '1px solid var(--accent-navy)'
                      }}
                    >
                      {section.legalStatus}
                    </span>
                  </div>

                  {/* Warning Box for Omitted provisions */}
                  {isOmitted && (
                    <div className="alert alert-error" style={{ fontSize: '0.85rem', padding: 'var(--space-sm) var(--space-md)', marginBottom: 'var(--space-md)' }}>
                      ❌ <strong>UNCONSTITUTIONAL & INOPERATIVE:</strong><br />
                      This section was struck down as unconstitutional by the Supreme Court of India. Arrests or criminal charges cannot be registered under this section.
                    </div>
                  )}

                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                    <p style={{ fontWeight: '500', color: isOmitted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {section.plainLanguageExplanation}
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-md)',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-md)',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <strong style={{ color: 'var(--accent-navy)' }}>🔒 Why It Matters:</strong>
                      <p className="text-muted" style={{ margin: '4px 0 0 0' }}>{section.whyItMatters}</p>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--accent-navy)' }}>⚖️ Statutory Punishment:</strong>
                      <p className="text-muted" style={{ margin: '4px 0 0 0', fontWeight: '500', color: isOmitted ? 'var(--color-error)' : 'var(--text-primary)' }}>
                        {section.penaltyOrLegalEffect}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    marginTop: 'var(--space-md)',
                    paddingTop: 'var(--space-sm)',
                    borderTop: '1px dotted var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>
                      📅 Last Reviewed: {new Date(section.lastReviewed || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {section.officialSourceId && (
                      <span>
                        Source: <a href={section.officialSourceId.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent-navy)' }}>
                          {section.officialSourceId.title} ({section.officialSourceId.authority})
                        </a>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Laws;
