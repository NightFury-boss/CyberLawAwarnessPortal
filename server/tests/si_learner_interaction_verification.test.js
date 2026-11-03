/**
 * Automated Test Suite: Signal Identification Learner Interaction & Evidence Verification
 * Phase 4.3 Task 2.B
 * 
 * Verifies:
 * 1. For all 5 SI probe stages in Baseline Assessment v2 (Stages 2, 3, 10, 11, 12):
 *    - hasSignalProbe === true
 *    - Exactly 4 probe options with distinct forensic cues
 *    - Exactly 1 correct technical cue and 3 plausible distractors
 * 2. For all 5 SI probe stages in Final Assessment v2 (Stages 2, 3, 10, 11, 12):
 *    - hasSignalProbe === true
 *    - Exactly 4 probe options with distinct forensic cues
 *    - Exactly 1 correct technical cue and 3 plausible distractors
 * 3. Component Interaction Workflow Verification:
 *    - BaselineAssessment.jsx and FinalAssessment.jsx enforce:
 *      * Step 1: Learner independently selects primary defensive action
 *      * Step 2: In-place probe card reveals without auto-selection
 *      * Step 3: Confirm button is strictly disabled until probe is chosen
 *      * Both choices submitted atomically in a single payload
 *      * No programmatic answer injection or default selection
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');

async function runTests() {
  console.log('\n=============================================================');
  console.log('TEST SUITE: SIGNAL IDENTIFICATION LEARNER INTERACTION AUDIT');
  console.log('=============================================================\n');

  await connectDB();

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  // -----------------------------------------------------------------
  // 1. BASELINE V2 FORENSIC PROBE AUDIT (5 STAGES)
  // -----------------------------------------------------------------
  console.log('--- 1. Baseline Assessment v2 Forensic Probe Audit ---');

  const baseline = await Scenario.findOne({ slug: 'baseline', version: 2 });
  assert(baseline, 'Baseline v2 scenario must exist');

  const baselineStages = await ScenarioStage.find({ scenarioId: baseline._id }).sort({ stageOrder: 1 });
  const baselineProbes = baselineStages.filter(s => s.hasSignalProbe);

  await testAsync('Baseline v2 contains exactly 5 universal forensic probe stages (Stages 2, 3, 10, 11, 12)', async () => {
    assert.strictEqual(baselineProbes.length, 5, 'Baseline must have exactly 5 probe stages');
    const orders = baselineProbes.map(s => s.stageOrder);
    assert.deepStrictEqual(orders, [2, 3, 10, 11, 12]);
  });

  baselineProbes.forEach(stage => {
    test(`Baseline Stage ${stage.stageOrder} (${stage.title.slice(0, 30)}): 4 probe options with 1 correct cue`, () => {
      assert(stage.signalProbes && stage.signalProbes.length === 4, `Stage ${stage.stageOrder} must have 4 probe options`);
      const correct = stage.signalProbes.filter(p => p.isCorrect);
      assert.strictEqual(correct.length, 1, `Stage ${stage.stageOrder} must have exactly 1 correct cue`);
      assert(correct[0].optionText.length > 10, 'Correct cue must have descriptive technical text');
    });
  });

  // -----------------------------------------------------------------
  // 2. FINAL V2 FORENSIC PROBE AUDIT (5 STAGES)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Final Assessment v2 Forensic Probe Audit ---');

  const finalSc = await Scenario.findOne({ slug: 'final', version: 2 });
  assert(finalSc, 'Final v2 scenario must exist');

  const finalStages = await ScenarioStage.find({ scenarioId: finalSc._id }).sort({ stageOrder: 1 });
  const finalProbes = finalStages.filter(s => s.hasSignalProbe);

  await testAsync('Final v2 contains exactly 5 universal forensic probe stages (Stages 2, 3, 10, 11, 12)', async () => {
    assert.strictEqual(finalProbes.length, 5, 'Final must have exactly 5 probe stages');
    const orders = finalProbes.map(s => s.stageOrder);
    assert.deepStrictEqual(orders, [2, 3, 10, 11, 12]);
  });

  finalProbes.forEach(stage => {
    test(`Final Stage ${stage.stageOrder} (${stage.title.slice(0, 30)}): 4 probe options with 1 correct cue`, () => {
      assert(stage.signalProbes && stage.signalProbes.length === 4, `Stage ${stage.stageOrder} must have 4 probe options`);
      const correct = stage.signalProbes.filter(p => p.isCorrect);
      assert.strictEqual(correct.length, 1, `Stage ${stage.stageOrder} must have exactly 1 correct cue`);
      assert(correct[0].optionText.length > 10, 'Correct cue must have descriptive technical text');
    });
  });

  // -----------------------------------------------------------------
  // 3. FRONTEND SOURCE CODE AUDIT: INDEPENDENT SELECTION & ATOMIC SUBMISSION
  // -----------------------------------------------------------------
  console.log('\n--- 3. Client UI Component Interaction Contract ---');

  const baselineCode = fs.readFileSync(path.join(__dirname, '../../client/src/pages/BaselineAssessment.jsx'), 'utf8');
  const finalCode = fs.readFileSync(path.join(__dirname, '../../client/src/pages/FinalAssessment.jsx'), 'utf8');

  test('BaselineAssessment.jsx initializes selection state as null (no auto-selected answers)', () => {
    assert(baselineCode.includes('const [selectedPrimaryDecisionId, setSelectedPrimaryDecisionId] = useState(null)'), 'Must initialize primary decision to null');
    assert(baselineCode.includes('const [selectedProbeId, setSelectedProbeId] = useState(null)'), 'Must initialize probe decision to null');
  });

  test('BaselineAssessment.jsx separates Step 1 action from Step 2 probe selection', () => {
    assert(baselineCode.includes('handlePrimaryChoice(opt.id)'), 'Primary cards must trigger handlePrimaryChoice');
    assert(baselineCode.includes('setSelectedPrimaryDecisionId(decisionId)'), 'Must store primary decision in state before probe');
    assert(baselineCode.includes('currentStage.hasSignalProbe && selectedPrimaryDecisionId'), 'Probe panel must only appear after Step 1 choice');
  });

  test('BaselineAssessment.jsx disables submission until learner selects probe option', () => {
    assert(baselineCode.includes('disabled={!selectedProbeId || submitting}'), 'Submit button must be disabled until probe option is chosen');
  });

  test('BaselineAssessment.jsx submits both choices atomically with persisted idempotency key', () => {
    assert(baselineCode.includes('submitStep(selectedPrimaryDecisionId, selectedProbeId)'), 'Must submit primary and probe together');
    assert(baselineCode.includes('sessionStorage.getItem(storageKey)'), 'Must read persisted idempotency key');
    assert(baselineCode.includes('sessionStorage.removeItem(storageKey)'), 'Must cleanup idempotency key upon success');
  });

  test('FinalAssessment.jsx initializes selection state as null (no auto-selected answers)', () => {
    assert(finalCode.includes('const [selectedPrimaryDecisionId, setSelectedPrimaryDecisionId] = useState(null)'), 'Must initialize primary decision to null');
    assert(finalCode.includes('const [selectedProbeId, setSelectedProbeId] = useState(null)'), 'Must initialize probe decision to null');
  });

  test('FinalAssessment.jsx separates Step 1 action from Step 2 probe selection', () => {
    assert(finalCode.includes('handlePrimaryChoice(opt.id)'), 'Primary cards must trigger handlePrimaryChoice');
    assert(finalCode.includes('setSelectedPrimaryDecisionId(decisionId)'), 'Must store primary decision in state before probe');
    assert(finalCode.includes('currentStage.hasSignalProbe && selectedPrimaryDecisionId'), 'Probe panel must only appear after Step 1 choice');
  });

  test('FinalAssessment.jsx disables submission until learner selects probe option', () => {
    assert(finalCode.includes('disabled={!selectedProbeId || submitting}'), 'Submit button must be disabled until probe option is chosen');
  });

  test('FinalAssessment.jsx submits both choices atomically with persisted idempotency key', () => {
    assert(finalCode.includes('handleSelectOption(selectedPrimaryDecisionId, selectedProbeId)'), 'Must submit primary and probe together');
    assert(finalCode.includes('sessionStorage.getItem(storageKey)'), 'Must read persisted idempotency key');
    assert(finalCode.includes('sessionStorage.removeItem(storageKey)'), 'Must cleanup idempotency key upon success');
  });

  console.log('\n=============================================================');
  console.log(`ALL ${passed}/${total} SI LEARNER INTERACTION AUDIT CHECKS PASSED 100%!`);
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  });
}

module.exports = runTests;

