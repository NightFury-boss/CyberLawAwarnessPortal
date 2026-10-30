const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const QuizAttempt = require('../models/QuizAttempt');
const spacedRetrievalService = require('../services/spacedRetrievalService');
const catalog = require('../config/remediationCatalog');

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        completedModules: [],
        badgesEarned: ['First Step'],
        currentStreak: 0
      });
    }

    // Fetch assessment history
    const assessments = await AssessmentSession.find({ userId, status: 'completed' }).sort({ completedAt: -1 });
    const availableVersions = [...new Set(assessments.map(a => a.scenarioVersion || 1))].sort((a, b) => b - a);
    const primaryVersion = availableVersions.length > 0 ? availableVersions[0] : 2;

    const baseline = assessments.find(a => a.scenarioCode === 'baseline' && (a.scenarioVersion || 1) === primaryVersion)
                  || assessments.find(a => a.scenarioCode === 'baseline');
    const finalVal = assessments.find(a => a.scenarioCode === 'final' && (a.scenarioVersion || 1) === (baseline ? (baseline.scenarioVersion || 1) : primaryVersion))
                  || assessments.find(a => a.scenarioCode === 'final');

    // Fetch quiz stats
    const quizAttempts = await QuizAttempt.find({ userId });
    const distinctQuizzes = [...new Set(quizAttempts.map(qa => qa.quizId.toString()))];

    const baselineScoresObj = baseline?.behaviourScores 
      ? (baseline.behaviourScores instanceof Map ? Object.fromEntries(baseline.behaviourScores) : baseline.behaviourScores) 
      : null;
    const finalScoresObj = finalVal?.behaviourScores 
      ? (finalVal.behaviourScores instanceof Map ? Object.fromEntries(finalVal.behaviourScores) : finalVal.behaviourScores) 
      : null;

    res.json({
      userId,
      fullName: req.user.fullName,
      email: req.user.email,
      badges: progress.badgesEarned || [],
      completedModules: progress.completedModules || [],
      quizzesTaken: distinctQuizzes,
      baselineScore: baseline ? baseline.score : null,
      baselineLevel: baseline ? getAwarenessLevel(baseline.score) : null,
      baselineVersion: baseline ? (baseline.scenarioVersion || 1) : null,
      baselineSessionId: baseline ? baseline._id : null,
      baselineBehaviourScores: baselineScoresObj,
      finalScore: finalVal ? finalVal.score : null,
      finalLevel: finalVal ? getAwarenessLevel(finalVal.score) : null,
      finalVersion: finalVal ? (finalVal.scenarioVersion || 1) : null,
      finalSessionId: finalVal ? finalVal._id : null,
      latestSessionId: (finalVal || baseline) ? (finalVal || baseline)._id : null,
      finalBehaviourScores: finalScoresObj,
      completedPathways: (progress.completedPathways || []).map(p => {
        const pathwayDef = catalog.find(cat => cat.pathwayId === p.pathwayId);
        const pObj = p.toObject ? p.toObject() : { ...p };
        return {
          ...pObj,
          habitTitle: pathwayDef?.habitTitle || p.pathwayId
        };
      }),
      reinforcementsCompleted: (progress.reinforcementsCompleted || []).map(r => {
        const pathwayDef = catalog.find(cat => cat.pathwayId === r.pathwayId);
        const rObj = r.toObject ? r.toObject() : { ...r };
        return {
          ...rObj,
          habitTitle: pathwayDef?.habitTitle || r.pathwayId
        };
      }),
      spacedReviews: (progress.spacedReviews || []).map(sr => {
        const pathwayDef = catalog.find(cat => cat.pathwayId === sr.pathwayId);
        const srObj = sr.toObject ? sr.toObject() : { ...sr };
        return {
          ...srObj,
          habitTitle: pathwayDef?.habitTitle || sr.pathwayId
        };
      }),
      assessmentsCount: assessments.length,
      streak: progress.currentStreak
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user progress', error: error.message });
  }
};

const CaseStudy = require('../models/CaseStudy');
const { generateRemediation } = require('../services/remediationEngineService');
const mongoose = require('mongoose');

/**
 * Validate session ownership, completion, and pathway recommendation eligibility
 */
