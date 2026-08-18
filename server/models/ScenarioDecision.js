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
    default: {} // e.g. { "Phishing awareness": -10 }
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
    default: null // null indicates completion block in a branch
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
    enum: ['correct', 'incorrect', 'false-positive', 'unsafe-action', 'safe-action', 'neutral'],
    default: 'neutral'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScenarioDecision', ScenarioDecisionSchema);
