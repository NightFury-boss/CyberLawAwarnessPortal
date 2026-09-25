import React, { useState, useEffect, useRef } from 'react';

/**
 * EditorialScrollStory
 * 
 * Production-grade editorial scroll component for Cyber Law Awareness Portal.
 * 
 * Features:
 * - Desktop: Sticky contextual navigation on the left + sequential active content on the right.
 * - Mobile: Normal document flow with compact horizontal jump selector, 0px horizontal overflow.
 * - Engine: IntersectionObserver (zero continuous scroll polling / RAF loops).
 * - Accessibility: WCAG compliant, semantic HTML, keyboard accessible, visible focus,
 *   aria-current="step", prefers-reduced-motion support.
 */
export default function EditorialScrollStory({
  contextBadge = '',
  contextTitle = '',
  contextSubtitle = '',
  sections = [],
  className = '',
  showReadingProgress = true
}) {
  const [activeSectionId, setActiveSectionId] = useState(
    sections.length > 0 ? sections[0].id : ''
  );
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  );
  const isClickScrolling = useRef(false);
  const clickTimeout = useRef(null);

  // Responsive breakpoint watcher
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // IntersectionObserver for tracking active section
  useEffect(() => {
    if (sections.length === 0) return;

    // Center-biased trigger zone: active when element crosses 15% - 45% of viewport
    const observerOptions = {
      root: null,
      rootMargin: '-15% 0px -55% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      if (isClickScrolling.current) return;

      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        const id = visibleEntry.target.getAttribute('data-scroll-id');
        if (id) {
          setActiveSectionId(id);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    sections.forEach((sec) => {
      const el = document.getElementById(`scroll-section-${sec.id}`);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, [sections]);

  const scrollToSection = (id) => {
    const el = document.getElementById(`scroll-section-${id}`);
    if (!el) return;

    isClickScrolling.current = true;
    setActiveSectionId(id);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerOffset = 84; // Header height + breathing room
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    // Reset programmatic lock after smooth scroll completes
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 700);
  };

  if (!sections || sections.length === 0) {
    return null;
  }

  const activeIndex = sections.findIndex((s) => s.id === activeSectionId);
  const currentStep = activeIndex >= 0 ? activeIndex + 1 : 1;
  const totalSteps = sections.length;

  return (
    <div className={`editorial-scroll-story-container ${className}`}>
      
      {/* MOBILE CONTEXT & JUMP SELECTOR (< 900px) */}
      {isMobile && (
        <div className="editorial-story-mobile-nav" role="navigation" aria-label="Incident section selector">
          <div className="mobile-nav-header">
            {contextBadge && <span className="mobile-nav-badge">{contextBadge}</span>}
            <span className="mobile-nav-counter">
              Stage {String(currentStep).padStart(2, '0')} of {String(totalSteps).padStart(2, '0')}
            </span>
          </div>
          <div className="mobile-nav-selector-wrap">
            <label htmlFor="mobile-story-select" className="sr-only">
              Jump to section
            </label>
            <select
              id="mobile-story-select"
              value={activeSectionId}
              onChange={(e) => scrollToSection(e.target.value)}
              className="mobile-story-select"
            >
              {sections.map((sec, idx) => (
                <option key={sec.id} value={sec.id}>
                  {sec.number || String(idx + 1).padStart(2, '0')} — {sec.navLabel || sec.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* TWO-COLUMN EDITORIAL LAYOUT (DESKTOP) */}
      <div className="editorial-story-grid">
        
        {/* LEFT COLUMN: STICKY CONTEXTUAL NAVIGATION (DESKTOP ONLY) */}
        {!isMobile && (
          <aside className="editorial-story-sticky-col" aria-label="Incident progression index">
            <div className="sticky-nav-card">
              {/* Context Header */}
              <div className="sticky-nav-header">
                {contextBadge && <span className="sticky-nav-badge">{contextBadge}</span>}
                {contextTitle && <h3 className="sticky-nav-title">{contextTitle}</h3>}
                {contextSubtitle && <p className="sticky-nav-subtitle">{contextSubtitle}</p>}
              </div>

              {/* Reading Progress Line */}
              {showReadingProgress && (
                <div 
                  className="sticky-nav-progress-bar"
                  role="progressbar"
                  aria-valuenow={Math.round((currentStep / totalSteps) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Story progression"
                >
                  <div
                    className="sticky-nav-progress-fill"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              )}

              {/* Navigation Items List with Progressive Connecting Spine Rail */}
              <div className="sticky-nav-list-wrapper">
                <div className="sticky-nav-spine-rail" aria-hidden="true">
                  <div
                    className="sticky-nav-spine-fill"
                    style={{
                      height: totalSteps > 1
                        ? `${((currentStep - 1) / (totalSteps - 1)) * 100}%`
                        : '100%'
                    }}
                  />
                </div>
                <nav className="sticky-nav-list" role="navigation" aria-label="Incident stages">
                  {sections.map((sec, idx) => {
                    const isActive = sec.id === activeSectionId;
                    const stepNumber = sec.number || String(idx + 1).padStart(2, '0');

                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`sticky-nav-item ${isActive ? 'is-active' : ''}`}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        <span className="sticky-nav-num">{stepNumber}</span>
                        <span className="sticky-nav-label">{sec.navLabel || sec.title}</span>
                        {isActive && <span className="sticky-nav-dot" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Step counter footer */}
              <div className="sticky-nav-footer">
                <span>Progress: Stage {currentStep} of {totalSteps}</span>
              </div>
            </div>
          </aside>
        )}

        {/* RIGHT COLUMN: ACTIVE CONTENT SECTIONS (SEQUENTIAL EDITORIAL FLOW) */}
        <div className="editorial-story-content-col" role="region" aria-label="Incident narrative detail">
          {sections.map((sec, idx) => {
            const isActive = sec.id === activeSectionId;
            const stepNumber = sec.number || String(idx + 1).padStart(2, '0');

            return (
              <section
                key={sec.id}
                id={`scroll-section-${sec.id}`}
                data-scroll-id={sec.id}
                className={`editorial-story-section-card ${isActive ? 'is-current-stage' : ''}`}
                style={{ scrollMarginTop: 'calc(var(--header-height, 68px) + 24px)' }}
              >
                {/* Section Header */}
                <header className="story-section-header">
                  <div className="story-section-meta">
                    <span className="story-section-number">{stepNumber}</span>
                    {sec.eyebrow && <span className="story-section-eyebrow">{sec.eyebrow}</span>}
                  </div>
                  {sec.title && <h2 className="story-section-title">{sec.title}</h2>}
                  {sec.description && <p className="story-section-lead">{sec.description}</p>}
                </header>

                {/* Section Body */}
                <div className="story-section-body">
                  {typeof sec.render === 'function' ? sec.render({ isActive, section: sec }) : (sec.content || null)}
                </div>
              </section>
            );
          })}
        </div>

      </div>

    </div>
  );
}
