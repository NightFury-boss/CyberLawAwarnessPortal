/**
 * Remediation Engine Service
 * Phase 3: Server-Authoritative Remediation Selection & Behavioral Habit Mapping
 *
 * NON-NEGOTIABLE PRINCIPLES:
 * 1. A behavioral metric is NOT a statutory offence.
 * 2. Recommendations are derived strictly on the server from completed assessment data.
 * 3. Severity multipliers are product prioritization heuristics, not legal constants.
 * 4. Opportunity sufficiency prevents branding low-sample occurrences as weaknesses.
 * 5. Do not manufacture weaknesses for all-strong profiles.
 */

const catalog = require('../config/remediationCatalog');
const AssessmentSession = require('../models/AssessmentSession');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const LawSection = require('../models/LawSection');

// Product severity multipliers (Heuristics reflecting real-world harm potential)
const SEVERITY_WEIGHTS = {
  unreviewedAcceptance: 1.30,  // Critical mistake: financial credential / UPI PIN exposure
  verification: 1.25,          // Exposure to institutional extortion / digital arrest coercion
  recognition: 1.15,           // Spotting disguised phishing / courier lures
  signalIdentification: 1.05,  // Missing technical domain syntax and fee cues
  decisionQuality: 1.00,       // General digital prudence & software hygiene
  falsePositive: 0.90          // Over-reporting causes friction, but zero financial loss
};

const METRIC_KEYS = [
  'unreviewedAcceptance',
  'verification',
  'recognition',
  'signalIdentification',
  'decisionQuality',
  'falsePositive'
];

/**
 * Calculate opportunity sufficiency multiplier
 * @param {number} opportunities - applicable opportunities or max penalty points
 */
function getOpportunityFactor(opportunities) {
  if (opportunities === undefined || opportunities === null || opportunities < 2) {
    return 0.0; // Insufficient sample; measurement not statistically meaningful
  }
  if (opportunities >= 2 && opportunities <= 3) {
    return 0.75; // Low confidence
  }
  return 1.0; // Standard confidence (>= 4)
}

/**
 * Extract normalized score and opportunity count for a metric from session
 */
function extractMetricData(session, metricKey) {
  const scoresMap = session.behaviourScores instanceof Map
    ? Object.fromEntries(session.behaviourScores)
    : (session.behaviourScores || {});

  const oppsMap = session.behaviourOpportunities instanceof Map
    ? Object.fromEntries(session.behaviourOpportunities)
    : (session.behaviourOpportunities || {});

  const normalizedScore = typeof scoresMap[metricKey] === 'number'
    ? scoresMap[metricKey]
    : null;

  let opportunities = typeof oppsMap[metricKey] === 'number'
    ? oppsMap[metricKey]
    : 0;

  // For penalty metrics, use actual max penalty points as the opportunity measure
  if (metricKey === 'falsePositive') {
    if (typeof session.falsePositiveMaxPenaltyPoints === 'number' && session.falsePositiveMaxPenaltyPoints > 0) {
      opportunities = session.falsePositiveMaxPenaltyPoints;
    }
  } else if (metricKey === 'unreviewedAcceptance') {
    if (typeof session.unreviewedAcceptanceMaxPenaltyPoints === 'number' && session.unreviewedAcceptanceMaxPenaltyPoints > 0) {
      opportunities = session.unreviewedAcceptanceMaxPenaltyPoints;
    }
  }

  return { normalizedScore, opportunities };
}

/**
 * Multi-Factor Priority Ranking Engine
 */
function rankEligibleMetrics(session) {
  const ranked = [];

  for (const metricKey of METRIC_KEYS) {
    const { normalizedScore, opportunities } = extractMetricData(session, metricKey);

    if (normalizedScore === null) continue; // Skip missing metrics gracefully

    const opportunityFactor = getOpportunityFactor(opportunities);
    const deficit = Math.max(0, 100 - normalizedScore);
    const severityWeight = SEVERITY_WEIGHTS[metricKey] || 1.0;

    const priorityScore = deficit * severityWeight * opportunityFactor;
    const isEligibleWeakness = normalizedScore < 75 && opportunityFactor > 0;

    ranked.push({
      metricKey,
      normalizedScore,
      opportunities,
      opportunityFactor,
      deficit,
      severityWeight,
      priorityScore,
      isEligibleWeakness
    });
  }

  // Sort descending by priorityScore; tie-break by higher severityWeight
  ranked.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return b.severityWeight - a.severityWeight;
  });

  return ranked;
}

