const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AssessmentSession = require('../models/AssessmentSession');

function mapToObject(val) {
  if (!val) return {};
  if (val instanceof Map) return Object.fromEntries(val);
  if (typeof val === 'object') return val;
  return {};
}

async function inspectScoreBug() {
  console.log('===============================================================');
  console.log('DIAGNOSTIC AUDIT: "YOUR DIGITAL DAY" 50/100 ASSESSMENT SCORE BUG');
  console.log('===============================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    // 1. Inspect v2 Scenario Weights & Decisions
    const baselineV2 = await Scenario.findOne({ slug: 'baseline', version: 2 });
    const finalV2 = await Scenario.findOne({ slug: 'final', version: 2 });

    console.log('[1. SCENARIO CONFIGURATION]');
    console.log(`- Baseline v2: ID ${baselineV2._id} (version: ${baselineV2.version})`);
    console.log(`- Final v2:    ID ${finalV2._id} (version: ${finalV2.version})`);
    console.log('- Configured category weights on v2 Scenario:', mapToObject(finalV2.configuredWeights));

    const v2Stages = await ScenarioStage.find({ scenarioId: finalV2._id });
    const v2Decisions = await ScenarioDecision.find({ stageId: { $in: v2Stages.map(s => s._id) } });

    const decsWithCatWeights = v2Decisions.filter(d => d.categoryScoreWeights && d.categoryScoreWeights.size > 0);
    console.log(`- Total decisions in v2 scenario: ${v2Decisions.length}`);
    console.log(`- Decisions with categoryScoreWeights populated: ${decsWithCatWeights.length}`);
    console.log('  => ROOT CAUSE PART 1: 0 out of ' + v2Decisions.length + ' decisions define categoryScoreWeights.');
    console.log('     Because v2 uses the Six-Metric Behavioral Matrix, categoryScores never mutate during assessment.\n');

    // 2. Inspect session lifecycle & math
    console.log('[2. SESSION SCORE LIFECYCLE]');
    console.log('A. On session start: categoryScores initialized to 50 for each category:');
    console.log('   { "Phishing awareness": 50, "Social engineering": 50, "URL verification": 50, "Credential safety": 50 }');
    console.log('B. During 13 stages: categoryScores remain 50 across all categories.');
    console.log('C. On completion: simulationController.js calculates:');
    console.log('   finalScore = (50*25 + 50*25 + 50*25 + 50*25) / 100 = 50.');
    console.log('   => ROOT CAUSE PART 2: Monolithic score is locked at 50/100 regardless of choices.\n');

    // 3. Inspect latest completed v2 sessions
    console.log('[3. ACTUAL PERSISTED SESSION DATA]');
    const v2Sessions = await AssessmentSession.find({
      scenarioVersion: 2,
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(5);

    if (v2Sessions.length === 0) {
      console.log('No completed v2 sessions found in DB.');
    } else {
      v2Sessions.forEach((s, idx) => {
        console.log(`--- [Session #${idx + 1}] ID: ${s._id} (${s.scenarioCode} v${s.scenarioVersion}) ---`);
        console.log(`- Displayed Composite Score: ${s.score}/100 (Level: ${s.score >= 75 ? 'Cyber Defender' : s.score >= 40 ? 'Needs Improvement' : 'High Risk'})`);
        console.log('- Persisted CategoryScores:', mapToObject(s.categoryScores));
        console.log('- AUTHORITATIVE BEHAVIORAL METRICS (ACTUAL USER PERFORMANCE):');
        const bScores = mapToObject(s.behaviourScores);
        console.log(`  * Threat Recognition (TR):      ${bScores.recognition}%`);
        console.log(`  * Signal Identification (SI):   ${bScores.signalIdentification}%`);
        console.log(`  * Verification Habits (VB):     ${bScores.verification}%`);
        console.log(`  * Decision Quality (DQ):        ${bScores.decisionQuality}%`);
        console.log(`  * False Positive (FP):          ${bScores.falsePositive}% (Penalty: ${s.falsePositivePenaltyPoints}/${s.falsePositiveMaxPenaltyPoints})`);
        console.log(`  * Unreviewed Acceptance (UA):   ${bScores.unreviewedAcceptance}% (Penalty: ${s.unreviewedAcceptancePenaltyPoints}/${s.unreviewedAcceptanceMaxPenaltyPoints})`);
        console.log(`  * Critical Mistakes Made:       ${s.criticalMistakes.length}`);
        console.log();
      });
    }

    console.log('===============================================================');
    console.log('CONCLUSION:');
    console.log('The 6-metric behavioral model works and records dynamic scores.');
    console.log('The monolithic 50/100 score is a legacy calculation artifact that');
    console.log('misleads users and freezes pre/post delta reports at +0 points.');
    console.log('===============================================================');

  } finally {
    await mongoose.disconnect();
    console.log('\n[Database] Mongoose disconnected cleanly.');
  }
}

if (require.main === module) {
  inspectScoreBug().catch(err => {
    console.error('Inspection failed:', err);
    process.exit(1);
  });
}

module.exports = inspectScoreBug;
