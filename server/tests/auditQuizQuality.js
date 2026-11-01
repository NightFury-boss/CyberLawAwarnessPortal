const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const QuizQuestion = require('../models/QuizQuestion');

async function auditQuestions() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const questions = await QuizQuestion.find({}).lean();
  console.log(`Auditing ${questions.length} total questions in database...\n`);

  const textsMap = new Map();
  const duplicates = [];
  const invalidKeys = [];
  const missingWhyIncorrect = [];
  const missingTakeaways = [];
  const missingLegalRefs = [];
  const repetitiveExplanations = [];
  const categoryCounts = {};
  const formatCounts = {};
  const difficultyCounts = {};

  for (const q of questions) {
    const textNorm = (q.questionText || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (textsMap.has(textNorm)) {
      duplicates.push({ id: q._id, text: q.questionText, matchWith: textsMap.get(textNorm) });
    } else {
      textsMap.set(textNorm, q._id);
    }

    // Format & Category count
    const fmt = q.format || 'single_choice';
    const cat = q.category || 'Uncategorized';
    const diff = q.difficulty || 'Unspecified';

    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;

    // Answer Key bounds check for single choice / true false
    if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(fmt)) {
      if (
        q.correctOptionIndex === undefined ||
        q.correctOptionIndex === null ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex >= (q.options?.length || 0)
      ) {
        invalidKeys.push({ id: q._id, format: fmt, key: q.correctOptionIndex, optionsCount: q.options?.length });
      }
    }

    // Explanations quality
    if (!q.whyIncorrect || q.whyIncorrect.trim().length < 15) {
      missingWhyIncorrect.push({ id: q._id, text: q.questionText.substring(0, 50) });
    }

    if (!q.practicalTakeaway || q.practicalTakeaway.trim().length < 15) {
      missingTakeaways.push({ id: q._id, text: q.questionText.substring(0, 50) });
    }

    if (!q.legalReferences || q.legalReferences.length === 0) {
      missingLegalRefs.push({ id: q._id, related: q.relatedLawSection, cat: q.category, text: q.questionText.substring(0, 50) });
    }

    // Check if explanation merely repeats the correct option text verbatim
    if (q.options && q.correctOptionIndex !== undefined && q.explanation) {
      const correctOptText = (q.options[q.correctOptionIndex] || '').trim().toLowerCase();
      const expNorm = q.explanation.trim().toLowerCase();
      if (expNorm === correctOptText || expNorm === `correct: ${correctOptText}`) {
        repetitiveExplanations.push({ id: q._id, text: q.questionText.substring(0, 50) });
      }
    }
  }

  console.log('=== QUIZ QUALITY AUDIT SUMMARY ===');
  console.log('Total Questions:', questions.length);
  console.log('Duplicates Found:', duplicates.length);
  console.log('Invalid Answer Keys:', invalidKeys.length);
  console.log('Missing/Weak whyIncorrect:', missingWhyIncorrect.length);
  console.log('Missing/Weak practicalTakeaway:', missingTakeaways.length);
  console.log('Missing legalReferences:', missingLegalRefs.length);
  console.log('Repetitive Explanations:', repetitiveExplanations.length);

  const missingWithRelated = missingLegalRefs.filter(m => m.related && m.related.trim());
  console.log('Missing legalReferences but have relatedLawSection:', missingWithRelated.length);
  console.log('Sample relatedLawSection values:', missingWithRelated.slice(0, 10).map(m => m.related));

  console.log('\n--- Format Breakdown ---');
  console.log(formatCounts);

  console.log('\n--- Category Breakdown ---');
  console.log(categoryCounts);

  console.log('\n--- Difficulty Breakdown ---');
  console.log(difficultyCounts);

  if (duplicates.length > 0) {
    console.log('\nSample Duplicates:', duplicates.slice(0, 3));
  }
  if (invalidKeys.length > 0) {
    console.log('\nSample Invalid Keys:', invalidKeys);
  }

  await mongoose.disconnect();
}

auditQuestions().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
