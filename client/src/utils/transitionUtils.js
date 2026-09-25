/**
 * Controlled State Transition Helper for Cyber Law Awareness Portal.
 * 
 * Complies with Editorial Motion Direction:
 * - Graceful progressive enhancement using native document.startViewTransition when available.
 * - Instant fallback for browsers without startViewTransition or when user requests reduced motion.
 * - Does not introduce external dependencies or theme toggles.
 * - Keeps transitions scoped and restrained (220-340ms).
 */

export function performStateTransition(updateFn) {
  if (typeof window === 'undefined') {
    updateFn();
    return;
  }

  // Strictly respect user preference for reduced motion
  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    updateFn();
    return;
  }

  // Progressive enhancement: startViewTransition if available
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    try {
      document.startViewTransition(() => {
        updateFn();
      });
      return;
    } catch {
      // In case of any browser runtime error, fallback to immediate update
      updateFn();
      return;
    }
  }

  // Default clean state update
  updateFn();
}
