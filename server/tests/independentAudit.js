const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI;

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');
const AssessmentDecision = require('../models/AssessmentDecision');
const User = require('../models/User');

const { auditScenario } = require('../services/scenarioIntegrityService');
const { calculateScores } = require('../services/assessmentScoringService');

async function runIndependentAudit() {
  await mongoose.connect(MONGODB_URI, { family: 4 });
  console.log('[Audit] Connected to MongoDB.');

  // 1. Clean State Document Verification
  console.log('\n=== 1. CLEAN STATE DOCUMENT VERIFICATION ===');
  const fixtureScenarios = await Scenario.find({ slug: 'assessment-fixture-v1' });
  if (fixtureScenarios.length !== 1) {
    throw new Error(`Expected exactly 1 fixture scenario, found ${fixtureScenarios.length}`);
  }
  const fixtureScenario = fixtureScenarios[0];
  const stages = await ScenarioStage.find({ scenarioId: fixtureScenario._id }).sort({ stageOrder: 1 });
  const stageIds = stages.map(s => s._id);
  const decisions = await ScenarioDecision.find({ stageId: { $in: stageIds } });
  const prodBaseline = await Scenario.findOne({ slug: 'baseline' });
  const prodFinal = await Scenario.findOne({ slug: 'final' });

  console.log(`- Fixture Scenario Count: ${fixtureScenarios.length} (Expected: 1)`);
  console.log(`- Fixture Stages Count: ${stages.length} (Expected: 8)`);
  console.log(`- Fixture Decisions Count: ${decisions.length} (Expected: 18)`);
  console.log(`- Production 'baseline' Scenario present: ${!!prodBaseline}`);
  console.log(`- Production 'final' Scenario present: ${!!prodFinal}`);

  // 2. Comprehensive Inventory of Stages and Decisions
  console.log('\n=== 2. FIXTURE STAGE & DECISION METADATA INVENTORY ===');
  for (const st of stages) {
    const stDecs = decisions.filter(d => d.stageId.toString() === st._id.toString());
    console.log(`\n[Stage Order ${st.stageOrder}] ${st.title}`);
    console.log(`  Classification: ${st.eventClassification} | Focus: [${st.measurementFocus.join(', ')}] | Terminal: ${st.terminal}`);
    for (const d of stDecs) {
      console.log(`    Decision: "${d.optionText}" (NextStage: ${d.nextStageId ? 'Stage ID ' + d.nextStageId : 'null'})`);
      console.log(`      Effects: TR=${d.behaviorEffects?.recognition || 0}, SI=${d.behaviorEffects?.signalIdentification || 0}, VB=${d.behaviorEffects?.verification || 0}, DQ=${d.behaviorEffects?.decisionQuality || 0}, FP=${d.behaviorEffects?.falsePositive || 0}, UA=${d.behaviorEffects?.unreviewedAcceptance || 0}`);
    }
  }

  // 3. Graph Integrity Audit
  console.log('\n=== 3. SCENARIO GRAPH INTEGRITY AUDIT ===');
  const graphResult = await auditScenario(fixtureScenario._id);
  console.log('Graph Audit Valid:', graphResult.valid);
  console.log('Graph Audit Errors:', graphResult.errors);
  console.log('Graph Audit Warnings:', graphResult.warnings);

  await mongoose.disconnect();
}

runIndependentAudit().catch(err => {
  console.error('[Audit Error]', err);
  process.exit(1);
});
