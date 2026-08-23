const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

async function clear(disconnect = true) {
  if (mongoose.connection.readyState === 0) {
    console.log('[Clear Fixture] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { family: 4 });
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
    console.error('Clearing crashed:', err);
    process.exit(1);
  });
}

module.exports = clear;
