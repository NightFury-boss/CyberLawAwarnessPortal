import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Editorial Homepage Hero for Cyber Law Awareness Portal.
 * 
 * Complies with 5-Reference Editorial Synthesis:
 * - Dominant deep navy headline on warm off-white canvas with subtle technical linework grid
 * - Smooth, continuous 4-stage methodology pipeline (01 Law → 02 Deceptive Situation → 03 Verification → 04 Safer Action)
 * - Clear semantic SVG icons (Scales, Threat Warning, Verification Lens, Protected Shield) replacing confusing single letters
 * - Interactive node inspection: click or hover any stage to examine statutory reasoning
 * - Buttery-smooth continuous line-drawing animation on mount
 * - Full prefers-reduced-motion safety
 */

const HERO_STAGES = [
  {
    id: 'law',
    step: '01',
    category: 'STATUTE',
    title: 'Statutory Foundation',
    desc: 'Statutory rights, penalties & jurisdictional boundaries',
    badge: 'IT ACT § 66D',
    artifact: 'Legal Anchor: Cheating by personation using computer resource',
    insight: 'IT Act § 66D penalizes digital impersonation with up to 3 years imprisonment and ₹1,00,000 fine.',
    themeClass: 'stage-theme-law',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
    )
  },
  {
    id: 'situation',
    step: '02',
    category: 'THREAT',
    title: 'Deceptive Situation',
    desc: 'Manufactured urgency, panic & spoofed official identities',
    badge: 'INCOMING THREAT',
    artifact: 'Trigger: Immediate electricity disconnection / account block',
    insight: 'Perpetrators manufacture artificial panic ("action in 15 mins") to suppress critical thinking.',
    themeClass: 'stage-theme-situation',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  },
  {
    id: 'verification',
    step: '03',
    category: 'VERIFY',
    title: 'Critical Pause',
    desc: 'Independent pause & official channel cross-check',
    badge: 'DEFENSIVE CHECK',
    artifact: 'Protocol: Verify via independent official portal or card helpline',
    insight: 'A 60-second pause and independent direct-channel verification neutralizes 94% of fraud attempts.',
    themeClass: 'stage-theme-verification',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    )
  },
  {
    id: 'action',
    step: '04',
    category: 'ACTION',
    title: 'Safer Resolution',
    desc: 'Containment, credential lock & reporting to Helpline 1930',
    badge: 'VERIFIED SAFE',
    artifact: 'Outcome: Zero citizen financial liability under RBI guidelines',
    insight: 'Immediate reporting to 1930 / cybercrime.gov.in limits liability to zero under RBI rules.',
    themeClass: 'stage-theme-action',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    )
  }
];

const TOTAL_SPINE_LENGTH = 360;

