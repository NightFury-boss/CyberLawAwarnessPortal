const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.ASSERT_STAGING_DB !== 'true'
) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const { validateSeedExecutionTarget } = require('./seedSecurityGuard');
const { logSafeServerError } = require('../utils/apiErrorResponder');

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

async function clear(disconnect = true) {
  const connectedDbName = mongoose.connection.readyState === 1 ? mongoose.connection.name : '';
  const targetGuard = validateSeedExecutionTarget({
    env: process.env,
    isReset: false,
    connectedDbName,
    allowReset: false
  });
  if (mongoose.connection.readyState === 0) {
    console.log(`[Clear Fixture] Connecting to validated target: ${targetGuard.redactedUri}`);
    await mongoose.connect(targetGuard.targetUri, { family: 4 });
    console.log('[Clear Fixture] Connected to MongoDB.');
  }

  const existingScenario = await Scenario.findOne({ slug: 'assessment-fixture-v1' });
  if (existingScenario) {
    const stages = await ScenarioStage.find({ scenarioId: existingScenario._id });
    const stageIds = stages.map(s => s._id);
    
    // Delete Decisions
    const decRes = await ScenarioDecision.deleteMany({ stageId: { $in: stageIds } });
    console.log(`[Clear Fixture] Deleted ${decRes.deletedCount} decisions.`);

    // Delete Stages
    const stageRes = await ScenarioStage.deleteMany({ scenarioId: existingScenario._id });
    console.log(`[Clear Fixture] Deleted ${stageRes.deletedCount} stages.`);

    // Delete Scenario
    const scenRes = await Scenario.deleteOne({ _id: existingScenario._id });
    console.log(`[Clear Fixture] Deleted ${scenRes.deletedCount} scenarios.`);
    
    console.log('[Clear Fixture] Cleanup complete.');
  } else {
    console.log('[Clear Fixture] No matching fixture scenario slug found. Skip.');
  }

  if (disconnect) {
    await mongoose.disconnect();
    console.log('[Clear Fixture] Database connection closed.');
  }
}

if (require.main === module) {
  clear(true).catch(err => {
    logSafeServerError('[Clear Fixture Error]', err);
    process.exit(1);
  });
}

module.exports = clear;
