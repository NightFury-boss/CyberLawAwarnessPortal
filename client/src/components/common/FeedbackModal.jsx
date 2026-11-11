import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Cyber Law Awareness Portal — Public Beta Feedback Modal
 * 
 * Provides an accessible, dignified pathway for visitors, students, and legal
 * educators to submit bug reports, statutory accuracy suggestions, and
 * experiential impressions during the Public Beta.
 */
export const FEEDBACK_CATEGORIES = [
  { id: 'experience', label: 'Learning Experience', icon: '✦', desc: 'Flow, clarity, or comprehension' },
  { id: 'bug', label: 'Bug or Issue', icon: '⚙', desc: 'Display, navigation, or technical bug' },
  { id: 'legal', label: 'Statutory Accuracy', icon: '§', desc: 'Citations, legal terms, or precedents' },
  { id: 'general', label: 'General Thoughts', icon: '💬', desc: 'Impressions, ideas, and suggestions' }
];

const FEEDBACK_STORAGE_KEY = 'cl_public_beta_feedback';

export default function FeedbackModal({ isOpen: propIsOpen, onClose: propOnClose, initialCategory = 'experience' }) {
  const location = useLocation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [learnerRole, setLearnerRole] = useState('student');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);
  const prevFocusedElement = useRef(null);
  const textareaRef = useRef(null);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  // Listen for global custom events to open feedback from anywhere
  useEffect(() => {
    const handleOpenEvent = (e) => {
      const detail = e.detail || {};
      if (detail.category) setCategory(detail.category);
      setSubmitted(false);
      setError('');
      setInternalOpen(true);
    };

    window.addEventListener('cl:open-feedback', handleOpenEvent);
    return () => window.removeEventListener('cl:open-feedback', handleOpenEvent);
  }, []);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setInternalOpen(false);
    }
    // Reset state after close
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setError('');
    }, 250);
  };

  // Accessibility: focus trapping & escape key handler
  useEffect(() => {
    if (!isOpen) {
      if (prevFocusedElement.current) {
        try {
          prevFocusedElement.current.focus();
        } catch {}
      }
      return;
    }

    prevFocusedElement.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusableArr = Array.from(focusables).filter(
          (el) => !el.disabled && el.offsetParent !== null
        );

        if (focusableArr.length === 0) return;

        const firstEl = focusableArr[0];
        const lastEl = focusableArr[focusableArr.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Focus textarea or first interactive element
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      } else if (modalRef.current) {
        const first = modalRef.current.querySelector('button, input, textarea');
        first?.focus();
      }
    }, 60);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      setError('Please provide a short description of your observation or feedback.');
      return;
    }

    if (trimmedMsg.length < 8) {
      setError('Please provide at least 8 characters so we can understand your thought.');
      return;
    }

    setIsSubmitting(true);

    try {
      const record = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        category,
        message: trimmedMsg,
        email: email.trim() || null,
        learnerRole,
        path: location.pathname + (location.search || ''),
        viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
        timestamp: new Date().toISOString()
      };

      // Safely persist to browser storage
      let existing = [];
      try {
        const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (raw) existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }

      existing.unshift(record);
      // Keep maximum 30 historical records locally
      if (existing.length > 30) existing = existing.slice(0, 30);
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existing));

      setIsSubmitting(false);
      setSubmitted(true);
    } catch {
      setIsSubmitting(false);
      setSubmitted(true); // Still show graceful confirmation to user
    }
  };

  const getMailtoLink = () => {
    const subject = encodeURIComponent(`[Public Beta Feedback] ${FEEDBACK_CATEGORIES.find(c => c.id === category)?.label || 'General'}`);
    const body = encodeURIComponent(
      `Category: ${category}\n` +
      `Page: ${location.pathname}\n` +
      `Role: ${learnerRole}\n\n` +
      `Feedback:\n${message}\n\n` +
      `Contact: ${email || 'Not provided'}`
    );
    return `mailto:feedback@cyberlawportal.org?subject=${subject}&body=${body}`;
  };

  return (
    <div 
      className="feedback-modal-backdrop" 
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="feedback-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        aria-describedby="feedback-dialog-desc"
      >
        {/* Header with Editorial Rule & Close Button */}
        <div className="feedback-modal-header">
          <div className="feedback-modal-eyebrow-wrap">
            <span className="feedback-modal-badge">PUBLIC BETA</span>
            <span className="feedback-modal-eyebrow">COMMUNITY FEEDBACK</span>
          </div>
          <button 
            type="button" 
            onClick={handleClose} 
            className="feedback-modal-close-btn"
            aria-label="Close feedback dialog"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2L16 16M2 16L16 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="feedback-modal-form" noValidate>
            <div className="feedback-modal-intro">
              <h2 id="feedback-dialog-title" className="feedback-modal-title">
                Share Your Beta Experience
              </h2>
              <p id="feedback-dialog-desc" className="feedback-modal-desc">
                Your observations help us refine curriculum explanations, fix unexpected bugs, and strengthen practical digital legal awareness.
              </p>
            </div>

            {error && (
              <div className="feedback-modal-alert" role="alert">
                <span className="alert-icon" aria-hidden="true">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Category Choice */}
            <div className="feedback-form-group">
              <label id="category-group-label" className="feedback-form-label">
                What kind of feedback are you sharing?
              </label>
              <div 
                className="feedback-category-grid" 
                role="radiogroup" 
                aria-labelledby="category-group-label"
              >
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setCategory(cat.id)}
                      className={`feedback-category-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="cat-icon-title">
                        <span className="cat-icon" aria-hidden="true">{cat.icon}</span>
                        <strong className="cat-title">{cat.label}</strong>
                      </div>
                      <span className="cat-desc">{cat.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Input */}
            <div className="feedback-form-group">
              <label htmlFor="feedback-message-input" className="feedback-form-label">
                Your Observation or Suggestion <span className="label-required" aria-hidden="true">*</span>
              </label>
              <textarea
                ref={textareaRef}
                id="feedback-message-input"
                name="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did you observe? What felt unclear, or what would make this learning experience more impactful?"
                className="feedback-textarea"
                aria-required="true"
              />
              <div className="feedback-field-hint">
                <span>Page context: <code>{location.pathname}</code></span>
                <span>{message.length} characters</span>
              </div>
            </div>

            {/* Role & Email Row */}
            <div className="feedback-form-row">
              <div className="feedback-form-group flex-1">
                <label htmlFor="feedback-role-select" className="feedback-form-label">
                  I am exploring as
                </label>
                <select
                  id="feedback-role-select"
                  name="role"
                  value={learnerRole}
                  onChange={(e) => setLearnerRole(e.target.value)}
                  className="feedback-select"
                >
                  <option value="student">Student / Learner</option>
                  <option value="educator">Educator / Academic</option>
                  <option value="legal">Legal Professional</option>
                  <option value="citizen">Civic Digital User</option>
                  <option value="developer">Developer / QA</option>
                </select>
              </div>

              <div className="feedback-form-group flex-1">
                <label htmlFor="feedback-email-input" className="feedback-form-label">
                  Email Address <span className="label-optional">(Optional)</span>
                </label>
                <input
                  type="email"
                  id="feedback-email-input"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="feedback-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="feedback-modal-actions">
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-secondary feedback-cancel-btn"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn btn-primary feedback-submit-btn"
              >
                {isSubmitting ? 'Recording...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        ) : (
          <div className="feedback-modal-success" role="status" aria-live="polite">
            <div className="success-icon-wrap" aria-hidden="true">
              <span className="success-check">✓</span>
            </div>
            <h3 className="success-title">Thank You for Your Feedback</h3>
            <p className="success-message">
              Your insight directly contributes to refining the Cyber Law Awareness Portal for students, citizens, and educators across India.
            </p>
            <div className="success-reference-box">
              <span className="ref-label">Category:</span>
              <strong className="ref-val">{FEEDBACK_CATEGORIES.find(c => c.id === category)?.label}</strong>
              <span className="ref-sep">•</span>
              <span className="ref-label">Context:</span>
              <code className="ref-code">{location.pathname}</code>
            </div>

            <div className="success-email-alternative">
              <p className="email-alt-note">
                Prefer to send a direct message or attach screenshots?
              </p>
              <a 
                href={getMailtoLink()} 
                className="email-alt-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Email Client &rarr;
              </a>
            </div>

            <div className="success-actions">
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-primary success-close-btn"
              >
                Return to Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Convenience helper to open the feedback modal programmatically from anywhere.
 */
export function openFeedbackModal(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cl:open-feedback', { detail }));
  }
}
