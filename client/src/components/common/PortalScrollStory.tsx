import React, { useState, useEffect, useRef, useId } from 'react';

export type PortalScrollStoryItem = {
  number?: string;
  title: string;
  description: string;
  media?: string;
  mediaAlt?: string;
  eyebrow?: string;
};

export interface PortalScrollStoryProps {
  items: PortalScrollStoryItem[];
  heading?: string;
  intro?: string;
  className?: string;
  showProgress?: boolean;
  showStepIndicator?: boolean;
}

/**
 * Editorial Media Viewer for the Sticky Panel and Mobile Inset.
 * Handles images gracefully with fallbacks and clean quiet placeholder states when media is absent.
 */
function StoryMediaViewer({ 
  item, 
  index, 
  priority = false 
}: { 
  item: PortalScrollStoryItem; 
  index: number; 
  priority?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const displayNum = item.number || String(index + 1).padStart(2, '0');

  if (item.media && !imageError) {
    return (
      <div className="story-media-image-wrap">
        <img
          src={item.media}
          alt={item.mediaAlt || item.title || `Visual representation for step ${displayNum}`}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImageError(true)}
          className="story-media-img"
        />
      </div>
    );
  }

  // Quiet text-based architectural placeholder
  return (
    <div className="story-media-placeholder" aria-hidden="true">
      <div className="placeholder-watermark">{displayNum}</div>
      <div className="placeholder-body">
        {item.eyebrow && <span className="placeholder-eyebrow">{item.eyebrow}</span>}
        <span className="placeholder-title">{item.title}</span>
        <span className="placeholder-indicator">Stage {displayNum}</span>
      </div>
    </div>
  );
}

/**
 * PortalScrollStory
 * 
 * Reusable editorial scroll component designed specifically for the Cyber Law Awareness Portal.
 * 
 * Desktop Layout:
 * - Left: Sticky visual panel (aspect 4:3) with smooth crossfade and step indicator.
 * - Right: Sequential educational content items scrolling naturally.
 * 
 * Mobile Layout:
 * - Clean vertical stack with inline media under each story item.
 * 
 * Features:
 * - Functional section reading progress bar (0% - 100% of this section).
 * - Stable, jitter-free active item detection via viewport-center proximity.
 * - Respects prefers-reduced-motion.
 * - Fully semantic HTML (section, header, article, headings).
 */
export default function PortalScrollStory({
  items = [],
  heading,
  intro,
  className = '',
  showProgress = true,
  showStepIndicator = true,
}: PortalScrollStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const headingId = useId();

  const safeItems = Array.isArray(items) ? items : [];

  // Scroll tracking: section reading progress + active item detection
  useEffect(() => {
    if (safeItems.length === 0) return;

    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;

        const section = sectionRef.current;
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight;
        const viewportHeight = window.innerHeight;

        // 1. Calculate section reading progress (from when section enters top to when it leaves)
        if (showProgress) {
          const scrollDistance = sectionHeight - viewportHeight * 0.6;
          if (scrollDistance > 0) {
            const currentScroll = -rect.top;
            const rawProgress = currentScroll / scrollDistance;
            const clamped = Math.max(0, Math.min(1, rawProgress));
            setSectionProgress(clamped);
          } else {
            setSectionProgress(rect.top <= 0 ? 1 : 0);
          }
        }

        // 2. Active item detection: Find the item closest to 45% of the viewport height
        const targetLine = viewportHeight * 0.45;
        let closestIndex = 0;
        let minDistance = Infinity;

        itemRefs.current.forEach((el, idx) => {
          if (!el) return;
          const elRect = el.getBoundingClientRect();
          const elMidpoint = elRect.top + elRect.height * 0.4;
          const distance = Math.abs(elMidpoint - targetLine);

          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
          }
        });

        setActiveIndex((prev) => (prev !== closestIndex ? closestIndex : prev));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial measurement

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [safeItems.length, showProgress]);

  if (safeItems.length === 0) {
    return null;
  }

  const activeItem = safeItems[activeIndex] || safeItems[0];
  const totalCount = safeItems.length;

  return (
    <section
      ref={sectionRef}
      className={`portal-scroll-story-section ${className}`}
      aria-labelledby={heading ? headingId : undefined}
    >
      {/* 1. Subtle Section Reading Progress Bar */}
      {showProgress && (
        <div 
          className="portal-story-progress-track"
          role="progressbar"
          aria-valuenow={Math.round(sectionProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Section reading progress"
        >
          <div 
            className="portal-story-progress-fill" 
            style={{ width: `${(sectionProgress * 100).toFixed(1)}%` }}
          />
        </div>
      )}

      <div className="container portal-story-container">
        {/* 2. Optional Section Header / Intro */}
        {(heading || intro) && (
          <header className="portal-story-header">
            {heading && (
              <h2 id={headingId} className="portal-story-heading">
                {heading}
              </h2>
            )}
            {intro && <p className="portal-story-intro">{intro}</p>}
          </header>
        )}

        {/* 3. Main Story Grid */}
        <div className="portal-story-grid">
          {/* Left Column: Sticky Visual Panel (Controlled via CSS media queries) */}
          <div className="portal-story-sticky-col" aria-hidden="true">
            <div className="story-sticky-frame-wrapper">
              <div className="story-sticky-media-frame">
                {safeItems.map((item, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <div
                      key={`media-${item.number || idx}`}
                      className={`story-sticky-slide ${isCurrent ? 'active' : 'inactive'}`}
                    >
                      <StoryMediaViewer item={item} index={idx} priority={idx === 0} />
                    </div>
                  );
                })}
              </div>

              {/* Optional Step Indicator Under Sticky Visual */}
              {showStepIndicator && totalCount > 1 && (
                <div className="story-step-indicator" aria-label={`Step ${activeIndex + 1} of ${totalCount}`}>
                  <div className="step-indicator-segments">
                    {safeItems.map((item, idx) => {
                      const isCurrent = idx === activeIndex;
                      return (
                        <span
                          key={`dot-${item.number || idx}`}
                          className={`step-segment ${isCurrent ? 'active' : 'inactive'}`}
                        />
                      );
                    })}
                  </div>
                  <span className="step-indicator-counter">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sequential Scrolling Content Items */}
          <div className="portal-story-content-col" role="feed" aria-label="Methodology progression steps">
            {safeItems.map((item, idx) => {
              const isCurrent = idx === activeIndex;
              const displayNum = item.number || String(idx + 1).padStart(2, '0');

              return (
                <article
                  key={`story-item-${item.number || idx}`}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  className={`story-content-item ${isCurrent ? 'is-active' : 'is-inactive'}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="story-item-meta">
                    {displayNum && <span className="story-item-number">{displayNum}</span>}
                    {item.eyebrow && <span className="story-item-eyebrow">{item.eyebrow}</span>}
                  </div>

                  <h3 className="story-item-title">{item.title}</h3>
                  <p className="story-item-description">{item.description}</p>

                  {/* Inline Visual for Mobile/Tablet Stack (Hidden on desktop via CSS) */}
                  <div className="story-item-mobile-media" aria-hidden="true">
                    <StoryMediaViewer item={item} index={idx} priority={idx === 0} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
