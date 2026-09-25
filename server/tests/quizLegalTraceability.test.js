const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const QuizQuestion = require('../models/QuizQuestion');
const LawSection = require('../models/LawSection');
const LegalSource = require('../models/LegalSource');

const VALID_LAW_SECTIONS = new Set([
  'Section 43A',
  'Section 66A',
  'Section 66C',
  'Section 66D',
  'Section 66E',
  'Section 67',
  'Section 72A',
  'IT Intermediary Rules',
  'BNS Section 318',
  'BNS Section 319',
  'DPDP Section 6',
  'DPDP Section 11',
  'Evidence Act Section 65B / BSA Section 63'
]);

const VALID_LAW_SOURCES = new Set([
  'Information Technology Act, 2000',
  'Bharatiya Nyaya Sanhita, 2023',
  'Digital Personal Data Protection Act, 2023',
  'Shreya Singhal v. Union of India (2015)',
  'Justice K.S. Puttaswamy v. Union of India (2017)',
  'Indian Evidence Act, 1872 / BSA, 2023',
  'National Cybercrime Reporting Portal (1930)',
  'CERT-In / MeitY'
]);

async function runTest() {
  console.log('=== TEST: QUIZ LEGAL SOURCE TRACEABILITY AUDIT ===\n');
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const lawQuestions = await QuizQuestion.find({ category: 'Cyber Law Basics' });
    console.log(`- Found ${lawQuestions.length} Cyber Law Basics questions in DB.`);
    assert.strictEqual(lawQuestions.length, 40, `Expected exactly 40 Cyber Law questions, found ${lawQuestions.length}`);

    let validatedCount = 0;
    for (const q of lawQuestions) {
      assert(q.relatedLawSection, `Question missing relatedLawSection: "${q.questionText.slice(0, 50)}..."`);
      assert(q.relatedLaw, `Question missing relatedLaw: "${q.questionText.slice(0, 50)}..."`);

      assert(VALID_LAW_SECTIONS.has(q.relatedLawSection),
        `Unknown or unsupported relatedLawSection: "${q.relatedLawSection}" in question: "${q.questionText.slice(0, 50)}..."`);

      assert(VALID_LAW_SOURCES.has(q.relatedLaw),
        `Unknown or unsupported relatedLaw: "${q.relatedLaw}" in question: "${q.questionText.slice(0, 50)}..."`);

      validatedCount++;
    }

    console.log(`- Successfully verified all ${validatedCount} legal questions against authoritative source boundaries.`);

    // Also verify that questions in other categories with legal citations are valid
    const allQuestions = await QuizQuestion.find({ category: { $ne: 'Cyber Law Basics' } });
    let otherLegalCount = 0;
    for (const q of allQuestions) {
      if (q.relatedLawSection) {
        assert(VALID_LAW_SECTIONS.has(q.relatedLawSection),
          `Invalid relatedLawSection in non-law category "${q.category}": "${q.relatedLawSection}"`);
        otherLegalCount++;
      }
      if (q.relatedLaw) {
        assert(VALID_LAW_SOURCES.has(q.relatedLaw),
          `Invalid relatedLaw in non-law category "${q.category}": "${q.relatedLaw}"`);
      }
    }
    console.log(`- Verified ${otherLegalCount} additional legal references in technical categories.`);

    console.log('\n✅ 100% Legal Traceability Verified: Zero fabricated statutes or unsanctioned legal claims.');
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
