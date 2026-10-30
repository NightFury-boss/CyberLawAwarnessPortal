import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import PathwayRunner from '../components/PathwayRunner';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import PrimaryFocus from '../components/dashboard/PrimaryFocus';
import OrientationSummary from '../components/dashboard/OrientationSummary';
import LearningPracticeSection from '../components/dashboard/LearningPracticeSection';
import BehavioralEvolution from '../components/dashboard/BehavioralEvolution';
import DashboardHistory from '../components/dashboard/DashboardHistory';
import DefensivePortfolioModal from '../components/dashboard/DefensivePortfolioModal';
import SpacedRetrievalModal from '../components/dashboard/SpacedRetrievalModal';
import { selectAuthoritativeRecallCounts } from '../utils/evidenceSelectors';

/**
 * Dashboard Page Container — A Quiet Personal Learning Desk
 * 
 * Core Mandates:
 * 1. Where am I in my learning journey?
 * 2. What deserves my attention next?
 * 3. What have I practiced recently?
 * 4. How am I changing over time?
 * 
 * Architectural Integrity:
 * - Coordinates authoritative data from progress, portfolio, trajectory, and remediation endpoints.
 * - Does NOT calculate alternative client-side scores or classifications.
 * - Preserves discrete 6 behavioral dimensions with canonical "Unreviewed Acceptance Control".
 * - NO composite "Cyber Awareness Score" or gamified decorations.
 * - Preserves PathwayRunner modal runner integration.
 */
