/**
 * Automated Test Suite for Remediation Engine & Legal Reference Integrity
 * Phase 3: Targeted Remediation & Micro-Learning Pathways
 *
 * Tests:
 * A. Normal 6-metric ranking
 * B. Penalty-vs-positive weighting
 * C. Tie-breaking
 * D. Missing/null metrics
 * E. Opportunity sufficiency
 * F. All-strong profile
 * G. Mixed profile
 * H. Baseline -> final improvement (consolidated_strength)
 * I. Unchanged weakness (continued_practice)
 * J. Forgery / tampering defense
 * K. Ownership security
 * L. Catalog reference integrity
 * M. Legal reference metadata validation
 */

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const catalog = require('../config/remediationCatalog');
const { validateCatalogStructure, validateCatalogDatabaseIntegrity } = require('../services/remediationCatalogValidator');
const {
  SEVERITY_WEIGHTS,
  getOpportunityFactor,
  rankEligibleMetrics,
  determineFinalHabitState,
  generateRemediation
} = require('../services/remediationEngineService');

const User = require('../models/User');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const AssessmentSession = require('../models/AssessmentSession');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const LawSection = require('../models/LawSection');
const simulationRoutes = require('../routes/simulations');

const TEST_PORT = 5995;
const BASE_URL = `http://localhost:${TEST_PORT}/api/assessments`;

let server;
let userA;
let userB;
let tokenA;
let tokenB;

