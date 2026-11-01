import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Editorial Monochrome Outline SVG Icons (Lucide Specification)
 * Consistent 1.75–2.0px stroke weight, deep navy / muted slate palette.
 */
function IconBook({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  );
}

function IconCompass({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconLayers({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconClock({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconShield({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconTarget({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconArrowRight({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/**
 * Editorial Tripartite Dossier:
 * Replaces generic SaaS cards with a cohesive, editorial study brief.
 * Columns communicate:
 * 1. Statutory Foundation (What the portal teaches)
 * 2. Behavioral Diagnostic (Why the initial assessment exists)
 * 3. Unlocked Progression (What the learner receives upon completion)
 */
function FirstVisitTriadDossier() {
  return (
    <div className="first-visit-triad-ledger" aria-label="First check orientation dossier">
      {/* Column 1: What the portal teaches */}
      <div className="first-visit-dossier-col">
        <div className="dossier-topline">
          <span className="dossier-kicker">§ 01 • STATUTORY FOUNDATION</span>
          <div className="dossier-icon-wrap" aria-hidden="true">
            <IconBook size={18} />
          </div>
        </div>
        <h2 className="dossier-title">What is this portal?</h2>
        <div className="dossier-premise">Practical cyber defense grounded in Indian law</div>
        <p className="dossier-desc">
          A structured learning environment designed to build instinctive digital defense habits through real dilemmas and primary Indian legislation (Information Technology Act 2000, DPDP Act 2023, and Bharatiya Nyaya Sanhita 2023).
        </p>
        <div className="dossier-tag">
          <span>Statutory Authority • No Academic Rote</span>
        </div>
      </div>

      {/* Column 2: Why start with Your Digital Day */}
      <div className="first-visit-dossier-col dossier-accent-col">
        <div className="dossier-topline">
          <span className="dossier-kicker dossier-kicker-accent">§ 02 • BEHAVIORAL DIAGNOSTIC</span>
          <div className="dossier-icon-wrap dossier-icon-accent" aria-hidden="true">
            <IconCompass size={18} />
          </div>
        </div>
        <h2 className="dossier-title">Why start with Your Digital Day?</h2>
        <div className="dossier-premise">Measuring instinctive reactions under simulated pressure</div>
        <p className="dossier-desc">
          Instead of grading memorized clauses, this diagnostic simulates real-world messages, suspicious links, and urgent payment requests to evaluate your genuine responses across six discrete behavioral dimensions.
        </p>
        <div className="dossier-tag dossier-tag-accent">
          <span>6 Behavioral Metrics • Zero Synthetic Averages</span>
        </div>
      </div>

      {/* Column 3: What happens when you finish */}
      <div className="first-visit-dossier-col">
        <div className="dossier-topline">
          <span className="dossier-kicker">§ 03 • UNLOCKED PROGRESSION</span>
          <div className="dossier-icon-wrap" aria-hidden="true">
            <IconLayers size={18} />
          </div>
        </div>
        <h2 className="dossier-title">What happens when you finish?</h2>
        <div className="dossier-premise">A calibrated baseline and tailored defense pathways</div>
        <p className="dossier-desc">
          Your results establish your starting baseline. The portal immediately unlocks your targeted remediation pathways, the 12-chapter statutory curriculum codex, and 5 dedicated practice modes.
        </p>
        <div className="dossier-tag">
          <span>Tailored Codex • 5 Practice Modes</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Connected Editorial Sequence Track:
 * Replaces generic bordered container with a connected timeline track.
 */
function FirstVisitSequenceTrack() {
  return (
    <div className="first-visit-sequence-container" aria-label="First check sequence outline">
      <div className="sequence-header-block">
        <span className="sequence-top-tag">SEQUENCE TIMELINE • FIRST CHECK PREVIEW</span>
        <h3 className="sequence-main-heading">What to Expect During Your Digital Day</h3>
        <p className="sequence-sub-heading">
          Five minutes. Four everyday online situations. No legal preparation or tests required.
        </p>
      </div>

      <div className="sequence-connected-track">
        <div className="sequence-track-line" aria-hidden="true" />

        {/* Step 1 */}
        <div className="sequence-node-col">
          <div className="sequence-node-indicator">
            <span>01</span>
          </div>
          <span className="sequence-phase-badge">Phase 1 • Encounter</span>
          <h4 className="sequence-step-title">Everyday Digital Situations</h4>
          <p className="sequence-step-desc">
            Navigate realistic scenarios involving urgent utility SMS notices, package redirection links, and suspicious bank calls.
          </p>
        </div>

        {/* Step 2 */}
        <div className="sequence-node-col">
          <div className="sequence-node-indicator">
            <span>02</span>
          </div>
          <span className="sequence-phase-badge">Phase 2 • Response</span>
          <h4 className="sequence-step-title">React Instinctively</h4>
          <p className="sequence-step-desc">
            Choose how you would actually respond in your daily life. There are no trick questions, academic exams, or negative scoring traps.
          </p>
        </div>

        {/* Step 3 */}
        <div className="sequence-node-col">
          <div className="sequence-node-indicator">
            <span>03</span>
          </div>
          <span className="sequence-phase-badge">Phase 3 • Unlocking</span>
          <h4 className="sequence-step-title">Receive Your Habit Blueprint</h4>
          <p className="sequence-step-desc">
            Unlock your 6-dimension behavioral profile and receive a personalized curriculum pathway tailored to your specific defensive gaps.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * FirstVisitExperience Component
 * Phase 1.2: Refined visual quality for first-visit orientation.
 */
export default function FirstVisitExperience({
  displayName,
  hasActiveBaseline,
  activeBaselineStage,
  activeBaselineSessionId,
  hasExpiredSession,
  expiredSession,
  onViewFullStudio,
  showFullStudio
}) {
  const firstName = displayName ? displayName.split(' ')[0] : 'Learner';

  // Case C: Expired Inactive Session State
  if (!hasActiveBaseline && hasExpiredSession) {
    const stepsCompleted = expiredSession?.stagesCompleted || 0;

    return (
      <section className="first-visit-canvas" aria-labelledby="first-visit-heading">
        <div className="first-visit-hero">
          <div className="first-visit-expiry-banner">
            <span className="expiry-clock-icon" aria-hidden="true">
              <IconClock size={14} />
            </span>
            <span className="expiry-badge-text">
              Previous Session Concluded • Inactivity Window
            </span>
          </div>

          <span className="first-visit-eyebrow">
            Welcome back, {firstName} • Your Digital Day
          </span>

          <h1 id="first-visit-heading" className="first-visit-title">
            Ready for a fresh evaluation?
          </h1>

          <p className="first-visit-lead">
            Your earlier simulation concluded because it remained inactive for over 2 hours{stepsCompleted > 0 ? ` (after you completed ${stepsCompleted} step${stepsCompleted > 1 ? 's' : ''})` : ''}. Because simulations measure genuine, immediate habits in one sitting, each check runs in a dedicated window. Your prior responses remain securely logged in research records, and you can begin a clean, 5-minute First Check whenever you are ready.
          </p>

          {/* Action Row */}
          <div className="first-visit-cta-row">
            <Link
              to="/assessment/baseline"
              className="first-visit-primary-btn"
              aria-label="Start Fresh First Check: Your Digital Day assessment"
            >
              <span>Start Fresh First Check</span>
              <IconArrowRight size={16} />
            </Link>

            {onViewFullStudio && (
              <button
                type="button"
                onClick={onViewFullStudio}
                className="first-visit-secondary-btn"
                aria-expanded={showFullStudio}
              >
                {showFullStudio ? 'Hide Full Learning Studio ↑' : 'Explore Portal Resources First ↓'}
              </button>
            )}
          </div>

          <div className="first-visit-meta-row">
            <div className="first-visit-meta-item">
              <span className="meta-icon" aria-hidden="true">
                <IconClock size={15} />
              </span>
              <span>Takes approximately 5 minutes</span>
            </div>
            <div className="first-visit-meta-item">
              <span className="meta-icon" aria-hidden="true">
                <IconShield size={15} />
              </span>
              <span>Prior attempts recorded immutably</span>
            </div>
            <div className="first-visit-meta-item">
              <span className="meta-icon" aria-hidden="true">
                <IconTarget size={15} />
              </span>
              <span>Clean slate for calibrated baseline</span>
            </div>
          </div>
        </div>

        {/* Editorial Tripartite Dossier */}
        <FirstVisitTriadDossier />

        {/* Connected Sequence Track */}
        <FirstVisitSequenceTrack />
      </section>
    );
  }

  // Case B: Interrupted Session State
  if (hasActiveBaseline) {
    const stageOrder = activeBaselineStage?.stageOrder || 1;
    const stageTitle = activeBaselineStage?.title || 'Everyday Digital Dilemma';

    return (
      <section className="first-visit-canvas" aria-labelledby="first-visit-heading">
        <div className="first-visit-hero">
          <div className="first-visit-resumption-banner">
            <span className="resumption-pulse-dot" aria-hidden="true" />
            <span className="resumption-badge-text">
              Assessment In Progress • Step {stageOrder} of 4
            </span>
          </div>

          <span className="first-visit-eyebrow">
            Welcome back, {firstName} • Your Digital Day
          </span>

          <h1 id="first-visit-heading" className="first-visit-title">
            Pick up right where you left off.
          </h1>

          <p className="first-visit-lead">
            Your previous responses in <em>Your Digital Day</em> are safely saved. Continue your simulation to complete your baseline evaluation and unlock your tailored learning studio.
          </p>

          {/* Current Saved Step Card */}
          <div className="first-visit-stage-preview">
            <div className="stage-preview-header">
              <span className="stage-preview-num">Step {stageOrder}</span>
              <span className="stage-preview-name">{stageTitle}</span>
            </div>
            {activeBaselineStage?.description && (
              <p className="stage-preview-snippet">
                {activeBaselineStage.description.length > 140
                  ? activeBaselineStage.description.slice(0, 140) + '…'
                  : activeBaselineStage.description}
              </p>
            )}
          </div>

          {/* Action Row */}
          <div className="first-visit-cta-row">
            <Link
              to="/assessment/baseline"
              className="first-visit-primary-btn"
              aria-label={`Resume Your Digital Day from Step ${stageOrder}: ${stageTitle}`}
            >
              <span>Resume Your Digital Day</span>
              <IconArrowRight size={16} />
            </Link>

            {onViewFullStudio && (
              <button
                type="button"
                onClick={onViewFullStudio}
                className="first-visit-secondary-btn"
                aria-expanded={showFullStudio}
              >
                {showFullStudio ? 'Hide Full Learning Studio ↑' : 'Explore Portal Resources First ↓'}
              </button>
            )}
          </div>

          <div className="first-visit-meta-row">
            <div className="first-visit-meta-item">
              <span className="meta-icon" aria-hidden="true">
                <IconClock size={15} />
              </span>
              <span>~{Math.max(1, 5 - stageOrder)} minutes remaining</span>
            </div>
            <div className="first-visit-meta-item">
              <span className="meta-icon" aria-hidden="true">
                <IconShield size={15} />
              </span>
              <span>Previous choices preserved immutably</span>
            </div>
            <div className="first-visit-meta-item">
              <span className="meta-icon" aria-hidden="true">
                <IconTarget size={15} />
              </span>
              <span>No tests or legal knowledge required</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Case A: Fresh First-Time Visit (Assessment Not Started)
  return (
    <section className="first-visit-canvas" aria-labelledby="first-visit-heading">
      <div className="first-visit-hero">
        <span className="first-visit-eyebrow">
          Cyber Law Awareness Portal • Welcome, {firstName}
        </span>

        <h1 id="first-visit-heading" className="first-visit-title">
          How safe are your everyday digital decisions?
        </h1>

        <p className="first-visit-lead">
          You already make dozens of decisions online every day—handling urgent messages, unfamiliar links, delivery exceptions, and payment requests. Let's discover how you naturally respond under simulated pressure.
        </p>

        {/* Primary Action Row */}
        <div className="first-visit-cta-row">
          <Link
            to="/assessment/baseline"
            className="first-visit-primary-btn"
            aria-label="Start Your First Check: Your Digital Day assessment"
          >
            <span>Start Your First Check</span>
            <IconArrowRight size={16} />
          </Link>

          {onViewFullStudio && (
            <button
              type="button"
              onClick={onViewFullStudio}
              className="first-visit-secondary-btn"
              aria-expanded={showFullStudio}
            >
              {showFullStudio ? 'Hide Full Learning Studio ↑' : 'Prefer to explore the portal first? ↓'}
            </button>
          )}
        </div>

        {/* Supporting Meta Badges */}
        <div className="first-visit-meta-row">
          <div className="first-visit-meta-item">
            <span className="meta-icon" aria-hidden="true">
              <IconClock size={15} />
            </span>
            <span>Takes approximately 5 minutes</span>
          </div>
          <div className="first-visit-meta-item">
            <span className="meta-icon" aria-hidden="true">
              <IconShield size={15} />
            </span>
            <span>No legal knowledge or preparation needed</span>
          </div>
          <div className="first-visit-meta-item">
            <span className="meta-icon" aria-hidden="true">
              <IconTarget size={15} />
            </span>
            <span>Realistic everyday online situations</span>
          </div>
        </div>
      </div>

      {/* Editorial Tripartite Dossier */}
      <FirstVisitTriadDossier />

      {/* Connected Sequence Track */}
      <FirstVisitSequenceTrack />
    </section>
  );
}
