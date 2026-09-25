const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');

async function runTest() {
  console.log('=== TEST: QUIZ BANK COMPLETENESS & SCHEMA INTEGRITY ===\n');
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    // 1. Total Count Verification
    const totalCount = await QuizQuestion.countDocuments({ published: true });
    console.log(`- Total published questions in DB: ${totalCount}`);
    assert.strictEqual(totalCount, 175, `Expected exactly 175 questions, found ${totalCount}`);

    // 2. Category Quota Verification
    const expectedCategories = {
      'Phishing': 35,
      'Social Engineering': 35,
      'Financial Safety': 35,
      'Account Security': 30,
      'Cyber Law Basics': 40
    };

    for (const [cat, expected] of Object.entries(expectedCategories)) {
      const count = await QuizQuestion.countDocuments({ category: cat, published: true });
      console.log(`  * Category "${cat}": ${count} (expected ${expected})`);
      assert.strictEqual(count, expected, `Mismatch in category "${cat}"`);
    }

    // 3. Cognitive Level Quota Verification
    const expectedCognitive = {
      'Level 1': 35,
      'Level 2': 35,
      'Level 3': 35,
      'Level 4': 30,
      'Level 5': 22,
      'Level 6': 18
    };

    for (const [lvl, expected] of Object.entries(expectedCognitive)) {
      const count = await QuizQuestion.countDocuments({ cognitiveLevel: lvl, published: true });
      console.log(`  * Cognitive "${lvl}": ${count} (expected ${expected})`);
      assert.strictEqual(count, expected, `Mismatch in cognitive level "${lvl}"`);
    }

    // 4. Content Structure & Uniqueness Verification
    const questions = await QuizQuestion.find({ published: true });
    const seenTexts = new Set();
    const seenOptionSets = new Set();

    questions.forEach((q, idx) => {
      // Unique question text
      const normText = q.questionText.trim().toLowerCase().replace(/[^\w\s]/g, '');
      assert(!seenTexts.has(normText), `Duplicate question text found at Q#${idx + 1}: "${q.questionText}"`);
      seenTexts.add(normText);

      // Exactly 4 options
      assert(Array.isArray(q.options) && q.options.length === 4, `Q#${idx + 1} does not have 4 options`);

      // No internal duplicate options
      const optSet = new Set(q.options.map(o => o.trim().toLowerCase()));
      assert.strictEqual(optSet.size, 4, `Q#${idx + 1} has duplicate options inside its option array`);

      // No duplicate option set across questions
      const optKey = [...optSet].sort().join('|||');
      assert(!seenOptionSets.has(optKey), `Q#${idx + 1} shares identical option set with another question`);
      seenOptionSets.add(optKey);

      // Valid correctOptionIndex
      assert(typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 && q.correctOptionIndex <= 3,
        `Q#${idx + 1} has invalid correctOptionIndex: ${q.correctOptionIndex}`);

      // Complete explanation
      assert(q.explanation && q.explanation.trim().length >= 25,
        `Q#${idx + 1} has missing or too short explanation`);
    });

    console.log('\n✅ All 175 questions satisfy completeness, uniqueness, and structural constraints.');
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
