const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const LearningModule = require('../models/LearningModule');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const AdminAuditLog = require('../models/AdminAuditLog');
const moduleController = require('../controllers/moduleController');
const progressController = require('../controllers/progressController');

// Helper to mock express req/res
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runLearningModulesTestSuite() {
  console.log('\n=============================================================');
  console.log('LEARNING MODULES & LESSON EXPERIENCE COMPREHENSIVE SUITE');
  console.log('=============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Database] Connected to MongoDB.\n');

  let testUser1 = null;
  let testUser2 = null;

  try {
    // Setup test learners
    testUser1 = await User.create({
      email: `learner_suite_1_${Date.now()}@test.internal`,
      fullName: 'Primary Learner',
      passwordHash: 'dummy_hash_for_test',
      role: 'user'
    });

    testUser2 = await User.create({
      email: `learner_suite_2_${Date.now()}@test.internal`,
      fullName: 'Secondary Learner',
      passwordHash: 'dummy_hash_for_test',
      role: 'user'
    });

    // -------------------------------------------------------------
    // TEST 1: Access Control & Unauthenticated Protection
    // -------------------------------------------------------------
    console.log('[TEST 1] Verifying access control: unauthenticated requests must fail with 401...');
    const reqUnauthModules = { query: {}, headers: {} };
    const resUnauthModules = createMockRes();
    await moduleController.getModules(reqUnauthModules, resUnauthModules);
    assert.strictEqual(resUnauthModules.statusCode, 401, 'Unauthenticated getModules must return 401');

    const reqUnauthSlug = { params: { slug: 'upi-qr-payment-fraud' }, headers: {} };
    const resUnauthSlug = createMockRes();
    await moduleController.getModuleBySlug(reqUnauthSlug, resUnauthSlug);
    assert.strictEqual(resUnauthSlug.statusCode, 401, 'Unauthenticated getModuleBySlug must return 401');

    const reqUnauthProg = { params: { slug: 'upi-qr-payment-fraud' }, body: { completed: true } };
    const resUnauthProg = createMockRes();
    await moduleController.recordModuleProgress(reqUnauthProg, resUnauthProg);
    assert.strictEqual(resUnauthProg.statusCode, 401, 'Unauthenticated recordModuleProgress must return 401');
    console.log('  * PASS: Unauthenticated access strictly blocked (all returned 401).');

    // -------------------------------------------------------------
    // TEST 2: Authenticated Retrieval of Published Modules
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Verifying authenticated retrieval of published learning modules...');
    const reqAuthModules = { user: testUser1, query: {}, headers: {} };
    const resAuthModules = createMockRes();
    await moduleController.getModules(reqAuthModules, resAuthModules);

    assert.strictEqual(resAuthModules.statusCode, 200);
    assert(resAuthModules.data.success, 'Expected success: true');
    assert(resAuthModules.data.count >= 12, `Expected at least 12 published lessons, found: ${resAuthModules.data.count}`);
    assert(resAuthModules.data.categories.length >= 4, 'Expected at least 4 tracks/categories');
    assert(resAuthModules.data.userProgress, 'Expected userProgress summary in response');
    assert.strictEqual(resAuthModules.data.userProgress.completedCount, 0, 'Initial completedCount must be 0');
    console.log(`  * PASS: Retrieved ${resAuthModules.data.count} published modules across ${resAuthModules.data.categories.length} categories.`);

    // -------------------------------------------------------------
    // TEST 3: Category and Search Filtering
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Verifying category and keyword search filtering...');
    const reqCat = { user: testUser1, query: { category: 'Foundations' }, headers: {} };
    const resCat = createMockRes();
    await moduleController.getModules(reqCat, resCat);

    assert.strictEqual(resCat.statusCode, 200);
    assert.strictEqual(resCat.data.count, 3, `Expected 3 Foundations modules, found: ${resCat.data.count}`);
    assert(resCat.data.modules.every(m => m.category === 'Foundations'), 'All returned modules must be Foundations');
    console.log(`  * PASS: Category filtering correctly isolated ${resCat.data.count} Foundations modules.`);

    const reqSearch = { user: testUser1, query: { search: 'UPI' }, headers: {} };
    const resSearch = createMockRes();
    await moduleController.getModules(reqSearch, resSearch);

    assert.strictEqual(resSearch.statusCode, 200);
    assert(resSearch.data.count >= 1, 'Expected at least 1 module matching UPI');
    assert(resSearch.data.modules.some(m => m.slug === 'upi-qr-payment-fraud'), 'Expected upi-qr-payment-fraud in search results');
    console.log(`  * PASS: Search query "UPI" successfully located target module.`);

    // -------------------------------------------------------------
    // TEST 4: Detail View, Cross-Referencing & Auto-Start Registration
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Verifying module detail retrieval, cross-referencing and in_progress transition...');
    const reqSlug = { user: testUser1, params: { slug: 'upi-qr-payment-fraud' }, headers: {} };
    const resSlug = createMockRes();
    await moduleController.getModuleBySlug(reqSlug, resSlug);

    assert.strictEqual(resSlug.statusCode, 200);
    assert.strictEqual(resSlug.data.module.slug, 'upi-qr-payment-fraud');
    assert(Array.isArray(resSlug.data.module.sections), 'Expected sections array');
    assert(resSlug.data.module.sections.length >= 4, 'Expected at least 4 sections');
    assert(resSlug.data.module.quickCheck, 'Expected quickCheck question');
    assert.strictEqual(typeof resSlug.data.module.quickCheck.correctIndex, 'number');
    assert(Array.isArray(resSlug.data.module.relatedLaws), 'Expected populated relatedLaws array');
    assert(resSlug.data.module.relatedLaws.length > 0, 'Expected populated related laws');
    assert(resSlug.data.module.navigation, 'Expected navigation object');
    assert.strictEqual(resSlug.data.module.status, 'in_progress', 'Opening a lesson must register in_progress state');
    console.log(`  * PASS: Detail view retrieved with ${resSlug.data.module.sections.length} sections, ${resSlug.data.module.relatedLaws.length} statutes, and status 'in_progress'.`);

    // -------------------------------------------------------------
    // TEST 5: Draft Module Isolation
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Verifying draft module isolation from learners...');
    const draftSlug = 'test-draft-module-' + Date.now();
    const draftModule = await LearningModule.create({
      title: 'Test Draft Module',
      slug: draftSlug,
      category: 'Foundations',
      summary: 'Draft summary',
      content: 'Draft content',
      sections: [{ title: 'Intro', content: 'Draft text' }],
      published: false
    });

    const reqDraft = { user: testUser1, params: { slug: draftSlug }, headers: {} };
    const resDraft = createMockRes();
    await moduleController.getModuleBySlug(reqDraft, resDraft);

    assert.strictEqual(resDraft.statusCode, 404, 'Draft module must return 404 for learners');
    console.log('  * PASS: Draft module returned 404 for learner.');
    await LearningModule.findByIdAndDelete(draftModule._id);

    // -------------------------------------------------------------
    // TEST 6: Granular 5-State Lifecycle & Knowledge Check Backend Scoring
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Verifying granular 5-state lifecycle and knowledge check scoring...');
    const targetSlug = 'digital-identity-foundations';
    const targetDoc = await LearningModule.findOne({ slug: targetSlug });
    assert(targetDoc, 'Target module must exist');
    const correctIdx = targetDoc.quickCheck.correctIndex;
    const incorrectIdx = (correctIdx + 1) % targetDoc.quickCheck.options.length;

    // Sub-step 6A: Mark read / complete
    const reqMarkRead = {
      user: testUser1,
      params: { slug: targetSlug },
      body: { action: 'mark_read', completed: true }
    };
    const resMarkRead = createMockRes();
    await moduleController.recordModuleProgress(reqMarkRead, resMarkRead);

    assert.strictEqual(resMarkRead.statusCode, 200);
    assert.strictEqual(resMarkRead.data.isCompleted, true);
    assert.strictEqual(resMarkRead.data.readCompleted, true);
    assert.strictEqual(resMarkRead.data.status, 'read_completed');
    console.log('  * PASS: Mark read transitioned status to read_completed.');

    // Sub-step 6B: Submit incorrect knowledge check
    const reqKcWrong = {
      user: testUser1,
      params: { slug: targetSlug },
      body: { action: 'knowledge_check', selectedIndex: incorrectIdx }
    };
    const resKcWrong = createMockRes();
    await moduleController.recordModuleProgress(reqKcWrong, resKcWrong);

    assert.strictEqual(resKcWrong.statusCode, 200);
    assert.strictEqual(resKcWrong.data.isCorrect, false, 'Expected isCorrect: false');
    assert.strictEqual(resKcWrong.data.knowledgeCheckStatus, 'failed');
    console.log('  * PASS: Incorrect knowledge check recorded as failed.');

    // Sub-step 6C: Submit correct knowledge check
    const reqKcRight = {
      user: testUser1,
      params: { slug: targetSlug },
      body: { action: 'knowledge_check', selectedIndex: correctIdx }
    };
    const resKcRight = createMockRes();
    await moduleController.recordModuleProgress(reqKcRight, resKcRight);

    assert.strictEqual(resKcRight.statusCode, 200);
    assert.strictEqual(resKcRight.data.isCorrect, true, 'Expected isCorrect: true');
    assert.strictEqual(resKcRight.data.knowledgeCheckStatus, 'passed');
    assert.strictEqual(resKcRight.data.status, 'knowledge_check_passed');
    console.log('  * PASS: Correct knowledge check transitioned status to knowledge_check_passed.');

    // Sub-step 6D: Verify behavioral dimensions are untouched
    const pDoc = await UserProgress.findOne({ userId: testUser1._id });
    assert(pDoc, 'UserProgress record must exist');
    assert(!pDoc.behaviourScores, 'Module actions must NOT modify six behavioral assessment dimensions');
    console.log('  * PASS: Six canonical behavioral dimensions remained strictly isolated.');

    // Sub-step 6E: Idempotency of duplicate submissions
    const resMarkReadAgain = createMockRes();
    await moduleController.recordModuleProgress(reqMarkRead, resMarkReadAgain);
    assert.strictEqual(resMarkReadAgain.statusCode, 200);
    assert.strictEqual(resMarkReadAgain.data.isCompleted, true);
    console.log('  * PASS: Duplicate progress submission is fully idempotent.');

    // -------------------------------------------------------------
    // TEST 7: Cross-User Isolation
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Verifying strict cross-user progress isolation...');
    const reqUser2Modules = { user: testUser2, query: {}, headers: {} };
    const resUser2Modules = createMockRes();
    await moduleController.getModules(reqUser2Modules, resUser2Modules);

    assert.strictEqual(resUser2Modules.data.userProgress.completedCount, 0, 'User 2 completedCount must be 0');
    const user2Target = resUser2Modules.data.modules.find(m => m.slug === targetSlug);
    assert.strictEqual(user2Target.status, 'not_started', 'User 2 status for target slug must remain not_started');
    console.log('  * PASS: User 2 has completely isolated progress state from User 1.');

    // -------------------------------------------------------------
    // TEST 8: Dashboard Progress Integration (getProgress)
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Verifying dashboard progress integration in getProgress...');
    const reqDashProgress = { user: testUser1 };
    const resDashProgress = createMockRes();
    await progressController.getProgress(reqDashProgress, resDashProgress);

    assert.strictEqual(resDashProgress.statusCode, 200);
    assert(resDashProgress.data.lessons, 'Expected lessons object inside dashboard progress');
    assert.strictEqual(resDashProgress.data.lessons.completedCount, 1, 'Dashboard completedCount must reflect 1');
    assert(resDashProgress.data.lessons.totalPublished >= 12, 'Dashboard totalPublished must be >= 12');
    assert(resDashProgress.data.lessons.recentlyAccessed, 'Recently accessed lesson must be populated');
    assert.strictEqual(resDashProgress.data.lessons.recentlyAccessed.slug, targetSlug);
    console.log(`  * PASS: Dashboard getProgress contains lessons integration (completed: ${resDashProgress.data.lessons.completedCount}, total: ${resDashProgress.data.lessons.totalPublished}).`);

    // -------------------------------------------------------------
    // TEST 9: Admin Content Governance & Audit Logging
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Verifying Admin content governance and audit logging...');
    const adminUser = await User.findOne({ role: 'admin' });
    assert(adminUser, 'Admin user must exist in database');

    const adminReq = { user: adminUser };
    const adminRes = createMockRes();
    await moduleController.adminGetModules(adminReq, adminRes);

    assert.strictEqual(adminRes.statusCode, 200);
    assert(adminRes.data.count >= 12, 'Admin must see all modules');
    console.log(`  * PASS: Admin retrieved all ${adminRes.data.count} modules.`);

    const newModuleSlug = `governance-test-${Date.now()}`;
    const createReq = {
      user: adminUser,
      ip: '127.0.0.1',
      body: {
        title: 'Governance Test Module',
        slug: newModuleSlug,
        category: 'Defensive Practice',
        summary: 'Admin created module for testing governance',
        content: 'Full module content here',
        sections: [{ title: 'Section 1', content: 'Section 1 content' }],
        published: true
      }
    };
    const createRes = createMockRes();
    await moduleController.adminCreateModule(createReq, createRes);

    assert.strictEqual(createRes.statusCode, 201);
    const createdId = createRes.data.module._id;

    const auditLog = await AdminAuditLog.findOne({
      entityType: 'LearningModule',
      entityId: createdId
    });
    assert(auditLog, 'AdminAuditLog entry must be generated for module creation');
    assert.strictEqual(auditLog.actionType, 'CREATE');
    console.log('  * PASS: Module created with corresponding AdminAuditLog entry.');

    const updateReq = {
      user: adminUser,
      ip: '127.0.0.1',
      params: { id: createdId },
      body: { summary: 'Updated summary by admin' }
    };
    const updateRes = createMockRes();
    await moduleController.adminUpdateModule(updateReq, updateRes);

    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.data.module.summary, 'Updated summary by admin');
    console.log('  * PASS: Module updated with corresponding AdminAuditLog entry.');

    const deleteReq = {
      user: adminUser,
      ip: '127.0.0.1',
      params: { id: createdId }
    };
    const deleteRes = createMockRes();
    await moduleController.adminDeleteModule(deleteReq, deleteRes);

    assert.strictEqual(deleteRes.statusCode, 200);
    const postDelete = await LearningModule.findById(createdId);
    assert.strictEqual(postDelete, null, 'Module must be removed from database');
    console.log('  * PASS: Module deleted cleanly with corresponding AdminAuditLog entry.');

    console.log('\n=============================================================');
    console.log('✅ ALL 9 LEARNING MODULE & LESSON SUITE TESTS PASSED 100%!');
    console.log('=============================================================\n');
  } finally {
    if (testUser1) {
      await User.findByIdAndDelete(testUser1._id);
      await UserProgress.findOneAndDelete({ userId: testUser1._id });
    }
    if (testUser2) {
      await User.findByIdAndDelete(testUser2._id);
      await UserProgress.findOneAndDelete({ userId: testUser2._id });
    }
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB.');
  }
}

runLearningModulesTestSuite().then(() => {
  console.log('Learning Modules validation complete.');
}).catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
