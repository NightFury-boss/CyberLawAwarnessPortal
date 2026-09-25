import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import PathwayRunner from '../components/PathwayRunner';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import PrimaryFocus from '../components/dashboard/PrimaryFocus';
import OrientationSummary from '../components/dashboard/OrientationSummary';
import LearningPracticeSection from '../components/dashboard/LearningPracticeSection';
import BehavioralEvolution from '../components/dashboard/BehavioralEvolution';
import DashboardHistory from '../components/dashboard/DashboardHistory';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePathwayForRunner, setActivePathwayForRunner] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prog, port, traj] = await Promise.all([
        api.getProgress(),
        api.getPortfolio().catch(() => null),
        api.getTrajectory().catch(() => null)
      ]);

      setProgress(prog);
      setPortfolioData(port);
      setTrajectoryData(traj);

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

  const completedPathwaysList = portfolioData?.interventions?.completedPathways || progress.completedPathways || [];
  const reinforcementsList = portfolioData?.interventions?.reinforcementsCompleted || progress.reinforcementsCompleted || [];
  const quizAttemptsList = portfolioData?.knowledgePractice?.quizAttempts || [];

  // Derive Pathway Recommendations Statuses using authoritative session linkage
  const recommendations = remediationData?.recommendations || [];
  const pathwaysWithStatus = recommendations.map(rec => {
    const completedRecord = completedPathwaysList.find(
      p => p.pathwayId === rec.pathwayId && (progress?.latestSessionId ? (p.sourceSessionId === progress.latestSessionId || p.sourceSessionId?._id === progress.latestSessionId) : true)
    );
    const isFullyCompleted = Boolean(completedRecord?.completedAt);
    const isInProgress = !isFullyCompleted && Boolean(completedRecord && (completedRecord.stepsCompleted?.caseStudy || completedRecord.stepsCompleted?.prevention));

    const reinforcementRecord = reinforcementsList.find(
      r => r.pathwayId === rec.pathwayId && (progress?.latestSessionId ? (r.sourceSessionId === progress.latestSessionId || r.sourceSessionId?._id === progress.latestSessionId) : true)
    );
    const isReinforced = Boolean(reinforcementRecord);
    const shiftState = rec.habitShiftState || rec.state;
    const isReinforcementEligible = hasFinal && (shiftState === 'continued_practice' || shiftState === 'emerging_gap');

    return {
      rec,
      isFullyCompleted,
      isInProgress,
      isReinforced,
      isReinforcementEligible,
      completedRecord,
      reinforcementRecord,
      shiftState
    };
  });

  const completedFocusCount = pathwaysWithStatus.filter(p => p.isFullyCompleted).length;
  const totalFocusCount = pathwaysWithStatus.length;

  // Next Action Selection based strictly on authoritative state
  const nextIncompletePathway = pathwaysWithStatus.find(p => !p.isFullyCompleted);
  const nextReinforcePathway = pathwaysWithStatus.find(p => p.isReinforcementEligible && !p.isReinforced);

  const handleLaunchRunner = (pathwayItem, isReinforce = false) => {
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
      />

      {/* ========================================================================= */}
      {/* SECTION B: DOMINANT PRIMARY LEARNING FOCUS PANEL                          */}
      {/* ========================================================================= */}
      <PrimaryFocus
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
        nextIncompletePathway={nextIncompletePathway}
        nextReinforcePathway={nextReinforcePathway}
        onLaunchRunner={handleLaunchRunner}
        completedFocusCount={completedFocusCount}
        totalFocusCount={totalFocusCount}
      />

      {/* ========================================================================= */}
      {/* SECTION C: COMPACT ORIENTATION METRICS SUMMARY                            */}
      {/* ========================================================================= */}
      <OrientationSummary
        completedFocusCount={completedFocusCount}
        quizAttemptsCount={quizAttemptsList.length}
        hasBaseline={hasBaseline}
        hasFinal={hasFinal}
        hasTrajectoryReassessment={hasTrajectoryReassessment}
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
        onLaunchRunner={handleLaunchRunner}
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

    </div>
  );
}

export default Dashboard;
