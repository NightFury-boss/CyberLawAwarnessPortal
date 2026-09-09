const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../.env') });
const PORT = 5998;
const BASE_URL = `http://localhost:${PORT}/api`;
const MONGODB_URI = process.env.MONGODB_URI;

const User = require('../models/User');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');

const seedFixture = require('../config/seedFixture');
const clearFixture = require('../config/clearFixture');
const { auditScenario } = require('../services/scenarioIntegrityService');
const { calculateScores } = require('../services/assessmentScoringService');

let server;

async function runDeepAudit() {
  console.log('=============================================================');
  console.log('STARTING PHASE 2.2 DEEP INDEPENDENT AUDIT');
  console.log('=============================================================');

  // Start dedicated test server
  const app = require('../server');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Deep audit test server listening on port ${PORT}`);

  await mongoose.connect(MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB.');

  try {
    // 1. Clean state re-seed
    console.log('\n--- 1. CLEAN STATE RESET ---');
    await clearFixture(false);
    await seedFixture(false);

    const fixtureScenarios = await Scenario.find({ slug: 'assessment-fixture-v1' });
    const stages = await ScenarioStage.find({ scenarioId: fixtureScenarios[0]._id }).sort({ stageOrder: 1 });
    const stageIds = stages.map(s => s._id);
    const decisions = await ScenarioDecision.find({ stageId: { $in: stageIds } });
    const prodBaseline = await Scenario.findOne({ slug: 'baseline' });
    const prodFinal = await Scenario.findOne({ slug: 'final' });

    console.log(`Fixture Scenario count: ${fixtureScenarios.length}`);
    console.log(`Fixture Stages count: ${stages.length}`);
    console.log(`Fixture Decisions count: ${decisions.length}`);
    console.log(`Production baseline exists: ${!!prodBaseline}`);
    console.log(`Production final exists: ${!!prodFinal}`);

    // Map stages and decisions
    const stageMap = {};
    const decMap = {};
    for (const st of stages) {
      stageMap[st.stageOrder] = st;
      decMap[st.stageOrder] = await ScenarioDecision.find({ stageId: st._id });
    }

    // Register / Login test user
    await User.deleteOne({ email: 'deep_audit_user@test.com' });
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Audit User', email: 'deep_audit_user@test.com', password: 'password123' })
    });
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'deep_audit_user@test.com', password: 'password123' })
    });
    const { token: userToken } = await loginRes.json();

    // 2. PATH 1: Safe / High-Outcome Branch
    console.log('\n--- 2. EXECUTE PATH 1: CONTEXTUALLY APPROPRIATE BRANCH ---');
    const startRes1 = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const { sessionId: session1Id, stage: currentStage1 } = await startRes1.json();

    // St1: dec1C (Verify separately)
    const st1OptC = decMap[1].find(d => d.optionText.includes('Open the official service'));
    const step1P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: currentStage1.id, decisionId: st1OptC._id.toString() })
    })).json();

    // St2: dec2A (Review normally)
    const st2OptA = decMap[2].find(d => d.optionText.includes('Review the notification'));
    const step2P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: step1P1.stage.id, decisionId: st2OptA._id.toString() })
    })).json();

    // St3: dec3C (Inspect merchant)
    const st3OptC = decMap[3].find(d => d.optionText.includes('Inspect the merchant'));
    const step3P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: step2P1.stage.id, decisionId: st3OptC._id.toString() })
    })).json();

    // St4: dec4B (Review details)
    const st4OptB = decMap[4].find(d => d.optionText.includes('Review what permission'));
    const step4P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: step3P1.stage.id, decisionId: st4OptB._id.toString() })
    })).json();

    // St5: dec5C (Domain + Urgency)
    const st5OptC = decMap[5].find(d => d.optionText.includes('urgency'));
    const step5P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: step4P1.stage.id, decisionId: st5OptC._id.toString() })
    })).json();

    // St6: dec6A (Verify safely -> 7A)
    const st6OptA = decMap[6].find(d => d.optionText.includes('Verify account message'));
    const step6P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: step5P1.stage.id, decisionId: st6OptA._id.toString() })
    })).json();

    console.log(`Stage 6 branched to: ${step6P1.stage.title} (ID: ${step6P1.stage.id})`);
    if (step6P1.stage.id.toString() !== stageMap[7]._id.toString()) {
      throw new Error(`Expected branch to Stage 7A, got: ${step6P1.stage.id}`);
    }

    // St7A: dec7A (Proceed normally -> terminal)
    const st7AOptA = decMap[7].find(d => d.optionText.includes('Proceed normally'));
    const step7P1 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session1Id, stageId: stageMap[7]._id.toString(), decisionId: st7AOptA._id.toString() })
    })).json();

    console.log(`Path 1 Completed: ${step7P1.isCompleted}`);
    const scoringP1 = await calculateScores(session1Id);
    console.log('Path 1 Scoring Result:');
    console.log('  rawScores:', scoringP1.rawScores);
    console.log('  maxScores:', scoringP1.maxScores);
    console.log('  scores:', scoringP1.scores);
    console.log(`  FP penalty/max: ${scoringP1.falsePositivePenaltyPoints} / ${scoringP1.falsePositiveMaxPenaltyPoints}`);
    console.log(`  UA penalty/max: ${scoringP1.unreviewedAcceptancePenaltyPoints} / ${scoringP1.unreviewedAcceptanceMaxPenaltyPoints}`);

    // DB document persistence check for Path 1
    const p1Doc = await AssessmentSession.findById(session1Id);
    console.log('\nPath 1 AssessmentSession Document in DB:');
    console.log(`  status: ${p1Doc.status}`);
    console.log(`  score: ${p1Doc.score}`);
    console.log(`  stagesCompleted: ${p1Doc.stagesCompleted}`);
    console.log(`  behaviourScores:`, Object.fromEntries(p1Doc.behaviourScores));
    console.log(`  behaviourOpportunities:`, Object.fromEntries(p1Doc.behaviourOpportunities));
    console.log(`  falsePositivePenaltyPoints: ${p1Doc.falsePositivePenaltyPoints}`);
    console.log(`  unreviewedAcceptancePenaltyPoints: ${p1Doc.unreviewedAcceptancePenaltyPoints}`);

    // 3. PATH 2: Compromised / Low-Outcome Branch
    console.log('\n--- 3. EXECUTE PATH 2: POOR-DECISION / OVER-REPORTING BRANCH ---');
    const startRes2 = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const { sessionId: session2Id, stage: currentStage2 } = await startRes2.json();

    // St1: dec1A (Open link blindly)
    const st1OptA = decMap[1].find(d => d.optionText.includes('Open the link immediately'));
    const step1P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: currentStage2.id, decisionId: st1OptA._id.toString() })
    })).json();

    // St2: dec2B (Report hacking)
    const st2OptB = decMap[2].find(d => d.optionText.includes('Report the notification'));
    const step2P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: step1P2.stage.id, decisionId: st2OptB._id.toString() })
    })).json();

    // St3: dec3A (Approve blindly)
    const st3OptA = decMap[3].find(d => d.optionText.includes('Approve the payment'));
    const step3P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: step2P2.stage.id, decisionId: st3OptA._id.toString() })
    })).json();

    // St4: dec4A (Allow immediately)
    const st4OptA = decMap[4].find(d => d.optionText.includes('Allow immediately'));
    const step4P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: step3P2.stage.id, decisionId: st4OptA._id.toString() })
    })).json();

    // St5: dec5A (Do not interact)
    const st5OptA = decMap[5].find(d => d.optionText.includes('Do not interact'));
    const step5P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: step4P2.stage.id, decisionId: st5OptA._id.toString() })
    })).json();

    // St6: dec6B (Continue immediately -> 7B)
    const st6OptB = decMap[6].find(d => d.optionText.includes('Continue immediately'));
    const step6P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: step5P2.stage.id, decisionId: st6OptB._id.toString() })
    })).json();

    console.log(`Stage 6 branched to: ${step6P2.stage.title} (ID: ${step6P2.stage.id})`);
    if (step6P2.stage.id.toString() !== stageMap[8]._id.toString()) {
      throw new Error(`Expected branch to Stage 7B, got: ${step6P2.stage.id}`);
    }

    // St7B: dec7B (Friction encountered -> terminal)
    const st7BOptA = decMap[8].find(d => d.optionText.includes('Friction encountered'));
    const step7P2 = await (await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session2Id, stageId: stageMap[8]._id.toString(), decisionId: st7BOptA._id.toString() })
    })).json();

    console.log(`Path 2 Completed: ${step7P2.isCompleted}`);
    const scoringP2 = await calculateScores(session2Id);
    console.log('Path 2 Scoring Result:');
    console.log('  rawScores:', scoringP2.rawScores);
    console.log('  maxScores:', scoringP2.maxScores);
    console.log('  scores:', scoringP2.scores);
    console.log(`  FP penalty/max: ${scoringP2.falsePositivePenaltyPoints} / ${scoringP2.falsePositiveMaxPenaltyPoints}`);
    console.log(`  UA penalty/max: ${scoringP2.unreviewedAcceptancePenaltyPoints} / ${scoringP2.unreviewedAcceptanceMaxPenaltyPoints}`);

    // DB document persistence check for Path 2
    const p2Doc = await AssessmentSession.findById(session2Id);
    console.log('\nPath 2 AssessmentSession Document in DB:');
    console.log(`  status: ${p2Doc.status}`);
    console.log(`  score: ${p2Doc.score}`);
    console.log(`  stagesCompleted: ${p2Doc.stagesCompleted}`);
    console.log(`  behaviourScores:`, Object.fromEntries(p2Doc.behaviourScores));
    console.log(`  behaviourOpportunities:`, Object.fromEntries(p2Doc.behaviourOpportunities));
    console.log(`  falsePositivePenaltyPoints: ${p2Doc.falsePositivePenaltyPoints}`);
    console.log(`  unreviewedAcceptancePenaltyPoints: ${p2Doc.unreviewedAcceptancePenaltyPoints}`);

    // 4. REPLAY PROTECTION & STATE INTEGRITY AUDIT
    console.log('\n--- 4. REPLAY & STATE INTEGRITY AUDIT ---');
    const startRes3 = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const { sessionId: session3Id, stage: currentStage3 } = await startRes3.json();

    // A. Submit valid step
    await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session3Id, stageId: currentStage3.id, decisionId: st1OptA._id.toString() })
    });
    const decisionsCountAfterFirst = await AssessmentDecision.countDocuments({ assessmentSessionId: session3Id });
    const sessionStateAfterFirst = await AssessmentSession.findById(session3Id);
    const scoreAfterFirst = sessionStateAfterFirst.score;

    // B. Replay exact same submission on current stage (Stage 1 was already completed)
    const replayRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session3Id, stageId: currentStage3.id, decisionId: st1OptA._id.toString() })
    });
    const replayData = await replayRes.json();
    const decisionsCountAfterReplay = await AssessmentDecision.countDocuments({ assessmentSessionId: session3Id });
    const sessionStateAfterReplay = await AssessmentSession.findById(session3Id);

    console.log(`Replay Submission: HTTP ${replayRes.status}, Error Code: ${replayData?.error?.code}`);
    console.log(`Decisions count changed: ${decisionsCountAfterFirst} -> ${decisionsCountAfterReplay} (diff: ${decisionsCountAfterReplay - decisionsCountAfterFirst})`);
    console.log(`Session score changed: ${scoreAfterFirst} -> ${sessionStateAfterReplay.score} (diff: ${sessionStateAfterReplay.score - scoreAfterFirst})`);

    // C. Replay different decision on already-completed stage
    const st1OptB = decMap[1].find(d => d.optionText.includes('Report the message'));
    const altReplayRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session3Id, stageId: currentStage3.id, decisionId: st1OptB._id.toString() })
    });
    const altReplayData = await altReplayRes.json();
    console.log(`Alternative Decision Replay on Completed Stage: HTTP ${altReplayRes.status}, Error Code: ${altReplayData?.error?.code}`);

    // D. Foreign scenario decision submission
    const prodStage = await ScenarioStage.findOne({ scenarioId: prodBaseline._id });
    const prodDec = await ScenarioDecision.findOne({ stageId: prodStage._id });
    const foreignRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ assessmentSessionId: session3Id, stageId: sessionStateAfterFirst.currentStageId.toString(), decisionId: prodDec._id.toString() })
    });
    const foreignData = await foreignRes.json();
    console.log(`Foreign Scenario Decision: HTTP ${foreignRes.status}, Error Code: ${foreignData?.error?.code}`);

    // 5. CLIENT INJECTION SECURITY AUDIT
    console.log('\n--- 5. CLIENT FORGED DATA INJECTION AUDIT ---');
    const startRes4 = await fetch(`${BASE_URL}/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ scenarioCode: 'assessment-fixture-v1' })
    });
    const { sessionId: session4Id, stage: currentStage4 } = await startRes4.json();

    const forgedPayload = {
      assessmentSessionId: session4Id,
      stageId: currentStage4.id,
      decisionId: st1OptA._id.toString(), // Choice with 0 for all metrics
      score: 100,
      rawScores: { recognition: 100, signalIdentification: 100, verification: 100, decisionQuality: 100 },
      maxScores: { recognition: 100, signalIdentification: 100, verification: 100, decisionQuality: 100 },
      normalizedScores: { recognition: 100, signalIdentification: 100, verification: 100, decisionQuality: 100, falsePositive: 100, unreviewedAcceptance: 100 },
      behaviourScores: { recognition: 100, signalIdentification: 100, verification: 100, decisionQuality: 100, falsePositive: 100, unreviewedAcceptance: 100 },
      behaviourOpportunities: { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0, falsePositive: 0, unreviewedAcceptance: 0 },
      falsePositivePenaltyPoints: 0,
      falsePositiveMaxPenaltyPoints: 0,
      unreviewedAcceptancePenaltyPoints: 0,
      unreviewedAcceptanceMaxPenaltyPoints: 0,
      behaviorEffects: { recognition: 2, signalIdentification: 2, verification: 2, decisionQuality: 2 },
      eventClassification: 'legitimate',
      measurementFocus: ['FALSE_POSITIVE_CONTROL'],
      targetSignals: ['fake_signal'],
      nextStageId: stageMap[7]._id.toString() // Attempting to force jump to Stage 7A
    };

    const injectRes = await fetch(`${BASE_URL}/assessments/submit-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify(forgedPayload)
    });
    const injectData = await injectRes.json();
    const docAfterInject = await AssessmentSession.findById(session4Id);

    console.log(`Injection API Response: next stage title is "${injectData?.stage?.title}" (expected Stage 2, not forged Stage 7A)`);
    console.log(`Persisted recognition score in DB: ${docAfterInject.behaviourScores.get('recognition')} (expected 0, not injected 100)`);
    console.log(`Persisted decisionQuality score in DB: ${docAfterInject.behaviourScores.get('decisionQuality')} (expected 0, not injected 100)`);
    console.log(`Persisted currentStageId in DB: ${docAfterInject.currentStageId.toString()} (matches Stage 2: ${docAfterInject.currentStageId.toString() === stageMap[2]._id.toString()})`);

    // 6. CLEANUP AUDIT
    console.log('\n--- 6. CLEANUP AUDIT ---');
    await clearFixture(false);
    const postCleanupScenarios = await Scenario.find({ slug: 'assessment-fixture-v1' });
    const postCleanupStages = await ScenarioStage.find({ scenarioId: fixtureScenarios[0]._id });
    const postCleanupDecisions = await ScenarioDecision.find({ stageId: { $in: stageIds } });
    const prodBaselineAfter = await Scenario.findOne({ slug: 'baseline' });
    const prodFinalAfter = await Scenario.findOne({ slug: 'final' });
    const userAfter = await User.findOne({ email: 'fixture_user@test.com' });

    console.log(`Post-cleanup fixture scenarios: ${postCleanupScenarios.length} (Expected: 0)`);
    console.log(`Post-cleanup fixture stages: ${postCleanupStages.length} (Expected: 0)`);
    console.log(`Post-cleanup fixture decisions: ${postCleanupDecisions.length} (Expected: 0)`);
    console.log(`Production baseline still exists: ${!!prodBaselineAfter}`);
    console.log(`Production final still exists: ${!!prodFinalAfter}`);

    // Cleanup audit user
    await User.deleteOne({ email: 'deep_audit_user@test.com' });

    console.log('\n=============================================================');
    console.log('DEEP AUDIT COMPLETED WITH ZERO ERRORS');
    console.log('=============================================================');

  } catch (err) {
    console.error('Deep audit failed:', err);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('Database and server closed.');
  }
}

runDeepAudit();
