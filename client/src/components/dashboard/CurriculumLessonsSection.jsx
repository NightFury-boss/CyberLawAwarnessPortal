import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CurriculumLessonsSection Component — The Curriculum Codex
 * 
 * Rules:
 * - Strictly distinguishes lesson curriculum from diagnostic remediation pathways and 6D assessment scores.
 * - Displays: lessons completed, lessons in progress, total published (12), active lesson feature, and chapter constellation.
 * - Adheres strictly to the calm, editorial visual identity.
 */
export default function CurriculumLessonsSection({
  lessonsData = null,
  isWorkspace = true
}) {
  const completedCount = lessonsData?.completedCount ?? 0;
  const inProgressCount = lessonsData?.inProgressCount ?? 0;
  const totalPublished = lessonsData?.totalPublished ?? 12;
  const recentlyAccessed = lessonsData?.recentlyAccessed ?? null;

  const progressPercent = totalPublished > 0 ? Math.round((completedCount / totalPublished) * 100) : 0;
  const getContextPath = (p) => (isWorkspace ? `/workspace${p}` : p);

  // Core curriculum chapters for the fast-jump constellation
  const CORE_CHAPTERS = [
    { title: 'Digital Identity & Privacy', slug: 'digital-identity-foundations', statute: 'IT Act §43' },
    { title: 'Phishing & Social Vectors', slug: 'phishing-and-social-engineering', statute: 'IT Act §66D' },
    { title: 'UPI & Banking Safeguards', slug: 'upi-banking-financial-fraud', statute: '1930 / CFCFRMS' },
    { title: 'Passwords & Credentials', slug: 'passwords-mfa-and-passkeys', statute: 'IT Act §66C' },
    { title: 'Digital Evidence Rules', slug: 'electronic-evidence-bsa-63', statute: 'BSA 2023 §63' },
    { title: 'BNS Cybercrime Law', slug: 'bns-cybercrime-provisions', statute: 'BNS 2023' }
  ];

  return (
    <section className="curriculum-codex-card" aria-labelledby="curriculum-heading">
      {/* Section Header */}
      <div className="atelier-section-header">
        <div>
          <span className="atelier-section-eyebrow">Structured Knowledge Base</span>
          <h2 id="curriculum-heading" className="atelier-section-title">
            Indian Cyber Law Codex
          </h2>
          <p className="atelier-section-sub">
            Authoritative, plain-language lessons on digital rights, evidence rules, and primary legislation.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #302B27)' }}>
            {completedCount} of {totalPublished}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #8A8075)', display: 'block' }}>
            Chapters Read
          </span>
        </div>
      </div>

      {/* Publication Progress Bar */}
      <div className="codex-progress-bar-bg" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
        <div
          className="codex-progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="codex-progress-meta">
        <span>
          {completedCount === totalPublished ? 'All 12 curriculum chapters read' : `${totalPublished - completedCount} chapters remaining`}
        </span>
        <span style={{ fontWeight: 700, color: 'var(--color-text-primary, #302B27)' }}>
          {progressPercent}% Complete
        </span>
      </div>

      {/* Featured Active Chapter Hero */}
      <div className="codex-active-chapter">
        {recentlyAccessed ? (
          <div>
            <div className="codex-chapter-tags">
              <span className="codex-tag">
                {recentlyAccessed.category || 'Curriculum'}
              </span>
              <span className="codex-tag statute">
                {recentlyAccessed.status === 'knowledge_check_passed' ? '✓ Knowledge Check Passed' : (recentlyAccessed.status === 'read_completed' ? 'Read' : 'In Progress')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#7a8898' }}>
                • Recently studied
              </span>
            </div>

            <h3 className="codex-chapter-title">
              {recentlyAccessed.title}
            </h3>
            <p className="codex-chapter-desc">
              {recentlyAccessed.summary || 'Deepen your knowledge of digital evidence standards and statutory safeguards.'}
            </p>

            <div className="codex-chapter-cta-row">
              <span className="codex-read-time">
                ⏱ ~{recentlyAccessed.estimatedMinutes || 6} min read • {recentlyAccessed.difficulty || 'Beginner'}
              </span>
              <Link
                to={getContextPath(`/modules/${recentlyAccessed.slug}`)}
                className="codex-read-btn"
                aria-label={`Continue reading ${recentlyAccessed.title}`}
              >
                Continue Reading &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="codex-chapter-tags">
              <span className="codex-tag">Foundations</span>
              <span className="codex-tag statute">IT Act §43</span>
              <span style={{ fontSize: '0.72rem', color: '#7a8898' }}>
                • Suggested First Chapter
              </span>
            </div>

            <h3 className="codex-chapter-title">
              Understanding Your Digital Identity
            </h3>
            <p className="codex-chapter-desc">
              Learn how telemetry and device fingerprints construct your online footprint, and your rights under IT Act Section 43.
            </p>

            <div className="codex-chapter-cta-row">
              <span className="codex-read-time">
                ⏱ ~6 min read • Beginner
              </span>
              <Link
                to={getContextPath('/modules/digital-identity-foundations')}
                className="codex-read-btn"
                aria-label="Start reading Lesson 1: Understanding Your Digital Identity"
              >
                Start Reading &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Fast-Jump Constellation */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted, #8A8075)' }}>
            Featured Curriculum Chapters
          </span>
          <Link
            to={getContextPath('/modules')}
            style={{ fontSize: '0.78rem', color: 'var(--color-accent-terracotta, #A65F45)', fontWeight: 700, textDecoration: 'none' }}
          >
            All 12 Chapters &rarr;
          </Link>
        </div>
        <div className="codex-constellation-grid">
          {CORE_CHAPTERS.map((ch, idx) => (
            <Link
              key={idx}
              to={getContextPath(`/modules/${ch.slug}`)}
              className="codex-constellation-item"
            >
              <span style={{ color: 'var(--color-accent-terracotta, #A65F45)', fontWeight: 800 }}>§</span>
              <span>{ch.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
