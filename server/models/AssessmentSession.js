const mongoose = require('mongoose');

const AssessmentSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true
  },
  scenarioVersion: {
    type: Number,
    default: 1
  },
  scenarioCode: {
    type: String,
    required: true,
    enum: ['baseline', 'final', 'practice']
  },
  status: {
    type: String,
    enum: ['started', 'in-progress', 'completed', 'abandoned'],
    default: 'started'
  },
  currentStageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScenarioStage',
    required: true
  },
  score: {
    type: Number,
    default: 50
  },
  categoryScores: {
    type: Map,
    of: Number,
    default: {}
  },
  behaviourScores: {
    type: Map,
    of: Number,
    default: {
      recognition: 100,
      signalIdentification: 100,
      verification: 100,
      decisionQuality: 100,
      falsePositive: 100,
      unreviewedAcceptance: 100
    }
  },
  unreviewedAcceptanceCount: {
    type: Number,
    default: 0
  },
  falsePositiveCount: {
    type: Number,
    default: 0
  },
  stagesCompleted: {
    type: Number,
    default: 0
  },
  criticalMistakes: [
    {
      type: String
    }
  ],
  startedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

AssessmentSessionSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('AssessmentSession', AssessmentSessionSchema);
