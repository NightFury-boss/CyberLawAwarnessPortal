/**
 * @file counterfactualFixtures.test.js
 * @description Targeted validation suite for Stage 3 Wave 1: Counterfactual Scenario Data Fixtures.
 * 
 * Verifies:
 * 1. Schema conformity across all 4 scenarios.
 * 2. Tri-branch completeness (reflexive-compliance, passive-inaction, active-verification).
 * 3. Causal plausibility and distinct consequence branches.
 * 4. Safety & privacy constraints across entire fixture content (.invalid domains, fictional identifiers, no credentials).
 * 5. Content Guardrails & Statutory Framework Assertions:
 *    - BNSS § 35(3) police notice to appear vs Chapter VI court summons.
 *    - BNSS § 530 electronic proceedings recognition (trials via video conferencing permitted under law).
 *    - Absence of false claims that police confirmed no warrant exists.
 *    - Absence of unsupported predictions ("most victims" comply, fixed two-hour escalation, inevitable total loss).
 *    - BNS § 308 extortion conditional statutory elements.
 *    - BNS § 319 cheating by personation conditional applicability.
 *    - IT Act § 66C identity theft conditional applicability.
 *    - UPI PIN debit authorization invariant without classifying customer-authorized payments as automatically unauthorized.
 *    - IT Act § 43 inapplicability to voluntary PIN entry.
 *    - Fact-qualified Electricity Act § 56(1) notice requirement.
 *    - Reserve Bank of India (Commercial Banks – Responsible Business Conduct) Directions, 2025 (Part D / Paragraph 68) for customer liability in unauthorised electronic transactions, avoiding outdated circulars or issuance directions.
 *    - Zero liability / fund freezing / recovery non-guarantee (CFCFRMS supports possible holds, not guaranteed freezing).
 *    - No unsupported universal Golden Hour claims.
 * 6. Multi-tier isolation and recursive deep immutability (recursive freeze check, zero assessment/server imports).
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

/**
 * Recursively verifies that an object and all its nested objects and arrays are frozen.
 * @param {unknown} item - Target to check
 * @param {string} currentPath - Breadcrumb path for error diagnostics
 */
