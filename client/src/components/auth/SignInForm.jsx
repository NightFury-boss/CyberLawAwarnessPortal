import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PasswordField from './PasswordField';

/**
 * SignInForm Component
 * 
 * Production-ready Sign In experience.
 * Connects to authoritative api.login() without fake delays or mock data.
 * Includes development demo quick-fill helper when on localhost.
 */
function SignInForm({ setUser, onSwitchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.login(cleanEmail, password);
      setUser(data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Unable to sign in. Check your email and password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    setError('');
    if (role === 'user') {
      setEmail('user@example.com');
      setPassword('UserPass123!');
    } else if (role === 'admin') {
      setEmail('admin@cyberlawportal.test');
      setPassword('change_this_in_development');
    }
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">SIGN IN</span>
        <h2 className="auth-form-title">Continue your learning.</h2>
        <p className="auth-form-subtitle">
          Enter your credentials to access your personal desk, assessments, and practice records.
        </p>
      </div>

      {error && (
        <div className="auth-alert-error" role="alert" aria-live="polite">
          <div className="alert-content">
            <strong className="alert-title">Unable to sign in</strong>
            <p className="alert-desc">Check your email and password and try again.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-actual-form" noValidate>
        {/* Email Field */}
        <div className="auth-field-group">
          <label htmlFor="signin-email" className="auth-label">
            Email address
          </label>
          <input
            type="email"
            id="signin-email"
            name="email"
            className="auth-input"
            placeholder="e.g. user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>

        {/* Password Field */}
        <PasswordField
          id="signin-password"
          name="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
          disabled={loading}
        />

        {/* Submit Action */}
        <button
          type="submit"
          className="btn btn-primary auth-submit-btn"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Mode Switch Footer */}
      <div className="auth-mode-switch-box">
        <span className="switch-prompt">Don't have an account?</span>{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="switch-action-btn"
        >
          Create account &rarr;
        </button>
      </div>

      {/* Localhost Demo Logins */}
      {isDev && (
        <div className="auth-dev-panel" aria-label="Development Demo Shortcuts">
          <div className="dev-panel-header">
            <span className="dev-badge">DEV</span>
            <span className="dev-title">Quick Demo Logins</span>
          </div>
          <div className="dev-actions">
            <button
              type="button"
              onClick={() => handleQuickLogin('user')}
              className="btn btn-secondary dev-btn"
            >
              Demo Learner
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="btn btn-secondary dev-btn"
            >
              Demo Admin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignInForm;
