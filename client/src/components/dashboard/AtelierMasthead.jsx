import React from 'react';
import { selectJourneyStage } from '../../utils/dashboardJourneySelectors.js';

/**
 * AtelierMasthead Component — Editorial Opening & Learning Journey Map
 * 
 * Philosophy:
 * - High-credibility, magazine-style masthead for Indian Cyber Law education.
 * - An integrated 4-Stage Learning Journey Map showing the relationship between First Check,
 *   Curriculum Lessons & Pathways, Final Check, and Longitudinal Defensive Evolution.
 * - Integrated 4-pillar Orientation Ledger unifying curriculum, pathways, quizzes, and concept practice.
 * - Direct trigger for the certified Defensive Portfolio / Verified Learning Record.
 * - Fully neutral, self-paced, learner-initiated practice presentation (zero scheduling/overdue pressure).
 */
export default function AtelierMasthead({
  displayName,
  hasBaseline,
  hasFinal,
  nextReinforcePathway,
  hasTrajectoryReassessment,
  completedFocusCount = 0,
  totalFocusCount = 0,
  lessonsCompletedCount = 0,
  totalLessonsCount = 0,
  quizAttemptsCount = 0,
  completedRecallCount = 0,
  passedRecallCount = 0,
  conceptRecallCount = 0,
  dueRecallCount = 0, // Backward-compatibility fallback
  onOpenPortfolioModal
}) {
  const stage = selectJourneyStage({
    hasBaseline,
    hasFinal,
    hasTrajectoryReassessment,
    hasReinforceEligible: Boolean(nextReinforcePathway),
    completedFocusCount,
    totalFocusCount
  });

  // Calculate 4 canonical journey stage states
  const getStageState = (stageNum) => {
    switch (stageNum) {
      case 1: // First Check (Baseline Diagnostic)
        if (hasBaseline) {
          return {
            status: 'done',
            badge: 'Completed',
            summary: 'Initial diagnostic simulation completed. 6 behavioral dimensions established.'
          };
        }
        return {
          status: 'current',
          badge: 'First Step',
          summary: 'Simulated digital day to diagnose behavioral instincts and discover blindspots.'
        };

      case 2: // Lessons & Targeted Pathways
        if (!hasBaseline) {
          return {
            status: 'upcoming',
            badge: 'Upcoming',
            summary: 'Unlocks after completing your First Check diagnostic.'
          };
        }
        const pathwaysDone = totalFocusCount > 0 && completedFocusCount >= totalFocusCount;
        const lessonsDone = totalLessonsCount > 0 && lessonsCompletedCount >= totalLessonsCount;
        if (pathwaysDone && lessonsDone) {
          return {
            status: 'done',
            badge: 'Completed',
            summary: `All ${totalLessonsCount} curriculum chapters read and ${completedFocusCount} coaching pathways completed.`
          };
        }
        const chaptersTotal = totalLessonsCount > 0 ? totalLessonsCount : 'synchronizing';
        return {
          status: 'current',
          badge: 'Active Focus',
          summary: totalFocusCount > 0
            ? `${completedFocusCount} of ${totalFocusCount} coaching pathways completed • ${lessonsCompletedCount} of ${chaptersTotal} chapters read.`
            : `${lessonsCompletedCount} of ${chaptersTotal} chapters read • Coaching pathways curating.`
        };

      case 3: // Final Check (Longitudinal Benchmark)
        if (!hasBaseline) {
          return {
            status: 'upcoming',
            badge: 'Locked',
            summary: 'Requires First Check and coaching pathways.'
          };
        }
        if (hasFinal) {
          return {
            status: 'done',
            badge: 'Completed',
            summary: 'Post-learning benchmark complete. Decision shifts under pressure verified.'
          };
        }
        if (totalFocusCount > 0 && completedFocusCount >= totalFocusCount) {
          return {
            status: 'current',
            badge: 'Ready to Begin',
            summary: 'All recommended safety lessons complete. Ready to benchmark your decision improvements.'
          };
        }
        return {
          status: 'upcoming',
          badge: 'Requires Pathways',
          summary: 'Complete your recommended safety lessons before benchmarking.'
        };

      case 4: // Longitudinal Growth & Verified Portfolio
        if (hasFinal) {
          return {
            status: 'current',
            badge: hasTrajectoryReassessment ? 'Verified Record' : 'Active Growth',
            summary: 'Longitudinal decision evolution active. Verified Defensive Learning Portfolio ready.'
          };
        }
        return {
          status: 'upcoming',
          badge: 'Future Stage',
          summary: 'Six-dimension behavioral comparison and verified learning record.'
        };

      default:
        return { status: 'upcoming', badge: 'Pending', summary: '' };
    }
  };

  const stage1 = getStageState(1);
  const stage2 = getStageState(2);
  const stage3 = getStageState(3);
  const stage4 = getStageState(4);

  const getStageTagClass = () => {
    if (!hasBaseline) return 'atelier-stage-pill attention';
    if (hasFinal) return 'atelier-stage-pill complete';
    return 'atelier-stage-pill';
  };

  return (
    <header className="atelier-masthead" aria-label="Learner dashboard masthead">
      {/* Topline: Identity & Stage Tag */}
      <div className="atelier-masthead-topline">
        <div className="atelier-edition-badge">
          <span>Cyber Law Awareness Portal</span>
          <span className="edition-dot" aria-hidden="true">•</span>
          <span>Personal Learning Workspace</span>
          <span className="edition-dot" aria-hidden="true">•</span>
          <span>Indian Statutory Defense</span>
        </div>
        <div className={getStageTagClass()} aria-label={`Current stage: ${stage.stageLabel}`}>
          {stage.stageLabel}
        </div>
      </div>

      {/* Hero: Editorial Intro & Verified Portfolio Action */}
      <div className="atelier-masthead-hero">
        <div className="atelier-hero-text">
          <h1>
            {displayName ? `Welcome to your learning desk, ${displayName}.` : 'Your Personal Learning Journal'}
          </h1>
          <p>
            {stage.message}
          </p>

          {onOpenPortfolioModal && (
            <button
              type="button"
              onClick={onOpenPortfolioModal}
              className="atelier-portfolio-trigger print-hidden"
              aria-label="View and print your verified learning record"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <span>Verified Learning Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Redesigned 4-Stage Learning Journey Map (Structured Editorial Timeline) */}
      <section className="atelier-journey-track" aria-label="Four core learning stages of your defense progression">
        <div className="atelier-journey-track-header">
          <span className="atelier-journey-eyebrow">Learning Milestones</span>
          <span className="atelier-journey-sub">Four-stage progressive mastery of Indian cyber law &amp; defense</span>
        </div>

        <div className="atelier-journey-stages">
          {/* Stage 1: First Check */}
          <div className={`atelier-journey-step is-${stage1.status}`} aria-current={stage1.status === 'current' ? 'step' : undefined}>
            <div className="journey-step-indicator">
              <span className="journey-step-num">{stage1.status === 'done' ? '✓' : '1'}</span>
            </div>
            <div className="journey-step-content">
              <div className="journey-step-top">
                <span className="journey-step-title">First Check (Diagnostic)</span>
                <span className={`journey-step-badge badge-${stage1.status}`}>{stage1.badge}</span>
              </div>
              <p className="journey-step-desc">{stage1.summary}</p>
            </div>
          </div>

          {/* Step Connector 1 -> 2 */}
          <div className={`journey-step-connector ${stage1.status === 'done' ? 'is-complete' : ''}`} aria-hidden="true"></div>

          {/* Stage 2: Lessons & Pathways */}
          <div className={`atelier-journey-step is-${stage2.status}`} aria-current={stage2.status === 'current' ? 'step' : undefined}>
            <div className="journey-step-indicator">
              <span className="journey-step-num">{stage2.status === 'done' ? '✓' : '2'}</span>
            </div>
            <div className="journey-step-content">
              <div className="journey-step-top">
                <span className="journey-step-title">Lessons &amp; Pathways</span>
                <span className={`journey-step-badge badge-${stage2.status}`}>{stage2.badge}</span>
              </div>
              <p className="journey-step-desc">{stage2.summary}</p>
            </div>
          </div>

          {/* Step Connector 2 -> 3 */}
          <div className={`journey-step-connector ${stage2.status === 'done' ? 'is-complete' : ''}`} aria-hidden="true"></div>

          {/* Stage 3: Final Check */}
          <div className={`atelier-journey-step is-${stage3.status}`} aria-current={stage3.status === 'current' ? 'step' : undefined}>
            <div className="journey-step-indicator">
              <span className="journey-step-num">{stage3.status === 'done' ? '✓' : '3'}</span>
            </div>
            <div className="journey-step-content">
              <div className="journey-step-top">
                <span className="journey-step-title">Final Check (Benchmark)</span>
                <span className={`journey-step-badge badge-${stage3.status}`}>{stage3.badge}</span>
              </div>
              <p className="journey-step-desc">{stage3.summary}</p>
            </div>
          </div>

          {/* Step Connector 3 -> 4 */}
          <div className={`journey-step-connector ${stage3.status === 'done' ? 'is-complete' : ''}`} aria-hidden="true"></div>

          {/* Stage 4: Longitudinal Growth */}
          <div className={`atelier-journey-step is-${stage4.status}`} aria-current={stage4.status === 'current' ? 'step' : undefined}>
            <div className="journey-step-indicator">
              <span className="journey-step-num">{stage4.status === 'done' ? '✓' : '4'}</span>
            </div>
            <div className="journey-step-content">
              <div className="journey-step-top">
                <span className="journey-step-title">Defensive Habits &amp; Portfolio</span>
                <span className={`journey-step-badge badge-${stage4.status}`}>{stage4.badge}</span>
              </div>
              <p className="journey-step-desc">{stage4.summary}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Orientation Ledger (4 Distinct Balanced Columns) */}
      <div className="atelier-orientation-ledger" aria-label="Orientation metrics summary">
        <div className="ledger-column">
          <span className="ledger-label">Curriculum Lessons</span>
          <span className="ledger-value">
            {totalLessonsCount > 0 ? (
              <>
                {lessonsCompletedCount} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #8A8075)', fontWeight: 500 }}>/ {totalLessonsCount}</span>
              </>
            ) : (
              <span style={{ fontSize: '1rem', color: 'var(--color-text-muted, #8A8075)' }}>—</span>
            )}
          </span>
          <span className="ledger-sub">
            {totalLessonsCount > 0
              ? (lessonsCompletedCount >= totalLessonsCount
                  ? 'All chapters read'
                  : `${totalLessonsCount - lessonsCompletedCount} chapters remaining`)
              : 'Synchronizing catalog…'}
          </span>
        </div>

        <div className="ledger-column">
          <span className="ledger-label">Targeted Pathways</span>
          <span className="ledger-value">
            {hasBaseline ? (totalFocusCount > 0 ? `${completedFocusCount} / ${totalFocusCount}` : '—') : '—'}
          </span>
          <span className="ledger-sub">
            {hasBaseline 
              ? (totalFocusCount > 0
                  ? (completedFocusCount >= totalFocusCount ? 'All pathways completed' : 'Personalized coaching')
                  : 'Curating pathways…')
              : 'Requires First Check'}
          </span>
        </div>

        <div className="ledger-column">
          <span className="ledger-label">Statutory Quizzes</span>
          <span className="ledger-value">
            {quizAttemptsCount} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #8A8075)', fontWeight: 500 }}>taken</span>
          </span>
          <span className="ledger-sub">
            5 dedicated practice modes
          </span>
        </div>

        <div className="ledger-column">
          <span className="ledger-label">Concept Revision</span>
          <span className="ledger-value">
            {completedRecallCount > 0 ? (
              <span>{completedRecallCount} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted, #8A8075)', fontWeight: 500 }}>completed</span></span>
            ) : (
              <span style={{ color: 'var(--color-accent-terracotta, #9A503A)', fontSize: '1.05rem', fontWeight: 600 }}>Self-Paced</span>
            )}
          </span>
          <span className="ledger-sub">
            {passedRecallCount > 0 ? `${passedRecallCount} passed checks` : 'Optional concept revision'}
          </span>
        </div>
      </div>
    </header>
  );
}
