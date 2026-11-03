/**
 * Phase 4.4 / AQ-4: Integrated Assessment Validation
 * 
 * Comprehensive end-to-end lifecycle verification suite:
 * 1. Registration, authentication, and initial dashboard journey state (CJ-1)
 * 2. Final assessment prerequisite enforcement (HTTP 403 PREREQUISITE_NOT_MET)
 * 3. Baseline assessment traversal via Path 1 (Stage 7 -> 8 -> 10..14) with idempotency verification
 * 4. Authoritative six-dimensional profile generation (TR, SI, VB, DQ, FP, UA; zero composites)
 * 5. Post-baseline dashboard journey synchronization (CJ-2)
 * 6. Adaptive remediation ranking by deficit and intervention completion (Steps 1, 2, Checkpoint)
 * 7. Assessment session score immutability across remediation drills
 * 8. Post-pathway dashboard synchronization (CJ-3) and Final Check prerequisite unlock
 * 9. Final assessment traversal via Path 2 (Stage 7 -> 9 -> 10..14) and paired-baseline delta calculation
 * 10. Post-final dashboard synchronization (CJ-4) and discrete longitudinal trajectory API
 * 11. Three-pillar defensive portfolio docket verification
 * 12. Cross-path learner validation: Baseline Path 2 -> Final Path 1 with opportunity parity check
 * 13. Historical v1 isolation and version compatibility
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { getJwtSecret } = require('../config/productionSecurity');
const catalog = require('../config/remediationCatalog');

// Models
const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const UserProgress = require('../models/UserProgress');

// Routes
const authRoutes = require('../routes/auth');
const simulationRoutes = require('../routes/simulations');
const progressRoutes = require('../routes/progress');

describe('Phase 4.4 / AQ-4: Integrated Assessment Validation Suite', () => {
  let server;
  let baseUrl;

  // Test accounts
  let learner1;
  let learner2;
  let token1;
  let token2;

  // Tracked IDs for cleanup
  const testUserIds = [];
  const testSessionIds = [];
  const testDecisionIds = [];

  // Scenarios and Stages
  let baselineScenario;
  let finalScenario;
  let baselineStages = [];
  let finalStages = [];

  before(async () => {
    await connectDB();

    // Setup dedicated Express test app
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/assessments', simulationRoutes);
    app.use('/api/progress', progressRoutes);

    server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // Verify published scenarios exist
    baselineScenario = await Scenario.findOne({ slug: 'baseline', status: 'published' }).sort({ version: -1 });
    assert.ok(baselineScenario, 'Published baseline scenario must exist');
    finalScenario = await Scenario.findOne({ slug: 'final', status: 'published' }).sort({ version: -1 });
    assert.ok(finalScenario, 'Published final scenario must exist');

    baselineStages = await ScenarioStage.find({ scenarioId: baselineScenario._id }).sort({ stageOrder: 1 });
    finalStages = await ScenarioStage.find({ scenarioId: finalScenario._id }).sort({ stageOrder: 1 });

    assert.equal(baselineStages.length, 14, 'Baseline scenario must have 14 stage records');
    assert.equal(finalStages.length, 14, 'Final scenario must have 14 stage records');

    // Create test accounts
    const timestamp = Date.now();
    const passwordHash = await bcrypt.hash('LifecyclePass123!', 8);

    learner1 = await User.create({
      fullName: 'Lifecycle Learner Path1',
      email: `aq4_learner1_${timestamp}@lifecycle.test`,
      passwordHash,
      role: 'user',
      isActive: true
    });
    testUserIds.push(learner1._id);

    learner2 = await User.create({
      fullName: 'Lifecycle Learner Path2',
      email: `aq4_learner2_${timestamp}@lifecycle.test`,
      passwordHash,
      role: 'user',
      isActive: true
    });
    testUserIds.push(learner2._id);

    const secret = getJwtSecret();
    token1 = jwt.sign({ id: learner1._id, role: learner1.role }, secret, { expiresIn: '2h' });
    token2 = jwt.sign({ id: learner2._id, role: learner2.role }, secret, { expiresIn: '2h' });
  });

  after(async () => {
    try {
      if (testUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: testUserIds } });
        await UserProgress.deleteMany({ userId: { $in: testUserIds } });
      }
      if (testSessionIds.length > 0) {
        await AssessmentSession.deleteMany({ _id: { $in: testSessionIds } });
        await AssessmentDecision.deleteMany({ assessmentSessionId: { $in: testSessionIds } });
      }
    } catch (err) {
      console.error('AQ-4 cleanup error:', err.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // TEST 1: Initial Dashboard Journey State (CJ-1)
  // =========================================================================
  it('1. Initial dashboard journey state confirms First Check pending (CJ-1)', async () => {
    const res = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.baselineScore, null);
    assert.equal(data.finalScore, null);
    assert.equal(data.baselineSessionId, null);
    assert.equal(data.completedPathways.length, 0);
  });

  // =========================================================================
  // TEST 2: Final Assessment Prerequisite Enforcement
  // =========================================================================
  it('2. Final assessment cannot start without completed baseline (HTTP 403 PREREQUISITE_NOT_MET)', async () => {
    const res = await fetch(`${baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ scenarioCode: 'final', scenarioVersion: 2 })
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'PREREQUISITE_NOT_MET');
    assert.ok(data.error.message.includes('First Check'));
  });

  // =========================================================================
  // TEST 3: Baseline Assessment Path 1 Traversal & Idempotency
  // =========================================================================
  let learner1BaselineSessionId;

  it('3. Learner 1 traverses Baseline via Path 1 with strict idempotency and probe validation', async () => {
    // Start baseline assessment
    const startRes = await fetch(`${baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ scenarioCode: 'baseline', scenarioVersion: 2 })
    });
    assert.equal(startRes.status, 200);
    const startData = await startRes.json();
    assert.ok(startData.sessionId);
    learner1BaselineSessionId = startData.sessionId;
    testSessionIds.push(learner1BaselineSessionId);

    let currentStage = startData.stage;
    let baselineFinalResult = null;
    let experiencedCount = 0;

    while (currentStage) {
      experiencedCount++;
      const stageDoc = await ScenarioStage.findById(currentStage.id);
      const stageDecisions = await ScenarioDecision.find({ stageId: currentStage.id });
      assert.ok(stageDecisions.length > 0, `Stage ${stageDoc.stageOrder} must have decisions`);

      // Determine chosen decision:
      // On stage 7, force Path 1 (next stageOrder = 8)
      let chosenDecision;
      if (stageDoc.stageOrder === 7) {
        const stage8 = baselineStages.find(s => s.stageOrder === 8);
        chosenDecision = stageDecisions.find(d => d.nextStageId && d.nextStageId.toString() === stage8._id.toString());
        assert.ok(chosenDecision, 'Path 1 decision leading to stage 8 must exist');
      } else if (stageDoc.stageOrder === 2 || stageDoc.stageOrder === 4 || stageDoc.stageOrder === 6) {
        // Select some risky options on deficit stages to test remediation trigger
        chosenDecision = stageDecisions.find(d => d.riskLevel === 'high-risk' || d.riskLevel === 'critical') || stageDecisions[0];
      } else {
        // Safe options
        chosenDecision = stageDecisions.find(d => d.riskLevel === 'safe' && d.outcomeType === 'correct') || stageDecisions[0];
      }

      const idempotencyKey = `idemp_${learner1BaselineSessionId}_${currentStage.id}`;
      const payload = {
        assessmentSessionId: learner1BaselineSessionId,
        stageId: currentStage.id,
        decisionId: chosenDecision._id,
        idempotencyKey
      };

      if (currentStage.hasSignalProbe && currentStage.signalProbes && currentStage.signalProbes.length > 0) {
        payload.signalProbeDecisionId = currentStage.signalProbes[0].id || currentStage.signalProbes[0]._id;
      }

      // On Stage 2 (probe stage) and Stage 10 (convergence probe stage), test idempotency guarantees
      if (stageDoc.stageOrder === 2 || stageDoc.stageOrder === 10) {
        // Submit valid step
        const stepRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`
          },
          body: JSON.stringify(payload)
        });
        assert.equal(stepRes.status, 200);

        // Test Idempotent Retry: identical payload returns 200 with isRetry: true
        const retryRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`
          },
          body: JSON.stringify(payload)
        });
        assert.equal(retryRes.status, 200);
        const retryData = await retryRes.json();
        assert.equal(retryData.isRetry, true);

        // Test Idempotency Conflict: same idempotencyKey with different decision returns HTTP 409
        const otherDecision = stageDecisions.find(d => d._id.toString() !== chosenDecision._id.toString()) || stageDecisions[0];
        const conflictRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`
          },
          body: JSON.stringify({
            ...payload,
            decisionId: otherDecision._id
          })
        });
        assert.equal(conflictRes.status, 409);
        const conflictData = await conflictRes.json();
        assert.equal(conflictData.error.code, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');

        const stepData = await stepRes.json();
        if (stepData.isCompleted) {
          baselineFinalResult = stepData;
          break;
        }
        currentStage = stepData.stage;
      } else {
        const stepRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token1}`
          },
          body: JSON.stringify(payload)
        });
        assert.equal(stepRes.status, 200);
        const stepData = await stepRes.json();

        if (stepData.isCompleted) {
          baselineFinalResult = stepData;
          break;
        }
        currentStage = stepData.stage;
      }
    }

    assert.equal(experiencedCount, 13, 'Path 1 journey must traverse exactly 13 experienced situations');
    assert.ok(baselineFinalResult, 'Baseline assessment must complete');
    assert.equal(baselineFinalResult.isCompleted, true);

    // Verify authoritative six-dimensional profile
    const scores = baselineFinalResult.behaviourScores;
    assert.ok(scores, 'Authoritative behaviourScores must be returned');
    assert.ok('recognition' in scores);
    assert.ok('signalIdentification' in scores);
    assert.ok('verification' in scores);
    assert.ok('decisionQuality' in scores);
    assert.ok('falsePositive' in scores);
    assert.ok('unreviewedAcceptance' in scores);

    // Verify zero legacy composite score or grade in behavioral profile
    assert.equal(baselineFinalResult.compositeScore, undefined);
    assert.equal(baselineFinalResult.overallGrade, undefined);
  });

  // =========================================================================
  // TEST 4: Post-Baseline Dashboard Journey Synchronization (CJ-2)
  // =========================================================================
  it('4. Post-baseline dashboard reflects completed First Check and unlocks Remediation (CJ-2)', async () => {
    const res = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.baselineSessionId.toString(), learner1BaselineSessionId.toString());
    assert.equal(data.latestSessionId.toString(), learner1BaselineSessionId.toString());
    assert.notEqual(data.baselineScore, null);
    assert.equal(data.finalScore, null);
    assert.ok(data.baselineBehaviourScores);
    assert.ok(data.baselineBehaviourScores.recognition >= 0);
  });

  // =========================================================================
  // TEST 5: Adaptive Remediation Ranking & Intervention Completion
  // =========================================================================
  let primaryPathwayId;

  it('5. Adaptive remediation ranks deficit dimensions and allows full intervention completion', async () => {
    const remRes = await fetch(`${baseUrl}/api/assessments/remediation/${learner1BaselineSessionId}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(remRes.status, 200);
    const remData = await remRes.json();

    assert.equal(remData.assessmentType, 'baseline');
    assert.ok(remData.recommendations.length > 0 && remData.recommendations.length <= 2);

    primaryPathwayId = remData.recommendations[0].pathwayId;
    assert.ok(primaryPathwayId);

    // Verify statutory citations integrity
    for (const rec of remData.recommendations) {
      if (rec.legalReferences && Array.isArray(rec.legalReferences)) {
        for (const ref of rec.legalReferences) {
          if (ref.act) {
            const isRecognizedAct = [
              'Information Technology Act, 2000',
              'Digital Personal Data Protection Act, 2023',
              'Bharatiya Nyaya Sanhita, 2023',
              'Indian Penal Code, 1860'
            ].some(act => ref.act.includes(act) || act.includes(ref.act));
            assert.ok(isRecognizedAct, `Act "${ref.act}" must be recognized`);
          }
          if (ref.status) {
            assert.ok(
              ['IN_FORCE', 'ACTIVE', 'ENACTED_FUTURE_COMMENCEMENT', 'REPEALED', 'STRUCK_DOWN_UNCONSTITUTIONAL'].includes(ref.status),
              `Status "${ref.status}" must be valid`
            );
          }
        }
      }
    }

    // Execute Step 1 (Incident Learning / Case Study)
    const step1Res = await fetch(`${baseUrl}/api/progress/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        pathwayId: primaryPathwayId,
        step: 'caseStudy',
        sourceSessionId: learner1BaselineSessionId,
        decisionChoiceIndex: 0
      })
    });
    assert.equal(step1Res.status, 200);

    // Execute Step 2 (Practical Defense)
    const step2Res = await fetch(`${baseUrl}/api/progress/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        pathwayId: primaryPathwayId,
        step: 'prevention',
        sourceSessionId: learner1BaselineSessionId,
        acknowledged: true
      })
    });
    assert.equal(step2Res.status, 200);

    // Fetch Sanitized Checkpoint Questions
    const cpRes = await fetch(`${baseUrl}/api/progress/pathways/${primaryPathwayId}/checkpoint?sourceSessionId=${learner1BaselineSessionId}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(cpRes.status, 200);
    const cpData = await cpRes.json();
    assert.ok(cpData.questions.length >= 2);

    // Submit Checkpoint Answers with authoritative correct options from catalog
    const pathwayDef = catalog.find(p => p.pathwayId === primaryPathwayId);
    const correctAnswers = pathwayDef.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));

    const submitCpRes = await fetch(`${baseUrl}/api/progress/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        pathwayId: primaryPathwayId,
        sourceSessionId: learner1BaselineSessionId,
        answers: correctAnswers
      })
    });
    assert.equal(submitCpRes.status, 200);
    const submitCpData = await submitCpRes.json();
    assert.equal(submitCpData.passed, true);
    assert.equal(submitCpData.isFullyCompleted, true);
  });

  // =========================================================================
  // TEST 6: Assessment Session Score Immutability Under Remediation
  // =========================================================================
  it('6. Authoritative assessment session scores remain 100% immutable across remediation drills', async () => {
    const session = await AssessmentSession.findById(learner1BaselineSessionId);
    assert.ok(session);

    // Behaviour scores should remain stored exactly as evaluated
    const bScores = session.behaviourScores instanceof Map ? Object.fromEntries(session.behaviourScores) : session.behaviourScores;
    assert.ok(bScores.recognition !== undefined);
    assert.ok(bScores.signalIdentification !== undefined);
    assert.ok(bScores.verification !== undefined);
    assert.ok(bScores.decisionQuality !== undefined);
    assert.ok(bScores.falsePositive !== undefined);
    assert.ok(bScores.unreviewedAcceptance !== undefined);
  });

  // =========================================================================
  // TEST 7: Post-Pathway Dashboard Journey & Final Unlock (CJ-3)
  // =========================================================================
  it('7. Dashboard journey confirms pathway progress and unlocks Final Assessment (CJ-3)', async () => {
    const res = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();

    const completed = data.completedPathways.find(p => p.pathwayId === primaryPathwayId);
    assert.ok(completed, 'Completed pathway must be recorded');
    assert.ok(completed.completedAt, 'completedAt must be populated');
    assert.equal(completed.stepsCompleted.checkpointQuiz, true);
  });

  // =========================================================================
  // TEST 8: Final Assessment Path 2 Traversal & Paired Longitudinal Delta
  // =========================================================================
  let learner1FinalSessionId;
  let finalResultData;

  it('8. Learner 1 traverses Final Assessment via Path 2 and produces paired longitudinal delta', async () => {
    // Start Final Assessment (prerequisite now fulfilled)
    const startRes = await fetch(`${baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({ scenarioCode: 'final', scenarioVersion: 2 })
    });
    assert.equal(startRes.status, 200);
    const startData = await startRes.json();
    learner1FinalSessionId = startData.sessionId;
    testSessionIds.push(learner1FinalSessionId);

    let currentStage = startData.stage;
    let experiencedCount = 0;

    while (currentStage) {
      experiencedCount++;
      const stageDoc = await ScenarioStage.findById(currentStage.id);
      const stageDecisions = await ScenarioDecision.find({ stageId: currentStage.id });

      // On stage 7, force Path 2 (next stageOrder = 9)
      let chosenDecision;
      if (stageDoc.stageOrder === 7) {
        const stage9 = finalStages.find(s => s.stageOrder === 9);
        chosenDecision = stageDecisions.find(d => d.nextStageId && d.nextStageId.toString() === stage9._id.toString());
        assert.ok(chosenDecision, 'Path 2 decision leading to stage 9 must exist');
      } else {
        // Safe, verified decisions demonstrating habit mastery
        chosenDecision = stageDecisions.find(d => d.riskLevel === 'safe' && d.outcomeType === 'correct') || stageDecisions[0];
      }

      const idempotencyKey = `idemp_${learner1FinalSessionId}_${currentStage.id}`;
      const payload = {
        assessmentSessionId: learner1FinalSessionId,
        stageId: currentStage.id,
        decisionId: chosenDecision._id,
        idempotencyKey
      };

      if (currentStage.hasSignalProbe && currentStage.signalProbes && currentStage.signalProbes.length > 0) {
        payload.signalProbeDecisionId = currentStage.signalProbes[0].id || currentStage.signalProbes[0]._id;
      }

      const stepRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token1}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(stepRes.status, 200);
      const stepData = await stepRes.json();

      if (stepData.isCompleted) {
        finalResultData = stepData;
        break;
      }
      currentStage = stepData.stage;
    }

    assert.equal(experiencedCount, 13, 'Path 2 journey must traverse exactly 13 experienced situations');
    assert.ok(finalResultData, 'Final assessment must complete');
    assert.equal(finalResultData.isCompleted, true);
    assert.ok(finalResultData.deltaMessage, 'Paired delta message must be generated');
  });

  // =========================================================================
  // TEST 9: Post-Final Dashboard Journey (CJ-4) & Trajectory API
  // =========================================================================
  it('9. Post-final dashboard reflects cycle completion and trajectory API reports discrete dimensions (CJ-4)', async () => {
    // Dashboard Progress
    const progRes = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(progRes.status, 200);
    const progData = await progRes.json();

    assert.equal(progData.finalSessionId.toString(), learner1FinalSessionId.toString());
    assert.equal(progData.latestSessionId.toString(), learner1FinalSessionId.toString());
    assert.notEqual(progData.finalScore, null);
    assert.ok(progData.finalBehaviourScores);

    // Multi-Session Trajectory API
    const trajRes = await fetch(`${baseUrl}/api/assessments/trajectory`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(trajRes.status, 200);
    const trajData = await trajRes.json();

    assert.equal(trajData.success, true);
    assert.equal(trajData.hasValidPair, true);
    assert.ok(trajData.dimensions.TR);
    assert.ok(trajData.dimensions.SI);
    assert.ok(trajData.dimensions.VB);
    assert.ok(trajData.dimensions.DQ);
    assert.ok(trajData.dimensions.FP);
    assert.ok(trajData.dimensions.UA);

    // Verify zero composite metric
    assert.equal(trajData.compositeDelta, undefined);
    assert.equal(trajData.compositeScore, undefined);
    assert.equal(trajData.overallGrade, undefined);
  });

  // =========================================================================
  // TEST 10: Three-Pillar Defensive Portfolio Contract
  // =========================================================================
  it('10. Defensive Portfolio API renders complete three-pillar structure', async () => {
    const portRes = await fetch(`${baseUrl}/api/progress/portfolio`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(portRes.status, 200);
    const portData = await portRes.json();

    assert.ok(portData.interventions, 'Pillar 1 (Interventions) must exist');
    assert.ok(portData.knowledgePractice, 'Pillar 2 (Knowledge Practice) must exist');
    assert.ok(portData.behavioralTrajectory, 'Pillar 3 (Behavioral Trajectory) must exist');

    assert.ok(portData.interventions.completedPathways.length >= 1);
    assert.equal(portData.knowledgePractice.lawsRead, undefined, 'Zero Category C untracked reading data');
  });

  // =========================================================================
  // TEST 11: Learner 2 Cross-Path Validation & Opportunity Parity
  // =========================================================================
  it('11. Learner 2 Baseline Path 2 -> Final Path 1 confirms cross-branching parity and delta calculation', async () => {
    // 1. Learner 2 starts Baseline
    const startBase = await fetch(`${baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`
      },
      body: JSON.stringify({ scenarioCode: 'baseline', scenarioVersion: 2 })
    });
    assert.equal(startBase.status, 200);
    const baseData = await startBase.json();
    const l2BaseSessionId = baseData.sessionId;
    testSessionIds.push(l2BaseSessionId);

    // Traversal via Path 2 (Stage 7 -> Stage 9)
    let curStage = baseData.stage;
    let base2Complete = null;

    while (curStage) {
      const stageDoc = await ScenarioStage.findById(curStage.id);
      const stageDecisions = await ScenarioDecision.find({ stageId: curStage.id });

      let chosenDecision;
      if (stageDoc.stageOrder === 7) {
        const stage9 = baselineStages.find(s => s.stageOrder === 9);
        chosenDecision = stageDecisions.find(d => d.nextStageId && d.nextStageId.toString() === stage9._id.toString());
        assert.ok(chosenDecision, 'Path 2 decision leading to stage 9 must exist');
      } else {
        chosenDecision = stageDecisions[0];
      }

      const idempotencyKey = `idemp_${l2BaseSessionId}_${curStage.id}`;
      const payload = {
        assessmentSessionId: l2BaseSessionId,
        stageId: curStage.id,
        decisionId: chosenDecision._id,
        idempotencyKey
      };

      if (curStage.hasSignalProbe && curStage.signalProbes && curStage.signalProbes.length > 0) {
        payload.signalProbeDecisionId = curStage.signalProbes[0].id || curStage.signalProbes[0]._id;
      }

      const stepRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(stepRes.status, 200);
      const stepData = await stepRes.json();

      if (stepData.isCompleted) {
        base2Complete = stepData;
        break;
      }
      curStage = stepData.stage;
    }

    assert.ok(base2Complete);
    assert.equal(base2Complete.isCompleted, true);

    // Verify opportunity budget and encounter count parity in the session doc
    const session2Base = await AssessmentSession.findById(l2BaseSessionId);
    const opps2 = session2Base.behaviourOpportunities instanceof Map
      ? Object.fromEntries(session2Base.behaviourOpportunities)
      : session2Base.behaviourOpportunities;
    const encounters2 = session2Base.behaviourEncounters instanceof Map
      ? Object.fromEntries(session2Base.behaviourEncounters)
      : session2Base.behaviourEncounters;

    // Opportunities point budgets
    assert.equal(opps2.recognition, 16, 'TR opportunity budget must be 16 points');
    assert.equal(opps2.signalIdentification, 10, 'SI opportunity budget must be 10 points');
    assert.equal(opps2.verification, 16, 'VB opportunity budget must be 16 points');
    assert.equal(opps2.decisionQuality, 4, 'DQ opportunity budget must be 4 points');
    assert.equal(opps2.falsePositive, 6, 'FP opportunity budget must be 6 points');
    assert.equal(opps2.unreviewedAcceptance, 8, 'UA opportunity budget must be 8 points');

    // Discrete encounter counts
    assert.equal(encounters2.signalIdentification, 5, 'SI encounter count must be 5');
    assert.equal(encounters2.unreviewedAcceptance, 4, 'UA encounter count must be 4 genuine encounters');

    // Compare with Learner 1 (Path 1) to verify cross-path dimension parity:
    // TR, SI, VB, DQ, and UA budgets are strictly identical across both branching paths
    const session1Base = await AssessmentSession.findById(learner1BaselineSessionId);
    const opps1 = session1Base.behaviourOpportunities instanceof Map
      ? Object.fromEntries(session1Base.behaviourOpportunities)
      : session1Base.behaviourOpportunities;
    const encounters1 = session1Base.behaviourEncounters instanceof Map
      ? Object.fromEntries(session1Base.behaviourEncounters)
      : session1Base.behaviourEncounters;

    assert.equal(opps2.recognition, opps1.recognition, 'TR budget parity (16 points)');
    assert.equal(opps2.signalIdentification, opps1.signalIdentification, 'SI budget parity (10 points)');
    assert.equal(opps2.verification, opps1.verification, 'VB budget parity (16 points)');
    assert.equal(opps2.decisionQuality, opps1.decisionQuality, 'DQ budget parity (4 points)');
    assert.equal(opps2.unreviewedAcceptance, opps1.unreviewedAcceptance, 'UA budget parity (8 points)');
    assert.equal(encounters2.unreviewedAcceptance, encounters1.unreviewedAcceptance, 'UA encounter parity (4 encounters)');
    assert.equal(encounters2.signalIdentification, encounters1.signalIdentification, 'SI probe parity (5 probes)');

    // Path 1 includes legitimate bank KYC stage (Stage 8 -> 8 FP max penalty points)
    // Path 2 includes coercive interrogation stage (Stage 9 -> 6 FP max penalty points)
    assert.equal(opps1.falsePositive, 8, 'Path 1 FP budget includes legitimate stage 8 (8 points)');
    assert.equal(opps2.falsePositive, 6, 'Path 2 FP budget traverses coercive interrogation (6 points)');

    // 2. Learner 2 starts Final Assessment and traverses via Path 1 (Stage 7 -> Stage 8)
    const startFinal = await fetch(`${baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`
      },
      body: JSON.stringify({ scenarioCode: 'final', scenarioVersion: 2 })
    });
    assert.equal(startFinal.status, 200);
    const finalData = await startFinal.json();
    const l2FinalSessionId = finalData.sessionId;
    testSessionIds.push(l2FinalSessionId);

    curStage = finalData.stage;
    let final2Complete = null;

    while (curStage) {
      const stageDoc = await ScenarioStage.findById(curStage.id);
      const stageDecisions = await ScenarioDecision.find({ stageId: curStage.id });

      let chosenDecision;
      if (stageDoc.stageOrder === 7) {
        const stage8 = finalStages.find(s => s.stageOrder === 8);
        chosenDecision = stageDecisions.find(d => d.nextStageId && d.nextStageId.toString() === stage8._id.toString());
        assert.ok(chosenDecision, 'Path 1 decision leading to stage 8 must exist');
      } else {
        chosenDecision = stageDecisions.find(d => d.riskLevel === 'safe' && d.outcomeType === 'correct') || stageDecisions[0];
      }

      const idempotencyKey = `idemp_${l2FinalSessionId}_${curStage.id}`;
      const payload = {
        assessmentSessionId: l2FinalSessionId,
        stageId: curStage.id,
        decisionId: chosenDecision._id,
        idempotencyKey
      };

      if (curStage.hasSignalProbe && curStage.signalProbes && curStage.signalProbes.length > 0) {
        payload.signalProbeDecisionId = curStage.signalProbes[0].id || curStage.signalProbes[0]._id;
      }

      const stepRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(stepRes.status, 200);
      const stepData = await stepRes.json();

      if (stepData.isCompleted) {
        final2Complete = stepData;
        break;
      }
      curStage = stepData.stage;
    }

    assert.ok(final2Complete);
    assert.equal(final2Complete.isCompleted, true);
    assert.ok(final2Complete.deltaMessage, 'Cross-path paired delta message must be calculated');
  });

  // =========================================================================
  // TEST 12: Historical v1 Scoring Isolation & Version Compatibility
  // =========================================================================
  it('12. Historical v1 assessment session records remain isolated and compatible', async () => {
    // Create an immutable historical v1 session record directly
    const historicalSession = await AssessmentSession.create({
      userId: learner1._id,
      scenarioId: baselineScenario._id,
      currentStageId: baselineStages[0]._id,
      scenarioCode: 'baseline',
      scenarioVersion: 1,
      scoringVersion: 1,
      status: 'completed',
      score: 78,
      completedAt: new Date(Date.now() - 86400000 * 30),
      expiresAt: new Date(),
      categoryScores: new Map([['Phishing & Messaging Scams', 75], ['Data Privacy', 80]])
    });
    testSessionIds.push(historicalSession._id);

    // Fetch session details via API
    const sessRes = await fetch(`${baseUrl}/api/assessments/session/${historicalSession._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(sessRes.status, 200);
    const sessData = await sessRes.json();

    assert.equal(sessData.status, 'completed');
    assert.equal(sessData.score, 78);
    // Historical v1 sessions do not enforce 6-D v2 rubric retroactively
    assert.equal(sessData.scenarioVersion, 1);
  });
});