async function validateSessionAndEligibility(userId, sourceSessionId, pathwayId) {
  if (!sourceSessionId || !mongoose.Types.ObjectId.isValid(sourceSessionId)) {
    const error = new Error('Invalid or missing source session ID.');
    error.status = 400;
    error.code = 'INVALID_SESSION_ID';
    throw error;
  }

  const session = await AssessmentSession.findById(sourceSessionId);
  if (!session) {
    const error = new Error('Assessment session not found.');
    error.status = 404;
    error.code = 'SESSION_NOT_FOUND';
    throw error;
  }

  if (session.userId.toString() !== userId.toString()) {
    const error = new Error('Access denied: You do not own this assessment session.');
    error.status = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  if (session.status !== 'completed') {
    const error = new Error('Source assessment session is not completed.');
    error.status = 400;
    error.code = 'SESSION_NOT_COMPLETED';
    throw error;
  }

  const pathway = catalog.find(p => p.pathwayId === pathwayId);
  if (!pathway) {
    const error = new Error(`Pathway '${pathwayId}' does not exist in the remediation catalog.`);
    error.status = 400;
    error.code = 'PATHWAY_NOT_FOUND';
    throw error;
  }

  // Authoritative Phase 3 recommendation eligibility check
  const remediation = await generateRemediation(sourceSessionId, userId);
  const isEligible = (remediation.recommendations || []).some(r => r.pathwayId === pathwayId);

  if (!isEligible) {
    const error = new Error(`Pathway '${pathwayId}' is not an active recommended pathway for this assessment session.`);
    error.status = 403;
    error.code = 'PATHWAY_NOT_ELIGIBLE';
    throw error;
  }

  return { session, pathway };
}

/**
 * POST /api/progress/pathways/step
 * Record Step 1 (caseStudy) or Step 2 (prevention)
 */
exports.recordPathwayStep = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pathwayId, sourceSessionId, step, decisionChoiceIndex, acknowledged } = req.body;

    const { pathway } = await validateSessionAndEligibility(userId, sourceSessionId, pathwayId);

    let educationalFeedback = '';

    if (step === 'caseStudy') {
      if (typeof decisionChoiceIndex !== 'number' || decisionChoiceIndex < 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STEP_ACTION', message: 'A valid decision choice index is required for the case-study step.' }
        });
      }
      const caseStudy = await CaseStudy.findOne({ slug: pathway.caseStudySlug });
      if (caseStudy && Array.isArray(caseStudy.decisionPoints) && caseStudy.decisionPoints.length > 0) {
        const dp = caseStudy.decisionPoints[0];
        const selectedOpt = dp.options && dp.options[decisionChoiceIndex];
        educationalFeedback = selectedOpt?.explanation || dp.explanation || 'Decision point reviewed.';
      } else {
        educationalFeedback = 'Incident case study reviewed.';
      }
    } else if (step === 'prevention') {
      if (acknowledged !== true) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STEP_ACTION', message: 'Explicit acknowledgment is required for the practical defense step.' }
        });
      }
      educationalFeedback = `Defensive rule acknowledged: "${pathway.coreRule}"`;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STEP', message: 'Invalid step. Supported steps: caseStudy, prevention.' }
      });
    }

    // Load or create UserProgress
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        completedModules: [],
        badgesEarned: ['First Step'],
        currentStreak: 0,
        completedPathways: []
      });
    }

    if (!Array.isArray(progress.completedPathways)) {
      progress.completedPathways = [];
    }

    let pathwayRecord = progress.completedPathways.find(
      p => p.pathwayId === pathwayId && p.sourceSessionId.toString() === sourceSessionId.toString()
    );

    if (!pathwayRecord) {
      pathwayRecord = {
        pathwayId,
        sourceSessionId,
        stepsCompleted: {
          caseStudy: false,
          prevention: false,
          checkpointQuiz: false
        }
      };
      progress.completedPathways.push(pathwayRecord);
      pathwayRecord = progress.completedPathways[progress.completedPathways.length - 1];
    }

    if (step === 'caseStudy') {
      pathwayRecord.stepsCompleted.caseStudy = true;
    } else if (step === 'prevention') {
      pathwayRecord.stepsCompleted.prevention = true;
    }

    progress.lastActivity = new Date();
    await progress.save();

    res.json({
      success: true,
      pathwayId,
      sourceSessionId,
      step,
      stepsCompleted: pathwayRecord.stepsCompleted,
      isFullyCompleted: Boolean(pathwayRecord.completedAt),
      educationalFeedback
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'STEP_RECORD_ERROR', message: error.message }
    });
  }
};

