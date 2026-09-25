const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

const METRIC_TAGS = {
  recognition: 'THREAT_RECOGNITION',
  signalIdentification: 'SIGNAL_IDENTIFICATION',
  verification: 'VERIFICATION',
  decisionQuality: 'DECISION_QUALITY'
};

async function computePathOpportunities(scenarioId, pathStageOrders) {
  const opps = {
    recognition: 0,
    signalIdentification: 0,
    verification: 0,
    decisionQuality: 0,
    falsePositive: 0,
    unreviewedAcceptance: 0
  };

  for (const stgOrder of pathStageOrders) {
    const stage = await ScenarioStage.findOne({ scenarioId, stageOrder: stgOrder });
    assert(stage, `Stage with stageOrder ${stgOrder} not found for scenario ${scenarioId}`);

    const decisions = await ScenarioDecision.find({ stageId: stage._id });

    // Positive dimensions (TR, SI, VB, DQ)
    for (const [key, tag] of Object.entries(METRIC_TAGS)) {
      if (stage.measurementFocus && stage.measurementFocus.includes(tag)) {
        if (key === 'recognition' && stage.eventClassification === 'legitimate') continue;
        let maxVal = 0;
        decisions.forEach(d => {
          maxVal = Math.max(maxVal, (d.behaviorEffects && d.behaviorEffects[key]) || 0);
        });
        opps[key] += maxVal;
      }
    }

    // False Positive Control
    if (stage.measurementFocus && stage.measurementFocus.includes('FALSE_POSITIVE_CONTROL') && stage.eventClassification === 'legitimate') {
      let maxVal = 0;
      decisions.forEach(d => {
        maxVal = Math.max(maxVal, (d.behaviorEffects && d.behaviorEffects.falsePositive) || 0);
      });
      opps.falsePositive += maxVal;
    }

    // Unreviewed Acceptance Control
    if (stage.measurementFocus && stage.measurementFocus.includes('UNREVIEWED_ACCEPTANCE')) {
      let maxVal = 0;
      decisions.forEach(d => {
        maxVal = Math.max(maxVal, (d.behaviorEffects && d.behaviorEffects.unreviewedAcceptance) || 0);
      });
      opps.unreviewedAcceptance += maxVal;
    }
  }

  return opps;
}

