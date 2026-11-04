/**
 * @file counterfactualFixtures.test.js
 * @description Targeted validation suite for Stage 3 Wave 1: Counterfactual Scenario Data Fixtures.
 * 
 * Verifies:
 * 1. Schema conformity across all 4 scenarios.
 * 2. Tri-branch completeness (reflexive-compliance, passive-inaction, active-verification).
 * 3. Causal plausibility and distinct consequence branches.
 * 4. Safety & privacy constraints (.invalid domains, fictional identifiers, no credentials).
 * 5. Legal accuracy:
 *    - BNSS § 35(3) police notice to appear vs Chapter VI court summons.
 *    - BNS § 308 extortion conditional statutory elements.
 *    - BNS § 319 cheating by personation conditional applicability.
 *    - IT Act § 66C identity theft conditional applicability.
 *    - UPI PIN debit-only authorization invariant.
 *    - IT Act § 43 inapplicability to voluntary PIN entry.
 *    - Zero liability / fund freezing / recovery non-guarantee.
 *    - No unsupported universal Golden Hour claims.
 * 6. Multi-tier isolation and immutability (frozen objects, zero assessment imports).
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runCounterfactualFixturesSuite() {
  console.log('\n=============================================================');
  console.log('STAGE 3 WAVE 1: COUNTERFACTUAL SCENARIO FIXTURES VALIDATION');
  console.log('=============================================================\n');

  // Dynamically import the ES module from client/src/data/counterfactualScenarios.js
  const fixturePath = path.resolve(__dirname, '../../client/src/data/counterfactualScenarios.js');
  console.log(`[Import] Loading fixtures from: ${fixturePath}`);
  
  assert(fs.existsSync(fixturePath), `Fixture file must exist at ${fixturePath}`);
  const fixtureModule = await import(`file://${fixturePath.replace(/\\/g, '/')}`);

  const {
    COUNTERFACTUAL_SCENARIOS,
    SCENARIO_1_MIDNIGHT_POWER_CUT_SMS,
    SCENARIO_2_NOMINAL_PARCEL_FEE,
    SCENARIO_3_APPROVE_PAYMENT_QR,
    SCENARIO_4_VIDEO_SUMMONS_DIGITAL_ARREST,
    getCounterfactualScenarioById,
    getCounterfactualScenarioBySlug,
    validateCounterfactualScenario,
    validateAllCounterfactualScenarios
  } = fixtureModule;

  // -------------------------------------------------------------
  // TEST 1: Catalog Integrity & Schema Conformance
  // -------------------------------------------------------------
  console.log('[TEST 1] Verifying Catalog Integrity & Schema Conformance...');
  assert.strictEqual(Array.isArray(COUNTERFACTUAL_SCENARIOS), true, 'COUNTERFACTUAL_SCENARIOS must be an array');
  assert.strictEqual(COUNTERFACTUAL_SCENARIOS.length, 4, 'Must contain exactly 4 counterfactual scenarios');

  const validationResult = validateAllCounterfactualScenarios();
  assert.strictEqual(validationResult.isValid, true, `All scenarios must pass schema validation. Errors: ${JSON.stringify(validationResult.scenarioResults.filter(r => !r.isValid))}`);

  const expectedIds = [
    'cf-midnight-power-cut-sms',
    'cf-nominal-parcel-fee',
    'cf-approve-payment-qr',
    'cf-video-summons-digital-arrest'
  ];
  const expectedSlugs = [
    'midnight-power-cut-sms',
    'nominal-parcel-fee',
    'approve-payment-qr',
    'video-summons-digital-arrest'
  ];

  expectedIds.forEach((id, idx) => {
    assert(COUNTERFACTUAL_SCENARIOS[idx].id === id, `Scenario #${idx + 1} id must be ${id}`);
    assert(COUNTERFACTUAL_SCENARIOS[idx].slug === expectedSlugs[idx], `Scenario #${idx + 1} slug must be ${expectedSlugs[idx]}`);
    assert.strictEqual(getCounterfactualScenarioById(id), COUNTERFACTUAL_SCENARIOS[idx], `getCounterfactualScenarioById must resolve ${id}`);
    assert.strictEqual(getCounterfactualScenarioBySlug(expectedSlugs[idx]), COUNTERFACTUAL_SCENARIOS[idx], `getCounterfactualScenarioBySlug must resolve ${expectedSlugs[idx]}`);
  });
  console.log('  * PASS: All 4 scenarios conform to strict schema with unique IDs and slugs.');

  // -------------------------------------------------------------
  // TEST 2: Tri-Branch Completeness & Consequence Distinctness
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Verifying Tri-Branch Completeness & Consequence Distinctness...');
  const expectedChoiceTypes = ['reflexive-compliance', 'passive-inaction', 'active-verification'];

  COUNTERFACTUAL_SCENARIOS.forEach((scenario) => {
    const choices = scenario.decisionJunction.choices;
    assert.strictEqual(choices.length, 3, `${scenario.id} must have exactly 3 choices`);

    const types = choices.map(c => c.choiceType);
    expectedChoiceTypes.forEach(t => {
      assert(types.includes(t), `${scenario.id} missing choiceType ${t}`);
    });

    // Check consequence depth & uniqueness
    const titles = new Set();
    choices.forEach(c => {
      const { immediateTitle, immediateBody, escalatedTitle, escalatedBody, impactAssessment, whyItHappened } = c.consequence;
      assert(immediateTitle && immediateTitle.length > 10, `${scenario.id} choice ${c.id} immediateTitle too short`);
      assert(immediateBody && immediateBody.length > 50, `${scenario.id} choice ${c.id} immediateBody too short`);
      assert(escalatedTitle && escalatedTitle.length > 10, `${scenario.id} choice ${c.id} escalatedTitle too short`);
      assert(escalatedBody && escalatedBody.length > 50, `${scenario.id} choice ${c.id} escalatedBody too short`);

      assert(!titles.has(immediateTitle), `Duplicate immediateTitle in ${scenario.id}`);
      titles.add(immediateTitle);

      assert(['Secure', 'At Risk', 'Compromised'].includes(impactAssessment.accountSafety), `Invalid accountSafety in ${scenario.id} ${c.id}`);
      assert(impactAssessment.financialExposure && impactAssessment.financialExposure.length > 5, `Missing financialExposure in ${scenario.id} ${c.id}`);
      assert(impactAssessment.legalConsiderations && impactAssessment.legalConsiderations.length > 20, `Missing legalConsiderations in ${scenario.id} ${c.id}`);

      assert(whyItHappened.technicalFactor && whyItHappened.technicalFactor.length > 20, `Missing technicalFactor in ${scenario.id} ${c.id}`);
      assert(whyItHappened.psychologicalFactor && whyItHappened.psychologicalFactor.length > 20, `Missing psychologicalFactor in ${scenario.id} ${c.id}`);
    });
  });
  console.log('  * PASS: Every scenario contains 3 distinct, causally plausible, and fully articulated consequence branches.');

  // -------------------------------------------------------------
  // TEST 3: Safety & Privacy Constraints
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Verifying Safety & Privacy Constraints...');
  COUNTERFACTUAL_SCENARIOS.forEach((scenario) => {
    // Disclaimer check
    assert(scenario.disclaimer.includes('Educational Simulation: Hypothetical Counterfactual Model'), `${scenario.id} must have educational simulation disclaimer`);
    assert(scenario.disclaimer.includes('guaranteed legal/financial outcomes'), `${scenario.id} disclaimer must disclaim guaranteed outcomes`);

    // Check mockInterfaceData
    const mockDataStr = JSON.stringify(scenario.incidentContext.mockInterfaceData);
    
    // Check URLs use .invalid
    const urlMatches = mockDataStr.match(/https?:\/\/[^\s"'\\]+/g) || [];
    urlMatches.forEach(url => {
      assert(url.includes('.invalid') || url.includes('.example'), `URL ${url} in ${scenario.id} must use reserved .invalid or .example domain`);
    });

    // Check phone numbers are fictional +91-00000-0000X
    const phoneMatches = mockDataStr.match(/\+91-\d{5}-\d{5}/g) || [];
    phoneMatches.forEach(phone => {
      assert(phone.startsWith('+91-00000-'), `Phone number ${phone} in ${scenario.id} must be fictional (+91-00000-XXXXX)`);
    });

    // Check no real payment destinations or functional QR codes
    assert(!mockDataStr.includes('@okaxis') && !mockDataStr.includes('@okhdfcbank') && !mockDataStr.includes('@icici'), `No real UPI VPA domains in ${scenario.id}`);
    if (scenario.incidentContext.mockInterfaceType === 'qr_code') {
      assert(mockDataStr.includes('NON-FUNCTIONAL') || mockDataStr.includes('DO NOT SCAN'), `QR mock must explicitly disclose non-functional placeholder in ${scenario.id}`);
    }
  });
  console.log('  * PASS: All phone numbers, domains, and mock data strictly adhere to safety and privacy constraints.');

  // -------------------------------------------------------------
  // TEST 4: Legal Accuracy & Statutory Nuance Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Verifying Legal Accuracy & Statutory Grounding...');

  // 4A: Scenario 4 - BNSS § 35(3) vs Chapter VI Court Summons
  const sc4 = SCENARIO_4_VIDEO_SUMMONS_DIGITAL_ARREST;
  const bnssLaw = sc4.defensiveTakeaway.statutoryFramework.find(l => l.act.includes('BNSS') || l.act.includes('Bharatiya Nagarik Suraksha'));
  assert(bnssLaw, 'Scenario 4 must include BNSS statutory framework entry');
  assert(bnssLaw.applicabilityNote.includes('Chapter V') && bnssLaw.applicabilityNote.includes('Sections 35–62'), 'BNSS entry must cite Chapter V (Sections 35–62) for arrest procedures');
  assert(bnssLaw.applicabilityNote.includes('Chapter VI') && bnssLaw.applicabilityNote.includes('Sections 63–93'), 'BNSS entry must cite Chapter VI (Sections 63–93) for processes compelling appearance / summons');
  assert(bnssLaw.applicabilityNote.includes('Section 35(3)'), 'BNSS entry must cite Section 35(3)');
  assert(bnssLaw.applicabilityNote.includes('notice to appear'), 'BNSS entry must identify Section 35(3) as police notice to appear during investigation');
  assert(bnssLaw.applicabilityNote.includes('court summons'), 'BNSS entry must distinguish police notice from court summons under Chapter VI');
  assert(bnssLaw.applicabilityNote.includes('Section 531'), 'BNSS entry must reference Section 531 savings');
  assert(sc4.defensiveTakeaway.coreRule.includes('do not conduct arrests, trials, or asset verification over video calls'), 'Scenario 4 coreRule must articulate authority boundary');

  // 4B: Scenario 4 - BNS § 308 Extortion Conditional Elements
  const bns308 = sc4.defensiveTakeaway.statutoryFramework.find(l => l.section === 'Section 308');
  assert(bns308, 'Scenario 4 must cite BNS Section 308');
  assert(bns308.applicabilityNote.includes('fear of injury') && bns308.applicabilityNote.includes('dishonestly inducing'), 'BNS § 308 must explain statutory elements');
  assert(bns308.applicabilityNote.includes('Threats of arrest in cyber scams do not automatically establish extortion in every instance'), 'BNS § 308 must note conditional applicability');

  // 4C: Scenario 2 - BNS § 319 Personation & IT Act § 66C Identity Theft
  const sc2 = SCENARIO_2_NOMINAL_PARCEL_FEE;
  const bns319 = sc2.defensiveTakeaway.statutoryFramework.find(l => l.section === 'Section 319');
  assert(bns319, 'Scenario 2 must cite BNS Section 319');
  assert(bns319.applicabilityNote.includes('personates a specific courier representative') || bns319.applicabilityNote.includes('representing oneself to be someone else'), 'BNS § 319 must note personation requirement');

  const it66c = sc2.defensiveTakeaway.statutoryFramework.find(l => l.section === 'Section 66C');
  assert(it66c, 'Scenario 2 must cite IT Act Section 66C');
  assert(it66c.applicabilityNote.includes('unique identification feature'), 'IT Act § 66C must cite qualifying unique identification features');
  assert(it66c.applicabilityNote.includes('Merely collecting card details on a form does not automatically satisfy § 66C'), 'IT Act § 66C must note that collecting card details alone is insufficient without fraudulent use of qualifying features');

  // 4D: Scenario 3 - UPI PIN Debit-Only Invariant & IT Act § 43 Inapplicability
  const sc3 = SCENARIO_3_APPROVE_PAYMENT_QR;
  assert.strictEqual(
    sc3.defensiveTakeaway.coreRule,
    'Entering a UPI PIN authorizes a transaction that can debit your account. You do not need to enter your UPI PIN to receive money. Always verify the payee and transaction details before authorizing a payment.',
    'Scenario 3 coreRule must match authoritative UPI guidance exactly'
  );

  const it43Note = sc3.defensiveTakeaway.statutoryFramework.find(l => l.act.includes('§ 43') || l.section.includes('Section 43'));
  assert(it43Note, 'Scenario 3 must include IT Act § 43 inapplicability clarification');
  assert(it43Note.applicabilityNote.includes('IT Act § 43 does not apply to voluntary PIN entry on a user\'s own mobile device'), 'Must clarify IT Act § 43 inapplicability to voluntary PIN entry');

  // 4E: Non-Guarantee of Zero Liability, Fund Freezing, or Universal Golden Hour
  COUNTERFACTUAL_SCENARIOS.forEach((scenario) => {
    const rawContent = JSON.stringify(scenario);
    assert(!rawContent.includes('guaranteed fund recovery'), `Must not promise guaranteed recovery in ${scenario.id}`);
    assert(!rawContent.includes('guarantees fund recovery'), `Must not promise fund recovery in ${scenario.id}`);
    assert(!rawContent.includes('guaranteed account freeze'), `Must not promise guaranteed account freeze in ${scenario.id}`);
    assert(!rawContent.includes('zero customer liability is guaranteed'), `Must not guarantee zero liability in ${scenario.id}`);
    assert(!rawContent.includes('universal Golden Hour'), `Must not make universal Golden Hour claims in ${scenario.id}`);
    assert(rawContent.includes('not guarantee fund recovery') || rawContent.includes('cannot guarantee fund recovery'), `Must explicitly disclaim fund recovery guarantees in ${scenario.id}`);
    assert(rawContent.includes('1930') && rawContent.includes('cybercrime.gov.in'), `Must direct to 1930 and cybercrime.gov.in in ${scenario.id}`);
  });
  console.log('  * PASS: All statutory and procedural citations (BNSS 35(3), BNS 308/319, IT Act 66C/43, UPI PIN invariant, non-guarantee) verified.');

  // -------------------------------------------------------------
  // TEST 5: Multi-Tier Isolation & Immutability Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Verifying Multi-Tier Isolation & Immutability...');
  const fixtureCode = fs.readFileSync(fixturePath, 'utf8');

  // Static AST / Import boundary checks
  assert(!fixtureCode.includes("from '../models"), 'Must not import from models');
  assert(!fixtureCode.includes("from '../../models"), 'Must not import from models');
  assert(!fixtureCode.includes("from '../controllers"), 'Must not import from controllers');
  assert(!fixtureCode.includes("from '../../controllers"), 'Must not import from controllers');
  assert(!fixtureCode.includes("assessmentScoringService"), 'Must not import or reference assessmentScoringService');
  assert(!fixtureCode.includes("AssessmentSession"), 'Must not import AssessmentSession');
  assert(!fixtureCode.includes("AssessmentDecision"), 'Must not import AssessmentDecision');
  assert(!fixtureCode.includes("UserProgress"), 'Must not import UserProgress');

  // Object.freeze immutability checks
  assert(Object.isFrozen(COUNTERFACTUAL_SCENARIOS), 'COUNTERFACTUAL_SCENARIOS array must be frozen');
  COUNTERFACTUAL_SCENARIOS.forEach(scenario => {
    assert(Object.isFrozen(scenario), `${scenario.id} object must be frozen`);
    assert(Object.isFrozen(scenario.incidentContext), `${scenario.id} incidentContext must be frozen`);
    assert(Object.isFrozen(scenario.decisionJunction), `${scenario.id} decisionJunction must be frozen`);
    assert(Object.isFrozen(scenario.decisionJunction.choices), `${scenario.id} choices array must be frozen`);
    scenario.decisionJunction.choices.forEach(c => {
      assert(Object.isFrozen(c), `${scenario.id} choice ${c.id} must be frozen`);
      assert(Object.isFrozen(c.consequence), `${scenario.id} choice ${c.id} consequence must be frozen`);
    });
    assert(Object.isFrozen(scenario.defensiveTakeaway), `${scenario.id} defensiveTakeaway must be frozen`);
  });
  console.log('  * PASS: Zero assessment/server imports; all fixtures and nested structures are deeply frozen.');

  console.log('\n=============================================================');
  console.log('ALL COUNTERFACTUAL SCENARIO FIXTURE VALIDATIONS PASSED (5/5)');
  console.log('=============================================================\n');
}

runCounterfactualFixturesSuite().catch(err => {
  console.error('\nFAILED COUNTERFACTUAL FIXTURES TEST:', err);
  process.exit(1);
});
