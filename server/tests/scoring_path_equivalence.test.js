/**
 * Automated Test Suite: Scoring Path Equivalence & Mathematical Parity
 * Phase 4.3 Wave 3
 * 
 * Verifies:
 * 1. Path 1 (Early Resolution via Stage 7 -> Stage 8 -> Stage 10) vs
 *    Path 2 (Escalation & Late Recovery via Stage 7 -> Stage 9 -> Stage 10).
 * 2. Mathematical denominator parity across both paths:
 *    - TR Max: 16 on both paths (budget preserved through Stage 7 maxBound=4 vs Stage 9 recovery=2).
 *    - SI Max: 10 on both paths (universal probes on Stages 2, 3, 10, 11, 12).
 *    - VB Max: 16 on both paths.
 *    - DQ Max: 4 on both paths (Stages 5 & 13 pure evaluation).
 *    - UA Max Penalty: 8 on both paths (Stages 3, 4, 6, 10).
 * 3. FP branch sensitivity:
 *    - Honest mathematical score divergence on 4-encounter vs 3-encounter paths.
 *    - Unified STRENGTH classification in remediation when cumulative penalty <= 2.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const { calculateScoresV2 } = require('../services/assessmentScoringService');
const { rankEligibleMetrics } = require('../services/remediationEngineService');

async function runTests() {
  console.log('\n=============================================================');
  console.log('TEST SUITE: SCORING PATH EQUIVALENCE & MATHEMATICAL PARITY');
  console.log('=============================================================\n');

  await connectDB();

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
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

  // Load Baseline Scenario v2
  const baseline = await Scenario.findOne({ slug: 'baseline', version: 2 });
  assert(baseline, 'Baseline Scenario v2 must exist in MongoDB Atlas');

  const stages = await ScenarioStage.find({ scenarioId: baseline._id }).sort({ stageOrder: 1 });
  assert.strictEqual(stages.length, 14, 'Baseline v2 must have 14 stages');

  const stageMap = new Map();
  for (const st of stages) {
    stageMap.set(st.stageOrder, st);
  }

  // Helper to find decisions by stageOrder and snippet
  async function getDecision(stageOrder, snippet) {
    const stage = stageMap.get(stageOrder);
    assert(stage, `Stage with order ${stageOrder} not found`);
    const decs = await ScenarioDecision.find({ stageId: stage._id });
    const match = decs.find(d => d.optionText.toLowerCase().includes(snippet.toLowerCase()));
    assert(match, `Decision matching '${snippet}' not found in stage order ${stageOrder}`);
    return { stage, decision: match };
  }

  // Helper to find correct probe option for a stage
  function getCorrectProbeId(stage) {
    if (!stage.hasSignalProbe || !stage.signalProbes || stage.signalProbes.length === 0) return null;
    const correct = stage.signalProbes.find(p => p.isCorrect);
    return correct ? correct._id : null;
  }

  // -----------------------------------------------------------------
  // 1. PATH 1: SAFE PATH (EARLY RESOLUTION)
  // Sequence: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 (Hang up) -> 8 (Verify) -> 10 -> 11 -> 12 -> 13
  // -----------------------------------------------------------------
  await test('Path 1 (Early Resolution) achieves exact 100% across all 6 dimensions with 16 TR / 10 SI / 16 VB / 4 DQ', async () => {
    const choices = [];

    // Stage 1: Legitimate banking
    const s1 = await getDecision(1, 'Acknowledge the routine credit alert');
    choices.push({ stageId: s1.stage._id, decisionId: s1.decision._id });

    // Stage 2: Courier SMS (has probe)
    const s2 = await getDecision(2, 'Ignore the link, open your genuine e-commerce');
    choices.push({ stageId: s2.stage._id, decisionId: s2.decision._id, signalProbeDecisionId: getCorrectProbeId(s2.stage) });

    // Stage 3: Campus Internship (has probe)
    const s3 = await getDecision(3, 'Recognize the disproportionate payout');
    choices.push({ stageId: s3.stage._id, decisionId: s3.decision._id, signalProbeDecisionId: getCorrectProbeId(s3.stage) });

    // Stage 4: Electricity Disconnection
    const s4 = await getDecision(4, 'Log into your official state electricity utility portal');
    choices.push({ stageId: s4.stage._id, decisionId: s4.decision._id });

    // Stage 5: LMS Password Expiry (DQ focus)
    const s5 = await getDecision(5, 'Acknowledge the reminder and plan to update');
    choices.push({ stageId: s5.stage._id, decisionId: s5.decision._id });

    // Stage 6: Cloud permissions
    const s6 = await getDecision(6, 'Immediately deny permissions');
    choices.push({ stageId: s6.stage._id, decisionId: s6.decision._id });

    // Stage 7: Cyber Cell Call -> Early resolution hang up (+4 TR, +2 VB)
    const s7 = await getDecision(7, 'Hang up immediately');
    choices.push({ stageId: s7.stage._id, decisionId: s7.decision._id });

    // Stage 8: Official Bank KYC re-verification (+2 VB, legitimate)
    const s8 = await getDecision(8, 'Read the email calmly');
    choices.push({ stageId: s8.stage._id, decisionId: s8.decision._id });

    // Stage 10: QR Code overlay (has probe)
    const s10 = await getDecision(10, 'Notice the payee name mismatch');
    choices.push({ stageId: s10.stage._id, decisionId: s10.decision._id, signalProbeDecisionId: getCorrectProbeId(s10.stage) });

    // Stage 11: Income Tax Refund Phishing (has probe)
    const s11 = await getDecision(11, 'Recognize that tax refunds are credited automatically');
    choices.push({ stageId: s11.stage._id, decisionId: s11.decision._id, signalProbeDecisionId: getCorrectProbeId(s11.stage) });

    // Stage 12: Emergency Distress Call (has probe)
    const s12 = await getDecision(12, 'Do not transfer money immediately');
    choices.push({ stageId: s12.stage._id, decisionId: s12.decision._id, signalProbeDecisionId: getCorrectProbeId(s12.stage) });

    // Stage 13: OS Security Update (DQ focus)
    const s13 = await getDecision(13, 'Approve the security update');
    choices.push({ stageId: s13.stage._id, decisionId: s13.decision._id });

    const session = new AssessmentSession({ scoringVersion: 2 });
    const result = await calculateScoresV2(session, choices);

    console.log('    Path 1 Raw Scores:', result.rawScores);
    console.log('    Path 1 Max Scores:', result.maxScores);
    console.log('    Path 1 Scores (%):', result.scores);
    console.log('    Path 1 Encounters:', result.encounters);

    // Verify Denominators
    assert.strictEqual(result.maxScores.recognition, 16, 'Path 1 TR Max must be exactly 16');
    assert.strictEqual(result.maxScores.signalIdentification, 10, 'Path 1 SI Max must be exactly 10');
    assert.strictEqual(result.maxScores.verification, 16, 'Path 1 VB Max must be exactly 16');
    assert.strictEqual(result.maxScores.decisionQuality, 4, 'Path 1 DQ Max must be exactly 4');
    assert.strictEqual(result.unreviewedAcceptanceMaxPenaltyPoints, 8, 'Path 1 UA Max Penalty must be 8');
    assert.strictEqual(result.falsePositiveMaxPenaltyPoints, 8, 'Path 1 FP Max Penalty must be 8');

    // Verify Perfect Raw Scores
    assert.strictEqual(result.rawScores.recognition, 16, 'Path 1 Scored TR must be 16');
    assert.strictEqual(result.rawScores.signalIdentification, 10, 'Path 1 Scored SI must be 10');
    assert.strictEqual(result.rawScores.verification, 16, 'Path 1 Scored VB must be 16');
    assert.strictEqual(result.rawScores.decisionQuality, 4, 'Path 1 Scored DQ must be 4');
    assert.strictEqual(result.unreviewedAcceptancePenaltyPoints, 0, 'Path 1 UA Penalty must be 0');
    assert.strictEqual(result.falsePositivePenaltyPoints, 0, 'Path 1 FP Penalty must be 0');

    // Verify Perfect Normalized Percentages
    assert.strictEqual(result.scores.recognition, 100);
    assert.strictEqual(result.scores.signalIdentification, 100);
    assert.strictEqual(result.scores.verification, 100);
    assert.strictEqual(result.scores.decisionQuality, 100);
    assert.strictEqual(result.scores.falsePositive, 100);
    assert.strictEqual(result.scores.unreviewedAcceptance, 100);
  });

  // -----------------------------------------------------------------
  // 2. PATH 2: ESCALATION & LATE RECOVERY PATH
  // Sequence: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 (Panic) -> 9 (Late Recovery) -> 10 -> 11 -> 12 -> 13
  // -----------------------------------------------------------------
  await test('Path 2 (Escalation & Recovery) matches exact denominators (TR=16, SI=10, VB=16, DQ=4, UA=8)', async () => {
    const choices = [];

    // Stages 1-6 same as Path 1
    const s1 = await getDecision(1, 'Acknowledge the routine credit alert');
    choices.push({ stageId: s1.stage._id, decisionId: s1.decision._id });

    const s2 = await getDecision(2, 'Ignore the link, open your genuine e-commerce');
    choices.push({ stageId: s2.stage._id, decisionId: s2.decision._id, signalProbeDecisionId: getCorrectProbeId(s2.stage) });

    const s3 = await getDecision(3, 'Recognize the disproportionate payout');
    choices.push({ stageId: s3.stage._id, decisionId: s3.decision._id, signalProbeDecisionId: getCorrectProbeId(s3.stage) });

    const s4 = await getDecision(4, 'Log into your official state electricity utility portal');
    choices.push({ stageId: s4.stage._id, decisionId: s4.decision._id });

    const s5 = await getDecision(5, 'Acknowledge the reminder and plan to update');
    choices.push({ stageId: s5.stage._id, decisionId: s5.decision._id });

    const s6 = await getDecision(6, 'Immediately deny permissions');
    choices.push({ stageId: s6.stage._id, decisionId: s6.decision._id });

    // Stage 7: Cyber Cell Call -> Panics, presses 1 (TR: 0, VB: 0; maxBound=4 still available)
    const s7 = await getDecision(7, 'Press 1 in sheer panic');
    choices.push({ stageId: s7.stage._id, decisionId: s7.decision._id });

    // Stage 9: Skype Digital Escrow Interrogation -> Late recovery (+2 TR, +2 VB)
    const s9 = await getDecision(9, 'Break out of panic');
    choices.push({ stageId: s9.stage._id, decisionId: s9.decision._id });

    // Stages 10-13 same as Path 1
    const s10 = await getDecision(10, 'Notice the payee name mismatch');
    choices.push({ stageId: s10.stage._id, decisionId: s10.decision._id, signalProbeDecisionId: getCorrectProbeId(s10.stage) });

    const s11 = await getDecision(11, 'Recognize that tax refunds are credited automatically');
    choices.push({ stageId: s11.stage._id, decisionId: s11.decision._id, signalProbeDecisionId: getCorrectProbeId(s11.stage) });

    const s12 = await getDecision(12, 'Do not transfer money immediately');
    choices.push({ stageId: s12.stage._id, decisionId: s12.decision._id, signalProbeDecisionId: getCorrectProbeId(s12.stage) });

    const s13 = await getDecision(13, 'Approve the security update');
    choices.push({ stageId: s13.stage._id, decisionId: s13.decision._id });

    const session = new AssessmentSession({ scoringVersion: 2 });
    const result = await calculateScoresV2(session, choices);

    console.log('    Path 2 Raw Scores:', result.rawScores);
    console.log('    Path 2 Max Scores:', result.maxScores);
    console.log('    Path 2 Scores (%):', result.scores);
    console.log('    Path 2 Encounters:', result.encounters);

    // Verify Exact Denominator Parity!
    assert.strictEqual(result.maxScores.recognition, 16, 'Path 2 TR Max must be exactly 16');
    assert.strictEqual(result.maxScores.signalIdentification, 10, 'Path 2 SI Max must be exactly 10');
    assert.strictEqual(result.maxScores.verification, 16, 'Path 2 VB Max must be exactly 16');
    assert.strictEqual(result.maxScores.decisionQuality, 4, 'Path 2 DQ Max must be exactly 4');
    assert.strictEqual(result.unreviewedAcceptanceMaxPenaltyPoints, 8, 'Path 2 UA Max Penalty must be 8');
    assert.strictEqual(result.falsePositiveMaxPenaltyPoints, 6, 'Path 2 FP Max Penalty must be 6 (Stage 8 skipped)');

    // Scored Points on Path 2:
    // Missed 4 TR points at Stage 7, recovered 2 at Stage 9 -> 14 / 16 (88%)
    assert.strictEqual(result.rawScores.recognition, 14, 'Path 2 Scored TR should be 14 (12 + 0 + 2)');
    assert.strictEqual(result.scores.recognition, 88);

    // Missed 2 VB points at Stage 7, recovered 2 at Stage 9 -> 14 / 16 (88%)
    assert.strictEqual(result.rawScores.verification, 14, 'Path 2 Scored VB should be 14 (12 + 0 + 2)');
    assert.strictEqual(result.scores.verification, 88);

    // Perfect SI (10/10), DQ (4/4), UA (0/8), FP (0/6)
    assert.strictEqual(result.scores.signalIdentification, 100);
    assert.strictEqual(result.scores.decisionQuality, 100);
    assert.strictEqual(result.scores.unreviewedAcceptance, 100);
    assert.strictEqual(result.scores.falsePositive, 100);
  });

  // -----------------------------------------------------------------
  // 3. FALSE POSITIVE SENSITIVITY & UNIFIED REMEDIATION CLASSIFICATION
  // -----------------------------------------------------------------
  await test('False Positive single slip produces honest divergent scores but unified STRENGTH classification', async () => {
    // Path 1 with 1 minor slip at Stage 8 (Archive email -> 1 penalty point)
    // 1 penalty out of 8 max -> (1 - 1/8) * 100 = 88%
    const p1Session = {
      scoringVersion: 2,
      behaviourScores: {
        recognition: 100,
        signalIdentification: 100,
        verification: 100,
        decisionQuality: 100,
        falsePositive: 88,
        unreviewedAcceptance: 100
      },
      behaviourOpportunities: { falsePositive: 8 },
      behaviourEncounters: { falsePositive: 4 },
      falsePositivePenaltyPoints: 1
    };

    // Path 2 with 1 slip on 3 encounters (2 penalty points out of 6 max -> 1 - 2/6 = 67%)
    const p2Session = {
      scoringVersion: 2,
      behaviourScores: {
        recognition: 88,
        signalIdentification: 100,
        verification: 88,
        decisionQuality: 100,
        falsePositive: 67, // Numerically below 75%
        unreviewedAcceptance: 100
      },
      behaviourOpportunities: { falsePositive: 6 },
      behaviourEncounters: { falsePositive: 3 },
      falsePositivePenaltyPoints: 2
    };

    const p1Ranked = rankEligibleMetrics(p1Session);
    const p2Ranked = rankEligibleMetrics(p2Session);

    const p1FP = p1Ranked.find(r => r.metricKey === 'falsePositive');
    const p2FP = p2Ranked.find(r => r.metricKey === 'falsePositive');

    assert(p1FP, 'Path 1 FP should be ranked');
    assert(p2FP, 'Path 2 FP should be ranked');

    // Both must be classified as STRENGTH (isEligibleWeakness === false)
    assert.strictEqual(p1FP.isEligibleWeakness, false, 'Path 1 FP (penalty=1) must be classified as STRENGTH');
    assert.strictEqual(p2FP.isEligibleWeakness, false, 'Path 2 FP (penalty=2) must be classified as STRENGTH');
    console.log('    ✓ Path 1 (88%, Pen=1) and Path 2 (67%, Pen=2) both treated as STRENGTH in remediation ranking');
  });

  console.log('\n=============================================================');
  console.log(`ALL ${passed}/${total} SCORING PATH EQUIVALENCE CHECKS PASSED 100%!`);
  console.log('=============================================================\n');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  });
}

module.exports = runTests;
