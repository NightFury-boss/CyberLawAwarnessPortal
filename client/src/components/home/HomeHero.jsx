import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimal Editorial Hero for Cyber Law Awareness Portal.
 * 
 * Reinterprets the original portal layout reference:
 * - Left-aligned spacious composition with generous whitespace.
 * - Iconic 3-line editorial headline: "Understand the law. Recognize the threat. Know what to do."
 * - Concise, purposeful portal description.
 * - Two clear primary actions: "Start Learning" (or "Go to Dashboard") and "Explore Cyber Laws".
 * - Quiet sub-tagline: "* Learn the rules. Recognize the pattern. Pause before you act."
 * - Right-hand side: downward animated vertical learning progression spine (L Law → T Threat → D Decision → E Learning → ✓ Improvement).
 *   Recovered from commit 83a8510: 200ms delay, 1.8s cubic-bezier downward fill, staggered node activations (0.2s, 0.5s, 0.8s, 1.1s, 1.4s).
 */

const PROGRESSION_NODES = [
  { letter: 'L', label: 'LAW', colorClass: 'node-law' },
  { letter: 'T', label: 'THREAT', colorClass: 'node-threat' },
  { letter: 'D', label: 'DECISION', colorClass: 'node-decision' },
  { letter: 'E', label: 'LEARNING', colorClass: 'node-learning' },
  { letter: '✓', label: 'IMPROVEMENT', colorClass: 'node-improvement' }
];

export default function HomeHero({ user }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion: activate immediately without animation
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setMounted(true);
      return;
    }

    // Exact original timing: trigger hero downward progression slightly delayed (200ms)
    const timer = setTimeout(() => {
      setMounted(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="portal-hero-section" aria-label="Introduction to Cyber Law Awareness Portal">
      <div className="container portal-hero-container">
        
        {/* Left Column: Left-Aligned Editorial Content */}
        <div className="portal-hero-content">
          <p className="portal-hero-eyebrow">
            CYBER LAW AWARENESS PORTAL
          </p>

          <h1 className="portal-hero-headline">
            Understand the law.<br />
            Recognize the threat.<br />
            Know what to do.
          </h1>

          <p className="portal-hero-description">
            A learning platform for Indian cyber law, cybercrime awareness, 
            real-world incidents, prevention, and interactive cyber-safety assessment.
          </p>

          <div className="portal-hero-cta-group">
            <Link
              to={user ? (user.role === 'admin' ? "/admin" : "/dashboard") : "/register"}
              className="btn portal-hero-btn-primary"
              aria-label={user?.role === 'admin' ? "Admin Dashboard — Access administration console" : (user ? "Go to Dashboard — Access your workspace" : "Start Learning — Begin your cyber safety journey")}
            >
              <span>{user?.role === 'admin' ? "Admin Dashboard" : (user ? "Go to Dashboard" : "Start Learning")}</span>
              <span className="hero-btn-arrow" aria-hidden="true">&rarr;</span>
            </Link>

            <Link
              to="/laws"
              className="btn portal-hero-btn-secondary"
              aria-label="Explore Cyber Laws — View statutory provisions and digital rights"
            >
              <span>Explore Cyber Laws</span>
            </Link>
          </div>

          <p className="portal-hero-tagline">
            * Learn the rules. Recognize the pattern. Pause before you act.
          </p>
        </div>

        {/* Right Column: Understated Visual Learning Progression Spine */}
        <aside className="portal-hero-visual" aria-label="Five-stage learning progression">
          <div className={`hero-progression-spine ${mounted ? 'spine-animated' : ''}`}>
            {/* Background rail */}
            <div className="spine-vertical-track" aria-hidden="true" />
            {/* Downward progressive reveal line */}
            <div className="spine-fill-track" aria-hidden="true" />
            <ol className="spine-nodes-list" aria-label="Learning progression steps">
              {PROGRESSION_NODES.map((node, index) => (
                <li key={node.label} className={`spine-node-item node-step-${index + 1}`}>
                  <span className={`spine-node-badge ${node.colorClass}`} aria-hidden="true">
                    {node.letter}
                  </span>
                  <span className="spine-node-label">{node.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

      </div>
    </section>
  );
}