/**
 * GET /api/progress/pathways/:pathwayId/checkpoint?sourceSessionId=<id>
 * Fetch sanitized checkpoint questions (correctOptionIndex and explanation stripped)
 */
exports.getPathwayCheckpoint = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pathwayId } = req.params;
    const { sourceSessionId } = req.query;

    const { pathway } = await validateSessionAndEligibility(userId, sourceSessionId, pathwayId);

    if (!pathway.checkpoint || !Array.isArray(pathway.checkpoint.questions)) {
      return res.status(404).json({
        success: false,
        error: { code: 'CHECKPOINT_NOT_CONFIGURED', message: 'No learning checkpoint configured for this pathway.' }
      });
    }

    // Sanitize questions: strip correctOptionIndex and explanation
    const sanitizedQuestions = pathway.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      questionText: q.questionText,
      options: q.options
    }));

    res.json({
      success: true,
      pathwayId,
      sourceSessionId,
      passingScore: pathway.checkpoint.passingScore,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'CHECKPOINT_FETCH_ERROR', message: error.message }
    });
  }
};

/**
 * GET /api/progress/pathways/:pathwayId/review?sourceSessionId=<id>
 * Fetch completed checkpoint review: questions, submitted answers (if recorded), correctness, and statutory explanations.
 * STRICT SECURITY: Only available if the pathway was already completed by this user for this session.
 */
exports.getPathwayCheckpointReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pathwayId } = req.params;
    const { sourceSessionId } = req.query;

    const { pathway } = await validateSessionAndEligibility(userId, sourceSessionId, pathwayId);

    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_COMPLETED', message: 'Checkpoint review is only available for fully completed pathways.' }
      });
    }

    // Check in completedPathways or reinforcementsCompleted
    const pathwayRecord = (progress.completedPathways || []).find(
      p => p.pathwayId === pathwayId && p.sourceSessionId.toString() === sourceSessionId.toString()
    );
    const reinforceRecord = (progress.reinforcementsCompleted || []).find(
      r => r.pathwayId === pathwayId && r.sourceSessionId.toString() === sourceSessionId.toString()
    );

    const isCompleted = Boolean(pathwayRecord?.completedAt || reinforceRecord?.completedAt);
    if (!isCompleted) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_COMPLETED', message: 'Checkpoint review is only available for fully completed pathways.' }
      });
    }

    const answersList = pathwayRecord?.checkpointAnswers || reinforceRecord?.checkpointAnswers || [];
    const checkpointDef = pathway.checkpoint;
    if (!checkpointDef || !Array.isArray(checkpointDef.questions)) {
      return res.status(404).json({
        success: false,
        error: { code: 'CHECKPOINT_NOT_CONFIGURED', message: 'No learning checkpoint configured for this pathway.' }
      });
    }

    // Construct review payload
    const reviewQuestions = checkpointDef.questions.map(q => {
      const userAns = answersList.find(a => a.questionId === q.questionId);
      return {
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        statutoryReference: pathway.statutoryReference || null,
        selectedOptionIndex: userAns !== undefined ? userAns.selectedOptionIndex : null,
        isCorrect: userAns !== undefined ? userAns.isCorrect : null
      };
    });

    res.json({
      success: true,
      pathwayId,
      sourceSessionId,
      completedAt: pathwayRecord?.completedAt || reinforceRecord?.completedAt,
      checkpointScore: pathwayRecord?.checkpointScore ?? reinforceRecord?.checkpointScore ?? null,
      passingScore: checkpointDef.passingScore,
      hasStoredAnswers: answersList.length > 0,
      questions: reviewQuestions
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'REVIEW_FETCH_ERROR', message: error.message }
    });
  }
};

/**
 * POST /api/progress/pathways/checkpoint
 * Submit answers, server calculates score against passingScore and updates completion
 */
