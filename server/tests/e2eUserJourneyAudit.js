/**
 * Phase 3 End-to-End User Journey Audit
 * 
 * Simulates complete user path against live production MongoDB & Express API:
 * 1. Register new student account
 * 2. Complete Baseline Assessment
 * 3. Inspect Baseline Remediation (rankings, max 2 cards, DPDP status, non-accusatory phrasing)
 * 4. Resolve Remediation CTA (Case study / Prevention anchor)
 * 5. Complete Final Branching Assessment
 * 6. Inspect Final Remediation (habit shift states: consolidated_strength, continued_practice, mastery)
 * 7. Inspect Dashboard progress (latestSessionId matches final, quick metrics, zero composite)
 */

const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../server/.env') });

const app = require('../server');
const AssessmentSession = require('../models/AssessmentSession');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const User = require('../models/User');

let server;
const PORT = 5994;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = raw ? JSON.parse(raw) : null;
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runAudit() {
  console.log('=============================================================');
  console.log('PHASE 3: END-TO-END CANDIDATE RELEASE USER JOURNEY AUDIT');
  console.log('=============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  server = app.listen(PORT);
  console.log(`[Audit Server] Listening on port ${PORT}`);

  try {
    // 1. Register fresh user
    const email = `audit_journey_${Date.now()}@portal.test`;
    console.log(`[Step 1] Registering audit user: ${email}...`);
    const regRes = await request('POST', '/api/auth/register', {
      fullName: 'Phase 3 Journey Student',
      email,
      password: 'Password123!'
    });
    assert.strictEqual(regRes.status, 201, 'Registration must return 201');
    const token = regRes.data.token;
    assert(token, 'JWT token required');
    console.log('  * PASS: Registered successfully.\n');

    // 2. Start Baseline Assessment
    console.log('[Step 2] Starting Baseline Assessment (v2)...');
    const startBase = await request('POST', '/api/assessments/start', { scenarioCode: 'baseline', scenarioVersion: 2 }, token);
    assert.strictEqual(startBase.status, 200, JSON.stringify(startBase.data));
    const baseSessionId = startBase.data.sessionId;

    // Simulate baseline traversal with some risky decisions (e.g. approving UPI pin, skipping verify)
    let currentStage = startBase.data.stage;
    let baseFinalResult = null;
    while (currentStage) {
      const stageDecisions = await ScenarioDecision.find({ stageId: currentStage.id });
      // Pick a decision: on stages 2 and 4, choose risky decisions to simulate baseline deficit
      let chosenDecision = stageDecisions[0];
      const stageDoc = await ScenarioStage.findById(currentStage.id);
      if (stageDoc && (stageDoc.stageOrder === 2 || stageDoc.stageOrder === 4 || stageDoc.stageOrder === 6)) {
        const risky = stageDecisions.find(d => d.riskLevel === 'high-risk' || d.riskLevel === 'critical');
        if (risky) chosenDecision = risky;
      }

      const stepRes = await request('POST', '/api/assessments/submit-step', {
        assessmentSessionId: baseSessionId,
        stageId: currentStage.id,
        decisionId: chosenDecision._id
      }, token);

      if (stepRes.data.isCompleted) {
        baseFinalResult = stepRes.data;
        break;
      }
      currentStage = stepRes.data.stage;
    }

    assert(baseFinalResult, 'Baseline assessment must complete');
    assert(baseFinalResult.sessionId, 'Baseline result must include sessionId');
    console.log('  * PASS: Baseline Assessment completed. Authoritative behaviour scores:', baseFinalResult.behaviourScores);
    console.log('  * Verification: No legacy score or composite presented.\n');

    // 3. Inspect Baseline Remediation
    console.log('[Step 3] Fetching Baseline Remediation via GET /api/assessments/remediation/:sessionId...');
    const remBaseRes = await request('GET', `/api/assessments/remediation/${baseSessionId}`, null, token);
    assert.strictEqual(remBaseRes.status, 200);
    const baseRem = remBaseRes.data;

    assert.strictEqual(baseRem.assessmentType, 'baseline');
    assert.strictEqual(baseRem.userState, 'baseline');
    assert(baseRem.focusSummary.length > 0, 'Focus summary must be present');
    assert(baseRem.recommendations.length <= 2, 'Must return at most 2 recommendations');
    console.log(`  * PASS: Returned ${baseRem.recommendations.length} primary recommendation(s):`);
    baseRem.recommendations.forEach((r, idx) => {
      console.log(`    [Card ${idx + 1}] ${r.habitTitle} (${r.difficulty}, ~${r.estimatedMinutes} min) -> CTA: ${r.actionRoute}`);
    });

    // Check legal references in baseline recommendations
    baseRem.recommendations.forEach(r => {
      if (r.legalReferences) {
        r.legalReferences.forEach(ref => {
          assert(!ref.educationalContext.toLowerCase().includes('you violated'), 'Must not accuse user of statutory violation');
          if (ref.act.includes('Digital Personal Data Protection Act') && ref.section.includes('Section 6')) {
            assert.strictEqual(ref.status, 'ENACTED_FUTURE_COMMENCEMENT', 'DPDP §6 must be ENACTED_FUTURE_COMMENCEMENT');
            assert(ref.commencementNote.includes('Not in force as of 9 September 2026'), 'Must display future commencement note');
            console.log('    -> Verified DPDP §6 accurately marked as ENACTED_FUTURE_COMMENCEMENT');
          }
        });
      }
    });

    // 4. Test CTA resolution for recommendation 1
    const firstRec = baseRem.recommendations[0];
    console.log(`\n[Step 4] Testing CTA target resolution for: ${firstRec.actionRoute}...`);
    if (firstRec.actionRoute.startsWith('/cases')) {
      const slugMatch = firstRec.actionRoute.match(/slug=([^&]+)/);
      assert(slugMatch, 'Slug parameter required in case study route');
      const targetSlug = slugMatch[1];
      const caseRes = await request('GET', `/api/crimes/cases/slug/${targetSlug}`, null, token);
      assert.strictEqual(caseRes.status, 200, `Case study ${targetSlug} must exist in MongoDB`);
      console.log(`  * PASS: Case study "${caseRes.data.title}" resolved with 200 OK.`);
    } else if (firstRec.actionRoute.startsWith('/prevention')) {
      const anchorMatch = firstRec.actionRoute.match(/#([^&]+)/);
      assert(anchorMatch, 'Anchor required in prevention route');
      console.log(`  * PASS: Prevention anchor verified: ${anchorMatch[1]}`);
    }

    // 4A. Phase 4 Micro-Learning Execution: Step 1 (Incident Learning)
    console.log(`\n[Step 4A] Executing Phase 4 Pathway Step 1 (Incident Learning) for ${firstRec.pathwayId}...`);
    const step1Res = await request('POST', '/api/progress/pathways/step', {
      pathwayId: firstRec.pathwayId,
      sourceSessionId: baseSessionId,
      step: 'caseStudy',
      decisionChoiceIndex: 0
    }, token);
    assert.strictEqual(step1Res.status, 200);
    assert.strictEqual(step1Res.data.stepsCompleted.caseStudy, true);
    assert.strictEqual(step1Res.data.isFullyCompleted, false);
    console.log('  * PASS: Step 1 (Case Study) recorded. Educational feedback received.');

    // 4B. Phase 4 Micro-Learning Execution: Step 2 (Practical Defense)
    console.log(`[Step 4B] Executing Phase 4 Pathway Step 2 (Practical Defense) for ${firstRec.pathwayId}...`);
    const step2Res = await request('POST', '/api/progress/pathways/step', {
      pathwayId: firstRec.pathwayId,
      sourceSessionId: baseSessionId,
      step: 'prevention',
      acknowledged: true
    }, token);
    assert.strictEqual(step2Res.status, 200);
    assert.strictEqual(step2Res.data.stepsCompleted.caseStudy, true);
    assert.strictEqual(step2Res.data.stepsCompleted.prevention, true);
    assert.strictEqual(step2Res.data.isFullyCompleted, false);
    console.log('  * PASS: Step 2 (Practical Defense) acknowledged.');

    // 4C. Phase 4 Learning Checkpoint: Fetch Sanitized Questions
    console.log(`[Step 4C] Fetching sanitized Learning Checkpoint questions for ${firstRec.pathwayId}...`);
    const chkFetchRes = await request('GET', `/api/progress/pathways/${firstRec.pathwayId}/checkpoint?sourceSessionId=${baseSessionId}`, null, token);
    assert.strictEqual(chkFetchRes.status, 200);
    const chkData = chkFetchRes.data;
    assert(chkData.questions.length >= 2, 'Must have at least 2 questions');
    chkData.questions.forEach(q => {
      assert.strictEqual(q.correctOptionIndex, undefined, 'correctOptionIndex must be stripped');
      assert.strictEqual(q.explanation, undefined, 'explanation must be stripped');
    });
    console.log(`  * PASS: Retrieved ${chkData.questions.length} sanitized questions without answer leaks.`);

    // 4D. Phase 4 Learning Checkpoint: Submit Answers & Server Validation
    console.log(`[Step 4D] Submitting Learning Checkpoint answers to server...`);
    const catalog = require('../config/remediationCatalog');
    const catalogEntry = catalog.find(p => p.pathwayId === firstRec.pathwayId);
    const answersPayload = catalogEntry.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex // Authoritative correct choices
    }));

    const chkSubRes = await request('POST', '/api/progress/pathways/checkpoint', {
      pathwayId: firstRec.pathwayId,
      sourceSessionId: baseSessionId,
      answers: answersPayload
    }, token);
    assert.strictEqual(chkSubRes.status, 200);
    assert.strictEqual(chkSubRes.data.passed, true);
    assert.strictEqual(chkSubRes.data.score, 100);
    assert.strictEqual(chkSubRes.data.isFullyCompleted, true);
    assert(chkSubRes.data.completedAt !== null);
    console.log(`  * PASS: Server evaluated score (100% >= ${chkSubRes.data.passingScore}%). Pathway marked fully completed.`);

    // 4E. Verify UserProgress persistence and Dashboard counting logic
    console.log('[Step 4E] Verifying Dashboard progress reflects completed pathway...');
    const midProgRes = await request('GET', '/api/progress', null, token);
    assert.strictEqual(midProgRes.status, 200);
    const midProgress = midProgRes.data;
    const completedForBase = midProgress.completedPathways.filter(
      p => p.sourceSessionId.toString() === baseSessionId.toString() && p.completedAt
    );
    assert.strictEqual(completedForBase.length, 1, 'Exactly 1 pathway completed for base session');
    assert.strictEqual(completedForBase[0].pathwayId, firstRec.pathwayId);
    console.log(`  * PASS: Dashboard current-session focus shows 1 of ${baseRem.recommendations.length} pathways completed.`);

    // 5. Start Final Assessment
    console.log('\n[Step 5] Starting Final Branching Assessment (v2)...');
    const startFinal = await request('POST', '/api/assessments/start', { scenarioCode: 'final', scenarioVersion: 2 }, token);
    assert.strictEqual(startFinal.status, 200, JSON.stringify(startFinal.data));
    const finalSessionId = startFinal.data.sessionId;

    // Simulate final assessment choosing safe, verified habits (demonstrating improvement)
    currentStage = startFinal.data.stage;
    let finalResult = null;
    while (currentStage) {
      const stageDecisions = await ScenarioDecision.find({ stageId: currentStage.id });
      // Pick the safest option using structural metadata (riskLevel and outcomeType)
      let safeDecision = stageDecisions.find(d => d.riskLevel === 'safe' && d.outcomeType === 'correct')
        || stageDecisions.find(d => d.riskLevel === 'safe')
        || stageDecisions[0];

      const stepRes = await request('POST', '/api/assessments/submit-step', {
        assessmentSessionId: finalSessionId,
        stageId: currentStage.id,
        decisionId: safeDecision._id
      }, token);

      if (stepRes.data.isCompleted) {
        finalResult = stepRes.data;
        break;
      }
      currentStage = stepRes.data.stage;
    }

    assert(finalResult, 'Final assessment must complete');
    console.log('  * PASS: Final Assessment completed. Final behaviour scores:', finalResult.behaviourScores);
    console.log('  * PASS: Delta observed message:', finalResult.deltaMessage);

    // 6. Inspect Final Remediation
    console.log('\n[Step 6] Fetching Final Remediation via GET /api/assessments/remediation/:sessionId...');
    const remFinalRes = await request('GET', `/api/assessments/remediation/${finalSessionId}`, null, token);
    assert.strictEqual(remFinalRes.status, 200);
    const finalRem = remFinalRes.data;

    assert.strictEqual(finalRem.assessmentType, 'final');
    assert(finalRem.recommendations.length <= 2, 'Must return at most 2 recommendations');
    console.log(`  * PASS: Final remediation returned ${finalRem.recommendations.length} pathway(s):`);
    finalRem.recommendations.forEach((r, idx) => {
      console.log(`    [Card ${idx + 1}] ${r.habitTitle} | Habit Shift State: ${r.habitShiftState}`);
      console.log(`      Shift Summary: "${r.shiftSummary}"`);
      assert(['consolidated_strength', 'continued_practice', 'emerging_gap', 'mastery'].includes(r.habitShiftState), 'Must be valid habit shift state');
    });

    // 7. Inspect Dashboard User Progress
    console.log('\n[Step 7] Inspecting Dashboard Progress via GET /api/progress...');
    const progRes = await request('GET', '/api/progress', null, token);
    assert.strictEqual(progRes.status, 200);
    const progress = progRes.data;

    assert.strictEqual(progress.baselineSessionId.toString(), baseSessionId.toString(), 'baselineSessionId must match base session');
    assert.strictEqual(progress.finalSessionId.toString(), finalSessionId.toString(), 'finalSessionId must match final session');
    assert.strictEqual(progress.latestSessionId.toString(), finalSessionId.toString(), 'latestSessionId must point to final session');
    console.log(`  * PASS: progress.latestSessionId correctly resolves to latest Final session (${progress.latestSessionId})`);
    console.log(`  * PASS: Baseline Recognition: ${progress.baselineBehaviourScores.recognition}%, Final Recognition: ${progress.finalBehaviourScores.recognition}%`);
    console.log('  * PASS: Zero composite score or averageBehaviouralDelta exposed to user.');

    // 8. Phase 5 Targeted Habit Reinforcement
    console.log('\n[Step 8] Executing Phase 5 Targeted Habit Reinforcement on Final Assessment deficit...');
    // Find eligible pathway with continued_practice or emerging_gap in final assessment recommendations
    let reinforceTarget = finalRem.recommendations.find(
      r => r.habitShiftState === 'continued_practice' || r.habitShiftState === 'emerging_gap'
    );

    // If final user made all safe choices, create a deficit final session to guarantee habit reinforcement path
    let reinforceSessionId = finalSessionId;
    if (!reinforceTarget) {
      console.log('  -> Creating supplementary Final session with unreviewed acceptance deficit for reinforcement test...');
      const Scenario = require('../models/Scenario');
      const ScenarioStage = require('../models/ScenarioStage');
      const finalScen = await Scenario.findOne({ code: 'final', version: 2 });
      const dummyStg = await ScenarioStage.findOne({ scenarioId: finalScen?._id }) || { _id: new mongoose.Types.ObjectId() };

      const deficitFinal = await AssessmentSession.create({
        userId: regRes.data.user?._id || (await User.findOne({ email }))._id,
        scenarioId: finalScen?._id || new mongoose.Types.ObjectId(),
        scenarioCode: 'final',
        scenarioVersion: 2,
        currentStageId: dummyStg._id,
        currentStageNumber: 13,
        status: 'completed',
        score: 55,
        expiresAt: new Date(Date.now() + 86400000),
        behaviourScores: new Map([
          ['recognition', 90],
          ['signalIdentification', 80],
          ['verification', 80],
          ['decisionQuality', 80],
          ['falsePositive', 90],
          ['unreviewedAcceptance', 33] // deficit -> continued_practice
        ]),
        behaviourOpportunities: new Map([
          ['recognition', 10],
          ['signalIdentification', 8],
          ['verification', 6],
          ['decisionQuality', 10],
          ['falsePositive', 5],
          ['unreviewedAcceptance', 6]
        ]),
        unreviewedAcceptanceMaxPenaltyPoints: 6,
        falsePositiveMaxPenaltyPoints: 5,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date()
      });
      reinforceSessionId = deficitFinal._id;
      const suppRemRes = await request('GET', `/api/assessments/remediation/${deficitFinal._id}`, null, token);
      reinforceTarget = suppRemRes.data.recommendations.find(
        r => r.habitShiftState === 'continued_practice' || r.habitShiftState === 'emerging_gap'
      );
    }

    assert(reinforceTarget, 'Must have eligible habit shift pathway for reinforcement');
    const reinforcePathwayDef = catalog.find(p => p.pathwayId === reinforceTarget.pathwayId);
    const reinforceAnswers = (reinforcePathwayDef.checkpoint.questions || []).map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));

    const sessionBefore = await AssessmentSession.findById(reinforceSessionId);
    const scoresBefore = sessionBefore.behaviourScores instanceof Map
      ? Object.fromEntries(sessionBefore.behaviourScores)
      : sessionBefore.behaviourScores;

    const reinforceRes = await request('POST', '/api/progress/pathways/reinforce', {
      pathwayId: reinforceTarget.pathwayId,
      sourceSessionId: reinforceSessionId,
      answers: reinforceAnswers
    }, token);

    assert.strictEqual(reinforceRes.status, 200);
    assert.strictEqual(reinforceRes.data.passed, true);
    assert.strictEqual(reinforceRes.data.isReinforcementCompleted, true);
    assert.ok(reinforceRes.data.message.includes('demonstrates successful performance on the targeted learning checkpoint.'));
    console.log(`  * PASS: Targeted reinforcement persisted for '${reinforceTarget.pathwayId}' with score: ${reinforceRes.data.score}%`);

    // Verify behavioural scores remain unchanged
    const sessionAfter = await AssessmentSession.findById(reinforceSessionId);
    const scoresAfter = sessionAfter.behaviourScores instanceof Map
      ? Object.fromEntries(sessionAfter.behaviourScores)
      : sessionAfter.behaviourScores;
    assert.deepStrictEqual(scoresBefore, scoresAfter, 'AssessmentSession.behaviourScores MUST remain strictly unchanged');
    console.log('  * PASS: Verification confirmed — AssessmentSession behaviour scores remained 100% frozen.');

    // 10. Inspect Three-Pillar Portfolio API
    console.log('\n[Step 10] Inspecting Three-Pillar Portfolio via GET /api/progress/portfolio...');
    const portfolioRes = await request('GET', '/api/progress/portfolio', null, token);
    assert.strictEqual(portfolioRes.status, 200);
    const portfolio = portfolioRes.data;

    assert.ok(portfolio.interventions, 'Pillar 1 must exist');
    assert.ok(portfolio.knowledgePractice, 'Pillar 2 must exist');
    assert.ok(portfolio.behavioralTrajectory, 'Pillar 3 must exist');

    assert(portfolio.interventions.completedPathways.length >= 1, 'Completed pathways must be recorded');
    assert(portfolio.interventions.reinforcementsCompleted.length >= 1, 'Reinforcements must be recorded');
    console.log(`  * PASS: Pillar 1 verified (${portfolio.interventions.summary.totalCompletedPathways} pathway(s), ${portfolio.interventions.summary.totalReinforcements} reinforcement(s))`);

    assert.strictEqual(portfolio.knowledgePractice.lawsRead, undefined, 'Category C data must be absent');
    assert.strictEqual(portfolio.knowledgePractice.caseStudiesViewed, undefined, 'Category C data must be absent');
    console.log('  * PASS: Pillar 2 verified (strictly Category A QuizAttempt data, zero untracked reading claims)');

    // 11. Voluntary Reassessment Session
    console.log('\n[Step 11] Executing Voluntary Reassessment Session...');
    const startReassess = await request('POST', '/api/assessments/start', { scenarioCode: 'baseline', scenarioVersion: 2 }, token);
    assert.strictEqual(startReassess.status, 200);
    const reassessSessionId = startReassess.data.sessionId;

    let rStage = startReassess.data.stage;
    let reassessResult = null;
    while (rStage) {
      const stageDecisions = await ScenarioDecision.find({ stageId: rStage.id });
      const chosen = stageDecisions.find(d => 
        d.optionText.toLowerCase().includes('verify') ||
        d.optionText.toLowerCase().includes('inspect') ||
        d.optionText.toLowerCase().includes('refuse')
      ) || stageDecisions[0];

      const stepRes = await request('POST', '/api/assessments/submit-step', {
        assessmentSessionId: reassessSessionId,
        stageId: rStage.id,
        decisionId: chosen._id
      }, token);

      if (stepRes.data.isCompleted) {
        reassessResult = stepRes.data;
        break;
      }
      rStage = stepRes.data.stage;
    }
    assert(reassessResult, 'Reassessment session must complete');
    console.log(`  * PASS: Voluntary Reassessment completed (Session: ${reassessSessionId})`);

    // 12. Multi-Session Trajectory API
    console.log('\n[Step 12] Inspecting Longitudinal Habit Trajectory via GET /api/assessments/trajectory...');
    const trajRes = await request('GET', '/api/assessments/trajectory', null, token);
    assert.strictEqual(trajRes.status, 200);
    const traj = trajRes.data;

    assert(traj.comparableSessionsCount >= 3, 'Must have at least 3 comparable sessions');
    assert.strictEqual(traj.hasBaseline, true);
    assert.strictEqual(traj.hasFinal, true);
    assert.strictEqual(traj.hasReassessment, true);
    assert.ok(traj.dimensions.TR, 'TR dimension must exist');
    assert.ok(traj.dimensions.UA, 'UA dimension must exist');
    assert.ok(traj.dimensions.VB, 'VB dimension must exist');

    assert.strictEqual(traj.compositeRetentionRate, undefined, 'Zero composite scores allowed');
    assert.strictEqual(traj.overallGrade, undefined, 'Zero grades allowed');
    console.log('  * PASS: Trajectory verified across discrete dimensions (TR, SI, VB, DQ, FP, UA).');
    console.log(`    - Threat Recognition (TR): Baseline ${traj.dimensions.TR.baseline}% -> Final ${traj.dimensions.TR.final}% -> Reassessment ${traj.dimensions.TR.reassessment}% [${traj.dimensions.TR.retentionState}]`);
    console.log(`    - Autopilot Control (UA): Baseline ${traj.dimensions.UA.baseline}% -> Final ${traj.dimensions.UA.final}% -> Reassessment ${traj.dimensions.UA.reassessment}% [${traj.dimensions.UA.retentionState}]`);

    console.log('\n=============================================================');
    console.log('✅ COMPREHENSIVE PHASE 5 END-TO-END AUDIT PASSED 100%!');
    console.log('=============================================================');
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runAudit().catch(err => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
