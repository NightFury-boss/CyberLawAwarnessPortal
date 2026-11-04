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
  storage._resetInMemoryState();

  // In Node environment without window.localStorage -> Outcome B (In-memory fallback)
  assert.strictEqual(storage.isStorageAvailable(), false, 'localStorage should not be available in headless Node');
  
  const outcomeB_Result = storage.markSlugCompleted(scenario3.slug);
  assert.strictEqual(outcomeB_Result.success, true, 'Marking completion must succeed even without window.localStorage');
  assert.strictEqual(outcomeB_Result.persistent, false, 'Outcome B must indicate persistent: false');
  assert(outcomeB_Result.completedSlugs.includes(scenario3.slug), 'Completed slugs must include marked slug in memory');
  assert.strictEqual(storage.isScenarioCompleted(scenario3.slug), true, 'isScenarioCompleted must return true for current session');

  // Verify safe handling of invalid inputs
  const invalidResult = storage.markSlugCompleted(null);
  assert.strictEqual(invalidResult.success, false, 'Marking invalid slug must return success: false without throwing');
  console.log('  * PASS: Storage adapter Outcome B session fallback verified.');

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
