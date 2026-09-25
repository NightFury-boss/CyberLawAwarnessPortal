import React, { useState } from 'react';

/**
 * PasswordField Component
 * 
 * Accessible password input with integrated Eye / EyeOff visibility control.
 * 
 * Requirements:
 * - 40–44px effective click target
 * - Explicit aria-label ("Show password" / "Hide password")
 * - Does not overlap input text (46px right padding)
 * - Zero layout shift on toggle
 * - Keyboard accessible with clear focus ring
 */
function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '••••••••••••',
  autoComplete = 'current-password',
  required = true,
  minLength,
  error = null,
  hint = null,
  disabled = false
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-field-group">
      <div className="auth-label-row">
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
        {hint && <span className="auth-label-hint">{hint}</span>}
      </div>

      <div className="password-input-wrap">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name || id}
          className={`auth-input ${error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="password-toggle-btn"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          tabIndex={0}
          disabled={disabled}
        >
          {showPassword ? (
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </button>
      </div>

      {error && (
        <span id={`${id}-error`} className="auth-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default PasswordField;