exports.submitPathwayCheckpoint = async (req, res) => {
  try {
    const userId = req.user._id;
    // Explicitly destructure only recognized fields; client-supplied scores/completion flags are discarded
    const { pathwayId, sourceSessionId, answers } = req.body;

    const { pathway } = await validateSessionAndEligibility(userId, sourceSessionId, pathwayId);

    if (!pathway.checkpoint || !Array.isArray(pathway.checkpoint.questions)) {
      return res.status(404).json({
        success: false,
        error: { code: 'CHECKPOINT_NOT_CONFIGURED', message: 'No learning checkpoint configured for this pathway.' }
      });
    }

    let progress = await UserProgress.findOne({ userId });
    if (!progress || !Array.isArray(progress.completedPathways)) {
      return res.status(400).json({
        success: false,
        error: { code: 'PREREQUISITES_NOT_MET', message: 'Step 1 (Incident Learning) and Step 2 (Practical Defense) must be completed before taking the Learning Checkpoint.' }
      });
    }

    let pathwayRecord = progress.completedPathways.find(
      p => p.pathwayId === pathwayId && p.sourceSessionId.toString() === sourceSessionId.toString()
    );

    if (!pathwayRecord || !pathwayRecord.stepsCompleted?.caseStudy || !pathwayRecord.stepsCompleted?.prevention) {
      return res.status(400).json({
        success: false,
        error: { code: 'PREREQUISITES_NOT_MET', message: 'Step 1 (Incident Learning) and Step 2 (Practical Defense) must be completed before taking the Learning Checkpoint.' }
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ANSWERS', message: 'Answers array is required.' }
      });
    }

    const checkpointDef = pathway.checkpoint;
    const totalQuestions = checkpointDef.questions.length;
    let correctCount = 0;
    const explanations = [];

    for (const q of checkpointDef.questions) {
      const userAns = answers.find(a => a.questionId === q.questionId);
      if (!userAns || typeof userAns.selectedOptionIndex !== 'number') {
        return res.status(400).json({
          success: false,
          error: { code: 'INCOMPLETE_ANSWERS', message: `Missing answer for question ${q.questionId}.` }
        });
      }

      if (userAns.selectedOptionIndex < 0 || userAns.selectedOptionIndex >= q.options.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPTION_INDEX', message: `Invalid option index selected for question ${q.questionId}.` }
        });
      }

      const isCorrect = userAns.selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) {
        correctCount++;
      }

      explanations.push({
        questionId: q.questionId,
        selectedOptionIndex: userAns.selectedOptionIndex,
        isCorrect,
        explanation: q.explanation
      });
    }

    // Server-authoritative percentage calculation
    const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
    const passed = calculatedScore >= checkpointDef.passingScore;

    pathwayRecord.checkpointScore = calculatedScore;

    if (passed) {
      pathwayRecord.stepsCompleted.checkpointQuiz = true;
      pathwayRecord.checkpointAnswers = explanations.map(e => ({
        questionId: e.questionId,
        selectedOptionIndex: e.selectedOptionIndex,
        isCorrect: e.isCorrect
      }));
      if (!pathwayRecord.completedAt) {
        pathwayRecord.completedAt = new Date();
      }
    } else {
      pathwayRecord.stepsCompleted.checkpointQuiz = false;
    }

    progress.lastActivity = new Date();
    await progress.save();

    res.json({
      success: true,
      passed,
      score: calculatedScore,
      passingScore: checkpointDef.passingScore,
      isFullyCompleted: Boolean(pathwayRecord.completedAt),
      completedAt: pathwayRecord.completedAt || null,
      explanations
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'CHECKPOINT_SUBMIT_ERROR', message: error.message }
    });
  }
};

/**
 * POST /api/progress/pathways/reinforce
 * Phase 5A: Server-authoritative targeted habit reinforcement
 */
