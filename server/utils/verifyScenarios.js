const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const ScenarioSchema = new mongoose.Schema({}, { strict: false });
const ScenarioStageSchema = new mongoose.Schema({}, { strict: false });
const ScenarioDecisionSchema = new mongoose.Schema({}, { strict: false });

const Scenario = mongoose.model('Scenario', ScenarioSchema, 'scenarios');
const ScenarioStage = mongoose.model('ScenarioStage', ScenarioStageSchema, 'scenariostages');
const ScenarioDecision = mongoose.model('ScenarioDecision', ScenarioDecisionSchema, 'scenariodecisions');

async function verify() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Starting Scenario integrity audit...');

  const scenarios = await Scenario.find({});
  let totalIssues = 0;

  for (let s of scenarios) {
    console.log(`\nAuditing Scenario: "${s.title}" (slug: ${s.slug}, code: ${s.code}, id: ${s._id})`);
    
    const stages = await ScenarioStage.find({ scenarioId: s._id }).sort({ stageOrder: 1 });
    if (stages.length === 0) {
      console.error(`  [ERROR] Scenario has 0 stages in the database!`);
      totalIssues++;
      continue;
    }

    const stageOrders = stages.map(st => st.stageOrder);
    const uniqueOrders = new Set(stageOrders);
    if (uniqueOrders.size !== stageOrders.length) {
      console.error(`  [ERROR] Scenario contains duplicate stageOrder values: ${stageOrders}`);
      totalIssues++;
    }

    const stageMap = {};
    stages.forEach(st => {
      stageMap[st._id.toString()] = st;
    });

    const referencedStageIds = new Set();
    const firstStage = stages.find(st => st.stageOrder === 1);
    if (!firstStage) {
      console.error(`  [ERROR] Scenario is missing an entry stage (stageOrder = 1)!`);
      totalIssues++;
    } else {
      referencedStageIds.add(firstStage._id.toString());
    }

    for (let st of stages) {
      const decisions = await ScenarioDecision.find({ stageId: st._id });
      
      if (decisions.length === 0 && !st.terminal && st.title !== 'Adaptive Segment') {
        console.error(`  [ERROR] Non-terminal Stage ${st.stageOrder} ("${st.title}") has 0 decisions!`);
        totalIssues++;
      }

      for (let dec of decisions) {
        if (dec.nextStageId) {
          const nextIdStr = dec.nextStageId.toString();
          if (!stageMap[nextIdStr]) {
            console.error(`  [ERROR] Stage ${st.stageOrder} Decision ("${dec.optionText.substring(0, 30)}...") points to an invalid/non-existent nextStageId: ${dec.nextStageId}`);
            totalIssues++;
          } else {
            referencedStageIds.add(nextIdStr);
          }
        } else if (!st.terminal) {
          console.warn(`  [WARNING] Non-terminal Stage ${st.stageOrder} Decision ("${dec.optionText.substring(0, 30)}...") has a null nextStageId.`);
        }
      }
    }
  }

  console.log(`\nAudit Complete. Found ${totalIssues} critical reference issues.`);
  await mongoose.disconnect();
  
  if (totalIssues > 0) {
    process.exit(1);
  } else {
    console.log('✅ ALL SCENARIO DATABASE REFERENCE PATHS ARE INTEGRITY SAFE!');
    process.exit(0);
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
