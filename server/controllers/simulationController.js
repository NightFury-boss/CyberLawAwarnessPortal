const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const UserProgress = require('../models/UserProgress');
const assessmentScoringService = require('../services/assessmentScoringService');
const remediationEngineService = require('../services/remediationEngineService');
const { logSafeServerError, sendStructuredError } = require('../utils/apiErrorResponder');

function toObjectSafe(val) {
  if (!val) return {};
  if (val instanceof Map) return Object.fromEntries(val);
  return typeof val === 'object' ? val : {};
}

function computeBehaviourDelta(baselineSession, finalSession) {
  if (!baselineSession || !finalSession) return { behaviourDelta: null, baselineScores: null, deltaMessage: null };
  const baseScores = toObjectSafe(baselineSession.behaviourScores);
  const finalScores = toObjectSafe(finalSession.behaviourScores);

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
    const baseVal = baseScores[m.key] !== undefined && baseScores[m.key] !== null ? Number(baseScores[m.key]) : null;
    const finalVal = finalScores[m.key] !== undefined && finalScores[m.key] !== null ? Number(finalScores[m.key]) : null;

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
    logSafeServerError('[getWeakestCategory Error]', err);
  }
  return null;
}

/**
 * Gathers server-authoritative decision evidence for a completed session.
 * Maps each AssessmentDecision to its corresponding ScenarioStage and ScenarioDecision.
 */
async function getSessionDecisionEvidence(sessionId) {
  try {
    const userDecisions = await AssessmentDecision.find({ assessmentSessionId: sessionId }).sort({ createdAt: 1 });
    const decisionEvidence = [];
    for (const d of userDecisions) {
      const stg = await ScenarioStage.findById(d.stageId);
      const dec = await ScenarioDecision.findById(d.decisionId);
      if (stg && dec) {
        decisionEvidence.push({
          stageId: stg._id,
          stageOrder: stg.stageOrder,
          stageTitle: stg.title,
          stageDescription: stg.description,
          eventClassification: stg.eventClassification,
          measurementFocus: stg.measurementFocus || [],
          decisionId: dec._id,
          decisionText: dec.optionText,
          explanation: dec.explanation,
          outcomeType: dec.outcomeType,
          riskLevel: dec.riskLevel,
          isCriticalMistake: Boolean(dec.isCriticalMistake),
          behaviorEffects: dec.behaviorEffects || {},
          selectedAt: d.selectedAt || d.createdAt
        });
      }
    }
    return decisionEvidence;
  } catch (err) {
    logSafeServerError('[getSessionDecisionEvidence Error]', err);
    return [];
  }
}