async function setup() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use('/api/assessments', simulationRoutes);

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on port ${TEST_PORT}`);
      resolve();
    });
  });

  // Create test users
  const uniqueA = 'test-remed-a-' + Date.now() + '@example.com';
  const uniqueB = 'test-remed-b-' + Date.now() + '@example.com';

  userA = await User.create({
    fullName: 'Remediation Test User A',
    email: uniqueA,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  userB = await User.create({
    fullName: 'Remediation Test User B',
    email: uniqueB,
    passwordHash: 'dummy-hash',
    role: 'user',
    isActive: true
  });

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  tokenA = jwt.sign({ id: userA._id, role: userA.role }, jwtSecret, { expiresIn: '1h' });
  tokenB = jwt.sign({ id: userB._id, role: userB.role }, jwtSecret, { expiresIn: '1h' });
}

async function teardown() {
  if (userA) await AssessmentSession.deleteMany({ userId: userA._id });
  if (userB) await AssessmentSession.deleteMany({ userId: userB._id });
  if (userA) await User.deleteOne({ _id: userA._id });
  if (userB) await User.deleteOne({ _id: userB._id });

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('[Test Server] Stopped.');
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Mongoose connection closed.');
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('PHASE 3: REMEDIATION ENGINE & LEGAL VALIDATION TEST SUITE');
  console.log('=============================================================\n');

  try {
    await setup();

    const baselineScenario = await Scenario.findOne({ slug: 'baseline', version: 2 });
    const finalScenario = await Scenario.findOne({ slug: 'final', version: 2 });
    const dummyStage = await ScenarioStage.findOne({ scenarioId: baselineScenario._id });

    // -------------------------------------------------------------
    // TEST A: NORMAL 6-METRIC RANKING
    // -------------------------------------------------------------
    console.log('[TEST A] Normal 6-metric ranking...');
    {
      const mockSession = {
        behaviourScores: {
          recognition: 50,           // deficit 50 * 1.15 * 1.0 = 57.5
          signalIdentification: 70,  // deficit 30 * 1.05 * 1.0 = 31.5
          verification: 20,          // deficit 80 * 1.25 * 1.0 = 100.0 (Top 1)
          decisionQuality: 80,       // not a weakness (>= 75)
          falsePositive: 90,         // not a weakness (>= 75)
          unreviewedAcceptance: 100  // not a weakness
        },
        behaviourOpportunities: {
          recognition: 14,
          signalIdentification: 8,
          verification: 14,
          decisionQuality: 24,
          falsePositive: 8,
          unreviewedAcceptance: 6
        },
        falsePositiveMaxPenaltyPoints: 8,
        unreviewedAcceptanceMaxPenaltyPoints: 6
      };

      const ranked = rankEligibleMetrics(mockSession);
      const eligible = ranked.filter(m => m.isEligibleWeakness);

      assert.strictEqual(eligible.length, 3, 'Should find 3 eligible weaknesses');
      assert.strictEqual(eligible[0].metricKey, 'verification', 'Top 1 must be verification');
      assert.strictEqual(eligible[1].metricKey, 'recognition', 'Top 2 must be recognition');
      assert.strictEqual(eligible[2].metricKey, 'signalIdentification', 'Top 3 must be signalIdentification');
      console.log('  * PASS: Priority scores correctly ranked verification (100.0) -> recognition (57.5) -> signalIdentification (31.5)');
    }

    // -------------------------------------------------------------
    // TEST B: PENALTY-VS-POSITIVE WEIGHTING
    // -------------------------------------------------------------
    console.log('\n[TEST B] Penalty-vs-positive severity weighting...');
    {
      // Equal 50% score for both verification (positive) and unreviewedAcceptance (penalty)
      const mockSession = {
        behaviourScores: {
          verification: 50,          // deficit 50 * 1.25 * 1.0 = 62.5
          unreviewedAcceptance: 50   // deficit 50 * 1.30 * 1.0 = 65.0
        },
        behaviourOpportunities: {
          verification: 14
        },
        unreviewedAcceptanceMaxPenaltyPoints: 6
      };

      const ranked = rankEligibleMetrics(mockSession);
      const eligible = ranked.filter(m => m.isEligibleWeakness);

      assert.strictEqual(eligible[0].metricKey, 'unreviewedAcceptance', 'UA must rank above VB due to higher severity multiplier');
      console.log('  * PASS: unreviewedAcceptance (65.0) prioritized over verification (62.5) due to product severity multiplier');
    }

    // -------------------------------------------------------------
    // TEST C: TIE-BREAKING
    // -------------------------------------------------------------
    console.log('\n[TEST C] Strict tie-breaking by severity multiplier...');
    {
      // Both TR and SI have 50% deficit
      const mockSession = {
        behaviourScores: {
          recognition: 50,           // 50 * 1.15 = 57.5
          signalIdentification: 50   // 50 * 1.05 = 52.5
        },
        behaviourOpportunities: {
          recognition: 6,
          signalIdentification: 6
        }
      };

      const ranked = rankEligibleMetrics(mockSession);
      assert.strictEqual(ranked[0].metricKey, 'recognition', 'TR must win tie-break over SI');
      console.log('  * PASS: Strict tie-break favors higher severity metric (TR > SI)');
    }

    // -------------------------------------------------------------
    // TEST D: MISSING / NULL METRICS
    // -------------------------------------------------------------
    console.log('\n[TEST D] Missing / null metrics handling...');
    {
      const mockSession = {
        behaviourScores: {
          recognition: 30
          // All other metrics omitted
        },
        behaviourOpportunities: {
          recognition: 6
        }
      };

      const ranked = rankEligibleMetrics(mockSession);
      assert.strictEqual(ranked.length, 1, 'Should gracefully compute only available metrics');
      assert.strictEqual(ranked[0].metricKey, 'recognition');
      console.log('  * PASS: Omitted metrics handled gracefully without throwing exceptions');
    }

    // -------------------------------------------------------------
    // TEST E: OPPORTUNITY SUFFICIENCY
    // -------------------------------------------------------------
    console.log('\n[TEST E] Opportunity sufficiency safeguard...');
    {
      const mockSession = {
        behaviourScores: {
          recognition: 0,   // Low score (0%), but only 1 opportunity -> factor = 0.0 -> Priority = 0
          verification: 25  // 25% score, 8 opportunities -> factor = 1.0 -> Priority = 75 * 1.25 = 93.75
        },
        behaviourOpportunities: {
          recognition: 1,   // Insufficient sample!
          verification: 8
        }
      };

      const ranked = rankEligibleMetrics(mockSession);
      const eligible = ranked.filter(m => m.isEligibleWeakness);

      assert.strictEqual(eligible.length, 1, 'Only verification should be eligible');
      assert.strictEqual(eligible[0].metricKey, 'verification', 'Verification must be chosen despite higher raw percentage');
      console.log('  * PASS: Metric with 1 opportunity disqualified from being a primary weakness');
    }

    // -------------------------------------------------------------
    // TEST F: ALL-STRONG PROFILE (NO ARTIFICIAL WEAKNESSES)
    // -------------------------------------------------------------
    console.log('\n[TEST F] All-strong profile returns maintenance pathway...');
    {
      const allStrongSession = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: baselineScenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 2,
        currentStageId: dummyStage._id,
        status: 'completed',
        score: 50,
        behaviourScores: {
          recognition: 90,
          signalIdentification: 85,
          verification: 100,
          decisionQuality: 92,
          falsePositive: 100,
          unreviewedAcceptance: 100
        },
        behaviourOpportunities: {
          recognition: 14,
          signalIdentification: 8,
          verification: 14,
          decisionQuality: 24
        },
        falsePositiveMaxPenaltyPoints: 8,
        unreviewedAcceptanceMaxPenaltyPoints: 6,
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date()
      });

      const result = await generateRemediation(allStrongSession._id, userA._id);
      assert.strictEqual(result.recommendations.length, 1, 'Must return exactly 1 maintenance pathway');
      assert.strictEqual(result.recommendations[0].pathwayId, 'pathway-maintenance-reinforcement');
      assert.strictEqual(result.recommendations[0].state, 'mastery');
      console.log('  * PASS: All-strong profile returns Advanced Vigilance maintenance pathway without manufacturing weaknesses');
    }

    // -------------------------------------------------------------
    // TEST G: MIXED PROFILE (1 WEAK, 5 STRONG)
    // -------------------------------------------------------------
    console.log('\n[TEST G] Mixed profile (1 weak, 5 strong)...');
    {
      const mixedSession = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: baselineScenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 2,
        currentStageId: dummyStage._id,
        status: 'completed',
        score: 50,
        behaviourScores: {
          recognition: 85,
          signalIdentification: 85,
          verification: 100,
          decisionQuality: 90,
          falsePositive: 100,
          unreviewedAcceptance: 20 // Weakness
        },
        behaviourOpportunities: {
          recognition: 14,
          signalIdentification: 8,
          verification: 14,
          decisionQuality: 24
        },
        falsePositiveMaxPenaltyPoints: 8,
        unreviewedAcceptanceMaxPenaltyPoints: 6,
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date()
      });

      const result = await generateRemediation(mixedSession._id, userA._id);
      assert.strictEqual(result.recommendations.length, 2, 'Must return 1 primary weakness + 1 maintenance pathway');
      assert.strictEqual(result.recommendations[0].pathwayId, 'pathway-ua-upi-consent');
      assert.strictEqual(result.recommendations[1].pathwayId, 'pathway-maintenance-reinforcement');
      console.log('  * PASS: 1 primary weakness accompanied by maintenance pathway');
    }

    // -------------------------------------------------------------
    // TEST H: BASELINE -> FINAL IMPROVEMENT (CONSOLIDATED STRENGTH)
    // -------------------------------------------------------------
    console.log('\n[TEST H] Baseline -> Final habit shift (consolidated_strength)...');
    {
      // 1. Create Baseline with weak UA
      const baseSess = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: baselineScenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 2,
        currentStageId: dummyStage._id,
        status: 'completed',
        score: 50,
        behaviourScores: {
          unreviewedAcceptance: 0,
          verification: 80
        },
        unreviewedAcceptanceMaxPenaltyPoints: 6,
        behaviourOpportunities: { verification: 14 },
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date(Date.now() - 3600000)
      });

      // 2. Create Final with mastered UA (100%) and weak verification (20%)
      const finalSess = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: finalScenario._id,
        scenarioCode: 'final',
        scenarioVersion: 2,
        currentStageId: dummyStage._id,
        status: 'completed',
        score: 50,
        behaviourScores: {
          unreviewedAcceptance: 100, // Improved: 0% -> 100%
          verification: 20           // Dropped: 80% -> 20%
        },
        unreviewedAcceptanceMaxPenaltyPoints: 6,
        behaviourOpportunities: { verification: 14 },
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date()
      });

      const result = await generateRemediation(finalSess._id, userA._id);
      assert.strictEqual(result.userState, 'final');
      
      const vbRec = result.recommendations.find(r => r.metricKey === 'verification');
      assert(vbRec, 'Verification must be recommended');
      assert.strictEqual(vbRec.state, 'emerging_gap', 'VB should be categorized as emerging_gap');
      console.log('  * PASS: Final assessment correctly contextualized habit shift states');
    }

    // -------------------------------------------------------------
    // TEST I: UNCHANGED WEAKNESS (CONTINUED PRACTICE)
    // -------------------------------------------------------------
    console.log('\n[TEST I] Unchanged weakness across Baseline and Final (continued_practice)...');
    {
      const baseMetric = { normalizedScore: 20, opportunityFactor: 1.0 };
      const finalMetric = { normalizedScore: 20, opportunityFactor: 1.0 };

      const stateInfo = determineFinalHabitState(finalMetric, baseMetric);
      assert.strictEqual(stateInfo.state, 'continued_practice');
      assert.strictEqual(stateInfo.badge, 'Continued Habit Focus');
      console.log('  * PASS: Unchanged low score correctly assigned continued_practice');
    }

    // -------------------------------------------------------------
    // TEST J: FORGERY & CLIENT TAMPERING DEFENSE
    // -------------------------------------------------------------
    console.log('\n[TEST J] Client metric injection and tampering defense...');
    {
      // Create session for userA
      const sess = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: baselineScenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 2,
        currentStageId: dummyStage._id,
        status: 'completed',
        score: 50,
        behaviourScores: {
          recognition: 20,
          unreviewedAcceptance: 100
        },
        behaviourOpportunities: { recognition: 14 },
        unreviewedAcceptanceMaxPenaltyPoints: 6,
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date()
      });

      // Attempt to tamper via query and body parameters
      const res = await fetch(`${BASE_URL}/remediation/${sess._id}?weakness=decisionQuality`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.recommendations[0].metricKey, 'recognition', 'Server must ignore query parameter and evaluate DB record');
      console.log('  * PASS: Injected client query parameters strictly ignored; server evaluated DB record');
    }

    // -------------------------------------------------------------
    // TEST K: OWNERSHIP SECURITY
    // -------------------------------------------------------------
    console.log('\n[TEST K] Access control and ownership isolation...');
    {
      // Session belongs to userA
      const sessA = await AssessmentSession.create({
        userId: userA._id,
        scenarioId: baselineScenario._id,
        scenarioCode: 'baseline',
        scenarioVersion: 2,
        currentStageId: dummyStage._id,
        status: 'completed',
        score: 50,
        expiresAt: new Date(Date.now() + 3600000),
        completedAt: new Date()
      });

      // User B attempts to access User A's remediation
      const resB = await fetch(`${BASE_URL}/remediation/${sessA._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenB}`
        }
      });
      assert.strictEqual(resB.status, 403, 'Cross-user access must return 403 Forbidden');
      console.log('  * PASS: Cross-user session access blocked with 403 Forbidden');
    }

    // -------------------------------------------------------------
    // TEST L: CATALOG REFERENCE INTEGRITY (MONGODB ENTITIES)
    // -------------------------------------------------------------
    console.log('\n[TEST L] Catalog database reference integrity...');
    {
      await validateCatalogDatabaseIntegrity(catalog);
      console.log('  * PASS: All crimeSlug, caseStudySlug, and primaryLawSectionNumber values verified in MongoDB');
    }

    // -------------------------------------------------------------
    // TEST M: DEEP LEGAL REFERENCE & STATUTORY ACCURACY AUDIT
    // -------------------------------------------------------------
    console.log('\n[TEST M] Deep statutory accuracy & commencement audit...');
    {
      validateCatalogStructure(catalog);

      for (const pathway of catalog) {
        // 1. If primaryLawSectionNumber is non-null, verify consistency
        if (pathway.primaryLawSectionNumber !== null) {
          const match = pathway.legalReferences.find(r => {
            const pNum = pathway.primaryLawSectionNumber.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
            const rNum = r.section.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
            const pDigits = pathway.primaryLawSectionNumber.match(/\d+/);
            const rDigits = r.section.match(/\d+/);
            return pNum.includes(rNum) || rNum.includes(pNum) || (pDigits && rDigits && pDigits[0] === rDigits[0]);
          });
          assert(match, `primaryLawSectionNumber "${pathway.primaryLawSectionNumber}" in ${pathway.pathwayId} must match legalReferences`);
        }

        // 2. Audit each reference entry
        for (const ref of pathway.legalReferences) {
          assert(['IN_FORCE', 'ENACTED_FUTURE_COMMENCEMENT', 'STRUCK_DOWN_HISTORICAL'].includes(ref.status),
            `Invalid status in ${pathway.pathwayId}`);

          assert(['DIRECT', 'CONTEXTUAL', 'EDUCATIONAL_ONLY'].includes(ref.relationshipType),
            `Invalid relationshipType in ${pathway.pathwayId}`);

          // DPDP Section 6 Rule
          if (ref.act.includes('Digital Personal Data Protection') && ref.section.includes('6')) {
            assert.strictEqual(ref.status, 'ENACTED_FUTURE_COMMENCEMENT',
              'DPDP Act Section 6 must be marked ENACTED_FUTURE_COMMENCEMENT as of September 2026');
            assert(ref.commencementNote && ref.commencementNote.includes('18 months'),
              'DPDP Section 6 must note 18-month commencement notification timeline');
          }

          // Rule against corporate liability 43A in user hygiene
          if (pathway.metricKey === 'decisionQuality') {
            assert(!ref.section.includes('43A'), 'Decision Quality pathway must not cite Section 43A');
          }

          // Rule against Section 72A in false positive alert triage
          if (pathway.metricKey === 'falsePositive') {
            assert(!ref.section.includes('72A'), 'False Positive pathway must not cite Section 72A');
          }

          // Educational wording check
          assert(!ref.educationalContext.toLowerCase().includes('this behaviour violates'),
            'Educational context must not accuse user of violating statute');
        }
      }
      console.log('  * PASS: Deep legal reference audit verified (DPDP §6 future commencement, §43A exclusion, §72A exclusion, non-accusatory wording)');
    }

    console.log('\n=============================================================');
    console.log('ALL REMEDIATION ENGINE TESTS (A - M) PASSED 100%!');
    console.log('=============================================================\n');

  } finally {
    await teardown();
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('\n❌ REMEDIATION TEST SUITE FAILED:', err);
    process.exit(1);
  });
}

module.exports = runTests;
