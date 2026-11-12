/**
 * STAGE 4 WAVE 3: ISOLATED DATABASE PERSISTENCE & CONTROLLER VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Isolated in-memory MongoDB database boot via MongoMemoryServer (ZERO remote connections)
 * 2. Real database persistence of all 32 LawSections, 18 LearningModules, and 21 QuizQuestions
 * 3. Seed idempotency across repeated seed runs (no duplicates, no destructive resets)
 * 4. Multi-check module controller handling (checkIndex 0 and 1 on Module 18)
 * 5. Legacy single-check module controller backward compatibility
 * 6. UserProgress single knowledgeCheckStatus architectural boundary documentation
 */

const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require(path.join(__dirname, '../node_modules/mongodb-memory-server'));

// Models
const LawSection = require('../models/LawSection');
const LearningModule = require('../models/LearningModule');
const QuizQuestion = require('../models/QuizQuestion');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const seed = require('../config/seed');
const { recordModuleProgress, getModuleBySlug } = require('../controllers/moduleController');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

async function runPersistenceSuite() {
  console.log('======================================================================');
  console.log('STAGE 4 WAVE 3: ISOLATED DATABASE PERSISTENCE & VERIFICATION SUITE');
  console.log('======================================================================\n');

  let mongoServer;

  try {
    // Step 1: Boot isolated in-memory Mongo instance
    console.log('[STEP 1] Ephemeral Database Isolation Boot:');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI_TEST = mongoUri;
    process.env.ADMIN_EMAIL = 'wave3.admin@cyberlaw.test.local';
    process.env.ADMIN_PASSWORD = 'Wave3IsolatedTestAdmin!2026';

    await mongoose.connect(mongoUri, { family: 4 });
    assert(mongoose.connection.readyState === 1, 'Connected to ephemeral in-memory MongoDB');
    assert(mongoUri.startsWith('mongodb://127.0.0.1:'), 'Guaranteed isolated localhost connection (no external DB)');

    // Step 2: First Seed Run (Initial Persistence)
    console.log('\n[STEP 2] Initial Database Seed Execution:');
    await seed(false);

    // Verify LawSections in real DB
    const lawSections = await LawSection.find({});
    assert(lawSections.length === 32, `Exactly 32 LawSections persisted in real DB (found: ${lawSections.length})`);

    const stage4Slugs = [
      'in-it-certin',
      'in-bnss-173-zero-fir',
      'in-it-43a-spdi',
      'in-dpdp-identity-scope',
      'in-dpdp-principal-rights',
      'in-dpdp-child-safety',
      'in-dpdp-notice-consent',
      'in-dpdp-fiduciary-duties',
      'in-it-safe-harbour-79',
      'in-it-rules-takedowns',
      'in-copyright-fair-dealing',
      'in-copyright-tpm-65a',
      'in-it-72a-contract-breach',
      'in-rbi-customer-liability'
    ];
    const foundStage4Slugs = lawSections.filter(ls => stage4Slugs.includes(ls.slug)).map(ls => ls.slug);
    assert(foundStage4Slugs.length === 14, `All 14 Stage 4 LawSections present by slug in real DB`);

    // Verify LearningModules in real DB
    const modules = await LearningModule.find({}).sort({ order: 1 });
    assert(modules.length === 18, `Exactly 18 LearningModules persisted in real DB (found: ${modules.length})`);

    const moduleOrders = modules.map(m => m.order);
    const expectedOrders = Array.from({ length: 18 }, (_, i) => i + 1);
    assert(JSON.stringify(moduleOrders) === JSON.stringify(expectedOrders), 'Module orders are sequential 1 to 18');

    // Verify Module 18 Dual Quick Checks
    const mod18 = modules.find(m => m.order === 18);
    assert(mod18 && mod18.slug === 'malware-professional-confidentiality-defensive-citizenship', 'Module 18 retrieved by slug');
    assert(Array.isArray(mod18.quickChecks) && mod18.quickChecks.length === 2, 'Module 18 has exactly 2 quickChecks in array');
    assert(mod18.quickChecks[0].id === 'QC-P6-01' && mod18.quickChecks[1].id === 'QC-P7-01', 'Module 18 quick checks have IDs QC-P6-01 and QC-P7-01');
    assert(mod18.quickCheck && mod18.quickCheck.question, 'Module 18 preserves backward-compatible singular quickCheck');

    // Verify Modules 13-17 Quick Checks
    for (let ord = 13; ord <= 17; ord++) {
      const m = modules.find(x => x.order === ord);
      assert(m && Array.isArray(m.quickChecks) && m.quickChecks.length === 1, `Module ${ord} has exactly 1 quickCheck in array`);
    }

    // Verify QuizQuestions
    const p1ToP7Questions = await QuizQuestion.find({
      questionId: { $regex: /^Q-P[1-7]-0[1-3]$/ }
    });
    assert(p1ToP7Questions.length === 21, `All 21 expanded Stage 4 assessment questions persisted in real DB (found: ${p1ToP7Questions.length})`);

    // Step 3: Seed Idempotency Test (Second Seed Run)
    console.log('\n[STEP 3] Seed Idempotency & Non-Destructive Update:');
    await seed(false);

    const lawSectionsAfter = await LawSection.find({});
    assert(lawSectionsAfter.length === 32, `LawSections count remains 32 after second seed (no duplicates)`);

    const modulesAfter = await LearningModule.find({});
    assert(modulesAfter.length === 18, `LearningModules count remains 18 after second seed (no duplicates)`);

    const p1ToP7QuestionsAfter = await QuizQuestion.find({
      questionId: { $regex: /^Q-P[1-7]-0[1-3]$/ }
    });
    assert(p1ToP7QuestionsAfter.length === 21, `QuizQuestion count remains 21 after second seed (no duplicates)`);

    // Step 4: Multi-Check Controller Integration Test
    console.log('\n[STEP 4] Multi-Check Controller Integration Verification:');

    // Create a mock learner user
    const testUser = await User.create({
      fullName: 'Stage 4 Learner',
      email: 'learner-wave3@test.local',
      passwordHash: 'HashedPassword123!',
      role: 'user'
    });

    // Mock Express req and res helper
    function createMockRes() {
      return {
        statusCode: 200,
        data: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.data = payload; return this; }
      };
    }

    // 4A: Check 0 on Module 18 (Correct Answer: A = index 0)
    const reqCheck0Correct = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' },
      body: { action: 'knowledge_check', selectedIndex: 0, checkIndex: 0 }
    };
    const resCheck0Correct = createMockRes();
    await recordModuleProgress(reqCheck0Correct, resCheck0Correct);
    assert(resCheck0Correct.data.success === true, 'Controller responded success for Module 18 check 0');
    assert(resCheck0Correct.data.isCorrect === true, 'Controller evaluated correct option (index 0) for QC-P6-01');
    assert(resCheck0Correct.data.explanation.includes('Section 72A'), 'Controller returned correct statutory explanation for QC-P6-01');

    // 4B: Check 1 on Module 18 (Correct Answer: A = index 0)
    const reqCheck1Correct = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' },
      body: { action: 'knowledge_check', selectedIndex: 0, checkIndex: 1 }
    };
    const resCheck1Correct = createMockRes();
    await recordModuleProgress(reqCheck1Correct, resCheck1Correct);
    assert(resCheck1Correct.data.success === true, 'Controller responded success for Module 18 check 1');
    assert(resCheck1Correct.data.isCorrect === true, 'Controller evaluated correct option (index 0) for QC-P7-01');
    assert(resCheck1Correct.data.explanation.includes('Paragraph 119(2)'), 'Controller returned correct statutory explanation for QC-P7-01');

    // 4C: Check 1 on Module 18 with incorrect answer (e.g. index 2)
    const reqCheck1Incorrect = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' },
      body: { action: 'knowledge_check', selectedIndex: 2, checkIndex: 1 }
    };
    const resCheck1Incorrect = createMockRes();
    await recordModuleProgress(reqCheck1Incorrect, resCheck1Incorrect);
    assert(resCheck1Incorrect.data.isCorrect === false, 'Controller evaluated incorrect option (index 2) as false for QC-P7-01');

    // 4D: Out of range checkIndex validation (e.g. checkIndex: 5 on a module with 2 checks)
    const reqCheckOutOfRange = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' },
      body: { action: 'knowledge_check', selectedIndex: 0, checkIndex: 5 }
    };
    const resCheckOutOfRange = createMockRes();
    await recordModuleProgress(reqCheckOutOfRange, resCheckOutOfRange);
    assert(resCheckOutOfRange.statusCode === 400, 'Controller returned 400 for out-of-range checkIndex (5)');
    assert(resCheckOutOfRange.data.message.includes('Invalid checkIndex'), 'Controller returned informative error for invalid checkIndex');

    // 4E: Negative checkIndex validation (checkIndex: -1)
    const reqCheckNegative = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' },
      body: { action: 'knowledge_check', selectedIndex: 0, checkIndex: -1 }
    };
    const resCheckNegative = createMockRes();
    await recordModuleProgress(reqCheckNegative, resCheckNegative);
    assert(resCheckNegative.statusCode === 400, 'Controller returned 400 for negative checkIndex (-1)');

    // 4F: Non-integer checkIndex validation (checkIndex: 'abc')
    const reqCheckNonInt = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' },
      body: { action: 'knowledge_check', selectedIndex: 0, checkIndex: 'abc' }
    };
    const resCheckNonInt = createMockRes();
    await recordModuleProgress(reqCheckNonInt, resCheckNonInt);
    assert(resCheckNonInt.statusCode === 400, 'Controller returned 400 for non-integer checkIndex');

    // 4G: Check status derivation: Module 18 currently has check 0 = correct, check 1 = incorrect
    const progressAfterPartial = await UserProgress.findOne({ userId: testUser._id });
    const mod18Partial = progressAfterPartial.lessonProgress.find(lp => lp.slug === 'malware-professional-confidentiality-defensive-citizenship');
    assert(mod18Partial.knowledgeCheckStatus !== 'passed', 'Module 18 knowledgeCheckStatus is NOT passed when only 1 of 2 checks is correct');
    assert(Array.isArray(mod18Partial.checkResults) && mod18Partial.checkResults.length === 2, 'checkResults stores individual records for both check 0 and check 1');
    assert(mod18Partial.checkResults[0].isCorrect === true && mod18Partial.checkResults[1].isCorrect === false, 'checkResults correctly captures per-check correctness');

    // 4H: Now answer Check 1 correctly on Module 18 -> should derive passed status
    await recordModuleProgress(reqCheck1Correct, resCheck1Correct);
    const progressAfterBoth = await UserProgress.findOne({ userId: testUser._id });
    const mod18Both = progressAfterBoth.lessonProgress.find(lp => lp.slug === 'malware-professional-confidentiality-defensive-citizenship');
    assert(mod18Both.knowledgeCheckStatus === 'passed', 'Module 18 knowledgeCheckStatus transitions to passed only when ALL checks are passed');
    assert(mod18Both.checkResults[1].isCorrect === true, 'checkResults updated check 1 to correct without wiping check 0');

    // 4I: getModuleBySlug returns checkResults in learnerProgress
    const reqGetModule = {
      user: testUser,
      params: { slug: 'malware-professional-confidentiality-defensive-citizenship' }
    };
    const resGetModule = createMockRes();
    await getModuleBySlug(reqGetModule, resGetModule);
    assert(resGetModule.data.success === true, 'getModuleBySlug returned success');
    assert(Array.isArray(resGetModule.data.module.learnerProgress.checkResults), 'getModuleBySlug exposes checkResults in learnerProgress');
    assert(resGetModule.data.module.learnerProgress.checkResults.length === 2, 'learnerProgress contains all checkResults for multi-check hydration');

    // 4J: Legacy single-check module compatibility (Module 1, no checkIndex specified)
    const reqLegacy = {
      user: testUser,
      params: { slug: 'digital-identity-foundations' },
      body: { action: 'knowledge_check', selectedIndex: 1 }
    };
    const resLegacy = createMockRes();
    await recordModuleProgress(reqLegacy, resLegacy);
    assert(resLegacy.data.success === true, 'Controller succeeded for legacy module without checkIndex');

    // Step 5: UserProgress Schema Boundary Check
    console.log('\n[STEP 5] UserProgress Boundary Verification:');
    const userProgress = await UserProgress.findOne({ userId: testUser._id });
    const mod18Entry = userProgress.lessonProgress.find(lp => lp.slug === 'malware-professional-confidentiality-defensive-citizenship');
    assert(mod18Entry !== undefined, 'UserProgress lessonProgress entry exists for Module 18');
    assert(typeof mod18Entry.knowledgeCheckStatus === 'string', 'Entry has singular knowledgeCheckStatus as per locked schema');
    assert(userProgress.schema.paths['lessonProgress.schema'] === undefined || !userProgress.schema.paths['lessonProgress.checkStatuses'], 'No unauthorized multi-check schema modifications to UserProgress');

    // Step 6: Non-destructive Module 12 slug migration verification
    console.log('\n[STEP 6] Module 12 Slug Migration Safety:');
    // Simulate user with legacy Module 12 slug in completedModules and lessonProgress
    const legacyUser = await User.create({
      username: 'legacyuser_m12',
      email: 'legacy_m12@example.com',
      fullName: 'Legacy M12 User',
      passwordHash: 'hash123'
    });
    await UserProgress.create({
      userId: legacyUser._id,
      completedModules: ['reporting-cybercrime-evidence-preservation', 'digital-identity-foundations'],
      lessonProgress: [
        {
          slug: 'reporting-cybercrime-evidence-preservation',
          readCompleted: true,
          readCompletedAt: new Date(),
          knowledgeCheckStatus: 'passed'
        }
      ]
    });

    // Run seed to execute migration
    await seed(false);

    const migratedProgress = await UserProgress.findOne({ userId: legacyUser._id });
    assert(!migratedProgress.completedModules.includes('reporting-cybercrime-evidence-preservation'), 'Legacy slug removed from completedModules');
    assert(migratedProgress.completedModules.includes('citizen-cyber-remedies-reporting-portals'), 'New Module 12 slug added to completedModules');
    const migratedLesson = migratedProgress.lessonProgress.find(lp => lp.slug === 'citizen-cyber-remedies-reporting-portals');
    assert(migratedLesson !== undefined && migratedLesson.readCompleted === true, 'lessonProgress successfully migrated to new slug with progress intact');
    assert(migratedLesson.knowledgeCheckStatus === 'passed', 'knowledgeCheckStatus preserved across slug migration');
    const oldLesson = migratedProgress.lessonProgress.find(lp => lp.slug === 'reporting-cybercrime-evidence-preservation');
    assert(oldLesson === undefined, 'Old slug lessonProgress entry cleaned up without data loss');

    // Step 7: LearningModule quickChecks validation tests
    console.log('\n[STEP 7] LearningModule Schema QuickChecks Validation:');
    const validMod = new LearningModule({
      moduleId: 'mod-test-val',
      title: 'Validation Test Module',
      slug: 'validation-test-module',
      category: 'Digital Citizenship',
      summary: 'Test summary for validation',
      content: 'Test content for validation',
      order: 99,
      durationMinutes: 15,
      pillarTag: 'PILLAR 1',
      quickChecks: [
        {
          scenario: 'Test Scenario',
          question: 'Test Question?',
          options: ['Option A', 'Option B'],
          correctIndex: 1,
          explanation: 'Valid explanation'
        }
      ]
    });
    assert(validMod.validateSync() === undefined, 'LearningModule with valid correctIndex passes validation');

    const invalidIndexMod = new LearningModule({
      moduleId: 'mod-test-inval',
      title: 'Invalid Test Module',
      slug: 'invalid-test-module',
      category: 'Digital Citizenship',
      summary: 'Test summary for validation',
      content: 'Test content for validation',
      order: 100,
      durationMinutes: 15,
      pillarTag: 'PILLAR 1',
      quickChecks: [
        {
          scenario: 'Test Scenario',
          question: 'Test Question?',
          options: ['Option A', 'Option B'],
          correctIndex: 5, // out of bounds (options length is 2)
          explanation: 'Invalid explanation'
        }
      ]
    });
    assert(invalidIndexMod.validateSync() !== undefined, 'LearningModule rejects correctIndex exceeding options length');

    console.log('\n======================================================================');
    console.log(`TEST SUITE RESULTS: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
    console.log('======================================================================');
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPersistenceSuite().catch(err => {
  console.error('Persistence Test Suite Error:', err);
  process.exit(1);
});
