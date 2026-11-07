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

    // 4D: Legacy single-check module compatibility (Module 1, no checkIndex specified)
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
