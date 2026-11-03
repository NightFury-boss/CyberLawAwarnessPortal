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
const UserProgress = require('../models/UserProgress');
const AssessmentDecision = require('../models/AssessmentDecision');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

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
 * Calculate opportunity sufficiency multiplier (Configurable Product Heuristic)
 * @param {number} encounters - discrete decision encounters (v2) or opportunity points (v1)
 * @param {number} scoringVersion - 1 or 2
 */
function getOpportunityFactor(encounters, scoringVersion = 1) {
  if (encounters === undefined || encounters === null || encounters < 2) {
    return 0.0; // Insufficient sample; measurement not statistically meaningful
  }
  if (scoringVersion === 2) {
    if (encounters >= 2 && encounters <= 3) {
      return 0.70; // Low-sample product heuristic dampener
    }
    return 1.0; // Standard confidence (>= 4)
  }
  // Legacy v1 behavior
  if (encounters >= 2 && encounters <= 3) {
    return 0.75;
  }
  return 1.0;
}

/**
 * Extract normalized score, encounter count, and opportunity count for a metric from session
 */
function extractMetricData(session, metricKey) {
  const scoresMap = session.behaviourScores instanceof Map
    ? Object.fromEntries(session.behaviourScores)
    : (session.behaviourScores || {});

  const oppsMap = session.behaviourOpportunities instanceof Map
    ? Object.fromEntries(session.behaviourOpportunities)
    : (session.behaviourOpportunities || {});

  const encountersMap = session.behaviourEncounters instanceof Map
    ? Object.fromEntries(session.behaviourEncounters)
    : (session.behaviourEncounters || {});

  const normalizedScore = typeof scoresMap[metricKey] === 'number'
    ? scoresMap[metricKey]
    : null;

  let opportunities = typeof oppsMap[metricKey] === 'number'
    ? oppsMap[metricKey]
    : 0;

  let encounters = opportunities;
  if (session.scoringVersion === 2 && typeof encountersMap[metricKey] === 'number') {
    encounters = encountersMap[metricKey];
  }

  // For penalty metrics in legacy v1, use actual max penalty points as the opportunity measure
  if (session.scoringVersion !== 2) {
    if (metricKey === 'falsePositive') {
      if (typeof session.falsePositiveMaxPenaltyPoints === 'number' && session.falsePositiveMaxPenaltyPoints > 0) {
        opportunities = session.falsePositiveMaxPenaltyPoints;
        encounters = session.falsePositiveMaxPenaltyPoints;
      }
    } else if (metricKey === 'unreviewedAcceptance') {
      if (typeof session.unreviewedAcceptanceMaxPenaltyPoints === 'number' && session.unreviewedAcceptanceMaxPenaltyPoints > 0) {
        opportunities = session.unreviewedAcceptanceMaxPenaltyPoints;
        encounters = session.unreviewedAcceptanceMaxPenaltyPoints;
      }
    }
  }

  return { normalizedScore, opportunities, encounters };
}

/**
 * Multi-Factor Priority Ranking Engine
 */
