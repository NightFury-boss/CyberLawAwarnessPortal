import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DashboardQuizPractice Component — Practice & Recall Atelier
 * 
 * Brilliant-Inspired Learning Activities:
 * - 5 Distinctive quiz modes each with its own visual personality and badge.
 * - Due Concept Recall amber alert card for missed questions.
 * - Performance Track Record ledger (sessions, latest score, overall accuracy).
 * - Weak topic spotlight (<70% accuracy) with one-click drill launcher.
 */
export default function DashboardQuizPractice({
  quizHistoryData = null,
  dueRecallsCount = 0,
  onLaunchQuizRecall
}) {
  const totalAttempts = quizHistoryData?.totalAttempts || 0;
  const highScores = quizHistoryData?.highScores || 0;
  const recentAttempts = quizHistoryData?.recentAttempts || [];
  const latestAttempt = recentAttempts[0] || null;
  const frequentlyMissed = quizHistoryData?.frequentlyMissedTopics || [];
  const overallAccuracy = quizHistoryData?.overallAccuracyPercent ?? null;
  const topWeakTopic = frequentlyMissed[0] || null;

  return (
    <section className="practice-atelier-card" aria-labelledby="practice-atelier-heading">
      {/* Header */}
      <div className="atelier-section-header">
        <div>
          <span className="atelier-section-eyebrow">Interactive Testing</span>
          <h2 id="practice-atelier-heading" className="atelier-section-title">
            Practice Atelier
          </h2>
          <p className="atelier-section-sub">
            Strengthen your statutory recall across five dedicated learning formats.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <Link
            to="/quizzes"
            style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 800, textDecoration: 'none' }}
          >
            All Quizzes &rarr;
          </Link>
        </div>
      </div>

      {/* Due Concept Recall Amber Alert Card */}
      {dueRecallsCount > 0 && (
        <div className="atelier-recall-card" role="region" aria-label="Due concept recall review">
          <div className="atelier-recall-top">
            <span className="atelier-recall-tag">Spaced Review Ready</span>
            <span className="atelier-recall-count">
              {dueRecallsCount} {dueRecallsCount === 1 ? 'Concept Due' : 'Concepts Due'}
            </span>
          </div>
          <p className="atelier-recall-desc">
            You recently missed questions on key statutory provisions. A 2-minute review now reinforces safe memory.
          </p>
          <button
            type="button"
            onClick={onLaunchQuizRecall}
            className="atelier-recall-btn"
            aria-label="Start review of due missed quiz questions"
          >
            <span>Review Missed Concepts</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {/* Practice Track Record Ledger */}
      <div className="atelier-track-record">
        <div className="atelier-stat-cell">
          <span className="atelier-stat-val">{totalAttempts}</span>
          <span className="atelier-stat-lbl">Sessions</span>
        </div>

        <div className="atelier-stat-cell">
          <span
            className="atelier-stat-val"
            style={{ color: latestAttempt ? (latestAttempt.percentage >= 70 ? '#059669' : '#d97706') : 'inherit' }}
          >
            {latestAttempt ? `${latestAttempt.percentage}%` : '—'}
          </span>
          <span className="atelier-stat-lbl">Latest Score</span>
        </div>

        <div className="atelier-stat-cell">
          <span className="atelier-stat-val">
            {overallAccuracy !== null ? `${overallAccuracy}%` : '—'}
          </span>
          <span className="atelier-stat-lbl">Accuracy</span>
        </div>
      </div>

      {/* Weak Subject Spotlight */}
      {topWeakTopic && (
        <div className="atelier-weak-watch" role="alert">
          <span className="atelier-weak-text">
            <strong>Subject priority:</strong> {topWeakTopic.topic} ({topWeakTopic.accuracy}% accuracy).
          </span>
          <Link
            to="/quizzes"
            className="atelier-weak-link"
            aria-label={`Practice weak topic: ${topWeakTopic.topic}`}
          >
            Practice &rarr;
          </Link>
        </div>
      )}

      {/* 5 Distinctive Quiz Modes (Brilliant-Style) */}
      <div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7a8898', display: 'block', marginBottom: '10px' }}>
          Select Practice Experience
        </span>
        <div className="atelier-mode-stack">
          {/* Mode 1: Quick Practice */}
          <Link
            to="/quizzes"
            className="atelier-mode-card mode-quick"
            aria-label="Start Quick Practice: 5 short questions untimed"
          >
            <div className="atelier-mode-badge-icon" aria-hidden="true">⚡</div>
            <div className="atelier-mode-info">
              <span className="atelier-mode-name">Rapid Quick Practice</span>
              <span className="atelier-mode-desc">5 short questions • Instant explanations</span>
            </div>
            <span className="atelier-mode-arrow" aria-hidden="true">&rarr;</span>
          </Link>

          {/* Mode 2: Topic Drill */}
          <Link
            to="/quizzes"
            className="atelier-mode-card mode-topic"
            aria-label="Start Topic-wise Practice across 10 statutory categories"
          >
            <div className="atelier-mode-badge-icon" aria-hidden="true">📚</div>
            <div className="atelier-mode-info">
              <span className="atelier-mode-name">Subject Mastery Drill</span>
              <span className="atelier-mode-desc">10 topics • Difficulty & statute selection</span>
            </div>
            <span className="atelier-mode-arrow" aria-hidden="true">&rarr;</span>
          </Link>

          {/* Mode 3: Real-World Scenarios */}
          <Link
            to="/quizzes"
            className="atelier-mode-card mode-scenario"
            aria-label="Start Real-world Scenarios: 8 situational decision problems"
          >
            <div className="atelier-mode-badge-icon" aria-hidden="true">🔍</div>
            <div className="atelier-mode-info">
              <span className="atelier-mode-name">Real-World Scenarios</span>
              <span className="atelier-mode-desc">8 situational dilemmas • Indicator detection</span>
            </div>
            <span className="atelier-mode-arrow" aria-hidden="true">&rarr;</span>
          </Link>

          {/* Mode 4: Speed Challenge */}
          <Link
            to="/quizzes"
            className="atelier-mode-card mode-challenge"
            aria-label="Start Speed and Depth Challenge: 15 questions with 10 minute timer"
          >
            <div className="atelier-mode-badge-icon" aria-hidden="true">⏱</div>
            <div className="atelier-mode-info">
              <span className="atelier-mode-name">Timed Challenge Quiz</span>
              <span className="atelier-mode-desc">15 mixed questions • 10m countdown timer</span>
            </div>
            <span className="atelier-mode-arrow" aria-hidden="true">&rarr;</span>
          </Link>

          {/* Mode 5: Case Law & Evidence */}
          <Link
            to="/quizzes"
            className="atelier-mode-card mode-legal"
            aria-label="Start Case-based and Legal Application: BSA Section 63 and BNS court cases"
          >
            <div className="atelier-mode-badge-icon" aria-hidden="true">⚖️</div>
            <div className="atelier-mode-info">
              <span className="atelier-mode-name">Case Law &amp; Digital Evidence</span>
              <span className="atelier-mode-desc">BSA §63 evidence rules &amp; court rulings</span>
            </div>
            <span className="atelier-mode-arrow" aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
