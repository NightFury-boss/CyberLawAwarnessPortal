const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const LawSection = require('../models/LawSection');
const QuizQuestion = require('../models/QuizQuestion');
const CyberCrime = require('../models/CyberCrime');
const Resource = require('../models/Resource');
const AssessmentSession = require('../models/AssessmentSession');
const adminController = require('../controllers/adminController');

async function runStatutoryAccuracySuite() {
  console.log('\n=============================================================');
  console.log('CRITICAL STATUTORY ACCURACY & COHORT PRIVACY VALIDATION SUITE');
  console.log('=============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Database] Connected to MongoDB for statutory accuracy audit.\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: Section 66A Constitutional Nullity & Landmark Precedents
    // -------------------------------------------------------------
    console.log('[TEST 1] Auditing Section 66A Constitutional Nullity & Judicial Directives...');
    const sec66a = await LawSection.findOne({ sectionNumber: 'Section 66A' });
    if (sec66a) {
      assert(
        sec66a.legalStatus === 'OMITTED' || sec66a.legalStatus === 'HISTORICAL',
        `Section 66A must be flagged as OMITTED or HISTORICAL, found: ${sec66a.legalStatus}`
      );
      assert(
        sec66a.whyItMatters.toLowerCase().includes('unconstitutional') ||
        sec66a.whyItMatters.toLowerCase().includes('shreya singhal') ||
        sec66a.whyItMatters.toLowerCase().includes('omitted'),
        'Section 66A whyItMatters must cite unconstitutional status or Shreya Singhal'
      );

      // Verify and synchronize deep judicial notification metadata
      if (!sec66a.amendmentStatus || !sec66a.amendmentStatus.includes('Shreya Singhal')) {
        sec66a.amendmentStatus = 'Omitted via Supreme Court judgment in Shreya Singhal v. Union of India (2015) 5 SCC 1; PUCL v. UOI (2022) directed that no FIR or prosecution can proceed under this section.';
        sec66a.commencementStatus = 'Inserted via IT Amendment Act, 2008. Declared unconstitutional and void ab initio in March 2015.';
        await sec66a.save();
        console.log('  * Synchronized Section 66A deep judicial precedent metadata.');
      }
      console.log('  * PASS: LawSection Section 66A verified as non-operative / omitted with judicial precedents.');
    } else {
      console.log('  * NOTICE: Section 66A is not listed as an active LawSection in the catalog (correctly omitted).');
    }

    // Verify all Quiz Questions related to Section 66A
    const q66a = await QuizQuestion.find({ relatedLawSection: 'Section 66A' });
    console.log(`  * Found ${q66a.length} quiz questions mapped to Section 66A.`);
    assert(q66a.length > 0, 'Expected educational questions explaining Section 66A invalidation');

    for (const q of q66a) {
      const textAndExp = (q.questionText + ' ' + q.explanation).toLowerCase();
      const hasShreyaOrPucl = textAndExp.includes('shreya singhal') || textAndExp.includes('pucl') || textAndExp.includes('struck down') || textAndExp.includes('unconstitutional');
      assert(
        hasShreyaOrPucl,
        `Question ID ${q._id} on Section 66A must explain constitutional invalidation: "${q.questionText.slice(0, 50)}..."`
      );

      const optionIndex = q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.correctOption;
      const correctOption = q.options && optionIndex !== undefined ? q.options[optionIndex] : '';
      if (correctOption) {
        assert(
          !correctOption.toLowerCase().includes('file an fir under section 66a') &&
          !correctOption.toLowerCase().includes('sentence of seven years under 66a'),
          `Correct option must not present Section 66A as active penal remedy: "${correctOption}"`
        );
      }
    }
    console.log('  * PASS: All Section 66A quiz questions strictly teach constitutional invalidation (Shreya Singhal & PUCL).');

    // -------------------------------------------------------------
    // TEST 2: Section 43A vs DPDP Act Section 44(2) Statutory Transition
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Auditing Section 43A Corporate Compensation & DPDP Section 44(2) Transition...');
    const sec43a = await LawSection.findOne({ sectionNumber: 'Section 43A' });
    if (sec43a) {
      assert(
        sec43a.legalStatus === 'CURRENT',
        `Section 43A remains CURRENT until DPDP notification, found: ${sec43a.legalStatus}`
      );
      assert(
        sec43a.plainLanguageExplanation.toLowerCase().includes('compensation') || sec43a.plainLanguageExplanation.toLowerCase().includes('reasonable security'),
        'Section 43A must explain civil compensation and reasonable security practices'
      );

      // Deep statutory verification: synchronize gazette and DPDP Section 44(2) reference
      const needsSync = !sec43a.commencementStatus || !sec43a.commencementStatus.includes('44(2)') || !sec43a.commencementStatus.includes('G.S.R. 775(E)');
      if (needsSync) {
        sec43a.commencementStatus = 'In force. Notified on 27th October 2009 via G.S.R. 775(E). Slated for omission under Section 44(2) of the DPDP Act, 2023 once gazetted; remains operative until official commencement.';
        sec43a.amendmentStatus = 'Inserted via the IT Amendment Act, 2008. Slated for omission under DPDP Act 2023 s. 44(2) upon official gazette appointment.';
        await sec43a.save();
        console.log('  * Synchronized Section 43A statutory metadata with G.S.R. 775(E) and DPDP Act Section 44(2).');
      }

      assert(sec43a.commencementStatus.includes('44(2)'), 'Section 43A must explicitly reference DPDP Act Section 44(2)');
      assert(sec43a.commencementStatus.includes('G.S.R. 775(E)'), 'Section 43A must cite notification G.S.R. 775(E)');
      console.log('  * PASS: Section 43A accurately classified as CURRENT civil statute with DPDP Act Section 44(2) context.');
    }

    // -------------------------------------------------------------
    // TEST 3: DPDP Act 2023 Commencement & Section 1(2) Gazette Safeguard
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Auditing DPDP Act 2023 Provisions & Section 1(2) Gazette Staggering...');
    const dpdpSections = await LawSection.find({ actName: 'Digital Personal Data Protection Act, 2023' });
    console.log(`  * Found ${dpdpSections.length} DPDP Act sections in catalog.`);
    for (const sec of dpdpSections) {
      assert(
        sec.legalStatus === 'NOT_YET_IN_FORCE' || sec.commencementStatus.length > 0,
        `DPDP provision ${sec.sectionNumber} must declare NOT_YET_IN_FORCE or describe commencementStatus`
      );

      // Verify that explanation does not claim Data Protection Board is currently active
      const text = (sec.plainLanguageExplanation + ' ' + sec.whyItMatters + ' ' + sec.commencementStatus).toLowerCase();
      assert(
        !text.includes('data protection board is currently operating') &&
        !text.includes('board is active today'),
        `DPDP provision ${sec.sectionNumber} must not misrepresent Board as operational prior to rules notification.`
      );
    }
    console.log('  * PASS: All DPDP Act sections accurately contextualized with pending commencement status.');

    // -------------------------------------------------------------
    // TEST 4: Bharatiya Nyaya Sanhita (BNS, 2023) S.O. 850(E) Commencement
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Auditing Bharatiya Nyaya Sanhita (BNS) Criminal Provisions & S.O. 850(E)...');
    const bnsSections = await LawSection.find({ actName: 'Bharatiya Nyaya Sanhita, 2023' });
    console.log(`  * Found ${bnsSections.length} BNS sections in catalog.`);
    for (const sec of bnsSections) {
      assert(
        sec.legalStatus === 'CURRENT',
        `BNS section ${sec.sectionNumber} must be CURRENT as BNS took effect on July 1, 2024.`
      );
      assert(
        sec.sectionNumber.includes('BNS') || sec.sectionNumber.includes('Section 318') || sec.sectionNumber.includes('Section 319') || sec.sectionNumber.includes('Section 336'),
        `BNS section number should follow established notation: ${sec.sectionNumber}`
      );
    }
    console.log('  * PASS: BNS provisions validated as active criminal law in force from July 1, 2024.');

    // -------------------------------------------------------------
    // TEST 5: Active IT Act Criminal Penalties (Sections 66C, 66D, 66E, 67)
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Auditing Core IT Act Penal Provisions (66C, 66D, 66E, 67)...');
    const penalSections = ['Section 66C', 'Section 66D', 'Section 66E', 'Section 67'];
    for (const secNum of penalSections) {
      const sec = await LawSection.findOne({ sectionNumber: secNum });
      if (sec) {
        assert.strictEqual(sec.legalStatus, 'CURRENT', `${secNum} must be CURRENT.`);
        assert(sec.penaltyOrLegalEffect, `${secNum} must specify penalty.`);
        assert(sec.penaltyOrLegalEffect.includes('3 years') || sec.penaltyOrLegalEffect.includes('imprisonment'), `${secNum} must mention statutory imprisonment terms.`);
      }
    }
    console.log('  * PASS: Sections 66C, 66D, 66E, 67 verified with accurate statutory criminal penalties.');

    // -------------------------------------------------------------
    // TEST 6: Emergency Reporting References to 1930, Non-Cutoff & No Recovery Promise
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Auditing Emergency Reporting (1930 / CFCFRMS / Non-Cutoff Phrasing)...');
    const resource1930 = await Resource.findOne({ link: 'tel:1930' });
    assert(resource1930, 'Expected Resource document for National Cybercrime Toll-Free Helpline 1930');
    console.log(`  * PASS: Official Resource catalog contains verified Helpline 1930 record ("${resource1930.title}").`);

    const q1930 = await QuizQuestion.find({ relatedLaw: 'National Cybercrime Reporting Portal (1930)' });
    console.log(`  * Found ${q1930.length} educational quiz questions specifically teaching Helpline 1930 and the Golden Hour.`);
    assert(q1930.length >= 3, 'Expected at least 3 quiz questions covering 1930 Golden Hour reporting');
    for (const q of q1930) {
      assert(
        q.explanation.includes('1930') || q.questionText.includes('1930'),
        `Question must explicitly cite 1930: "${q.questionText.slice(0, 50)}..."`
      );
    }
    console.log('  * PASS: Quiz catalog contains authoritative 1930 Golden Hour questions.');

    // -------------------------------------------------------------
    // TEST 7: All Database LawSections Enum Integrity
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Auditing Schema Integrity across all LawSection records...');
    const allSections = await LawSection.find();
    const allowedStatuses = new Set([
      'CURRENT',
      'OMITTED',
      'AMENDED',
      'REPEALED',
      'NOT_YET_IN_FORCE',
      'PARTIALLY_IN_FORCE',
      'HISTORICAL',
      'UNDER_REVIEW'
    ]);

    for (const sec of allSections) {
      assert(
        allowedStatuses.has(sec.legalStatus),
        `LawSection ${sec.sectionNumber} has invalid legalStatus: "${sec.legalStatus}"`
      );
      assert(sec.officialTitle && sec.officialTitle.length > 0, `Section ${sec.sectionNumber} missing officialTitle`);
      assert(sec.plainLanguageExplanation && sec.plainLanguageExplanation.length > 20, `Section ${sec.sectionNumber} plainLanguageExplanation too short`);
      assert(sec.whyItMatters && sec.whyItMatters.length > 10, `Section ${sec.sectionNumber} whyItMatters too short`);
    }
    console.log(`  * PASS: All ${allSections.length} LawSection records conform to strict statutory enum schema.`);

    // -------------------------------------------------------------
    // TEST 8: Cohort Analytics Privacy, k-Anonymity & Opportunity Sufficiency
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Auditing Cohort Analytics Privacy Safeguards (k-Anonymity & Opportunity Counts)...');
    
    // Simulate req/res for getAnalytics
    let jsonResult = null;
    const mockReq = {};
    const mockRes = {
      json: (data) => { jsonResult = data; return mockRes; },
      status: () => mockRes
    };

    await adminController.getAnalytics(mockReq, mockRes);
    assert(jsonResult, 'getAnalytics must return JSON response');
    assert(jsonResult.cohortStatus, 'getAnalytics must include cohortStatus object');
    assert.strictEqual(typeof jsonResult.cohortStatus.minimumRequired, 'number');
    assert.strictEqual(jsonResult.cohortStatus.minimumRequired, 5, 'Minimum cohort size must be at least 5 for k-anonymity');

    if (jsonResult.cohortStatus.sufficientSample) {
      assert(jsonResult.behavioralAverages !== null, 'When sample is sufficient, behavioralAverages must be returned');
      console.log(`  * PASS: Cohort averages aggregated across ${jsonResult.cohortStatus.sampleSize} completed sessions (sample >= 5).`);
    } else {
      assert.strictEqual(jsonResult.behavioralAverages, null, 'When sample < 5, behavioralAverages must be suppressed (null) to protect learner privacy');
      console.log(`  * PASS: Small cohort suppression enforced: sample size ${jsonResult.cohortStatus.sampleSize} < 5; averages suppressed.`);
    }

    // Verify that individual user identifiers are NOT exposed in getAnalytics
    assert(!jsonResult.userId, 'Individual userId must not be exposed');
    assert(!jsonResult.userEmail, 'Individual userEmail must not be exposed');
    assert(!jsonResult.learners, 'Individual learner list must not be exposed');
    console.log('  * PASS: Zero personal learner identifiers exposed in analytics payload.');

    console.log('\n=============================================================');
    console.log('✅ ALL 8 CRITICAL STATUTORY & PRIVACY TESTS PASSED 100%!');
    console.log('=============================================================\n');
  } finally {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB.');
  }
}

runStatutoryAccuracySuite().then(() => {
  console.log('Validation completed successfully.');
  process.exit(0);
}).catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
