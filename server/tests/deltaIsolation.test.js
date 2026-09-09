const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { calculateScores } = require('../services/assessmentScoringService');

const simulationRoutes = require('../routes/simulations');

const jwt = require('jsonwebtoken');

async function testDeltaIsolation() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for Delta Version-Isolation Test.\n');

  // Set up express server
  const app = express();
  app.use(express.json());
  app.use('/api/simulation', simulationRoutes);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5997, resolve));
  console.log('[Test Server] Listening on port 5997');

  const testUser = await User.findOne({ email: 'test_delta_isolation@test.com' }) ||
    await User.create({
      fullName: 'Delta Isolation Test User',
      email: 'test_delta_isolation@test.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'user'
    });

  const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Clean previous test data
  const oldSessions = await AssessmentSession.find({ userId: testUser._id });
  for (const s of oldSessions) {
    await AssessmentDecision.deleteMany({ assessmentSessionId: s._id });
  }
  await AssessmentSession.deleteMany({ userId: testUser._id });

  // 1. Create a historical completed Baseline v1 session with score = 30
  const v1BaselineScenario = await Scenario.findOne({ slug: 'baseline', version: 1 });
  if (!v1BaselineScenario) throw new Error('v1 Baseline scenario not found in DB!');
  const v1Stage = await ScenarioStage.findOne({ scenarioId: v1BaselineScenario._id });

  const v1BaselineSession = await AssessmentSession.create({
    userId: testUser._id,
    scenarioId: v1BaselineScenario._id,
    scenarioCode: 'baseline',
    scenarioVersion: 1,
    currentStageId: v1Stage._id,
    status: 'completed',
    score: 30,
    expiresAt: new Date(Date.now() + 3600000),
    completedAt: new Date(Date.now() - 3600000)
  });
  console.log(`[Setup] Created historical v1 Baseline session: ${v1BaselineSession._id} (Score: 30)`);

  // 2. Start a Final v2 session
  const startRes = await fetch('http://localhost:5997/api/simulation/start', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ scenarioCode: 'final', scenarioVersion: 2 })
  });
  const startData = await startRes.json();
  if (!startData.sessionId) throw new Error(`Failed to start final v2 session: ${JSON.stringify(startData)}`);
  console.log(`[Test] Started v2 Final session: ${startData.sessionId}`);

  // Fast-complete the v2 Final session
  const finalV2Session = await AssessmentSession.findById(startData.sessionId);
  const stages = await ScenarioStage.find({ scenarioId: finalV2Session.scenarioId }).sort({ stageOrder: 1 });
  
  // Submit decisions through stage 13
  let lastSubmitData = null;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const decisions = await ScenarioDecision.find({ stageId: stage._id });
    const decision = decisions[0]; // pick first option

    const submitRes = await fetch('http://localhost:5997/api/simulation/submit-step', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assessmentSessionId: finalV2Session._id,
        stageId: stage._id,
        decisionId: decision._id
      })
    });
    lastSubmitData = await submitRes.json();
    if (lastSubmitData.isCompleted) break;
  }

  // Verify that because the user ONLY has a v1 Baseline, the v2 Final did NOT mix with v1 Baseline!
  console.log(`[Assertion 1] Final v2 completion delta message: "${lastSubmitData.deltaMessage}"`);
  console.log(`[Assertion 1] Improvement delta: ${lastSubmitData.improvementDelta}`);

  if (lastSubmitData.deltaMessage !== null || lastSubmitData.improvementDelta !== 0) {
    throw new Error('FAIL: v2 Final session incorrectly mixed with v1 Baseline session!');
  }
  console.log('  * PASS: v2 Final did NOT mix with historical v1 Baseline session!');

  // 3. Now create a v2 Baseline session with authoritative behavioural scores
  const v2BaselineScenario = await Scenario.findOne({ slug: 'baseline', version: 2 });
  const v2Stage = await ScenarioStage.findOne({ scenarioId: v2BaselineScenario._id });
  const baselineBehaviourScores = {
    recognition: 50,
    signalIdentification: 40,
    verification: 60,
    decisionQuality: 55,
    falsePositive: 75,
    unreviewedAcceptance: 80
  };

  const v2BaselineSession = await AssessmentSession.create({
    userId: testUser._id,
    scenarioId: v2BaselineScenario._id,
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    currentStageId: v2Stage._id,
    status: 'completed',
    score: 60,
    behaviourScores: baselineBehaviourScores,
    expiresAt: new Date(Date.now() + 3600000),
    completedAt: new Date(Date.now() - 1800000)
  });
  console.log(`\n[Setup] Created v2 Baseline session: ${v2BaselineSession._id} with 6-metric behavioral profile`);

  // 4. Start another Final v2 session and complete it
  const startRes2 = await fetch('http://localhost:5997/api/simulation/start', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ scenarioCode: 'final', scenarioVersion: 2 })
  });
  const startData2 = await startRes2.json();
  const finalV2Session2 = await AssessmentSession.findById(startData2.sessionId);

  let lastSubmitData2 = null;
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const decisions = await ScenarioDecision.find({ stageId: stage._id });
    const decision = decisions[0];

    const submitRes = await fetch('http://localhost:5997/api/simulation/submit-step', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assessmentSessionId: finalV2Session2._id,
        stageId: stage._id,
        decisionId: decision._id
      })
    });
    lastSubmitData2 = await submitRes.json();
    if (lastSubmitData2.isCompleted) break;
  }

  console.log(`[Assertion 2] Final v2 completion delta message: "${lastSubmitData2.deltaMessage}"`);
  console.log(`[Assertion 2] Behaviour delta:`, lastSubmitData2.behaviourDelta);

  if (!lastSubmitData2.behaviourDelta) {
    throw new Error('FAIL: Expected behaviourDelta to be populated for v2 baseline/final comparison!');
  }

  // Verify each of the 6 behavioral dimensions is correctly compared:
  for (const metric of ['recognition', 'signalIdentification', 'verification', 'decisionQuality', 'falsePositive', 'unreviewedAcceptance']) {
    const expectedBase = baselineBehaviourScores[metric];
    const actualFinal = lastSubmitData2.behaviourScores[metric];
    const expectedDiff = actualFinal - expectedBase;
    const metricDelta = lastSubmitData2.behaviourDelta[metric];

    if (!metricDelta) {
      throw new Error(`FAIL: Missing behaviourDelta for metric ${metric}`);
    }
    if (metricDelta.baseline !== expectedBase) {
      throw new Error(`FAIL: ${metric} baseline expected ${expectedBase}, got ${metricDelta.baseline}`);
    }
    if (metricDelta.final !== actualFinal) {
      throw new Error(`FAIL: ${metric} final expected ${actualFinal}, got ${metricDelta.final}`);
    }
    if (metricDelta.delta !== expectedDiff) {
      throw new Error(`FAIL: ${metric} delta expected ${expectedDiff}, got ${metricDelta.delta}`);
    }
  }
  console.log('  * PASS: v2 Final correctly paired with v2 Baseline across all 6 dimensions (NOT legacy monolithic score)!');

  // 5. Test v1 Historical Backward Compatibility
  const v1FinalScenario = await Scenario.findOne({ slug: 'final', version: 1 });
  let finalV1Session = null;
  if (v1FinalScenario) {
    const v1FinalStage = await ScenarioStage.findOne({ scenarioId: v1FinalScenario._id });
    const v1FinalDecs = await ScenarioDecision.find({ stageId: v1FinalStage._id });

    const startV1Res = await fetch('http://localhost:5997/api/simulation/start', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ scenarioCode: 'final', scenarioVersion: 1 })
    });
    const startV1Data = await startV1Res.json();
    finalV1Session = await AssessmentSession.findById(startV1Data.sessionId);

    const submitV1Res = await fetch('http://localhost:5997/api/simulation/submit-step', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assessmentSessionId: finalV1Session._id,
        stageId: v1FinalStage._id,
        decisionId: v1FinalDecs[0]._id
      })
    });
    const submitV1Data = await submitV1Res.json();

    if (submitV1Data.isCompleted) {
      console.log(`[Assertion 3] v1 historical final delta message: "${submitV1Data.deltaMessage}"`);
      if (!submitV1Data.deltaMessage || !submitV1Data.deltaMessage.includes('30 (Baseline)')) {
        throw new Error(`FAIL: v1 Final did not reference v1 Baseline score of 30: "${submitV1Data.deltaMessage}"`);
      }
      console.log('  * PASS: v1 Final legacy monolithic delta calculation verified with historical v1 Baseline!');
    }
  }

  // Clean up test data
  const sessionIdsToClean = [finalV2Session._id, finalV2Session2._id];
  if (finalV1Session) sessionIdsToClean.push(finalV1Session._id);
  await AssessmentDecision.deleteMany({ assessmentSessionId: { $in: sessionIdsToClean } });
  await AssessmentSession.deleteMany({ userId: testUser._id });
  await User.deleteOne({ _id: testUser._id });

  server.close();
  await mongoose.disconnect();
  console.log('\n✅ ALL DELTA VERSION-ISOLATION TESTS PASSED 100%!');
}

testDeltaIsolation().catch(err => {
  console.error(err);
  process.exit(1);
});