/**
 * Determine final assessment habit shift state compared against baseline
 */
function determineFinalHabitState(finalMetric, baselineMetric) {
  if (!baselineMetric || baselineMetric.normalizedScore === null) {
    return {
      state: 'continued_practice',
      badge: 'Habit Focus Area',
      message: 'Focus on this core defensive habit to build resilience against everyday deception.'
    };
  }

  const baseScore = baselineMetric.normalizedScore;
  const finalScore = finalMetric.normalizedScore;
  const delta = finalScore - baseScore;

  // Case 1: Consolidated Strength (Weak in Baseline, Strong in Final with opportunity sufficiency)
  if (baseScore < 75 && finalScore >= 75 && finalMetric.opportunityFactor >= 0.75) {
    return {
      state: 'consolidated_strength',
      badge: 'Habit Shift Mastered',
      message: `Habit shift demonstrated! You improved from ${baseScore}% (Baseline) to ${finalScore}% (Final), resisting pressure.`
    };
  }

  // Case 2: Continued Practice Needed (Weak in Baseline and still below threshold in Final)
  if (baseScore < 75 && finalScore < 75) {
    return {
      state: 'continued_practice',
      badge: 'Continued Habit Focus',
      message: delta > 0
        ? `You improved from ${baseScore}% to ${finalScore}%, but continued practice is recommended to solidify this defensive habit.`
        : 'Decisions in this situation remained vulnerable under pressure. Review this learning pathway to reinforce habits.'
    };
  }

  // Case 3: Emerging Gap (Strong in Baseline, but dropped under complex branching final scenarios)
  if (baseScore >= 75 && finalScore < 75) {
    return {
      state: 'emerging_gap',
      badge: 'New Scenario Focus',
      message: 'High-pressure branching scenarios exposed a new vulnerability not present during your earlier baseline.'
    };
  }

  // Case 4: Mastery / Maintenance (Both Baseline and Final are strong with opportunity sufficiency)
  if (finalScore >= 75 && finalMetric.opportunityFactor >= 0.75) {
    return {
      state: 'mastery',
      badge: 'Habit Mastered',
      message: 'Consistent digital vigilance demonstrated across all routine and high-pressure scenarios.'
    };
  }

  // Fallback for edge cases
  return {
    state: 'continued_practice',
    badge: 'Continued Habit Focus',
    message: 'Reinforce this practical defense rule to solidify your daily online security.'
  };
}

/**
 * Generate server-authoritative remediation recommendations for a session
 * @param {string} sessionId - MongoDB AssessmentSession ObjectId
 * @param {string} userId - Authenticated user ObjectId string
 */