async function serializeStage(stageId) {
  if (!stageId) return null;
  const stage = await ScenarioStage.findById(stageId);
  if (!stage) return null;
  const decisions = await ScenarioDecision.find({ stageId: stage._id });
  return {
    id: stage._id,
    title: stage.title,
    description: stage.description,
    stageOrder: stage.stageOrder,
    mockInterfaceType: stage.mockInterfaceType,
    mockInterfaceData: stage.mockInterfaceData,
    hasSignalProbe: Boolean(stage.hasSignalProbe),
    signalProbes: (stage.signalProbes || []).map(p => ({
      id: p._id,
      optionText: p.optionText
    })),
    decisions: decisions.map(d => ({
      id: d._id,
      optionText: d.optionText
    }))
  };
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
    return sendStructuredError(res, error, {
      contextLabel: '[getScenario Error]',
      defaultCode: 'SCENARIO_FETCH_ERROR',
      defaultMessage: 'Unable to retrieve scenario.'
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

    // Prerequisite enforcement: A Final Assessment requires an authoritative completed baseline session for this learner
    if (scenarioCode === 'final') {
      const completedBaseline = await AssessmentSession.findOne({
        userId,
        scenarioCode: 'baseline',
        status: 'completed'
      });

      if (!completedBaseline) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PREREQUISITE_NOT_MET',
            message: 'You must complete the First Check (baseline assessment) before taking the Final Check.'
          }
        });
      }
    }

    // Check if user already has an active, non-expired in-progress session for this scenario to prevent duplicates
    const existingSession = await AssessmentSession.findOne({
      userId,
      scenarioCode,
      status: 'in-progress',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (existingSession) {
      const currentStage = await ScenarioStage.findById(existingSession.currentStageId);
      if (currentStage) {
        const decisions = await ScenarioDecision.find({ stageId: currentStage._id });
        return res.json({
          sessionId: existingSession._id,
          resumed: true,
          stage: {
            id: currentStage._id,
            title: currentStage.title,
            description: currentStage.description,
            stageOrder: currentStage.stageOrder,
            mockInterfaceType: currentStage.mockInterfaceType,
            mockInterfaceData: currentStage.mockInterfaceData,
            hasSignalProbe: Boolean(currentStage.hasSignalProbe),
            signalProbes: (currentStage.signalProbes || []).map(p => ({
              id: p._id,
              optionText: p.optionText
            })),
            decisions: decisions.map(d => ({
              id: d._id,
              optionText: d.optionText
            }))
          }
        });
      }
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

    const INACTIVITY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
    const MAX_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours hard cap

    const startedAt = new Date();
    const maxLifetimeExpiresAt = new Date(startedAt.getTime() + MAX_LIFETIME_MS);
    const expiresAt = new Date(Math.min(startedAt.getTime() + INACTIVITY_WINDOW_MS, maxLifetimeExpiresAt.getTime()));

    const session = await AssessmentSession.create({
      userId,
      scenarioId: scenario._id,
      scenarioVersion: scenario.version,
      scoringVersion: (scenario.version || 1) >= 2 ? 2 : 1,
      scenarioCode,
      status: 'in-progress',
      currentStageId: firstStage._id,
      score: 50,
      categoryScores,
      behaviourScores,
      behaviourOpportunities,
      behaviourEncounters: {
        recognition: 0,
        signalIdentification: 0,
        verification: 0,
        decisionQuality: 0,
        falsePositive: 0,
        unreviewedAcceptance: 0
      },
      falsePositivePenaltyPoints: 0,
      falsePositiveMaxPenaltyPoints: 0,
      unreviewedAcceptancePenaltyPoints: 0,
      unreviewedAcceptanceMaxPenaltyPoints: 0,
      criticalMistakes: [],
      stagesCompleted: 0,
      startedAt,
      expiresAt,
      maxLifetimeExpiresAt
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
        hasSignalProbe: Boolean(firstStage.hasSignalProbe),
        signalProbes: (firstStage.signalProbes || []).map(p => ({
          id: p._id,
          optionText: p.optionText
        })),
        decisions: decisions.map(d => ({
          id: d._id,
          optionText: d.optionText
        }))
      }
    });
  } catch (error) {
    return sendStructuredError(res, error, {
      contextLabel: '[startAssessment Error]',
      defaultCode: 'START_ASSESSMENT_ERROR',
      defaultMessage: 'Unable to start assessment session.'
    });
  }
};

