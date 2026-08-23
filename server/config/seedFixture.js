const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

async function seed(disconnect = true) {
  if (mongoose.connection.readyState === 0) {
    console.log('[Seed Fixture] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { family: 4 });
    console.log('[Seed Fixture] Connected to MongoDB.');
  }

  // Pre-cleanup
  console.log('[Seed Fixture] Running cleanups first...');
  const existingScenario = await Scenario.findOne({ slug: 'assessment-fixture-v1' });
  if (existingScenario) {
    const stages = await ScenarioStage.find({ scenarioId: existingScenario._id });
    const stageIds = stages.map(s => s._id);
    await ScenarioDecision.deleteMany({ stageId: { $in: stageIds } });
    await ScenarioStage.deleteMany({ scenarioId: existingScenario._id });
    await Scenario.deleteOne({ _id: existingScenario._id });
    console.log('[Seed Fixture] Old fixture documents deleted successfully.');
  }

  // Create Scenario
  console.log('[Seed Fixture] Creating Scenario...');
  const scenario = await Scenario.create({
    title: 'Controlled Assessment Fixture Scenario V1',
    slug: 'assessment-fixture-v1',
    code: 'assessment-fixture-v1',
    description: 'Fixture scenario to validate the assessment measurement engine rules',
    version: 1,
    assessmentType: 'practice',
    status: 'published',
    type: 'phishing',
    domain: 'EMAIL',
    difficulty: 'Intermediate',
    configuredWeights: { 'General Security': 100 }
  });

  // Create Stages & Decisions sequentially to link them correctly
  console.log('[Seed Fixture] Creating Stages and Decisions...');

  // Stage 1 (Fixture A)
  const stage1 = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 1,
    title: 'Fixture A: Phishing Email',
    description: 'A phishing email claiming unexpected bank security updates.',
    mockInterfaceType: 'email',
    eventClassification: 'malicious',
    measurementFocus: ['THREAT_RECOGNITION', 'SIGNAL_IDENTIFICATION', 'VERIFICATION', 'DECISION_QUALITY'],
    targetSignals: ['unexpected_domain', 'urgency'],
    terminal: false
  });

  const dec1A = await ScenarioDecision.create({
    stageId: stage1._id,
    optionText: 'Open the link immediately.',
    scoreChange: -20,
    behaviorEffects: { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 },
    identifiedSignals: [],
    outcomeType: 'incorrect',
    explanation: 'Clicked malicious link blindly.'
  });

  const dec1B = await ScenarioDecision.create({
    stageId: stage1._id,
    optionText: 'Report the message as phishing immediately.',
    scoreChange: 10,
    behaviorEffects: { recognition: 2, signalIdentification: 2, verification: 0, decisionQuality: 1 },
    identifiedSignals: ['unexpected_domain', 'urgency'],
    outcomeType: 'correct',
    explanation: 'Reported threats safely but skipped verifying.'
  });

  const dec1C = await ScenarioDecision.create({
    stageId: stage1._id,
    optionText: 'Open the official service separately and verify the message before acting.',
    scoreChange: 20,
    behaviorEffects: { recognition: 1, signalIdentification: 0, verification: 2, decisionQuality: 2 },
    identifiedSignals: [],
    outcomeType: 'correct',
    explanation: 'Verified the request via separate browser channel.'
  });

  stage1.availableDecisionIds = [dec1A._id, dec1B._id, dec1C._id];
  await stage1.save();

  // Stage 2 (Fixture B)
  const stage2 = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 2,
    title: 'Fixture B: Legitimate Notification',
    description: 'An official update notification from your secure system.',
    mockInterfaceType: 'notification',
    eventClassification: 'legitimate',
    measurementFocus: ['FALSE_POSITIVE_CONTROL', 'DECISION_QUALITY'],
    targetSignals: [],
    terminal: false
  });

  const dec2A = await ScenarioDecision.create({
    stageId: stage2._id,
    optionText: 'Review the notification details normally.',
    scoreChange: 10,
    behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
    identifiedSignals: [],
    outcomeType: 'correct',
    explanation: 'Accepted legitimate notification normally.'
  });

  const dec2B = await ScenarioDecision.create({
    stageId: stage2._id,
    optionText: 'Report the notification as a hacking attempt.',
    scoreChange: -10,
    behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
    identifiedSignals: [],
    outcomeType: 'false-positive',
    explanation: 'Falsely reported a completely safe alert.'
  });

  const dec2C = await ScenarioDecision.create({
    stageId: stage2._id,
    optionText: 'Verify the notification through the official app before proceeding.',
    scoreChange: 10,
    behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
    identifiedSignals: [],
    outcomeType: 'correct',
    explanation: 'Verified safe event before continuing.'
  });

  stage2.availableDecisionIds = [dec2A._id, dec2B._id, dec2C._id];
  await stage2.save();

  // Stage 3 (Fixture C)
  const stage3 = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 3,
    title: 'Fixture C: Ambiguous UPI Payment',
    description: 'An unexpected UPI request that matches a recent checkout you performed.',
    mockInterfaceType: 'checkout',
    eventClassification: 'ambiguous',
    measurementFocus: ['THREAT_RECOGNITION', 'VERIFICATION', 'DECISION_QUALITY'],
    targetSignals: ['unexpected_payment_request'],
    terminal: false
  });

  const dec3A = await ScenarioDecision.create({
    stageId: stage3._id,
    optionText: 'Approve the payment immediately.',
    scoreChange: -20,
    behaviorEffects: { recognition: 0, verification: 0, decisionQuality: 0 },
    identifiedSignals: [],
    outcomeType: 'incorrect',
    explanation: 'Approved payment request blindly.'
  });

  const dec3B = await ScenarioDecision.create({
    stageId: stage3._id,
    optionText: 'Refuse the payment immediately.',
    scoreChange: 0,
    behaviorEffects: { recognition: 1, verification: 0, decisionQuality: 1 },
    identifiedSignals: [],
    outcomeType: 'neutral',
    explanation: 'Refused ambiguous request without verification.'
  });

  const dec3C = await ScenarioDecision.create({
    stageId: stage3._id,
    optionText: 'Inspect the merchant/payment details and verify before proceeding.',
    scoreChange: 20,
    behaviorEffects: { recognition: 1, verification: 2, decisionQuality: 2 },
    identifiedSignals: [],
    outcomeType: 'correct',
    explanation: 'Checked payment credentials to ensure security.'
  });

  stage3.availableDecisionIds = [dec3A._id, dec3B._id, dec3C._id];
  await stage3.save();

  // Stage 4 (Fixture D)
  const stage4 = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 4,
    title: 'Fixture D: Unreviewed Permission',
    description: 'An app asks for camera permissions during standard photo capture.',
    mockInterfaceType: 'browser',
    eventClassification: 'malicious',
    measurementFocus: ['VERIFICATION', 'UNREVIEWED_ACCEPTANCE'],
    targetSignals: ['unusual_permission'],
    terminal: false
  });

  const dec4A = await ScenarioDecision.create({
    stageId: stage4._id,
    optionText: 'Allow immediately.',
    scoreChange: -10,
    behaviorEffects: { verification: 0, unreviewedAcceptance: 2 },
    identifiedSignals: [],
    outcomeType: 'incorrect',
    explanation: 'Allowed permissions blindly.'
  });

  const dec4B = await ScenarioDecision.create({
    stageId: stage4._id,
    optionText: 'Review what permission is being requested and refuse if it is unnecessary.',
    scoreChange: 10,
    behaviorEffects: { verification: 2, unreviewedAcceptance: 0 },
    identifiedSignals: [],
    outcomeType: 'correct',
    explanation: 'Reviewed permission details carefully before allowing.'
  });

  stage4.availableDecisionIds = [dec4A._id, dec4B._id];
  await stage4.save();

  // Stage 5 (Fixture E)
  const stage5 = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 5,
    title: 'Fixture E: Explicit Signal ID',
    description: 'Identify the exact indicators present in a suspicious message.',
    mockInterfaceType: 'sms',
    eventClassification: 'malicious',
    measurementFocus: ['SIGNAL_IDENTIFICATION'],
    targetSignals: ['unexpected_domain', 'urgency'],
    terminal: false
  });

  const dec5A = await ScenarioDecision.create({
    stageId: stage5._id,
    optionText: 'Do not interact with the message.',
    scoreChange: 0,
    behaviorEffects: { signalIdentification: 0 },
    identifiedSignals: [],
    outcomeType: 'neutral',
    explanation: 'Safely ignored but did not identify signals.'
  });

  const dec5B = await ScenarioDecision.create({
    stageId: stage5._id,
    optionText: 'The sender domain does not match the expected organization.',
    scoreChange: 10,
    behaviorEffects: { signalIdentification: 1 },
    identifiedSignals: ['unexpected_domain'],
    outcomeType: 'correct',
    explanation: 'Identified the domain mismatch correctly.'
  });

  const dec5C = await ScenarioDecision.create({
    stageId: stage5._id,
    optionText: 'The sender domain is unexpected and the message is creating urgency.',
    scoreChange: 20,
    behaviorEffects: { signalIdentification: 2 },
    identifiedSignals: ['unexpected_domain', 'urgency'],
    outcomeType: 'correct',
    explanation: 'Identified both domain and urgency factors.'
  });

  stage5.availableDecisionIds = [dec5A._id, dec5B._id, dec5C._id];
  await stage5.save();

  // Stage 6 (Fixture F Branching Start)
  const stage6 = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 6,
    title: 'Fixture F: Account Message Branching',
    description: 'An alert prompts you to confirm your email verification.',
    mockInterfaceType: 'messaging',
    eventClassification: 'malicious',
    measurementFocus: ['DECISION_QUALITY'],
    targetSignals: [],
    terminal: false
  });

  // Create Stage 7A and 7B targets
  const stage7A = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 7,
    title: 'Fixture F: High Outcome Node',
    description: 'Account status verified. Access remains secure.',
    mockInterfaceType: 'account-verification',
    eventClassification: 'legitimate',
    measurementFocus: ['DECISION_QUALITY'],
    terminal: true
  });

  const dec7A = await ScenarioDecision.create({
    stageId: stage7A._id,
    optionText: 'Proceed normally.',
    scoreChange: 10,
    behaviorEffects: { decisionQuality: 2 },
    identifiedSignals: [],
    outcomeType: 'correct',
    explanation: 'Session completed on optimal path.'
  });

  stage7A.availableDecisionIds = [dec7A._id];
  await stage7A.save();

  const stage7B = await ScenarioStage.create({
    scenarioId: scenario._id,
    stageOrder: 8,
    title: 'Fixture F: Low Outcome Node',
    description: 'Security bypass triggered. Session suspended.',
    mockInterfaceType: 'account-verification',
    eventClassification: 'malicious',
    measurementFocus: ['DECISION_QUALITY'],
    terminal: true
  });

  const dec7B = await ScenarioDecision.create({
    stageId: stage7B._id,
    optionText: 'Friction encountered, end process.',
    scoreChange: -10,
    behaviorEffects: { decisionQuality: 0 },
    identifiedSignals: [],
    outcomeType: 'incorrect',
    explanation: 'Session completed on compromised path.'
  });

  stage7B.availableDecisionIds = [dec7B._id];
  await stage7B.save();

  // Connect Stage 6 decisions to 7A and 7B
  const dec6A = await ScenarioDecision.create({
    stageId: stage6._id,
    optionText: 'Verify account message safely.',
    scoreChange: 10,
    behaviorEffects: { decisionQuality: 2 },
    identifiedSignals: [],
    nextStageId: stage7A._id,
    outcomeType: 'correct',
    explanation: 'Chose verification and branched to secure status.'
  });

  const dec6B = await ScenarioDecision.create({
    stageId: stage6._id,
    optionText: 'Continue immediately without checks.',
    scoreChange: -10,
    behaviorEffects: { decisionQuality: 0 },
    identifiedSignals: [],
    nextStageId: stage7B._id,
    outcomeType: 'incorrect',
    explanation: 'Skipped checks and branched to compromised status.'
  });

  stage6.availableDecisionIds = [dec6A._id, dec6B._id];
  await stage6.save();

  // Connect decisions to point nextStageId links sequentially:
  // Stage 1 Decisions point to Stage 2
  dec1A.nextStageId = stage2._id; await dec1A.save();
  dec1B.nextStageId = stage2._id; await dec1B.save();
  dec1C.nextStageId = stage2._id; await dec1C.save();

  // Stage 2 Decisions point to Stage 3
  dec2A.nextStageId = stage3._id; await dec2A.save();
  dec2B.nextStageId = stage3._id; await dec2B.save();
  dec2C.nextStageId = stage3._id; await dec2C.save();

  // Stage 3 Decisions point to Stage 4
  dec3A.nextStageId = stage4._id; await dec3A.save();
  dec3B.nextStageId = stage4._id; await dec3B.save();
  dec3C.nextStageId = stage4._id; await dec3C.save();

  // Stage 4 Decisions point to Stage 5
  dec4A.nextStageId = stage5._id; await dec4A.save();
  dec4B.nextStageId = stage5._id; await dec4B.save();

  // Stage 5 Decisions point to Stage 6
  dec5A.nextStageId = stage6._id; await dec5A.save();
  dec5B.nextStageId = stage6._id; await dec5B.save();
  dec5C.nextStageId = stage6._id; await dec5C.save();

  console.log('[Seed Fixture] Deterministic scenario created successfully!');
  
  if (disconnect) {
    await mongoose.disconnect();
    console.log('[Seed Fixture] Database connection closed.');
  }
}

if (require.main === module) {
  seed(true).catch(err => {
    console.error('Seeding crashed:', err);
    process.exit(1);
  });
}

module.exports = seed;
