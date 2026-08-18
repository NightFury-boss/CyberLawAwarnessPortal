const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const UserProgress = require('../models/UserProgress');

exports.getScenario = async (req, res) => {
  try {
    const { code } = req.params;
    // Get latest published scenario version
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
    const { scenarioCode } = req.body; // e.g. "baseline", "final"
    const userId = req.user._id;

    if (!scenarioCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETERS', message: 'scenarioCode is required' }
      });
    }

    // Load latest published scenario matching code (slug)
    const scenario = await Scenario.findOne({ slug: scenarioCode, status: 'published' }).sort({ version: -1 });
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: { code: 'SCENARIO_NOT_FOUND', message: 'Scenario not found' }
      });
    }

    // Find starting stage (stageOrder = 1)
    const firstStage = await ScenarioStage.findOne({ scenarioId: scenario._id, stageOrder: 1 });
    if (!firstStage) {
      return res.status(404).json({
        success: false,
        error: { code: 'STAGE_NOT_FOUND', message: 'First stage of the scenario was not found' }
      });
    }

    // Initialize category scores at 50
    const categoryScores = new Map();
    if (scenario.configuredWeights) {
      for (let cat of scenario.configuredWeights.keys()) {
        categoryScores.set(cat, 50);
      }
    }

    // Create session (expires in 2 hours)
    const expirationPeriod = 2 * 60 * 60 * 1000; // 2 hours
    const session = await AssessmentSession.create({
      userId,
      scenarioId: scenario._id,
      scenarioVersion: scenario.version,
      scenarioCode,
      status: 'in-progress',
      currentStageId: firstStage._id,
      score: 50,
      categoryScores,
      criticalMistakes: [],
      falsePositiveCount: 0,
      expiresAt: new Date(Date.now() + expirationPeriod)
    });

    // Query choices for the first stage
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

    // Pre-flight checks (Fetch first for detailed error messages, but execute updates atomically below)
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
      // Transition status to abandoned
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

    // Fetch decision details
    const decision = await ScenarioDecision.findById(decisionId);
    if (!decision || decision.stageId.toString() !== stageId.toString()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DECISION', message: 'Decision does not match current stage' }
      });
    }

    // Save choice event log & enforce replay protection
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

    // Calculate score increment & updates
    let scoreChange = decision.scoreChange || 0;
    let nextStageId = decision.nextStageId;
    let falsePositiveIncrement = decision.outcomeType === 'false-positive' ? 1 : 0;

    // Build the atomic update parameters
    const categoryUpdates = {};
    if (decision.categoryScoreWeights) {
      for (let [cat, wt] of decision.categoryScoreWeights.entries()) {
        const prevVal = originalSession.categoryScores.get(cat) || 50;
        const newVal = Math.max(0, Math.min(100, prevVal + wt));
        categoryUpdates[`categoryScores.${cat}`] = newVal;
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
      pushParameters.criticalMistakes = `${decision.optionText} - ${decision.explanation}`;
    }

    // Execute atomic Compare-and-Swap state modification
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
          falsePositiveCount: falsePositiveIncrement
        },
        ...(Object.keys(pushParameters).length > 0 ? { $push: pushParameters } : {})
      },
      { new: true }
    );

    // If session returns null, another concurrent request advanced it first! (Atomic lock safety)
    if (!session) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_SUBMISSION', message: 'Double-submit block: step already modified by another thread' }
      });
    }

    // Clamp total score
    session.score = Math.max(0, Math.min(100, session.score));
    await session.save();

    // 5. Navigate to Next Stage or Compile Final Report
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
      // Terminal reached: compile final authoritative weighted score
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

      // Update progress credentials and badges
      let progress = await UserProgress.findOne({ userId });
      if (!progress) {
        progress = await UserProgress.create({
          userId,
          completedModules: [],
          badgesEarned: ['First Step'],
          currentStreak: 0
        });
      }

      // Check badges
      const badgesEarned = [...(progress.badgesEarned || [])];
      if (finalScore >= 90 && !badgesEarned.includes('Cyber Guardian')) {
        badgesEarned.push('Cyber Guardian');
      } else if (finalScore >= 75 && !badgesEarned.includes('Cyber Defender')) {
        badgesEarned.push('Cyber Defender');
      }

      await UserProgress.findOneAndUpdate({ userId }, {
        $addToSet: { assessmentAttempts: session._id },
        badgesEarned,
        lastActivity: new Date()
      });

      // Calculate pre/post improvement
      let deltaMessage = null;
      let improvementDelta = 0;

      if (session.scenarioCode === 'final') {
        const baselineSession = await AssessmentSession.findOne({
          userId,
          scenarioCode: 'baseline',
          status: 'completed'
        }).sort({ completedAt: -1 });

        if (baselineSession) {
          improvementDelta = finalScore - baselineSession.score;
          deltaMessage = `Your score changed from ${baselineSession.score} (Baseline) to ${finalScore} (Final). That's a change of ${improvementDelta >= 0 ? '+' : ''}${improvementDelta} points!`;
        }
      }

      return res.json({
        isCompleted: true,
        score: finalScore,
        awarenessLevel: getAwarenessLevel(finalScore),
        categoryScores: Object.fromEntries(session.categoryScores),
        criticalMistakes: session.criticalMistakes,
        falsePositiveCount: session.falsePositiveCount,
        explanation: decision.explanation,
        improvementDelta,
        deltaMessage,
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
