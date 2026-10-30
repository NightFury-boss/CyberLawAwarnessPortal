/**
 * Cross-User Authorization & IDOR Security Test Suite
 * 
 * Verifies strict ownership isolation between independent authenticated users:
 * 1. User B cannot read or modify User A's assessment sessions (GET /session/:id, POST /submit-step).
 * 2. User B cannot access User A's remediation recommendations (GET /remediation/:id).
 * 3. User B cannot record pathway steps, view checkpoints, or submit reviews using User A's sourceSessionId.
 * 4. User B cannot perform habit reinforcement using User A's sourceSessionId.
 * 5. User Progress, Trajectory, and Defensive Portfolio strictly partition user records (zero leakage).
 * 6. Non-admin users are strictly forbidden (403) from accessing admin endpoints (/api/admin/*).
 * 7. Missing or invalid Bearer tokens are rejected (401).
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { getJwtSecret } = require('../config/productionSecurity');

const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const UserProgress = require('../models/UserProgress');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

const authRoutes = require('../routes/auth');
const simulationRoutes = require('../routes/simulations');
const progressRoutes = require('../routes/progress');
const adminRoutes = require('../routes/admin');
const quizRoutes = require('../routes/quizzes');

describe('Gate 2: Cross-User Authorization and IDOR Prevention', () => {
  let server;
  let baseUrl;
  let userA;
  let userB;
  let adminUser;
  let tokenA;
  let tokenB;
  let tokenAdmin;

  let sessionA;
  let inProgressSessionA;
  let dummyStageA;
  let dummyDecisionA;
  let dummyQuiz;

  before(async () => {
    await connectDB();

    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/assessments', simulationRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/quizzes', quizRoutes);

    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const timestamp = Date.now();
    userA = await User.create({
      fullName: 'User Alice (Victim)',
      email: `alice_${timestamp}@security-test.org`,
      passwordHash: 'dummy_hash_alice',
      role: 'user',
      isActive: true
    });

    userB = await User.create({
      fullName: 'User Bob (Attacker)',
      email: `bob_${timestamp}@security-test.org`,
      passwordHash: 'dummy_hash_bob',
      role: 'user',
      isActive: true
    });

    adminUser = await User.create({
      fullName: 'Admin Carol',
      email: `admin_${timestamp}@security-test.org`,
      passwordHash: 'dummy_hash_admin',
      role: 'admin',
      isActive: true
    });

    const secret = getJwtSecret();
    tokenA = jwt.sign({ id: userA._id, role: userA.role }, secret, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userB._id, role: userB.role }, secret, { expiresIn: '1h' });
    tokenAdmin = jwt.sign({ id: adminUser._id, role: adminUser.role }, secret, { expiresIn: '1h' });

    // Seed test scenario stage & decision
    const baselineScenario = await Scenario.findOne({ slug: 'baseline', version: 2 }) ||
      await Scenario.create({
        title: 'Security Test Baseline',
        slug: 'baseline',
        version: 2,
        status: 'published',
        estimatedMinutes: 10,
        configuredWeights: new Map([['Phishing', 50], ['Data Privacy', 50]])
      });

    dummyStageA = await ScenarioStage.create({
      scenarioId: baselineScenario._id,
      stageOrder: 1,
      title: 'Initial Stage',
      description: 'Stage description for test',
      mockInterfaceType: 'email',
      mockInterfaceData: {}
    });

    dummyDecisionA = await ScenarioDecision.create({
      stageId: dummyStageA._id,
      optionText: 'Cautious Response',
      isCorrect: true,
      explanation: 'Defensive check passed'
    });

    // 1. In-progress session owned by User A
    inProgressSessionA = await AssessmentSession.create({
      userId: userA._id,
      scenarioId: baselineScenario._id,
      scenarioCode: 'baseline',
      scenarioVersion: 2,
      currentStageId: dummyStageA._id,
      currentStageNumber: 1,
      status: 'in-progress',
      score: 50,
      expiresAt: new Date(Date.now() + 3600000),
      behaviourScores: new Map([
        ['recognition', 50],
        ['signalIdentification', 50],
        ['verification', 50],
        ['decisionQuality', 50],
        ['falsePositive', 50],
        ['unreviewedAcceptance', 50]
      ]),
      behaviourOpportunities: new Map([
        ['recognition', 5],
        ['signalIdentification', 5],
        ['verification', 5],
        ['decisionQuality', 5],
        ['falsePositive', 5],
        ['unreviewedAcceptance', 5]
      ])
    });

    // 2. Completed session owned by User A (with weak UA and VB)
    sessionA = await AssessmentSession.create({
      userId: userA._id,
      scenarioId: baselineScenario._id,
      scenarioCode: 'baseline',
      scenarioVersion: 2,
      currentStageId: dummyStageA._id,
      currentStageNumber: 13,
      status: 'completed',
      score: 55,
      expiresAt: new Date(Date.now() + 3600000),
      behaviourScores: new Map([
        ['recognition', 85],
        ['signalIdentification', 75],
        ['verification', 40],
        ['decisionQuality', 80],
        ['falsePositive', 90],
        ['unreviewedAcceptance', 33]
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
      startedAt: new Date(Date.now() - 7200000),
      completedAt: new Date(Date.now() - 3600000)
    });

    // 3. User Progress Profile for User A
    await UserProgress.create({
      userId: userA._id,
      completedModules: ['mod-1'],
      badgesEarned: ['First Step'],
      currentStreak: 3,
      completedPathways: [{
        pathwayId: 'pathway-autopilot-prevention',
        sourceSessionId: sessionA._id,
        completedAt: new Date(),
        checkpointScore: 100,
        currentStep: 3
      }],
      reinforcementsCompleted: [{
        pathwayId: 'pathway-autopilot-prevention',
        sourceSessionId: sessionA._id,
        sourceHabitState: 'continued_practice',
        completedAt: new Date(),
        checkpointScore: 100
      }]
    });

    // 4. Quiz attempt for User A
    dummyQuiz = await Quiz.create({
      title: 'Confidential Quiz',
      category: 'Phishing',
      difficulty: 'easy',
      timeLimitMinutes: 10,
      passingScorePercentage: 75
    });

    await QuizAttempt.create({
      userId: userA._id,
      quizId: dummyQuiz._id,
      score: 90,
      percentage: 90,
      passed: true,
      attemptNumber: 1,
      completedAt: new Date()
    });
  });

  after(async () => {
    if (userA) {
      await User.deleteMany({ _id: { $in: [userA._id, userB._id, adminUser._id] } });
      await AssessmentSession.deleteMany({ userId: { $in: [userA._id, userB._id] } });
      await UserProgress.deleteMany({ userId: { $in: [userA._id, userB._id] } });
      await QuizAttempt.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    }
    if (dummyStageA) {
      await ScenarioStage.deleteOne({ _id: dummyStageA._id });
    }
    if (dummyDecisionA) {
      await ScenarioDecision.deleteOne({ _id: dummyDecisionA._id });
    }
    if (dummyQuiz) {
      await Quiz.deleteOne({ _id: dummyQuiz._id });
    }
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  describe('1. Assessment Session Ownership Isolation', () => {
    test('User B cannot read User A in-progress assessment session (403 ACCESS_DENIED)', async () => {
      const res = await fetch(`${baseUrl}/api/assessments/session/${inProgressSessionA._id}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'ACCESS_DENIED');
    });

    test('User B cannot submit steps on User A assessment session (403 ACCESS_DENIED)', async () => {
      const res = await fetch(`${baseUrl}/api/assessments/submit-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          assessmentSessionId: inProgressSessionA._id,
          stageId: dummyStageA._id,
          decisionId: dummyDecisionA._id
        })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'ACCESS_DENIED');
    });

    test('User A can successfully read own assessment session (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/assessments/session/${inProgressSessionA._id}`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.sessionId, inProgressSessionA._id.toString());
    });
  });

  describe('2. Remediation & Pathway Ownership Isolation', () => {
    test('User B cannot fetch remediation for User A completed session (403 FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/assessments/remediation/${sessionA._id}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN');
    });

    test('User B cannot record pathway step using User A sourceSessionId (403 FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/progress/pathways/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          pathwayId: 'pathway-autopilot-prevention',
          sourceSessionId: sessionA._id,
          step: 'prevention',
          acknowledged: true
        })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN');
    });

    test('User B cannot fetch checkpoint using User A sourceSessionId (403 FORBIDDEN)', async () => {
      const res = await fetch(
        `${baseUrl}/api/progress/pathways/pathway-autopilot-prevention/checkpoint?sourceSessionId=${sessionA._id}`,
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN');
    });

    test('User B cannot submit checkpoint using User A sourceSessionId (403 FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/progress/pathways/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          pathwayId: 'pathway-autopilot-prevention',
          sourceSessionId: sessionA._id,
          answers: [{ questionId: 'q-autopilot-1', selectedOptionIndex: 0 }]
        })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN');
    });

    test('User B cannot execute habit reinforcement using User A sourceSessionId (403 FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/progress/pathways/reinforce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`
        },
        body: JSON.stringify({
          pathwayId: 'pathway-autopilot-prevention',
          sourceSessionId: sessionA._id,
          answers: [{ questionId: 'q-autopilot-1', selectedOptionIndex: 0 }]
        })
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'FORBIDDEN');
    });
  });

  describe('3. Defensive Portfolio & Trajectory Data Isolation', () => {
    test('User B portfolio does not contain any of User A records or quiz attempts', async () => {
      const res = await fetch(`${baseUrl}/api/progress/portfolio`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.deepEqual(data.interventions.completedPathways, []);
      assert.deepEqual(data.interventions.reinforcementsCompleted, []);
      assert.deepEqual(data.knowledgePractice.quizAttempts, []);
      assert.equal(data.behavioralTrajectory.comparableSessionsCount, 0);
    });

    test('User A portfolio returns all expected personal evidence records', async () => {
      const res = await fetch(`${baseUrl}/api/progress/portfolio`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.interventions.completedPathways.length, 1);
      assert.equal(data.interventions.reinforcementsCompleted.length, 1);
      assert.equal(data.knowledgePractice.quizAttempts.length, 1);
      assert.equal(data.knowledgePractice.quizAttempts[0].score, 90);
    });

    test('User B trajectory does not expose User A assessment sessions', async () => {
      const res = await fetch(`${baseUrl}/api/assessments/trajectory`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.comparableSessionsCount, 0);
      assert.equal(data.hasBaseline, false);
      assert.equal(data.baselineSessionId, null);
    });
  });

  describe('4. Role-Based Access Control on Admin Endpoints', () => {
    test('Non-admin User A is rejected with 403 on /api/admin/dashboard-summary', async () => {
      const res = await fetch(`${baseUrl}/api/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.message, /administrator privileges required/i);
    });

    test('Non-admin User A is rejected with 403 on /api/admin/analytics', async () => {
      const res = await fetch(`${baseUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.status, 403);
    });

    test('Non-admin User A is rejected with 403 on /api/admin/users-progress', async () => {
      const res = await fetch(`${baseUrl}/api/admin/users-progress`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.status, 403);
    });

    test('Admin user is authorized (200 OK) on /api/admin/dashboard-summary', async () => {
      const res = await fetch(`${baseUrl}/api/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      assert.equal(res.status, 200);
    });
  });

  describe('5. Unauthenticated and Malformed Token Ingress Controls', () => {
    test('Unauthenticated request to protected endpoint returns 401 token missing', async () => {
      const res = await fetch(`${baseUrl}/api/progress/portfolio`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.message, /token missing/i);
    });

    test('Request with forged or invalid Bearer token returns 401 token invalid', async () => {
      const res = await fetch(`${baseUrl}/api/progress/portfolio`, {
        headers: { Authorization: 'Bearer totally_fabricated_invalid_jwt_token_here' }
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.message, /token invalid/i);
    });
  });
});
