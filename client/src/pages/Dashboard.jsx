import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import PathwayRunner from '../components/PathwayRunner';
import FirstVisitExperience from '../components/dashboard/FirstVisitExperience';
import AtelierMasthead from '../components/dashboard/AtelierMasthead';
import PrimaryFocus from '../components/dashboard/PrimaryFocus';
import DigitalMomentsStorySection from '../components/dashboard/DigitalMomentsStorySection';
import CurriculumLessonsSection from '../components/dashboard/CurriculumLessonsSection';
import { TargetedInterventionsPanel, RecentActivityStream } from '../components/dashboard/LearningPracticeSection';
import DashboardQuizPractice from '../components/dashboard/DashboardQuizPractice';
import BehavioralEvolution from '../components/dashboard/BehavioralEvolution';
import DashboardHistory from '../components/dashboard/DashboardHistory';
import DefensivePortfolioModal from '../components/dashboard/DefensivePortfolioModal';
import SpacedRetrievalModal from '../components/dashboard/SpacedRetrievalModal';
import QuizRecallModal from '../components/dashboard/QuizRecallModal';
import { selectAuthoritativeRecallCounts } from '../utils/evidenceSelectors';

/**
 * Dashboard Page Container — Personal Learning Workspace
 * 
 * Architecture & Design Philosophy:
 * - Editorial masthead with integrated 4-pillar orientation ledger and 5-step macro compass.
 * - Primary Focus "Study Dossier" providing unambiguous next-step clarity across all 11 states.
 * - Dynamic Two-Column Learning Studio:
 *     Left: Structured Curriculum Lessons & Targeted Diagnostic Pathways
 *     Right: Practice Studio (5 Quiz Modes & Due Recall Alert) & Recent Activity Stream
 * - Full-Width Behavioral Evolution Studio preserving the 6 canonical dimensions without synthetic averaging.
 * - Archival Methodology & Session History Drawer.
 * - Zero composite gamified scores; strict server-side grading and version isolation.
 */
