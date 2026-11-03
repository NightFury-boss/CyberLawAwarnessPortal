const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

const scenariosPath = path.join(__dirname, 'scenarios.json');
const rawScenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));

// Signal Probes Definitions for the 5 Universal Stages
const SIGNAL_PROBES = {
  stage2: [
    {
      optionText: 'The tracking URL uses an unauthorized lookalike domain rather than the official postal/courier portal.',
      isCorrect: true,
      explanation: 'Official couriers and postal services host tracking exclusively on their verified .gov.in or registered company root domains.',
      identifiedSignal: 'unexpected_domain'
    },
    {
      optionText: 'The delivery failure notification was dispatched after standard working hours.',
      isCorrect: false,
      explanation: 'Automated delivery dispatch notifications are generated 24/7; delivery time is not a reliable forensic indicator.',
      identifiedSignal: 'unusual_contact_method'
    },
    {
      optionText: 'The consignment tracking number contains an odd number of numeric digits.',
      isCorrect: false,
      explanation: 'Tracking number formats vary widely across logistics providers and do not indicate fraud by digit count.',
      identifiedSignal: 'unexpected_data_request'
    },
    {
      optionText: 'I did not identify a specific technical anomaly in this notification.',
      isCorrect: false,
      explanation: 'Admitting cue absence is honest but reflects missed signal identification.',
      identifiedSignal: ''
    }
  ],
  stage3: [
    {
      optionText: 'The recruiter demands an upfront refundable security deposit/registration fee before assigning work.',
      isCorrect: true,
      explanation: 'Legitimate employers and platforms never require job applicants to pay registration, training, or deposit fees.',
      identifiedSignal: 'unexpected_payment_request'
    },
    {
      optionText: 'The message contains casual emoji in the opening greeting.',
      isCorrect: false,
      explanation: 'Tone and informal language are subjective and do not constitute definitive forensic proof of cyber fraud.',
      identifiedSignal: 'unusual_contact_method'
    },
    {
      optionText: 'The outreach was sent through an instant messaging channel rather than email.',
      isCorrect: false,
      explanation: 'Many legitimate recruiters initiate first contact on messaging platforms; the fee demand is the decisive indicator.',
      identifiedSignal: 'unusual_contact_method'
    },
    {
      optionText: 'I did not identify a specific technical anomaly in this offer.',
      isCorrect: false,
      explanation: 'Admitting cue absence is honest but reflects missed signal identification.',
      identifiedSignal: ''
    }
  ],
  stage10: [
    {
      optionText: 'The beneficiary/merchant name displayed on the payment review screen does not match the store name.',
      isCorrect: true,
      explanation: 'Physical QR sticker overlays route funds to an unauthorized private VPA; verifying the terminal payee name reveals the fraud.',
      identifiedSignal: 'mismatched_branding'
    },
    {
      optionText: 'The QR code image has a green outer frame instead of a blue brand frame.',
      isCorrect: false,
      explanation: 'QR styling, colors, and border frames are cosmetic and customizable by merchants.',
      identifiedSignal: 'mismatched_branding'
    },
    {
      optionText: 'The UPI application took more than 3 seconds to launch the camera scanner.',
      isCorrect: false,
      explanation: 'App load latency is a device performance factor, not a security signal.',
      identifiedSignal: 'unexpected_data_request'
    },
    {
      optionText: 'I did not identify a specific technical anomaly on the payment interface.',
      isCorrect: false,
      explanation: 'Admitting cue absence is honest but reflects missed signal identification.',
      identifiedSignal: ''
    }
  ],
  stage11: [
    {
      optionText: 'The sender email address uses an unverified third-party domain rather than the official institutional portal.',
      isCorrect: true,
      explanation: 'Phishing lures impersonate tax and subscription authorities but cannot send from verified institutional root domains.',
      identifiedSignal: 'unexpected_domain'
    },
    {
      optionText: 'The notification was marked with normal rather than high priority.',
      isCorrect: false,
      explanation: 'Email priority flags are arbitrary metadata easily manipulated by any sender.',
      identifiedSignal: 'unrequested_account_action'
    },
    {
      optionText: 'The message body does not address the recipient by full legal surname.',
      isCorrect: false,
      explanation: 'Many legitimate automated mailers use partial names or generic greetings.',
      identifiedSignal: 'unusual_contact_method'
    },
    {
      optionText: 'I did not identify a specific technical anomaly in this email.',
      isCorrect: false,
      explanation: 'Admitting cue absence is honest but reflects missed signal identification.',
      identifiedSignal: ''
    }
  ],
  stage12: [
    {
      optionText: 'The sender requests an urgent fund transfer to an unknown private VPA while evading direct voice confirmation.',
      isCorrect: true,
      explanation: 'Emergency distress impersonation relies on urgency to bypass voice verification and redirects funds to disposable VPAs.',
      identifiedSignal: 'unusual_contact_method'
    },
    {
      optionText: 'The emergency distress message was sent from a mobile number without a profile avatar.',
      isCorrect: false,
      explanation: 'Avatar presence is an optional privacy setting, not a reliable threat indicator.',
      identifiedSignal: 'unusual_contact_method'
    },
    {
      optionText: 'The requested amount is rounded to an exact ten thousand rupees.',
      isCorrect: false,
      explanation: 'Rounded amounts are common in both genuine emergencies and scams; evasive contact is the forensic cue.',
      identifiedSignal: 'unexpected_payment_request'
    },
    {
      optionText: 'I did not identify a specific technical anomaly in this communication.',
      isCorrect: false,
      explanation: 'Admitting cue absence is honest but reflects missed signal identification.',
      identifiedSignal: ''
    }
  ]
};

