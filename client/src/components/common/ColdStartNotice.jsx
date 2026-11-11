import React, { useState, useEffect } from 'react';
import { subscribeColdStart } from '../../services/api';

/**
 * ColdStartNotice Component
 * 
 * Displays an accessible, non-intrusive status notification when an API request
 * takes longer than the configured threshold (default: 4 seconds).
 * 
 * Key behaviours:
 * - Silent for fast requests (< 4s); zero UI flicker or flash.
 * - Shows reassuring context (e.g. "Waking up staging services...") during Render free-tier cold starts.
 * - Enforces zero staging-specific terminology in production environments.
 * - Automatically disappears as soon as requests succeed, fail, or time out.
 * - Includes role="status" and aria-live="polite" for screen reader accessibility.
 * - Includes a manual dismissal toggle.
 */
export default function ColdStartNotice() {
  const [notice, setNotice] = useState({ active: false, message: '', isStaging: false });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeColdStart((state) => {
      setNotice(state);
      if (state.active) {
        setDismissed(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!notice.active || dismissed) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Server status notification"
      className="cold-start-banner"
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '92vw',
        pointerEvents: 'auto'
      }}
    >
      <div
        className="cold-start-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.55rem 1.15rem',
          backgroundColor: 'var(--color-surface-card, #FFFDF8)',
          color: 'var(--color-text-primary, #26352B)',
          border: '1px solid var(--color-border, #D9CBB1)',
          borderRadius: '9999px',
          boxShadow: '0 4px 18px rgba(38, 53, 43, 0.14)',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '0.85rem',
          fontWeight: 500,
          lineHeight: 1.4,
          animation: 'coldStartFadeIn 0.25s ease-out'
        }}
      >
        <span
          className="cold-start-indicator-dot"
          aria-hidden="true"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: notice.isStaging ? 'var(--color-accent-terracotta, #805B43)' : 'var(--color-accent-forest, #1F4D3A)',
            display: 'inline-block',
            flexShrink: 0,
            animation: 'coldStartPulse 1.8s infinite ease-in-out'
          }}
        />
        <span style={{ letterSpacing: '0.01em' }}>{notice.message}</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss status notification"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted, #535C52)',
            cursor: 'pointer',
            padding: '0 0 0 0.5rem',
            marginLeft: '0.25rem',
            fontSize: '1.1rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.75,
            transition: 'opacity 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; }}
        >
          &times;
        </button>
      </div>
    </aside>
  );
}

