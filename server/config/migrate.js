const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

// Import all models
const UserProgress = require('../models/UserProgress');
const LawSection = require('../models/LawSection');
const AssessmentSession = require('../models/AssessmentSession');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');

async function runMigration() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB. Starting Phase 2.1C migrations...');

  // 1. Normalize lowercase legalStatus to uppercase in LawSection
  const lawsToFix = await LawSection.find({});
  let fixedLaws = 0;
  for (const law of lawsToFix) {
    if (law.legalStatus && law.legalStatus !== law.legalStatus.toUpperCase()) {
      law.legalStatus = law.legalStatus.toUpperCase();
      await law.save();
      fixedLaws++;
    }
  }
  console.log(`✅ Normalized ${fixedLaws} LawSection documents to uppercase legalStatus.`);

  // 2. Unset quizAttempts array in UserProgress collection
  const progressToFix = await UserProgress.find({});
  let fixedProgress = 0;
  for (const progress of progressToFix) {
    if (progress.toObject().quizAttempts !== undefined) {
      await UserProgress.updateOne({ _id: progress._id }, { $unset: { quizAttempts: "" } });
      fixedProgress++;
    }
  }
  console.log(`✅ Unset legacy quizAttempts array for ${fixedProgress} UserProgress documents.`);

  // 3. Migrate ScenarioStage new fields (measurementFocus, targetSignals)
  const stagesToFix = await ScenarioStage.find({});
  console.log(`Auditing ${stagesToFix.length} ScenarioStage documents...`);
  let fixedStages = 0;
  for (const stage of stagesToFix) {
    let changed = false;
    
    // Set measurementFocus if empty
    if (!stage.measurementFocus || stage.measurementFocus.length === 0) {
      if (stage.eventClassification === 'legitimate') {
        stage.measurementFocus = ['FALSE_POSITIVE_CONTROL', 'DECISION_QUALITY'];
      } else if (stage.eventClassification === 'ambiguous') {
        stage.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION', 'DECISION_QUALITY'];
      } else {
        stage.measurementFocus = ['THREAT_RECOGNITION', 'SIGNAL_IDENTIFICATION', 'VERIFICATION', 'DECISION_QUALITY'];
      }
      changed = true;
    }

    // Set targetSignals if empty
    if (!stage.targetSignals) {
      stage.targetSignals = [];
      changed = true;
    }

    if (changed) {
      await stage.save();
      fixedStages++;
    }
  }
  console.log(`✅ Populated Phase 2.1C fields on ${fixedStages} ScenarioStage documents.`);

  // 4. Migrate ScenarioDecision new fields and clamp range [0, 1, 2]
  const decisionsToFix = await ScenarioDecision.find({});
  console.log(`Auditing ${decisionsToFix.length} ScenarioDecision documents...`);
  let fixedDecisions = 0;
  for (const dec of decisionsToFix) {
    let changed = false;
    
    // Ensure identifiedSignals is set
    if (!dec.identifiedSignals) {
      dec.identifiedSignals = [];
      changed = true;
    }

    // Lock/clamp behaviorEffects to range [0, 1, 2]
    if (dec.behaviorEffects) {
      const effects = dec.behaviorEffects;
      let effectsChanged = false;
      
      const checkAndClamp = (name, val) => {
        if (typeof val !== 'number' || isNaN(val)) return { val: 0, changed: true };
        if (val < 0 || val > 2) {
          console.warn(`[Migration Warning] Decision ID ${dec._id} ("${dec.optionText.substring(0, 30)}") has invalid behaviorEffect "${name}" = ${val}. Clamping safely.`);
          return { val: Math.max(0, Math.min(2, Math.round(val))), changed: true };
        }
        const rounded = Math.round(val);
        return { val: rounded, changed: rounded !== val };
      };

      const metrics = ['recognition', 'signalIdentification', 'verification', 'decisionQuality', 'falsePositive', 'unreviewedAcceptance'];
      for (const m of metrics) {
        const res = checkAndClamp(m, effects[m]);
        if (res.changed) {
          effects[m] = res.val;
          effectsChanged = true;
        }
      }

      if (effectsChanged) {
        dec.markModified('behaviorEffects');
        changed = true;
      }
    } else {
      dec.behaviorEffects = {
        recognition: 0,
        signalIdentification: 0,
        verification: 0,
        decisionQuality: 0,
        falsePositive: 0,
        unreviewedAcceptance: 0
      };
      changed = true;
    }

    if (changed) {
      await dec.save();
      fixedDecisions++;
    }
  }
  console.log(`✅ Populated Phase 2.1C fields and clamped effects on ${fixedDecisions} ScenarioDecision documents.`);

  // 5. Migrate AssessmentSession new fields (behaviourOpportunities, penalty points)
  const sessionsToFix = await AssessmentSession.find({});
  console.log(`Auditing ${sessionsToFix.length} AssessmentSession documents...`);
  let fixedSessions = 0;
  for (const session of sessionsToFix) {
    let changed = false;
    
    if (!session.behaviourOpportunities || session.behaviourOpportunities.size === 0) {
      session.behaviourOpportunities = {
        recognition: 0,
        signalIdentification: 0,
        verification: 0,
        decisionQuality: 0,
        falsePositive: 0,
        unreviewedAcceptance: 0
      };
      changed = true;
    }

    if (session.falsePositivePenaltyPoints === undefined) {
      session.falsePositivePenaltyPoints = 0;
      changed = true;
    }
    if (session.falsePositiveMaxPenaltyPoints === undefined) {
      session.falsePositiveMaxPenaltyPoints = 0;
      changed = true;
    }
    if (session.unreviewedAcceptancePenaltyPoints === undefined) {
      session.unreviewedAcceptancePenaltyPoints = 0;
      changed = true;
    }
    if (session.unreviewedAcceptanceMaxPenaltyPoints === undefined) {
      session.unreviewedAcceptanceMaxPenaltyPoints = 0;
      changed = true;
    }

    if (changed) {
      await session.save();
      fixedSessions++;
    }
  }
  console.log(`✅ Initialized Phase 2.1C fields on ${fixedSessions} AssessmentSession documents.`);

  // 6. Synchronize schema indexes
  console.log('Synchronizing schema indexes in MongoDB...');
  await UserProgress.syncIndexes();
  await LawSection.syncIndexes();
  await AssessmentSession.syncIndexes();
  await ScenarioStage.syncIndexes();
  await ScenarioDecision.syncIndexes();
  await QuizQuestion.syncIndexes();
  await QuizAttempt.syncIndexes();
  console.log('✅ Index synchronization complete.');

  await mongoose.disconnect();
  console.log('Migration completed successfully!');
}

if (require.main === module) {
  runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = runMigration;
