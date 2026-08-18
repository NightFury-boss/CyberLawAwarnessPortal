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
    default: 50 // starts at 50, modified by choices
  },
  categoryScores: {
    type: Map,
    of: Number,
    default: {} // tracks accumulated scores per category
  },
  criticalMistakes: [
    {
      type: String // Explanations of critical mistakes made
    }
  ],
  falsePositiveCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true // sessions expire to prevent infinite resume pools
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AssessmentSession', AssessmentSessionSchema);
