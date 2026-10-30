/**
 * regexUtils.js
 * Centralized utility for safe regular expression handling.
 * Prevents ReDoS and syntax errors from unsanitized user query inputs.
 */

/**
 * Escapes all regular expression special characters in a string.
 * @param {string} str - Raw input string
 * @returns {string} Escaped string safe for use in RegExp or MongoDB $regex
 */
function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  escapeRegex
};

