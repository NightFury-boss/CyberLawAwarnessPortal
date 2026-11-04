/**
 * @file counterfactualEngine.test.js
 * @description Automated logic and state-transition tests for Stage 3 Wave 2: Counterfactual Scenario Studio.
 * 
 * Verifies:
 * 1. Branch selection transitions and choice validation.
 * 2. Explored-branch tracking and accumulation without duplication.
 * 3. Rewind state preservation (viewMode returns to junction, choice cleared, explored branches retained).
 * 4. Comparison eligibility and selective filtering (unlocked at >= 2 branches; shows ONLY explored branches).
 * 5. Completion conditions (strictly requires >= 1 branch explored AND reaching takeaway view).
 * 6. Storage adapter failure handling (Outcome A persistent write vs Outcome B in-memory fallback).
 * 7. Multi-tier isolation and static source-string import boundary across all Wave 2 files.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

async function runCounterfactualEngineSuite() {
  console.log('\n=============================================================');
  console.log('STAGE 3 WAVE 2: COUNTERFACTUAL ENGINE LOGIC VALIDATION');
  console.log('=============================================================');

  // Load ES Modules dynamically
  const enginePath = path.resolve(__dirname, '../../client/src/utils/counterfactualEngine.js');
  const storagePath = path.resolve(__dirname, '../../client/src/utils/counterfactualStorage.js');
  const fixturesPath = path.resolve(__dirname, '../../client/src/data/counterfactualScenarios.js');

  const engine = await import(pathToFileURL(enginePath).href);
  const storage = await import(pathToFileURL(storagePath).href);
  const fixtures = await import(pathToFileURL(fixturesPath).href);

  const scenario1 = fixtures.SCENARIO_1_MIDNIGHT_POWER_CUT_SMS;
  const scenario3 = fixtures.SCENARIO_3_APPROVE_PAYMENT_QR;

  // -------------------------------------------------------------
  // TEST 1: Initial Exploration State & Choice Selection
  // -------------------------------------------------------------
  console.log('\n[TEST 1] Verifying Initial State & Branch Selection...');
  const initial = engine.getInitialExplorationState();
  assert.strictEqual(initial.selectedChoiceId, null, 'Initial selectedChoiceId must be null');
  assert.deepStrictEqual(initial.exploredBranchIds, [], 'Initial exploredBranchIds must be empty');
  assert.strictEqual(initial.viewMode, 'junction', 'Initial viewMode must be junction');

  // Select Choice A
  const stateA = engine.selectChoice(initial, 'choice-power-compliance', scenario1);
  assert.strictEqual(stateA.selectedChoiceId, 'choice-power-compliance', 'selectedChoiceId must match chosen ID');
  assert.deepStrictEqual(stateA.exploredBranchIds, ['choice-power-compliance'], 'exploredBranchIds must contain chosen ID');
  assert.strictEqual(stateA.viewMode, 'timeline', 'viewMode must transition to timeline');

  // Selecting invalid choice ID must fail closed
  assert.throws(() => {
    engine.selectChoice(initial, 'invalid-nonexistent-choice', scenario1);
  }, /Invalid choiceId/, 'Must throw error on invalid choiceId');
  console.log('  * PASS: Initial state and choice selection transitions verified.');

  // -------------------------------------------------------------
  // TEST 2: Rewind State Preservation & Branch Accumulation
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Verifying Rewind State Preservation & Branch Accumulation...');
  // Rewind from Choice A
  const rewoundA = engine.rewindToJunction(stateA);
  assert.strictEqual(rewoundA.selectedChoiceId, null, 'selectedChoiceId must be cleared to null on rewind');
  assert.strictEqual(rewoundA.viewMode, 'junction', 'viewMode must return to junction on rewind');
  assert.deepStrictEqual(
    rewoundA.exploredBranchIds,
    ['choice-power-compliance'],
    'CRITICAL: exploredBranchIds must be preserved across rewinds'
  );

  // From rewound state, select Choice B
  const stateB = engine.selectChoice(rewoundA, 'choice-power-inaction', scenario1);
  assert.strictEqual(stateB.selectedChoiceId, 'choice-power-inaction');
  assert.deepStrictEqual(
    stateB.exploredBranchIds,
    ['choice-power-compliance', 'choice-power-inaction'],
    'exploredBranchIds must accumulate distinct visited branches'
  );

  // Selecting an already-explored branch again must not duplicate IDs
  const stateA_Again = engine.selectChoice(stateB, 'choice-power-compliance', scenario1);
  assert.deepStrictEqual(
    stateA_Again.exploredBranchIds,
    ['choice-power-compliance', 'choice-power-inaction'],
    'Must not duplicate branch IDs in exploredBranchIds'
  );
  console.log('  * PASS: Rewind state preservation and accumulation verified.');

  // -------------------------------------------------------------
  // TEST 3: Comparison Gating & Selective Projection
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Verifying Comparison Gating & Selective Projection...');
  // With 1 branch explored -> blocked
  assert.strictEqual(engine.canUnlockComparison(['choice-1']), false, 'Comparison must be locked with 1 branch');
  const blockedComparison = engine.openComparisonView({
    selectedChoiceId: 'choice-1',
    exploredBranchIds: ['choice-1'],
    viewMode: 'timeline'
  });
  assert.strictEqual(blockedComparison.viewMode, 'timeline', 'View mode must not change when comparison is locked');

  // With 2 branches explored -> unlocked
  assert.strictEqual(engine.canUnlockComparison(['choice-1', 'choice-2']), true, 'Comparison must unlock with 2 branches');
  const unlockedComparison = engine.openComparisonView({
    selectedChoiceId: 'choice-1',
    exploredBranchIds: ['choice-power-compliance', 'choice-power-verification'],
    viewMode: 'timeline'
  });
  assert.strictEqual(unlockedComparison.viewMode, 'comparison', 'View mode must change to comparison when unlocked');

  // Selective filtering: Projection must contain ONLY explored branches
  const filtered = engine.getComparisonBranches(
    ['choice-power-compliance', 'choice-power-verification'],
    scenario1
  );
  assert.strictEqual(filtered.length, 2, 'Filtered projection must contain exactly 2 choices');
  assert(filtered.some(c => c.id === 'choice-power-compliance'), 'Must contain choice-power-compliance');
  assert(filtered.some(c => c.id === 'choice-power-verification'), 'Must contain choice-power-verification');
  assert(!filtered.some(c => c.id === 'choice-power-inaction'), 'CRITICAL: Must NOT contain unexplored choice-power-inaction');
  console.log('  * PASS: Comparison gating and selective projection verified.');

  // -------------------------------------------------------------
  // TEST 4: Completion Contract & Gating Logic
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Verifying Completion Gating Logic...');
  // Reaching takeaway with 0 branches explored -> FALSE
  assert.strictEqual(
    engine.canCompleteScenario([], 'takeaway'),
    false,
    'Cannot complete scenario with 0 explored branches'
  );

  // Exploring branches but staying at junction or timeline -> FALSE
  assert.strictEqual(
    engine.canCompleteScenario(['choice-1'], 'junction'),
    false,
    'Cannot complete scenario while at junction view'
  );
  assert.strictEqual(
    engine.canCompleteScenario(['choice-1'], 'timeline'),
    false,
    'Cannot complete scenario while at timeline view'
  );

  // Exploring >= 1 branch AND reaching takeaway -> TRUE
  assert.strictEqual(
    engine.canCompleteScenario(['choice-1'], 'takeaway'),
    true,
    'Must complete scenario when >= 1 branch explored and takeaway view reached'
  );
  assert.strictEqual(
    engine.canCompleteScenario(['choice-1', 'choice-2'], 'takeaway'),
    true,
    'Must complete scenario when multiple branches explored and takeaway view reached'
  );
  console.log('  * PASS: Completion gating conditions verified.');

  // -------------------------------------------------------------
  // TEST 5: Storage Adapter Resilience (Outcome A vs Outcome B)
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Verifying Storage Adapter Resilience...');

  // Helper to create an isolated mock localStorage
  function createMockLocalStorage(options = {}) {
    const store = new Map();
    return {
      getItem(key) {
        if (options.throwOnGet && (options.throwKey === undefined || options.throwKey === key)) {
          const err = new Error(options.throwMessage || 'Storage get error');
          err.name = options.errorName || 'Error';
          throw err;
        }
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        if (options.throwOnSet && (options.throwKey === undefined || options.throwKey === key)) {
          const err = new Error(options.throwMessage || 'Storage set error');
          err.name = options.errorName || 'Error';
          throw err;
        }
        store.set(key, String(value));
      },
      removeItem(key) {
        if (options.throwOnRemove && (options.throwKey === undefined || options.throwKey === key)) {
          const err = new Error(options.throwMessage || 'Storage remove error');
          err.name = options.errorName || 'Error';
          throw err;
        }
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      _dump() {
        return Object.fromEntries(store.entries());
      }
    };
  }

  // 5.1 Outcome A: Successful localStorage availability detection and durable writes
  console.log('  -> Subtest 5.1: Outcome A availability detection & write...');
  global.window = { localStorage: createMockLocalStorage() };
  storage._resetInMemoryState();

  assert.strictEqual(storage.isStorageAvailable(), true, 'isStorageAvailable must return true when localStorage is working');
  const writeRes1 = storage.markSlugCompleted(scenario1.slug);
  assert.strictEqual(writeRes1.success, true, 'Writing scenario 1 must return success: true');
  assert.strictEqual(writeRes1.persistent, true, 'Outcome A must report persistent: true');
  assert.deepStrictEqual(writeRes1.completedSlugs, [scenario1.slug], 'completedSlugs must contain written slug');
  assert.strictEqual(storage.isScenarioCompleted(scenario1.slug), true, 'isScenarioCompleted must return true for written slug');

  const rawStored1 = JSON.parse(global.window.localStorage.getItem('cl_counterfactual_completed_slugs'));
  assert.deepStrictEqual(rawStored1, [scenario1.slug], 'localStorage must contain serialized slug array');

  // 5.2 Preservation of existing slugs when adding new ones
  console.log('  -> Subtest 5.2: Existing slug preservation on append...');
  const writeRes2 = storage.markSlugCompleted(scenario3.slug);
  assert.strictEqual(writeRes2.success, true, 'Writing scenario 3 must return success: true');
  assert.strictEqual(writeRes2.persistent, true, 'Outcome A append must report persistent: true');
  assert(writeRes2.completedSlugs.includes(scenario1.slug), 'Must preserve existing slug 1');
  assert(writeRes2.completedSlugs.includes(scenario3.slug), 'Must include new slug 3');
  assert.strictEqual(writeRes2.completedSlugs.length, 2, 'Must contain exactly 2 unique slugs');

  const rawStored2 = JSON.parse(global.window.localStorage.getItem('cl_counterfactual_completed_slugs'));
  assert(rawStored2.includes(scenario1.slug) && rawStored2.includes(scenario3.slug), 'localStorage must preserve both slugs');

  // 5.3 Duplicate slug prevention
  console.log('  -> Subtest 5.3: Duplicate slug prevention...');
  const dupRes = storage.markSlugCompleted(scenario1.slug);
  assert.strictEqual(dupRes.success, true);
  assert.strictEqual(dupRes.persistent, true);
  assert.strictEqual(
    dupRes.completedSlugs.filter(s => s === scenario1.slug).length,
    1,
    'Slug must not be duplicated in returned completedSlugs'
  );
  const rawStoredDup = JSON.parse(global.window.localStorage.getItem('cl_counterfactual_completed_slugs'));
  assert.strictEqual(
    rawStoredDup.filter(s => s === scenario1.slug).length,
    1,
    'Slug must not be duplicated in raw localStorage'
  );

  // Trim check: whitespace variations must not duplicate
  const spaceRes = storage.markSlugCompleted(`  ${scenario1.slug}  `);
  assert.strictEqual(
    spaceRes.completedSlugs.filter(s => s === scenario1.slug).length,
    1,
    'Trimmed slug must not create duplicate entry'
  );

  // 5.4 Reading back completion from localStorage after in-memory reset (simulating page reload)
  console.log('  -> Subtest 5.4: Read back from localStorage across session resets...');
  storage._resetInMemoryState(); // Simulates page reload (clears in-memory set and tested flag)
  // Window and localStorage remain populated
  const readBackSlugs = storage.getCompletedSlugs();
  assert(readBackSlugs.includes(scenario1.slug), 'Must read back slug 1 from localStorage');
  assert(readBackSlugs.includes(scenario3.slug), 'Must read back slug 3 from localStorage');
  assert.strictEqual(storage.isScenarioCompleted(scenario1.slug), true, 'isScenarioCompleted must return true from localStorage read');
  assert.strictEqual(storage.isScenarioCompleted(scenario3.slug), true, 'isScenarioCompleted must return true from localStorage read');
  assert.strictEqual(storage.isScenarioCompleted('unvisited-scenario-slug'), false, 'Unvisited slug must return false');

  // 5.5 Outcome B: Unavailable localStorage retains completion in memory for session
  console.log('  -> Subtest 5.5: Outcome B in-memory session retention...');
  delete global.window; // Remove window entirely
  storage._resetInMemoryState();

  assert.strictEqual(storage.isStorageAvailable(), false, 'isStorageAvailable must return false when window is undefined');
  const outcomeB_Res = storage.markSlugCompleted(scenario1.slug);
  assert.strictEqual(outcomeB_Res.success, true, 'Outcome B write must succeed in memory');
  assert.strictEqual(outcomeB_Res.persistent, false, 'Outcome B must report persistent: false');
  assert(outcomeB_Res.completedSlugs.includes(scenario1.slug), 'In-memory slugs must include written slug');
  assert.strictEqual(storage.isScenarioCompleted(scenario1.slug), true, 'isScenarioCompleted must be true for current session');

  // Verify memory-only nature: on refresh (_resetInMemoryState), state is wiped
  storage._resetInMemoryState();
  assert.strictEqual(storage.isScenarioCompleted(scenario1.slug), false, 'Non-persistent slug must be cleared on simulated refresh');

  // 5.6 Throwing storage operations: SecurityError during availability probe
  console.log('  -> Subtest 5.6: SecurityError probe exception fallback...');
  global.window = {
    localStorage: createMockLocalStorage({
      throwOnSet: true,
      throwKey: '__cf_storage_probe__',
      throwMessage: 'Access is denied for this document.',
      errorName: 'SecurityError'
    })
  };
  storage._resetInMemoryState();

  assert.strictEqual(storage.isStorageAvailable(), false, 'isStorageAvailable must catch SecurityError and return false');
  const secRes = storage.markSlugCompleted('security-error-scenario');
  assert.strictEqual(secRes.success, true, 'Must fall back to in-memory set on security error without crashing');
  assert.strictEqual(secRes.persistent, false, 'Must report persistent: false when storage throws');
  assert(secRes.completedSlugs.includes('security-error-scenario'), 'Must retain slug in memory fallback');
  assert.strictEqual(storage.isScenarioCompleted('security-error-scenario'), true, 'Must return true in session memory');

  // 5.7 Throwing storage operations: QuotaExceededError during markSlugCompleted write
  console.log('  -> Subtest 5.7: QuotaExceededError write exception fallback...');
  let quotaHit = false;
  global.window = {
    localStorage: {
      getItem(k) { return null; },
      setItem(k, v) {
        if (k === 'cl_counterfactual_completed_slugs') {
          quotaHit = true;
          const err = new Error('DOMException: The quota has been exceeded.');
          err.name = 'QuotaExceededError';
          throw err;
        }
      },
      removeItem(k) {}
    }
  };
  storage._resetInMemoryState();

  assert.strictEqual(storage.isStorageAvailable(), true, 'Availability probe should succeed before quota hit');
  const quotaRes = storage.markSlugCompleted('quota-exceeded-scenario');
  assert.strictEqual(quotaHit, true, 'Quota exception must have been triggered');
  assert.strictEqual(quotaRes.success, true, 'Must catch QuotaExceededError without throwing');
  assert.strictEqual(quotaRes.persistent, false, 'CRITICAL: persistent must NEVER be true when write throws');
  assert(quotaRes.completedSlugs.includes('quota-exceeded-scenario'), 'Must retain slug in memory cache');
  assert.strictEqual(storage.isScenarioCompleted('quota-exceeded-scenario'), true, 'Must return true for session memory');

  // 5.8 Safe handling of invalid inputs
  console.log('  -> Subtest 5.8: Safe handling of invalid inputs...');
  const invalidNull = storage.markSlugCompleted(null);
  assert.strictEqual(invalidNull.success, false, 'markSlugCompleted(null) must return success: false');
  assert.strictEqual(invalidNull.persistent, false);

  const invalidEmpty = storage.markSlugCompleted('   ');
  assert.strictEqual(invalidEmpty.success, false, 'markSlugCompleted("   ") must return success: false');

  const invalidNum = storage.markSlugCompleted(12345);
  assert.strictEqual(invalidNum.success, false, 'markSlugCompleted(number) must return success: false');

  assert.strictEqual(storage.isScenarioCompleted(null), false, 'isScenarioCompleted(null) must return false');
  assert.strictEqual(storage.isScenarioCompleted(''), false, 'isScenarioCompleted("") must return false');

  // Clean environment teardown
  delete global.window;
  storage._resetInMemoryState();
  console.log('  * PASS: Storage adapter comprehensive resilience verified across Outcome A, Outcome B, duplicates, reload read-back, SecurityError, and QuotaExceededError.');

  // -------------------------------------------------------------
  // TEST 6: Multi-Tier Isolation & Source-String Boundary Checks
  // -------------------------------------------------------------
  console.log('\n[TEST 6] Verifying Multi-Tier Isolation & Source-String Boundaries...');
  const wave2Files = [
    path.resolve(__dirname, '../../client/src/pages/Counterfactuals.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/CounterfactualCatalog.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/CounterfactualExplorer.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/IncidentStimulusView.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/DecisionJunction.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/ConsequenceTimeline.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/ComparativeMatrix.jsx'),
    path.resolve(__dirname, '../../client/src/components/counterfactual/DefensiveTakeawayCard.jsx'),
    path.resolve(__dirname, '../../client/src/utils/counterfactualEngine.js'),
    path.resolve(__dirname, '../../client/src/utils/counterfactualStorage.js')
  ];

  wave2Files.forEach(filePath => {
    assert(fs.existsSync(filePath), `Wave 2 file must exist: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Forbidden backend & assessment imports
    assert(!content.includes("from '../models"), `Forbidden model import in ${path.basename(filePath)}`);
    assert(!content.includes("from '../../models"), `Forbidden model import in ${path.basename(filePath)}`);
    assert(!content.includes("from '../controllers"), `Forbidden controller import in ${path.basename(filePath)}`);
    assert(!content.includes("from '../../controllers"), `Forbidden controller import in ${path.basename(filePath)}`);
    assert(!content.includes("assessmentScoringService"), `Forbidden assessmentScoringService reference in ${path.basename(filePath)}`);
    assert(!content.includes("AssessmentSession"), `Forbidden AssessmentSession reference in ${path.basename(filePath)}`);
    assert(!content.includes("AssessmentDecision"), `Forbidden AssessmentDecision reference in ${path.basename(filePath)}`);
    assert(!content.includes("UserProgress"), `Forbidden UserProgress reference in ${path.basename(filePath)}`);
    assert(!content.includes("api.post"), `Forbidden api.post call in ${path.basename(filePath)}`);
    assert(!content.includes("api.get"), `Forbidden api.get call in ${path.basename(filePath)}`);

    // Safety invariant: IncidentStimulusView must NOT have <input or <textarea
    if (filePath.endsWith('IncidentStimulusView.jsx')) {
      assert(!content.includes('<input'), 'IncidentStimulusView must not contain <input> elements');
      assert(!content.includes('<textarea'), 'IncidentStimulusView must not contain <textarea> elements');
      assert(!content.includes('onChange='), 'IncidentStimulusView must not contain interactive onChange handlers');
    }
  });
  console.log('  * PASS: All 10 Wave 2 files strictly adhere to multi-tier isolation and safety boundaries.');

  console.log('\n=============================================================');
  console.log('ALL COUNTERFACTUAL ENGINE LOGIC VALIDATIONS PASSED (6/6)');
  console.log('=============================================================\n');
}

runCounterfactualEngineSuite().catch(err => {
  console.error('\nFAILED COUNTERFACTUAL ENGINE LOGIC TEST:', err);
  process.exit(1);
});

