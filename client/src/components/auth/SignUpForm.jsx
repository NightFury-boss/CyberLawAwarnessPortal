import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';

/**
 * SignUpForm Component
 * 
 * Production-ready Registration experience.
 * Collects name, email, password, and confirm password.
 * Enforces server minimum requirements and confirms password matching before submission.
 */
function SignUpForm({ setUser, onSwitchToSignIn }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Field-level confirm-password mismatch check
  const passwordsMismatch = Boolean(
    confirmPassword && password && confirmPassword !== password
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const data = await api.register(cleanEmail, password, cleanName);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-form-header">
        <span className="auth-form-eyebrow">CREATE YOUR ACCOUNT</span>
        <h2 className="auth-form-title">Begin your learning journey.</h2>
        <p className="auth-form-subtitle">
          Establish your profile to measure baseline reflexes and track longitudinal defensive shifts.
        </p>
      </div>

      {error && (
        <div className="auth-alert-error" role="alert" aria-live="polite">
          <div className="alert-content">
            <strong className="alert-title">Registration note</strong>
            <p className="alert-desc">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-actual-form" noValidate>
        {/* Full Name */}
        <div className="auth-field-group">
          <label htmlFor="signup-name" className="auth-label">
            Full name
          </label>
          <input
            type="text"
            id="signup-name"
            name="name"
            className="auth-input"
            placeholder="e.g. Rohan Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
            disabled={loading}
          />
        </div>

        {/* Email Address */}
        <div className="auth-field-group">
          <label htmlFor="signup-email" className="auth-label">
            Email address
          </label>
          <input
            type="email"
            id="signup-email"
            name="email"
            className="auth-input"
            placeholder="e.g. rohan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div>
          <PasswordField
            id="signup-password"
            name="password"
            label="Password"
            hint="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={loading}
          />
          {/* Restrained Strength Feedback */}
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <PasswordField
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          disabled={loading}
          error={passwordsMismatch ? 'Passwords do not match.' : null}
        />

        {/* Submit Action */}
        <button
          type="submit"
          className="btn btn-primary auth-submit-btn"
          disabled={loading || passwordsMismatch}
          aria-busy={loading}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      {/* Mode Switch Footer */}
      <div className="auth-mode-switch-box">
        <span className="switch-prompt">Already have an account?</span>{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="switch-action-btn"
        >
          Sign in &rarr;
        </button>
      </div>

      <p className="auth-privacy-notice">
        Account creation is strictly for personal educational progress tracking. No marketing emails or data monetization.
      </p>
    </div>
  );
}

export default SignUpForm;