exports.reinforcePathway = async (req, res) => {
  try {
    const userId = req.user._id;
    // Client submits only identifiers and answers; client-supplied scores, completion, habit states are discarded
    const { pathwayId, sourceSessionId, answers } = req.body;

    if (!sourceSessionId || !mongoose.Types.ObjectId.isValid(sourceSessionId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SESSION_ID', message: 'Invalid or missing source session ID.' }
      });
    }

    const session = await AssessmentSession.findById(sourceSessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Assessment session not found.' }
      });
    }

    // Authenticate user & verify ownership
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You do not own this assessment session.' }
      });
    }

    // Verify completion
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: { code: 'SESSION_NOT_COMPLETED', message: 'Source assessment session is not completed.' }
      });
    }

    // Verify compatible version
    if ((session.scenarioVersion || 1) < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INCOMPATIBLE_SESSION', message: 'Targeted habit reinforcement requires a compatible scenario version (v2+).' }
      });
    }

    // Verify pathway exists in catalog
    const pathway = catalog.find(p => p.pathwayId === pathwayId);
    if (!pathway) {
      return res.status(400).json({
        success: false,
        error: { code: 'PATHWAY_NOT_FOUND', message: `Pathway '${pathwayId}' does not exist in the remediation catalog.` }
      });
    }

    // Generate authoritative remediation for source session to verify recommendation & habit shift state
    const remediation = await generateRemediation(sourceSessionId, userId);
    const rec = (remediation.recommendations || []).find(r => r.pathwayId === pathwayId);

    if (!rec) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_ELIGIBLE', message: `Pathway '${pathwayId}' is not an active recommended pathway for this assessment session.` }
      });
    }

    const sourceHabitState = rec.habitShiftState || rec.state;
    if (sourceHabitState !== 'continued_practice' && sourceHabitState !== 'emerging_gap') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'REINFORCEMENT_NOT_ELIGIBLE',
          message: `Targeted reinforcement is only eligible for 'continued_practice' or 'emerging_gap' habit states. Current state is '${sourceHabitState}'.`
        }
      });
    }

    if (!pathway.checkpoint || !Array.isArray(pathway.checkpoint.questions) || pathway.checkpoint.questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'CHECKPOINT_NOT_CONFIGURED', message: 'No learning checkpoint configured for this pathway.' }
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ANSWERS', message: 'Answers array is required.' }
      });
    }

    const checkpointDef = pathway.checkpoint;
    const totalQuestions = checkpointDef.questions.length;
    let correctCount = 0;
    const explanations = [];

    for (const q of checkpointDef.questions) {
      const userAns = answers.find(a => a.questionId === q.questionId);
      if (!userAns || typeof userAns.selectedOptionIndex !== 'number') {
        return res.status(400).json({
          success: false,
          error: { code: 'INCOMPLETE_ANSWERS', message: `Missing answer for question ${q.questionId}.` }
        });
      }

      if (userAns.selectedOptionIndex < 0 || userAns.selectedOptionIndex >= q.options.length) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OPTION_INDEX', message: `Invalid option index selected for question ${q.questionId}.` }
        });
      }

      const isCorrect = userAns.selectedOptionIndex === q.correctOptionIndex;
      if (isCorrect) {
        correctCount++;
      }

      explanations.push({
        questionId: q.questionId,
        selectedOptionIndex: userAns.selectedOptionIndex,
        isCorrect,
        explanation: q.explanation
      });
    }

    // Server-authoritative calculation
    const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
    const passed = calculatedScore >= checkpointDef.passingScore;

    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        completedModules: [],
        badgesEarned: ['First Step'],
        currentStreak: 0,
        completedPathways: [],
        reinforcementsCompleted: []
      });
    }

    if (!Array.isArray(progress.reinforcementsCompleted)) {
      progress.reinforcementsCompleted = [];
    }

    let completedAt = null;

    if (passed) {
      // Idempotency: find existing reinforcement record for this session & pathway
      let existingRecord = progress.reinforcementsCompleted.find(
        r => r.pathwayId === pathwayId && r.sourceSessionId.toString() === sourceSessionId.toString()
      );

      if (existingRecord) {
        existingRecord.checkpointScore = calculatedScore;
        existingRecord.completedAt = new Date();
        existingRecord.checkpointAnswers = explanations.map(e => ({
          questionId: e.questionId,
          selectedOptionIndex: e.selectedOptionIndex,
          isCorrect: e.isCorrect
        }));
        completedAt = existingRecord.completedAt;
      } else {
        const newRecord = {
          pathwayId,
          sourceSessionId,
          sourceHabitState,
          completedAt: new Date(),
          checkpointScore: calculatedScore,
          checkpointAnswers: explanations.map(e => ({
            questionId: e.questionId,
            selectedOptionIndex: e.selectedOptionIndex,
            isCorrect: e.isCorrect
          }))
        };
        progress.reinforcementsCompleted.push(newRecord);
        completedAt = newRecord.completedAt;
      }

      progress.lastActivity = new Date();
      await progress.save();
    }

    res.json({
      success: true,
      passed,
      score: calculatedScore,
      passingScore: checkpointDef.passingScore,
      sourceHabitState,
      isReinforcementCompleted: passed,
      completedAt,
      explanations,
      message: passed
        ? 'Reinforcement completed: demonstrates successful performance on the targeted learning checkpoint.'
        : 'Checkpoint not passed: review defensive rule and try again.'
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'REINFORCE_ERROR', message: error.message }
    });
  }
};

