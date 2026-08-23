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
      // 11. Test Phase 2.1C Refined Assessment Measurement Model
      console.log('- Testing Phase 2.1C Refined Assessment Measurement Model...');
      
      // Pre-cleanup to prevent duplicate key errors
      await Scenario.deleteOne({ slug: 'measurement-test' });

      // Create isolated test fixture scenario
      const testScenarioP21c = await Scenario.create({
        title: 'Measurement Test Scenario',
        slug: 'measurement-test',
        code: 'measurement-test',
        description: 'Testing 2.1c metrics and normalization',
        version: 1,
        assessmentType: 'practice',
        status: 'published',
        type: 'phishing',
        domain: 'EMAIL',
        difficulty: 'Intermediate',
        configuredWeights: { 'Phishing': 100 }
      });

      const testStage1P21c = await ScenarioStage.create({
        scenarioId: testScenarioP21c._id,
        stageOrder: 1,
        title: 'Test Stage 1 (Malicious)',
        description: 'A phishing email prompt',
        mockInterfaceType: 'email',
        eventClassification: 'malicious',
        measurementFocus: ['THREAT_RECOGNITION', 'DECISION_QUALITY'],
        targetSignals: ['unexpected_domain'],
        terminal: false
      });

      const testStage2P21c = await ScenarioStage.create({
        scenarioId: testScenarioP21c._id,
        stageOrder: 2,
        title: 'Test Stage 2 (Legitimate)',
        description: 'An official update prompt',
        mockInterfaceType: 'notification',
        eventClassification: 'legitimate',
        measurementFocus: ['FALSE_POSITIVE_CONTROL', 'DECISION_QUALITY'],
        targetSignals: [],
        terminal: true
      });

      const t1DecAP21c = await ScenarioDecision.create({
        stageId: testStage1P21c._id,
        optionText: 'Click link blindly',
        scoreChange: -10,
        behaviorEffects: { recognition: 0, decisionQuality: 0 },
        nextStageId: testStage2P21c._id,
        outcomeType: 'incorrect',
        explanation: 'Clicked phishing link'
      });

      const t1DecBP21c = await ScenarioDecision.create({
        stageId: testStage1P21c._id,
        optionText: 'Verify sender domain',
        scoreChange: 10,
        identifiedSignals: ['unexpected_domain'],
        behaviorEffects: { recognition: 2, decisionQuality: 2 },
        nextStageId: testStage2P21c._id,
        outcomeType: 'correct',
        explanation: 'Verified sender domain'
      });

      testStage1P21c.availableDecisionIds = [t1DecAP21c._id, t1DecBP21c._id];
      await testStage1P21c.save();

      const t2DecCP21c = await ScenarioDecision.create({
        stageId: testStage2P21c._id,
        optionText: 'Accept notification',
        scoreChange: 10,
        behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
        outcomeType: 'correct',
        explanation: 'Legitimate update accepted'
      });

      const t2DecDP21c = await ScenarioDecision.create({
        stageId: testStage2P21c._id,
        optionText: 'Falsely report hacking',
        scoreChange: -10,
        behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
        outcomeType: 'false-positive',
        explanation: 'Falsely reported safe item'
      });

      testStage2P21c.availableDecisionIds = [t2DecCP21c._id, t2DecDP21c._id];
      await testStage2P21c.save();

      // Start Session
      const startResP21c = await fetch(`${BASE_URL}/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ scenarioCode: 'measurement-test' })
      });
      const startDataP21c = await startResP21c.json();
      const testSessionIdP21c = startDataP21c.sessionId;

      if (!testSessionIdP21c) {
        console.error('Start Assessment failed data:', JSON.stringify(startDataP21c, null, 2));
        throw new Error('Failed to start test session.');
      }

      // Step 1: Submit Option B (Verify sender domain)
      const step1ResP21c = await fetch(`${BASE_URL}/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          assessmentSessionId: testSessionIdP21c,
          stageId: testStage1P21c._id.toString(),
          decisionId: t1DecBP21c._id.toString()
        })
      });
      const step1DataP21c = await step1ResP21c.json();

      // Verify TR and DQ scores are 100 on Step 1
      const activeSessionObjP21c = await AssessmentSession.findById(testSessionIdP21c);
      if (activeSessionObjP21c.behaviourScores.get('recognition') !== 100) {
        throw new Error(`Scoring error: TR should be 100. Got: ${activeSessionObjP21c.behaviourScores.get('recognition')}`);
      }
      if (activeSessionObjP21c.behaviourScores.get('decisionQuality') !== 100) {
        throw new Error(`Scoring error: DQ should be 100. Got: ${activeSessionObjP21c.behaviourScores.get('decisionQuality')}`);
      }
      // Verification should remain at 100 default as stage lacks verification focus
      if (activeSessionObjP21c.behaviourScores.get('verification') !== 100) {
        throw new Error(`Opportunity error: VB should stay at default 100. Got: ${activeSessionObjP21c.behaviourScores.get('verification')}`);
      }

      // Step 2: Submit Option D (Falsely report hacking)
      const step2ResP21c = await fetch(`${BASE_URL}/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          assessmentSessionId: testSessionIdP21c,
          stageId: testStage2P21c._id.toString(),
          decisionId: t2DecDP21c._id.toString()
        })
      });
      const step2DataP21c = await step2ResP21c.json();

      if (!step2DataP21c.isCompleted) {
        console.error('Step 2 result:', JSON.stringify(step2DataP21c, null, 2));
        throw new Error('Failed to complete test session on terminal node.');
      }

      // Verify False Positive (FP) penalty applied (should be 0%)
      if (step2DataP21c.behaviourScores.falsePositive !== 0) {
        throw new Error(`False Positive score should be 0. Got: ${step2DataP21c.behaviourScores.falsePositive}`);
      }
      // Verify False Positive raw penalty points and max penalty points match (2 out of 2)
      if (step2DataP21c.falsePositivePenaltyPoints !== 2 || step2DataP21c.falsePositiveMaxPenaltyPoints !== 2) {
        throw new Error(`False Positive penalty points mismatch. Got: ${step2DataP21c.falsePositivePenaltyPoints}/${step2DataP21c.falsePositiveMaxPenaltyPoints}`);
      }
      // Verify Decision Quality (DQ) decreased (1 / 2) * 100 in Stage 1, (0 / 2) * 100 in Stage 2 => total DQ raw is 2, max is 4 => (2/4)*100 = 50%
      if (step2DataP21c.behaviourScores.decisionQuality !== 50) {
        throw new Error(`Decision Quality score should be 50. Got: ${step2DataP21c.behaviourScores.decisionQuality}`);
      }

      // Clean up test fixture records from DB
      await ScenarioDecision.deleteMany({ stageId: { $in: [testStage1P21c._id, testStage2P21c._id] } });
      await ScenarioStage.deleteMany({ scenarioId: testScenarioP21c._id });
      await Scenario.deleteOne({ _id: testScenarioP21c._id });
      await AssessmentDecision.deleteMany({ assessmentSessionId: testSessionIdP21c });
      await AssessmentSession.deleteOne({ _id: testSessionIdP21c });

      console.log('  * PASS: Phase 2.1C Refined Assessment Measurement Model validated successfully');

      // 11. Test Phase 2.1B Refined Assessment Measurement Model
      console.log('- Testing Phase 2.1B Refined Assessment Measurement Model...');
      
      // Pre-cleanup to prevent duplicate key errors
      await Scenario.deleteOne({ slug: 'measurement-test' });

      // Create isolated test fixture scenario
      const testScenario = await Scenario.create({
        title: 'Measurement Test Scenario',
        slug: 'measurement-test',
        code: 'measurement-test',
        description: 'Testing 2.1b metrics and normalization',
        version: 1,
        assessmentType: 'practice',
        status: 'published',
        type: 'phishing',
        domain: 'EMAIL',
        difficulty: 'Intermediate',
        configuredWeights: { 'Phishing': 100 }
      });

      const testStage1 = await ScenarioStage.create({
        scenarioId: testScenario._id,
        stageOrder: 1,
        title: 'Test Stage 1 (Malicious)',
        description: 'A phishing email prompt',
        mockInterfaceType: 'email',
        eventClassification: 'malicious',
        measurementFocus: ['THREAT_RECOGNITION', 'DECISION_QUALITY'],
        targetSignals: ['unexpected_domain'],
        terminal: false
      });

      const testStage2 = await ScenarioStage.create({
        scenarioId: testScenario._id,
        stageOrder: 2,
        title: 'Test Stage 2 (Legitimate)',
        description: 'An official update prompt',
        mockInterfaceType: 'notification',
        eventClassification: 'legitimate',
        measurementFocus: ['FALSE_POSITIVE_CONTROL', 'DECISION_QUALITY'],
        targetSignals: [],
        terminal: true
      });

      const t1DecA = await ScenarioDecision.create({
        stageId: testStage1._id,
        optionText: 'Click link blindly',
        scoreChange: -10,
        behaviorEffects: { recognition: 0, decisionQuality: 0 },
        nextStageId: testStage2._id,
        outcomeType: 'incorrect',
        explanation: 'Clicked phishing link'
      });

      const t1DecB = await ScenarioDecision.create({
        stageId: testStage1._id,
        optionText: 'Verify sender domain',
        scoreChange: 10,
        identifiedSignals: ['unexpected_domain'],
        behaviorEffects: { recognition: 2, decisionQuality: 2 },
        nextStageId: testStage2._id,
        outcomeType: 'correct',
        explanation: 'Verified sender domain'
      });

      testStage1.availableDecisionIds = [t1DecA._id, t1DecB._id];
      await testStage1.save();

      const t2DecC = await ScenarioDecision.create({
        stageId: testStage2._id,
        optionText: 'Accept notification',
        scoreChange: 10,
        behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
        outcomeType: 'correct',
        explanation: 'Legitimate update accepted'
      });

      const t2DecD = await ScenarioDecision.create({
        stageId: testStage2._id,
        optionText: 'Falsely report hacking',
        scoreChange: -10,
        behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
        outcomeType: 'false-positive',
        explanation: 'Falsely reported safe item'
      });

      testStage2.availableDecisionIds = [t2DecC._id, t2DecD._id];
      await testStage2.save();

      // Start Session
      const startResP21b = await fetch(`${BASE_URL}/assessments/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ scenarioCode: 'measurement-test' })
      });
      const startDataP21b = await startResP21b.json();
      const testSessionId = startDataP21b.sessionId;

      if (!testSessionId) {
        console.error('Start Assessment failed data:', JSON.stringify(startDataP21b, null, 2));
        throw new Error('Failed to start test session.');
      }

      // Step 1: Submit Option B (Verify sender domain)
      const step1ResP21b = await fetch(`${BASE_URL}/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          assessmentSessionId: testSessionId,
          stageId: testStage1._id.toString(),
          decisionId: t1DecB._id.toString()
        })
      });
      const step1DataP21b = await step1ResP21b.json();

      // Verify TR and DQ scores are 100 on Step 1
      const activeSessionObj = await AssessmentSession.findById(testSessionId);
      if (activeSessionObj.behaviourScores.get('recognition') !== 100) {
        throw new Error(`Scoring error: TR should be 100. Got: ${activeSessionObj.behaviourScores.get('recognition')}`);
      }
      if (activeSessionObj.behaviourScores.get('decisionQuality') !== 100) {
        throw new Error(`Scoring error: DQ should be 100. Got: ${activeSessionObj.behaviourScores.get('decisionQuality')}`);
      }
      // Verification should remain at 100 default as stage lacks verification focus
      if (activeSessionObj.behaviourScores.get('verification') !== 100) {
        throw new Error(`Opportunity error: VB should stay at default 100. Got: ${activeSessionObj.behaviourScores.get('verification')}`);
      }

      // Step 2: Submit Option D (Falsely report hacking)
      const step2ResP21b = await fetch(`${BASE_URL}/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          assessmentSessionId: testSessionId,
          stageId: testStage2._id.toString(),
          decisionId: t2DecD._id.toString()
        })
      });
      const step2DataP21b = await step2ResP21b.json();

      if (!step2DataP21b.isCompleted) {
        console.error('Step 2 result:', JSON.stringify(step2DataP21b, null, 2));
        throw new Error('Failed to complete test session on terminal node.');
      }

      // Verify False Positive (FP) penalty applied (should be 0%)
      if (step2DataP21b.behaviourScores.falsePositive !== 0) {
        throw new Error(`False Positive score should be 0. Got: ${step2DataP21b.behaviourScores.falsePositive}`);
      }
      // Verify Decision Quality (DQ) decreased (1 / 2) * 100 in Stage 1, (0 / 2) * 100 in Stage 2 => total DQ raw is 2, max is 4 => (2/4)*100 = 50%
      if (step2DataP21b.behaviourScores.decisionQuality !== 50) {
        throw new Error(`Decision Quality score should be 50. Got: ${step2DataP21b.behaviourScores.decisionQuality}`);
      }

      // Clean up test fixture records from DB
      await ScenarioDecision.deleteMany({ stageId: { $in: [testStage1._id, testStage2._id] } });
      await ScenarioStage.deleteMany({ scenarioId: testScenario._id });
      await Scenario.deleteOne({ _id: testScenario._id });
      await AssessmentDecision.deleteMany({ assessmentSessionId: testSessionId });
      await AssessmentSession.deleteOne({ _id: testSessionId });

      console.log('  * PASS: Phase 2.1B Refined Assessment Measurement Model validated successfully');


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
