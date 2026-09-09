const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const UserProgress = require('../models/UserProgress');
const assessmentScoringService = require('../services/assessmentScoringService');
const remediationEngineService = require('../services/remediationEngineService');

async function getWeakestCategory(userId) {
  try {
    const baseline = await AssessmentSession.findOne({
      userId,
      scenarioCode: 'baseline',
      status: 'completed'
    }).sort({ completedAt: -1 });
    
    if (baseline && baseline.categoryScores) {
      let weakest = null;
      let minScore = 100;
      for (let [cat, score] of baseline.categoryScores.entries()) {
        if (score < minScore) {
          minScore = score;
          weakest = cat;
        }
      }
      return weakest;
    }
  } catch (err) {
    console.error('Failed to get weakest category:', err);
  }
  return null;
}

exports.getScenario = async (req, res) => {
  try {
    const { code } = req.params;
    const scenario = await Scenario.findOne({ slug: code, status: 'published' }).sort({ version: -1 });
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }
    res.json(scenario);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SCENARIO_FETCH_ERROR', message: error.message }
    });
  }
};

exports.startAssessment = async (req, res) => {
  try {
    const { scenarioCode, scenarioVersion } = req.body;
    const userId = req.user._id;

    if (!scenarioCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'scenarioCode is required' }
      });
    }

    const query = { slug: scenarioCode, status: 'published' };
    if (scenarioVersion) {
      query.version = scenarioVersion;
    }

    const scenario = await Scenario.findOne(query).sort({ version: -1 });
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }

    const firstStage = await ScenarioStage.findOne({ scenarioId: scenario._id, stageOrder: 1 });
    if (!firstStage) {
      return res.status(404).json({
        success: false,
        error: { code: 'STAGE_NOT_FOUND', message: 'First stage of the scenario was not found' }
      });
    }

    const categoryScores = new Map();
    if (scenario.configuredWeights) {
      for (let cat of scenario.configuredWeights.keys()) {
        categoryScores.set(cat, 50);
      }
    }

    const behaviourScores = {
      recognition: 100,
      signalIdentification: 100,
      verification: 100,
      decisionQuality: 100,
      falsePositive: 100,
      unreviewedAcceptance: 100
    };

    const behaviourOpportunities = {
      recognition: 0,
      signalIdentification: 0,
      verification: 0,
      decisionQuality: 0,
      falsePositive: 0,
      unreviewedAcceptance: 0
    };

    const expirationPeriod = 2 * 60 * 60 * 1000;
    const session = await AssessmentSession.create({
      userId,
      scenarioId: scenario._id,
      scenarioVersion: scenario.version,
      scenarioCode,
      status: 'in-progress',
      currentStageId: firstStage._id,
      score: 50,
      categoryScores,
      behaviourScores,
      behaviourOpportunities,
      falsePositivePenaltyPoints: 0,
      falsePositiveMaxPenaltyPoints: 0,
      unreviewedAcceptancePenaltyPoints: 0,
      unreviewedAcceptanceMaxPenaltyPoints: 0,
      criticalMistakes: [],
      stagesCompleted: 0,
      expiresAt: new Date(Date.now() + expirationPeriod)
    });

    const decisions = await ScenarioDecision.find({ stageId: firstStage._id });

    res.json({
      sessionId: session._id,
      stage: {
        id: firstStage._id,
        title: firstStage.title,
        description: firstStage.description,
        mockInterfaceType: firstStage.mockInterfaceType,
        mockInterfaceData: firstStage.mockInterfaceData,
        decisions: decisions.map(d => ({
          id: d._id,
          optionText: d.optionText
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'START_ASSESSMENT_ERROR', message: error.message }
    });
  }
};

exports.submitStep = async (req, res) => {
  try {
    const { assessmentSessionId, stageId, decisionId } = req.body;
    const userId = req.user._id;

    if (!assessmentSessionId || !stageId || !decisionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'assessmentSessionId, stageId, and decisionId are required' }
      });
    }

    const originalSession = await AssessmentSession.findById(assessmentSessionId);
    if (!originalSession) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Assessment session not found' }
      });
    }

    if (originalSession.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied, session owner mismatch' }
      });
    }

    if (originalSession.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: { code: 'SESSION_NOT_ACTIVE', message: 'Assessment session is not active' }
      });
    }

    if (originalSession.expiresAt < new Date()) {
      await AssessmentSession.findByIdAndUpdate(assessmentSessionId, { status: 'abandoned' });
      return res.status(400).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Assessment session expired' }
      });
    }

    if (originalSession.currentStageId.toString() !== stageId.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'STAGE_OUT_OF_SEQUENCE', message: 'Invalid stage sequence: stage already processed or skipped' }
      });
    }

    const decision = await ScenarioDecision.findById(decisionId);
    if (!decision || decision.stageId.toString() !== stageId.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DECISION', message: 'Decision does not match current stage' }
      });
    }

    // Lock choice event & block replay double-clicks
    try {
      await AssessmentDecision.create({
        assessmentSessionId,
        stageId,
        decisionId
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_SUBMISSION', message: 'Duplicate submission: choice already processed for this stage' }
        });
      }
      throw dbErr;
    }

    let scoreChange = decision.scoreChange || 0;
    let nextStageId = decision.nextStageId;

    const sessionScenario = await Scenario.findById(originalSession.scenarioId);

    // Adaptive Routing
    if (sessionScenario && sessionScenario.slug === 'final' && nextStageId) {
      const nextStageObj = await ScenarioStage.findById(nextStageId);
      if (nextStageObj && nextStageObj.title.includes('Adaptive Segment')) {
        const weakest = await getWeakestCategory(userId);
        if (weakest) {
          const adaptiveStage = await ScenarioStage.findOne({
            scenarioId: originalSession.scenarioId,
            eventClassification: 'malicious',
            title: new RegExp(weakest.split(' ')[0], 'i')
          });
          if (adaptiveStage) {
            nextStageId = adaptiveStage._id;
          }
        }
      }
    }

    const categoryUpdates = {};
    if (decision.categoryScoreWeights) {
      for (let [cat, wt] of decision.categoryScoreWeights.entries()) {
        const prevVal = originalSession.categoryScores.get(cat) || 50;
        const newVal = Math.max(0, Math.min(100, prevVal + wt));
        categoryUpdates['categoryScores.' + cat] = newVal;
      }
    }

    const setParameters = {
      ...categoryUpdates
    };

    if (nextStageId) {
      setParameters.currentStageId = nextStageId;
    }

    const pushParameters = {};
    if (decision.isCriticalMistake) {
      pushParameters.criticalMistakes = decision.optionText + ' - ' + decision.explanation;
    }

    // Execute atomic Compare-and-Swap state update
    const session = await AssessmentSession.findOneAndUpdate(
      {
        _id: assessmentSessionId,
        currentStageId: stageId,
        status: 'in-progress',
        expiresAt: { $gt: new Date() }
      },
      {
        $set: setParameters,
        $inc: {
          score: scoreChange,
          stagesCompleted: 1
        },
        ...(Object.keys(pushParameters).length > 0 ? { $push: pushParameters } : {})
      },
      { new: true }
    );

    if (!session) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_SUBMISSION', message: 'Double-submit block: step already modified by another thread' }
      });
    }

    session.score = Math.max(0, Math.min(100, session.score));
    
    // Compute server-side behavioral scores & opportunities dynamically via service
    const scoringResult = await assessmentScoringService.calculateScores(session._id);
    
    session.behaviourScores = scoringResult.scores;
    session.behaviourOpportunities = scoringResult.opportunities;
    session.falsePositivePenaltyPoints = scoringResult.falsePositivePenaltyPoints;
    session.falsePositiveMaxPenaltyPoints = scoringResult.falsePositiveMaxPenaltyPoints;
    session.unreviewedAcceptancePenaltyPoints = scoringResult.unreviewedAcceptancePenaltyPoints;
    session.unreviewedAcceptanceMaxPenaltyPoints = scoringResult.unreviewedAcceptanceMaxPenaltyPoints;
    
    await session.save();

    if (nextStageId) {
      const nextStage = await ScenarioStage.findById(nextStageId);
      const decisions = await ScenarioDecision.find({ stageId: nextStage._id });

      return res.json({
        isCompleted: false,
        stage: {
          id: nextStage._id,
          title: nextStage.title,
          description: nextStage.description,
          mockInterfaceType: nextStage.mockInterfaceType,
          mockInterfaceData: nextStage.mockInterfaceData,
          decisions: decisions.map(d => ({
            id: d._id,
            optionText: d.optionText
          }))
        },
        explanation: decision.explanation
      });
    } else {
      // Scenario Completed: Compile final scores and update progress
      const scenario = await Scenario.findById(session.scenarioId);
      const configuredWeights = scenario.configuredWeights;

      let weightedSum = 0;
      let totalWeight = 0;

      for (let [cat, weight] of configuredWeights.entries()) {
        const catScore = session.categoryScores.get(cat) || 50;
        weightedSum += catScore * weight;
        totalWeight += weight;
      }

      const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : session.score;
      session.score = finalScore;
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();

      let progress = await UserProgress.findOne({ userId });
      if (!progress) {
        progress = await UserProgress.create({
          userId,
          completedModules: [],
          badgesEarned: ['First Step'],
          currentStreak: 0
        });
      }

      const badgesEarned = [...(progress.badgesEarned || [])];
      if (finalScore >= 90 && !badgesEarned.includes('Cyber Guardian')) {
        badgesEarned.push('Cyber Guardian');
      } else if (finalScore >= 75 && !badgesEarned.includes('Cyber Defender')) {
        badgesEarned.push('Cyber Defender');
      }

      await UserProgress.findOneAndUpdate({ userId }, {
        badgesEarned,
        lastActivity: new Date()
      });

function computeBehaviourDelta(baselineSession, finalSession) {
  if (!baselineSession || !finalSession) return { behaviourDelta: null, baselineScores: null, deltaMessage: null };
  const baseScores = baselineSession.behaviourScores instanceof Map 
    ? Object.fromEntries(baselineSession.behaviourScores) 
    : (baselineSession.behaviourScores || {});
  const finalScores = finalSession.behaviourScores instanceof Map 
    ? Object.fromEntries(finalSession.behaviourScores) 
    : (finalSession.behaviourScores || {});

  const metricsList = [
    { key: 'recognition', label: 'Threat Recognition' },
    { key: 'signalIdentification', label: 'Signal Identification' },
    { key: 'verification', label: 'Verification Behaviour' },
    { key: 'decisionQuality', label: 'Decision Quality' },
    { key: 'falsePositive', label: 'False Positive Control' },
    { key: 'unreviewedAcceptance', label: 'Unreviewed Acceptance Control' }
  ];

  const behaviourDelta = {};
  const changesNarrative = [];

  for (const m of metricsList) {
    const baseVal = baseScores[m.key] !== undefined ? Number(baseScores[m.key]) : null;
    const finalVal = finalScores[m.key] !== undefined ? Number(finalScores[m.key]) : null;

    if (baseVal !== null && finalVal !== null) {
      const deltaVal = finalVal - baseVal;
      behaviourDelta[m.key] = {
        baseline: baseVal,
        final: finalVal,
        delta: deltaVal
      };
      if (deltaVal > 0) {
        changesNarrative.push(`${m.label} (+${deltaVal}%)`);
      } else if (deltaVal < 0) {
        changesNarrative.push(`${m.label} (${deltaVal}%)`);
      }
    }
  }

  let deltaMessage = null;
  if (changesNarrative.length > 0) {
    deltaMessage = `Behavioral shifts observed: ${changesNarrative.join(', ')}.`;
  } else {
    deltaMessage = 'Consistent behavioral habits demonstrated across baseline and final assessments.';
  }

  return {
    behaviourDelta,
    baselineScores: baseScores,
    deltaMessage
  };
}

      let deltaMessage = null;
      let improvementDelta = 0;
      let behaviourDelta = null;
      let baselineScores = null;

      if (session.scenarioCode === 'final') {
        const targetVersion = session.scenarioVersion || 1;
        const baselineSession = await AssessmentSession.findOne({
          userId,
          scenarioCode: 'baseline',
          scenarioVersion: targetVersion,
          status: 'completed'
        }).sort({ completedAt: -1 });

        if (baselineSession) {
          if (targetVersion === 1) {
            // Historical v1 calculation: Monolithic category-weighted score
            improvementDelta = finalScore - baselineSession.score;
            deltaMessage = 'Your score changed from ' + baselineSession.score + ' (Baseline) to ' + finalScore + ' (Final). That\'s a change of ' + (improvementDelta >= 0 ? '+' : '') + improvementDelta + ' points!';
          } else {
            // v2: Six-Metric Behavioral Model comparison across all 6 dimensions
            const deltaResult = computeBehaviourDelta(baselineSession, session);
            behaviourDelta = deltaResult.behaviourDelta;
            baselineScores = deltaResult.baselineScores;
            deltaMessage = deltaResult.deltaMessage;
            improvementDelta = 0;
          }
        }
      }

      return res.json({
        isCompleted: true,
        sessionId: session._id,
        score: finalScore,
        awarenessLevel: getAwarenessLevel(finalScore),
        categoryScores: Object.fromEntries(session.categoryScores),
        behaviourScores: Object.fromEntries(session.behaviourScores),
        behaviourOpportunities: Object.fromEntries(session.behaviourOpportunities),
        falsePositivePenaltyPoints: session.falsePositivePenaltyPoints,
        falsePositiveMaxPenaltyPoints: session.falsePositiveMaxPenaltyPoints,
        unreviewedAcceptancePenaltyPoints: session.unreviewedAcceptancePenaltyPoints,
        unreviewedAcceptanceMaxPenaltyPoints: session.unreviewedAcceptanceMaxPenaltyPoints,
        criticalMistakes: session.criticalMistakes,
        explanation: decision.explanation,
        improvementDelta,
        deltaMessage,
        behaviourDelta,
        baselineScores,
        badgesEarned
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SUBMIT_STEP_ERROR', message: error.message }
    });
  }
};