/**
 * GET /api/progress/portfolio
 * Phase 5B: Three-Pillar Defensive Portfolio
 * Authenticated and owner-only
 */
exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;

    // Parallel query
    const [progress, quizAttempts, assessments] = await Promise.all([
      UserProgress.findOne({ userId }),
      QuizAttempt.find({ userId }).populate('quizId', 'title category').sort({ completedAt: -1 }),
      AssessmentSession.find({
        userId,
        status: 'completed',
        scenarioVersion: { $gte: 2 }
      }).sort({ completedAt: 1 })
    ]);

    // Pillar 1: Learning Interventions
    const completedPathways = (progress?.completedPathways || [])
      .filter(p => Boolean(p.completedAt))
      .map(p => {
        const pathwayDef = catalog.find(cat => cat.pathwayId === p.pathwayId);
        return {
          pathwayId: p.pathwayId,
          habitTitle: pathwayDef?.habitTitle || p.pathwayId,
          sourceSessionId: p.sourceSessionId,
          completedAt: p.completedAt,
          checkpointScore: p.checkpointScore
        };
      });

    const reinforcementsCompleted = (progress?.reinforcementsCompleted || []).map(r => {
      const pathwayDef = catalog.find(cat => cat.pathwayId === r.pathwayId);
      return {
        pathwayId: r.pathwayId,
        habitTitle: pathwayDef?.habitTitle || r.pathwayId,
        sourceSessionId: r.sourceSessionId,
        sourceHabitState: r.sourceHabitState,
        completedAt: r.completedAt,
        checkpointScore: r.checkpointScore
      };
    });

    const spacedReviews = (progress?.spacedReviews || [])
      .filter(sr => sr && sr.pathwayId && sr.completedAt && typeof sr.checkpointScore === 'number')
      .map(sr => {
        const pathwayDef = catalog.find(p => p.pathwayId === sr.pathwayId);
        return {
          pathwayId: sr.pathwayId,
          habitTitle: pathwayDef?.habitTitle || sr.pathwayId,
          sourceSessionId: sr.sourceSessionId,
          cycleNumber: sr.cycleNumber || 1,
          completedAt: sr.completedAt,
          checkpointScore: sr.checkpointScore,
          passed: Boolean(sr.passed)
        };
      });

    const interventions = {
      title: 'Learning Interventions',
      description: 'Demonstrates successful performance on the targeted learning checkpoint.',
      completedPathways,
      reinforcementsCompleted,
      spacedReviews,
      summary: {
        totalCompletedPathways: completedPathways.length,
        totalReinforcements: reinforcementsCompleted.length,
        totalSpacedReviews: spacedReviews.length,
        passedSpacedReviews: spacedReviews.filter(r => r.passed).length
      }
    };

    // Pillar 2: Knowledge Practice
    // Strictly Category A: ONLY verified QuizAttempt data. Zero untracked reading/browsing claims.
    const cleanQuizAttempts = (quizAttempts || []).map(qa => ({
      attemptId: qa._id,
      quizId: qa.quizId?._id || qa.quizId,
      quizTitle: qa.quizId?.title || 'Cyber Law Quiz',
      category: qa.quizId?.category || 'General',
      score: qa.score,
      percentage: qa.percentage,
      attemptNumber: qa.attemptNumber || 1,
      completedAt: qa.completedAt
    }));

    const distinctQuizzes = [...new Set(cleanQuizAttempts.map(q => q.quizId?.toString()))];

    const knowledgePractice = {
      title: 'Knowledge Practice',
      description: 'Verified statutory knowledge and concept testing through quiz evaluations.',
      quizAttempts: cleanQuizAttempts,
      summary: {
        totalAttempts: cleanQuizAttempts.length,
        distinctQuizzesTaken: distinctQuizzes.length
      }
    };

    // Pillar 3: Behavioral Evolution
    // Valid compatible assessment sessions (scenarioVersion >= 2, completed, 6 valid behaviourScores)
    const validSessions = (assessments || []).filter(session => {
      const scores = session.behaviourScores instanceof Map
        ? Object.fromEntries(session.behaviourScores)
        : (session.behaviourScores || {});
      const requiredDims = ['recognition', 'signalIdentification', 'verification', 'decisionQuality', 'falsePositive', 'unreviewedAcceptance'];
      return requiredDims.every(dim => typeof scores[dim] === 'number');
    });

    const behavioralTrajectory = {
      title: 'Behavioral Evolution',
      description: 'Longitudinal defensive decisions observed across interactive simulation scenarios.',
      comparableSessionsCount: validSessions.length,
      sessions: validSessions.map(s => {
        const scores = s.behaviourScores instanceof Map
          ? Object.fromEntries(s.behaviourScores)
          : (s.behaviourScores || {});
        return {
          sessionId: s._id,
          scenarioCode: s.scenarioCode,
          scenarioVersion: s.scenarioVersion,
          completedAt: s.completedAt,
          behaviourScores: {
            TR: scores.recognition,
            SI: scores.signalIdentification,
            VB: scores.verification,
            DQ: scores.decisionQuality,
            FP: scores.falsePositive,
            UA: scores.unreviewedAcceptance
          }
        };
      })
    };

    res.json({
      success: true,
      interventions,
      knowledgePractice,
      behavioralTrajectory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PORTFOLIO_ERROR', message: error.message }
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

/**
 * GET /api/progress/pathways/spaced-retrieval/due
 * Surface due spaced retrieval reviews when learner opens the dashboard
 */
exports.getDueSpacedRetrievals = async (req, res) => {
  try {
    const userId = req.user._id;
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
      return res.json({
        success: true,
        dueReviews: [],
        totalDue: 0,
        delayDaysConfigured: spacedRetrievalService.getSpacedRetrievalDelayDays(),
        evidenceNotice: 'Spaced retrieval evaluates delayed statutory rule recall; it is distinct from verified live behavioral transfer.'
      });
    }

    const dueReviews = spacedRetrievalService.getDueSpacedReviews(progress);
    res.json({
      success: true,
      dueReviews,
      totalDue: dueReviews.length,
      delayDaysConfigured: spacedRetrievalService.getSpacedRetrievalDelayDays(),
      evidenceNotice: 'Spaced retrieval evaluates delayed statutory rule recall; it is distinct from verified live behavioral transfer.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DUE_SPACED_REVIEWS_ERROR', message: error.message }
    });
  }
};

