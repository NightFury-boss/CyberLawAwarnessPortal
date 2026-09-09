const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const { calculateScores } = require('../services/assessmentScoringService');

async function verifyHistoricalVersioning() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for Historical Versioning Verification.\n');

  // 1. Check Scenario Records
  const allScenarios = await Scenario.find({ slug: { $in: ['baseline', 'final'] } }).sort({ slug: 1, version: 1 }).lean();
  console.log(`[1] Scenarios in Database (${allScenarios.length} found):`);
  for (const s of allScenarios) {
    const stageCount = await ScenarioStage.countDocuments({ scenarioId: s._id });
    const stages = await ScenarioStage.find({ scenarioId: s._id }).select('_id').lean();
    const decisionCount = await ScenarioDecision.countDocuments({ stageId: { $in: stages.map(st => st._id) } });
    console.log(`  - Scenario ID: ${s._id} | Slug: ${s.slug} | Version: ${s.version} | Status: ${s.status} | Title: "${s.title}" | Stages: ${stageCount} | Decisions: ${decisionCount}`);
  }

  // 2. Check Existing Completed Assessment Sessions
  const completedSessions = await AssessmentSession.find({ status: 'completed' }).lean();
  console.log(`\n[2] Existing Completed Assessment Sessions (${completedSessions.length} found):`);
  for (const sess of completedSessions) {
    const scenario = allScenarios.find(s => s._id.toString() === (sess.scenarioId ? sess.scenarioId.toString() : ''));
    const decs = await AssessmentDecision.find({ assessmentSessionId: sess._id }).lean();
    console.log(`  - Session ID: ${sess._id}`);
    console.log(`    User ID: ${sess.userId}`);
    console.log(`    Scenario Code: ${sess.scenarioCode} | Session scenarioVersion: ${sess.scenarioVersion}`);
    console.log(`    Linked Scenario ID: ${sess.scenarioId} -> Found Scenario: ${scenario ? `"${scenario.title}" (v${scenario.version})` : 'NOT FOUND'}`);
    console.log(`    Persisted Score: ${sess.score}`);
    console.log(`    Persisted Decisions Recorded: ${decs.length}`);

    // Test reproducibility: recalculate scores using existing assessmentScoringService
    if (decs.length > 0) {
      try {
        const recalculated = await calculateScores(sess._id);
        console.log(`    Recalculated Score: TR=${recalculated.scores.recognition}%, SI=${recalculated.scores.signalIdentification}%, VB=${recalculated.scores.verification}%, DQ=${recalculated.scores.decisionQuality}%`);
      } catch (err) {
        console.log(`    Recalculation error: ${err.message}`);
      }
    }
  }

  // 3. Inspect Stage and Decision Details for v1 vs v2
  console.log('\n[3] Deep Graph Details for v1 Scenarios:');
  const v1Baseline = allScenarios.find(s => s.slug === 'baseline' && s.version === 1);
  const v1Final = allScenarios.find(s => s.slug === 'final' && s.version === 1);

  if (v1Baseline) {
    const bStages = await ScenarioStage.find({ scenarioId: v1Baseline._id }).sort({ stageOrder: 1 }).lean();
    console.log(`  v1 Baseline (${v1Baseline._id}): ${bStages.length} stages`);
    for (const st of bStages) {
      const dCount = await ScenarioDecision.countDocuments({ stageId: st._id });
      console.log(`    Stage ${st.stageOrder}: "${st.title}" (${st.stageType || st.eventClassification}) - ${dCount} decisions`);
    }
  } else {
    console.log('  WARNING: v1 Baseline NOT FOUND!');
  }

  if (v1Final) {
    const fStages = await ScenarioStage.find({ scenarioId: v1Final._id }).sort({ stageOrder: 1 }).lean();
    console.log(`  v1 Final (${v1Final._id}): ${fStages.length} stages`);
    for (const st of fStages) {
      const dCount = await ScenarioDecision.countDocuments({ stageId: st._id });
      console.log(`    Stage ${st.stageOrder}: "${st.title}" (${st.stageType || st.eventClassification}) - ${dCount} decisions`);
    }
  } else {
    console.log('  WARNING: v1 Final NOT FOUND!');
  }

  await mongoose.disconnect();
}

verifyHistoricalVersioning().catch(err => {
  console.error(err);
  process.exit(1);
});
