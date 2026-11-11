import React, { useState, useEffect } from 'react';
import { openFeedbackModal } from '../common/FeedbackModal';

const STORAGE_KEY = 'cl_public_beta_banner_dismissed';

/**
 * Public Beta Announcement Banner for Cyber Law Awareness Portal Homepage.
 * 
 * Editorial, understated, and transparent:
 * Communicates that the platform is in open public beta, invites exploration,
 * and provides an immediate, accessible pathway for visitor feedback.
 */
export default function PublicBetaAnnouncement({ onOpenFeedback }) {
  const [dismissed, setDismissed] = useState(true); // Default true until mount check to avoid hydration flash
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
      setDismissed(true);
      setIsAnimatingOut(false);
    }, 220);
  };

  const handleFeedbackClick = () => {
    if (onOpenFeedback) {
      onOpenFeedback();
    } else {
      openFeedbackModal({ source: 'homepage_banner', category: 'experience' });
    }
  };

  if (dismissed) return null;

  return (
    <aside 
      className={`public-beta-banner ${isAnimatingOut ? 'animating-out' : ''}`}
      role="region" 
      aria-label="Public Beta Announcement"
    >
      <div className="container public-beta-container">
        <div className="public-beta-left">
          <div className="public-beta-pill-wrap">
            <span className="public-beta-pill">PUBLIC BETA</span>
          </div>
          <p className="public-beta-text">
            <strong className="public-beta-title">The Cyber Law Awareness Portal is now open for exploration.</strong>{' '}
            <span className="public-beta-desc">
              We're continuously improving the learning experience. Explore, learn, and share your feedback.
            </span>
          </p>
        </div>

        <div className="public-beta-right">
          <button
            type="button"
            onClick={handleFeedbackClick}
            className="public-beta-cta-btn"
            aria-label="Open feedback dialog to share your observations"
          >
            <span>Share Feedback</span>
            <span className="cta-arrow" aria-hidden="true">&rarr;</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="public-beta-dismiss-btn"
            aria-label="Dismiss public beta announcement banner"
            title="Dismiss announcement"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1.5 1.5L12.5 12.5M1.5 12.5L12.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
