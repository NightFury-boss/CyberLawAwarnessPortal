const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

// Import all models to register their schemas
const UserProgress = require('../models/UserProgress');
const LawSection = require('../models/LawSection');
const AssessmentSession = require('../models/AssessmentSession');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');

async function runMigration() {
  console.log('Connecting to MongoDB database...');
  await mongoose.connect(MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB. Starting database hardening migrations...');

  // 1. Normalize lowercase legalStatus to uppercase in LawSection
  const lawsToFix = await LawSection.find({});
  console.log(`Scanning ${lawsToFix.length} LawSection documents...`);
  let fixedLaws = 0;
  for (const law of lawsToFix) {
    if (law.legalStatus && law.legalStatus !== law.legalStatus.toUpperCase()) {
      const original = law.legalStatus;
      law.legalStatus = law.legalStatus.toUpperCase();
      await law.save();
      console.log(`- Normalized LawSection ${law.sectionNumber}: "${original}" -> "${law.legalStatus}"`);
      fixedLaws++;
    }
  }
  console.log(`✅ Normalized ${fixedLaws} LawSection documents to uppercase legalStatus.`);

  // 2. Unset quizAttempts array in UserProgress collection
  const progressToFix = await UserProgress.find({});
  console.log(`Scanning ${progressToFix.length} UserProgress documents...`);
  let fixedProgress = 0;
  for (const progress of progressToFix) {
    if (progress.toObject().quizAttempts !== undefined) {
      await UserProgress.updateOne({ _id: progress._id }, { $unset: { quizAttempts: "" } });
      console.log(`- Unset legacy quizAttempts array for progress user ID: ${progress.userId}`);
      fixedProgress++;
    }
  }
  console.log(`✅ Unset legacy quizAttempts array for ${fixedProgress} UserProgress documents.`);

  // 3. Synchronize schema indexes
  console.log('Synchronizing hardened indexes in MongoDB...');
  await UserProgress.syncIndexes();
  await LawSection.syncIndexes();
  await AssessmentSession.syncIndexes();
  await ScenarioStage.syncIndexes();
  await ScenarioDecision.syncIndexes();
  await QuizQuestion.syncIndexes();
  await QuizAttempt.syncIndexes();
  console.log('✅ Hardened database indexes successfully synchronized!');

  await mongoose.disconnect();
  console.log('Migration completed successfully!');
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error('Migration failed with critical error:', err);
    process.exit(1);
  });
}

module.exports = runMigration;
