import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard({ user, progressTrigger }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProgress();
  }, [user, progressTrigger]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getProgress();
      setProgress(data);
    } catch (err) {
      setError(err.message || 'Failed to load progress dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'First Step': return 'FS';
      case 'Phishing Detector': return 'PD';
      case 'Cyber Law Learner': return 'CL';
      case 'Safe Browser': return 'SB';
      case 'Scam Spotter': return 'SS';
      case 'Cyber Defender': return 'CD';
      case 'Cyber Guardian': return 'CG';
      default: return '--';
    }
  };

  const allPossibleBadges = [
    { name: 'First Step', description: 'Registered on the portal' },
    { name: 'Scam Spotter', description: 'Score 100% on the Phishing Quiz' },
    { name: 'Cyber Law Learner', description: 'Complete 3 quizzes with >= 75% score' },
    { name: 'Cyber Defender', description: 'Achieve score >= 75% in assessments' },
    { name: 'Cyber Guardian', description: 'Achieve score >= 90% in assessments' }
  ];

  if (loading) return <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}><p>Loading your dashboard...</p></div>;
  if (error) return <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}><div className="alert alert-error">{error}</div></div>;
  if (!progress) return null;

  const hasBaseline = progress.baselineScore !== null;
  const hasFinal = progress.finalScore !== null;

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}>
      {/* Header and Welcome */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div>
          <h1 style={{ fontSize: '2.4rem' }}>
            Welcome Back, {progress.fullName}
          </h1>
          <p className="text-muted">Account: {progress.email} | Student Profile</p>
        </div>

        {hasBaseline && (
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Link to="/assessment/baseline" className="btn btn-secondary">
              Retake Baseline
            </Link>
            <Link to="/assessment/final" className="btn btn-primary">
              {hasFinal ? 'Retake Final branching' : 'Take Final branching Assessment'}
            </Link>
          </div>
        )}
      </div>

      {/* Case 1: Has NOT completed Baseline Assessment */}
      {!hasBaseline && (
        <div className="editorial-card" style={{
          padding: 'var(--space-xxl) var(--space-xl)',
          textAlign: 'center',
          border: '2px dashed var(--color-border-dark)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px'
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-navy)' }}>Progress</span>
          <h2 style={{ fontSize: '2.2rem', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            Complete Your Baseline Assessment
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-xl) auto', fontSize: '1.05rem' }}>
            To unlock the learning modules, personalized metrics, and quiz dashboards, you must first complete the <strong>Cyber Security Baseline Assessment</strong>. This simulation evaluates your defensive habits in response to spoof digital notices.
          </p>
          <Link to="/assessment/baseline" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', fontWeight: '600' }}>
            Start Baseline Simulation
          </Link>
        </div>
      )}

      {/* Case 2: Has completed Baseline Assessment */}
      {hasBaseline && (
        <div>
          {/* Quick Metrics Summary */}
          <div className="dashboard-grid">
            <div className="stat-card">
              <span className="label">RECOGNITION</span>
              <div className="value">{progress.baselineScore}/100</div>
              <span className="subtext" style={{ fontSize: '0.75rem', fontWeight: '500' }}>What you are learning to identify.</span>
            </div>

            <div className="stat-card">
              <span className="label">KNOWLEDGE</span>
              <div className="value">
                {hasFinal ? `${progress.finalScore}/100` : '—'}
              </div>
              <span className="subtext">
                {hasFinal ? progress.finalLevel : 'Pending assessment'}
              </span>
            </div>

            <div className="stat-card">
              <span className="label">IMPROVEMENT</span>
              <div className="value" style={{ color: hasFinal ? (progress.finalScore - progress.baselineScore >= 0 ? 'var(--color-success)' : 'var(--color-error)') : 'var(--text-muted)' }}>
                {hasFinal ? `${progress.finalScore - progress.baselineScore >= 0 ? '+' : ''}${progress.finalScore - progress.baselineScore}` : '—'}
              </div>
              <span className="subtext" style={{ fontSize: '0.75rem', fontWeight: '500' }}>How your performance has changed.</span>
            </div>

            <div className="stat-card">
              <span className="label">PRACTICE</span>
              <div className="value">{Object.keys(progress.quizzesTaken || {}).length}</div>
              <span className="subtext" style={{ fontSize: '0.75rem', fontWeight: '500' }}>What you have applied.</span>
            </div>
          </div>

          {/* Detailed Content grid */}
          <div className="editorial-grid">
            {/* Left side: strengths & recommendations */}
            <div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-md)' }}>
                Learning Path & Recommendations
              </h2>

              <div className="editorial-card">
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>Recommendations Based on Weak Areas</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  Our system evaluates your assessment decisions and automatically suggests these learning modules to address vulnerabilities:
                </p>
                <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
                  {/* Dynamic recommendations */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Phishing & Cloned Websites</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required section based on URL inspection scores</p>
                    </div>
                    <Link to="/crimes" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      Learn
                    </Link>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>UPI, QR Codes & Financial safety</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required section based on transaction check scores</p>
                    </div>
                    <Link to="/crimes" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      Learn
                    </Link>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Passphrases & MFA setup</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required section based on credential safety scores</p>
                    </div>
                    <Link to="/prevention" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      Learn
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quiz and Learning center link */}
              <div className="editorial-card" style={{ borderColor: 'var(--color-border-dark)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>Take Learning Quizzes</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  Test your legal and preventive knowledge on different categories. Completing quizzes awards badges.
                </p>
                <Link to="/quizzes" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}>
                  Open Quiz Center
                </Link>
              </div>
            </div>

            {/* Right side: Badge Locker & final checklist */}
            <div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-md)' }}>
                Badge Locker
              </h2>

              <div className="editorial-card">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                  Complete quizzes and obtain high assessment scores to unlock badges.
                </p>

                <div className="badges-grid">
                  {allPossibleBadges.map((badgeObj) => {
                    const isEarned = progress.badges.includes(badgeObj.name);
                    return (
                      <div
                        key={badgeObj.name}
                        className={`badge-card ${isEarned ? 'earned' : ''}`}
                        style={{
                          opacity: isEarned ? 1 : 0.45,
                          filter: isEarned ? 'none' : 'grayscale(1)'
                        }}
                        title={badgeObj.description}
                      >
                        <div className="badge-icon">{getBadgeIcon(badgeObj.name)}</div>
                        <div className="badge-name" style={{ fontSize: '0.75rem' }}>{badgeObj.name}</div>
                        <div className="badge-status" style={{ fontSize: '0.65rem' }}>
                          {isEarned ? 'Earned' : 'Locked'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment checklist */}
              <div className="editorial-card">
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>Assessment Progress</h4>
                <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem' }}>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: '600', fontSize: '0.8rem' }}>Done</span>
                    <span>Baseline Assessment: Completed ({progress.baselineScore}/100)</span>
                  </li>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasFinal ? (
                      <span style={{ color: 'var(--color-success)', fontWeight: '600', fontSize: '0.8rem' }}>Done</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>○</span>
                    )}
                    <span style={{ color: hasFinal ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      Final branching Assessment: {hasFinal ? `Completed (${progress.finalScore}/100)` : 'Not taken yet'}
                    </span>
                  </li>
                </ul>

                {!hasFinal && (
                  <Link to="/assessment/final" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-md)', textAlign: 'center', fontSize: '0.85rem' }}>
                    Take Final assessment
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
