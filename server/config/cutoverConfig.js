/**
 * Scoring v2 Deployment Cutover Configuration & Validation
 * Phase 4.2 / 4.3 Architecture
 *
 * Guarantees environmental uniformity and fail-closed safety across all server instances.
 */

function validateCutoverConfiguration(rawCutover = process.env.SCORING_V2_CUTOVER_DATE) {
  if (!rawCutover) {
    const err = new Error('FATAL_DEPLOYMENT_ERROR: SCORING_V2_CUTOVER_DATE environment variable is missing.');
    err.code = 'CONFIG_CUTOVER_MISSING';
    throw err;
  }

  const parsedDate = new Date(rawCutover);
  if (isNaN(parsedDate.getTime())) {
    const err = new Error(`FATAL_DEPLOYMENT_ERROR: SCORING_V2_CUTOVER_DATE contains invalid ISO string: "${rawCutover}"`);
    err.code = 'CONFIG_CUTOVER_INVALID';
    throw err;
  }

  return Object.freeze(parsedDate);
}

let deploymentTimestamp;
try {
  deploymentTimestamp = validateCutoverConfiguration();
} catch (err) {
  // If running in development without env, or during test harnesses that set process.env lazily,
  // allow test harnesses to re-invoke validateCutoverConfiguration.
  if (process.env.NODE_ENV === 'test' && !process.env.SCORING_V2_CUTOVER_DATE) {
    deploymentTimestamp = Object.freeze(new Date('2026-11-04T00:00:00.000Z'));
  } else {
    throw err;
  }
}

module.exports = {
  validateCutoverConfiguration,
  SCORING_V2_DEPLOYMENT_TIMESTAMP: deploymentTimestamp
};

