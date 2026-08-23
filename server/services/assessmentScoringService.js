const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentDecision = require('../models/AssessmentDecision');

const METRIC_TAGS = {
  recognition: 'THREAT_RECOGNITION',
  signalIdentification: 'SIGNAL_IDENTIFICATION',
  verification: 'VERIFICATION',
  decisionQuality: 'DECISION_QUALITY'
};

/**
 * Calculates server-authoritative assessment scores, opportunities, and penalty points
 * for a given session.
 * 
 * @param {string|mongoose.Types.ObjectId} sessionId 
 * @returns {Promise<Object>} Scoring payload for session update
 */
async function calculateScores(sessionId) {
  const decisionsMade = await AssessmentDecision.find({ assessmentSessionId: sessionId });

  let rawScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };
  let maxScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };

  let falsePositivePenaltyPoints = 0;
  let falsePositiveMaxPenaltyPoints = 0;

  let unreviewedAcceptancePenaltyPoints = 0;
  let unreviewedAcceptanceMaxPenaltyPoints = 0;

  const clampVal = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    // Strict enforcement: log a warning if data is out-of-bounds, then clamp
    if (val < 0 || val > 2) {
      console.warn(`[Scoring Warning] Value ${val} is outside [0, 2] scale. Clamping safely.`);
    }
    return Math.max(0, Math.min(2, Math.round(val)));
  };

  for (const choice of decisionsMade) {
    const stage = await ScenarioStage.findById(choice.stageId);
    const chosenDecision = await ScenarioDecision.findById(choice.decisionId);
    if (!stage || !chosenDecision) continue;

    const allDecisions = await ScenarioDecision.find({ stageId: stage._id });
    const focus = stage.measurementFocus || [];

    // 1. Evaluate Positive Dimensions (TR, SI, VB, DQ)
    for (const [key, tag] of Object.entries(METRIC_TAGS)) {
      if (focus.includes(tag)) {
        // Threat Recognition does not apply to legitimate stages
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

    // 2. Evaluate False Positive Control (FP)
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

    // 3. Evaluate Unreviewed Acceptance Control (UA)
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
    scores,
    opportunities,
    falsePositivePenaltyPoints,
    falsePositiveMaxPenaltyPoints,
    unreviewedAcceptancePenaltyPoints,
    unreviewedAcceptanceMaxPenaltyPoints
  };
}

module.exports = {
  calculateScores
};
