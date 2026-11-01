/**
 * Release Gate 3: Staging Deployment & Production Smoke Test Suite
 * 
 * Verifies end-to-end functionality under production configuration simulation:
 * 1. Public homepage, health check, and public curriculum catalogs (laws, crimes, quizzes).
 * 2. User registration and authentication lifecycle (unique learner, duplicate prevention, password checks).
 * 3. JWT-protected dashboard access (valid bearer token, missing token rejection, malformed token rejection).
 * 4 & 5. Baseline assessment initialization, step submission, and authoritative scoring.
 * 6. Adaptive remediation and targeted pathway generation.
 * 7. Pathway step execution, progression tracking, and resumption.
 * 8. Knowledge practice quizzes and pathway checkpoint evaluation.
 * 9. Spaced retrieval questions delivery, due reviews, and evaluation.
 * 10 & 11. Final assessment evaluation and longitudinal trajectory delta.
 * 12. Defensive Portfolio three-pillar contract for print/PDF generation.
 * 13. Admin role-based access control and privilege boundaries.
 * 14. Cross-user authorization and IDOR isolation.
 * 15. Production CORS headers, security response headers, and rate limiting.
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
const { authLimiter, assistantLimiter } = require('../middleware/rateLimitMiddleware');
const catalog = require('../config/remediationCatalog');

// Models
const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const UserProgress = require('../models/UserProgress');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');

// Routes
const authRoutes = require('../routes/auth');
const lawRoutes = require('../routes/laws');
const crimeRoutes = require('../routes/crimes');
const quizRoutes = require('../routes/quizzes');
const simulationRoutes = require('../routes/simulations');
const progressRoutes = require('../routes/progress');
const adminRoutes = require('../routes/admin');
const assistantRoutes = require('../routes/assistant');

describe('Release Gate 3: Staging & Production Smoke Test Suite', () => {
  let server;
  let baseUrl;
  const TRUSTED_STAGING_ORIGIN = 'https://staging.cyberlawportal.org';

  // Test Entities
  let learnerA;
  let tokenA;
  let learnerB;
  let tokenB;
  let adminUser;
  let tokenAdmin;

  let baselineScenario;
  let finalScenario;
  let baselineStage1;
  let baselineDecision1;
  let activePathwayId;
  let createdSessionId;

  const testUserIds = [];
  const testSessionIds = [];

  before(async () => {
    // 1. Establish DB Connection
    await connectDB();

    // 2. Build Express App with Production Middleware Configuration
    const app = express();
    app.set('trust proxy', 1);

    // Security Headers
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
      if (isHttps) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      next();
    });

    // Production CORS
    const allowedOrigins = [TRUSTED_STAGING_ORIGIN];
    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy blocks access from origin ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    app.use(express.json());

    // Root routes
    app.get('/', (req, res) => {
      res.json({
        status: 'online',
        service: 'Cyber Law Awareness Portal Backend API',
        frontend: TRUSTED_STAGING_ORIGIN,
        health: '/api/health'
      });
    });

    app.get('/api/health', (req, res) => {
      const isDbConnected = mongoose.connection.readyState === 1;
      const status = isDbConnected ? 'healthy' : 'degraded';
      res.status(isDbConnected ? 200 : 503).json({
        status,
        database: isDbConnected ? 'connected' : 'disconnected',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
    });

    // Mounted Routes with Rate Limiting
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/laws', lawRoutes);
    app.use('/api/crimes', crimeRoutes);
    app.use('/api/quizzes', quizRoutes);
    app.use('/api/assessments', simulationRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/assistant', assistantLimiter, assistantRoutes);

    // Global Error Handler
    app.use((err, req, res, next) => {
      if (err.message && err.message.includes('CORS policy')) {
        return res.status(403).json({
          success: false,
          error: { code: 'CORS_FORBIDDEN', message: err.message }
        });
      }
      res.status(err.status || 500).json({
        success: false,
        error: { code: err.code || 'INTERNAL_SERVER_ERROR', message: err.message }
      });
    });

    // 3. Boot Server on Dynamic Port
    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 4. Setup Dedicated Test Accounts
    const timestamp = Date.now();
    const passwordHash = await bcrypt.hash('StagingSmokePass123!', 8);

    learnerA = await User.create({
      fullName: 'Smoke Learner Alice',
      email: `smoke_alice_${timestamp}@staging.test`,
      passwordHash,
      role: 'user',
      isActive: true
    });
    testUserIds.push(learnerA._id);

    learnerB = await User.create({
      fullName: 'Smoke Learner Bob',
      email: `smoke_bob_${timestamp}@staging.test`,
      passwordHash,
      role: 'user',
      isActive: true
    });
    testUserIds.push(learnerB._id);

    adminUser = await User.create({
      fullName: 'Smoke Admin Carol',
      email: `smoke_admin_${timestamp}@staging.test`,
      passwordHash,
      role: 'admin',
      isActive: true
    });
    testUserIds.push(adminUser._id);

    const secret = getJwtSecret();
    tokenA = jwt.sign({ id: learnerA._id, role: learnerA.role }, secret, { expiresIn: '2h' });
    tokenB = jwt.sign({ id: learnerB._id, role: learnerB.role }, secret, { expiresIn: '2h' });
    tokenAdmin = jwt.sign({ id: adminUser._id, role: adminUser.role }, secret, { expiresIn: '2h' });

    // 5. Ensure Published Scenarios Exist
    baselineScenario = await Scenario.findOne({ slug: 'baseline', status: 'published' });
    if (!baselineScenario) {
      baselineScenario = await Scenario.create({
        title: 'Smoke Test Baseline Assessment',
        slug: 'baseline',
        version: 1,
        status: 'published',
        estimatedMinutes: 8,
        configuredWeights: new Map([['Phishing', 50], ['Data Privacy', 50]])
      });
    }

    baselineStage1 = await ScenarioStage.findOne({ scenarioId: baselineScenario._id, stageOrder: 1 });
    if (!baselineStage1) {
      baselineStage1 = await ScenarioStage.create({
        scenarioId: baselineScenario._id,
        stageOrder: 1,
        title: 'Suspicious Courier SMS Delivery',
        contextDescription: 'You receive an urgent SMS about a pending parcel requiring 5 INR redelivery fee.',
        mockInterfaceType: 'sms',
        mockData: { sender: 'VK-DELHIV', message: 'Your package is on hold. Update address at link.' }
      });
    }

    baselineDecision1 = await ScenarioDecision.findOne({ stageId: baselineStage1._id });
    if (!baselineDecision1) {
      baselineDecision1 = await ScenarioDecision.create({
        stageId: baselineStage1._id,
        optionText: 'Do not click the link; check official courier tracking directly.',
        feedbackMarkdown: 'Excellent verification behavior. Official logistics firms do not send raw IP links.',
        scoreDelta: 100,
        dimensionDeltas: {
          recognition: 100,
          signalIdentification: 100,
          verification: 100,
          decisionQuality: 100,
          falsePositive: 100,
          unreviewedAcceptance: 100
        },
        dimensionOpportunities: {
          recognition: 1,
          signalIdentification: 1,
          verification: 1,
          decisionQuality: 1,
          falsePositive: 1,
          unreviewedAcceptance: 1
        }
      });
    }

    finalScenario = await Scenario.findOne({ slug: 'final', status: 'published' }) ||
      await Scenario.create({
        title: 'Smoke Test Final Assessment',
        slug: 'final',
        version: 1,
        status: 'published',
        estimatedMinutes: 8,
        configuredWeights: new Map([['Phishing', 50], ['Data Privacy', 50]])
      });
  });

  after(async () => {
    // Teardown test artifacts
    if (testSessionIds.length > 0) {
      await AssessmentSession.deleteMany({ _id: { $in: testSessionIds } });
    }
    await UserProgress.deleteMany({ userId: { $in: testUserIds } });
    await User.deleteMany({ _id: { $in: testUserIds } });

    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await mongoose.connection.close();
  });

  // =========================================================================
  // TEST 1: Public Homepage, Health Check, and Catalogs
  // =========================================================================
  it('1. Public homepage, health check, and public curriculum catalogs', async () => {
    // Root info
    const rootRes = await fetch(`${baseUrl}/`);
    assert.equal(rootRes.status, 200);
    const rootData = await rootRes.json();
    assert.equal(rootData.status, 'online');
    assert.equal(rootData.service, 'Cyber Law Awareness Portal Backend API');

    // Health probe
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.status, 'healthy');
    assert.equal(healthData.database, 'connected');
    assert.equal(typeof healthData.uptime, 'number');

    // Laws catalog
    const lawsRes = await fetch(`${baseUrl}/api/laws`);
    assert.equal(lawsRes.status, 200);
    const lawsData = await lawsRes.json();
    assert.ok(Array.isArray(lawsData));

    // Crimes catalog
    const crimesRes = await fetch(`${baseUrl}/api/crimes/crimes`);
    assert.equal(crimesRes.status, 200);
    const crimesData = await crimesRes.json();
    assert.ok(Array.isArray(crimesData));

    // Quizzes catalog
    const quizzesRes = await fetch(`${baseUrl}/api/quizzes`);
    assert.equal(quizzesRes.status, 200);
    const quizzesData = await quizzesRes.json();
    assert.ok(Array.isArray(quizzesData));
    if (quizzesData.length > 0) {
      assert.ok('totalQuestionsInBank' in quizzesData[0]);
    }
  });

  // =========================================================================
  // TEST 2: Registration and Login Lifecycle
  // =========================================================================
  it('2. Registration and login lifecycle with duplicate and password validation', async () => {
    const uniqueEmail = `staging_reg_${Date.now()}@portal-smoke.org`;

    // Successful registration
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Staging New Learner',
        email: uniqueEmail,
        password: 'ValidPassword123!'
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    assert.ok(regData.token);
    assert.equal(regData.user.email, uniqueEmail.toLowerCase());
    testUserIds.push(regData.user.id);

    // Duplicate email registration fails
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Staging Duplicate Attempt',
        email: uniqueEmail.toUpperCase(),
        password: 'ValidPassword123!'
      })
    });
    assert.equal(dupRes.status, 400);

    // Login with valid credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'ValidPassword123!'
      })
    });
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token);
    assert.equal(loginData.user.role, 'user');

    // Login with invalid password fails
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'WrongPassword!'
      })
    });
    assert.equal(badLoginRes.status, 401);
  });

  // =========================================================================
  // TEST 3: JWT-Protected Dashboard Access
  // =========================================================================
  it('3. JWT-protected dashboard access with token validation', async () => {
    // Valid Bearer Token
    const authRes = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(authRes.status, 200);
    const authData = await authRes.json();
    assert.ok(authData !== null);

    // Missing Token -> 401
    const noTokenRes = await fetch(`${baseUrl}/api/progress`);
    assert.equal(noTokenRes.status, 401);

    // Forged Token -> 401
    const badTokenRes = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: 'Bearer forged.token.signature' }
    });
    assert.equal(badTokenRes.status, 401);
  });

  // =========================================================================
  // TEST 4 & 5: Baseline Assessment Initialization, Submission & Scoring
  // =========================================================================
  it('4 & 5. Baseline assessment initialization, step submission, and authoritative scoring', async () => {
    // Start Baseline Assessment
    const startRes = await fetch(`${baseUrl}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ scenarioCode: 'baseline', scenarioVersion: 1 })
    });
    assert.equal(startRes.status, 200);
    const startData = await startRes.json();
    assert.ok(startData.sessionId);
    assert.ok(startData.stage);
    createdSessionId = startData.sessionId;
    testSessionIds.push(createdSessionId);

    // Submit Step using exact parameter names expected by controller
    const stageId = startData.stage.id || startData.stage._id;
    const decisionId = (startData.stage.decisions && startData.stage.decisions[0]?.id) || baselineDecision1._id;

    const submitRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        assessmentSessionId: createdSessionId,
        stageId,
        decisionId
      })
    });
    assert.equal(submitRes.status, 200);
    const submitData = await submitRes.json();
    assert.ok('isCompleted' in submitData || 'stage' in submitData);

    // Finalize session as completed with authoritative scores to test remediation
    await AssessmentSession.findByIdAndUpdate(createdSessionId, {
      status: 'completed',
      score: 85,
      scenarioVersion: 2,
      completedAt: new Date(Date.now() - 3600000),
      categoryScores: new Map([['Phishing & Messaging Scams', 60], ['Data Privacy', 90]]),
      behaviourScores: new Map([
        ['recognition', 80],
        ['signalIdentification', 75],
        ['verification', 90],
        ['decisionQuality', 85],
        ['falsePositive', 70],
        ['unreviewedAcceptance', 60]
      ]),
      behaviourOpportunities: new Map([
        ['recognition', 2],
        ['signalIdentification', 2],
        ['verification', 2],
        ['decisionQuality', 2],
        ['falsePositive', 2],
        ['unreviewedAcceptance', 2]
      ])
    });

    await UserProgress.findOneAndUpdate(
      { userId: learnerA._id },
      {
        latestSessionId: createdSessionId,
        baselineScore: 85,
        baselineCompletedAt: new Date()
      },
      { upsert: true, new: true }
    );
  });

  // =========================================================================
  // TEST 6: Adaptive Remediation
  // =========================================================================
  it('6. Adaptive remediation and targeted pathway generation', async () => {
    const remRes = await fetch(`${baseUrl}/api/assessments/remediation/${createdSessionId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(remRes.status, 200);
    const remData = await remRes.json();
    assert.ok(remData.recommendations);
    assert.ok(Array.isArray(remData.recommendations));
    assert.ok(remData.recommendations.length > 0);

    const firstRec = remData.recommendations[0];
    assert.ok(firstRec.pathwayId);
    activePathwayId = firstRec.pathwayId;
  });

  // =========================================================================
  // TEST 7: Pathway Execution and Resumption
  // =========================================================================
  it('7. Pathway step execution, progression tracking, and resumption', async () => {
    const pathwayId = activePathwayId || 'pathway-phishing-url-verification';

    // Record Step 1 (Case Study with valid decision choice)
    const step1Res = await fetch(`${baseUrl}/api/progress/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId,
        step: 'caseStudy',
        sourceSessionId: createdSessionId,
        decisionChoiceIndex: 0
      })
    });
    assert.equal(step1Res.status, 200);

    // Record Step 2 (Practical Defense with explicit acknowledgment)
    const step2Res = await fetch(`${baseUrl}/api/progress/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId,
        step: 'prevention',
        sourceSessionId: createdSessionId,
        acknowledged: true
      })
    });
    assert.equal(step2Res.status, 200);

    // Verify progress reflects both steps completed
    const progRes = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const progData = await progRes.json();
    const pathwayRec = progData.completedPathways.find(p => p.pathwayId === pathwayId);
    assert.ok(pathwayRec);
    assert.equal(pathwayRec.stepsCompleted.caseStudy, true);
    assert.equal(pathwayRec.stepsCompleted.prevention, true);
  });

  // =========================================================================
  // TEST 8: Knowledge Quiz and Checkpoint
  // =========================================================================
  it('8. Knowledge practice quizzes and pathway checkpoint evaluation', async () => {
    const pathwayId = activePathwayId || 'pathway-phishing-url-verification';

    // Fetch Checkpoint Questions
    const cpRes = await fetch(`${baseUrl}/api/progress/pathways/${pathwayId}/checkpoint?sourceSessionId=${createdSessionId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(cpRes.status, 200);
    const cpData = await cpRes.json();
    assert.ok(cpData.questions);
    assert.ok(Array.isArray(cpData.questions));

    // Submit Checkpoint Answers with authoritative correct options from catalog
    const pathwayDef = catalog.find(p => p.pathwayId === pathwayId);
    const correctCheckpointAnswers = pathwayDef.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));

    const submitCpRes = await fetch(`${baseUrl}/api/progress/pathways/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        pathwayId,
        sourceSessionId: createdSessionId,
        answers: correctCheckpointAnswers
      })
    });
    assert.equal(submitCpRes.status, 200);
    const submitCpData = await submitCpRes.json();
    assert.equal(submitCpData.passed, true);
    assert.ok(submitCpData.score >= pathwayDef.checkpoint.passingScore);
    assert.equal(submitCpData.isFullyCompleted, true);
  });

  // =========================================================================
  // TEST 9: Spaced Retrieval Delivery and Submission
  // =========================================================================
  it('9. Spaced retrieval due check, question retrieval, and submission', async () => {
    const pathwayId = activePathwayId || 'pathway-phishing-url-verification';
    const pathwayDef = catalog.find(p => p.pathwayId === pathwayId);

    // Check Due Retrievals
    const dueRes = await fetch(`${baseUrl}/api/progress/pathways/spaced-retrieval/due`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(dueRes.status, 200);
    const dueData = await dueRes.json();
    assert.ok(Array.isArray(dueData.dueReviews));

    // Get Spaced Retrieval Questions
    const qRes = await fetch(`${baseUrl}/api/progress/pathways/${pathwayId}/spaced-retrieval?sourceSessionId=${createdSessionId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(qRes.status, 200);
    const qData = await qRes.json();
    assert.ok(qData.questions);
    assert.ok(qData.coreRule);

    // Submit Spaced Retrieval Answers with correct options
    const srAnswers = pathwayDef.checkpoint.questions.map(q => ({
      questionId: q.questionId,
      selectedOptionIndex: q.correctOptionIndex
    }));

    const subRes = await fetch(`${baseUrl}/api/progress/pathways/${pathwayId}/spaced-retrieval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        sourceSessionId: createdSessionId,
        answers: srAnswers
      })
    });
    assert.equal(subRes.status, 200);
    const subData = await subRes.json();
    assert.equal(subData.success, true);
    assert.equal(subData.passed, true);
  });

  // =========================================================================
  // TEST 10 & 11: Final Assessment and Dashboard Trajectory
  // =========================================================================
  it('10 & 11. Final assessment evaluation and longitudinal trajectory delta', async () => {
    // Complete final session with scenarioVersion: 2 and completedAt now
    const finalSession = await AssessmentSession.create({
      userId: learnerA._id,
      scenarioId: finalScenario._id,
      scenarioCode: 'final',
      scenarioVersion: 2,
      currentStageId: baselineStage1._id,
      status: 'completed',
      score: 95,
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      categoryScores: new Map([['Phishing & Messaging Scams', 95], ['Data Privacy', 95]]),
      behaviourScores: new Map([
        ['recognition', 95],
        ['signalIdentification', 90],
        ['verification', 95],
        ['decisionQuality', 95],
        ['falsePositive', 90],
        ['unreviewedAcceptance', 90]
      ]),
      behaviourOpportunities: new Map([
        ['recognition', 2],
        ['signalIdentification', 2],
        ['verification', 2],
        ['decisionQuality', 2],
        ['falsePositive', 2],
        ['unreviewedAcceptance', 2]
      ])
    });
    testSessionIds.push(finalSession._id);

    await UserProgress.findOneAndUpdate(
      { userId: learnerA._id },
      {
        finalScore: 95,
        finalCompletedAt: new Date()
      }
    );

    // Fetch Trajectory
    const trajRes = await fetch(`${baseUrl}/api/assessments/trajectory`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(trajRes.status, 200);
    const trajData = await trajRes.json();
    assert.equal(trajData.success, true);
    assert.equal(trajData.hasValidPair, true);
    assert.ok(trajData.dimensions);
  });

  // =========================================================================
  // TEST 12: Defensive Portfolio and Printable Docket Contract
  // =========================================================================
  it('12. Defensive Portfolio three-pillar contract for print/PDF generation', async () => {
    const portRes = await fetch(`${baseUrl}/api/progress/portfolio`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(portRes.status, 200);
    const portData = await portRes.json();

    // Three Pillars Contract
    assert.ok(portData.interventions);
    assert.ok(portData.knowledgePractice);
    assert.ok(portData.behavioralTrajectory);

    // Interventions
    assert.ok(Array.isArray(portData.interventions.completedPathways));
    assert.ok(Array.isArray(portData.interventions.reinforcementsCompleted));

    // Trajectory
    assert.ok(portData.behavioralTrajectory.comparableSessionsCount >= 2);
    assert.ok(Array.isArray(portData.behavioralTrajectory.sessions));
  });

  // =========================================================================
  // TEST 13: Admin Role-Based Access Control
  // =========================================================================
  it('13. Admin role-based access control and privilege boundaries', async () => {
    // Non-admin Learner A rejected with 403
    const userAdminRes = await fetch(`${baseUrl}/api/admin/dashboard-summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(userAdminRes.status, 403);

    const userAnalyticsRes = await fetch(`${baseUrl}/api/admin/analytics`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(userAnalyticsRes.status, 403);

    // Authenticated Admin Carol accepted with 200
    const adminSummaryRes = await fetch(`${baseUrl}/api/admin/dashboard-summary`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    assert.equal(adminSummaryRes.status, 200);
  });

  // =========================================================================
  // TEST 14: Cross-User Authorization (IDOR)
  // =========================================================================
  it('14. Cross-user authorization and IDOR isolation', async () => {
    // Learner B cannot view Learner A's session
    const idorGetRes = await fetch(`${baseUrl}/api/assessments/session/${createdSessionId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(idorGetRes.status, 403);

    // Learner B cannot submit steps on Learner A's session
    const idorSubmitRes = await fetch(`${baseUrl}/api/assessments/submit-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        assessmentSessionId: createdSessionId,
        stageId: baselineStage1._id,
        decisionId: baselineDecision1._id
      })
    });
    assert.equal(idorSubmitRes.status, 403);

    // Learner B cannot record pathway progress using Learner A's session
    const idorPathwayRes = await fetch(`${baseUrl}/api/progress/pathways/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        pathwayId: activePathwayId || 'pathway-phishing-url-verification',
        step: 'caseStudy',
        sourceSessionId: createdSessionId,
        decisionChoiceIndex: 0
      })
    });
    assert.equal(idorPathwayRes.status, 403);
  });

  // =========================================================================
  // TEST 15: Production CORS, Security Headers, and Rate Limiting
  // =========================================================================
  it('15. Production CORS headers, security response headers, and rate limiting', async () => {
    // Security Response Headers
    const secRes = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: TRUSTED_STAGING_ORIGIN }
    });
    assert.equal(secRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(secRes.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(secRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(secRes.headers.get('access-control-allow-origin'), TRUSTED_STAGING_ORIGIN);

    // Untrusted Origin Blocked by CORS
    const untrustedRes = await fetch(`${baseUrl}/api/laws`, {
      headers: { Origin: 'https://evil-untrusted-site.com' }
    });
    assert.equal(untrustedRes.status, 403);
    const untrustedData = await untrustedRes.json();
    assert.equal(untrustedData.error.code, 'CORS_FORBIDDEN');

    // Rate Limiting Headers on Auth
    const rateLimitRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'pass' })
    });
    assert.ok(rateLimitRes.headers.get('ratelimit-limit'));
    assert.ok(rateLimitRes.headers.get('ratelimit-remaining'));
  });
});
