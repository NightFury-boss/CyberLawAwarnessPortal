import React from 'react';

/**
 * PasswordStrength Component
 * 
 * Restrained password strength indicator.
 * Helps learners craft resilient passwords without gamification or fake numbers.
 * 
 * Levels:
 * - Weak (< 6 chars or single character class)
 * - Fair (>= 6 chars with mixed letters and numbers)
 * - Good (>= 8 chars with uppercase, lowercase, and numbers)
 * - Strong (>= 10 chars with special characters)
 */
function evaluateStrength(password) {
  if (!password) return { level: 0, label: '', className: '' };
  
  if (password.length < 6) {
    return { level: 1, label: 'Weak (min 6 characters required)', className: 'strength-weak' };
  }

  let score = 1;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8) score++;
  if (hasMixedCase && hasNumbers) score++;
  if (hasSpecial && password.length >= 10) score++;

  switch (score) {
    case 1:
      return { level: 1, label: 'Weak', className: 'strength-weak' };
    case 2:
      return { level: 2, label: 'Fair', className: 'strength-fair' };
    case 3:
      return { level: 3, label: 'Good', className: 'strength-good' };
    case 4:
    default:
      return { level: 4, label: 'Strong', className: 'strength-strong' };
  }
}

function PasswordStrength({ password }) {
  if (!password) return null;

  const { level, label, className } = evaluateStrength(password);

  return (
    <div className="auth-strength-wrap" aria-live="polite">
      <div className="auth-strength-bars" aria-hidden="true">
        <div className={`strength-bar ${level >= 1 ? className : ''}`} />
        <div className={`strength-bar ${level >= 2 ? className : ''}`} />
        <div className={`strength-bar ${level >= 3 ? className : ''}`} />
        <div className={`strength-bar ${level >= 4 ? className : ''}`} />
      </div>
      <div className="auth-strength-text">
        <span className="strength-prefix">Password strength:</span>{' '}
        <span className={`strength-val ${className}`}>{label}</span>
      </div>
    </div>
  );
}

export default PasswordStrength;