async function generateRemediation(sessionId, userId) {
  const session = await AssessmentSession.findById(sessionId);
  if (!session) {
    const error = new Error('Assessment session not found');
    error.status = 404;
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  // Ownership verification
  if (session.userId.toString() !== userId.toString()) {
    const error = new Error('Access denied to requested assessment session');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  // Completion check
  if (session.status !== 'completed') {
    const error = new Error('Remediation recommendations are only available for completed assessments');
    error.status = 400;
    error.code = 'SESSION_NOT_COMPLETED';
    throw error;
  }

  const isFinal = session.scenarioCode === 'final';
  const userState = isFinal ? 'final' : 'baseline';

  // If final, load matching v2 baseline session for delta comparison
  let baselineSession = null;
  if (isFinal) {
    baselineSession = await AssessmentSession.findOne({
      userId: session.userId,
      scenarioCode: 'baseline',
      scenarioVersion: session.scenarioVersion || 2,
      status: 'completed'
    }).sort({ completedAt: -1 });
  }

  // Multi-factor ranking
  const rankedMetrics = rankEligibleMetrics(session);
  const eligibleWeaknesses = rankedMetrics.filter(m => m.isEligibleWeakness);

  const selectedPathways = [];
  const maintenancePathway = catalog.find(p => p.pathwayId === 'pathway-maintenance-reinforcement');

  if (eligibleWeaknesses.length === 0) {
    // All-Strong Profile: Do NOT manufacture fake weaknesses
    if (maintenancePathway) {
      selectedPathways.push({
        pathway: maintenancePathway,
        state: 'mastery',
        stateBadge: 'Advanced Vigilance',
        stateMessage: 'All measured everyday digital habits are strong. Explore advanced protections against SIM swapping and identity theft.'
      });
    }
  } else if (eligibleWeaknesses.length === 1) {
    // 1 Weakness: Return primary weakness + 1 maintenance pathway
    const primary = eligibleWeaknesses[0];
    const path = catalog.find(p => p.metricKey === primary.metricKey);
    if (path) {
      let stateInfo = {
        state: 'diagnostic_focus',
        badge: 'Habit Focus Area',
        message: 'Focusing on this primary habit will significantly strengthen your daily digital defense.'
      };
      if (isFinal && baselineSession) {
        const baseMetric = extractMetricData(baselineSession, primary.metricKey);
        stateInfo = determineFinalHabitState(primary, baseMetric);
      }
      selectedPathways.push({
        pathway: path,
        state: stateInfo.state,
        stateBadge: stateInfo.badge,
        stateMessage: stateInfo.message
      });
    }

    if (maintenancePathway) {
      selectedPathways.push({
        pathway: maintenancePathway,
        state: 'mastery',
        stateBadge: 'Advanced Vigilance',
        stateMessage: 'Alongside your primary focus area, maintain vigilance against secondary channel attacks.'
      });
    }
  } else {
    // Top 2 Weaknesses
    for (let i = 0; i < 2; i++) {
      const metricInfo = eligibleWeaknesses[i];
      const path = catalog.find(p => p.metricKey === metricInfo.metricKey);
      if (path) {
        let stateInfo = {
          state: 'diagnostic_focus',
          badge: 'Habit Focus Area',
          message: 'Practicing this habit will prepare you for common online deception tactics.'
        };
        if (isFinal && baselineSession) {
          const baseMetric = extractMetricData(baselineSession, metricInfo.metricKey);
          stateInfo = determineFinalHabitState(metricInfo, baseMetric);
        }
        selectedPathways.push({
          pathway: path,
          state: stateInfo.state,
          stateBadge: stateInfo.badge,
          stateMessage: stateInfo.message
        });
      }
    }
  }

  // Validate referenced DB entities before returning
  const validatedRecommendations = [];
  for (const item of selectedPathways) {
    const p = item.pathway;

    // Verify CyberCrime exists
    const crime = await CyberCrime.findOne({ slug: p.crimeSlug });
    // Verify CaseStudy exists
    const caseStudy = await CaseStudy.findOne({ slug: p.caseStudySlug });

    if (!crime || !caseStudy) {
      console.warn(`[RemediationEngine] Skipped pathway ${p.pathwayId} due to missing DB references`);
      continue;
    }

    // Clean payload for client: NO raw scores, multipliers, or internal formula details
    validatedRecommendations.push({
      pathwayId: p.pathwayId,
      metricKey: p.metricKey,
      habitTitle: p.habitTitle,
      pedagogicalFocus: p.pedagogicalFocus,
      coreRule: p.coreRule,
      difficulty: p.difficulty,
      estimatedMinutes: p.estimatedMinutes,
      habitShiftState: item.state,
      shiftSummary: item.stateMessage,
      state: item.state,
      stateBadge: item.stateBadge,
      stateMessage: item.stateMessage,
      crimeSlug: p.crimeSlug,
      crimeTitle: crime.title,
      caseStudySlug: p.caseStudySlug,
      caseStudyTitle: caseStudy.title,
      preventionAnchor: p.preventionAnchor,
      primaryLawSectionNumber: p.primaryLawSectionNumber,
      legalReferences: p.legalReferences,
      actionLabel: p.actionLabel,
      actionRoute: p.actionRoute
    });
  }

  const focusSummary = userState === 'baseline'
    ? 'Personalized habit recommendations based on your morning digital routine.'
    : 'Habit transformation review comparing your baseline and final assessment decisions.';

  return {
    userState,
    assessmentType: userState,
    focusSummary,
    recommendations: validatedRecommendations
  };
}

module.exports = {
  SEVERITY_WEIGHTS,
  getOpportunityFactor,
  rankEligibleMetrics,
  determineFinalHabitState,
  generateRemediation
};