async function runTest() {
  console.log('=== TEST: ASSESSMENT TRANSFER & TOPOLOGICAL ISOMORPHISM ===\n');
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const baseline = await Scenario.findOne({ slug: 'baseline', version: 2 });
    const final = await Scenario.findOne({ slug: 'final', version: 2 });

    assert(baseline, 'Baseline v2 scenario not found in MongoDB');
    assert(final, 'Final v2 scenario not found in MongoDB');

    // 1. Verify 14-Stage Topology for Both Scenarios
    console.log('[Test 1] Verifying 14-stage topology for both scenarios...');
    const bStages = await ScenarioStage.find({ scenarioId: baseline._id }).sort({ stageOrder: 1 });
    const fStages = await ScenarioStage.find({ scenarioId: final._id }).sort({ stageOrder: 1 });

    assert.strictEqual(bStages.length, 14, `Baseline v2 must have 14 stages, got ${bStages.length}`);
    assert.strictEqual(fStages.length, 14, `Final v2 must have 14 stages, got ${fStages.length}`);

    // Check terminal stage 14
    assert.strictEqual(bStages[13].terminal, true, 'Baseline stage 14 must be terminal');
    assert.strictEqual(fStages[13].terminal, true, 'Final stage 14 must be terminal');
    console.log('  * PASS: Both scenarios have 14 stages with terminal Stage 14.');

    // 2. Verify Graph Branching & Reconvergence
    console.log('\n[Test 2] Verifying branching topology at Stage 7 and reconvergence at Stage 10...');
    for (const sc of [baseline, final]) {
      const stg7 = await ScenarioStage.findOne({ scenarioId: sc._id, stageOrder: 7 });
      const stg7Decs = await ScenarioDecision.find({ stageId: stg7._id });
      const stg8 = await ScenarioStage.findOne({ scenarioId: sc._id, stageOrder: 8 });
      const stg9 = await ScenarioStage.findOne({ scenarioId: sc._id, stageOrder: 9 });
      const stg10 = await ScenarioStage.findOne({ scenarioId: sc._id, stageOrder: 10 });

      // Stage 7 decisions must branch: Safe path -> Stage 8, Risky path -> Stage 9
      const safeDecision = stg7Decs.find(d => d.riskLevel === 'safe');
      const criticalDecision = stg7Decs.find(d => d.riskLevel === 'critical');

      assert(safeDecision, `${sc.slug} Stage 7 missing safe decision`);
      assert(criticalDecision, `${sc.slug} Stage 7 missing critical decision`);

      assert.strictEqual(safeDecision.nextStageId.toString(), stg8._id.toString(),
        `${sc.slug} Safe decision must route to Stage 8`);
      assert.strictEqual(criticalDecision.nextStageId.toString(), stg9._id.toString(),
        `${sc.slug} Critical decision must route to Stage 9`);

      // Stage 8 and Stage 9 must both reconverge to Stage 10
      const stg8Decs = await ScenarioDecision.find({ stageId: stg8._id });
      const stg9Decs = await ScenarioDecision.find({ stageId: stg9._id });

      stg8Decs.forEach((d, i) => {
        assert.strictEqual(d.nextStageId.toString(), stg10._id.toString(),
          `${sc.slug} Stage 8 Dec #${i + 1} must route to Stage 10`);
      });

      stg9Decs.forEach((d, i) => {
        assert.strictEqual(d.nextStageId.toString(), stg10._id.toString(),
          `${sc.slug} Stage 9 Dec #${i + 1} must route to Stage 10`);
      });
    }
    console.log('  * PASS: Branching (Stg 7 -> 8 / 9) and reconvergence (8 & 9 -> 10) verified.');

    // 3. Verify Complete Content Distinction
    console.log('\n[Test 3] Verifying genuine situational distinction between Baseline and Final...');
    let identicalCount = 0;
    for (let i = 0; i < 14; i++) {
      if (bStages[i].title.trim().toLowerCase() === fStages[i].title.trim().toLowerCase()) {
        identicalCount++;
      }
    }
    console.log(`  * Identical titles: ${identicalCount} / 14`);
    assert.strictEqual(identicalCount, 0, 'Baseline and Final must not use identical stage titles');
    console.log('  * PASS: Baseline and Final present genuinely distinct diagnostic dilemmas.');

    // 4. Verify Exact Opportunity Parity (Safe Path & Risky Path)
    console.log('\n[Test 4] Verifying 1:1 opportunity parity across all 6 behavioral dimensions...');
    const safePath = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14];
    const riskyPath = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14];

    const bSafeOpps = await computePathOpportunities(baseline._id, safePath);
    const fSafeOpps = await computePathOpportunities(final._id, safePath);

    console.log('  Baseline Safe Path Opps:', bSafeOpps);
    console.log('  Final    Safe Path Opps:', fSafeOpps);

    assert.deepStrictEqual(bSafeOpps, {
      recognition: 14,
      signalIdentification: 8,
      verification: 14,
      decisionQuality: 24,
      falsePositive: 8,
      unreviewedAcceptance: 6
    }, 'Baseline Safe Path opportunities do not match expected standard');

    assert.deepStrictEqual(fSafeOpps, bSafeOpps, 'Final and Baseline Safe Path opportunities must be identical');

    const bRiskyOpps = await computePathOpportunities(baseline._id, riskyPath);
    const fRiskyOpps = await computePathOpportunities(final._id, riskyPath);

    console.log('  Baseline Risky Path Opps:', bRiskyOpps);
    console.log('  Final    Risky Path Opps:', fRiskyOpps);

    assert.deepStrictEqual(bRiskyOpps, {
      recognition: 16,
      signalIdentification: 8,
      verification: 16,
      decisionQuality: 24,
      falsePositive: 6,
      unreviewedAcceptance: 6
    }, 'Baseline Risky Path opportunities do not match expected standard');

    assert.deepStrictEqual(fRiskyOpps, bRiskyOpps, 'Final and Baseline Risky Path opportunities must be identical');

    console.log('\n✅ Assessment Transfer Validation: 100% Topological Isomorphism, Opportunity Parity, and Content Distinction Verified.');
  } finally {
    await mongoose.disconnect();
  }
}

runTest().then(() => {
  console.log('Test passed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
