import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Register({ setUser }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const data = await api.register(email.trim(), password, fullName.trim());
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xxl) 0', maxWidth: '900px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Column: Brand statement & layout indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ borderLeft: '4px solid var(--accent-navy)', paddingLeft: '20px' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', margin: '0 0 8px 0', lineHeight: '1.2' }}>
              UNDERSTAND THE LAW.
            </h2>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', margin: '0 0 8px 0', lineHeight: '1.2' }}>
              RECOGNIZE THE THREAT.
            </h2>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', margin: '0 0 0 0', lineHeight: '1.2' }}>
              KNOW WHAT TO DO.
            </h2>
          </div>
          
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Join the platform to complete your Cyber Awareness Baseline Assessment and start learning.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--color-border-light)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-navy)' }}>LAW</span>
              <span>&rarr;</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-navy)' }}>THREAT</span>
              <span>&rarr;</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-navy)' }}>DECISION</span>
              <span>&rarr;</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-navy)' }}>LEARNING</span>
            </div>
          </div>
        </div>

        {/* Right Column: Register Form Card */}
        <div className="editorial-card" style={{ padding: '32px', border: '1px solid var(--color-border-dark)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src="/logo/cyber-law-logo-icon.svg" alt="Logo" style={{ height: '36px', width: 'auto', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--accent-navy)', fontWeight: 'bold', margin: 0 }}>
              Create Profile
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
              Join the platform to track your learning journey.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ fontSize: '0.85rem', marginBottom: '20px', padding: '12px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="fullName" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                className="form-control"
                placeholder="e.g. Rohan Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-dark)', fontSize: '0.95rem' }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="e.g. rohan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-dark)', fontSize: '0.95rem' }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Password (min 6 characters)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-dark)', fontSize: '0.95rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 'bold', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Creating profile...' : 'Register'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
            <span className="text-muted">Already have an account? </span>
            <Link to="/login" style={{ fontWeight: '600', color: 'var(--accent-navy)', textDecoration: 'underline' }}>
              Login here &rarr;
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;
