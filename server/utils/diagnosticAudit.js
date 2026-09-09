const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env regardless of CWD
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');

function mapToObject(value) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === 'object') return value;
  return {};
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    console.log('=== V2 FINAL SCENARIO ===');

    const finalV2 = await Scenario.findOne({
      slug: 'final',
      version: 2
    });

    if (!finalV2) {
      throw new Error('Final v2 scenario not found');
    }

    console.log('Final v2 ID:', finalV2._id.toString());
    console.log('Final v2 configuredWeights:', finalV2.configuredWeights);

    const stages = await ScenarioStage.find({
      scenarioId: finalV2._id
    }).sort({ stageOrder: 1 });

    console.log(`Found ${stages.length} stages in Final v2.`);

    const stage1Decs = await ScenarioDecision.find({
      stageId: stages[0]._id
    });

    console.log('\n=== STAGE 1 DECISIONS ===');

    for (const d of stage1Decs) {
      console.log({
        id: d._id.toString(),
        text: d.optionText,
        scoreChange: d.scoreChange,
        categoryScoreWeights: d.categoryScoreWeights,
        behaviorEffects: d.behaviorEffects,
        outcomeType: d.outcomeType,
        isCriticalMistake: d.isCriticalMistake,
        nextStageId: d.nextStageId?.toString() || null
      });
    }

    console.log('\n=== LATEST COMPLETED SESSIONS ===');

    const completedSessions = await AssessmentSession.find({
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(10);

    for (const s of completedSessions) {
      console.log('\n----------------------------------------');

      console.log(`Session: ${s._id}`);
      console.log(`ScenarioCode: ${s.scenarioCode}`);
      console.log(`ScenarioVersion: ${s.scenarioVersion || 1}`);
      console.log(`ScenarioId: ${s.scenarioId}`);

      console.log('Monolithic score:', s.score);

      console.log(
        'CategoryScores:',
        mapToObject(s.categoryScores)
      );

      console.log(
        'BehaviourScores:',
        mapToObject(s.behaviourScores)
      );

      console.log(
        'BehaviourOpportunities:',
        mapToObject(s.behaviourOpportunities)
      );

      console.log(
        'FalsePositivePenaltyPoints:',
        s.falsePositivePenaltyPoints,
        '/',
        s.falsePositiveMaxPenaltyPoints
      );

      console.log(
        'UnreviewedAcceptancePenaltyPoints:',
        s.unreviewedAcceptancePenaltyPoints,
        '/',
        s.unreviewedAcceptanceMaxPenaltyPoints
      );

      console.log(
        'CriticalMistakes:',
        s.criticalMistakes
      );

      console.log(
        'Status:',
        s.status,
        'CompletedAt:',
        s.completedAt
      );
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected cleanly.');
  }
}

run().catch((error) => {
  console.error('\nDiagnostic failed:', error);
  process.exitCode = 1;
});
