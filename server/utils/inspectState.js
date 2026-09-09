


const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI;

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const scenarios = await Scenario.find({}).lean();
  console.log(`\nFound ${scenarios.length} Scenarios:`);
  for (const s of scenarios) {
    const stageCount = await ScenarioStage.countDocuments({ scenarioId: s._id });
    console.log(`- ID: ${s._id} | Slug: ${s.slug} | Version: ${s.version} | Status: ${s.status} | Title: "${s.title}" | Stages: ${stageCount}`);
  }

  const sessions = await AssessmentSession.find({}).lean();
  console.log(`\nFound ${sessions.length} AssessmentSessions:`);
  const sessionSummary = {};
  for (const sess of sessions) {
    const key = `${sess.scenarioCode || 'unknown'}_v${sess.scenarioVersion || 1}_${sess.status}`;
    sessionSummary[key] = (sessionSummary[key] || 0) + 1;
  }
  console.log('Session breakdown:', sessionSummary);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
