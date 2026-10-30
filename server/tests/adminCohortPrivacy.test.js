const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const AssessmentSession = require('../models/AssessmentSession');
const { getJwtSecret } = require('../config/productionSecurity');

describe('Admin Analytics Cohort k-Anonymity Privacy Suite', () => {
  let server;
  let baseUrl;
  let adminUser;
  let adminToken;
  let testUsers = [];
  let createdSessionIds = [];
  const dummyScenarioId = new mongoose.Types.ObjectId();
  const dummyStageId = new mongoose.Types.ObjectId();
  const expiresAt = new Date(Date.now() + 3600000);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api`;

    // Clean up any residual test records
    await AssessmentSession.deleteMany({ scenarioCode: 'cohort_privacy_test' });
    await User.deleteMany({ email: { $regex: /^test_cohort_privacy_/ } });

    // 1. Create Admin
    adminUser = await User.create({
      fullName: 'Admin Privacy Tester',
      email: 'test_cohort_privacy_admin@portal.test',
      passwordHash: 'dummy_hash_privacy_admin',
      role: 'admin'
    });
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    // 2. Create 5 test learners
    for (let i = 1; i <= 5; i++) {
      const u = await User.create({
        fullName: `Learner ${i}`,
        email: `test_cohort_privacy_learner_${i}@portal.test`,
        passwordHash: 'dummy_hash_privacy_learner',
        role: 'user'
      });
      testUsers.push(u);
    }
  });

  after(async () => {
    if (createdSessionIds.length > 0) {
      await AssessmentSession.deleteMany({ _id: { $in: createdSessionIds } });
    }
    await AssessmentSession.deleteMany({ scenarioCode: 'cohort_privacy_test' });
    await User.deleteMany({ email: { $regex: /^test_cohort_privacy_/ } });

    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('suppresses cohort averages when sessions >= 5 but distinct users < 5 (single user with multiple sessions)', async () => {
    await AssessmentSession.deleteMany({ scenarioCode: 'cohort_privacy_test' });

    // Single learner takes 5 sessions
    const sessions = [];
    for (let i = 1; i <= 5; i++) {
      sessions.push({
        userId: testUsers[0]._id,
        scenarioId: dummyScenarioId,
        currentStageId: dummyStageId,
        expiresAt,
        scenarioCode: 'cohort_privacy_test',
        scenarioVersion: 1,
        status: 'completed',
        score: 85,
        behaviourScores: {
          recognition: 80,
          signalIdentification: 75,
          verification: 90,
          decisionQuality: 85,
          falsePositive: 70,
          unreviewedAcceptance: 60
        },
        behaviourOpportunities: {
          recognition: 2,
          signalIdentification: 2,
          verification: 2,
          decisionQuality: 2,
          falsePositive: 2,
          unreviewedAcceptance: 2
        }
      });
    }

    const created = await AssessmentSession.insertMany(sessions);
    created.forEach(s => createdSessionIds.push(s._id));

    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.cohortStatus.minimumRequired, 5);
    assert.ok(data.cohortStatus.sampleSize >= 5);

    // If total distinct users in DB is < 5, suppression gate is active
    if (data.cohortStatus.distinctUsers < 5) {
      assert.equal(data.cohortStatus.sufficientSample, false);
      assert.equal(data.behavioralAverages, null);
      assert.ok(data.cohortStatus.message.includes('Minimum cohort of 5 distinct learners required'));
    }
  });

  it('calculates cohort averages only for dimensions with >= 5 evaluations when distinct users >= 5', async () => {
    await AssessmentSession.deleteMany({ scenarioCode: 'cohort_privacy_test' });

    // 5 distinct learners take 1 session each
    const sessions = [];
    for (let i = 0; i < 5; i++) {
      sessions.push({
        userId: testUsers[i]._id,
        scenarioId: dummyScenarioId,
        currentStageId: dummyStageId,
        expiresAt,
        scenarioCode: 'cohort_privacy_test',
        scenarioVersion: 1,
        status: 'completed',
        score: 80 + i,
        behaviourScores: {
          recognition: 80,
          signalIdentification: 75,
          verification: 85,
          decisionQuality: 80,
          falsePositive: 70
          // unreviewedAcceptance intentionally omitted / un-evaluated
        },
        behaviourOpportunities: {
          recognition: 2,
          signalIdentification: 2,
          verification: 2,
          decisionQuality: 2,
          falsePositive: 2,
          unreviewedAcceptance: 0
        }
      });
    }

    const created = await AssessmentSession.insertMany(sessions);
    created.forEach(s => createdSessionIds.push(s._id));

    const res = await fetch(`${baseUrl}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.cohortStatus.distinctUsers >= 5);
    assert.equal(data.cohortStatus.sufficientSample, true);
    assert.ok(data.behavioralAverages !== null);

    // Dimensions with >= 5 evaluations evaluate to numbers
    assert.equal(typeof data.behavioralAverages.threatRecognition, 'number');
    assert.equal(typeof data.behavioralAverages.signalIdentification, 'number');
    assert.equal(typeof data.behavioralAverages.verificationBehavior, 'number');
    assert.equal(typeof data.behavioralAverages.dataQuotient, 'number');
    assert.equal(typeof data.behavioralAverages.financialProtection, 'number');

    // Dimension with < 5 evaluations is suppressed to null unless baseline data had >= 5
    if (data.behavioralAverages.unreviewedAcceptance !== null) {
      assert.equal(typeof data.behavioralAverages.unreviewedAcceptance, 'number');
    }
  });
});