/**
 * GET /api/progress/pathways/:pathwayId/spaced-retrieval?sourceSessionId=<id>
 * Fetch sanitized retrieval questions without answers or explanations
 * Strict Security: Pathway must be fully completed by this user
 */
exports.getSpacedRetrievalQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pathwayId } = req.params;
    const { sourceSessionId } = req.query;

    const progress = await UserProgress.findOne({ userId });
    if (!progress || !Array.isArray(progress.completedPathways)) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_COMPLETED', message: 'Spaced retrieval is only available for fully completed pathways.' }
      });
    }

    const completedRecord = progress.completedPathways.find(p => {
      const matchPathway = p.pathwayId === pathwayId;
      if (!sourceSessionId) return matchPathway && Boolean(p.completedAt);
      const sId = String(p.sourceSessionId?._id || p.sourceSessionId);
      return matchPathway && sId === String(sourceSessionId) && Boolean(p.completedAt);
    });

    if (!completedRecord || !completedRecord.completedAt) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_COMPLETED', message: 'Spaced retrieval is only available for fully completed pathways.' }
      });
    }

    if (sourceSessionId) {
      if (!mongoose.Types.ObjectId.isValid(sourceSessionId)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SESSION_ID', message: 'Invalid source session ID.' }
        });
      }
      const session = await AssessmentSession.findById(sourceSessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'SESSION_NOT_FOUND', message: 'Assessment session not found.' }
        });
      }
      if (session.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied: You do not own this assessment session.' }
        });
      }
    }

    const payload = spacedRetrievalService.getSanitizedRetrievalQuestions(pathwayId);
    res.json({
      success: true,
      ...payload,
      sourceSessionId: completedRecord.sourceSessionId,
      originalCompletedAt: completedRecord.completedAt,
      evidenceNotice: 'Recall the defensive rule before answering. Explanations are revealed upon authoritative grading.'
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'SPACED_QUESTIONS_ERROR', message: error.message }
    });
  }
};

