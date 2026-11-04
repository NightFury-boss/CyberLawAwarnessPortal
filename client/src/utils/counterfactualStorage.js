/**
 * @file counterfactualStorage.js
 * @description Safe browser storage adapter for Stage 3 Counterfactual Scenario Learning.
 * 
 * CONTRACT:
 * - Outcome A (localStorage available): Completion persists across page reloads.
 * - Outcome B (localStorage blocked/throws): Completion is retained in memory for the
 *   current session only. The application functions cleanly with zero crashes and does
 *   not promise persistence after refresh.
 */

const STORAGE_KEY = 'cl_counterfactual_completed_slugs';

// In-memory fallback cache for Outcome B
let inMemoryCompletedSlugs = new Set();

let storageTested = false;

let isStorageWorking = false;

/**
 * Test whether window.localStorage is accessible and writable.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  if (storageTested) return isStorageWorking;

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      storageTested = true;

      return false;
    }

    const testKey = '__cf_storage_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isStorageWorking = true;
  } catch {
    isStorageWorking = false;
  }

  storageTested = true;

  return isStorageWorking;
}

/**
 * Retrieve the list of completed scenario slugs.
 * Merges localStorage (if available) with in-memory session cache.
 * @returns {string[]} array of unique completed slugs
 */
export function getCompletedSlugs() {
  const merged = new Set(inMemoryCompletedSlugs);

  if (isStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          parsed.forEach(slug => {
            if (slug && typeof slug === 'string' && slug.trim()) {
              merged.add(slug.trim());
            }
          });
        }
      }
    } catch {
      // Fallback silently to in-memory set
    }
  }

  return Array.from(merged);
}

/**
 * Record a scenario slug as completed.
 * Handles both Outcome A (durable write) and Outcome B (session fallback).
 * 
 * @param {string} slug - Unique scenario slug (e.g. 'midnight-power-cut-sms')
 * @returns {{ success: boolean, persistent: boolean, completedSlugs: string[] }}
 */
export function markSlugCompleted(slug) {
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    return { success: false, persistent: false, completedSlugs: getCompletedSlugs() };
  }

  const cleanSlug = slug.trim();
  inMemoryCompletedSlugs.add(cleanSlug);

  let persistent = false;

  if (isStorageAvailable()) {
    try {
      const current = getCompletedSlugs();

      if (!current.includes(cleanSlug)) {
        current.push(cleanSlug);
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      persistent = true;
    } catch {
      // Storage write failed (e.g. quota exceeded) -> retain in-memory Outcome B
      persistent = false;
    }
  }

  return {
    success: true,
    persistent,
    completedSlugs: getCompletedSlugs()
  };
}

/**
 * Check if a specific scenario slug is marked as completed.
 * @param {string} slug
 * @returns {boolean}
 */
export function isScenarioCompleted(slug) {
  if (!slug || typeof slug !== 'string') return false;

  const list = getCompletedSlugs();

  return list.includes(slug.trim());
}

/**
 * Helper to reset in-memory cache (primarily for automated testing environments).
 */
export function _resetInMemoryState() {
  inMemoryCompletedSlugs.clear();
  storageTested = false;
  isStorageWorking = false;
}
