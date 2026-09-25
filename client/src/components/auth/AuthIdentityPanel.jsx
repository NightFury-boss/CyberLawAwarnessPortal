import React from 'react';
import LearningPathVisual from './LearningPathVisual';

/**
 * AuthIdentityPanel Component
 * 
 * Left column of the restrained split authentication layout.
 * Establishes calm, institutional educational context without marketing clutter.
 * 
 * Hierarchy:
 * - Existing portal logo
 * - Primary statement: "Knowing the law is only the beginning."
 * - Tagline: "Learn. Recognize. Stay Safe."
 * - Restrained line-based Learning Path visual
 */
function AuthIdentityPanel() {
  return (
    <aside className="auth-identity-panel" aria-label="Cyber Law Awareness Portal Educational Mission">
      {/* Institutional Mission Eyebrow */}
      <div className="auth-identity-brand">
        <div className="auth-brand-badge">
          NATIONAL CYBER LAW & DEFENSIVE REFLEX PLATFORM
        </div>
      </div>

      {/* Primary Statement */}
      <div className="auth-statement-block">
        <h1 className="auth-primary-statement">
          Knowing the law is only the beginning.
        </h1>
        <p className="auth-brand-tagline">
          Learn. Recognize. Stay Safe.
        </p>
        <p className="auth-statement-sub">
          A calm, evidence-based learning environment connecting statutory provisions under the IT Act and Bharatiya Nyaya Sanhita to real digital reflex decisions.
        </p>
      </div>

      {/* Refined Line-Based Learning Path Visual */}
      <LearningPathVisual />

      {/* Subtle Institutional Assurance Footer */}
      <div className="auth-identity-footer">
        <div className="auth-trust-note">
          <span className="trust-bullet">•</span>
          <span>Zero third-party trackers</span>
          <span className="trust-bullet">•</span>
          <span>Adaptive behavioral simulations</span>
          <span className="trust-bullet">•</span>
          <span>Free public education</span>
        </div>
      </div>
    </aside>
  );
}

export default AuthIdentityPanel;
