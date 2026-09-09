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

async function auditMetrics() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for Metric Audit...');

  const finalV2 = await Scenario.findOne({ slug: 'final', version: 2 });
  if (!finalV2) throw new Error('Final v2 not found!');

  // Helper to create simulated session and evaluate calculateScores
  async function evaluatePath(pathName, decisionOptionTexts) {
    const dummySession = await AssessmentSession.create({
      userId: new mongoose.Types.ObjectId(),
      scenarioId: finalV2._id,
      scenarioVersion: 2,
      scenarioCode: 'final',
      currentStageId: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 3600000)
    });

    const stages = await ScenarioStage.find({ scenarioId: finalV2._id }).sort({ stageOrder: 1 });
    const stageByOrder = {};
    stages.forEach(s => stageByOrder[s.stageOrder] = s);

    let rawScores = { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 };

    for (const optText of decisionOptionTexts) {
      const decision = await ScenarioDecision.findOne({
        stageId: { $in: stages.map(s => s._id) },
        optionText: { $regex: optText, $options: 'i' }
      });
      if (!decision) throw new Error(`Decision not found for: ${optText}`);

      const stage = stages.find(s => s._id.toString() === decision.stageId.toString());
      const focus = (stage && stage.measurementFocus) || [];
      const effects = decision.behaviorEffects || {};

      if (focus.includes('THREAT_RECOGNITION') && stage.eventClassification !== 'legitimate') {
        rawScores.recognition += (effects.recognition || 0);
      }
      if (focus.includes('SIGNAL_IDENTIFICATION')) {
        rawScores.signalIdentification += (effects.signalIdentification || 0);
      }
      if (focus.includes('VERIFICATION')) {
        rawScores.verification += (effects.verification || 0);
      }
      if (focus.includes('DECISION_QUALITY')) {
        rawScores.decisionQuality += (effects.decisionQuality || 0);
      }

      await AssessmentDecision.create({
        assessmentSessionId: dummySession._id,
        stageId: decision.stageId,
        decisionId: decision._id
      });
    }

    const scores = await calculateScores(dummySession._id);
    scores.rawScores = rawScores;

    // Clean up
    await AssessmentDecision.deleteMany({ assessmentSessionId: dummySession._id });
    await AssessmentSession.deleteOne({ _id: dummySession._id });

    return scores;
  }

  // Safe path optimal choices
  const safeOptimalTexts = [
    'Acknowledge the notification',
    'Open the official India Post website',
    'Decline the upfront payment and independently verify',
    'Decline the request and report the unknown VPA',
    'Review device and location on screen',
    'allow Camera only',
    'check connection status directly with telecom provider through official customer care',
    'Review order status and delivery date normally',
    'Notice merchant name mismatch',
    'Spot fake sender domain',
    'normal cellular phone number',
    'Schedule or install official security update',
    'View Your Digital Habits Breakdown'
  ];

  // Risky path (comply with Stage 7B -> connect to 8B -> recover with 8BA)
  const riskyOptimalTexts = [
    'Acknowledge the notification',
    'Open the official India Post website',
    'Decline the upfront payment and independently verify',
    'Decline the request and report the unknown VPA',
    'Review device and location on screen',
    'allow Camera only',
    'Press 9 in panic to connect with the investigation desk',
    'Disconnect call immediately and report the incident via official cybercrime channels',
    'Notice merchant name mismatch',
    'Spot fake sender domain',
    'normal cellular phone number',
    'Schedule or install official security update',
    'View Your Digital Habits Breakdown'
  ];

  const safeResult = await evaluatePath('Safe Path', safeOptimalTexts);
  const riskyResult = await evaluatePath('Risky Path', riskyOptimalTexts);

  console.log('\n========================================================================================');
  console.log('FINAL METRIC AUDIT TABLE: PHASE 2.3 PRODUCTION DATA');
  console.log('========================================================================================');
  console.log('| Metric Dimension              | Safe Path (Traversing 8A)        | Risky Path (Traversing 8B)       | Match Spec? |');
  console.log('|-------------------------------|----------------------------------|----------------------------------|-------------|');
  
  function formatRow(dim, safeRaw, safeMax, safeNorm, riskyRaw, riskyMax, riskyNorm, specSafe, specRisky) {
    const safeStr = `Raw: ${safeRaw}/${safeMax} (${safeNorm}%)`;
    const riskyStr = `Raw: ${riskyRaw}/${riskyMax} (${riskyNorm}%)`;
    const match = (safeMax === specSafe && riskyMax === specRisky) ? 'EXACT MATCH' : 'MISMATCH';
    console.log(`| ${dim.padEnd(29)} | ${safeStr.padEnd(32)} | ${riskyStr.padEnd(32)} | ${match.padEnd(11)} |`);
  }

  formatRow('Threat Recognition (TR)', safeResult.rawScores.recognition, safeResult.opportunities.recognition, safeResult.scores.recognition,
            riskyResult.rawScores.recognition, riskyResult.opportunities.recognition, riskyResult.scores.recognition, 14, 16);

  formatRow('Signal Identification (SI)', safeResult.rawScores.signalIdentification, safeResult.opportunities.signalIdentification, safeResult.scores.signalIdentification,
            riskyResult.rawScores.signalIdentification, riskyResult.opportunities.signalIdentification, riskyResult.scores.signalIdentification, 8, 8);

  formatRow('Verification Behaviour (VB)', safeResult.rawScores.verification, safeResult.opportunities.verification, safeResult.scores.verification,
            riskyResult.rawScores.verification, riskyResult.opportunities.verification, riskyResult.scores.verification, 14, 16);

  formatRow('Decision Quality (DQ)', safeResult.rawScores.decisionQuality, safeResult.opportunities.decisionQuality, safeResult.scores.decisionQuality,
            riskyResult.rawScores.decisionQuality, riskyResult.opportunities.decisionQuality, riskyResult.scores.decisionQuality, 24, 24);

  formatRow('False Positive Control (FP)', safeResult.falsePositivePenaltyPoints, safeResult.falsePositiveMaxPenaltyPoints, safeResult.scores.falsePositive,
            riskyResult.falsePositivePenaltyPoints, riskyResult.falsePositiveMaxPenaltyPoints, riskyResult.scores.falsePositive, 8, 6);

  formatRow('Unreviewed Acceptance (UA)', safeResult.unreviewedAcceptancePenaltyPoints, safeResult.unreviewedAcceptanceMaxPenaltyPoints, safeResult.scores.unreviewedAcceptance,
            riskyResult.unreviewedAcceptancePenaltyPoints, riskyResult.unreviewedAcceptanceMaxPenaltyPoints, riskyResult.scores.unreviewedAcceptance, 6, 6);

  console.log('========================================================================================\n');

  await mongoose.disconnect();
}

auditMetrics().catch(err => {
  console.error(err);
  process.exit(1);
});
