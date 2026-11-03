const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentDecision = require('../models/AssessmentDecision');
const AssessmentSession = require('../models/AssessmentSession');
const { SCORING_V2_DEPLOYMENT_TIMESTAMP } = require('../config/cutoverConfig');

const SUPPORTED_SCORING_VERSIONS = Object.freeze([1, 2]);

const METRIC_TAGS = {
  recognition: 'THREAT_RECOGNITION',
  signalIdentification: 'SIGNAL_IDENTIFICATION',
  verification: 'VERIFICATION',
  decisionQuality: 'DECISION_QUALITY'
};

/**
 * Resolves the deterministic scoring version for an assessment session.
 * 
 * Rules:
 * 1. Explicit unsupported versions FAIL CLOSED (throw error).
 * 2. Explicit supported versions (1, 2) are strictly preserved.
 * 3. Pre-cutover unversioned sessions (completed or in-progress) resolve to 1.
 * 4. Missing/invalid createdAt fallbacks resolve safely to 1.
 * 5. Newly created post-cutover sessions are explicitly stamped 2 at birth.
 * 
 * @param {Object} session 
 * @returns {number} 1 or 2
 */
function resolveSessionScoringVersion(session) {
  if (!session) return 1;

  // Guard 1: Explicit unsupported versions FAIL CLOSED immediately
  if (session.scoringVersion !== undefined && session.scoringVersion !== null) {
    const numericVersion = Number(session.scoringVersion);
    if (!Number.isInteger(numericVersion) || !SUPPORTED_SCORING_VERSIONS.includes(numericVersion)) {
      const err = new Error(`Unsupported scoring version: ${session.scoringVersion}`);
      err.code = 'UNSUPPORTED_SCORING_VERSION';
      err.statusCode = 500;
      throw err;
    }
    return numericVersion;
  }

  // Guard 2: Pre-cutover unversioned sessions (completed or in-progress) resolve to v1
  if (session.createdAt) {
    const createdDate = new Date(session.createdAt);
    if (!isNaN(createdDate.getTime()) && createdDate < SCORING_V2_DEPLOYMENT_TIMESTAMP) {
      return 1;
    }
  }

  // Guard 3: Safe fallback for legacy seed fixtures lacking createdAt
  return 1;
}

/**
 * Legacy Scoring Engine (Version 1)
 * Preserved byte-for-byte for historical sessions and pre-cutover in-progress sessions.
 */