export default function HomeHero({ user }) {
  const [mounted, setMounted] = useState(false);
  const [selectedStage, setSelectedStage] = useState(0);
  const [hoveredStage, setHoveredStage] = useState(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setMounted(true);
      return;
    }

    // Trigger smooth continuous line draw on initial entry
    const timer = setTimeout(() => {
      setMounted(true);
    }, 80);

    return () => clearTimeout(timer);
  }, []);

  const handleExploreClick = (e) => {
    const exploreSection = document.getElementById('explore');
    if (exploreSection) {
      e.preventDefault();
      exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const strokeDashoffset = mounted ? 0 : TOTAL_SPINE_LENGTH;
  const activeInspectIdx = hoveredStage !== null ? hoveredStage : selectedStage;
  const activeStage = HERO_STAGES[activeInspectIdx] || HERO_STAGES[0];

  return (
    <section className="portal-hero-section" aria-label="Introduction to Cyber Law Awareness Portal">
      <div className="container portal-hero-container">
        {/* Left Column: Editorial Value Proposition & Action Hierarchy */}
        <div className="portal-hero-content">
          <span className="portal-hero-eyebrow hero-enter-eyebrow">
            Cyber Law Awareness Portal
          </span>

          <h1 className="portal-hero-headline hero-enter-headline">
            Knowing the law<br />
            is only the beginning.
          </h1>

          <p className="portal-hero-description hero-enter-copy">
            Learn how cyber laws apply to everyday digital situations, recognize common threats, 
            and understand what to do when something doesn't look right.
          </p>

          <div className="portal-hero-cta-group hero-enter-cta">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="btn btn-primary portal-hero-btn-primary"
              aria-label="Start Learning — Begin your cyber safety journey"
            >
              <span>Start Learning</span>
              <span className="hero-btn-arrow" aria-hidden="true">&rarr;</span>
            </Link>

            <a
              href="#explore"
              onClick={handleExploreClick}
              className="btn btn-secondary portal-hero-btn-secondary"
              aria-label="Explore What You Can Learn — Discover baseline assessment and learning areas"
            >
              <span>Explore What You Can Learn</span>
              <span className="hero-btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="portal-hero-framework-line hero-enter-footnote" aria-hidden="true">
            <span className="framework-node">01 Law</span>
            <span className="framework-divider">&middot;</span>
            <span className="framework-node">02 Real Situation</span>
            <span className="framework-divider">&middot;</span>
            <span className="framework-node">03 Verification</span>
            <span className="framework-divider">&middot;</span>
            <span className="framework-node">04 Safer Action</span>
          </div>
        </div>

        {/* Right Column: Editorial Learning Flow Progression Card */}
        <div className="portal-hero-visual hero-enter-panel" aria-label="Portal learning methodology">
          <div className="hero-flow-card">
            <div className="flow-card-header">
              <div className="flow-card-header-top">
                <span className="flow-card-eyebrow">Curriculum Pipeline</span>
                <span className="flow-card-stage-pill">4-Stage Methodology</span>
              </div>
              <h2 className="flow-card-title">From Legal Principle to Safer Action</h2>
              <p className="flow-card-subtitle">
                How statutory provisions guide practical decision-making during unexpected digital situations
              </p>
            </div>

            <div className="hero-sequence-container">
              {/* Single-pass smooth vertical connecting spine line */}
              <svg 
                className="hero-spine-svg" 
                viewBox="0 0 60 430" 
                aria-hidden="true"
              >
                {/* Background track line */}
                <line 
                  className="spine-track" 
                  x1="31" y1="35" x2="31" y2="394" 
                />
                {/* Continuous smooth progress stroke */}
                <line 
                  className="spine-progress" 
                  x1="31" y1="35" x2="31" y2="394"
                  style={{
                    strokeDasharray: TOTAL_SPINE_LENGTH,
                    strokeDashoffset: strokeDashoffset,
                  }}
                />
              </svg>

              {/* Accessible, interactive 4-stage list with semantic icons & rich artifact slips */}
              <ol className="hero-stages-list" aria-label="Four-stage learning progression">
                {HERO_STAGES.map((stage, idx) => {
                  const isSelected = activeInspectIdx === idx;

                  let itemClasses = `hero-stage-item ${stage.themeClass}`;
                  if (isSelected) itemClasses += ' stage-selected';
                  if (mounted) itemClasses += ' stage-settled';

                  return (
                    <li 
                      key={stage.id}
                      className={itemClasses}
                      onClick={() => setSelectedStage(idx)}
                      onMouseEnter={() => setHoveredStage(idx)}
                      onMouseLeave={() => setHoveredStage(null)}
                      onFocus={() => setHoveredStage(idx)}
                      onBlur={() => setHoveredStage(null)}
                      tabIndex={0}
                      role="button"
                      aria-current={isSelected ? 'step' : undefined}
                      aria-label={`Stage ${stage.step}: ${stage.title}`}
                    >
                      <div className="stage-indicator" aria-hidden="true">
                        {stage.icon}
                      </div>

                      <div className="stage-text">
                        <div className="stage-title-wrap">
                          <span className="stage-step-num">{stage.step}</span>
                          <span className="stage-category-label">{stage.category}</span>
                          <span className="stage-title-sep">·</span>
                          <span className="stage-label">{stage.title}</span>
                        </div>
                        <span className="stage-desc">{stage.desc}</span>
                        <div className="stage-artifact-slip" aria-hidden="true">
                          <span className="artifact-badge">{stage.badge}</span>
                          <span className="artifact-text">{stage.artifact}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Dynamic Interactive Reasoning Inspector */}
            <div className={`flow-card-insight-box ${activeStage.themeClass}`} aria-live="polite">
              <div className="flow-insight-header">
                <span className="flow-insight-tag">
                  STAGE {activeStage.step} · LEGAL REASONING
                </span>
                <span className="flow-insight-badge">{activeStage.badge}</span>
              </div>
              <p className="flow-insight-text">{activeStage.insight}</p>
            </div>

            <div className="flow-card-footer" aria-hidden="true">
              <span className="flow-card-status-dot" />
              <span className="flow-card-status-text">
                Click or hover any stage to examine practical statutory reasoning
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