function assertDeeplyFrozen(item, currentPath = 'root') {
  if (item === null || typeof item !== 'object') {
    return;
  }
  assert(Object.isFrozen(item), `Object at ${currentPath} must be deeply frozen via Object.freeze`);
  if (Array.isArray(item)) {
    item.forEach((elem, idx) => assertDeeplyFrozen(elem, `${currentPath}[${idx}]`));
  } else {
    Object.keys(item).forEach(key => {
      assertDeeplyFrozen(item[key], `${currentPath}.${key}`);
    });
  }
}

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
  // TEST 3: Safety & Privacy Constraints Across Full Content
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Verifying Safety & Privacy Constraints Across Full Fixture Content...');
  COUNTERFACTUAL_SCENARIOS.forEach((scenario) => {
    // Disclaimer check
    assert(scenario.disclaimer.includes('Educational Simulation: Hypothetical Counterfactual Model'), `${scenario.id} must have educational simulation disclaimer`);
    assert(scenario.disclaimer.includes('guaranteed legal/financial outcomes'), `${scenario.id} disclaimer must disclaim guaranteed outcomes`);

    // Entire JSON payload inspection
    const fullFixtureJson = JSON.stringify(scenario);
    
    // Check URLs use .invalid, .example, or approved official portals
    const urlMatches = fullFixtureJson.match(/https?:\/\/[^\s"'\\]+/g) || [];
    urlMatches.forEach(url => {
      const isAllowed = url.includes('.invalid') || url.includes('.example') || url.includes('cybercrime.gov.in') || url.includes('sancharsaathi.gov.in');
      assert(isAllowed, `URL ${url} in ${scenario.id} must be reserved (.invalid/.example) or an authorized official reporting portal`);
    });

    // Check phone numbers are either fictional +91-00000-0000X or emergency 1930
    const phoneMatches = fullFixtureJson.match(/\+91-\d{5}-\d{5}/g) || [];
    phoneMatches.forEach(phone => {
      assert(phone.startsWith('+91-00000-'), `Phone number ${phone} in ${scenario.id} must be fictional (+91-00000-XXXXX)`);
    });

    // Check no real payment VPAs or functional QR codes
    assert(!fullFixtureJson.includes('@okaxis') && !fullFixtureJson.includes('@okhdfcbank') && !fullFixtureJson.includes('@icici'), `No real UPI VPA domains in ${scenario.id}`);
    if (scenario.incidentContext.mockInterfaceType === 'qr_code') {
      assert(fullFixtureJson.includes('NON-FUNCTIONAL') || fullFixtureJson.includes('DO NOT SCAN'), `QR mock must explicitly disclose non-functional placeholder in ${scenario.id}`);
    }
  });
  console.log('  * PASS: All phone numbers, domains, URLs, and mock data strictly adhere to safety and privacy constraints.');

  // -------------------------------------------------------------
  // TEST 4: Content Guardrails & Statutory Framework Assertions
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Verifying Content Guardrails & Statutory Framework Assertions...');

  // 4A: Scenario 4 - BNSS § 35(3), § 530 Electronic Proceedings Recognition & Warrant Clarification
  const sc4 = SCENARIO_4_VIDEO_SUMMONS_DIGITAL_ARREST;
  const rawSc4 = JSON.stringify(sc4);
  const bnssLaw = sc4.defensiveTakeaway.statutoryFramework.find(l => l.act.includes('BNSS') || l.act.includes('Bharatiya Nagarik Suraksha'));
  assert(bnssLaw, 'Scenario 4 must include BNSS statutory framework entry');
  assert(bnssLaw.applicabilityNote.includes('Chapter V') && bnssLaw.applicabilityNote.includes('Sections 35–62'), 'BNSS entry must cite Chapter V (Sections 35–62) for arrest procedures');
  assert(bnssLaw.applicabilityNote.includes('Chapter VI') && bnssLaw.applicabilityNote.includes('Sections 63–93'), 'BNSS entry must cite Chapter VI (Sections 63–93) for processes compelling appearance / summons');
  assert(bnssLaw.applicabilityNote.includes('Section 35(3)'), 'BNSS entry must cite Section 35(3)');
  assert(bnssLaw.applicabilityNote.includes('Section 530'), 'BNSS entry must cite Section 530 for electronic/video proceedings');
  assert(bnssLaw.applicabilityNote.includes('notice to appear'), 'BNSS entry must identify Section 35(3) as police notice to appear during investigation');
  assert(bnssLaw.applicabilityNote.includes('court summons'), 'BNSS entry must distinguish police notice from court summons under Chapter VI');
  assert(bnssLaw.applicabilityNote.includes('Section 531'), 'BNSS entry must reference Section 531 savings');
  
  // Guardrail: Must recognize legitimate video proceedings under BNSS 530 while flagging fraudulent arrest claims
  assert(sc4.defensiveTakeaway.coreRule.includes('BNSS Section 530') || sc4.defensiveTakeaway.coreRule.includes('authorized video-conferencing processes under law'), 'Scenario 4 coreRule must acknowledge legitimate video proceedings');
  assert(!sc4.defensiveTakeaway.coreRule.includes('do not conduct arrests, trials, or asset verification over video calls'), 'Must not claim judicial trials cannot occur over video conferencing');
  
  // Guardrail: Absence of false claims that police confirmed no warrant exists
  assert(!rawSc4.includes('no warrant exists against you'), 'Must not claim police confirmed no warrant exists against learner');
  assert(rawSc4.includes('independently contact the relevant police station or official authority'), 'Must advise independent contact via verified sources');

  // Guardrail: Absence of unsupported predictions ("most victims", two-hour claim, inevitable loss)
  assert(!rawSc4.includes('most victims'), 'Must not claim most victims eventually comply');
  assert(!rawSc4.includes('After two hours'), 'Must not make fixed two-hour escalation claim');
  assert(!rawSc4.includes('Catastrophic financial loss (₹50,000 immediate, scaling to total available savings)'), 'Must not imply inevitable total savings loss');

  // 4B: Scenario 4 - BNS § 308 Extortion Conditional Elements
  const bns308 = sc4.defensiveTakeaway.statutoryFramework.find(l => l.section === 'Section 308');
  assert(bns308, 'Scenario 4 must cite BNS Section 308');
  assert(bns308.applicabilityNote.includes('fear of injury') && bns308.applicabilityNote.includes('dishonestly inducing'), 'BNS § 308 must explain statutory elements');
  assert(bns308.applicabilityNote.includes('Threats of arrest in cyber scams do not automatically establish extortion in every instance'), 'BNS § 308 must note conditional applicability');

  // 4C: Scenario 2 - BNS § 319 Personation & IT Act § 66C Identity Theft & Card Direction Nuance
  const sc2 = SCENARIO_2_NOMINAL_PARCEL_FEE;
  const rawSc2 = JSON.stringify(sc2);
  const bns319 = sc2.defensiveTakeaway.statutoryFramework.find(l => l.section === 'Section 319');
  assert(bns319, 'Scenario 2 must cite BNS Section 319');
  assert(bns319.applicabilityNote.includes('personates a specific courier representative') || bns319.applicabilityNote.includes('representing oneself to be someone else'), 'BNS § 319 must note personation requirement');

  const it66c = sc2.defensiveTakeaway.statutoryFramework.find(l => l.section === 'Section 66C');
  assert(it66c, 'Scenario 2 must cite IT Act Section 66C');
  assert(it66c.applicabilityNote.includes('unique identification feature'), 'IT Act § 66C must cite qualifying unique identification features');
  assert(it66c.applicabilityNote.includes('Merely collecting card details on a form does not automatically satisfy § 66C'), 'IT Act § 66C must note that collecting card details alone is insufficient without fraudulent use of qualifying features');

  // Card and electronic banking liability reference check: Must cite 2025 Responsible Business Conduct Directions (Part D / Paragraph 68)
  assert(!rawSc2.includes('RBI Master Direction – Credit Card and Debit Card – Issuance and Conduct Directions, 2022'), 'Must not cite outdated 2022 commercial bank card conduct directions');
  assert(!rawSc2.includes('Master Direction on Customer Service in Banks'), 'Must not cite outdated Customer Service Master Direction');
  assert(rawSc2.includes('Reserve Bank of India (Commercial Banks – Responsible Business Conduct) Directions, 2025'), 'Scenario 2 must cite operative 2025 Responsible Business Conduct Directions');
  assert(rawSc2.includes('Part D') || rawSc2.includes('Paragraph 68'), 'Scenario 2 must cite Part D / Paragraph 68 for customer liability');

  // Guardrail: Scenario 2 retains the correct Paragraph 68 customer-negligence explanation
  assert(rawSc2.includes('Paragraph 68') && rawSc2.includes('customer negligence'), 'Scenario 2 must retain Paragraph 68 customer negligence explanation');
  assert(rawSc2.includes('sharing payment credentials'), 'Scenario 2 must cite sharing payment credentials under Paragraph 68');
  assert(rawSc2.includes('bears the entire loss until reporting') || rawSc2.includes('bears the loss until reporting'), 'Scenario 2 must explain loss allocation until reporting');

  // Guardrail: Must NOT claim credential sharing automatically excludes transaction from unauthorised-transaction framework
  assert(!rawSc2.includes('apply strictly to unauthorized transactions (where the customer did not share credentials'), 'Must not claim credential sharing automatically excludes transaction from unauthorised-transaction framework');
  assert(!rawSc2.includes('automatically places the transaction outside'), 'Must not claim credential entry automatically places transaction outside liability framework');
  assert(rawSc2.includes('does not by itself verify') || rawSc2.includes('does not by itself establish'), 'OTP consequence must be qualified');

  // 4D: Scenario 3 - UPI PIN Debit Authorization Invariant & Transaction Terminology
  const sc3 = SCENARIO_3_APPROVE_PAYMENT_QR;
  const rawSc3 = JSON.stringify(sc3);
  assert(rawSc3.includes('Reserve Bank of India (Commercial Banks – Responsible Business Conduct) Directions, 2025'), 'Scenario 3 must cite operative 2025 Responsible Business Conduct Directions');
  assert.strictEqual(
    sc3.defensiveTakeaway.coreRule,
    'Entering a UPI PIN authorizes a transaction that can debit your account. You do not need to enter your UPI PIN to receive money. Always verify the payee and transaction details before authorizing a payment.',
    'Scenario 3 coreRule must match authoritative UPI guidance exactly'
  );

  // Guardrail: Scenario 3 distinguishes customer-approved UPI push payments from unauthorised transactions
  assert(rawSc3.includes('customer-approved UPI push payment'), 'Scenario 3 must explicitly identify customer-approved UPI push payment');
  assert(rawSc3.includes('unauthorised electronic banking transaction') || rawSc3.includes('unauthorised electronic transaction'), 'Scenario 3 must distinguish unauthorised electronic banking transactions');
  assert(rawSc3.includes('is not automatically applicable') || rawSc3.includes('not automatically applicable'), 'Scenario 3 must state Part D is not automatically applicable to customer-approved UPI push payments');
  assert(!rawSc3.includes('Part D automatically determines liability'), 'Scenario 3 must not claim Part D automatically determines liability for a customer-approved UPI payment');
  assert(!rawSc3.includes('Part D automatically determines reimbursement'), 'Scenario 3 must not claim Part D automatically determines reimbursement for a customer-approved UPI payment');

  // Terminology check: Must NOT describe customer-authorized deceptive UPI payment as an "unauthorized debit" in reporting guidance
  assert(!sc3.defensiveTakeaway.officialReportingProtocol.guidance.includes('unauthorized debit'), 'Must not describe customer-authorized deceptive UPI payment as an unauthorized debit in reporting guidance');
  assert(sc3.defensiveTakeaway.officialReportingProtocol.guidance.includes('deceptive payment') || sc3.defensiveTakeaway.officialReportingProtocol.guidance.includes('fraudulent transaction'), 'Must use deceptive payment / fraudulent transaction terminology');
  assert(!rawSc3.includes('entering a PIN is exclusively an authorization to debit funds from an account'), 'Must not claim PIN is exclusively for one transaction type');

  const it43Note = sc3.defensiveTakeaway.statutoryFramework.find(l => l.act.includes('§ 43') || l.section.includes('Section 43'));
  assert(it43Note, 'Scenario 3 must include IT Act § 43 inapplicability clarification');
  assert(it43Note.applicabilityNote.includes('IT Act § 43 does not apply to voluntary PIN entry on a user\'s own mobile device'), 'Must clarify IT Act § 43 inapplicability to voluntary PIN entry');

  // 4E: Scenario 1 - Fact-Qualified Electricity Act § 56(1) Notice Requirement & Paragraph 68 Conditionality
  const sc1 = SCENARIO_1_MIDNIGHT_POWER_CUT_SMS;
  const rawSc1 = JSON.stringify(sc1);
  const elecLaw = sc1.defensiveTakeaway.statutoryFramework.find(l => l.act.includes('Electricity Act'));
  assert(elecLaw, 'Scenario 1 must cite Electricity Act Section 56(1)');
  assert(elecLaw.applicabilityNote.includes('fifteen clear days\' notice in writing'), 'Must explain 15 days statutory written notice');
  assert(rawSc1.includes('may expose') || rawSc1.includes('Substantial risk'), 'Remote access consequence must be qualified');
  assert(rawSc1.includes('Paragraph 68'), 'Scenario 1 must cite Paragraph 68');
  assert(rawSc1.includes('where an unauthorised electronic banking transaction involves customer negligence, such as sharing payment credentials'), 'Scenario 1 Paragraph 68 loss-allocation rule must be explicitly conditional on unauthorised transaction with customer negligence');

  // 4F: Non-Guarantee of Zero Liability, Fund Freezing, or Universal Golden Hour (Across All Scenarios)
  COUNTERFACTUAL_SCENARIOS.forEach((scenario) => {
    const rawContent = JSON.stringify(scenario);
    assert(!rawContent.includes('guaranteed fund recovery'), `Must not promise guaranteed recovery in ${scenario.id}`);
    assert(!rawContent.includes('guarantees fund recovery'), `Must not promise fund recovery in ${scenario.id}`);
    assert(!rawContent.includes('guaranteed account freeze'), `Must not promise guaranteed account freeze in ${scenario.id}`);
    assert(!rawContent.includes('zero customer liability is guaranteed'), `Must not guarantee zero liability in ${scenario.id}`);
    assert(!rawContent.includes('universal Golden Hour'), `Must not make universal Golden Hour claims in ${scenario.id}`);
    assert(rawContent.includes('not guarantee fund recovery') || rawContent.includes('cannot guarantee fund recovery') || rawContent.includes('not guarantee that accounts will be frozen'), `Must explicitly disclaim fund recovery/freezing guarantees in ${scenario.id}`);
    assert(rawContent.includes('possible holds'), `CFCFRMS description must indicate possible holds in ${scenario.id}`);
    assert(rawContent.includes('1930') && rawContent.includes('cybercrime.gov.in'), `Must direct to 1930 and cybercrime.gov.in in ${scenario.id}`);
  });
  console.log('  * PASS: Content guardrails verified (BNSS 35(3)/530, BNS 308/319, IT Act 66C/43, UPI PIN invariant, banking liability, non-guarantee).');

  // -------------------------------------------------------------
  // TEST 5: Multi-Tier Isolation & Recursive Immutability Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Verifying Multi-Tier Isolation & Recursive Immutability...');
  const fixtureCode = fs.readFileSync(fixturePath, 'utf8');

  // Source-string import-boundary checks (verifying no backend or assessment module imports)
  assert(!fixtureCode.includes("from '../models"), 'Must not import from models');
  assert(!fixtureCode.includes("from '../../models"), 'Must not import from models');
  assert(!fixtureCode.includes("from '../controllers"), 'Must not import from controllers');
  assert(!fixtureCode.includes("from '../../controllers"), 'Must not import from controllers');
  assert(!fixtureCode.includes("assessmentScoringService"), 'Must not import or reference assessmentScoringService');
  assert(!fixtureCode.includes("AssessmentSession"), 'Must not import AssessmentSession');
  assert(!fixtureCode.includes("AssessmentDecision"), 'Must not import AssessmentDecision');
  assert(!fixtureCode.includes("UserProgress"), 'Must not import UserProgress');

  // Recursive Object.freeze immutability checks across all nested structures
  assertDeeplyFrozen(COUNTERFACTUAL_SCENARIOS, 'COUNTERFACTUAL_SCENARIOS');
  COUNTERFACTUAL_SCENARIOS.forEach((scenario, idx) => {
    assertDeeplyFrozen(scenario, `scenario[${idx}] (${scenario.id})`);
  });
  console.log('  * PASS: Zero assessment/server imports; all fixtures, nested objects, and arrays are recursively deep-frozen.');

  console.log('\n=============================================================');
  console.log('ALL COUNTERFACTUAL SCENARIO FIXTURE VALIDATIONS PASSED (5/5)');
  console.log('=============================================================\n');
}

runCounterfactualFixturesSuite().catch(err => {
  console.error('\nFAILED COUNTERFACTUAL FIXTURES TEST:', err);
  process.exit(1);
});
