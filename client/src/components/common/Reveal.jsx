import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable Scroll Reveal System for Cyber Law Awareness Portal.
 * 
 * Complies with Section 14 & 20 of Motion Direction:
 * - Uses IntersectionObserver with trigger-once guarantee
 * - Restrained motion: opacity + subtle translation (10-14px)
 * - Standardized easing (--ease-standard)
 * - Strict prefers-reduced-motion support (renders visible immediately without movement)
 * - No scroll-jacking, no infinite loops, no layout shifts
 */
export default function Reveal({
  children,
  as: Component = 'div',
  variant = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  className = '',
  style = {},
  triggerOnce = true,
  ...props
}) {
  const [isRevealed, setIsRevealed] = useState(() => {
    // Immediately reveal if running in non-browser or if reduced-motion is preferred
    if (typeof window === 'undefined') return true;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  const domRef = useRef(null);

  useEffect(() => {
    // Check reduced motion at mount
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIsRevealed(true);
        return;
      }
    } catch {
      // fallback
    }

    if (isRevealed && triggerOnce) return;

    const node = domRef.current;
    if (!node) return;

    if (!('IntersectionObserver' in window)) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            if (triggerOnce && node) {
              observer.unobserve(node);
            }
          } else if (!triggerOnce) {
            setIsRevealed(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, isRevealed]);

  const combinedStyle = {
    ...style,
    transitionDelay: isRevealed && delay > 0 ? `${delay}ms` : undefined,
    transitionDuration: duration ? `${duration}ms` : undefined,
  };

  const variantClass = `portal-reveal-${variant}`;
  const revealedClass = isRevealed ? 'is-revealed' : '';

  return (
    <Component
      ref={domRef}
      className={`portal-reveal ${variantClass} ${revealedClass} ${className}`.trim()}
      style={combinedStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