function Dashboard({ user, progressTrigger }) {
  const [progress, setProgress] = useState(null);
  const [remediationData, setRemediationData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [dueSpacedReviews, setDueSpacedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePathwayForRunner, setActivePathwayForRunner] = useState(null);
  const [activeSpacedModal, setActiveSpacedModal] = useState(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioInitialPillar, setPortfolioInitialPillar] = useState(null);

  const handleOpenPortfolioModal = (target = null) => {
    setPortfolioInitialPillar(typeof target === 'string' ? target : null);
    setIsPortfolioModalOpen(true);
  };

  const handleClosePortfolioModal = () => {
    setIsPortfolioModalOpen(false);
    setPortfolioInitialPillar(null);
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prog, port, traj, spacedRes] = await Promise.all([
        api.getProgress(),
        api.getPortfolio().catch(() => null),
        api.getTrajectory().catch(() => null),
        api.getDueSpacedRetrievals().catch(() => ({ dueReviews: [] }))
      ]);

      setProgress(prog);
      setPortfolioData(port);
      setTrajectoryData(traj);
      setDueSpacedReviews(spacedRes?.dueReviews || []);

      if (prog?.latestSessionId) {
        try {
          const rem = await api.getAssessmentRemediation(prog.latestSessionId);
          setRemediationData(rem);
        } catch (re) {
          // Non-blocking: recommendations may be pending completion of diagnostic
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load your learning space.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [user, progressTrigger, fetchDashboardData]);

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div className="desk-space page-entry" style={{ padding: 'var(--space-xxl) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Opening your personal learning space...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="desk-space page-entry" style={{ padding: 'var(--space-xl) 0' }}>
        <div className="alert alert-error" role="alert">{error}</div>
      </div>
    );
  }

  if (!progress) return null;

  const hasBaseline = progress.baselineScore !== null;
  const hasFinal = progress.finalScore !== null;
  const hasTrajectoryReassessment = Boolean(trajectoryData?.hasReassessment);

  // Server-authoritative pathway records: progress.completedPathways carries all active stepsCompleted states
  const completedPathwaysList = progress?.completedPathways || portfolioData?.interventions?.completedPathways || [];
  const userPathwaysRecords = completedPathwaysList;
  const reinforcementsList = progress?.reinforcementsCompleted || portfolioData?.interventions?.reinforcementsCompleted || [];
  const quizAttemptsList = portfolioData?.knowledgePractice?.quizAttempts || [];

  // Derive Pathway Recommendations Statuses using authoritative session linkage
  const recommendations = remediationData?.recommendations || [];
  const pathwaysWithStatus = recommendations.map(rec => {
    if (!rec || !rec.pathwayId) {
      return {
        rec: null,
        isFullyCompleted: false,
        isInProgress: false,
        isReinforced: false,
        isReinforcementEligible: false,
        completedRecord: null,
        reinforcementRecord: null,
        shiftState: null
      };
    }

    const completedRecord = userPathwaysRecords.find(
      p => p.pathwayId === rec.pathwayId && (progress?.latestSessionId ? (String(p.sourceSessionId?._id || p.sourceSessionId) === String(progress.latestSessionId)) : true)
    );
    const isFullyCompleted = Boolean(completedRecord?.completedAt);
    const isInProgress = !isFullyCompleted && Boolean(completedRecord && (completedRecord.stepsCompleted?.caseStudy || completedRecord.stepsCompleted?.prevention));

    const reinforcementRecord = reinforcementsList.find(
      r => r.pathwayId === rec.pathwayId && (progress?.latestSessionId ? (r.sourceSessionId === progress.latestSessionId || r.sourceSessionId?._id === progress.latestSessionId) : true)
    );
    const isReinforced = Boolean(reinforcementRecord);
    const shiftState = rec.habitShiftState || rec.state;
    const isReinforcementEligible = hasFinal && (shiftState === 'continued_practice' || shiftState === 'emerging_gap');
    const isSpacedRetrievalDue = dueSpacedReviews.some(dr => dr.pathwayId === rec.pathwayId);

    return {
      rec,
      isFullyCompleted,
      isInProgress,
      isReinforced,
      isReinforcementEligible,
      isSpacedRetrievalDue,
      completedRecord,
      reinforcementRecord,
      shiftState
    };
  });

  const completedFocusCount = pathwaysWithStatus.filter(p => p.isFullyCompleted).length;
  const totalFocusCount = pathwaysWithStatus.length;

  // Authoritative recall review counts derived via calibrated evidence selector
  const { completedRecallCount, passedRecallCount } = selectAuthoritativeRecallCounts({
    portfolioData,
    progress
  });

  // Next Action Selection based strictly on authoritative state
  const nextIncompletePathway = pathwaysWithStatus.find(p => !p.isFullyCompleted);
  const nextReinforcePathway = pathwaysWithStatus.find(p => p.isReinforcementEligible && !p.isReinforced);

  const handleLaunchSpacedRetrieval = (itemOrDue) => {
    const pathwayId = itemOrDue.pathwayId || itemOrDue.rec?.pathwayId;
    const sourceSessionId = itemOrDue.sourceSessionId || itemOrDue.completedRecord?.sourceSessionId || progress?.latestSessionId;
    if (!pathwayId) return;
    setActiveSpacedModal({
      pathwayId,
      sourceSessionId
    });
  };

  const handleLaunchRunner = (pathwayItem, isReinforce = false) => {
    if (!progress?.latestSessionId) {
      setError('To start a lesson, please complete your First Check first so we can personalize your learning.');
      return;
    }
    if (!pathwayItem?.rec?.pathwayId) {
      setError('This lesson could not be opened right now. Please refresh the page or try again in a moment.');
      return;
    }

    setActivePathwayForRunner({
      pathway: pathwayItem.rec,
      sourceSessionId: progress.latestSessionId,
      initialProgress: {
        completedAt: pathwayItem.completedRecord?.completedAt || null,
        stepsCompleted: pathwayItem.completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false },
        isReinforced: pathwayItem.isReinforced,
        checkpointScore: pathwayItem.completedRecord?.checkpointScore || null
      },
      isReinforcementMode: isReinforce
    });
  };

  // Derive display name from authenticated user or progress
  const fullName = user?.name || user?.fullName || progress?.fullName || '';
  const firstName = fullName ? fullName.split(' ')[0] : 'Learner';

  return (
    <div className="desk-space page-entry">

      {/* ========================================================================= */}
      {/* SECTION A: EDITORIAL HEADER & CONCEPTUAL ORIENTATION TRACK                */}
      {/* ========================================================================= */}
      <DashboardHeader
        displayName={firstName}
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
        nextReinforcePathway={nextReinforcePathway}
        hasTrajectoryReassessment={hasTrajectoryReassessment}
        completedFocusCount={completedFocusCount}
        totalFocusCount={totalFocusCount}
        onOpenPortfolioModal={() => handleOpenPortfolioModal()}
      />

      {/* ========================================================================= */}
      {/* SECTION B: DOMINANT PRIMARY LEARNING FOCUS PANEL                          */}
      {/* ========================================================================= */}
      <PrimaryFocus
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
        pathwaysWithStatus={pathwaysWithStatus}
        dueSpacedReviews={dueSpacedReviews}
        completedFocusCount={completedFocusCount}
        totalFocusCount={totalFocusCount}
        nextIncompletePathway={nextIncompletePathway}
        nextReinforcePathway={nextReinforcePathway}
        onLaunchRunner={handleLaunchRunner}
        onLaunchSpacedRetrieval={handleLaunchSpacedRetrieval}
        onOpenPortfolioModal={() => handleOpenPortfolioModal()}
      />

      {/* ========================================================================= */}
      {/* SECTION C: COMPACT ORIENTATION METRICS SUMMARY                            */}
      {/* ========================================================================= */}
      <OrientationSummary
        completedFocusCount={completedFocusCount}
        totalFocusCount={totalFocusCount}
        quizAttemptsCount={quizAttemptsList.length}
        completedRecallCount={completedRecallCount}
        passedRecallCount={passedRecallCount}
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
        hasTrajectoryReassessment={hasTrajectoryReassessment}
        hasReinforceEligible={Boolean(nextReinforcePathway)}
        onOpenPortfolioModal={handleOpenPortfolioModal}
      />

      {/* ========================================================================= */}
      {/* SECTION D: TWO CALM COLUMNS (LEARNING + PRACTICE) & RECENT EVENTS         */}
      {/* ========================================================================= */}
      <LearningPracticeSection
        hasBaseline={hasBaseline}
        pathwaysWithStatus={pathwaysWithStatus}
        quizAttemptsList={quizAttemptsList}
        completedPathwaysList={completedPathwaysList}
        reinforcementsList={reinforcementsList}
        spacedReviewsList={progress?.spacedReviews || []}
        dueSpacedReviews={dueSpacedReviews}
        onLaunchRunner={handleLaunchRunner}
        onLaunchSpacedRetrieval={handleLaunchSpacedRetrieval}
        completedFocusCount={completedFocusCount}
        totalFocusCount={totalFocusCount}
      />

      {/* ========================================================================= */}
      {/* SECTION E: HOW YOU'RE CHANGING (6 DISCRETE DIMENSIONS & RESTITUTED ANCHOR)*/}
      {/* ========================================================================= */}
      <BehavioralEvolution
        trajectoryData={trajectoryData}
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
      />

      {/* ========================================================================= */}
      {/* SECTION F: PROGRESSIVE DISCLOSURE FOR SESSION HISTORY & METHODOLOGY       */}
      {/* ========================================================================= */}
      <DashboardHistory
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
        hasTrajectoryReassessment={hasTrajectoryReassessment}
        portfolioData={portfolioData}
        trajectoryData={trajectoryData}
      />

      {/* Micro-learning PathwayRunner Modal */}
      {activePathwayForRunner && (
        <PathwayRunner
          pathway={activePathwayForRunner.pathway}
          sourceSessionId={activePathwayForRunner.sourceSessionId}
          initialProgress={activePathwayForRunner.initialProgress}
          isReinforcementMode={activePathwayForRunner.isReinforcementMode}
          onClose={() => setActivePathwayForRunner(null)}
          onPathwayCompleted={() => {
            fetchDashboardData();
            setActivePathwayForRunner(null);
          }}
        />
      )}

      {/* Spaced Retrieval & Follow-Up Learning Modal */}
      {activeSpacedModal && (
        <SpacedRetrievalModal
          isOpen={Boolean(activeSpacedModal)}
          onClose={() => {
            const wasCompleted = Boolean(activeSpacedModal?.completed);
            setActiveSpacedModal(null);

            if (wasCompleted) {
              fetchDashboardData();
            }
          }}
          pathwayId={activeSpacedModal.pathwayId}
          sourceSessionId={activeSpacedModal.sourceSessionId}
          onReviewCompleted={() => {
            setActiveSpacedModal(prev => (prev ? { ...prev, completed: true } : null));
          }}
        />
      )}

      {/* Authoritative Three-Pillar Defensive Portfolio Record & Printable Statement */}
      <DefensivePortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={handleClosePortfolioModal}
        user={user}
        progress={progress}
        portfolioData={portfolioData}
        trajectoryData={trajectoryData}
        initialPillar={portfolioInitialPillar}
      />

    </div>
  );
}

export default Dashboard;