async function calculateScoresV1(session, decisionsMade) {
  let rawScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };
  let maxScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };

  let falsePositivePenaltyPoints = 0;
  let falsePositiveMaxPenaltyPoints = 0;

  let unreviewedAcceptancePenaltyPoints = 0;
  let unreviewedAcceptanceMaxPenaltyPoints = 0;

  const clampVal = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.max(0, Math.min(2, Math.round(val)));
  };

  for (const choice of decisionsMade) {
    const stage = await ScenarioStage.findById(choice.stageId);
    const chosenDecision = await ScenarioDecision.findById(choice.decisionId);
    if (!stage || !chosenDecision) continue;

    const allDecisions = await ScenarioDecision.find({ stageId: stage._id });
    const focus = stage.measurementFocus || [];

    // 1. Positive Dimensions
    for (const [key, tag] of Object.entries(METRIC_TAGS)) {
      if (focus.includes(tag)) {
        if (key === 'recognition' && stage.eventClassification === 'legitimate') {
          continue;
        }

        const decEffects = chosenDecision.behaviorEffects || {};
        rawScores[key] += clampVal(decEffects[key]);

        let maxVal = 0;
        for (const d of allDecisions) {
          const effects = d.behaviorEffects || {};
          maxVal = Math.max(maxVal, clampVal(effects[key]));
        }
        maxScores[key] += maxVal;
      }
    }

    // 2. False Positive Control
    if (focus.includes('FALSE_POSITIVE_CONTROL') && stage.eventClassification === 'legitimate') {
      const decEffects = chosenDecision.behaviorEffects || {};
      falsePositivePenaltyPoints += clampVal(decEffects.falsePositive);

      let maxPenalty = 0;
      for (const d of allDecisions) {
        const effects = d.behaviorEffects || {};
        maxPenalty = Math.max(maxPenalty, clampVal(effects.falsePositive));
      }
      falsePositiveMaxPenaltyPoints += maxPenalty;
    }

    // 3. Unreviewed Acceptance Control
    if (focus.includes('UNREVIEWED_ACCEPTANCE')) {
      let maxPenalty = 0;
      for (const d of allDecisions) {
        const effects = d.behaviorEffects || {};
        maxPenalty = Math.max(maxPenalty, clampVal(effects.unreviewedAcceptance));
      }

      if (maxPenalty > 0) {
        const decEffects = chosenDecision.behaviorEffects || {};
        unreviewedAcceptancePenaltyPoints += clampVal(decEffects.unreviewedAcceptance);
        unreviewedAcceptanceMaxPenaltyPoints += maxPenalty;
      }
    }
  }

  const normalize = (raw, max) => {
    if (max <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((raw / max) * 100)));
  };

  const normalizePenalty = (penalty, maxPenalty) => {
    if (maxPenalty <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((1 - (penalty / maxPenalty)) * 100)));
  };

  const scores = {
    recognition: normalize(rawScores.recognition, maxScores.recognition),
    signalIdentification: normalize(rawScores.signalIdentification, maxScores.signalIdentification),
    verification: normalize(rawScores.verification, maxScores.verification),
    decisionQuality: normalize(rawScores.decisionQuality, maxScores.decisionQuality),
    falsePositive: normalizePenalty(falsePositivePenaltyPoints, falsePositiveMaxPenaltyPoints),
    unreviewedAcceptance: normalizePenalty(unreviewedAcceptancePenaltyPoints, unreviewedAcceptanceMaxPenaltyPoints)
  };

  const opportunities = {
    recognition: maxScores.recognition,
    signalIdentification: maxScores.signalIdentification,
    verification: maxScores.verification,
    decisionQuality: maxScores.decisionQuality,
    falsePositive: falsePositiveMaxPenaltyPoints,
    unreviewedAcceptance: unreviewedAcceptanceMaxPenaltyPoints
  };

  return {
    scoringVersion: 1,
    rawScores,
    maxScores,
    scores,
    opportunities,
    encounters: {
      recognition: decisionsMade.length,
      signalIdentification: decisionsMade.length,
      verification: decisionsMade.length,
      decisionQuality: decisionsMade.length,
      falsePositive: decisionsMade.length,
      unreviewedAcceptance: decisionsMade.length
    },
    falsePositivePenaltyPoints,
    falsePositiveMaxPenaltyPoints,
    unreviewedAcceptancePenaltyPoints,
    unreviewedAcceptanceMaxPenaltyPoints
  };
}

/**
 * Refined Scoring Engine (Version 2)
 * Phase 4.3 Architecture:
 * - Decouples discrete decision encounters (N) from point ceilings.
 * - Enforces Global 16-point TR budget (Stage 7 early resolution = +4).
 * - Discrete 5-probe SI independent scoring.
 * - Pure 2-encounter DQ evaluation (Stages 5 and 13).
 * - First-class null unassessed representation (when count === 0).
 */
