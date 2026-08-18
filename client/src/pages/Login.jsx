import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setUser(data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', padding: 'var(--space-xl) 0' }}>
      <div className="editorial-card" style={{ padding: 'var(--space-xl)' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
          Login to Portal
        </h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.9rem' }}>
          Access your personalized dashboard, track quiz results, and complete cyber awareness assessments.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Portal Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-md)', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', fontSize: '0.85rem' }}>
          <span className="text-muted">Don't have an account? </span>
          <Link to="/register" style={{ fontWeight: '500' }}>Register here</Link>
        </div>

        <div style={{ 
          marginTop: 'var(--space-lg)', 
          paddingTop: 'var(--space-md)', 
          borderTop: '1px solid var(--color-border)', 
          fontSize: '0.8rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: 'var(--space-sm)',
          borderRadius: '4px'
        }}>
          <strong>Demo Accounts:</strong><br />
          • User: <code>user@example.com</code> / <code>UserPass123!</code><br />
          • Admin: <code>admin@cyberportal.gov.in</code> / <code>AdminPass123!</code>
        </div>
      </div>
    </div>
  );
}

export default Login;
