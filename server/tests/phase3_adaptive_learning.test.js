/**
 * Phase 3 Verification Suite: Adaptive Learning Experience & Interactive Checkpoints
 *
 * Verifies all 15 Phase 3 requirements:
 * 1. Recommendation eligibility
 * 2. Correct source-session association
 * 3. Correct mapping between behavioral deficits and learning pathways
 * 4. Case-study progression
 * 5. Prevention activity progression
 * 6. Server-authoritative checkpoint evaluation
 * 7. Failed checkpoint behavior
 * 8. Successful checkpoint completion
 * 9. Duplicate submission handling
 * 10. Interrupted pathway resumption
 * 11. Cross-user access rejection
 * 12. Historical completion preservation
 * 13. Curriculum and pathway progress separation
 * 14. No behavioral score mutation from learning completion
 * 15. No composite score exposure
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const catalog = require('../config/remediationCatalog');
const { generateRemediation, buildEvidenceGroundedExplanation } = require('../services/remediationEngineService');

const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const UserProgress = require('../models/UserProgress');
const LearningModule = require('../models/LearningModule');
const CaseStudy = require('../models/CaseStudy');

const simulationRoutes = require('../routes/simulations');
const progressRoutes = require('../routes/progress');

const TEST_PORT = 5993;
let server;
let userA;
let userB;
let tokenA;
let tokenB;
let sessionA;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/assessments', simulationRoutes);
  app.use('/api/progress', progressRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  const timestamp = Date.now();
  const secret = process.env.JWT_SECRET || 'test_jwt_secret_cyber_law_portal';

  userA = await User.create({
    fullName: `Learner Phase3 A ${timestamp}`,
    email: `learner_p3_a_${timestamp}@example.com`,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    role: 'user'
  });

  userB = await User.create({
    fullName: `Learner Phase3 B ${timestamp}`,
    email: `learner_p3_b_${timestamp}@example.com`,
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    role: 'user'
  });

  tokenA = jwt.sign({ id: userA._id }, secret, { expiresIn: '1h' });
  tokenB = jwt.sign({ id: userB._id }, secret, { expiresIn: '1h' });

  // Create baseline assessment session with specific deficit in Unreviewed Acceptance (UA)
  sessionA = await AssessmentSession.create({
    userId: userA._id,
    scenarioId: new mongoose.Types.ObjectId(),
    currentStageId: new mongoose.Types.ObjectId(),
    scenarioCode: 'baseline',
    scenarioVersion: 2,
    status: 'completed',
    score: 58,
    startedAt: new Date(Date.now() - 3600000),
    completedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    behaviourScores: new Map([
      ['recognition', 85],
      ['signalIdentification', 80],
      ['verification', 90],
      ['decisionQuality', 85],
      ['falsePositive', 90],
      ['unreviewedAcceptance', 25] // Deficit
    ]),
    behaviourOpportunities: new Map([
      ['recognition', 6],
      ['signalIdentification', 4],
      ['verification', 4],
      ['decisionQuality', 4],
      ['falsePositive', 4],
      ['unreviewedAcceptance', 4]
    ]),
    unreviewedAcceptanceMaxPenaltyPoints: 4,
    falsePositiveMaxPenaltyPoints: 4
  });

  console.log('[Setup] Test fixtures initialized successfully.');
}

async function teardown() {
  if (userA) await User.deleteOne({ _id: userA._id });
  if (userB) await User.deleteOne({ _id: userB._id });
  if (sessionA) await AssessmentSession.deleteOne({ _id: sessionA._id });
  await UserProgress.deleteMany({ userId: { $in: [userA?._id, userB?._id].filter(Boolean) } });

  if (server) server.close();
  await mongoose.disconnect();
}

async function request(method, urlPath, body = null, token = null) {
  const fetch = globalThis.fetch;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`http://localhost:${TEST_PORT}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('PHASE 3: ADAPTIVE LEARNING & INTERACTIVE CHECKPOINTS TEST SUITE');
  console.log('=============================================================\n');

  try {
    await setup();

    // 1. Recommendation eligibility
    console.log('[Test 1] Recommendation eligibility...');
    {
      const rem = await generateRemediation(sessionA._id, userA._id);
      assert.ok(rem.recommendations.length >= 1, 'Must produce at least one recommendation');
      const uaRec = rem.recommendations.find(r => r.pathwayId === 'pathway-ua-upi-consent');
      assert.ok(uaRec, 'Unreviewed Acceptance deficit must trigger pathway-ua-upi-consent');
      console.log('  * PASS: Recommendation eligibility accurately evaluated on completed session.');
    }

    // 2. Correct source-session association
    console.log('\n[Test 2] Correct source-session association...');
    {
      const nonExistentSession = new mongoose.Types.ObjectId();
      const res = await request('POST', '/api/progress/pathways/step', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: nonExistentSession,
        step: 'caseStudy',
        decisionChoiceIndex: 0
      }, tokenA);
      assert.strictEqual(res.status, 404, 'Must reject nonexistent session with 404');
      console.log('  * PASS: Source session strictly validated against existing database records.');
    }

    // 3. Correct mapping between behavioral deficits and learning pathways
    console.log('\n[Test 3] Mapping between behavioral deficits, pathways, and curriculum...');
    {
      const rem = await generateRemediation(sessionA._id, userA._id);
      const uaRec = rem.recommendations.find(r => r.pathwayId === 'pathway-ua-upi-consent');
      assert.strictEqual(uaRec.dimensionCode, 'UA');
      assert.strictEqual(uaRec.dimensionName, 'Unreviewed Acceptance Control');
      assert.ok(uaRec.observedBehaviorExplanation.length > 10);
      assert.ok(
        uaRec.observedBehaviorExplanation.includes('Granular decision evidence unavailable for this session'),
        'Must honestly indicate granular decision trail was unavailable for fixture session'
      );
      assert.ok(
        uaRec.observedBehaviorExplanation.includes('Evaluated from recorded 25% score across 4 opportunities'),
        'Must cite the recorded metric score and opportunity count'
      );
      assert.ok(uaRec.whyItMatters.length > 10);
      assert.ok(uaRec.curriculumLesson, 'Must map to connected curriculum module');
      assert.strictEqual(uaRec.curriculumLesson.slug, 'upi-qr-payment-fraud');

      // Evidence grounding boundary unit checks:
      const uaPathway = catalog.find(p => p.pathwayId === 'pathway-ua-upi-consent');
      const trPathway = catalog.find(p => p.pathwayId === 'pathway-tr-lure-detection');
      const maintPathway = catalog.find(p => p.pathwayId === 'pathway-maintenance-reinforcement');

      // 3A: Zero opportunities handling
      const zeroOppExpl = buildEvidenceGroundedExplanation(
        uaPathway,
        { metricKey: 'unreviewedAcceptance', normalizedScore: 0, opportunities: 0, opportunityFactor: 0 },
        sessionA,
        []
      );
      assert.strictEqual(
        zeroOppExpl,
        'Insufficient assessment evidence: zero opportunities were evaluated for this dimension in this session.'
      );

      // 3B: Populated decision evidence with high-risk penalty choice
      const populatedDecisions = [
        {
          stageTitle: 'Morning Banking SMS',
          optionText: 'Approve UPI Mandate Immediately',
          explanation: 'Approving an unsolicited mandate authorizes an immediate fund deduction without secondary review.',
          riskLevel: 'critical',
          isCriticalMistake: true,
          behaviorEffects: { unreviewedAcceptance: 2 }
        }
      ];
      const groundedExpl = buildEvidenceGroundedExplanation(
        uaPathway,
        { metricKey: 'unreviewedAcceptance', normalizedScore: 25, opportunities: 4, opportunityFactor: 1.0 },
        sessionA,
        populatedDecisions
      );
      assert.strictEqual(
        groundedExpl,
        'Observed in "Morning Banking SMS": You selected "Approve UPI Mandate Immediately". Approving an unsolicited mandate authorizes an immediate fund deduction without secondary review.'
      );

      // 3C: Positive metric deficit grounding
      const trDecisions = [
        {
          stageTitle: 'Suspicious Courier Tracking Email',
          optionText: 'Click link to update delivery address',
          explanation: 'The link redirected to an unverified third-party domain mimicking India Post.',
          riskLevel: 'high-risk',
          isCriticalMistake: false,
          measurementFocus: ['recognition'],
          behaviorEffects: { recognition: 0 }
        }
      ];
      const trGroundedExpl = buildEvidenceGroundedExplanation(
        trPathway,
        { metricKey: 'recognition', normalizedScore: 50, opportunities: 6, opportunityFactor: 1.0 },
        sessionA,
        trDecisions
      );
      assert.strictEqual(
        trGroundedExpl,
        'Observed in "Suspicious Courier Tracking Email": You selected "Click link to update delivery address". The link redirected to an unverified third-party domain mimicking India Post.'
      );

      // 3D: Maintenance pathway with verified vigilance
      const maintExpl = buildEvidenceGroundedExplanation(
        maintPathway,
        null,
        sessionA,
        populatedDecisions
      );
      assert.ok(maintExpl.startsWith('Demonstrated solid vigilance across all evaluated stages in your baseline assessment.'));

      console.log('  * PASS: Behavioral deficit correctly mapped to dimension UA and curriculum lesson upi-qr-payment-fraud.');
      console.log('  * PASS: Evidence-grounded explanations validated across zero-sample, populated decision, and maintenance cases.');
    }

    // 4. Case-study progression
    console.log('\n[Test 4] Case-study progression (Step 1)...');
    {
      const res = await request('POST', '/api/progress/pathways/step', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        step: 'caseStudy',
        decisionChoiceIndex: 1
      }, tokenA);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.stepsCompleted.caseStudy, true);
      assert.strictEqual(res.data.isFullyCompleted, false);
      assert.ok(res.data.educationalFeedback.length > 0);
      console.log('  * PASS: Step 1 (Case Study) successfully completed and persisted.');
    }

    // 5. Prevention activity progression
    console.log('\n[Test 5] Prevention activity progression (Step 2)...');
    {
      const res = await request('POST', '/api/progress/pathways/step', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        step: 'prevention',
        acknowledged: true
      }, tokenA);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.stepsCompleted.caseStudy, true);
      assert.strictEqual(res.data.stepsCompleted.prevention, true);
      assert.strictEqual(res.data.isFullyCompleted, false);
      console.log('  * PASS: Step 2 (Prevention Rule) acknowledged and persisted.');
    }

    // 6. Server-authoritative checkpoint evaluation
    console.log('\n[Test 6] Server-authoritative checkpoint evaluation...');
    {
      // Client tries to inject score: 100 and passed: true with wrong answers
      const res = await request('POST', '/api/progress/pathways/checkpoint', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        score: 100,
        passed: true,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 0 }, // Wrong (correct is 1)
          { questionId: 'chk-ua-2', selectedOptionIndex: 0 }, // Wrong (correct is 1)
          { questionId: 'chk-ua-3', selectedOptionIndex: 1 }  // Wrong (correct is 0)
        ]
      }, tokenA);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.passed, false, 'Client passed flag must be discarded');
      assert.strictEqual(res.data.score, 0, 'Server must calculate 0% for 3 wrong answers');
      assert.strictEqual(res.data.isFullyCompleted, false);
      console.log('  * PASS: Injected client scores discarded; server calculated 0% failed.');
    }

    // 7. Failed checkpoint behavior
    console.log('\n[Test 7] Failed checkpoint behavior...');
    {
      const res = await request('POST', '/api/progress/pathways/checkpoint', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 }, // Correct
          { questionId: 'chk-ua-2', selectedOptionIndex: 0 }, // Wrong
          { questionId: 'chk-ua-3', selectedOptionIndex: 1 }  // Wrong
        ]
      }, tokenA);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.passed, false);
      assert.strictEqual(res.data.score, 33);
      assert.strictEqual(res.data.isFullyCompleted, false);

      const prog = await UserProgress.findOne({ userId: userA._id });
      const pathwayRec = prog.completedPathways.find(p => p.pathwayId === 'pathway-ua-upi-consent');
      assert.strictEqual(pathwayRec.stepsCompleted.checkpointQuiz, false);
      assert.strictEqual(pathwayRec.completedAt, undefined);
      console.log('  * PASS: Score 33% (< 67%) leaves pathway incomplete without awarding completedAt.');
    }

    // 8. Successful checkpoint completion
    console.log('\n[Test 8] Successful checkpoint completion...');
    {
      const res = await request('POST', '/api/progress/pathways/checkpoint', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 }, // Correct
          { questionId: 'chk-ua-2', selectedOptionIndex: 1 }, // Correct
          { questionId: 'chk-ua-3', selectedOptionIndex: 0 }  // Correct
        ]
      }, tokenA);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.passed, true);
      assert.strictEqual(res.data.score, 100);
      assert.strictEqual(res.data.isFullyCompleted, true);
      assert.ok(res.data.completedAt !== null);

      const prog = await UserProgress.findOne({ userId: userA._id });
      const pathwayRec = prog.completedPathways.find(p => p.pathwayId === 'pathway-ua-upi-consent');
      assert.strictEqual(pathwayRec.stepsCompleted.checkpointQuiz, true);
      assert.ok(pathwayRec.completedAt);
      console.log('  * PASS: 100% score completes pathway and records authoritative timestamp.');
    }

    // 9. Duplicate submission handling (Idempotency)
    console.log('\n[Test 9] Duplicate submission handling...');
    {
      const res = await request('POST', '/api/progress/pathways/checkpoint', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        answers: [
          { questionId: 'chk-ua-1', selectedOptionIndex: 1 },
          { questionId: 'chk-ua-2', selectedOptionIndex: 1 },
          { questionId: 'chk-ua-3', selectedOptionIndex: 0 }
        ]
      }, tokenA);
      assert.strictEqual(res.status, 200);

      const prog = await UserProgress.findOne({ userId: userA._id });
      const records = prog.completedPathways.filter(p => p.pathwayId === 'pathway-ua-upi-consent' && p.sourceSessionId.toString() === sessionA._id.toString());
      assert.strictEqual(records.length, 1, 'Must maintain exactly one record');
      console.log('  * PASS: Duplicate submission is idempotent (1 pathway record retained).');
    }

    // 10. Interrupted pathway resumption
    console.log('\n[Test 10] Interrupted pathway resumption state...');
    {
      const prog = await UserProgress.findOne({ userId: userA._id });
      const rec = prog.completedPathways.find(p => p.pathwayId === 'pathway-ua-upi-consent');
      assert.strictEqual(rec.stepsCompleted.caseStudy, true);
      assert.strictEqual(rec.stepsCompleted.prevention, true);
      assert.strictEqual(rec.stepsCompleted.checkpointQuiz, true);
      assert.ok(rec.completedAt);
      console.log('  * PASS: Resumption state preserved across all three steps.');
    }

    // 11. Cross-user access rejection
    console.log('\n[Test 11] Cross-user access rejection (403)...');
    {
      // User B tries to record step on User A's session
      const res = await request('POST', '/api/progress/pathways/step', {
        pathwayId: 'pathway-ua-upi-consent',
        sourceSessionId: sessionA._id,
        step: 'caseStudy',
        decisionChoiceIndex: 0
      }, tokenB);
      assert.strictEqual(res.status, 403, 'Must reject with 403 Forbidden');
      console.log('  * PASS: Cross-user session access strictly rejected with 403 Forbidden.');
    }

    // 12. Historical completion preservation
    console.log('\n[Test 12] Historical completion preservation...');
    {
      const initialProg = await UserProgress.findOne({ userId: userA._id });
      const originalCompletedCount = initialProg.completedPathways.length;

      // Simulate a second session for user A with different deficit
      const sessionA2 = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: new mongoose.Types.ObjectId(),
        currentStageId: new mongoose.Types.ObjectId(),
        scenarioCode: 'final',
        scenarioVersion: 2,
        status: 'completed',
        score: 60,
        expiresAt: new Date(Date.now() + 86400000),
        behaviourScores: new Map([
          ['recognition', 90],
          ['signalIdentification', 85],
          ['verification', 20], // Deficit in VB
          ['decisionQuality', 85],
          ['falsePositive', 90],
          ['unreviewedAcceptance', 90]
        ]),
        behaviourOpportunities: new Map([
          ['recognition', 6],
          ['signalIdentification', 4],
          ['verification', 4],
          ['decisionQuality', 4],
          ['falsePositive', 4],
          ['unreviewedAcceptance', 4]
        ])
      });

      // Complete pathway for session A2
      await request('POST', '/api/progress/pathways/step', {
        pathwayId: 'pathway-vb-out-of-band',
        sourceSessionId: sessionA2._id,
        step: 'caseStudy',
        decisionChoiceIndex: 0
      }, tokenA);
      await request('POST', '/api/progress/pathways/step', {
        pathwayId: 'pathway-vb-out-of-band',
        sourceSessionId: sessionA2._id,
        step: 'prevention',
        acknowledged: true
      }, tokenA);
      await request('POST', '/api/progress/pathways/checkpoint', {
        pathwayId: 'pathway-vb-out-of-band',
        sourceSessionId: sessionA2._id,
        answers: [
          { questionId: 'chk-vb-1', selectedOptionIndex: 1 },
          { questionId: 'chk-vb-2', selectedOptionIndex: 0 },
          { questionId: 'chk-vb-3', selectedOptionIndex: 1 }
        ]
      }, tokenA);

      const updatedProg = await UserProgress.findOne({ userId: userA._id });
      assert.strictEqual(updatedProg.completedPathways.length, originalCompletedCount + 1);

      // Verify the original baseline completion record is 100% intact
      const origRec = updatedProg.completedPathways.find(p => p.sourceSessionId.toString() === sessionA._id.toString());
      assert.ok(origRec, 'Original session completion record must be preserved');
      assert.strictEqual(origRec.pathwayId, 'pathway-ua-upi-consent');

      await AssessmentSession.deleteOne({ _id: sessionA2._id });
      console.log('  * PASS: Historical pathway completion records preserved immutably across sessions.');
    }

    // 13. Curriculum and pathway progress separation
    console.log('\n[Test 13] Curriculum and pathway progress separation...');
    {
      const prog = await UserProgress.findOne({ userId: userA._id });
      // Completing pathway-ua-upi-consent must NOT automatically mark curriculum module upi-qr-payment-fraud complete
      const isCurriculumModuleCompleted = (prog.completedModules || []).includes('upi-qr-payment-fraud');
      assert.strictEqual(isCurriculumModuleCompleted, false, 'Curriculum module must not be marked complete simply by finishing pathway');
      console.log('  * PASS: Curriculum lesson progress and remediation pathway progress are tracked as distinct forms of evidence.');
    }

    // 14. No behavioral score mutation from learning completion
    console.log('\n[Test 14] Behavioral assessment score immutability...');
    {
      const reloadedSession = await AssessmentSession.findById(sessionA._id);
      const uaScore = reloadedSession.behaviourScores.get('unreviewedAcceptance');
      assert.strictEqual(uaScore, 25, 'Assessment session score must remain frozen at 25');
      assert.strictEqual(reloadedSession.score, 58, 'Composite score must remain frozen at 58');
      console.log('  * PASS: AssessmentSession scores remained 100% frozen after checkpoint completion.');
    }

    // 15. No composite score exposure
    console.log('\n[Test 15] Zero composite score exposure...');
    {
      const rem = await generateRemediation(sessionA._id, userA._id);
      assert.strictEqual(rem.compositeScore, undefined);
      assert.strictEqual(rem.overallGrade, undefined);
      assert.strictEqual(rem.averageScore, undefined);
      rem.recommendations.forEach(r => {
        assert.strictEqual(r.rawDeficit, undefined);
        assert.strictEqual(r.severityMultiplier, undefined);
        assert.strictEqual(r.priorityWeight, undefined);
      });
      console.log('  * PASS: Zero composite score or internal scoring weights exposed to client.');
    }

    console.log('\n=============================================================');
    console.log('✅ ALL 15 PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('=============================================================\n');
  } finally {
    await teardown();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