async function calculateScoresV2(session, decisionsMade) {
  const encounters = {
    recognition: 0,
    signalIdentification: 0,
    verification: 0,
    decisionQuality: 0,
    falsePositive: 0,
    unreviewedAcceptance: 0
  };

  let rawScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };
  let maxScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };

  let falsePositivePenaltyPoints = 0;
  let falsePositiveMaxPenaltyPoints = 0;

  let unreviewedAcceptancePenaltyPoints = 0;
  let unreviewedAcceptanceMaxPenaltyPoints = 0;

  const clampVal = (val, maxBound = 2) => {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.max(0, Math.min(maxBound, Math.round(val)));
  };

  for (const choice of decisionsMade) {
    const stage = await ScenarioStage.findById(choice.stageId);
    const chosenDecision = await ScenarioDecision.findById(choice.decisionId);
    if (!stage || !chosenDecision) continue;

    const allDecisions = await ScenarioDecision.find({ stageId: stage._id });
    const focus = stage.measurementFocus || [];

    // 1. Threat Recognition (TR)
    if (focus.includes('THREAT_RECOGNITION') && stage.eventClassification !== 'legitimate') {
      encounters.recognition += 1;
      const isStage7 = stage.stageOrder === 7;
      const maxBound = isStage7 ? 4 : 2;

      const decEffects = chosenDecision.behaviorEffects || {};
      rawScores.recognition += clampVal(decEffects.recognition, maxBound);

      let maxVal = 0;
      for (const d of allDecisions) {
        const effects = d.behaviorEffects || {};
        maxVal = Math.max(maxVal, clampVal(effects.recognition, maxBound));
      }
      maxScores.recognition += maxVal;
    }

    // 2. Signal Identification (SI) via Universal Probes
    if (stage.hasSignalProbe) {
      encounters.signalIdentification += 1;
      maxScores.signalIdentification += 2;

      if (choice.signalProbeDecisionId) {
        // Check if selected probe matches a registered correct probe option on the stage
        const probeOption = stage.signalProbes && stage.signalProbes.id
          ? stage.signalProbes.id(choice.signalProbeDecisionId)
          : null;

        if (probeOption && probeOption.isCorrect) {
          rawScores.signalIdentification += 2;
        } else {
          // Alternatively, if probe was stored as a ScenarioDecision
          const probeDecision = await ScenarioDecision.findById(choice.signalProbeDecisionId);
          if (probeDecision && probeDecision.behaviorEffects && probeDecision.behaviorEffects.signalIdentification > 0) {
            rawScores.signalIdentification += clampVal(probeDecision.behaviorEffects.signalIdentification);
          }
        }
      }
    } else if (focus.includes('SIGNAL_IDENTIFICATION') && !stage.hasSignalProbe) {
      // Fallback for stages without discrete sub-probes
      encounters.signalIdentification += 1;
      const decEffects = chosenDecision.behaviorEffects || {};
      rawScores.signalIdentification += clampVal(decEffects.signalIdentification);
      let maxVal = 0;
      for (const d of allDecisions) {
        maxVal = Math.max(maxVal, clampVal(d.behaviorEffects?.signalIdentification));
      }
      maxScores.signalIdentification += maxVal;
    }

    // 3. Verification Behaviour (VB)
    if (focus.includes('VERIFICATION')) {
      encounters.verification += 1;
      const decEffects = chosenDecision.behaviorEffects || {};
      rawScores.verification += clampVal(decEffects.verification);

      let maxVal = 0;
      for (const d of allDecisions) {
        maxVal = Math.max(maxVal, clampVal(d.behaviorEffects?.verification));
      }
      maxScores.verification += maxVal;
    }

    // 4. Decision Quality (DQ) - Strictly Evaluated on Stages with DECISION_QUALITY focus
    if (focus.includes('DECISION_QUALITY')) {
      encounters.decisionQuality += 1;
      const decEffects = chosenDecision.behaviorEffects || {};
      rawScores.decisionQuality += clampVal(decEffects.decisionQuality);

      let maxVal = 0;
      for (const d of allDecisions) {
        maxVal = Math.max(maxVal, clampVal(d.behaviorEffects?.decisionQuality));
      }
      maxScores.decisionQuality += maxVal;
    }

    // 5. False Positive Control (FP)
    if (focus.includes('FALSE_POSITIVE_CONTROL') && stage.eventClassification === 'legitimate') {
      encounters.falsePositive += 1;
      const decEffects = chosenDecision.behaviorEffects || {};
      falsePositivePenaltyPoints += clampVal(decEffects.falsePositive);

      let maxPenalty = 0;
      for (const d of allDecisions) {
        maxPenalty = Math.max(maxPenalty, clampVal(d.behaviorEffects?.falsePositive));
      }
      falsePositiveMaxPenaltyPoints += maxPenalty;
    }

    // 6. Unreviewed Acceptance Control (UA)
    if (focus.includes('UNREVIEWED_ACCEPTANCE')) {
      let maxPenalty = 0;
      for (const d of allDecisions) {
        maxPenalty = Math.max(maxPenalty, clampVal(d.behaviorEffects?.unreviewedAcceptance));
      }

      if (maxPenalty > 0) {
        encounters.unreviewedAcceptance += 1;
        const decEffects = chosenDecision.behaviorEffects || {};
        unreviewedAcceptancePenaltyPoints += clampVal(decEffects.unreviewedAcceptance);
        unreviewedAcceptanceMaxPenaltyPoints += maxPenalty;
      }
    }
  }

  // Global 16-point Threat Recognition budget invariant:
  // Stages 7 & 9 form a compound digital arrest incident with 4 points total capacity.
  maxScores.recognition = Math.min(16, maxScores.recognition);

  // Normalization with first-class null unassessed representation
  const normalizePositive = (raw, max, count) => {
    if (count === 0 || max <= 0) return null; // Explicit unassessed
    return Math.max(0, Math.min(100, Math.round((raw / max) * 100)));
  };

  const normalizePenalty = (penalty, maxPenalty, count) => {
    if (count === 0 || maxPenalty <= 0) return null; // Explicit unassessed
    return Math.max(0, Math.min(100, Math.round((1 - (penalty / maxPenalty)) * 100)));
  };

  const scores = {
    recognition: normalizePositive(rawScores.recognition, maxScores.recognition, encounters.recognition),
    signalIdentification: normalizePositive(rawScores.signalIdentification, maxScores.signalIdentification, encounters.signalIdentification),
    verification: normalizePositive(rawScores.verification, maxScores.verification, encounters.verification),
    decisionQuality: normalizePositive(rawScores.decisionQuality, maxScores.decisionQuality, encounters.decisionQuality),
    falsePositive: normalizePenalty(falsePositivePenaltyPoints, falsePositiveMaxPenaltyPoints, encounters.falsePositive),
    unreviewedAcceptance: normalizePenalty(unreviewedAcceptancePenaltyPoints, unreviewedAcceptanceMaxPenaltyPoints, encounters.unreviewedAcceptance)
  };

  const opportunities = {
    recognition: maxScores.recognition,
    signalIdentification: maxScores.signalIdentification,
    verification: maxScores.verification,
    decisionQuality: maxScores.decisionQuality,
    falsePositive: falsePositiveMaxPenaltyPoints,
    unreviewedAcceptance: unreviewedAcceptanceMaxPenaltyPoints
  };

  return {
    scoringVersion: 2,
    rawScores,
    maxScores,
    scores,
    opportunities,
    encounters,
    falsePositivePenaltyPoints,
    falsePositiveMaxPenaltyPoints,
    unreviewedAcceptancePenaltyPoints,
    unreviewedAcceptanceMaxPenaltyPoints
  };
}

/**
 * Calculates server-authoritative assessment scores for a given session.
 * Dispatches to version 1 or 2 based on deterministic version resolution.
 * 
 * @param {string|mongoose.Types.ObjectId} sessionId 
 * @returns {Promise<Object>} Scoring payload for session update
 */
async function calculateScores(sessionId) {
  const session = await AssessmentSession.findById(sessionId);
  if (!session) {
    throw new Error(`Assessment session not found: ${sessionId}`);
  }

  const decisionsMade = await AssessmentDecision.find({ assessmentSessionId: sessionId });
  const version = resolveSessionScoringVersion(session);

  if (version === 1) {
    return calculateScoresV1(session, decisionsMade);
  } else if (version === 2) {
    return calculateScoresV2(session, decisionsMade);
  } else {
    const err = new Error(`Unsupported scoring version: ${version}`);
    err.code = 'UNSUPPORTED_SCORING_VERSION';
    err.statusCode = 500;
    throw err;
  }
}

module.exports = {
  calculateScores,
  calculateScoresV1,
  calculateScoresV2,
  resolveSessionScoringVersion,
  SUPPORTED_SCORING_VERSIONS
};