/**
 * POST /api/progress/pathways/:pathwayId/spaced-retrieval
 * Submit answers, server authoritatively grades submission and updates spacedReviews idempotently
 */
exports.submitSpacedRetrieval = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pathwayId } = req.params;
    // Explicitly destructure recognized fields only; client-supplied scores/pass flags are discarded
    const { sourceSessionId, answers } = req.body;

    let progress = await UserProgress.findOne({ userId });
    if (!progress || !Array.isArray(progress.completedPathways)) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_COMPLETED', message: 'Spaced retrieval is only available for fully completed pathways.' }
      });
    }

    const completedRecord = progress.completedPathways.find(p => {
      const matchPathway = p.pathwayId === pathwayId;
      if (!sourceSessionId) return matchPathway && Boolean(p.completedAt);
      const sId = String(p.sourceSessionId?._id || p.sourceSessionId);
      return matchPathway && sId === String(sourceSessionId) && Boolean(p.completedAt);
    });

    if (!completedRecord || !completedRecord.completedAt) {
      return res.status(403).json({
        success: false,
        error: { code: 'PATHWAY_NOT_COMPLETED', message: 'Spaced retrieval is only available for fully completed pathways.' }
      });
    }

    const effectiveSessionId = sourceSessionId || completedRecord.sourceSessionId;
    if (effectiveSessionId && mongoose.Types.ObjectId.isValid(effectiveSessionId)) {
      const session = await AssessmentSession.findById(effectiveSessionId);
      if (session && session.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied: You do not own this assessment session.' }
        });
      }
    }

    // Authoritative evaluation
    const evalResult = spacedRetrievalService.evaluateSpacedRetrievalSubmission(pathwayId, answers);

    if (!Array.isArray(progress.spacedReviews)) {
      progress.spacedReviews = [];
    }

    // Idempotency: check if an identical review was submitted within the last 15 minutes
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const recentDuplicate = progress.spacedReviews.find(r => 
      r.pathwayId === pathwayId &&
      String(r.sourceSessionId) === String(effectiveSessionId) &&
      new Date(r.completedAt) >= fifteenMinutesAgo
    );

    let recordedReview;
    if (recentDuplicate) {
      // Idempotently update existing recent submission instead of duplicating records
      recentDuplicate.checkpointScore = evalResult.calculatedScore;
      recentDuplicate.passed = evalResult.passed;
      recentDuplicate.reviewAnswers = evalResult.reviewAnswers;
      recentDuplicate.completedAt = now;
      recordedReview = recentDuplicate;
    } else {
      const priorCount = progress.spacedReviews.filter(r => r.pathwayId === pathwayId).length;
      recordedReview = {
        pathwayId,
        sourceSessionId: effectiveSessionId,
        cycleNumber: priorCount + 1,
        completedAt: now,
        checkpointScore: evalResult.calculatedScore,
        passed: evalResult.passed,
        reviewAnswers: evalResult.reviewAnswers
      };
      progress.spacedReviews.push(recordedReview);
    }

    progress.lastActivity = now;
    await progress.save();

    res.json({
      success: true,
      pathwayId,
      sourceSessionId: effectiveSessionId,
      score: evalResult.calculatedScore,
      passingScore: evalResult.passingScore,
      passed: evalResult.passed,
      cycleNumber: recordedReview.cycleNumber,
      completedAt: recordedReview.completedAt,
      explanations: evalResult.explanations,
      evidenceNotice: 'Spaced retrieval demonstrates delayed conceptual recall of defensive principles. It does not certify simulated or real-world behavioral immunity.',
      message: evalResult.passed
        ? 'Spaced retrieval passed: verified delayed statutory rule recall.'
        : 'Spaced retrieval not passed: review defensive rule and statutory context.'
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      error: { code: error.code || 'SPACED_SUBMIT_ERROR', message: error.message }
    });
  }
};

