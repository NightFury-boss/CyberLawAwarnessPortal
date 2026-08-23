const mongoose = require('mongoose');

const ScenarioDecisionSchema = new mongoose.Schema({
  stageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScenarioStage',
    required: true
  },
  optionText: {
    type: String,
    required: true
  },
  scoreChange: {
    type: Number,
    default: 0
  },
  categoryScoreWeights: {
    type: Map,
    of: Number,
    default: {}
  },
  identifiedSignals: [
    {
      type: String
    }
  ],
  behaviorEffects: {
    recognition: { type: Number, min: 0, max: 2, default: 0 },
    signalIdentification: { type: Number, min: 0, max: 2, default: 0 },
    verification: { type: Number, min: 0, max: 2, default: 0 },
    decisionQuality: { type: Number, min: 0, max: 2, default: 0 },
    falsePositive: { type: Number, min: 0, max: 2, default: 0 },
    unreviewedAcceptance: { type: Number, min: 0, max: 2, default: 0 }
  },
  riskLevel: {
    type: String,
    enum: ['safe', 'low-risk', 'medium-risk', 'high-risk', 'critical'],
    default: 'safe'
  },
  isCriticalMistake: {
    type: Boolean,
    default: false
  },
  nextStageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScenarioStage',
    default: null
  },
  explanation: {
    type: String,
    required: true
  },
  feedback: {
    type: String
  },
  outcomeType: {
    type: String,
    enum: ['correct', 'incorrect', 'false-positive', 'unsafe-action', 'neutral'],
    default: 'neutral'
  }
}, {
  timestamps: true
});

ScenarioDecisionSchema.index({ stageId: 1 });

module.exports = mongoose.model('ScenarioDecision', ScenarioDecisionSchema);
