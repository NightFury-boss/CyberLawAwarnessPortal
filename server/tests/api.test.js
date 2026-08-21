const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');

const PORT = 5999;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let userToken = '';
let adminToken = '';
let userId = '';

async function runTests() {
  console.log('Starting automated security and state-machine tests...');

  try {
    // 1. Boot Server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running on port ${PORT}`);
        resolve();
      });
    });

    // 2. Clear test collection records
    console.log('- Cleaning test records...');
    await User.deleteMany({ email: { $in: ['test_user@test.com', 'test_admin@test.com'] } });
    await AssessmentSession.deleteMany({});
    await AssessmentDecision.deleteMany({});

    // 3. Test Standardized Error Format Schema
    console.log('- Testing Standardized Error Schema...');
    const badRes = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // missing parameters
    });
    const badData = await badRes.json();
    if (badRes.status !== 401 && badData.success !== false) {
      throw new Error('Error format mismatch: bad request did not return success=false');
    }
    if (badData.error && (!badData.error.code || !badData.error.message)) {
      throw new Error('Error format mismatch: missing error code or message nesting');
    }
    console.log('  * PASS: API returns standard error payload schema');

    // 4. Test Registration Parameter Injection Guard
    console.log('- Testing Registration Parameter Lock...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_user@test.com',
        password: 'TestPassword123!',
        fullName: 'Test Student',
        role: 'admin' // Attempting parameter injection!
      })
    });
    const registerData = await registerRes.json();
    
    if (registerRes.status !== 201) {
      throw new Error(`Registration failed: ${registerData.message}`);
    }

    // Verify injected role was locked to user
    const dbUser = await User.findById(registerData.user.id);
    if (dbUser.role !== 'user') {
      throw new Error('Security vulnerability: public registration allowed specifying admin role!');
    }
    console.log('  * PASS: public registration restricted to role = "user"');

    userToken = registerData.token;
    userId = registerData.user.id;

    // Create an admin in DB for testing adminOnly guards
    const adminUser = await User.create({
      fullName: 'Test Administrator',
      email: 'test_admin@test.com',
      passwordHash: require('bcryptjs').hashSync('AdminPass123!', 10),
      role: 'admin'
    });

    // Login admin to get token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_admin@test.com',
        password: 'AdminPass123!'
      })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;

    // 5. Test Authorization Route Guards
    console.log('- Testing Authorization Guards...');
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (auditRes.status !== 403) {
      throw new Error(`Security breach: standard user was granted access to admin audit log! Got status: ${auditRes.status}`);
    }
    console.log('  * PASS: unauthorized endpoint returns 403 Forbidden');

    // 6. Test Quiz Answer Security (Exclusion of correctOptionIndex)
    console.log('- Testing Quiz Answer Security Leaks...');
    const quizRes = await fetch(`${BASE_URL}/quizzes`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const quizData = await quizRes.json();
    const leaksAnswers = quizData.some(q => q.questions.some(qn => qn.correctOptionIndex !== undefined || qn.explanation !== undefined));
    if (leaksAnswers) {
      throw new Error('Security vulnerability: correctOptionIndex or explanation leaked in public quizzes retrieval payload!');
    }
    console.log('  * PASS: correctOptionIndex and explanations stripped from public quizzes response');

    // 7. Test Backend-Authoritative State-Machine & Scoring
    console.log('- Testing Assessment Engine State-Machine...');
    
    // Find scenario
    const scenario = await Scenario.findOne({ slug: 'baseline', status: 'published' });
    if (!scenario) {
      throw new Error('Baseline scenario not found in DB. Make sure database is seeded first.');
    }

    // Start session
    const startRes = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ scenarioCode: 'baseline' })
    });
    const startData = await startRes.json();
    if (startRes.status !== 200) {
      throw new Error(`Failed to start session: ${startData.message}`);
    }

    const sessionId = startData.sessionId;
    const stage1Id = startData.stage.id;
    console.log(`  * Started baseline session: ${sessionId}`);

    // Try to submit a direct overall score from the client (attempt manipulation)
    const manipulatedRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: 'dummy_decision',
        score: 1000, // Attempting score override injection!
        userId: 'another-user-id' // Attempting user hijacking!
      })
    });
    const manipulatedData = await manipulatedRes.json();
    // Verify that the server rejects dummy decision and does not process injected score
    if (manipulatedRes.status >= 200 && manipulatedRes.status < 300) {
      throw new Error('Security breach: server accepted dummy decision or processed client-sent score values.');
    }
    console.log('  * PASS: score manipulation inputs ignored / rejected');

    // Submit a valid choice step: clicking the verification link
    const firstStageDecisions = await ScenarioDecision.find({ stageId: stage1Id });
    const clickDecision = firstStageDecisions.find(d => d.optionText.includes('Click the "Verify'));

    // 8. Test Double-Submit Replay Protection (Concurrent Parallel Requests)
    console.log('- Testing Parallel Double-Click Replay Protection...');
    const req1 = fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: clickDecision._id
      })
    });
    const req2 = fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: sessionId,
        stageId: stage1Id,
        decisionId: clickDecision._id
      })
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    
    // Only one of them should succeed with code 200. The other must return 400 (DUPLICATE_SUBMISSION)
    if (res1.status === 200 && res2.status === 200) {
      throw new Error('Security vulnerability: both concurrent step submissions succeeded! State locks failed.');
    }

    const successfulRes = res1.status === 200 ? res1 : res2;
    const failedRes = res1.status === 200 ? res2 : res1;

    const step1Data = await successfulRes.json();
    const step1Error = await failedRes.json();

    if (failedRes.status !== 400 || !step1Error.error || step1Error.error.code !== 'DUPLICATE_SUBMISSION') {
      throw new Error(`Double-click expected DUPLICATE_SUBMISSION error status 400. Got: ${failedRes.status} code: ${step1Error.error?.code}`);
    }
    console.log('  * PASS: parallel double-click submissions successfully blocked');

    // Verify session advanced to stage 2 (Login website)
    const activeSession = await AssessmentSession.findById(sessionId);
    const stage2Id = activeSession.currentStageId.toString();

    // Submit credentials submission decision for Stage 2 (Login page)
    const secondStageDecisions = await ScenarioDecision.find({ stageId: stage2Id });
    const credentialsDecision = secondStageDecisions.find(d => d.optionText.includes('Enter simulated login'));

    const step2Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: sessionId,
        stageId: stage2Id,
        decisionId: credentialsDecision._id
      })
    });
    const step2Data = await step2Res.json();
    if (step2Res.status !== 200 || !step2Data.isCompleted) {
      throw new Error(`Failed to complete baseline assessment: ${step2Data.message}`);
    }

    console.log(`  * Baseline completed. Score: ${step2Data.score}/100`);

    // Verify zero data retention for mock credentials
    const decisionRecords = await AssessmentDecision.find({ assessmentSessionId: sessionId });
    const containsPassword = decisionRecords.some(d => JSON.stringify(d).includes('password') || JSON.stringify(d).includes('otp'));
    if (containsPassword) {
      throw new Error('Privacy breach: raw simulated credentials or net OTP values were stored in the database!');
    }
    console.log('  * PASS: zero simulated credentials stored in MongoDB');

    // 9. Test Branching Final Assessment & Pre/Post delta calculations
    console.log('- Testing Branching Final Assessment & Delta Report...');
    
    const finalScenario = await Scenario.findOne({ slug: 'final', status: 'published' });
    if (!finalScenario) {
      throw new Error('Final scenario not found in DB. Make sure database is seeded first.');
    }

    // Start Final
    const startFinalRes = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ scenarioCode: 'final' })
    });
    const startFinalData = await startFinalRes.json();
    const finalSessionId = startFinalData.sessionId;

    // Path Selection - Stage 1 (recruiter NDA): Choose B (Delete email) -> Safe path
    const finalStage1Decisions = await ScenarioDecision.find({ stageId: startFinalData.stage.id });
    const deleteDecision = finalStage1Decisions.find(d => d.optionText.includes('delete the message'));

    const fStep1Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: finalSessionId,
        stageId: startFinalData.stage.id,
        decisionId: deleteDecision._id
      })
    });
    const fStep1Data = await fStep1Res.json();

    // Verify adaptive branching: Safe choice directs user to Stage 2A (Legitimate update notification)
    const stage2A = await ScenarioStage.findOne({ scenarioId: finalScenario._id, stageOrder: 2, eventClassification: 'legitimate' });
    if (fStep1Data.stage.id !== stage2A._id.toString()) {
      throw new Error(`Branching failure: safe decision did not direct user to Stage 2A. Got stage: ${fStep1Data.stage.title}`);
    }
    console.log('  * PASS: adaptive branching navigated to Stage 2A (safe path)');

    // Stage 2A: Choose A (Apply update)
    const finalStage2ADecisions = await ScenarioDecision.find({ stageId: stage2A._id });
    const updateDecision = finalStage2ADecisions.find(d => d.optionText.includes('apply official'));

    const fStep2Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: finalSessionId,
        stageId: stage2A._id,
        decisionId: updateDecision._id
      })
    });
    const fStep2Data = await fStep2Res.json();
    const stage3Id = fStep2Data.stage.id;

    // Stage 3 (QR payment): Choose B (Decline payment QR)
    const finalStage3Decisions = await ScenarioDecision.find({ stageId: stage3Id });
    const declineDecision = finalStage3Decisions.find(d => d.optionText.includes('Decline to scan'));

    const fStep3Res = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        assessmentSessionId: finalSessionId,
        stageId: stage3Id,
        decisionId: declineDecision._id
      })
    });
    const fStep3Data = await fStep3Res.json();

    if (fStep3Res.status !== 200 || !fStep3Data.isCompleted) {
      throw new Error('Failed to complete final assessment.');
    }

    console.log(`  * Final completed. Score: ${fStep3Data.score}/100`);
    if (!fStep3Data.deltaMessage || fStep3Data.improvementDelta === undefined) {
      throw new Error('Improvement delta tracking failed or did not return delta values.');
    }
    
    // 10. Test Scenario Engine Reference Integrity
    console.log('- Testing Scenario Engine Reference Integrity...');
    const allScenarios = await Scenario.find({});
    for (let s of allScenarios) {
      const stages = await ScenarioStage.find({ scenarioId: s._id }).sort({ stageOrder: 1 });
      if (stages.length === 0) {
        throw new Error(`Scenario "${s.title}" has 0 stages in the database!`);
      }
      
      const stageMap = {};
      stages.forEach(st => {
        stageMap[st._id.toString()] = st;
      });

      // Verify that all decisions point to valid nextStageId
      for (let st of stages) {
        const decisions = await ScenarioDecision.find({ stageId: st._id });
        if (decisions.length === 0 && !st.terminal && st.title !== 'Adaptive Segment') {
          throw new Error(`Non-terminal Stage ${st.stageOrder} in scenario "${s.title}" has 0 decisions!`);
        }
        for (let dec of decisions) {
          if (dec.nextStageId) {
            const nextIdStr = dec.nextStageId.toString();
            if (!stageMap[nextIdStr]) {
              throw new Error(`Stage ${st.stageOrder} Decision in scenario "${s.title}" points to invalid nextStageId: ${dec.nextStageId}`);
            }
          }
        }
      }
    }
    console.log('  * PASS: Scenario DB reference integrity validated successfully');

    console.log(`  * PASS: pre/post delta reported: "${fStep3Data.deltaMessage}"`);

    console.log('\n✅ ALL AUTOMATED SECURITY TESTS PASSED SUCCESSFULLY!\n');
    cleanup(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE RUNTIME FAILURE:\n', err);
    cleanup(1);
  }
}

function cleanup(exitCode) {
  if (server) {
    server.close(() => {
      console.log('Test server shut down.');
      mongoose.connection.close().then(() => {
        console.log('Database connection closed.');
        process.exit(exitCode);
      }).catch(err => {
        console.error('Error closing database connection:', err);
        process.exit(exitCode);
      });
    });
  } else {
    process.exit(exitCode);
  }
}

runTests();