function Dashboard({ user, progressTrigger }) {
  const [progress, setProgress] = useState(null);
  const [remediationData, setRemediationData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [dueSpacedReviews, setDueSpacedReviews] = useState([]);
  const [quizHistoryData, setQuizHistoryData] = useState(null);
  const [dueQuizRecalls, setDueQuizRecalls] = useState([]);
  const [isQuizRecallModalOpen, setIsQuizRecallModalOpen] = useState(false);
  const [baselineStatus, setBaselineStatus] = useState(null);
  const [showFullStudio, setShowFullStudio] = useState(false);
  const [loadState, setLoadState] = useState('LOADING'); // 'LOADING' | 'RESOLVED' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
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
    setLoadState('LOADING');
    setErrorMessage('');
    try {
      // 1. Authoritative identity and assessment status checks MUST succeed.
      // If either fails due to network/server failure, we MUST NOT assume the learner is new or has completed anything.
      const [prog, baseStatus] = await Promise.all([
        api.getProgress(),
        api.getAssessmentStatus('baseline')
      ]);

      // 2. Secondary enrichment data (portfolio, trajectory, recalls, etc.) may degrade gracefully
      const [port, traj, spacedRes, quizHistRes, quizRecallRes] = await Promise.all([
        api.getPortfolio().catch(() => null),
        api.getTrajectory().catch(() => null),
        api.getDueSpacedRetrievals().catch(() => ({ dueReviews: [] })),
        api.getQuizHistory().catch(() => null),
        api.getDueQuizRecalls().catch(() => ({ dueItems: [], totalDue: 0 }))
      ]);

      setProgress(prog);
      setBaselineStatus(baseStatus);
      setPortfolioData(port);
      setTrajectoryData(traj);
      setDueSpacedReviews(spacedRes?.dueReviews || []);
      setQuizHistoryData(quizHistRes);
      setDueQuizRecalls(quizRecallRes?.dueItems || []);

      if (prog?.latestSessionId) {
        try {
          const rem = await api.getAssessmentRemediation(prog.latestSessionId);
          setRemediationData(rem);
        } catch (_re) {
          // Non-blocking: recommendations may be pending completion of diagnostic
        }
      }

      setLoadState('RESOLVED');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to the learning portal. Please check your network connection.');
      setLoadState('ERROR');
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [user, progressTrigger, fetchDashboardData]);

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (loadState === 'LOADING') {
    return (
      <div className="desk-space-redesign page-entry" style={{ padding: 'var(--space-3xl, 64px) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary, #56565c)', fontSize: '0.95rem' }}>
          Opening your personal learning workspace...
        </p>
      </div>
    );
  }

  if (loadState === 'ERROR') {
    const learnerName = user?.name || user?.fullName || 'Learner';
    return (
      <div className="desk-space-redesign page-entry" style={{ padding: 'var(--space-xl, 32px) 20px' }}>
        <div className="dashboard-retry-card" style={{
          maxWidth: '560px',
          margin: '48px auto',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(12, 29, 46, 0.12)',
          borderRadius: '12px',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(12, 29, 46, 0.04)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }} aria-hidden="true">📡</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7a8898', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
            Connection Interruption • {learnerName}
          </span>
          <h2 style={{ fontSize: '1.28rem', color: '#0c1d2e', margin: '0 0 12px 0', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Unable to verify your learning progress
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#52606d', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            We could not reach the server to synchronize your session data. Your authenticated account and historical learning records remain secure.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="first-visit-primary-btn"
              style={{ padding: '10px 24px', minHeight: '42px', fontSize: '0.92rem', cursor: 'pointer' }}
            >
              Retry Connection
            </button>
          </div>
          {errorMessage && (
            <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Notice: {errorMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loadState !== 'RESOLVED' || !progress) return null;

  const hasBaseline = progress.baselineScore !== null || Boolean(baselineStatus?.hasCompletedSession);
  const hasFinal = progress.finalScore !== null;
  const hasActiveBaseline = Boolean(baselineStatus?.hasActiveSession && baselineStatus?.stage);
  const activeBaselineStage = baselineStatus?.stage || null;
  const activeBaselineSessionId = baselineStatus?.sessionId || null;
  const hasExpiredBaseline = Boolean(baselineStatus?.hasExpiredSession);
  const expiredBaselineSession = baselineStatus?.expiredSession || null;
  const hasTrajectoryReassessment = Boolean(trajectoryData?.hasReassessment);

  // Server-authoritative pathway records
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

  // Total due recall count combines due quiz recalls and due spaced reviews
  const totalDueRecallCount = (dueQuizRecalls?.length || 0) + (dueSpacedReviews?.length || 0);

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
      setError('To start a pathway, please complete your First Check first so we can personalize your learning.');
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

  const fullName = user?.name || user?.fullName || progress?.fullName || '';
  const firstName = fullName ? fullName.split(' ')[0] : 'Learner';

  return (
    <div className="atelier-dashboard-canvas desk-space-redesign page-entry">

      {/* ========================================================================= */}
      {/* 1. DIVERGENT EXPERIENCE: FIRST-TIME LEARNER ORIENTATION VS. ESTABLISHED   */}
      {/* ========================================================================= */}
      {!hasBaseline ? (
        <>
          {/* Phase 1: Dedicated First-Visit Orientation Experience */}
          <FirstVisitExperience
            displayName={firstName}
            hasActiveBaseline={hasActiveBaseline}
            activeBaselineStage={activeBaselineStage}
            activeBaselineSessionId={activeBaselineSessionId}
            hasExpiredSession={hasExpiredBaseline}
            expiredSession={expiredBaselineSession}
            onViewFullStudio={() => setShowFullStudio(prev => !prev)}
            showFullStudio={showFullStudio}
          />

          {/* Progressive Disclosure: Learner elects to explore complete studio before First Check */}
          {showFullStudio && (
            <div className="first-visit-studio-reveal" style={{ marginTop: '36px' }}>
              <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(12, 29, 46, 0.1)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7a8898', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Full Learning Studio • Library &amp; Modules Overview
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullStudio(false)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Collapse Full Studio ↑
                </button>
              </div>

              {/* Atelier Masthead & Metrics */}
              <AtelierMasthead
                displayName={firstName}
                hasBaseline={hasBaseline}
                hasFinal={hasFinal}
                nextReinforcePathway={nextReinforcePathway}
                hasTrajectoryReassessment={hasTrajectoryReassessment}
                completedFocusCount={completedFocusCount}
                totalFocusCount={totalFocusCount}
                lessonsCompletedCount={progress?.lessons?.completedCount ?? (progress?.completedModules?.length || 0)}
                totalLessonsCount={progress?.lessons?.totalPublished ?? 12}
                quizAttemptsCount={quizAttemptsList.length}
                completedRecallCount={completedRecallCount}
                passedRecallCount={passedRecallCount}
                dueRecallCount={totalDueRecallCount}
                onOpenPortfolioModal={() => handleOpenPortfolioModal()}
              />

              {/* Editorial Threat Deconstruction */}
              <DigitalMomentsStorySection />

              {/* Central Studio Grid */}
              <div className="atelier-studio-grid desk-studio-grid">
                <div className="atelier-column desk-studio-panel">
                  <CurriculumLessonsSection
                    lessonsData={progress?.lessons}
                    isWorkspace={true}
                  />
                  <TargetedInterventionsPanel
                    hasBaseline={hasBaseline}
                    pathwaysWithStatus={pathwaysWithStatus}
                    dueSpacedReviews={dueSpacedReviews}
                    onLaunchRunner={handleLaunchRunner}
                    onLaunchSpacedRetrieval={handleLaunchSpacedRetrieval}
                    completedFocusCount={completedFocusCount}
                    totalFocusCount={totalFocusCount}
                  />
                </div>
                <div className="atelier-column desk-studio-panel">
                  <DashboardQuizPractice
                    quizHistoryData={quizHistoryData}
                    dueRecallsCount={dueQuizRecalls.length}
                    onLaunchQuizRecall={() => setIsQuizRecallModalOpen(true)}
                  />
                  <RecentActivityStream
                    completedPathwaysList={completedPathwaysList}
                    reinforcementsList={reinforcementsList}
                    quizAttemptsList={quizAttemptsList}
                    spacedReviewsList={progress?.spacedReviews || []}
                  />
                </div>
              </div>

              {/* Behavioral Habit Blueprint & History */}
              <BehavioralEvolution
                trajectoryData={trajectoryData}
                hasBaseline={hasBaseline}
                hasFinal={hasFinal}
              />
              <DashboardHistory
                hasBaseline={hasBaseline}
                hasFinal={hasFinal}
                hasTrajectoryReassessment={hasTrajectoryReassessment}
                portfolioData={portfolioData}
                trajectoryData={trajectoryData}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Established Learner: Full Atelier Personal Study Journal */}
          <AtelierMasthead

displayName={firstName}
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
            nextReinforcePathway={nextReinforcePathway}
            hasTrajectoryReassessment={hasTrajectoryReassessment}
            completedFocusCount={completedFocusCount}
            totalFocusCount={totalFocusCount}
            lessonsCompletedCount={progress?.lessons?.completedCount ?? (progress?.completedModules?.length || 0)}
            totalLessonsCount={progress?.lessons?.totalPublished ?? 12}
            quizAttemptsCount={quizAttemptsList.length}
            completedRecallCount={completedRecallCount}
            passedRecallCount={passedRecallCount}
            dueRecallCount={totalDueRecallCount}
            onOpenPortfolioModal={() => handleOpenPortfolioModal()}
          />

          <PrimaryFocus
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
            pathwaysWithStatus={pathwaysWithStatus}
            dueSpacedReviews={dueSpacedReviews}
            dueQuizRecalls={dueQuizRecalls}
            inProgressLesson={progress?.lessons?.recentlyAccessed?.status === 'in_progress' ? progress.lessons.recentlyAccessed : null}
            recommendedLesson={progress?.lessons?.nextLesson || null}
            frequentlyMissedQuizTopic={quizHistoryData?.frequentlyMissedTopics?.[0] || null}
            completedFocusCount={completedFocusCount}
            totalFocusCount={totalFocusCount}
            nextIncompletePathway={nextIncompletePathway}
            nextReinforcePathway={nextReinforcePathway}
            onLaunchRunner={handleLaunchRunner}
            onLaunchSpacedRetrieval={handleLaunchSpacedRetrieval}
            onLaunchQuizRecall={() => setIsQuizRecallModalOpen(true)}
            onOpenPortfolioModal={() => handleOpenPortfolioModal()}
          />

          <DigitalMomentsStorySection />

          <div className="atelier-studio-grid desk-studio-grid">
            <div className="atelier-column desk-studio-panel">
              <CurriculumLessonsSection
                lessonsData={progress?.lessons}
                isWorkspace={true}
              />
              <TargetedInterventionsPanel
                hasBaseline={hasBaseline}
                pathwaysWithStatus={pathwaysWithStatus}
                dueSpacedReviews={dueSpacedReviews}
                onLaunchRunner={handleLaunchRunner}
                onLaunchSpacedRetrieval={handleLaunchSpacedRetrieval}
                completedFocusCount={completedFocusCount}
                totalFocusCount={totalFocusCount}
              />
            </div>
            <div className="atelier-column desk-studio-panel">
              <DashboardQuizPractice
                quizHistoryData={quizHistoryData}
                dueRecallsCount={dueQuizRecalls.length}
                onLaunchQuizRecall={() => setIsQuizRecallModalOpen(true)}
              />
              <RecentActivityStream
                completedPathwaysList={completedPathwaysList}
                reinforcementsList={reinforcementsList}
                quizAttemptsList={quizAttemptsList}
                spacedReviewsList={progress?.spacedReviews || []}
              />
            </div>
          </div>

          <BehavioralEvolution
            trajectoryData={trajectoryData}
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
          />

          <DashboardHistory
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
            hasTrajectoryReassessment={hasTrajectoryReassessment}
            portfolioData={portfolioData}
            trajectoryData={trajectoryData}
          />
        </>
      )}

      {/* Interactive Micro-learning PathwayRunner Modal */}
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

      {/* Spaced Retrieval Follow-Up Learning Modal */}
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

      {/* Missed Quiz Concept Recall Modal */}
      {isQuizRecallModalOpen && dueQuizRecalls.length > 0 && (
        <QuizRecallModal
          isOpen={isQuizRecallModalOpen}
          onClose={() => setIsQuizRecallModalOpen(false)}
          dueRecalls={dueQuizRecalls}
          onRecallCompleted={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* Certified Defensive Portfolio Record & Printable Statement Modal */}
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