function calibrateScenarioStages(scenarioData) {
  for (const stg of scenarioData.stages) {
    const order = stg.stageOrder;

    // Reset measurement focus and signal probes according to Phase 4.3 Architecture
    if (order === 1) {
      // Stage 1: Morning Banking Statement (Benign)
      stg.measurementFocus = ['FALSE_POSITIVE_CONTROL'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        d.behaviorEffects = {
          recognition: 0,
          signalIdentification: 0,
          verification: 0,
          decisionQuality: 0,
          falsePositive: d.outcomeType === 'false-positive' || d.optionText.includes('block') || d.optionText.includes('spam') ? 2 : (d.optionText.includes('Archive') ? 1 : 0),
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 2) {
      // Stage 2: Courier Phishing SMS (Malicious)
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION'];
      stg.hasSignalProbe = true;
      stg.signalProbes = SIGNAL_PROBES.stage2;
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('genuine') || d.optionText.includes('official');
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (d.optionText.includes('Reply') ? 1 : 0),
          signalIdentification: 0, // Scored independently by probe
          verification: isOpt ? 2 : (d.optionText.includes('Reply') ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 3) {
      // Stage 3: Freelance / Internship (Malicious)
      stg.measurementFocus = ['THREAT_RECOGNITION', 'UNREVIEWED_ACCEPTANCE'];
      stg.hasSignalProbe = true;
      stg.signalProbes = SIGNAL_PROBES.stage3;
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('Decline') || d.optionText.includes('Recognize');
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (d.optionText.includes('Inquire') || d.optionText.includes('Ask') ? 1 : 0),
          signalIdentification: 0,
          verification: 0,
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: isOpt ? 0 : (d.optionText.includes('Inquire') ? 1 : 2)
        };
      });
    } else if (order === 4) {
      // Stage 4: UPI Cashback Collect / Electricity Threat (Malicious)
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION', 'UNREVIEWED_ACCEPTANCE'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('Decline') || d.optionText.includes('Log into');
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (d.optionText.includes('Forward') ? 1 : 0),
          signalIdentification: 0,
          verification: isOpt ? 2 : 0,
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: isOpt ? 0 : 2
        };
      });
    } else if (order === 5) {
      // Stage 5: LMS Password Expiry (Baseline) / Browser Sign-In (Final) (Legitimate / Benign)
      // Genuine DQ Encounter #1 + UA Encounter #5 (in Final) + FP
      const isFinal = scenarioData.scenario.slug === 'final';
      stg.measurementFocus = isFinal
        ? ['DECISION_QUALITY', 'FALSE_POSITIVE_CONTROL', 'UNREVIEWED_ACCEPTANCE']
        : ['DECISION_QUALITY', 'FALSE_POSITIVE_CONTROL'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.outcomeType === 'correct' || d.optionText.includes('Schedule') || d.optionText.includes('Review') || d.optionText.includes('Acknowledge');
        d.behaviorEffects = {
          recognition: 0,
          signalIdentification: 0,
          verification: 0,
          decisionQuality: isOpt ? 2 : (d.optionText.includes('Dismiss') || d.optionText.includes('wait') ? 1 : 0),
          falsePositive: d.outcomeType === 'false-positive' || d.optionText.includes('Panic') || d.optionText.includes('refuse') ? 2 : (d.optionText.includes('Dismiss') || d.optionText.includes('wait') ? 1 : 0),
          unreviewedAcceptance: isFinal && d.optionText.includes('Approve') ? 2 : 0
        };
      });
    } else if (order === 6) {
      // Stage 6: Permissions Prompt (Malicious APK / Scanner)
      // Genuine UA Encounter #2 + VB
      stg.measurementFocus = ['VERIFICATION', 'UNREVIEWED_ACCEPTANCE'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('Review requested') || d.optionText.includes('Immediately deny');
        d.behaviorEffects = {
          recognition: 0,
          signalIdentification: 0,
          verification: isOpt ? 2 : (d.optionText.includes('Deny accessibility') ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: isOpt ? 0 : (d.optionText.includes('Deny accessibility') ? 1 : 2)
        };
      });
    } else if (order === 7) {
      // Stage 7: Law Enforcement / Telecom Threat Call (Branch Point)
      // Full Threat Lifecycle Early Termination = +4 TR, +2 VB
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('Hang up immediately') || d.optionText.includes('check connection status');
        d.behaviorEffects = {
          recognition: isOpt ? 4 : (d.optionText.includes('Stay on the call') || d.optionText.includes('ignore') || d.optionText.includes('written notice') ? 2 : 0),
          signalIdentification: 0,
          verification: isOpt ? 2 : (d.optionText.includes('Stay on the call') ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 8) {
      // Stage 8: Official Bank KYC / Order Dispatched (Legitimate) - Path 1
      stg.measurementFocus = ['VERIFICATION', 'FALSE_POSITIVE_CONTROL'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('official') || d.optionText.includes('netbanking') || d.optionText.includes('Review order status') || d.optionText.includes('Read the email calmly');
        d.behaviorEffects = {
          recognition: 0,
          signalIdentification: 0,
          verification: isOpt ? 2 : 0,
          decisionQuality: 0,
          falsePositive: d.outcomeType === 'false-positive' || d.optionText.includes('phishing') || d.optionText.includes('Assume this email') || d.optionText.includes('Report dispatch') ? 2 : (d.optionText.includes('Archive') ? 1 : 0),
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 9) {
      // Stage 9: Digital Arrest Extortion (Malicious) - Path 2
      // Late Crisis Recovery = +2 TR, +2 VB
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('Disconnect') || d.optionText.includes('Break out of panic');
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (d.optionText.includes('Ask') ? 1 : 0),
          signalIdentification: 0,
          verification: isOpt ? 2 : (d.optionText.includes('written notice') ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 10) {
      // Stage 10: Counter QR Sticker Overlay (Malicious)
      // Genuine UA Encounter #3 + TR + VB + SI Probe
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION', 'UNREVIEWED_ACCEPTANCE'];
      stg.hasSignalProbe = true;
      stg.signalProbes = SIGNAL_PROBES.stage10;
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.optionText.includes('Notice') || d.optionText.includes('payee name mismatch');
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (d.optionText.includes('Ask the cashier') || d.optionText.includes('Pay with cash') ? 1 : 0),
          signalIdentification: 0,
          verification: isOpt ? 2 : (d.optionText.includes('Ask the cashier') ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: isOpt ? 0 : 2
        };
      });
    } else if (order === 11) {
      // Stage 11: Income Tax / Streaming Phishing (Malicious)
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION'];
      stg.hasSignalProbe = true;
      stg.signalProbes = SIGNAL_PROBES.stage11;
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.outcomeType === 'correct' || d.optionText.includes('Recognize') || d.optionText.includes('Spot fake');
        const isPartial = d.optionText.includes('Delete') || d.optionText.includes('Archive') || d.riskLevel === 'low-risk';
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (isPartial ? 1 : 0),
          signalIdentification: 0,
          verification: isOpt ? 2 : (isPartial ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 12) {
      // Stage 12: Emergency Distress Request (Ambiguous)
      stg.measurementFocus = ['THREAT_RECOGNITION', 'VERIFICATION'];
      stg.hasSignalProbe = true;
      stg.signalProbes = SIGNAL_PROBES.stage12;
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.outcomeType === 'correct' || d.optionText.includes('independent') || d.optionText.includes('call your') || d.optionText.includes('Contact friend') || d.optionText.includes('Do not transfer');
        const isPartial = d.optionText.includes('Request') || d.optionText.includes('Decline') || d.riskLevel === 'medium-risk' || d.riskLevel === 'low-risk';
        d.behaviorEffects = {
          recognition: isOpt ? 2 : (isPartial && !d.optionText.includes('Send') && !d.optionText.includes('Transfer') ? 1 : 0),
          signalIdentification: 0,
          verification: isOpt ? 2 : (isPartial && !d.optionText.includes('Send') && !d.optionText.includes('Transfer') ? 1 : 0),
          decisionQuality: 0,
          falsePositive: 0,
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 13) {
      // Stage 13: Official OS Critical Patch (Legitimate)
      // Genuine DQ Encounter #2 + FP
      stg.measurementFocus = ['DECISION_QUALITY', 'FALSE_POSITIVE_CONTROL'];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
      stg.decisions.forEach(d => {
        const isOpt = d.isCorrectOrOptimal || d.outcomeType === 'correct' || d.optionText.includes('Save') || d.optionText.includes('backup') || d.optionText.includes('Schedule or install') || d.optionText.includes('Approve');
        d.behaviorEffects = {
          recognition: 0,
          signalIdentification: 0,
          verification: 0,
          decisionQuality: isOpt ? 2 : (d.optionText.includes('Postpone the update for 24 hours') ? 1 : 0),
          falsePositive: d.outcomeType === 'false-positive' || d.optionText.includes('Reject') || d.optionText.includes('Block') ? 2 : (d.optionText.includes('Postpone') ? 1 : 0),
          unreviewedAcceptance: 0
        };
      });
    } else if (order === 14) {
      stg.measurementFocus = [];
      stg.hasSignalProbe = false;
      stg.signalProbes = [];
    }
  }
}

async function runCalibration() {
  console.log('Calibrating Scenario 2 (Baseline v2)...');
  calibrateScenarioStages(rawScenarios[2]);

  console.log('Calibrating Scenario 3 (Final v2)...');
  calibrateScenarioStages(rawScenarios[3]);

  fs.writeFileSync(scenariosPath, JSON.stringify(rawScenarios, null, 2), 'utf8');
  console.log('Successfully saved calibrated scenarios.json!');

  // Connect to DB and sync calibrated stages to MongoDB Atlas
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    console.log('Connecting to MongoDB to upsert calibrated stages...');
    await mongoose.connect(MONGODB_URI, { family: 4 });

    const baselineScenario = await Scenario.findOne({ slug: 'baseline', version: 2 });
    const finalScenario = await Scenario.findOne({ slug: 'final', version: 2 });

    async function syncScenarioStagesToDB(scenarioDoc, scenarioData) {
      if (!scenarioDoc) return;
      for (const stg of scenarioData.stages) {
        const stageDoc = await ScenarioStage.findOneAndUpdate(
          { scenarioId: scenarioDoc._id, stageOrder: stg.stageOrder },
          {
            $set: {
              measurementFocus: stg.measurementFocus,
              hasSignalProbe: Boolean(stg.hasSignalProbe),
              signalProbes: stg.signalProbes || []
            }
          },
          { new: true }
        );

        if (stageDoc && stg.decisions) {
          for (const dec of stg.decisions) {
            await ScenarioDecision.findOneAndUpdate(
              { stageId: stageDoc._id, optionText: dec.optionText },
              {
                $set: {
                  behaviorEffects: dec.behaviorEffects
                }
              }
            );
          }
        }
      }
    }

    if (baselineScenario) {
      await syncScenarioStagesToDB(baselineScenario, rawScenarios[2]);
      console.log('Baseline v2 stages successfully updated in MongoDB Atlas.');
    }
    if (finalScenario) {
      await syncScenarioStagesToDB(finalScenario, rawScenarios[3]);
      console.log('Final v2 stages successfully updated in MongoDB Atlas.');
    }

    await mongoose.disconnect();
    console.log('MongoDB sync completed.');
  }
}

runCalibration().catch(err => {
  console.error('Calibration error:', err);
  process.exit(1);
});