function getAwarenessLevel(score) {
  if (score >= 90) return 'Cyber Guardian';
  if (score >= 75) return 'Cyber Defender';
  if (score >= 60) return 'Cyber Aware';
  if (score >= 40) return 'Needs Improvement';
  return 'High Risk Awareness Gap';
}

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await AssessmentSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Assessment session not found' }
      });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Access denied, session owner mismatch' }
      });
    }

    if (session.status === 'in-progress') {
      if (session.expiresAt && session.expiresAt < new Date()) {
        await AssessmentSession.findByIdAndUpdate(session._id, { status: 'abandoned' });
        return res.json({
          status: 'abandoned',
          sessionId: session._id,
          message: 'Assessment session has expired'
        });
      }

      const currentStage = await ScenarioStage.findById(session.currentStageId);
      if (!currentStage) {
        return res.status(404).json({
          success: false,
          error: { code: 'STAGE_NOT_FOUND', message: 'Current stage not found' }
        });
      }

      const decisions = await ScenarioDecision.find({ stageId: currentStage._id });
      return res.json({
        status: 'in-progress',
        sessionId: session._id,
        scenarioCode: session.scenarioCode,
        stage: {
          id: currentStage._id,
          title: currentStage.title,
          description: currentStage.description,
          stageOrder: currentStage.stageOrder,
          mockInterfaceType: currentStage.mockInterfaceType,
          mockInterfaceData: currentStage.mockInterfaceData,
          decisions: decisions.map(d => ({
            id: d._id,
            optionText: d.optionText
          }))
        }
      });
    }

    if (session.status === 'completed') {
      let behaviourDelta = null;
      let baselineScores = null;
      let deltaMessage = null;

      if (session.scenarioCode === 'final' && (session.scenarioVersion || 1) >= 2) {
        const baselineSession = await AssessmentSession.findOne({
          userId,
          scenarioCode: 'baseline',
          scenarioVersion: session.scenarioVersion,
          status: 'completed'
        }).sort({ completedAt: -1 });

        if (baselineSession) {
          const deltaResult = computeBehaviourDelta(baselineSession, session);
          behaviourDelta = deltaResult.behaviourDelta;
          baselineScores = deltaResult.baselineScores;
          deltaMessage = deltaResult.deltaMessage;
        }
      }

      return res.json({
        status: 'completed',
        isCompleted: true,
        sessionId: session._id,
        scenarioCode: session.scenarioCode,
        scenarioVersion: session.scenarioVersion || 1,
        score: session.score,
        awarenessLevel: getAwarenessLevel(session.score),
        categoryScores: session.categoryScores ? Object.fromEntries(session.categoryScores) : {},
        behaviourScores: session.behaviourScores ? Object.fromEntries(session.behaviourScores) : {},
        behaviourOpportunities: session.behaviourOpportunities ? Object.fromEntries(session.behaviourOpportunities) : {},
        falsePositivePenaltyPoints: session.falsePositivePenaltyPoints || 0,
        falsePositiveMaxPenaltyPoints: session.falsePositiveMaxPenaltyPoints || 0,
        unreviewedAcceptancePenaltyPoints: session.unreviewedAcceptancePenaltyPoints || 0,
        unreviewedAcceptanceMaxPenaltyPoints: session.unreviewedAcceptanceMaxPenaltyPoints || 0,
        criticalMistakes: session.criticalMistakes || [],
        behaviourDelta,
        baselineScores,
        deltaMessage,
        completedAt: session.completedAt
      });
    }

    return res.json({
      status: session.status,
      sessionId: session._id,
      message: `Session is ${session.status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_SESSION_ERROR', message: error.message }
    });
  }
};

exports.getScenarioStatus = async (req, res) => {
  try {
    const { scenarioCode } = req.params;
    const userId = req.user._id;

    // 1. Check for an active in-progress session
    const activeSession = await AssessmentSession.findOne({
      userId,
      scenarioCode,
      status: 'in-progress',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (activeSession) {
      const currentStage = await ScenarioStage.findById(activeSession.currentStageId);
      if (currentStage) {
        const decisions = await ScenarioDecision.find({ stageId: currentStage._id });
        return res.json({
          hasActiveSession: true,
          hasCompletedSession: false,
          status: 'in-progress',
          sessionId: activeSession._id,
          stage: {
            id: currentStage._id,
            title: currentStage.title,
            description: currentStage.description,
            stageOrder: currentStage.stageOrder,
            mockInterfaceType: currentStage.mockInterfaceType,
            mockInterfaceData: currentStage.mockInterfaceData,
            decisions: decisions.map(d => ({
              id: d._id,
              optionText: d.optionText
            }))
          }
        });
      }
    }

    // 2. Check for latest completed session
    const completedSession = await AssessmentSession.findOne({
      userId,
      scenarioCode,
      status: 'completed'
    }).sort({ completedAt: -1 });

    if (completedSession) {
      let behaviourDelta = null;
      let baselineScores = null;
      let deltaMessage = null;

      if (completedSession.scenarioCode === 'final' && (completedSession.scenarioVersion || 1) >= 2) {
        const baselineSession = await AssessmentSession.findOne({
          userId,
          scenarioCode: 'baseline',
          scenarioVersion: completedSession.scenarioVersion,
          status: 'completed'
        }).sort({ completedAt: -1 });

        if (baselineSession) {
          const deltaResult = computeBehaviourDelta(baselineSession, completedSession);
          behaviourDelta = deltaResult.behaviourDelta;
          baselineScores = deltaResult.baselineScores;
          deltaMessage = deltaResult.deltaMessage;
        }
      }

      return res.json({
        hasActiveSession: false,
        hasCompletedSession: true,
        status: 'completed',
        completedSession: {
          sessionId: completedSession._id,
          scenarioCode: completedSession.scenarioCode,
          scenarioVersion: completedSession.scenarioVersion || 1,
          score: completedSession.score,
          awarenessLevel: getAwarenessLevel(completedSession.score),
          categoryScores: completedSession.categoryScores ? Object.fromEntries(completedSession.categoryScores) : {},
          behaviourScores: completedSession.behaviourScores ? Object.fromEntries(completedSession.behaviourScores) : {},
          behaviourOpportunities: completedSession.behaviourOpportunities ? Object.fromEntries(completedSession.behaviourOpportunities) : {},
          falsePositivePenaltyPoints: completedSession.falsePositivePenaltyPoints || 0,
          falsePositiveMaxPenaltyPoints: completedSession.falsePositiveMaxPenaltyPoints || 0,
          unreviewedAcceptancePenaltyPoints: completedSession.unreviewedAcceptancePenaltyPoints || 0,
          unreviewedAcceptanceMaxPenaltyPoints: completedSession.unreviewedAcceptanceMaxPenaltyPoints || 0,
          criticalMistakes: completedSession.criticalMistakes || [],
          behaviourDelta,
          baselineScores,
          deltaMessage,
          completedAt: completedSession.completedAt
        }
      });
    }

    return res.json({
      hasActiveSession: false,
      hasCompletedSession: false,
      status: 'none'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_STATUS_ERROR', message: error.message }
    });
  }
};

exports.getRemediation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const remediation = await remediationEngineService.generateRemediation(sessionId, userId);
    return res.json({
      success: true,
      ...remediation
    });
  } catch (err) {
    if (err.status && err.code) {
      return res.status(err.status).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to generate remediation recommendations' }
    });
  }
};

/**
 * Classify retention for a single dimension given baseline, final, and reassessment scores
 * deltaLearned = final - baseline
 * deltaRetention = reassessment - final
 */
function classifyRetention(baseScore, finalScore, reassessScore) {
  if (reassessScore === null || reassessScore === undefined) {
    return 'pending_reassessment';
  }

  const deltaLearned = finalScore - baseScore;
  const deltaRetention = reassessScore - finalScore;

  // Case A: Intervention did not shift habit (final remains below 50)
  if (finalScore < 50) {
    if (reassessScore < 50) {
      return 'Unimproved';
    }
    if (reassessScore >= 65) {
      return 'Delayed Improvement';
    }
    // Boundary between 50 and 64 inclusive
    return 'Developing';
  }

  // Case B: Already-strong baseline and final dimensions (base >= 75 and final >= 75)
  if (baseScore >= 75 && finalScore >= 75) {
    if (reassessScore >= 75) {
      return 'Retained';
    }
    if (reassessScore < 70) {
      return 'Declined';
    }
    // Boundary between 70 and 74 inclusive
    return 'Stable';
  }

  // Case C: Meaningful intervention gain (deltaLearned >= 10 with final >= 50)
  if (deltaLearned >= 10) {
    if (deltaRetention >= -5) {
      return 'Retained';
    }
    if (deltaRetention >= -20 && reassessScore > baseScore) {
      return 'Partially Retained';
    }
    if (deltaRetention < -20 || reassessScore <= baseScore) {
      return 'Declined';
    }
  }

  // Case D: Other combinations (e.g. moderate 50-74, deltaLearned < 10)
  if (reassessScore >= finalScore) {
    return 'Retained';
  }
  if (reassessScore < baseScore) {
    return 'Declined';
  }
  return 'Stable';
}

const DIMENSION_DEFS = [
  { key: 'TR', metricKey: 'recognition', label: 'Threat Recognition' },
  { key: 'SI', metricKey: 'signalIdentification', label: 'Signal Identification' },
  { key: 'VB', metricKey: 'verification', label: 'Verification Behaviour' },
  { key: 'DQ', metricKey: 'decisionQuality', label: 'Decision Quality' },
  { key: 'FP', metricKey: 'falsePositive', label: 'False Positive Control' },
  { key: 'UA', metricKey: 'unreviewedAcceptance', label: 'Autopilot Control' }
];

/**
 * GET /api/assessments/trajectory
 * Phase 5B: Multi-Session Habit Retention Trajectory
 * Authenticated, owner-only, strictly non-composite
 */
exports.getTrajectory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Load completed v2+ sessions for this user chronologically
    const allSessions = await AssessmentSession.find({
      userId,
      status: 'completed',
      scenarioVersion: { $gte: 2 }
    }).sort({ completedAt: 1, createdAt: 1 });

    // Validate 6-dimension schema comparability and valid instrument code
    const validSessions = allSessions.filter(session => {
      if (!['baseline', 'final'].includes(session.scenarioCode)) {
        return false;
      }
      const scores = session.behaviourScores instanceof Map
        ? Object.fromEntries(session.behaviourScores)
        : (session.behaviourScores || {});
      return DIMENSION_DEFS.every(d => typeof scores[d.metricKey] === 'number');
    });

    if (validSessions.length === 0) {
      return res.json({
        success: true,
        comparableSessionsCount: 0,
        hasBaseline: false,
        hasFinal: false,
        hasReassessment: false,
        baselineSessionId: null,
        finalSessionId: null,
        reassessmentSessionId: null,
        dimensions: {}
      });
    }

    const baselineSessions = validSessions.filter(s => s.scenarioCode === 'baseline');
    const finalSessions = validSessions.filter(s => s.scenarioCode === 'final');

    // To form a valid Baseline -> Final pair:
    // A Final must be completed chronologically after a Baseline session.
    let baselineSession = null;
    let finalSession = null;

    const firstValidFinal = finalSessions.find(f => 
      baselineSessions.some(b => b.completedAt < f.completedAt)
    );

    if (firstValidFinal) {
      finalSession = firstValidFinal;
      // Pair with the latest baseline completed immediately prior to this final
      const candidateBaselines = baselineSessions.filter(b => b.completedAt < finalSession.completedAt);
      baselineSession = candidateBaselines[candidateBaselines.length - 1];
    } else {
      // No valid Baseline -> Final sequence completed yet
      if (baselineSessions.length > 0) {
        baselineSession = baselineSessions[baselineSessions.length - 1];
      }
      if (finalSessions.length > 0) {
        finalSession = finalSessions[0];
      }
    }

    // A Reassessment is valid ONLY IF a valid Baseline -> Final pair exists
    const hasValidPair = Boolean(
      baselineSession && 
      finalSession && 
      baselineSession.completedAt < finalSession.completedAt
    );

    let reassessmentSession = null;
    if (hasValidPair) {
      const laterSessions = validSessions.filter(
        s => s.completedAt > finalSession.completedAt && s._id.toString() !== finalSession._id.toString()
      );
      if (laterSessions.length > 0) {
        // Latest voluntary reassessment represents the current longitudinal habit retention state
        reassessmentSession = laterSessions[laterSessions.length - 1];
      }
    }

    const baseScores = (baselineSession && hasValidPair) || (baselineSession && !finalSession)
      ? (baselineSession.behaviourScores instanceof Map ? Object.fromEntries(baselineSession.behaviourScores) : baselineSession.behaviourScores)
      : (hasValidPair && baselineSession ? (baselineSession.behaviourScores instanceof Map ? Object.fromEntries(baselineSession.behaviourScores) : baselineSession.behaviourScores) : null);

    const finalScores = (finalSession && hasValidPair) || (finalSession && !baselineSession)
      ? (finalSession.behaviourScores instanceof Map ? Object.fromEntries(finalSession.behaviourScores) : finalSession.behaviourScores)
      : (hasValidPair && finalSession ? (finalSession.behaviourScores instanceof Map ? Object.fromEntries(finalSession.behaviourScores) : finalSession.behaviourScores) : null);

    const reassessScores = reassessmentSession
      ? (reassessmentSession.behaviourScores instanceof Map ? Object.fromEntries(reassessmentSession.behaviourScores) : reassessmentSession.behaviourScores)
      : null;

    const dimensions = {};

    for (const def of DIMENSION_DEFS) {
      const baseVal = baseScores && typeof baseScores[def.metricKey] === 'number' ? baseScores[def.metricKey] : null;
      const finalVal = finalScores && typeof finalScores[def.metricKey] === 'number' ? finalScores[def.metricKey] : null;
      const reassessVal = reassessScores && typeof reassessScores[def.metricKey] === 'number' ? reassessScores[def.metricKey] : null;

      const deltaLearned = (baseVal !== null && finalVal !== null && hasValidPair) ? (finalVal - baseVal) : null;
      const deltaRetention = (finalVal !== null && reassessVal !== null && hasValidPair) ? (reassessVal - finalVal) : null;

      let retentionState = 'pending_data';
      if (hasValidPair && baseVal !== null && finalVal !== null) {
        retentionState = classifyRetention(baseVal, finalVal, reassessVal);
      }

      dimensions[def.key] = {
        label: def.label,
        metricKey: def.metricKey,
        baseline: baseVal,
        final: finalVal,
        deltaLearned,
        reassessment: reassessVal,
        deltaRetention,
        retentionState
      };
    }

    return res.json({
      success: true,
      comparableSessionsCount: validSessions.length,
      hasBaseline: Boolean(baselineSession),
      hasFinal: Boolean(finalSession),
      hasValidPair,
      hasReassessment: Boolean(reassessmentSession),
      baselineSessionId: baselineSession?._id || null,
      finalSessionId: finalSession?._id || null,
      reassessmentSessionId: reassessmentSession?._id || null,
      dimensions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'TRAJECTORY_ERROR', message: error.message }
    });
  }
};

exports.classifyRetention = classifyRetention;