function rankEligibleMetrics(session) {
  const ranked = [];
  const scoringVersion = session.scoringVersion === 2 ? 2 : 1;

  for (const metricKey of METRIC_KEYS) {
    const { normalizedScore, opportunities, encounters } = extractMetricData(session, metricKey);

    if (normalizedScore === null) continue; // Skip unassessed metrics gracefully

    const opportunityFactor = getOpportunityFactor(encounters, scoringVersion);
    const deficit = Math.max(0, 100 - normalizedScore);
    const severityWeight = SEVERITY_WEIGHTS[metricKey] || 1.0;

    const priorityScore = deficit * severityWeight * opportunityFactor;

    let isEligibleWeakness = normalizedScore < 75 && opportunityFactor > 0;

    // Phase 4.2 / 4.3 Rule for v2 False Positive: Cumulative penalty <= 2 is STRENGTH
    if (scoringVersion === 2 && metricKey === 'falsePositive') {
      if (typeof session.falsePositivePenaltyPoints === 'number' && session.falsePositivePenaltyPoints <= 2) {
        isEligibleWeakness = false;
      }
    }

    ranked.push({
      metricKey,
      normalizedScore,
      opportunities,
      encounters,
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
      badge: 'Consolidated Strength',
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
      badge: 'Consistent Habit',
      message: 'Consistent digital vigilance demonstrated across simulation scenarios. Continue routine practice to maintain this defensive reflex.'
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
 * Build an evidence-grounded explanation for a recommended pathway based on session data and decision history.
 *
 * @param {Object} pathway - Catalog pathway definition
 * @param {Object|null} metricInfo - Metric calculation details { metricKey, normalizedScore, opportunities, opportunityFactor }
 * @param {Object} session - AssessmentSession document
 * @param {Array} decisionEvidence - Array of populated user decisions [{ stageTitle, optionText, explanation, behaviorEffects, riskLevel, isCriticalMistake }]
 * @returns {string} Grounded explanation text
 */
function buildEvidenceGroundedExplanation(pathway, metricInfo, session, decisionEvidence = []) {
  if (!pathway) return '';

  // Case 1: Maintenance / All-Strong pathway
  if (pathway.metricKey === 'all' || pathway.dimensionCode === 'ALL') {
    if (decisionEvidence && decisionEvidence.length > 0) {
      return `Demonstrated solid vigilance across all evaluated stages in your ${session.scenarioCode || 'assessment'} assessment. ${pathway.observedBehaviorExplanation}`;
    }
    return pathway.observedBehaviorExplanation;
  }

  // Case 2: Insufficient or zero opportunities
  if (!metricInfo || metricInfo.opportunities === 0 || metricInfo.opportunityFactor === 0) {
    return 'Insufficient assessment evidence: zero opportunities were evaluated for this dimension in this session.';
  }

  // Case 3: Granular decision evidence is unavailable (e.g. historical sessions or simulated fixtures)
  if (!decisionEvidence || decisionEvidence.length === 0) {
    return `Granular decision evidence unavailable for this session. Evaluated from recorded ${metricInfo.normalizedScore}% score across ${metricInfo.opportunities} opportunities. ${pathway.observedBehaviorExplanation}`;
  }

  // Case 4: Inspect decision evidence for specific negative or high-risk choices
  const metricKey = pathway.metricKey;
  const relevantDecisions = [];

  for (const d of decisionEvidence) {
    const effects = d.behaviorEffects || {};
    const hasEffect = effects[metricKey] !== undefined && effects[metricKey] !== null;
    const isFocus = Array.isArray(d.measurementFocus) && d.measurementFocus.includes(metricKey);

    if (metricKey === 'unreviewedAcceptance' || metricKey === 'falsePositive') {
      // Penalty metrics: positive number indicates penalty incurred
      if (effects[metricKey] > 0 || (d.isCriticalMistake && ['high-risk', 'critical'].includes(d.riskLevel))) {
        relevantDecisions.push({
          decision: d,
          severity: d.riskLevel === 'critical' ? 3 : d.riskLevel === 'high-risk' ? 2 : 1
        });
      }
    } else {
      // Positive scoring metrics: 0 points or high risk indicates vulnerability
      if ((hasEffect && effects[metricKey] === 0) || (isFocus && ['medium-risk', 'high-risk', 'critical'].includes(d.riskLevel)) || d.isCriticalMistake) {
        relevantDecisions.push({
          decision: d,
          severity: d.isCriticalMistake ? 3 : d.riskLevel === 'critical' ? 3 : d.riskLevel === 'high-risk' ? 2 : 1
        });
      }
    }
  }

  if (relevantDecisions.length > 0) {
    // Sort by highest severity first
    relevantDecisions.sort((a, b) => b.severity - a.severity);
    const top = relevantDecisions[0].decision;
    const stageTitle = top.stageTitle || 'Assessment Scenario';
    const chosenText = top.optionText || 'your selection';
    const detailExplanation = top.explanation ? top.explanation : pathway.observedBehaviorExplanation;
    return `Observed in "${stageTitle}": You selected "${chosenText}". ${detailExplanation}`;
  }

  // If decisions exist but no single negative trigger is isolated (e.g. general lower score across subtle cues)
  return `Demonstrated score of ${metricInfo.normalizedScore}% across ${metricInfo.opportunities} evaluated opportunities in your ${session.scenarioCode || 'assessment'} assessment. ${pathway.observedBehaviorExplanation}`;
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
        stateMessage: 'All measured everyday digital habits are strong. Explore advanced protections against SIM swapping and identity theft.',
        metricInfo: null
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
        stateMessage: stateInfo.message,
        metricInfo: primary
      });
    }

    if (maintenancePathway) {
      selectedPathways.push({
        pathway: maintenancePathway,
        state: 'mastery',
        stateBadge: 'Advanced Vigilance',
        stateMessage: 'Alongside your primary focus area, maintain vigilance against secondary channel attacks.',
        metricInfo: null
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
          stateMessage: stateInfo.message,
          metricInfo
        });
      }
    }
  }

  // Load decision evidence for granular groundings
  let decisionEvidence = [];
  try {
    const userDecisions = await AssessmentDecision.find({ assessmentSessionId: session._id }).sort({ createdAt: 1 });
    for (const d of userDecisions) {
      const stg = await ScenarioStage.findById(d.stageId);
      const dec = await ScenarioDecision.findById(d.decisionId);
      if (stg && dec) {
        decisionEvidence.push({
          stageId: stg._id,
          stageTitle: stg.title,
          stageOrder: stg.stageOrder,
          measurementFocus: stg.measurementFocus || [],
          decisionId: dec._id,
          optionText: dec.optionText,
          explanation: dec.explanation,
          riskLevel: dec.riskLevel,
          isCriticalMistake: Boolean(dec.isCriticalMistake),
          behaviorEffects: dec.behaviorEffects || {}
        });
      }
    }
  } catch (err) {
    console.warn(`[RemediationEngine] Decision evidence lookup failed for session ${session._id}:`, err.message);
  }

  // Validate referenced DB entities before returning
  const validatedRecommendations = [];
  const userProgress = await UserProgress.findOne({ userId });
  const completedModuleSlugs = userProgress?.completedModules || [];
  const lessonProgressList = userProgress?.lessonProgress || [];

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

    // Resolve connected curriculum lesson progress
    let curriculumLessonInfo = null;
    if (p.curriculumLesson) {
      const lp = lessonProgressList.find(l => l.slug === p.curriculumLesson.slug);
      const isLessonCompleted = completedModuleSlugs.includes(p.curriculumLesson.slug) || lp?.status === 'knowledge_check_passed';
      const lessonStatus = lp?.status || (isLessonCompleted ? 'read_completed' : 'not_started');
      const readCompleted = Boolean(lp?.readCompleted || isLessonCompleted);

      curriculumLessonInfo = {
        slug: p.curriculumLesson.slug,
        title: p.curriculumLesson.title,
        category: p.curriculumLesson.category,
        relevanceReason: p.curriculumLesson.relevanceReason,
        status: lessonStatus,
        isCompleted: isLessonCompleted,
        readCompleted
      };
    }

    const observedBehaviorExplanation = buildEvidenceGroundedExplanation(
      p,
      item.metricInfo,
      session,
      decisionEvidence
    );

    // Clean payload for client: NO raw scores, multipliers, or internal formula details
    validatedRecommendations.push({
      pathwayId: p.pathwayId,
      metricKey: p.metricKey,
      dimensionCode: p.dimensionCode || null,
      dimensionName: p.dimensionName || null,
      dimensionShortName: p.dimensionShortName || null,
      observedBehaviorExplanation,
      whyItMatters: p.whyItMatters || null,
      whatYouWillPractice: p.whatYouWillPractice || null,
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
      actionRoute: p.actionRoute,
      curriculumLesson: curriculumLessonInfo,
      defensivePillars: p.defensivePillars || null
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
  buildEvidenceGroundedExplanation,
  generateRemediation
};
