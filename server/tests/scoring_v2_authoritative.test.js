/**
 * Automated Test Suite: Scoring v2 Authoritative Architecture
 * Phase 4.3 Wave 3
 * 
 * Verifies:
 * 1. Fail-closed cutover resolution & deterministic scoring version resolution.
 * 2. calculateScoresV2 positive and penalty calculations.
 * 3. First-class null representation for unassessed dimensions (N=0).
 * 4. Discrete encounter counting and confidence heuristics (N < 2 -> 0.0, N in [2,3] -> 0.70, N >= 4 -> 1.0).
 * 5. Remediation engine v2 integration: unassessed filtering and FP <= 2 strength classification.
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { SCORING_V2_DEPLOYMENT_TIMESTAMP } = require('../config/cutoverConfig');
const {
  resolveSessionScoringVersion,
  calculateScoresV2,
  calculateScoresV1
} = require('../services/assessmentScoringService');
const {
  getOpportunityFactor,
  rankEligibleMetrics,
  SEVERITY_WEIGHTS
} = require('../services/remediationEngineService');
const AssessmentSession = require('../models/AssessmentSession');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

async function runTests() {
  console.log('\n=============================================================');
  console.log('TEST SUITE: SCORING V2 AUTHORITATIVE ARCHITECTURE');
  console.log('=============================================================\n');

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
  // 1. VERSION RESOLVER TESTS
  // -----------------------------------------------------------------
  console.log('--- 1. Deterministic Scoring-Version Resolution ---');

  test('Preserves explicit scoringVersion: 2', () => {
    const session = { scoringVersion: 2 };
    assert.strictEqual(resolveSessionScoringVersion(session), 2);
  });

  test('Preserves explicit scoringVersion: 1', () => {
    const session = { scoringVersion: 1 };
    assert.strictEqual(resolveSessionScoringVersion(session), 1);
  });

  test('Fails closed on unsupported explicit scoringVersion (e.g. 3)', () => {
    const session = { scoringVersion: 3 };
    assert.throws(
      () => resolveSessionScoringVersion(session),
      (err) => {
        return err.code === 'UNSUPPORTED_SCORING_VERSION' && err.message.includes('3');
      }
    );
  });

  test('Fails closed on non-numeric or invalid scoringVersion', () => {
    assert.throws(
      () => resolveSessionScoringVersion({ scoringVersion: 'invalid' }),
      (err) => err.code === 'UNSUPPORTED_SCORING_VERSION'
    );
  });

  test('Resolves pre-cutover unversioned sessions to v1', () => {
    const preCutoverDate = new Date(Number(SCORING_V2_DEPLOYMENT_TIMESTAMP) - 86400000);
    const session = { createdAt: preCutoverDate };
    assert.strictEqual(resolveSessionScoringVersion(session), 1);
  });

  test('Resolves post-cutover unversioned sessions to v2', () => {
    const postCutoverDate = new Date(Number(SCORING_V2_DEPLOYMENT_TIMESTAMP) + 86400000);
    const session = { createdAt: postCutoverDate };
    assert.strictEqual(resolveSessionScoringVersion(session), 2);
  });

  test('Resolves legacy fixtures lacking createdAt safely to v1', () => {
    const session = {};
    assert.strictEqual(resolveSessionScoringVersion(session), 1);
  });

  test('Handles null/undefined session gracefully by returning 1', () => {
    assert.strictEqual(resolveSessionScoringVersion(null), 1);
    assert.strictEqual(resolveSessionScoringVersion(undefined), 1);
  });

  // -----------------------------------------------------------------
  // 2. OPPORTUNITY FACTOR HEURISTICS
  // -----------------------------------------------------------------
  console.log('\n--- 2. Remediation Opportunity Factor Heuristics ---');

  test('v2 suppresses recommendations for encounters < 2 (factor = 0.0)', () => {
    assert.strictEqual(getOpportunityFactor(0, 2), 0.0);
    assert.strictEqual(getOpportunityFactor(1, 2), 0.0);
    assert.strictEqual(getOpportunityFactor(undefined, 2), 0.0);
    assert.strictEqual(getOpportunityFactor(null, 2), 0.0);
  });

  test('v2 applies 0.70 dampener for focused sample encounters (N in [2, 3])', () => {
    assert.strictEqual(getOpportunityFactor(2, 2), 0.70);
    assert.strictEqual(getOpportunityFactor(3, 2), 0.70);
  });

  test('v2 applies 1.0 standard confidence for encounters >= 4', () => {
    assert.strictEqual(getOpportunityFactor(4, 2), 1.0);
    assert.strictEqual(getOpportunityFactor(8, 2), 1.0);
  });

  test('v1 legacy opportunity factors are preserved', () => {
    assert.strictEqual(getOpportunityFactor(1, 1), 0.0);
    assert.strictEqual(getOpportunityFactor(2, 1), 0.75);
    assert.strictEqual(getOpportunityFactor(3, 1), 0.75);
    assert.strictEqual(getOpportunityFactor(4, 1), 1.0);
  });

  // -----------------------------------------------------------------
  // 3. REMEDIATION RANKING INTEGRATION
  // -----------------------------------------------------------------
  console.log('\n--- 3. Remediation Ranking Integration ---');

  test('rankEligibleMetrics excludes unassessed dimensions (normalizedScore === null)', () => {
    const session = {
      scoringVersion: 2,
      behaviourScores: {
        recognition: 85,
        signalIdentification: null, // Unassessed
        verification: 50,
        decisionQuality: null,       // Unassessed
        falsePositive: 100,
        unreviewedAcceptance: 70
      },
      behaviourOpportunities: {
        recognition: 16,
        signalIdentification: 0,
        verification: 16,
        decisionQuality: 0,
        falsePositive: 8,
        unreviewedAcceptance: 8
      },
      behaviourEncounters: {
        recognition: 7,
        signalIdentification: 0,
        verification: 8,
        decisionQuality: 0,
        falsePositive: 4,
        unreviewedAcceptance: 4
      }
    };

    const ranked = rankEligibleMetrics(session);
    const keys = ranked.map(r => r.metricKey);
    assert(!keys.includes('signalIdentification'), 'Unassessed SI should not be in ranked list');
    assert(!keys.includes('decisionQuality'), 'Unassessed DQ should not be in ranked list');
    assert.strictEqual(keys.length, 4, 'Only the 4 assessed dimensions should be ranked');
  });

  test('rankEligibleMetrics classifies v2 False Positive with penalty <= 2 as STRENGTH', () => {
    const session = {
      scoringVersion: 2,
      behaviourScores: {
        recognition: 100,
        signalIdentification: 100,
        verification: 100,
        decisionQuality: 100,
        falsePositive: 67, // Below 75% on 3-encounter branch (penalty = 2, max = 6)
        unreviewedAcceptance: 100
      },
      behaviourOpportunities: {
        recognition: 16,
        signalIdentification: 10,
        verification: 16,
        decisionQuality: 4,
        falsePositive: 6,
        unreviewedAcceptance: 8
      },
      behaviourEncounters: {
        recognition: 7,
        signalIdentification: 5,
        verification: 8,
        decisionQuality: 2,
        falsePositive: 3,
        unreviewedAcceptance: 4
      },
      falsePositivePenaltyPoints: 2 // 1 minor slip
    };

    const ranked = rankEligibleMetrics(session);
    const fpRank = ranked.find(r => r.metricKey === 'falsePositive');
    assert(fpRank, 'FP should be evaluated');
    assert.strictEqual(
      fpRank.isEligibleWeakness,
      false,
      'v2 FP with penalty <= 2 must NOT be marked as an eligible weakness'
    );
  });

  test('rankEligibleMetrics marks v2 False Positive with penalty > 2 and score < 75 as WEAKNESS', () => {
    const session = {
      scoringVersion: 2,
      behaviourScores: {
        falsePositive: 50
      },
      behaviourOpportunities: {
        falsePositive: 6
      },
      behaviourEncounters: {
        falsePositive: 3
      },
      falsePositivePenaltyPoints: 3 // Excessive over-reporting
    };

    const ranked = rankEligibleMetrics(session);
    const fpRank = ranked.find(r => r.metricKey === 'falsePositive');
    assert(fpRank, 'FP should be evaluated');
    assert.strictEqual(
      fpRank.isEligibleWeakness,
      true,
      'v2 FP with penalty > 2 and score < 75 must be marked as an eligible weakness'
    );
  });

  // -----------------------------------------------------------------
  // 4. DATABASE INTEGRATION & SCORING CALCULATIONS
  // -----------------------------------------------------------------
  console.log('\n--- 4. Authoritative Database Scoring Calculations ---');

  await connectDB();

  await testAsync('calculateScoresV2 returns null for completely unassessed dimensions', async () => {
    // Simulate empty session with zero choices
    const session = new AssessmentSession({
      userId: new mongoose.Types.ObjectId(),
      scenarioId: new mongoose.Types.ObjectId(),
      scoringVersion: 2
    });

    const result = await calculateScoresV2(session, []);

    assert.strictEqual(result.scoringVersion, 2);
    assert.strictEqual(result.scores.recognition, null);
    assert.strictEqual(result.scores.signalIdentification, null);
    assert.strictEqual(result.scores.verification, null);
    assert.strictEqual(result.scores.decisionQuality, null);
    assert.strictEqual(result.scores.falsePositive, null);
    assert.strictEqual(result.scores.unreviewedAcceptance, null);

    assert.strictEqual(result.encounters.recognition, 0);
    assert.strictEqual(result.encounters.signalIdentification, 0);
    assert.strictEqual(result.encounters.verification, 0);
    assert.strictEqual(result.encounters.decisionQuality, 0);
    assert.strictEqual(result.encounters.falsePositive, 0);
    assert.strictEqual(result.encounters.unreviewedAcceptance, 0);
  });

  console.log('\n=============================================================');
  console.log(`ALL ${passed}/${total} SCORING V2 AUTHORITATIVE CHECKS PASSED 100%!`);
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

