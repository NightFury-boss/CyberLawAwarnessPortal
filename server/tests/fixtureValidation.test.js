const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../.env') });
const PORT = 5999;
const BASE_URL = `http://localhost:${PORT}/api`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

let server;

// Import Models
const User = require('../models/User');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');

// Import Seeder/Clearer
const seedFixture = require('../config/seedFixture');
const clearFixture = require('../config/clearFixture');

// Audit Trail Array for final table output
const auditTrail = [];

function recordAudit(fixtureName, stageName, decisionName, metric, raw, maxPenalty, expected, actual) {
  const isPass = expected === actual;
  auditTrail.push({
    fixture: fixtureName,
    stage: stageName,
    decision: decisionName,
    metric: metric,
    raw: raw,
    maxPenalty: maxPenalty,
    expected: `${expected}`,
    actual: `${actual}`,
    status: isPass ? 'PASS' : 'FAIL'
  });
  if (!isPass) {
    throw new Error(`Assertion failed: ${fixtureName} - ${metric} metric mismatch! Expected: ${expected}, Got: ${actual}`);
  }
}

async function runTests() {
  try {
    console.log('Starting automated Phase 2.2 controlled fixture validations...');

    // 1. Start Server
    const app = require('../server');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on port ${PORT}`);

    // Connect DB
    await mongoose.connect(MONGODB_URI, { family: 4 });
    console.log('Connected to MongoDB.');

    // Delete existing user if left over
    await User.deleteOne({ email: 'fixture_user@test.com' });

    // Register fresh user
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Fixture User',
        email: 'fixture_user@test.com',
        password: 'password123'
      })
    });
    const regData = await regRes.json();
    if (regRes.status !== 201) {
      throw new Error(`User registration failed: ${JSON.stringify(regData)}`);
    }

    // Login to get token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fixture_user@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const userToken = loginData.token;
    if (!userToken) {
      throw new Error(`User login failed: ${JSON.stringify(loginData)}`);
    }

    // 2. Seed Fixture
    console.log('- Seeding deterministic fixture scenario...');
    await seedFixture(false); // pass false so connection stays active!
    console.log('  * Seed completed.');

    // Find the scenario and stages
    const scenario = await Scenario.findOne({ slug: 'assessment-fixture-v1' });
    if (!scenario) throw new Error('Fixture scenario not found in DB.');

    const stages = await ScenarioStage.find({ scenarioId: scenario._id }).sort({ stageOrder: 1 });
    console.log('Stages found in DB:', stages.map(s => ({ title: s.title, order: s.stageOrder, id: s._id })));

    const decMap = {}; // stageOrder -> decisions array
    for (const stage of stages) {
      decMap[stage.stageOrder] = await ScenarioDecision.find({ stageId: stage._id });
      console.log(`Stage Order ${stage.stageOrder} (${stage.title}) decisions:`, decMap[stage.stageOrder].map(d => ({ text: d.optionText, id: d._id })));
    }

    // -------------------------------------------------------------
    // VALIDATION 1: Contextually Appropriate Flow
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('VALIDATION 1: Contextually Appropriate Flow');
    console.log('=============================================================');

    const startRes = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const startData = await startRes.json();
    const sessionId = startData.sessionId;
    if (!sessionId) {
      console.error('Start session failed response data:', JSON.stringify(startData, null, 2));
      throw new Error('Failed to start session.');
    }

    // --- STAGE 1: Phishing Email (Malicious) ---
    // Opt: Option C (Verify official separately). Focus: TR, SI, VB, DQ.
    const st1OptC = decMap[1].find(d => d.optionText.includes('Open the official service'));
    const step1Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: startData.stage.id, decisionId: st1OptC._id.toString() })
    });
    const step1Data = await step1Res.json();
    
    // Check metric contributions on Stage 1 (TR raw: 1/2, SI raw: 0/2, VB raw: 2/2, DQ raw: 2/2)
    const sessAfterSt1 = await AssessmentSession.findById(sessionId);
    recordAudit('Fixture A', 'Phishing Email', 'Verify separately', 'TR Score', sessAfterSt1.behaviourScores.get('recognition'), null, 50, sessAfterSt1.behaviourScores.get('recognition'));
    recordAudit('Fixture A', 'Phishing Email', 'Verify separately', 'VB Score', sessAfterSt1.behaviourScores.get('verification'), null, 100, sessAfterSt1.behaviourScores.get('verification'));
    recordAudit('Fixture A', 'Phishing Email', 'Verify separately', 'DQ Score', sessAfterSt1.behaviourScores.get('decisionQuality'), null, 100, sessAfterSt1.behaviourScores.get('decisionQuality'));

    // Metric Isolation check on Stage 1 (FP and UA must remain unchanged at default 100%)
    recordAudit('Fixture A', 'Phishing Email', 'Verify separately', 'FP Isolation', sessAfterSt1.behaviourScores.get('falsePositive'), null, 100, sessAfterSt1.behaviourScores.get('falsePositive'));
    recordAudit('Fixture A', 'Phishing Email', 'Verify separately', 'UA Isolation', sessAfterSt1.behaviourScores.get('unreviewedAcceptance'), null, 100, sessAfterSt1.behaviourScores.get('unreviewedAcceptance'));

    // --- STAGE 2: Legitimate Notification ---
    // Opt: Option A (Review normally). Focus: FP, DQ.
    const st2OptA = decMap[2].find(d => d.optionText.includes('Review the notification'));
    const step2Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: step1Data.stage.id, decisionId: st2OptA._id.toString() })
    });
    const step2Data = await step2Res.json();

    // Check FP and DQ contributions (FP penalty: 0/2 => score 100%, DQ raw: 2+2=4 / max: 2+2=4 => score 100%)
    const sessAfterSt2 = await AssessmentSession.findById(sessionId);
    recordAudit('Fixture B', 'Legitimate Notification', 'Review normally', 'FP Score', sessAfterSt2.behaviourScores.get('falsePositive'), null, 100, sessAfterSt2.behaviourScores.get('falsePositive'));
    recordAudit('Fixture B', 'Legitimate Notification', 'Review normally', 'DQ Score', sessAfterSt2.behaviourScores.get('decisionQuality'), null, 100, sessAfterSt2.behaviourScores.get('decisionQuality'));

    // Isolation check on Stage 2 (TR, VB, SI, UA must remain unchanged)
    recordAudit('Fixture B', 'Legitimate Notification', 'Review normally', 'TR Isolation', sessAfterSt2.behaviourScores.get('recognition'), null, 50, sessAfterSt2.behaviourScores.get('recognition'));
    recordAudit('Fixture B', 'Legitimate Notification', 'Review normally', 'VB Isolation', sessAfterSt2.behaviourScores.get('verification'), null, 100, sessAfterSt2.behaviourScores.get('verification'));

    // --- STAGE 3: Ambiguous UPI Payment ---
    // Opt: Option C (Inspect credentials). Focus: TR, VB, DQ.
    const st3OptC = decMap[3].find(d => d.optionText.includes('Inspect the merchant'));
    const step3Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: step2Data.stage.id, decisionId: st3OptC._id.toString() })
    });
    const step3Data = await step3Res.json();

    // Check metrics (TR raw: 1+1=2 / max: 2+1=3 => score 67%, VB raw: 2+2=4 / max: 2+2=4 => score 100%, DQ raw: 2+2=4 / max: 4+2=6 => score 67% => Wait, DQ is 100% since we selected options with 2/2 DQ)
    const sessAfterSt3 = await AssessmentSession.findById(sessionId);
    recordAudit('Fixture C', 'Ambiguous Payment', 'Inspect details', 'TR Score', sessAfterSt3.behaviourScores.get('recognition'), null, 67, sessAfterSt3.behaviourScores.get('recognition'));
    recordAudit('Fixture C', 'Ambiguous Payment', 'Inspect details', 'VB Score', sessAfterSt3.behaviourScores.get('verification'), null, 100, sessAfterSt3.behaviourScores.get('verification'));
    recordAudit('Fixture C', 'Ambiguous Payment', 'Inspect details', 'DQ Score', sessAfterSt3.behaviourScores.get('decisionQuality'), null, 100, sessAfterSt3.behaviourScores.get('decisionQuality'));

    // --- STAGE 4: Unreviewed Permission ---
    // Opt: Option B (Review details). Focus: VB, UA.
    const st4OptB = decMap[4].find(d => d.optionText.includes('Review what permission'));
    const step4Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: step3Data.stage.id, decisionId: st4OptB._id.toString() })
    });
    const step4Data = await step4Res.json();

    // Check UA (penalty: 0/2 => score 100%, VB raw: 4+2=6 / max: 4+2=6 => score 100%)
    const sessAfterSt4 = await AssessmentSession.findById(sessionId);
    recordAudit('Fixture D', 'Unreviewed Permission', 'Review details', 'UA Score', sessAfterSt4.behaviourScores.get('unreviewedAcceptance'), null, 100, sessAfterSt4.behaviourScores.get('unreviewedAcceptance'));
    recordAudit('Fixture D', 'Unreviewed Permission', 'Review details', 'VB Score', sessAfterSt4.behaviourScores.get('verification'), null, 100, sessAfterSt4.behaviourScores.get('verification'));

    // --- STAGE 5: Explicit Signal ID ---
    // Opt: Option C (Unexpected domain and urgency). Focus: SI.
    const st5OptC = decMap[5].find(d => d.optionText.includes('urgency'));
    const step5Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: step4Data.stage.id, decisionId: st5OptC._id.toString() })
    });
    const step5Data = await step5Res.json();

    // Check SI (raw: 2 / max: 2 => score 100%)
    const sessAfterSt5 = await AssessmentSession.findById(sessionId);
    recordAudit('Fixture E', 'Explicit Signal ID', 'Identified signals', 'SI Score', sessAfterSt5.behaviourScores.get('signalIdentification'), null, 50, sessAfterSt5.behaviourScores.get('signalIdentification'));

    // --- STAGE 6: Account Message Branching (Start) ---
    // Opt: Option A (Verify safely). Focus: DQ. Destination: Stage 7A.
    const st6OptA = decMap[6].find(d => d.optionText.includes('Verify account message'));
    const step6Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: step5Data.stage.id, decisionId: st6OptA._id.toString() })
    });
    const step6Data = await step6Res.json();

    // Verify Branch Routing to Stage 7A
    const sessAfterSt6 = await AssessmentSession.findById(sessionId);
    const targetStage7A = stages.find(s => s.stageOrder === 7);
    if (!targetStage7A) {
      console.error('Available stages list:', stages.map(s => ({ title: s.title, order: s.stageOrder })));
      throw new Error('Stage 7A not found in stages array!');
    }
    if (sessAfterSt6.currentStageId.toString() !== targetStage7A._id.toString()) {
      throw new Error(`Branching failure: Option A did not route user to Stage 7A. Got stage: ${step6Data.stage.title}`);
    }
    console.log('  * PASS: Stage 6 branched correctly to Stage 7A (high path).');

    // --- STAGE 7A: Branching Outcome High (Terminal Node) ---
    const st7AOptA = decMap[7].find(d => d.optionText.includes('Proceed normally'));
    if (!st7AOptA) {
      console.error('Stage 7A decisions retrieved:', decMap[7]);
      throw new Error('Option "Proceed normally" not found in stage 7A decisions!');
    }
    const step7Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionId, stageId: targetStage7A._id.toString(), decisionId: st7AOptA._id.toString() })
    });
    const step7Data = await step7Res.json();

    if (!step7Data.isCompleted) throw new Error('Session did not complete on terminal node 7A.');

    // Assert final scores in completed session
    recordAudit('Fixture F', 'High Outcome Terminal', 'Proceed normally', 'Session Completed', step7Data.isCompleted ? 1 : 0, null, 1, step7Data.isCompleted ? 1 : 0);

    // -------------------------------------------------------------
    // VALIDATION 2: Poor-Decision / Over-Reporting Flow
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('VALIDATION 2: Poor-Decision / Over-Reporting Flow');
    console.log('=============================================================');

    const startResBad = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const startDataBad = await startResBad.json();
    const sessionIdBad = startDataBad.sessionId;

    // --- STAGE 1: Phishing Email (Malicious) ---
    // Bad Choice: Option A (Open link blindly).
    const st1OptA = decMap[1].find(d => d.optionText.includes('Open the link immediately'));
    const step1ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: startDataBad.stage.id, decisionId: st1OptA._id.toString() })
    });
    const step1DataBad = await step1ResBad.json();

    const sessBadSt1 = await AssessmentSession.findById(sessionIdBad);
    recordAudit('Fixture A', 'Phishing Email', 'Open blindly', 'TR Score', sessBadSt1.behaviourScores.get('recognition'), null, 0, sessBadSt1.behaviourScores.get('recognition'));
    recordAudit('Fixture A', 'Phishing Email', 'Open blindly', 'DQ Score', sessBadSt1.behaviourScores.get('decisionQuality'), null, 0, sessBadSt1.behaviourScores.get('decisionQuality'));

    // --- STAGE 2: Legitimate Notification ---
    // Bad Choice: Option B (Report as hacking attempt => False Positive).
    const st2OptB = decMap[2].find(d => d.optionText.includes('Report the notification'));
    const step2ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: step1DataBad.stage.id, decisionId: st2OptB._id.toString() })
    });
    const step2DataBad = await step2ResBad.json();

    // Check FP penalty (FP penalty: 2 / max: 2 => score 0%)
    const sessBadSt2 = await AssessmentSession.findById(sessionIdBad);
    recordAudit('Fixture B', 'Legitimate Notification', 'Report hacking', 'FP Score', sessBadSt2.behaviourScores.get('falsePositive'), null, 0, sessBadSt2.behaviourScores.get('falsePositive'));

    // --- STAGE 3: Ambiguous UPI Payment ---
    // Bad Choice: Option A (Approve payment immediately).
    const st3OptA = decMap[3].find(d => d.optionText.includes('Approve the payment'));
    const step3ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: step2DataBad.stage.id, decisionId: st3OptA._id.toString() })
    });
    const step3DataBad = await step3ResBad.json();

    // Check TR and VB (TR: 0 / 3 => 0%, VB: 0 / 4 => 0%, DQ: 0 / 6 => 0%)
    const sessBadSt3 = await AssessmentSession.findById(sessionIdBad);
    recordAudit('Fixture C', 'Ambiguous Payment', 'Approve blindly', 'TR Score', sessBadSt3.behaviourScores.get('recognition'), null, 0, sessBadSt3.behaviourScores.get('recognition'));
    recordAudit('Fixture C', 'Ambiguous Payment', 'Approve blindly', 'VB Score', sessBadSt3.behaviourScores.get('verification'), null, 0, sessBadSt3.behaviourScores.get('verification'));

    // --- STAGE 4: Unreviewed Permission ---
    // Bad Choice: Option A (Allow immediately => Unreviewed Acceptance).
    const st4OptA = decMap[4].find(d => d.optionText.includes('Allow immediately'));
    const step4ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: step3DataBad.stage.id, decisionId: st4OptA._id.toString() })
    });
    const step4DataBad = await step4ResBad.json();

    // Check UA (penalty: 2 / max: 2 => score 0%)
    const sessBadSt4 = await AssessmentSession.findById(sessionIdBad);
    recordAudit('Fixture D', 'Unreviewed Permission', 'Allow blindly', 'UA Score', sessBadSt4.behaviourScores.get('unreviewedAcceptance'), null, 0, sessBadSt4.behaviourScores.get('unreviewedAcceptance'));

    // --- STAGE 5: Explicit Signal ID ---
    // Bad Choice: Option A (Do not interact).
    const st5OptA = decMap[5].find(d => d.optionText.includes('Do not interact'));
    const step5ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: step4DataBad.stage.id, decisionId: st5OptA._id.toString() })
    });
    const step5DataBad = await step5ResBad.json();

    // Check SI (raw: 0 / max: 2 => score 0%)
    const sessBadSt5 = await AssessmentSession.findById(sessionIdBad);
    recordAudit('Fixture E', 'Explicit Signal ID', 'Ignore message', 'SI Score', sessBadSt5.behaviourScores.get('signalIdentification'), null, 0, sessBadSt5.behaviourScores.get('signalIdentification'));

    // --- STAGE 6: Account Message Branching (Start) ---
    // Bad Choice: Option B (Continue blindly). Focus: DQ. Destination: Stage 7B.
    const st6OptB = decMap[6].find(d => d.optionText.includes('Continue immediately'));
    const step6ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: step5DataBad.stage.id, decisionId: st6OptB._id.toString() })
    });
    const step6DataBad = await step6ResBad.json();

    // Verify Branch Routing to Stage 7B
    const sessBadSt6 = await AssessmentSession.findById(sessionIdBad);
    const targetStage7B = stages.find(s => s.stageOrder === 8);
    if (sessBadSt6.currentStageId.toString() !== targetStage7B._id.toString()) {
      throw new Error(`Branching failure: Option B did not route user to Stage 7B. Got stage: ${step6DataBad.stage.title}`);
    }
    console.log('  * PASS: Stage 6 branched correctly to Stage 7B (low path).');

    // --- STAGE 7B: Branching Outcome Low (Terminal Node) ---
    const st7BOptA = decMap[8].find(d => d.optionText.includes('Friction encountered'));
    if (!st7BOptA) {
      console.error('Stage 7B decisions retrieved:', decMap[8]);
      throw new Error('Option "Friction encountered" not found in stage 7B decisions!');
    }
    const step7ResBad = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdBad, stageId: targetStage7B._id.toString(), decisionId: st7BOptA._id.toString() })
    });
    const step7DataBad = await step7ResBad.json();

    if (!step7DataBad.isCompleted) throw new Error('Session did not complete on terminal node 7B.');

    // Assert final scores in completed session (all positive and penalty dimensions should be 0%)
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'Session Completed', step7DataBad.isCompleted ? 1 : 0, null, 1, step7DataBad.isCompleted ? 1 : 0);
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'TR Final Score', step7DataBad.behaviourScores.recognition, null, 0, step7DataBad.behaviourScores.recognition);
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'SI Final Score', step7DataBad.behaviourScores.signalIdentification, null, 0, step7DataBad.behaviourScores.signalIdentification);
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'VB Final Score', step7DataBad.behaviourScores.verification, null, 0, step7DataBad.behaviourScores.verification);
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'DQ Final Score', step7DataBad.behaviourScores.decisionQuality, null, 0, step7DataBad.behaviourScores.decisionQuality);
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'FP Final Score', step7DataBad.behaviourScores.falsePositive, null, 0, step7DataBad.behaviourScores.falsePositive);
    recordAudit('Fixture F', 'Low Outcome Terminal', 'End process', 'UA Final Score', step7DataBad.behaviourScores.unreviewedAcceptance, null, 0, step7DataBad.behaviourScores.unreviewedAcceptance);

    // -------------------------------------------------------------
    // VALIDATION 3: Replay and Sequence State Integrity
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('VALIDATION 3: Replay and Sequence State Integrity');
    console.log('=============================================================');

    const startResState = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const startDataState = await startResState.json();
    const sessionIdState = startDataState.sessionId;

    // We define st1OptB first!
    const st1OptB = decMap[1].find(d => d.optionText.includes('Report the message'));
    if (!st1OptB) {
      throw new Error('Option "Report the message" not found in stage 1 decisions!');
    }

    // 1. Submit duplicate on current stage
    await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdState, stageId: startDataState.stage.id, decisionId: st1OptB._id.toString() })
    });

    const step1DuplicateRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdState, stageId: startDataState.stage.id, decisionId: st1OptB._id.toString() })
    });
    const step1DuplicateData = await step1DuplicateRes.json();
    recordAudit('State Integrity', 'Duplicate Submit', 'Same decision', 'Duplicate Block Status', step1DuplicateRes.status, null, 400, step1DuplicateRes.status);
    console.log('  * PASS: duplicate submission rejected.');

    // 2. Submit decision from another scenario
    const cleanScenario = await Scenario.findOne({ slug: 'baseline' });
    const baselineStages = await ScenarioStage.find({ scenarioId: cleanScenario._id });
    const baselineDecisions = await ScenarioDecision.find({ stageId: baselineStages[0]._id });

    const crossScenarioRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: sessionIdState, stageId: startDataState.stage.id, decisionId: baselineDecisions[0]._id.toString() })
    });
    recordAudit('State Integrity', 'Cross-scenario Submit', 'Foreign decision', 'Rejection Status Code', crossScenarioRes.status, null, 400, crossScenarioRes.status);
    console.log('  * PASS: cross-scenario submission rejected.');

    // -------------------------------------------------------------
    // VALIDATION 4: Client Metric Injection Security
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log('VALIDATION 4: Client Metric Injection Security');
    console.log('=============================================================');

    const startResInject = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const startDataInject = await startResInject.json();
    const sessionIdInject = startDataInject.sessionId;

    // Submit Step 1 attempting to inject high scores
    const injectRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({
        assessmentSessionId: sessionIdInject,
        stageId: startDataInject.stage.id,
        decisionId: st1OptA._id.toString(),
        score: 100,
        behaviourScores: { recognition: 100, verification: 100 },
        behaviourOpportunities: { recognition: 0, verification: 0 },
        falsePositivePenaltyPoints: 0,
        falsePositiveMaxPenaltyPoints: 0,
        eventClassification: 'legitimate'
      })
    });
    const injectData = await injectRes.json();

    // Verify injected scores were completely ignored (TR should be 0%, DQ should be 0%)
    const activeSessionInject = await AssessmentSession.findById(sessionIdInject);
    recordAudit('Injection Security', 'Malicious Phishing', 'Client fabricated inputs', 'TR Score Injection Ignored', activeSessionInject.behaviourScores.get('recognition'), null, 0, activeSessionInject.behaviourScores.get('recognition'));
    recordAudit('Injection Security', 'Malicious Phishing', 'Client fabricated inputs', 'DQ Score Injection Ignored', activeSessionInject.behaviourScores.get('decisionQuality'), null, 0, activeSessionInject.behaviourScores.get('decisionQuality'));
    console.log('  * PASS: client metric injections ignored safely.');

    console.log('\n=============================================================');
    console.log('ALL PHASE 2.2 controlled fixture tests completed successfully.');
    console.log('=============================================================');

  } catch (err) {
    console.error('\n❌ FIXTURE VALIDATION SUITE RUNTIME FAILURE:\n', err);
    process.exitCode = 1;
  } finally {
    // 3. Guaranteed Cleanup in teardown path
    console.log('\n- Executing teardown cleanups for assessment-fixture-v1...');
    try {
      await clearFixture(false); // pass false so connection stays active!
    } catch (clearErr) {
      console.error('Failed to clean up fixture scenario:', clearErr);
    }

    // Cleanup fresh user
    try {
      await User.deleteOne({ email: 'fixture_user@test.com' });
    } catch (uErr) {}

    if (server) {
      server.close(() => {
        console.log('Test server shut down.');
        mongoose.connection.close().then(() => {
          console.log('Database connection closed.');
          printAuditTable();
        });
      });
    } else {
      printAuditTable();
    }
  }
}

function printAuditTable() {
  console.log('\n=============================================================================================================================');
  console.log('| ' + pad('Fixture', 12) + ' | ' + pad('Stage', 25) + ' | ' + pad('Decision', 25) + ' | ' + pad('Metric', 25) + ' | ' + pad('Raw', 5) + ' | ' + pad('Max/Pen', 7) + ' | ' + pad('Expected', 8) + ' | ' + pad('Actual', 8) + ' | ' + pad('PASS/FAIL', 9) + ' |');
  console.log('=============================================================================================================================');
  for (const log of auditTrail) {
    console.log('| ' + pad(log.fixture, 12) + ' | ' + pad(log.stage, 25) + ' | ' + pad(log.decision, 25) + ' | ' + pad(log.metric, 25) + ' | ' + pad(log.raw, 5) + ' | ' + pad(log.maxPenalty || 'N/A', 7) + ' | ' + pad(log.expected, 8) + ' | ' + pad(log.actual, 8) + ' | ' + pad(log.status, 9) + ' |');
  }
  console.log('=============================================================================================================================');
  process.exit(process.exitCode || 0);
}

function pad(str, len) {
  const s = String(str);
  if (s.length >= len) return s.substring(0, len);
  return s + ' '.repeat(len - s.length);
}

runTests();
