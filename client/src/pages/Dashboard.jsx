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
import QuizRecallModal from '../components/dashboard/QuizRecallModal';
import { selectAuthoritativeRecallCounts } from '../utils/evidenceSelectors';

/**
 * Dashboard Page Container — Personal Learning Workspace
 * 
 * Strict Visual & Pedagogical Hierarchy (Stage 6 Final Acceptance):
 * 1. Primary Orientation: Where am I in my learning journey? (AtelierMasthead & 4-Stage Journey Map)
 * 2. Primary Action: What should I do next? (PrimaryFocus Study Dossier)
 * 3. Learning Content: Which lessons or pathways can I explore? (Curriculum Lessons & Targeted Defense Pathways)
 * 4. Practical Application: How can I recognize and respond to real-world threats? (Practical Online Safety Scenarios & Quiz Studio)
 * 5. Learning Progress: What have I completed and learned? (Behavioral Evolution Studio across 6 dimensions)
 * 6. Supporting Information: Verified Activity Stream & Defensive Portfolio Records
 * 
 * Zero composite gamified scores; strict server-side grading, zero scheduled review pressure.
 */
function Dashboard({ user, progressTrigger }) {
  const [progress, setProgress] = useState(null);
  const [remediationData, setRemediationData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [quizHistoryData, setQuizHistoryData] = useState(null);
  const [dueQuizRecalls, setDueQuizRecalls] = useState([]);
  const [isQuizRecallModalOpen, setIsQuizRecallModalOpen] = useState(false);
  const [baselineStatus, setBaselineStatus] = useState(null);
  const [finalStatus, setFinalStatus] = useState(null);
  const [showFullStudio, setShowFullStudio] = useState(false);
  const [loadState, setLoadState] = useState('LOADING'); // 'LOADING' | 'RESOLVED' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [activePathwayForRunner, setActivePathwayForRunner] = useState(null);
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

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoadState('LOADING');
      setErrorMessage('');
    }
    try {
      // 1. Authoritative identity and assessment status checks MUST succeed.
      const [prog, baseStatus, finStatus] = await Promise.all([
        api.getProgress(),
        api.getAssessmentStatus('baseline'),
        api.getAssessmentStatus('final').catch(() => null)
      ]);

      // 2. Secondary enrichment data (portfolio, trajectory, recalls, etc.) degrades gracefully
      const [port, traj, quizHistRes, quizRecallRes] = await Promise.all([
        api.getPortfolio().catch(() => null),
        api.getTrajectory().catch(() => null),
        api.getQuizHistory().catch(() => null),
        api.getDueQuizRecalls().catch(() => ({ dueItems: [], totalDue: 0 }))
      ]);

      setProgress(prog);
      setBaselineStatus(baseStatus);
      setFinalStatus(finStatus);
      setPortfolioData(port);
      setTrajectoryData(traj);
      setQuizHistoryData(quizHistRes);
      setDueQuizRecalls(quizRecallRes?.dueItems || []);

      const sessionForRemediation = prog?.latestSessionId || baseStatus?.sessionId;
      if (sessionForRemediation) {
        try {
          const rem = await api.getAssessmentRemediation(sessionForRemediation);
          setRemediationData(rem);
        } catch (_re) {
          // Non-blocking: recommendations may be pending completion of diagnostic
        }
      }

      setLoadState('RESOLVED');
    } catch (err) {
      if (!silent) {
        setErrorMessage(err.message || 'Unable to connect to the learning portal. Please check your network connection.');
        setLoadState('ERROR');
      }
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
        <p style={{ color: 'var(--color-text-secondary, #3A443B)', fontSize: '0.95rem' }}>
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
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }} aria-hidden="true">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(12, 29, 46, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0c1d2e', marginBottom: '8px' }}>
            Learning Workspace Unavailable
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#56565c', lineHeight: 1.55, marginBottom: '24px' }}>
            Hello {learnerName}. We could not synchronize your progress records with the central knowledge repository. Your previously completed lessons, quiz scores, and verified learning records remain safely preserved on the server.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchDashboardData(false)}
              className="btn btn-primary"
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
  const hasActiveFinal = Boolean(finalStatus?.hasActiveSession && finalStatus?.stage);
  const activeFinalStage = finalStatus?.stage || null;
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

  // Authoritative recall review counts derived via calibrated evidence selector
  const { completedRecallCount, passedRecallCount } = selectAuthoritativeRecallCounts({
    portfolioData,
    progress
  });

  // Optional concept recall count for missed quiz provisions
  const conceptRecallCount = dueQuizRecalls?.length || 0;

  // Next Action Selection based strictly on authoritative state
  const nextIncompletePathway = pathwaysWithStatus.find(p => !p.isFullyCompleted);
  const nextReinforcePathway = pathwaysWithStatus.find(p => p.isReinforcementEligible && !p.isReinforced);

  const handleLaunchRunner = (pathwayItem, isReinforce = false) => {
    const launchSessionId = progress?.latestSessionId || baselineStatus?.sessionId;
    if (!launchSessionId) {
      setActionNotice('To start a pathway, please complete your First Check first so we can personalize your learning.');
      return;
    }
    if (!pathwayItem?.rec?.pathwayId) {
      setActionNotice('This lesson could not be opened right now. Please refresh the page or try again in a moment.');
      return;
    }

    setActivePathwayForRunner({
      pathway: {
        pathwayId: pathwayItem.rec.pathwayId,
        habitTitle: pathwayItem.rec.habitTitle,
        pedagogicalFocus: pathwayItem.rec.pedagogicalFocus,
        coreRule: pathwayItem.rec.coreRule
      },
      sourceSessionId: pathwayItem.completedRecord?.sourceSessionId || launchSessionId,
      initialProgress: {
        currentStep: pathwayItem.isInProgress ? 2 : 1,
        stepsCompleted: pathwayItem.completedRecord?.stepsCompleted || { caseStudy: false, prevention: false, checkpointQuiz: false },
        isCompleted: pathwayItem.isFullyCompleted,
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

      {actionNotice && (
        <div
          role="alert"
          style={{
            maxWidth: '1200px',
            margin: '0 auto 20px auto',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
          }}
        >
          <span style={{ fontSize: '0.88rem', color: '#1e40af', fontWeight: 500 }}>
            {actionNotice}
          </span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1e40af',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.82rem',
              padding: '4px 8px'
            }}
            aria-label="Dismiss notice"
          >
            Dismiss
          </button>
        </div>
      )}

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
          />

          {showFullStudio && (
            <div style={{ marginTop: '32px', borderTop: '2px dashed var(--color-border)', paddingTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  PREVIEWING FULL LEARNING STUDIO (STAGE 1 UNLOCKED)
                </span>
                <button
                  type="button"
                  onClick={() => setShowFullStudio(false)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Collapse Full Studio ↑
                </button>
              </div>

              {/* 1. Primary Orientation */}
              <AtelierMasthead
                displayName={firstName}
                hasBaseline={hasBaseline}
                hasFinal={hasFinal}
                nextReinforcePathway={nextReinforcePathway}
                hasTrajectoryReassessment={hasTrajectoryReassessment}
                completedFocusCount={completedFocusCount}
                totalFocusCount={totalFocusCount}
                lessonsCompletedCount={progress?.lessons?.completedCount ?? (progress?.completedModules?.length || 0)}
                totalLessonsCount={progress?.lessons?.totalPublished ?? 0}
                quizAttemptsCount={quizAttemptsList.length}
                completedRecallCount={completedRecallCount}
                passedRecallCount={passedRecallCount}
                conceptRecallCount={conceptRecallCount}
                onOpenPortfolioModal={() => handleOpenPortfolioModal()}
              />

              {/* 3. Learning Content */}
              <div className="atelier-learning-content-section" style={{ margin: '28px 0' }}>
                <div className="atelier-studio-grid desk-studio-grid">
                  <div className="atelier-column desk-studio-panel">
                    <CurriculumLessonsSection
                      lessonsData={progress?.lessons}
                      isWorkspace={true}
                    />
                  </div>
                  <div className="atelier-column desk-studio-panel">
                    <TargetedInterventionsPanel
                      hasBaseline={hasBaseline}
                      pathwaysWithStatus={pathwaysWithStatus}
                      onLaunchRunner={handleLaunchRunner}
                      completedFocusCount={completedFocusCount}
                      totalFocusCount={totalFocusCount}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Practical Application */}
              <div className="atelier-practical-application-section" style={{ marginBottom: '32px' }}>
                <DigitalMomentsStorySection />
                <div style={{ marginTop: '24px' }}>
                  <DashboardQuizPractice
                    quizHistoryData={quizHistoryData}
                    dueRecallsCount={dueQuizRecalls.length}
                    onLaunchQuizRecall={() => setIsQuizRecallModalOpen(true)}
                  />
                </div>
              </div>

              {/* 5. Learning Progress */}
              <BehavioralEvolution
                trajectoryData={trajectoryData}
                hasBaseline={hasBaseline}
                hasFinal={hasFinal}
              />

              {/* 6. Supporting Information */}
              <div style={{ margin: '24px 0' }}>
                <RecentActivityStream
                  completedPathwaysList={completedPathwaysList}
                  reinforcementsList={reinforcementsList}
                  quizAttemptsList={quizAttemptsList}
                  spacedReviewsList={progress?.spacedReviews || []}
                />
              </div>
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
          {/* ========================================================================= */}
          {/* 1. PRIMARY ORIENTATION: WHERE AM I IN MY LEARNING JOURNEY?                */}
          {/* ========================================================================= */}
          <AtelierMasthead
            displayName={firstName}
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
            nextReinforcePathway={nextReinforcePathway}
            hasTrajectoryReassessment={hasTrajectoryReassessment}
            completedFocusCount={completedFocusCount}
            totalFocusCount={totalFocusCount}
            lessonsCompletedCount={progress?.lessons?.completedCount ?? (progress?.completedModules?.length || 0)}
            totalLessonsCount={progress?.lessons?.totalPublished ?? 0}
            quizAttemptsCount={quizAttemptsList.length}
            completedRecallCount={completedRecallCount}
            passedRecallCount={passedRecallCount}
            conceptRecallCount={conceptRecallCount}
            onOpenPortfolioModal={() => handleOpenPortfolioModal()}
          />

          {/* ========================================================================= */}
          {/* 2. PRIMARY ACTION: WHAT SHOULD I DO NEXT? (STUDY DOSSIER)                 */}
          {/* ========================================================================= */}
          <PrimaryFocus
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
            hasActiveFinal={hasActiveFinal}
            activeFinalStage={activeFinalStage}
            pathwaysWithStatus={pathwaysWithStatus}
            dueQuizRecalls={dueQuizRecalls}
            inProgressLesson={progress?.lessons?.recentlyAccessed?.status === 'in_progress' ? progress.lessons.recentlyAccessed : null}
            recommendedLesson={progress?.lessons?.nextLesson || null}
            frequentlyMissedQuizTopic={quizHistoryData?.frequentlyMissedTopics?.[0] || null}
            completedFocusCount={completedFocusCount}
            totalFocusCount={totalFocusCount}
            nextIncompletePathway={nextIncompletePathway}
            nextReinforcePathway={nextReinforcePathway}
            onLaunchRunner={handleLaunchRunner}
            onLaunchQuizRecall={() => setIsQuizRecallModalOpen(true)}
            onOpenPortfolioModal={() => handleOpenPortfolioModal()}
          />

          {/* ========================================================================= */}
          {/* 3. LEARNING CONTENT: STATUTORY LESSONS & PERSONALIZED COACHING PATHWAYS   */}
          {/* ========================================================================= */}
          <div className="atelier-learning-content-section" style={{ marginBottom: '32px' }}>
            <div className="atelier-studio-grid desk-studio-grid">
              <div className="atelier-column desk-studio-panel">
                <CurriculumLessonsSection
                  lessonsData={progress?.lessons}
                  isWorkspace={true}
                />
              </div>
              <div className="atelier-column desk-studio-panel">
                <TargetedInterventionsPanel
                  hasBaseline={hasBaseline}
                  pathwaysWithStatus={pathwaysWithStatus}
                  onLaunchRunner={handleLaunchRunner}
                  completedFocusCount={completedFocusCount}
                  totalFocusCount={totalFocusCount}
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. PRACTICAL APPLICATION: REAL-WORLD THREAT DILEMMAS & PRACTICE STUDIO    */}
          {/* ========================================================================= */}
          <div className="atelier-practical-application-section" style={{ marginBottom: '32px' }}>
            <DigitalMomentsStorySection />
            <div style={{ marginTop: '24px' }}>
              <DashboardQuizPractice
                quizHistoryData={quizHistoryData}
                dueRecallsCount={dueQuizRecalls.length}
                onLaunchQuizRecall={() => setIsQuizRecallModalOpen(true)}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. LEARNING PROGRESS: SIX-DIMENSIONAL BEHAVIORAL HABIT EVOLUTION          */}
          {/* ========================================================================= */}
          <BehavioralEvolution
            trajectoryData={trajectoryData}
            hasBaseline={hasBaseline}
            hasFinal={hasFinal}
          />

          {/* ========================================================================= */}
          {/* 6. SUPPORTING INFORMATION: VERIFIED ACTIVITY STREAM & DEFENSIVE PORTFOLIO */}
          {/* ========================================================================= */}
          <div className="atelier-supporting-stream-wrapper" style={{ marginBottom: '32px' }}>
            <RecentActivityStream
              completedPathwaysList={completedPathwaysList}
              reinforcementsList={reinforcementsList}
              quizAttemptsList={quizAttemptsList}
              spacedReviewsList={progress?.spacedReviews || []}
            />
          </div>

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

      {/* Missed Quiz Concept Recall Modal (Optional, Learner-Initiated Revision) */}
      <QuizRecallModal
        isOpen={isQuizRecallModalOpen}
        dueRecalls={dueQuizRecalls}
        onClose={() => {
          setIsQuizRecallModalOpen(false);
          fetchDashboardData(true);
        }}
        onRecallCompleted={() => {
          // Defer full dashboard refresh until modal is closed to preserve learner's feedback
        }}
      />

      {/* Official Verified Defensive Learning Portfolio Modal */}
      <DefensivePortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={handleClosePortfolioModal}
        portfolioData={portfolioData}
        initialPillar={portfolioInitialPillar}
        user={user}
        progress={progress}
        trajectoryData={trajectoryData}
      />
    </div>
  );
}

export default Dashboard;
