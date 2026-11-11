/**
 * Stage 1: Backend Security Remediation Test Suite
 *
 * Strictly isolated against ephemeral in-memory MongoDB (MongoMemoryServer).
 * Zero reads of server/.env, zero connections to live development, staging, or
 * production databases.
 *
 * Covers:
 * 1. Seed system security (fail-closed production/remote/credential guards, no fallbacks, no prod demo user).
 * 2. Inactive-account protection across login, protect, adminOnly, and optionalProtect.
 * 3. Safe API error responses & credential/URI redaction in server logs.
 * 4. Admin CRUD allowlists, protected/unknown/immutable/invalid field guards, and authorization boundaries.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('node:child_process');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require(path.join(__dirname, '../node_modules/mongodb-memory-server'));

const {
  validateSeedAdminCredentials,
  validateSeedExecutionTarget
} = require('../config/seedSecurityGuard');
const {
  redactSensitiveText,
  classifySafeApiError,
  sendStructuredError,
  sendMessageError
} = require('../utils/apiErrorResponder');
const { getJwtSecret } = require('../config/productionSecurity');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const connectDB = require('../config/db');
const auditService = require('../services/auditService');
const { auditScenario } = require('../services/scenarioIntegrityService');
const { generateRemediation } = require('../services/remediationEngineService');
const Scenario = require('../models/Scenario');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const LegalSource = require('../models/LegalSource');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Resource = require('../models/Resource');
const LearningModule = require('../models/LearningModule');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const AdminAuditLog = require('../models/AdminAuditLog');

const authRoutes = require('../routes/auth');
const lawRoutes = require('../routes/laws');
const crimeRoutes = require('../routes/crimes');
const progressRoutes = require('../routes/progress');
const adminRoutes = require('../routes/admin');
const moduleRoutes = require('../routes/modules');

describe('Stage 1 P0 Security Remediation Verification', () => {
  let mongoServer;
  let server;
  let baseUrl;
  let mongoUri;

  let activeLearner;
  let inactiveLearner;
  let activeAdmin;
  let inactiveAdmin;

  let activeLearnerToken;
  let inactiveLearnerToken;
  let activeAdminToken;
  let inactiveAdminToken;
  let missingUserToken;

  let legalSource;
  let lawDoc;
  let crimeDoc;
  let caseDoc;
  let resourceDoc;
  let moduleDoc;
  let quizDoc;
  let questionDoc;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'stage1_security_test_secret_key_with_32_plus_chars_999';

    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.MONGO_URI_TEST = mongoUri;
    process.env.MONGODB_URI = mongoUri;

    await mongoose.connect(mongoUri, { family: 4 });

    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/laws', lawRoutes);
    app.use('/api/crimes', crimeRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/modules', moduleRoutes);

    // Route exercising global error handler behavior
    app.get('/api/test-unhandled-error', (req, res, next) => {
      const dbErr = new Error('MongoServerSelectionError: mongodb+srv://dbuser:TopSecretPass!@cluster0.internal/prod_db');
      dbErr.stack = 'Error: sensitive\n at internal (server/secret.js:1:1)';
      next(dbErr);
    });

    app.use((err, req, res, next) => {
      if (err.message && err.message.includes('CORS policy')) {
        return res.status(403).json({
          success: false,
          error: { code: 'CORS_FORBIDDEN', message: 'Access denied: Origin not allowed by CORS policy' }
        });
      }
      return sendStructuredError(res, err, {
        contextLabel: '[Test Global Handler]',
        defaultStatus: 500,
        defaultCode: 'INTERNAL_SERVER_ERROR',
        defaultMessage: 'An internal server error occurred.'
      });
    });

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    const passwordHash = await bcrypt.hash('Stage1TestPass#2026!', 10);
    activeLearner = await User.create({
      fullName: 'Active Learner',
      email: 'active.learner@stage1.test',
      passwordHash,
      role: 'user',
      isActive: true
    });
    await UserProgress.create({ userId: activeLearner._id, completedModules: [] });

    inactiveLearner = await User.create({
      fullName: 'Inactive Learner',
      email: 'inactive.learner@stage1.test',
      passwordHash,
      role: 'user',
      isActive: false
    });
    await UserProgress.create({ userId: inactiveLearner._id, completedModules: [] });

    activeAdmin = await User.create({
      fullName: 'Active Admin',
      email: 'active.admin@stage1.test',
      passwordHash,
      role: 'admin',
      isActive: true
    });

    inactiveAdmin = await User.create({
      fullName: 'Inactive Admin',
      email: 'inactive.admin@stage1.test',
      passwordHash,
      role: 'admin',
      isActive: false
    });

    const secret = getJwtSecret();
    activeLearnerToken = jwt.sign({ id: activeLearner._id }, secret, { expiresIn: '1h' });
    inactiveLearnerToken = jwt.sign({ id: inactiveLearner._id }, secret, { expiresIn: '1h' });
    activeAdminToken = jwt.sign({ id: activeAdmin._id }, secret, { expiresIn: '1h' });
    inactiveAdminToken = jwt.sign({ id: inactiveAdmin._id }, secret, { expiresIn: '1h' });
    missingUserToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, secret, { expiresIn: '1h' });

    legalSource = await LegalSource.create({
      title: 'IT Act Official Gazette',
      authority: 'Ministry of Law and Justice',
      url: 'https://www.indiacode.nic.in',
      sourceType: 'legislation'
    });

    lawDoc = await LawSection.create({
      sectionNumber: 'Section 66C',
      slug: 'in-it-66c',
      officialTitle: 'Identity Theft',
      plainLanguageExplanation: 'Using another person password or unique identification.',
      whyItMatters: 'Protects digital identity.',
      exampleScenario: 'Unauthorized OTP usage.',
      legalStatus: 'CURRENT',
      officialSourceId: legalSource._id
    });

    crimeDoc = await CyberCrime.create({
      title: 'Phishing Scam',
      slug: 'phishing-scam',
      category: 'Phishing',
      shortDescription: 'Deceptive links targeting credentials.',
      whatIsIt: 'Social engineering via spoofed messages.',
      howItWorks: 'Creates urgency to harvest login info.',
      published: true
    });

    caseDoc = await CaseStudy.create({
      title: 'Sample Phishing Incident',
      slug: 'sample-phishing-incident',
      caseNumber: 'CS-TEST-01',
      caseType: 'documented-case',
      incidentType: 'Phishing',
      attackVector: 'Email',
      shortDescription: 'Original case description.',
      seedBatchId: 'batch_test_immutable_01',
      published: true
    });

    resourceDoc = await Resource.create({
      title: 'National Cybercrime Portal',
      category: 'Government Resources',
      description: 'Official reporting channel.',
      link: 'https://cybercrime.gov.in',
      downloadable: false
    });

    moduleDoc = await LearningModule.create({
      title: 'Digital Hygiene Essentials',
      slug: 'digital-hygiene-essentials',
      category: 'Core Safety',
      summary: 'Original summary.',
      content: 'Original content.',
      published: true
    });

    quizDoc = await Quiz.create({
      title: 'Original Quiz Title',
      category: 'Phishing',
      description: 'Original quiz description',
      difficulty: 'Beginner',
      published: true
    });

    questionDoc = await QuizQuestion.create({
      questionId: 'QZ-IMMUTABLE-001',
      quizId: quizDoc._id,
      questionText: 'What should you verify before clicking?',
      options: ['Sender domain', 'Font color'],
      correctOptionIndex: 0,
      explanation: 'Verify domain authenticity.',
      category: 'Phishing',
      published: true
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // =========================================================================
  // 1. SEED SYSTEM SECURITY
  // =========================================================================
  describe('1. Seed System Hardening', () => {
    it('removes hardcoded admin fallback credentials and fails closed when missing or weak', () => {
      const seedSrc = fs.readFileSync(path.join(__dirname, '../config/seed.js'), 'utf8');
      assert.equal(seedSrc.includes('admin@cyberlawportal.test'), false, 'seed.js must not contain hardcoded fallback admin email');
      assert.equal(seedSrc.includes('AdminPass123!'), false, 'seed.js must not contain hardcoded fallback admin password');

      assert.throws(() => validateSeedAdminCredentials({}), /ADMIN_EMAIL/);
      assert.throws(() => validateSeedAdminCredentials({ ADMIN_EMAIL: 'admin@example.org', ADMIN_PASSWORD: '' }), /ADMIN_PASSWORD/);
      assert.throws(() => validateSeedAdminCredentials({ ADMIN_EMAIL: 'admin@example.org', ADMIN_PASSWORD: 'short' }), /at least 8 characters/);
      assert.throws(() => validateSeedAdminCredentials({ ADMIN_EMAIL: 'admin@example.org', ADMIN_PASSWORD: 'AdminPass123!' }), /known insecure\/default fallback/);
      assert.throws(
        () => validateSeedAdminCredentials({
          NODE_ENV: 'production',
          ADMIN_EMAIL: 'admin@cyberlawportal.test',
          ADMIN_PASSWORD: 'UniqueStrongSeedPassword!99'
        }),
        /placeholder/
      );
    });

    it('blocks production execution, remote unintended targets, missing URI fallbacks, and remote resets', () => {
      // Missing URI must not fall back to localhost:27017/cyber_law_portal
      assert.throws(() => validateSeedExecutionTarget({ env: { NODE_ENV: 'development' } }), /Missing explicit database URI/);

      // Production without explicit staging approval is blocked
      assert.throws(
        () => validateSeedExecutionTarget({
          env: {
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://user:Secret123!@cluster.mongodb.net/cyber_law_portal'
          }
        }),
        /production/i
      );

      // Remote host without ASSERT_STAGING_DB=true is blocked even in development
      assert.throws(
        () => validateSeedExecutionTarget({
          env: {
            NODE_ENV: 'development',
            MONGODB_URI: 'mongodb+srv://user:Secret123!@cluster.mongodb.net/cyber_law_staging'
          }
        }),
        /ASSERT_STAGING_DB=true/
      );

      // Remote reset is blocked even when NODE_ENV=development and ALLOW_DB_RESET=true
      assert.throws(
        () => validateSeedExecutionTarget({
          env: {
            NODE_ENV: 'development',
            ALLOW_DB_RESET: 'true',
            ASSERT_STAGING_DB: 'true',
            MONGODB_URI: 'mongodb+srv://user:Secret123!@cluster.mongodb.net/cyber_law_staging'
          },
          isReset: true
        }),
        /prohibited against remote/i
      );

      // Approved staging (production runtime + ASSERT_STAGING_DB=true + cyber_law_staging) disables demo users & redacts URI
      const stagingTarget = validateSeedExecutionTarget({
        env: {
          NODE_ENV: 'production',
          ASSERT_STAGING_DB: 'true',
          EXPECTED_STAGING_DB_NAME: 'cyber_law_staging',
          MONGODB_URI: 'mongodb+srv://user:VerySecretPass@cluster0.xxeclfp.mongodb.net/cyber_law_staging'
        },
        isReset: false
      });
      assert.equal(stagingTarget.allowDemoUser, false);
      assert.equal(stagingTarget.redactedUri.includes('VerySecretPass'), false);
      assert.match(stagingTarget.redactedUri, /mongodb\+srv:\/\/\*\*\*\*:\*\*\*\*@cluster0\.xxeclfp\.mongodb\.net\/cyber_law_staging/);
    });

    it('blocks direct seedReset.js execution outside local development & refuses remote targets in child process', () => {
      let exitStatus = 0;
      let combinedOutput = '';
      try {
        execFileSync(process.execPath, ['server/config/seedReset.js'], {
          cwd: path.resolve(__dirname, '../..'),
          env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            NODE_ENV: 'production',
            ALLOW_DB_RESET: 'true',
            MONGODB_URI: 'mongodb://127.0.0.1:27017/cyber_law_portal'
          },
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (err) {
        exitStatus = err.status;
        combinedOutput = `${err.stdout || ''}\n${err.stderr || ''}`;
      }
      assert.equal(exitStatus, 1);
      assert.match(combinedOutput, /\[DATABASE RESET SECURITY BLOCK\]/);
    });
  });

  // =========================================================================
  // 2. INACTIVE-ACCOUNT PROTECTION
  // =========================================================================
  describe('2. Inactive-Account Protection & Authentication', () => {
    it('allows active learner authentication and blocks admin routes with 403', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'active.learner@stage1.test', password: 'Stage1TestPass#2026!' })
      });
      assert.equal(loginRes.status, 200);
      const loginData = await loginRes.json();
      assert.equal(loginData.user.role, 'user');

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${activeLearnerToken}` }
      });
      assert.equal(meRes.status, 200);

      const adminRes = await fetch(`${baseUrl}/api/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${activeLearnerToken}` }
      });
      assert.equal(adminRes.status, 403);
    });

    it('allows active administrator authentication and grants admin access', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'active.admin@stage1.test', password: 'Stage1TestPass#2026!' })
      });
      assert.equal(loginRes.status, 200);
      const loginData = await loginRes.json();
      assert.equal(loginData.user.role, 'admin');

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${activeAdminToken}` }
      });
      assert.equal(meRes.status, 200);
    });

    it('rejects inactive learner on login and blocks pre-issued valid JWTs with generic 401', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'inactive.learner@stage1.test', password: 'Stage1TestPass#2026!' })
      });
      assert.equal(loginRes.status, 401);
      const loginBody = await loginRes.json();
      assert.equal(loginBody.message, 'Invalid credentials');

      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${inactiveLearnerToken}` }
      });
      assert.equal(meRes.status, 401);
      const meBody = await meRes.json();
      assert.equal(meBody.message, 'Not authorized');

      const progressRes = await fetch(`${baseUrl}/api/progress`, {
        headers: { Authorization: `Bearer ${inactiveLearnerToken}` }
      });
      assert.equal(progressRes.status, 401);

      // optionalProtect also rejects inactive user context
      const recRes = await fetch(`${baseUrl}/api/crimes/crimes/recommendations`, {
        headers: { Authorization: `Bearer ${inactiveLearnerToken}` }
      });
      assert.equal(recRes.status, 200);
      const recData = await recRes.json();
      assert.equal(recData.hasAssessment, false);
    });

    it('rejects inactive administrator on login and immediately revokes access across admin endpoints', async () => {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'inactive.admin@stage1.test', password: 'Stage1TestPass#2026!' })
      });
      assert.equal(loginRes.status, 401);

      for (const endpoint of ['/api/auth/me', '/api/admin/dashboard-summary', '/api/modules/admin/all']) {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          headers: { Authorization: `Bearer ${inactiveAdminToken}` }
        });
        assert.equal(res.status, 401, `Expected 401 for deactivated admin on ${endpoint}`);
      }

      // Direct adminOnly safeguard check if req.user were pre-populated with isActive=false
      let nextCalled = false;
      const mockRes = {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
      };
      adminOnly({ user: { _id: 'a', role: 'admin', isActive: false } }, mockRes, () => { nextCalled = true; });
      assert.equal(nextCalled, false);
      assert.equal(mockRes.statusCode, 401);
    });

    it('rejects deleted/missing users and invalid/expired JWTs', async () => {
      const missingRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${missingUserToken}` }
      });
      assert.equal(missingRes.status, 401);
      assert.equal((await missingRes.json()).message, 'Not authorized');

      const forgedRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid.jwt.token' }
      });
      assert.equal(forgedRes.status, 401);

      const expiredToken = jwt.sign({ id: activeLearner._id }, getJwtSecret(), { expiresIn: -10 });
      const expiredRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      assert.equal(expiredRes.status, 401);

      // Confirm protect accepts active learner and active admin
      let passedActive = false;
      const okMockRes = { status() { return this; }, json() { return this; } };
      await protect({ headers: { authorization: `Bearer ${activeLearnerToken}` } }, okMockRes, () => { passedActive = true; });
      assert.equal(passedActive, true);
    });
  });

  // =========================================================================
  // 3. SAFE API ERROR RESPONSES & LOG REDACTION
  // =========================================================================
  describe('3. Safe API Error Responses & Redaction', () => {
    it('redacts MongoDB URIs, Bearer JWTs and opaque tokens, bcrypt hashes, and secrets before logging', async () => {
      const raw = 'Failed at mongodb+srv://adminUser:SuperSecretPW!@cluster0.xxeclfp.mongodb.net/cyber_law_staging with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.sigValue123 and Authorization: Bearer opaque_api_secret_token_987! and hash $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy password=MyRawPassword!';
      const redacted = redactSensitiveText(raw);

      assert.equal(redacted.includes('SuperSecretPW!'), false);
      assert.equal(redacted.includes('adminUser'), false);
      assert.equal(redacted.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), false);
      assert.equal(redacted.includes('opaque_api_secret_token_987!'), false);
      assert.equal(redacted.includes('$2a$10$'), false);
      assert.equal(redacted.includes('MyRawPassword!'), false);
      assert.match(redacted, /mongodb\+srv:\/\/\*\*\*\*:\*\*\*\*@cluster0\.xxeclfp\.mongodb\.net/);
      assert.match(redacted, /Authorization:\s+Bearer\s+\[REDACTED_TOKEN\]/);

      // Verify scenarioIntegrityService.auditScenario redacts sensitive error text on failure
      const origFindById = Scenario.findById;
      Scenario.findById = () => {
        throw new Error('DB read failed at mongodb+srv://auditUser:SecretAudit99!@cluster0.internal/prod Bearer opaque_audit_token_xyz');
      };
      try {
        const auditRes = await auditScenario(new mongoose.Types.ObjectId().toString());
        assert.equal(auditRes.valid, false);
        assert.equal(auditRes.errors.length, 1);
        const joinedErr = auditRes.errors.join(' ');
        assert.equal(joinedErr.includes('SecretAudit99!'), false);
        assert.equal(joinedErr.includes('opaque_audit_token_xyz'), false);
        assert.match(joinedErr, /\*\*\*\*:\*\*\*\*@cluster0\.internal/);
      } finally {
        Scenario.findById = origFindById;
      }

      // Verify remediationEngineService.generateRemediation redacts warning logs if decision lookup fails
      const remScenario = await Scenario.create({
        title: 'Remediation Log Redaction Scenario',
        slug: 'baseline',
        description: 'Scenario fixture verifying redacted warning logs.',
        version: 2,
        status: 'published',
        estimatedMinutes: 5,
        configuredWeights: new Map([['Phishing', 100]])
      });
      const remSession = await AssessmentSession.create({
        userId: activeLearner._id,
        scenarioId: remScenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 2,
        scoringVersion: 2,
        currentStageId: new mongoose.Types.ObjectId(),
        status: 'completed',
        score: 90,
        startedAt: new Date(Date.now() - 60000),
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        behaviourScores: new Map([
          ['recognition', 95],
          ['signalIdentification', 95],
          ['verification', 95],
          ['decisionQuality', 95],
          ['falsePositive', 95],
          ['unreviewedAcceptance', 95]
        ]),
        behaviourEncounters: new Map([
          ['recognition', 4],
          ['signalIdentification', 4],
          ['verification', 4],
          ['decisionQuality', 4],
          ['falsePositive', 4],
          ['unreviewedAcceptance', 4]
        ])
      });

      const origDecFind = AssessmentDecision.find;
      const origWarn = console.warn;
      const capturedWarnings = [];
      console.warn = (...args) => capturedWarnings.push(args.map(String).join(' '));
      AssessmentDecision.find = () => {
        throw new Error('Decision read failure mongodb://remUser:RemSecretPW!@10.0.0.8:27017/prod Bearer opaque_rem_secret_token');
      };
      try {
        await generateRemediation(remSession._id.toString(), activeLearner._id.toString());
      } finally {
        AssessmentDecision.find = origDecFind;
        console.warn = origWarn;
        await AssessmentSession.deleteOne({ _id: remSession._id });
        await Scenario.deleteOne({ _id: remScenario._id });
      }
      assert.equal(capturedWarnings.length > 0, true);
      const warnJoined = capturedWarnings.join('\n');
      assert.equal(warnJoined.includes('RemSecretPW!'), false);
      assert.equal(warnJoined.includes('opaque_rem_secret_token'), false);
      assert.match(warnJoined, /\*\*\*\*:\*\*\*\*@10\.0\.0\.8:27017/);
    });

    it('never exposes raw DB error messages or stack traces on unhandled 500 HTTP responses', async () => {
      const unhandledRes = await fetch(`${baseUrl}/api/test-unhandled-error`);
      assert.equal(unhandledRes.status, 500);
      const unhandledBody = await unhandledRes.json();
      assert.equal(unhandledBody.success, false);
      assert.equal(unhandledBody.error.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(unhandledBody.error.message, 'An internal server error occurred.');
      assert.equal(JSON.stringify(unhandledBody).includes('TopSecretPass!'), false);
      assert.equal(JSON.stringify(unhandledBody).includes('server/secret.js'), false);

      // Direct unit check on message-shaped error responder
      const mockRes = {
        statusCode: 200,
        payload: null,
        status(c) { this.statusCode = c; return this; },
        json(p) { this.payload = p; return this; }
      };
      sendMessageError(
        mockRes,
        new Error('MongoNetworkError: failed connecting to mongodb://user:RawPass123@10.0.0.5:27017/prod'),
        { defaultMessage: 'Operation unavailable.' }
      );
      assert.equal(mockRes.statusCode, 500);
      assert.deepEqual(mockRes.payload, { success: false, message: 'Operation unavailable.' });
    });

    it('returns clean 400 validation errors for malformed JSON & Mongoose ValidationError without stack traces', async () => {
      const badJsonRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad-json'
      });
      assert.equal(badJsonRes.status, 400);
      const badJsonData = await badJsonRes.json();
      assert.equal(badJsonData.error.code, 'INVALID_JSON');

      const fakeValErr = {
        name: 'ValidationError',
        errors: { title: { message: 'Path `title` is required.' } }
      };
      const classified = classifySafeApiError(fakeValErr);
      assert.equal(classified.status, 400);
      assert.equal(classified.code, 'VALIDATION_ERROR');
      assert.match(classified.message, /title/i);
    });
  });

  // =========================================================================
  // 4. ADMIN UPDATE ENDPOINT HARDENING (ALLOWLISTS & MASS ASSIGNMENT)
  // =========================================================================
  describe('4. Hardened Administrator CRUD & Update Endpoints', () => {
    it('allows valid admin updates including serialized UI metadata clones across all content types', async () => {
      // Law update with UI-style cloned metadata (_id unchanged, populated officialSourceId object)
      const lawRes = await fetch(`${baseUrl}/api/admin/laws/${lawDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          _id: lawDoc._id.toString(),
          __v: 0,
          createdAt: lawDoc.createdAt,
          updatedAt: lawDoc.updatedAt,
          slug: lawDoc.slug,
          role: lawDoc.role,
          officialSourceId: { _id: legalSource._id.toString(), title: legalSource.title },
          officialTitle: 'Punishment for Identity Theft (Updated)'
        })
      });
      assert.equal(lawRes.status, 200);
      const updatedLaw = await lawRes.json();
      assert.equal(updatedLaw.officialTitle, 'Punishment for Identity Theft (Updated)');

      // Crime update
      const crimeRes = await fetch(`${baseUrl}/api/admin/crimes/${crimeDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          _id: crimeDoc._id.toString(),
          slug: crimeDoc.slug,
          shortDescription: 'Updated deceptive links description.',
          published: true
        })
      });
      assert.equal(crimeRes.status, 200);
      assert.equal((await crimeRes.json()).shortDescription, 'Updated deceptive links description.');

      // Case update preserving unchanged seedBatchId / slug / caseNumber
      const caseRes = await fetch(`${baseUrl}/api/admin/cases/${caseDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          _id: caseDoc._id.toString(),
          slug: caseDoc.slug,
          caseNumber: caseDoc.caseNumber,
          seedBatchId: caseDoc.seedBatchId,
          shortDescription: 'Updated case description.'
        })
      });
      assert.equal(caseRes.status, 200);
      assert.equal((await caseRes.json()).shortDescription, 'Updated case description.');

      // Resource update
      const resResp = await fetch(`${baseUrl}/api/admin/resources/${resourceDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ description: 'Updated official reporting channel.' })
      });
      assert.equal(resResp.status, 200);
      assert.equal((await resResp.json()).description, 'Updated official reporting channel.');

      // Module update
      const modResp = await fetch(`${baseUrl}/api/modules/admin/${moduleDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ slug: moduleDoc.slug, summary: 'Updated module summary.' })
      });
      assert.equal(modResp.status, 200);
      assert.equal((await modResp.json()).module.summary, 'Updated module summary.');
    });

    it('strips unknown fields without persisting them and rejects updates containing zero valid fields', async () => {
      const partialWithUnknown = await fetch(`${baseUrl}/api/admin/resources/${resourceDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          description: 'Safe update ignoring unknown',
          unknownInjectedFlag: true,
          internalRank: 999
        })
      });
      assert.equal(partialWithUnknown.status, 200);
      const dbResource = await Resource.findById(resourceDoc._id).lean();
      assert.equal(dbResource.description, 'Safe update ignoring unknown');
      assert.equal(dbResource.unknownInjectedFlag, undefined);
      assert.equal(dbResource.internalRank, undefined);

      const onlyUnknown = await fetch(`${baseUrl}/api/admin/crimes/${crimeDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ totallyUnknownField: 'foo' })
      });
      assert.equal(onlyUnknown.status, 400);
    });

    it('rejects protected fields, operator injection, prototype pollution keys, and unauthorized publication/status fields', async () => {
      const protectedPayloads = [
        { endpoint: `/api/admin/laws/${lawDoc._id}`, body: { userId: activeLearner._id.toString() } },
        { endpoint: `/api/admin/laws/${lawDoc._id}`, body: { published: true } },
        { endpoint: `/api/admin/crimes/${crimeDoc._id}`, body: { role: 'admin', shortDescription: 'ok' } },
        { endpoint: `/api/admin/crimes/${crimeDoc._id}`, body: { $set: { title: 'Hacked' } } },
        { endpoint: `/api/admin/resources/${resourceDoc._id}`, body: { published: true } },
        { endpoint: `/api/admin/resources/${resourceDoc._id}`, body: { status: 'archived' } },
        { endpoint: `/api/admin/cases/${caseDoc._id}`, body: { ownerId: activeAdmin._id.toString() } },
        { endpoint: `/api/modules/admin/${moduleDoc._id}`, body: { adminId: activeAdmin._id.toString() } }
      ];

      for (const testCase of protectedPayloads) {
        const res = await fetch(`${baseUrl}${testCase.endpoint}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
          body: JSON.stringify(testCase.body)
        });
        assert.equal(res.status, 400, `Expected 400 for protected payload on ${testCase.endpoint}: ${JSON.stringify(testCase.body)}`);
      }

      // Raw JSON prototype pollution key check
      const protoRes = await fetch(`${baseUrl}/api/admin/resources/${resourceDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: '{"description":"test","__proto__":{"polluted":true}}'
      });
      assert.equal(protoRes.status, 400);

      // Creating CaseStudy with seedBatchId is rejected
      const createSeedBatchRes = await fetch(`${baseUrl}/api/admin/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          title: 'Forged Batch Case',
          slug: 'forged-batch-case',
          caseNumber: 'CS-999',
          incidentType: 'Fraud',
          attackVector: 'SMS',
          shortDescription: 'Desc',
          seedBatchId: 'forged_batch'
        })
      });
      assert.equal(createSeedBatchRes.status, 400);
    });

    it('rejects attempts to modify immutable identifiers (_id, slug, caseNumber, seedBatchId, questionId, quizId)', async () => {
      const otherId = new mongoose.Types.ObjectId().toString();
      const immutableCases = [
        { endpoint: `/api/admin/laws/${lawDoc._id}`, body: { _id: otherId, officialTitle: 'x' } },
        { endpoint: `/api/admin/laws/${lawDoc._id}`, body: { slug: 'different-law-slug' } },
        { endpoint: `/api/admin/crimes/${crimeDoc._id}`, body: { slug: 'tampered-crime-slug' } },
        { endpoint: `/api/admin/cases/${caseDoc._id}`, body: { slug: 'tampered-case-slug' } },
        { endpoint: `/api/admin/cases/${caseDoc._id}`, body: { caseNumber: 'CS-NEW-999' } },
        { endpoint: `/api/admin/cases/${caseDoc._id}`, body: { seedBatchId: 'tampered_batch' } },
        { endpoint: `/api/modules/admin/${moduleDoc._id}`, body: { slug: 'tampered-module-slug' } },
        { endpoint: `/api/admin/quizzes/${quizDoc._id}/questions/${questionDoc._id}`, body: { questionId: 'QZ-HIJACK' } },
        { endpoint: `/api/admin/quizzes/${quizDoc._id}/questions/${questionDoc._id}`, body: { quizId: otherId } }
      ];

      for (const tc of immutableCases) {
        const res = await fetch(`${baseUrl}${tc.endpoint}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
          body: JSON.stringify(tc.body)
        });
        assert.equal(res.status, 400, `Expected 400 for immutable tamper ${JSON.stringify(tc.body)} on ${tc.endpoint}`);
      }

      // Verify original identifiers stayed untouched in MongoDB
      const freshCase = await CaseStudy.findById(caseDoc._id).lean();
      assert.equal(freshCase.slug, 'sample-phishing-incident');
      assert.equal(freshCase.caseNumber, 'CS-TEST-01');
      assert.equal(freshCase.seedBatchId, 'batch_test_immutable_01');
    });

    it('rejects invalid data types, schema enum violations, invalid IDs, and unsafe resource links', async () => {
      // Enum violation
      const badEnum = await fetch(`${baseUrl}/api/admin/laws/${lawDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ legalStatus: 'INVALID_STATUS_VALUE' })
      });
      assert.equal(badEnum.status, 400);

      // Type confusion / NoSQL object injection in string field
      const badType = await fetch(`${baseUrl}/api/admin/quizzes/${quizDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ title: { $ne: '' } })
      });
      assert.equal(badType.status, 400);

      // Unsafe javascript: URL in Resource
      const badUrl = await fetch(`${baseUrl}/api/admin/resources/${resourceDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ link: 'javascript:alert(1)' })
      });
      assert.equal(badUrl.status, 400);

      // Invalid ObjectId returns clean 400 instead of CastError 500
      const badId = await fetch(`${baseUrl}/api/admin/crimes/not-an-object-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ shortDescription: 'abc' })
      });
      assert.equal(badId.status, 400);
    });

    it('enforces authorization boundaries (401 unauth, 401 inactive admin, 403 ordinary user) on update routes', async () => {
      const endpoints = [
        `/api/admin/laws/${lawDoc._id}`,
        `/api/admin/crimes/${crimeDoc._id}`,
        `/api/admin/cases/${caseDoc._id}`,
        `/api/admin/resources/${resourceDoc._id}`,
        `/api/modules/admin/${moduleDoc._id}`
      ];

      for (const ep of endpoints) {
        const unauth = await fetch(`${baseUrl}${ep}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'NoAuth' })
        });
        assert.equal(unauth.status, 401);

        const learnerRes = await fetch(`${baseUrl}${ep}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeLearnerToken}` },
          body: JSON.stringify({ title: 'LearnerAttempt' })
        });
        assert.equal(learnerRes.status, 403);

        const deactivatedAdminRes = await fetch(`${baseUrl}${ep}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inactiveAdminToken}` },
          body: JSON.stringify({ title: 'DeactivatedAdminAttempt' })
        });
        assert.equal(deactivatedAdminRes.status, 401);
      }

      // Sanity check AdminAuditLog received no unauthenticated/learner audit entries
      const nonAdminLogs = await AdminAuditLog.find({ adminId: { $ne: activeAdmin._id } });
      assert.equal(nonAdminLogs.length, 0);
    });

    it('permits LawSection role creation and update while rejecting role on all other resource types', async () => {
      // Create LawSection with valid enum role
      const createLawRes = await fetch(`${baseUrl}/api/admin/laws`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          sectionNumber: 'DPDP Section 4',
          slug: 'in-dpdp-4-test',
          actName: 'Digital Personal Data Protection Act, 2023',
          officialTitle: 'Grounds for processing personal data',
          role: 'Data Protection',
          plainLanguageExplanation: 'Consent or legitimate use basis required.',
          whyItMatters: 'Regulates data fiduciaries.',
          exampleScenario: 'App collecting location without consent.',
          legalStatus: 'NOT_YET_IN_FORCE',
          officialSourceId: legalSource._id.toString()
        })
      });
      assert.equal(createLawRes.status, 201);
      const createdLaw = await createLawRes.json();
      assert.equal(createdLaw.role, 'Data Protection');

      // Update LawSection role cleanly
      const updateLawRes = await fetch(`${baseUrl}/api/admin/laws/${createdLaw._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ role: 'Sector Regulation' })
      });
      assert.equal(updateLawRes.status, 200);
      assert.equal((await updateLawRes.json()).role, 'Sector Regulation');

      // Other resources MUST continue rejecting role
      const forbiddenRoleTargets = [
        { ep: `/api/admin/crimes/${crimeDoc._id}`, method: 'PUT', body: { role: 'admin', shortDescription: 'ok' } },
        { ep: `/api/admin/cases/${caseDoc._id}`, method: 'PUT', body: { role: 'admin', shortDescription: 'ok' } },
        { ep: `/api/admin/resources/${resourceDoc._id}`, method: 'PUT', body: { role: 'admin', description: 'ok' } },
        { ep: `/api/modules/admin/${moduleDoc._id}`, method: 'PUT', body: { role: 'admin', summary: 'ok' } },
        { ep: `/api/admin/quizzes/${quizDoc._id}`, method: 'PUT', body: { role: 'admin', title: 'ok' } },
        { ep: `/api/admin/quizzes/${quizDoc._id}/questions/${questionDoc._id}`, method: 'PUT', body: { role: 'admin', explanation: 'ok' } }
      ];
      for (const tc of forbiddenRoleTargets) {
        const res = await fetch(`${baseUrl}${tc.ep}`, {
          method: tc.method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
          body: JSON.stringify(tc.body)
        });
        assert.equal(res.status, 400, `Expected 400 rejecting role on ${tc.ep}`);
      }
    });

    it('enforces strict URL allowlist across Resource links and nested CaseStudy sources', async () => {
      const unsafeUrls = [
        'java\tscript:alert(1)',
        '\u0000vbscript:msgbox(1)',
        'da\nta:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'blob:https://example.com/1234',
        '//evil.com/phishing',
        '/\\evil.com/redirect',
        'not a valid url'
      ];

      for (const badLink of unsafeUrls) {
        const res = await fetch(`${baseUrl}/api/admin/resources/${resourceDoc._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
          body: JSON.stringify({ link: badLink })
        });
        assert.equal(res.status, 400, `Expected 400 rejecting unsafe Resource link ${JSON.stringify(badLink)}`);

        const caseRes = await fetch(`${baseUrl}/api/admin/cases/${caseDoc._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
          body: JSON.stringify({
            sources: [{ title: 'Untrusted Source', authority: 'Test', url: badLink }]
          })
        });
        assert.equal(caseRes.status, 400, `Expected 400 rejecting unsafe CaseStudy source URL ${JSON.stringify(badLink)}`);
      }

      // Required Resource.link rejects blank/whitespace strings
      const blankResourceLink = await fetch(`${baseUrl}/api/admin/resources/${resourceDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ link: '   ' })
      });
      assert.equal(blankResourceLink.status, 400);

      // Valid HTTP, HTTPS, and single-leading-slash relative paths succeed + Resource metadata uses category
      for (const safeLink of ['http://example.org/guide', 'https://cybercrime.gov.in/help', '/resources/awareness-handbook.pdf']) {
        const okRes = await fetch(`${baseUrl}/api/admin/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
          body: JSON.stringify({
            title: `Safe Resource ${safeLink}`,
            category: 'Official Portals',
            description: 'Safe portal link.',
            link: safeLink
          })
        });
        assert.equal(okRes.status, 201, `Expected 201 accepting safe link ${safeLink}`);
        const created = await okRes.json();
        assert.equal(created.link, safeLink);

        const auditEntry = await AdminAuditLog.findOne({ entityId: created._id, entityType: 'Resource' }).lean();
        assert.equal(auditEntry?.metadata?.category, 'Official Portals');
      }

      const validCaseRes = await fetch(`${baseUrl}/api/admin/cases/${caseDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          sources: [{ title: 'SCI Record', authority: 'Supreme Court', url: 'https://main.sci.gov.in' }]
        })
      });
      assert.equal(validCaseRes.status, 200);
    });

    it('parses explicit string "false" accurately on quiz and question published flags', async () => {
      const createQuizRes = await fetch(`${baseUrl}/api/admin/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          title: 'Strict Bool Quiz',
          category: 'Phishing',
          difficulty: 'Beginner',
          published: 'false'
        })
      });
      assert.equal(createQuizRes.status, 201);
      const createdQuiz = await createQuizRes.json();
      assert.equal(createdQuiz.published, false);

      const createQRes = await fetch(`${baseUrl}/api/admin/quizzes/${createdQuiz._id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({
          questionText: 'Is HTTPS enough to prove legitimacy?',
          options: ['Yes', 'No'],
          correctOptionIndex: 1,
          explanation: 'Phishing sites also use HTTPS.',
          published: 'false'
        })
      });
      assert.equal(createQRes.status, 201);
      const createdQ = await createQRes.json();
      assert.equal(createdQ.published, false);

      const updateQRes = await fetch(`${baseUrl}/api/admin/quizzes/${createdQuiz._id}/questions/${createdQ._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ published: 'true' })
      });
      assert.equal(updateQRes.status, 200);
      assert.equal((await updateQRes.json()).published, true);

      const updateQuizFalse = await fetch(`${baseUrl}/api/admin/quizzes/${createdQuiz._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ published: 'false' })
      });
      assert.equal(updateQuizFalse.status, 200);
      assert.equal((await updateQuizFalse.json()).published, false);

      const badBoolRes = await fetch(`${baseUrl}/api/admin/quizzes/${createdQuiz._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeAdminToken}` },
        body: JSON.stringify({ published: 'not-a-boolean' })
      });
      assert.equal(badBoolRes.status, 400);
    });
  });

  // =========================================================================
  describe('5. Reverse DB Guard, Runtime Error Redaction & Audit Service Pipeline', () => {
    it('enforces reverse production database guard while preserving Render staging config', () => {
      // Unapproved production environment must reject staging/test targets and cluster-root defaults
      const rejectedTargets = [
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyber_law_staging',
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyberlaw_staging',
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyber_law_portal_staging',
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyber_law_test',
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/portal_staging_eu',
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/app_stage_2',
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/'
      ];

      for (const uri of rejectedTargets) {
        assert.throws(
          () => connectDB.assertDatabaseConnectionPolicy(uri, { NODE_ENV: 'production' }),
          /PRODUCTION DATABASE GUARD/
        );
      }

      // Partial/misconfigured staging env in production without ASSERT_STAGING_DB=true must reject
      assert.throws(
        () => connectDB.assertDatabaseConnectionPolicy(
          'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyber_law_staging',
          { NODE_ENV: 'production', EXPECTED_STAGING_DB_NAME: 'cyber_law_staging' }
        ),
        /ASSERT_STAGING_DB="true"/
      );

      // Legitimate production target without staging flags succeeds
      const prodAllowed = connectDB.assertDatabaseConnectionPolicy(
        'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyber_law_portal',
        { NODE_ENV: 'production' }
      );
      assert.equal(prodAllowed, null);

      // Render staging configuration (NODE_ENV=production + ASSERT_STAGING_DB=true + cyber_law_staging) stays allowed
      const renderStagingResult = connectDB.assertDatabaseConnectionPolicy(
        'mongodb+srv://stageUser:StagePass99!@cluster0.xxeclfp.mongodb.net/cyber_law_staging',
        {
          NODE_ENV: 'production',
          ASSERT_STAGING_DB: 'true',
          EXPECTED_STAGING_DB_NAME: 'cyber_law_staging'
        }
      );
      assert.equal(renderStagingResult.approved, true);
      assert.equal(renderStagingResult.dbName, 'cyber_law_staging');

      // Render staging misconfigured to production DB must still fail closed
      assert.throws(
        () => connectDB.assertDatabaseConnectionPolicy(
          'mongodb+srv://stageUser:StagePass99!@cluster0.xxeclfp.mongodb.net/cyber_law_portal',
          {
            NODE_ENV: 'production',
            ASSERT_STAGING_DB: 'true',
            EXPECTED_STAGING_DB_NAME: 'cyber_law_staging'
          }
        ),
        /STAGING DATABASE GUARD CRITICAL REJECTION/
      );

      // connectDB() entrypoint fails closed in NODE_ENV=production against staging target before mongoose.connect
      const childOut = execFileSync(
        process.execPath,
        [
          '-e',
          "const connectDB = require('./config/db'); connectDB().then(() => process.exit(2)).catch(err => { console.log(err.message); process.exit(0); });"
        ],
        {
          cwd: path.join(__dirname, '..'),
          env: {
            ...process.env,
            NODE_ENV: 'production',
            MONGODB_URI: 'mongodb+srv://prodUser:ProdPass99!@cluster0.prod.mongodb.net/cyber_law_staging',
            ASSERT_STAGING_DB: '',
            EXPECTED_STAGING_DB_NAME: ''
          },
          encoding: 'utf8'
        }
      );
      assert.match(childOut, /PRODUCTION DATABASE GUARD/);
      assert.equal(childOut.includes('ProdPass99!'), false);
    });

    it('redacts credentials and secrets from runtime Mongoose connection error listener logs', () => {
      connectDB.attachConnectionListeners();

      const origConsoleError = console.error;
      const captured = [];
      console.error = (...args) => captured.push(args.map(String).join(' '));

      try {
        mongoose.connection.emit(
          'error',
          new Error(
            'Runtime socket failure at mongodb+srv://dbAdmin:RuntimeSecretPW123!@cluster0.xxeclfp.mongodb.net/cyber_law_staging ' +
            'Bearer opaque_runtime_secret_tok password=LeakCheck123!'
          )
        );
      } finally {
        console.error = origConsoleError;
      }

      assert.equal(captured.length > 0, true);
      const output = captured.join('\n');
      assert.equal(output.includes('dbAdmin'), false);
      assert.equal(output.includes('RuntimeSecretPW123!'), false);
      assert.equal(output.includes('opaque_runtime_secret_tok'), false);
      assert.equal(output.includes('LeakCheck123!'), false);
      assert.match(output, /mongodb\+srv:\/\/\*\*\*\*:\*\*\*\*@cluster0\.xxeclfp\.mongodb\.net\/cyber_law_staging/);
      assert.match(output, /Bearer\s+\[REDACTED_TOKEN\]/);
    });

    it('redacts sensitive values inside auditService change strings, metadata, and descriptions', async () => {
      const sanitized = auditService.sanitizeChanges({
        note: 'Migrated from mongodb://auditAdmin:PlainSecret42!@10.0.0.9:27017/cyber_law_portal with Bearer opaque_tok_abc123',
        nested: {
          configSnippet: '{"password": "EmbeddedJsonSecret!", "token": "InlineTok999"}',
          list: [
            'password=InlineKeySecret9! ok-part',
            'api_key=TopApiKeySecret99!',
            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
          ]
        },
        password: 'SensitiveKeyPassword!'
      });

      const serialized = JSON.stringify(sanitized);
      assert.equal(serialized.includes('auditAdmin'), false);
      assert.equal(serialized.includes('PlainSecret42!'), false);
      assert.equal(serialized.includes('opaque_tok_abc123'), false);
      assert.equal(serialized.includes('EmbeddedJsonSecret!'), false);
      assert.equal(serialized.includes('InlineTok999'), false);
      assert.equal(serialized.includes('InlineKeySecret9!'), false);
      assert.equal(serialized.includes('TopApiKeySecret99!'), false);
      assert.equal(serialized.includes('$2b$10$'), false);
      assert.equal(sanitized.password, '[REDACTED_SENSITIVE_DATA]');
      assert.match(sanitized.note, /mongodb:\/\/\*\*\*\*:\*\*\*\*@10\.0\.0\.9:27017/);

      // End-to-end persistence via logAdminEvent redacts string values in action/description/changes/metadata
      const res = await auditService.logAdminEvent({
        adminId: activeAdmin._id,
        actionType: 'UPDATE',
        entityType: 'SystemSetting',
        action: 'Updated connection mongodb+srv://svcUser:TopActionSecret!@cluster0.net/db',
        description: 'Changed auth using Bearer service_opaque_secret_777',
        changes: { summary: 'Fallback secret=SuperSecretChangeValue!' },
        metadata: { detail: 'api_key=MetaKeySecret88!' }
      });
      assert.equal(res.success, true);

      const persisted = await AdminAuditLog.findById(res.logId).lean();
      const persistedJson = JSON.stringify(persisted);
      assert.equal(persistedJson.includes('TopActionSecret!'), false);
      assert.equal(persistedJson.includes('service_opaque_secret_777'), false);
      assert.equal(persistedJson.includes('SuperSecretChangeValue!'), false);
      assert.equal(persistedJson.includes('MetaKeySecret88!'), false);
    });

    it('routes moduleController successful admin CRUD events through auditService.logAdminEvent', async () => {
      const moduleControllerSrc = fs.readFileSync(
        path.join(__dirname, '../controllers/moduleController.js'),
        'utf8'
      );
      assert.equal(/AdminAuditLog\.create\s*\(/.test(moduleControllerSrc), false);
      assert.match(moduleControllerSrc, /auditService\.logAdminEvent\(/);

      const slug = `audit-routed-module-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/modules/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Stage1AuditTestAgent/1.0',
          Authorization: `Bearer ${activeAdminToken}`
        },
        body: JSON.stringify({
          title: 'Routed Audit Module',
          slug,
          category: 'Cyber Law Fundamentals',
          summary: 'Contains sensitive text mongodb://modUser:ModPass99!@localhost:27017/db that must be redacted',
          content: 'Module educational body content.'
        })
      });
      assert.equal(createRes.status, 201);
      const createdBody = await createRes.json();
      assert.equal(createdBody.success, true);
      const moduleId = createdBody.module._id;

      const createAudit = await AdminAuditLog.findOne({
        entityType: 'LearningModule',
        entityId: moduleId,
        actionType: 'CREATE'
      }).lean();
      assert.ok(createAudit);
      assert.equal(String(createAudit.adminId), String(activeAdmin._id));
      assert.equal(createAudit.metadata?.slug, slug);
      assert.equal(createAudit.metadata?.userAgent, 'Stage1AuditTestAgent/1.0');
      assert.equal(JSON.stringify(createAudit.changes).includes('ModPass99!'), false);

      const updateRes = await fetch(`${baseUrl}/api/modules/admin/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Stage1AuditTestAgent/1.0',
          Authorization: `Bearer ${activeAdminToken}`
        },
        body: JSON.stringify({ summary: 'Updated safe summary with Bearer tok_module_secret_123' })
      });
      assert.equal(updateRes.status, 200);

      const updateAudit = await AdminAuditLog.findOne({
        entityType: 'LearningModule',
        entityId: moduleId,
        actionType: 'UPDATE'
      }).lean();
      assert.ok(updateAudit);
      assert.equal(JSON.stringify(updateAudit.changes).includes('tok_module_secret_123'), false);

      const deleteRes = await fetch(`${baseUrl}/api/modules/admin/${moduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activeAdminToken}` }
      });
      assert.equal(deleteRes.status, 200);

      const deleteAudit = await AdminAuditLog.findOne({
        entityType: 'LearningModule',
        entityId: moduleId,
        actionType: 'DELETE'
      }).lean();
      assert.ok(deleteAudit);
      assert.equal(deleteAudit.metadata?.slug, slug);
    });
  });
});