exports.submitStep = async (req, res) => {
  try {
    const { assessmentSessionId, stageId, decisionId, signalProbeDecisionId, idempotencyKey } = req.body;
    const userId = req.user._id;

    if (!assessmentSessionId || !stageId || !decisionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'assessmentSessionId, stageId, and decisionId are required' }
      });
    }

    if (
      !mongoose.isValidObjectId(assessmentSessionId) ||
      !mongoose.isValidObjectId(stageId) ||
      !mongoose.isValidObjectId(decisionId) ||
      (signalProbeDecisionId && !mongoose.isValidObjectId(signalProbeDecisionId))
    ) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID_FORMAT', message: 'One or more provided identifiers are not valid ObjectIds' }
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

    const now = new Date();
    const isPastInactivity = originalSession.expiresAt < now;
    const isPastMaxLifetime = originalSession.maxLifetimeExpiresAt && originalSession.maxLifetimeExpiresAt < now;

    if (isPastInactivity || isPastMaxLifetime) {
      await AssessmentSession.findByIdAndUpdate(assessmentSessionId, {
        status: 'abandoned',
        abandonedAt: now
      });
      return res.status(400).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Assessment session expired' }
      });
    }

    // Idempotency Key Validation (Phase 4.3 Task 4 Contract)
    if (originalSession.scoringVersion === 2 && (idempotencyKey === undefined || idempotencyKey === null)) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'idempotencyKey is required for version 2 assessment submissions.' }
      });
    }

    let sanitizedKey = undefined;
    if (idempotencyKey !== undefined && idempotencyKey !== null) {
      if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'idempotencyKey cannot be empty or whitespace.' }
        });
      }
      sanitizedKey = idempotencyKey.trim();
      if (!/^[a-zA-Z0-9_\-:]{8,128}$/.test(sanitizedKey)) {
        return res.status(400).json({
          success: false,
          error: { code: 'MALFORMED_IDEMPOTENCY_KEY', message: 'idempotencyKey must be between 8 and 128 alphanumeric, hyphen, colon, or underscore characters.' }
        });
      }
    }

    // Idempotency & Conflict Check (Pre-sequence check to safely handle retries of already-committed stages)
    const existingDecision = await AssessmentDecision.findOne({
      assessmentSessionId,
      $or: [
        { stageId },
        ...(sanitizedKey ? [{ idempotencyKey: sanitizedKey }] : [])
      ]
    });

    if (existingDecision) {
      const isSameStage = existingDecision.stageId.toString() === stageId.toString();
      const isSamePrimary = existingDecision.decisionId.toString() === decisionId.toString();
      const isSameProbe = (!existingDecision.signalProbeDecisionId && !signalProbeDecisionId) ||
        (existingDecision.signalProbeDecisionId && signalProbeDecisionId && existingDecision.signalProbeDecisionId.toString() === signalProbeDecisionId.toString());
      const isSameKey = existingDecision.idempotencyKey && sanitizedKey && existingDecision.idempotencyKey === sanitizedKey;

      // 1. Same key + same payload: Idempotent retry
      if (isSameKey && isSameStage && isSamePrimary && isSameProbe) {
        const currentSession = await AssessmentSession.findById(assessmentSessionId);
        if (currentSession && currentSession.status === 'completed') {
          const decisionEvidence = await getSessionDecisionEvidence(currentSession._id);
          return res.json({
            success: true,
            isRetry: true,
            isCompleted: true,
            message: 'Decision already recorded for this stage (Idempotent retry).',
            score: currentSession.score,
            behaviourScores: currentSession.behaviourScores,
            behaviourOpportunities: currentSession.behaviourOpportunities,
            decisionEvidence
          });
        }
        const stageData = currentSession ? await serializeStage(currentSession.currentStageId) : null;
        return res.json({
          success: true,
          isRetry: true,
          isCompleted: false,
          message: 'Decision already recorded for this stage (Idempotent retry).',
          stage: stageData
        });
      }

      // 2. Same key + different payload: Payload mismatch conflict
      if (isSameKey) {
        return res.status(409).json({
          success: false,
          error: { code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', message: 'Idempotency key was previously submitted with a different decision payload.' }
        });
      }

      // 3. Stage already committed with a different key or no key
      if (isSameStage) {
        return res.status(409).json({
          success: false,
          error: { code: 'STAGE_DECISION_ALREADY_COMMITTED', message: 'A decision has already been committed for this scenario stage.' }
        });
      }

      // 4. Idempotency key previously used for a different stage
      return res.status(409).json({
        success: false,
        error: { code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', message: 'Idempotency key was previously used for a different stage.' }
      });
    }

    if (originalSession.currentStageId.toString() !== stageId.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'STAGE_OUT_OF_SEQUENCE', message: 'Invalid stage sequence: stage already processed or skipped' }
      });
    }

    const currentStage = await ScenarioStage.findById(stageId);
    if (!currentStage) {
      return res.status(404).json({
        success: false,
        error: { code: 'STAGE_NOT_FOUND', message: 'Scenario stage not found' }
      });
    }

    // Atomic validation: Mandatory signal probe if stage has forensic probe
    if (currentStage.hasSignalProbe) {
      if (!signalProbeDecisionId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INCOMPLETE_STAGE_SUBMISSION', message: 'Signal probe identification is mandatory for this stage.' }
        });
      }
      const validProbe = currentStage.signalProbes && currentStage.signalProbes.id
        ? currentStage.signalProbes.id(signalProbeDecisionId)
        : null;
      if (!validProbe) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PROBE_REFERENCE', message: 'The provided probe option is invalid for this stage.' }
        });
      }
    }

    const decision = await ScenarioDecision.findById(decisionId);
    if (!decision || decision.stageId.toString() !== stageId.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DECISION', message: 'Decision does not match current stage' }
      });
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

    // Sliding activity window (2h inactivity window, capped at 24h hard maximum lifetime)
    const INACTIVITY_WINDOW_MS = 2 * 60 * 60 * 1000;
    const sessionStarted = originalSession.startedAt 
      ? new Date(originalSession.startedAt).getTime() 
      : (originalSession.createdAt ? new Date(originalSession.createdAt).getTime() : now.getTime());
    const maxLifetime = originalSession.maxLifetimeExpiresAt 
      ? new Date(originalSession.maxLifetimeExpiresAt).getTime() 
      : (sessionStarted + 24 * 60 * 60 * 1000);

    const newExpiresAt = new Date(Math.min(now.getTime() + INACTIVITY_WINDOW_MS, maxLifetime));
    setParameters.expiresAt = newExpiresAt;

    const pushParameters = {};
    if (decision.isCriticalMistake) {
      pushParameters.criticalMistakes = decision.optionText + ' - ' + decision.explanation;
    }

    // Multi-Document Transaction with Atomic Rollback & Concurrency Lock
    let mongoSession = null;
    let useTransaction = false;
    try {
      const topologyType = mongoose.connection?.client?.topology?.description?.type;
      const isReplicaSet = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';
      if (isReplicaSet || !topologyType) {
        mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();
        useTransaction = true;
      }
    } catch (sessionErr) {
      if (mongoSession) {
        try { await mongoSession.endSession(); } catch (e) {}
        mongoSession = null;
      }
      useTransaction = false;
    }

    let session = null;
    let createdDecisionId = null;
    try {
      const createdDecisions = await AssessmentDecision.create([{
        assessmentSessionId,
        stageId,
        decisionId,
        signalProbeDecisionId: signalProbeDecisionId || undefined,
        idempotencyKey: sanitizedKey || undefined
      }], useTransaction ? { session: mongoSession } : {});
      createdDecisionId = createdDecisions[0]?._id;

      // Execute atomic Compare-and-Swap state update
      session = await AssessmentSession.findOneAndUpdate(
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
        { new: true, ...(useTransaction ? { session: mongoSession } : {}) }
      );

      if (!session) {
        if (useTransaction) {
          await mongoSession.abortTransaction();
        } else if (createdDecisionId) {
          await AssessmentDecision.deleteOne({ _id: createdDecisionId });
        }
        return res.status(409).json({
          success: false,
          error: { code: 'STAGE_DECISION_ALREADY_COMMITTED', message: 'Concurrent modification conflict: stage already advanced.' }
        });
      }

      if (useTransaction) {
        await mongoSession.commitTransaction();
      }
    } catch (dbErr) {
      if (useTransaction) {
        try { await mongoSession.abortTransaction(); } catch (e) {}
      } else if (createdDecisionId && dbErr.code !== 11000) {
        try { await AssessmentDecision.deleteOne({ _id: createdDecisionId }); } catch (e) {}
      }
      const isRaceConflict = dbErr.code === 11000 ||
        dbErr.code === 112 ||
        dbErr.codeName === 'WriteConflict' ||
        (typeof dbErr.hasErrorLabel === 'function' && dbErr.hasErrorLabel('TransientTransactionError'));

      if (isRaceConflict) {
        const racedDecision = await AssessmentDecision.findOne({
          assessmentSessionId,
          $or: [
            { stageId },
            ...(sanitizedKey ? [{ idempotencyKey: sanitizedKey }] : [])
          ]
        });
        if (racedDecision) {
          const isSameStage = racedDecision.stageId.toString() === stageId.toString();
          const isSamePrimary = racedDecision.decisionId.toString() === decisionId.toString();
          const isSameProbe = (!racedDecision.signalProbeDecisionId && !signalProbeDecisionId) ||
            (racedDecision.signalProbeDecisionId && signalProbeDecisionId && racedDecision.signalProbeDecisionId.toString() === signalProbeDecisionId.toString());
          const isSameKey = racedDecision.idempotencyKey && sanitizedKey && racedDecision.idempotencyKey === sanitizedKey;

          if (isSameKey && isSameStage && isSamePrimary && isSameProbe) {
            const currentSession = await AssessmentSession.findById(assessmentSessionId);
            if (currentSession && currentSession.status === 'completed') {
              const decisionEvidence = await getSessionDecisionEvidence(currentSession._id);
              return res.json({
                success: true,
                isRetry: true,
                isCompleted: true,
                message: 'Concurrent duplicate submission resolved idempotently.',
                score: currentSession.score,
                behaviourScores: currentSession.behaviourScores,
                behaviourOpportunities: currentSession.behaviourOpportunities,
                decisionEvidence
              });
            }
            const stageData = currentSession ? await serializeStage(currentSession.currentStageId) : null;
            return res.json({
              success: true,
              isRetry: true,
              isCompleted: false,
              message: 'Concurrent duplicate submission resolved idempotently.',
              stage: stageData
            });
          }
          if (isSameKey) {
            return res.status(409).json({
              success: false,
              error: { code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH', message: 'Idempotency key conflict: previously submitted with different payload.' }
            });
          }
          if (isSameStage) {
            return res.status(409).json({
              success: false,
              error: { code: 'STAGE_DECISION_ALREADY_COMMITTED', message: 'Duplicate submission: choice already processed for this stage.' }
            });
          }
        }
        return res.status(409).json({
          success: false,
          error: { code: 'STAGE_DECISION_ALREADY_COMMITTED', message: 'Duplicate submission: choice already processed for this stage' }
        });
      }
      throw dbErr;
    } finally {
      if (mongoSession) {
        try { await mongoSession.endSession(); } catch (e) {}
      }
    }

    session.score = Math.max(0, Math.min(100, session.score));
    
    // Compute server-side behavioral scores & opportunities dynamically via service
    const scoringResult = await assessmentScoringService.calculateScores(session._id);
    
    session.behaviourScores = scoringResult.scores;
    session.behaviourOpportunities = scoringResult.opportunities;
    session.behaviourEncounters = scoringResult.encounters;
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
          stageOrder: nextStage.stageOrder,
          mockInterfaceType: nextStage.mockInterfaceType,
          mockInterfaceData: nextStage.mockInterfaceData,
          hasSignalProbe: Boolean(nextStage.hasSignalProbe),
          signalProbes: (nextStage.signalProbes || []).map(p => ({
            id: p._id,
            optionText: p.optionText
          })),
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

      const decisionEvidence = await getSessionDecisionEvidence(session._id);

      return res.json({
        isCompleted: true,
        sessionId: session._id,
        score: finalScore,
        awarenessLevel: getAwarenessLevel(finalScore),
        categoryScores: toObjectSafe(session.categoryScores),
        behaviourScores: toObjectSafe(session.behaviourScores),
        behaviourOpportunities: toObjectSafe(session.behaviourOpportunities),
        falsePositivePenaltyPoints: session.falsePositivePenaltyPoints,
        falsePositiveMaxPenaltyPoints: session.falsePositiveMaxPenaltyPoints,
        unreviewedAcceptancePenaltyPoints: session.unreviewedAcceptancePenaltyPoints,
        unreviewedAcceptanceMaxPenaltyPoints: session.unreviewedAcceptanceMaxPenaltyPoints,
        criticalMistakes: session.criticalMistakes,
        decisionEvidence,
        explanation: decision.explanation,
        improvementDelta,
        deltaMessage,
        behaviourDelta,
        baselineScores,
        badgesEarned
      });
    }
  } catch (error) {
    return sendStructuredError(res, error, {
      contextLabel: '[submitStep Error]',
      defaultCode: 'SUBMIT_STEP_ERROR',
      defaultMessage: 'Unable to process decision submission.'
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
      const now = new Date();
      const isPastInactivity = session.expiresAt && session.expiresAt < now;
      const isPastMaxLifetime = session.maxLifetimeExpiresAt && session.maxLifetimeExpiresAt < now;

      if (isPastInactivity || isPastMaxLifetime) {
        await AssessmentSession.findByIdAndUpdate(session._id, {
          status: 'abandoned',
          abandonedAt: now
        });
        return res.json({
          status: 'abandoned',
          sessionId: session._id,
          message: 'Assessment session has expired due to inactivity or exceeding maximum lifetime'
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
          hasSignalProbe: Boolean(currentStage.hasSignalProbe),
          signalProbes: (currentStage.signalProbes || []).map(p => ({
            id: p._id,
            optionText: p.optionText
          })),
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

      const decisionEvidence = await getSessionDecisionEvidence(session._id);

      return res.json({
        status: 'completed',
        isCompleted: true,
        sessionId: session._id,
        scenarioCode: session.scenarioCode,
        scenarioVersion: session.scenarioVersion || 1,
        score: session.score,
        awarenessLevel: getAwarenessLevel(session.score),
        categoryScores: toObjectSafe(session.categoryScores),
        behaviourScores: toObjectSafe(session.behaviourScores),
        behaviourOpportunities: toObjectSafe(session.behaviourOpportunities),
        falsePositivePenaltyPoints: session.falsePositivePenaltyPoints || 0,
        falsePositiveMaxPenaltyPoints: session.falsePositiveMaxPenaltyPoints || 0,
        unreviewedAcceptancePenaltyPoints: session.unreviewedAcceptancePenaltyPoints || 0,
        unreviewedAcceptanceMaxPenaltyPoints: session.unreviewedAcceptanceMaxPenaltyPoints || 0,
        criticalMistakes: session.criticalMistakes || [],
        decisionEvidence,
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
    return sendStructuredError(res, error, {
      contextLabel: '[getSession Error]',
      defaultCode: 'GET_SESSION_ERROR',
      defaultMessage: 'Unable to retrieve assessment session.'
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
      if (activeSession.maxLifetimeExpiresAt && activeSession.maxLifetimeExpiresAt < new Date()) {
        await AssessmentSession.findByIdAndUpdate(activeSession._id, {
          status: 'abandoned',
          abandonedAt: new Date()
        });
      } else {
        const currentStage = await ScenarioStage.findById(activeSession.currentStageId);
        if (currentStage) {
          const decisions = await ScenarioDecision.find({ stageId: currentStage._id });
          return res.json({
            hasActiveSession: true,
            hasCompletedSession: false,
            status: 'in-progress',
            sessionId: activeSession._id,
            expiresAt: activeSession.expiresAt,
            stage: {
              id: currentStage._id,
              title: currentStage.title,
              description: currentStage.description,
              stageOrder: currentStage.stageOrder,
              mockInterfaceType: currentStage.mockInterfaceType,
              mockInterfaceData: currentStage.mockInterfaceData,
              hasSignalProbe: Boolean(currentStage.hasSignalProbe),
              signalProbes: (currentStage.signalProbes || []).map(p => ({
                id: p._id,
                optionText: p.optionText
              })),
              decisions: decisions.map(d => ({
                id: d._id,
                optionText: d.optionText
              }))
            }
          });
        }
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

      const decisionEvidence = await getSessionDecisionEvidence(completedSession._id);

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
          categoryScores: toObjectSafe(completedSession.categoryScores),
          behaviourScores: toObjectSafe(completedSession.behaviourScores),
          behaviourOpportunities: toObjectSafe(completedSession.behaviourOpportunities),
          falsePositivePenaltyPoints: completedSession.falsePositivePenaltyPoints || 0,
          falsePositiveMaxPenaltyPoints: completedSession.falsePositiveMaxPenaltyPoints || 0,
          unreviewedAcceptancePenaltyPoints: completedSession.unreviewedAcceptancePenaltyPoints || 0,
          unreviewedAcceptanceMaxPenaltyPoints: completedSession.unreviewedAcceptanceMaxPenaltyPoints || 0,
          criticalMistakes: completedSession.criticalMistakes || [],
          decisionEvidence,
          behaviourDelta,
          baselineScores,
          deltaMessage,
          completedAt: completedSession.completedAt
        }
      });
    }

    // 3. Check if there was an expired or abandoned session for recovery guidance
    const expiredSession = await AssessmentSession.findOne({
      userId,
      scenarioCode,
      $or: [
        { status: 'abandoned' },
        { status: 'in-progress', expiresAt: { $lte: new Date() } }
      ]
    }).sort({ updatedAt: -1 });

    if (expiredSession) {
      if (expiredSession.status === 'in-progress') {
        await AssessmentSession.findByIdAndUpdate(expiredSession._id, {
          status: 'abandoned',
          abandonedAt: new Date()
        });
      }
      return res.json({
        hasActiveSession: false,
        hasCompletedSession: false,
        hasExpiredSession: true,
        status: 'expired',
        expiredSession: {
          sessionId: expiredSession._id,
          stagesCompleted: expiredSession.stagesCompleted || 0,
          expiredAt: expiredSession.expiresAt
        }
      });
    }

    return res.json({
      hasActiveSession: false,
      hasCompletedSession: false,
      hasExpiredSession: false,
      status: 'none'
    });
  } catch (error) {
    return sendStructuredError(res, error, {
      contextLabel: '[getScenarioStatus Error]',
      defaultCode: 'GET_STATUS_ERROR',
      defaultMessage: 'Unable to retrieve scenario status.'
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
    return sendStructuredError(res, err, {
      contextLabel: '[getRemediation Error]',
      defaultCode: 'INTERNAL_ERROR',
      defaultMessage: 'Failed to generate remediation recommendations'
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
  { key: 'UA', metricKey: 'unreviewedAcceptance', label: 'Unreviewed Acceptance Control' }
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
    return sendStructuredError(res, error, {
      contextLabel: '[getTrajectory Error]',
      defaultCode: 'TRAJECTORY_ERROR',
      defaultMessage: 'Unable to calculate behavioral trajectory.'
    });
  }
};

exports.classifyRetention = classifyRetention;

